// Application: world lifecycle, main loop, rendering, settings, desktop bridge.
(function () {
  'use strict';
  const DS = window.DS;
  const { U, M } = DS;

  const DEFAULTS = {
    biome: 'grasslands', scale: 4, dayMinutes: 12, autoCycle: 0, showStats: false, showHud: true, showMenu: true,
    idleDelay: 5, fps: 60, stripHeight: 0.3, edgePan: true,
  };
  const KEY = 'pixel-terrarium.settings';
  // how much bigger the world is than the screen (the rest is reached by panning)
  const WORLD_X = 1.7, WORLD_Y = 1.3;
  const EDGE = 36; // px from the window edge that starts edge panning

  // light types: radius, colour, how much darkness they cut (m) and colour glow strength (g)
  const LIGHTS = {
    1: { r: 7, c: [255, 150, 50], m: 1, g: 0.8 }, 2: { r: 6, c: [255, 90, 20], m: 1, g: 0.8 },
    3: { r: 5, c: [120, 255, 60], m: 0.8, g: 0.5 }, 4: { r: 4, c: [255, 210, 120], m: 0.6, g: 0.25 },
    5: { r: 15, c: [255, 230, 160], m: 0.75, g: 0.22 }, 6: { r: 11, c: [255, 245, 200], m: 0.8, g: 0.4 },
    7: { r: 5, c: [240, 150, 255], m: 0.7, g: 0.5 }, 8: { r: 5, c: [220, 255, 110], m: 0.8, g: 0.7 },
    9: { r: 9, c: [255, 200, 120], m: 1, g: 0.9 },
  };

  function glowCanvas(r, c, a) {
    const s = r * 2 + 1;
    const cv = document.createElement('canvas');
    cv.width = cv.height = s;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(r + 0.5, r + 0.5, 0, r + 0.5, r + 0.5, r + 0.5);
    g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${a})`);
    g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    return cv;
  }

  const App = {
    init() {
      this.settings = Object.assign({}, DEFAULTS);
      try { Object.assign(this.settings, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* ignore */ }
      this.canvas = document.getElementById('screen');
      this.ctx = this.canvas.getContext('2d');
      this.scene = document.createElement('canvas');
      this.sctx = this.scene.getContext('2d');
      this.cells = document.createElement('canvas');
      this.cctx = this.cells.getContext('2d');
      this.light = document.createElement('canvas');
      this.lctx = this.light.getContext('2d');
      this.masks = {};
      this.glows = {};
      for (const k in LIGHTS) {
        this.masks[k] = glowCanvas(LIGHTS[k].r, [255, 255, 255], LIGHTS[k].m);
        this.glows[k] = glowCanvas(LIGHTS[k].r, LIGHTS[k].c, LIGHTS[k].g);
      }
      this.time = 0.3;
      this.speed = 1;
      this.daylight = 1;
      this.tempOffset = 0;
      this.tempOffsetT = 0;
      this.meteors = [];
      this.frame = 0;
      this.lastInput = performance.now();
      this.cycleT = 0;
      this.desk = { mode: 'window', alwaysOnTop: false, openAtLogin: false };
      this.cam = { z: 1, x: 0, y: 0 };
      this.follow = null;
      this.flare = false;
      this.events = new DS.Events(this);
      this.god = new DS.God(this);
      this.applyBodyClasses();
      this.loadBiome(this.settings.biome);
      window.addEventListener('resize', () => {
        clearTimeout(this.resizeT);
        this.resizeT = setTimeout(() => this.onResize(), 400);
      });
      this.setupDesktop();
      this.menu = new DS.Menu(this);
      this.solar = new DS.Solar(this);
      if (this.settings.showMenu !== false) this.menu.open('main');
      else this.hasGame = true;
      this.acc = 0;
      this.prev = performance.now();
      requestAnimationFrame((t) => this.loop(t));
    },

    // ------------------------------------------------------------ settings
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.settings)); } catch (e) { /* ignore */ } },
    setSetting(k, v) {
      this.settings[k] = v;
      this.save();
      if (k === 'scale') { if (this.mode === 'sandbox') this.loadBiome(this.biome.id); else this.loadWorld(this.worldOpts); }
      this.applyBodyClasses();
      if (k === 'dayMinutes' && v === -1) this.syncClock();
    },
    applyBodyClasses() {
      document.getElementById('stats').classList.toggle('hidden', !this.settings.showStats);
      document.getElementById('hud').style.display = this.settings.showHud ? '' : 'none';
    },
    toggleUI() { document.body.classList.toggle('hide-ui'); },
    poke() {
      this.lastInput = performance.now();
      if (document.body.classList.contains('idle')) document.body.classList.remove('idle');
    },

    // ------------------------------------------------------------ world lifecycle
    // shared world setup; returns { W, eco, rng }
    makeWorld(w, h, biome, seed, keepCiv) {
      if (this.events && this.world) this.events.clear();
      if (this.civ && !keepCiv) { this.civ.clear(); this.civ = null; }
      if (!keepCiv) { this.planet = 'earth'; this.planets = {}; document.body.classList.remove('off-world'); }
      this.scale = this.settings.scale;
      const W = new DS.World(w, h);
      W.baseTemp = biome.temp;
      W.temp = biome.temp;
      W.setWater(biome.water[0], biome.water[1]);
      W.seedKinds = biome.seeds || [['tree', 1]];
      W.tuftKinds = biome.tufts || ['tuft'];
      W.leafFall = biome.leafFall != null ? biome.leafFall : 0.00002;
      W.fertility = biome.fertility != null ? biome.fertility : 1;
      W.lapse = biome.lapse || 0;
      W.waterSeeds = biome.waterSeeds || [['seaweed', 3], ['coral', 1]];
      W.ventRate = biome.ventRate || 0.002;
      W.shadeDepth = !biome.noShade;
      W.current = biome.current || 0;
      const fx = new DS.FX(W);
      W.fx = fx;
      const eco = new DS.Ecosystem(W, fx);
      eco.scale = U.clamp(w / 320, 0.6, 3);
      eco.cap = Math.round(450 * Math.min(eco.scale, 2.2));
      const weather = new DS.Weather(W, eco, fx);
      eco.weather = weather;
      this.world = W;
      this.fx = fx;
      this.eco = eco;
      this.weather = weather;
      this.meteors = [];
      this.tempOffset = 0;
      this.tempOffsetT = 0;
      this.biome = biome;
      this.updateClock(0);
      eco.daylight = this.daylight;
      return { W, eco, rng: U.rng(seed == null ? (Math.random() * 1e9) | 0 : seed) };
    },

    finishWorld(rng) {
      const W = this.world;
      W.frame++;
      this.bg = new DS.Background(W, this.biome, rng);
      this.weather.setBiome(this.biome);
      for (let i = 0; i < 40; i++) W.step();
      this.scene.width = this.cells.width = this.light.width = W.w;
      this.scene.height = this.cells.height = this.light.height = W.h;
      this.img = this.cctx.createImageData(W.w, W.h);
      this.buf = new Uint32Array(this.img.data.buffer);
      this.sizeCanvas();
      this.cycleT = 0;
      this.eventT = 0;
      this.follow = null;
      this.cam = { z: this.cam ? this.cam.z : 1, x: W.w / 2, y: W.h / 2 };
      this.clampCam();
      if (this.god) { this.god.refresh(); this.updateHud(); }
      document.body.classList.toggle('mode-world', this.mode !== 'sandbox');
      document.body.classList.toggle('mode-colony', this.mode === 'colony');
    },

    measureScreen() {
      const scale = this.settings.scale;
      this.screenW = Math.max(80, Math.ceil(window.innerWidth / scale));
      this.screenH = Math.max(50, Math.ceil(window.innerHeight / scale));
    },

    loadBiome(id, seed) {
      const biome = DS.BiomeMap[id] || DS.Biomes[0];
      this.mode = 'sandbox';
      this.settings.biome = biome.id;
      this.save();
      document.getElementById('biome').value = biome.id;
      this.measureScreen();
      // the world is bigger than the screen: the camera scrolls over it
      const w = Math.ceil(this.screenW * WORLD_X), h = Math.ceil(this.screenH * WORLD_Y);
      const { W, eco, rng } = this.makeWorld(w, h, biome, seed);
      W.activeRanges = null;
      biome.gen(W, rng, eco);
      eco.populate(biome.fauna || []);
      this.finishWorld(rng);
    },

    // World mode (and the base for Colony mode): many biomes in one big world
    loadWorld(opts = {}) {
      this.mode = opts.colony ? 'colony' : 'world';
      this.worldOpts = opts;
      this.measureScreen();
      const sizes = { small: 3, medium: 5, large: 8, huge: 12 };
      const w = Math.ceil(this.screenW * (sizes[opts.size] || 5)), h = Math.ceil(this.screenH * 2.2);
      const { W, eco, rng } = this.makeWorld(w, h, DS.BiomeMap.grasslands, opts.seed);
      W.activeRanges = [];
      eco.cap = Math.round(Math.min(380, 120 + w * 0.15));
      DS.WorldGen.build(W, eco, rng, opts);
      // start the camera somewhere on land near the middle
      let sx = Math.round(w / 2);
      for (let k = 0; k < 40; k++) { const x = Math.round(w * (0.3 + rng() * 0.4)); if (!W.isLiquid(x, W.groundY(x))) { sx = x; break; } }
      this.biome = W.zones[W.zoneIdx[sx]].biome;
      this.finishWorld(rng);
      this.cam.x = sx;
      this.cam.y = W.groundY(sx) - this.screenH * 0.2;
      this.clampCam();
      if (opts.colony && DS.Civ) {
        this.civ = new DS.Civ(this, opts);
        this.civ.start(rng);
      }
      document.getElementById('biome').value = '__world';
    },

    // ------------------------------------------------------------ planets (Colony mode)
    saveSlot() {
      return { world: this.world, fx: this.fx, eco: this.eco, weather: this.weather, bg: this.bg, biome: this.biome, meteors: this.meteors, cam: Object.assign({}, this.cam) };
    },

    loadSlot(s) {
      Object.assign(this, { world: s.world, fx: s.fx, eco: s.eco, weather: s.weather, bg: s.bg, biome: s.biome, meteors: s.meteors });
      this.attachWorld();
      this.cam = Object.assign({}, s.cam);
      this.clampCam();
    },

    attachWorld() {
      const W = this.world;
      this.scene.width = this.cells.width = this.light.width = W.w;
      this.scene.height = this.cells.height = this.light.height = W.h;
      this.img = this.cctx.createImageData(W.w, W.h);
      this.buf = new Uint32Array(this.img.data.buffer);
      this.bg.key = '';
      this.follow = null;
      this.tempOffset = 0;
      this.tempOffsetT = 0;
    },

    // generate a world for a body of the solar system (keeps the civilisation)
    genPlanet(id) {
      const biome = DS.Space.PLANETS[id];
      this.measureScreen();
      const w = Math.ceil(this.screenW * 3.2), h = Math.ceil(this.screenH * 1.6);
      const seed = ((this.worldOpts && this.worldOpts.seed) || 1) * 31 + id.length * 977 + id.charCodeAt(0);
      const { W, eco, rng } = this.makeWorld(w, h, biome, seed, true);
      W.activeRanges = [];
      eco.cap = Math.round(Math.min(300, 100 + w * 0.15));
      biome.gen(W, rng, eco);
      eco.populate(biome.fauna || []);
      W.frame++;
      this.bg = new DS.Background(W, biome, rng);
      this.weather.setBiome(biome);
      for (let i = 0; i < 40; i++) W.step();
      this.attachWorld();
      this.cam = { z: this.cam ? this.cam.z : 1, x: W.w / 2, y: W.groundY(Math.round(W.w / 2)) - this.screenH * 0.3 };
      this.clampCam();
      if (this.civ) this.civ.arrive(id, rng);
    },

    // travel to another body; generates it the first time
    goPlanet(id, quiet) {
      if (id === this.planet || this.mode !== 'colony') return;
      this.events.clear();
      this.planets[this.planet] = this.saveSlot();
      this.planet = id;
      if (this.planets[id]) this.loadSlot(this.planets[id]);
      else this.genPlanet(id);
      const name = id === 'earth' ? 'Earth' : DS.Space.BY[id].name;
      document.body.classList.toggle('off-world', id !== 'earth');
      if (this.god) { this.god.refresh(); this.updateHud(); }
      if (!quiet) this.toast(`${id === 'earth' ? '🌍' : DS.Space.BY[id].icon} ${name}`);
    },

    // run fn with another planet loaded, then come back (used when a ship lands far away)
    withPlanet(id, fn) {
      const back = this.planet;
      if (back === id) return fn();
      const cam = Object.assign({}, this.cam);
      this.goPlanet(id, true);
      try { fn(); } finally { this.goPlanet(back, true); this.cam = cam; this.clampCam(); }
    },

    sizeCanvas() {
      const s = this.scale;
      this.canvas.width = this.screenW * s;
      this.canvas.height = this.screenH * s;
      this.canvas.style.width = this.screenW * s + 'px';
      this.canvas.style.height = this.screenH * s + 'px';
      this.ctx.imageSmoothingEnabled = false;
    },

    nextBiome(d) {
      const list = DS.Biomes;
      const i = list.findIndex((b) => b.id === this.biome.id);
      this.loadBiome(list[(i + d + list.length) % list.length].id);
    },

    onResize() {
      const sw = Math.ceil(window.innerWidth / this.scale), sh = Math.ceil(window.innerHeight / this.scale);
      if (sw === this.screenW && sh === this.screenH) return;
      // only rebuild the world if the new screen no longer fits comfortably inside it
      if (this.mode === 'sandbox' && (sw * 1.1 > this.world.w || sh > this.world.h || sw < this.world.w / (WORLD_X * 1.6))) { this.loadBiome(this.biome.id); return; }
      this.screenW = sw;
      this.screenH = sh;
      this.sizeCanvas();
      this.clampCam();
    },

    setSpeed(v) { this.speed = v; },
    setTime(t) {
      if (this.settings.dayMinutes === -1) this.setSetting('dayMinutes', 12);
      this.time = ((t % 1) + 1) % 1;
      this.updateClock(0);
    },
    syncClock() {
      const d = new Date();
      this.time = (d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()) / 86400;
    },
    setWeather(type) {
      if (type === 'auto') { this.weather.auto = true; this.weather.timer = 1; return; }
      this.weather.set(type);
    },

    // ------------------------------------------------------------ powers
    addMeteor(tx, ty) {
      const W = this.world;
      const sx = tx + (Math.random() < 0.5 ? -1 : 1) * U.rand(30, 60);
      const sy = -5;
      const d = Math.hypot(tx - sx, ty - sy);
      this.meteors.push({ x: sx, y: sy, vx: ((tx - sx) / d) * 2.2, vy: ((ty - sy) / d) * 2.2, r: U.randInt(5, 8) });
      if (W) W.quake = Math.max(W.quake, 0);
    },

    quake() {
      const W = this.world;
      W.quake = 300;
      this.weather.shake = 240;
      for (let k = 0; k < W.w; k++) {
        const x = U.randInt(0, W.w - 1);
        for (let y = 0; y < W.h - 1; y++) {
          const t = W.get(x, y);
          if (t === M.STONE || t === M.SANDSTONE || t === M.CONCRETE || t === M.BRICK || t === M.FACADE || t === M.SIDING || t === M.ICE) {
            if (Math.random() < (t === M.FACADE || t === M.SIDING ? 0.08 : 0.03)) W.set(x, y, M.RUBBLE);
          }
        }
      }
      for (const c of this.eco.list) {
        if (c.sp.hab === 'water' || c.sp.ant) continue;
        c.setGoal('flee');
        c.tx = U.clamp(c.x + U.rand(-50, 50), 2, W.w - 3);
        c.perched = false;
      }
    },

    updateMeteors() {
      const W = this.world;
      for (let i = this.meteors.length - 1; i >= 0; i--) {
        const m = this.meteors[i];
        m.x += m.vx;
        m.y += m.vy;
        this.fx.add(m.x + U.rand(-0.5, 0.5), m.y + U.rand(-0.5, 0.5), -m.vx * 0.1, -m.vy * 0.1, U.pick(['#ffd040', '#ff7a1a', '#ff3a10', '#8a8a8a']), 20, -0.01);
        const rx = Math.round(m.x), ry = Math.round(m.y);
        const t = W.get(rx, ry);
        const hit = ry >= W.h - 2 || (ry >= 0 && t !== M.EMPTY && DS.MP.kind[t] !== DS.KIND.gas) || (ry > 0 && this.eco.at(m.x, m.y, 2));
        if (hit) {
          W.explode(rx, ry, m.r, this.fx);
          for (let k = 0; k < 14; k++) this.fx.debris(rx, ry - 2, U.rand(-2, 2), U.rand(-3, -1), Math.random() < 0.4 ? M.LAVA : M.RUBBLE);
          this.fx.burst(rx, ry, ['#ffffff', '#ffd040', '#ff7a1a', '#ff3a10'], 50, 2.5, 0.06, 35);
          this.eco.killNear(rx, ry, m.r + 3, 'burn');
          this.weather.shake = 30;
          this.weather.flash = Math.max(this.weather.flash, 0.6);
          this.meteors.splice(i, 1);
        }
      }
    },

    // ------------------------------------------------------------ loop
    updateClock(dtFrames) {
      const dm = this.settings.dayMinutes;
      if (dm === -1) this.syncClock();
      else if (dm > 0) this.time = (this.time + dtFrames / (dm * 60 * 60)) % 1;
      const sunH = Math.sin(Math.PI * 2 * (this.time - 0.25));
      this.daylight = U.smoothstep(-0.18, 0.22, sunH);
    },

    tick() {
      const W = this.world, eco = this.eco;
      this.updateClock(1);
      if (this.tempOffsetT > 0) { this.tempOffsetT--; if (this.tempOffsetT < 600) this.tempOffset *= 0.995; } else this.tempOffset = 0;
      const wt = this.weather.type;
      const wAdj = (wt === 'rain' || wt === 'storm' ? -2 : wt === 'snow' ? -5 : 0) * this.weather.intensity;
      const delta = (this.daylight - 0.5) * 8 + wAdj + this.tempOffset + this.events.tempOffset();
      if (W.zones) {
        // the biome under the camera sets the sky, the weather and the HUD
        const cx = U.clamp(Math.round(this.cam.x), 0, W.w - 1);
        const zb = W.zones[W.zoneIdx[cx]].biome;
        if (zb !== this.biome) { this.biome = zb; this.bg.biome = zb; this.weather.probs = zb.weather || { clear: 1 }; if (this.god.tab === 'life') this.god.refresh(); }
        W.tempDelta = delta;
        W.temp = W.colTemp[cx] + delta;
        const v = this.view();
        const ranges = [[v.x - 90, v.x + v.w + 90]];
        if (this.civ) for (const c of this.civ.colonies) ranges.push([c.x - 120, c.x + 120]);
        W.activeRanges = ranges;
        this.weather.spawnRange = [v.x - 40, v.x + v.w + 40];
      } else {
        W.temp = this.biome.temp + delta;
        if (W.activeRanges) {
          // big off-world maps: only simulate what is in view and around towns at full rate
          const v = this.view();
          const ranges = [[v.x - 90, v.x + v.w + 90]];
          if (this.civ) for (const c of this.civ.colonies) if (c.planet === this.planet) ranges.push([c.x - 120, c.x + 120]);
          W.activeRanges = ranges;
          this.weather.spawnRange = [v.x - 40, v.x + v.w + 40];
        }
      }
      W.daylight = this.daylight;
      eco.daylight = this.daylight;
      eco.flare = this.flare;
      this.weather.update(this.daylight);
      this.events.update();
      if (this.biome.marineSnow && Math.random() < 0.6) this.fx.add(this.cam.x + U.rand(-0.6, 0.6) * this.screenW, U.rand(W.h * 0.15, W.h * 0.3), U.rand(-0.05, 0.05), U.rand(0.05, 0.12), 'rgba(220,230,240,0.7)', 900, 0);
      W.step();
      eco.update();
      if (this.civ) this.civ.update();
      this.fx.update();
      this.updateMeteors();
      this.god.update();
      this.randomEvents();
    },

    // World & Colony modes: disasters happen on their own (as configured)
    randomEvents() {
      const o = this.worldOpts;
      if (this.mode === 'sandbox' || !o || !o.eventEvery) return;
      this.eventT = (this.eventT || 0) + 1;
      if (this.eventT < o.eventEvery * 3600) return;
      this.eventT = U.rand(-0.3, 0.3) * o.eventEvery * 3600;
      const list = Object.keys(DS.Events.DEFS).filter((id) => !o.events || o.events.has(id));
      if (!list.length) return;
      const v = this.view();
      const id = U.pick(list);
      this.events.start(id, v.x + U.rand(0.2, 0.8) * v.w, v.y + v.h * 0.4);
    },

    loop(now) {
      requestAnimationFrame((t) => this.loop(t));
      const dt = Math.min(250, now - this.prev);
      if (this.settings.fps === 30 && dt < 30) return;
      this.prev = now;
      this.frame++;
      if (this.speed > 0) {
        this.acc += dt * this.speed;
        let n = 0;
        while (this.acc >= 1000 / 60 && n < 4 * this.speed) {
          this.tick();
          this.acc -= 1000 / 60;
          n++;
        }
        if (n >= 4 * this.speed) this.acc = 0;
      } else {
        this.god.update();
      }
      if (this.menuOpen) {
        // slowly pan across the landscape behind the menu
        this.menuDir = this.menuDir || 1;
        this.cam.x += 0.12 * this.menuDir;
        const before = this.cam.x;
        this.clampCam();
        if (this.cam.x !== before) this.menuDir = -this.menuDir;
      } else this.edgePan();
      this.render();
      // idle handling
      const idleDelay = this.settings.idleDelay;
      if (idleDelay > 0 && !this.menuOpen && !this.god.down && !this.god.tab && now - this.lastInput > idleDelay * 1000) document.body.classList.add('idle');
      if (this.settings.autoCycle > 0 && this.speed > 0 && this.mode === 'sandbox' && !this.menuOpen) {
        this.cycleT += dt;
        if (this.cycleT > this.settings.autoCycle * 60000 && now - this.lastInput > 30000) {
          const others = DS.Biomes.filter((b) => b.id !== this.biome.id);
          this.loadBiome(U.pick(others).id);
        }
      }
      if (this.frame % 15 === 0) this.updateHud();
    },

    render() {
      const W = this.world, sctx = this.sctx;
      const daylight = this.daylight;
      const storm = (this.weather.type === 'storm' || this.weather.type === 'rain' || this.weather.type === 'ashfall') ? this.weather.intensity * 0.18 : 0;
      let dark = U.clamp((1 - daylight) * 0.6 + storm, 0, 0.72);
      dark *= 1 - Math.min(1, this.weather.flash);
      sctx.globalCompositeOperation = 'source-over';
      const vv = this.view();
      // only the part of the world in view is composited
      const rx0 = Math.max(0, Math.floor(vv.x) - 2), rx1 = Math.min(W.w, Math.ceil(vv.x + vv.w) + 2), ry1 = Math.min(W.h, Math.ceil(vv.y + vv.h) + 2);
      const ry0 = Math.max(0, Math.floor(vv.y) - 2), rw = rx1 - rx0, rh = ry1 - ry0;
      this.weather.vrect = [rx0, ry0, rw, rh];
      sctx.drawImage(this.bg.render(this.time, daylight, this.weather, vv), rx0, ry0, rw, rh, rx0, ry0, rw, rh);
      this.bg.drawDynamic(sctx, this.time, daylight, this.frame, this.flare);
      this.weather.drawClouds(sctx, daylight, this.bg.skyBottom || [200, 220, 240]);
      W.render(this.buf, this.flare ? 0 : dark, rx0, rx1, ry1);
      this.cctx.putImageData(this.img, 0, 0, rx0, ry0, rw, rh);
      sctx.drawImage(this.cells, rx0, ry0, rw, rh, rx0, ry0, rw, rh);
      const lights = W.lights;
      const abyssZones = W.zones ? W.zones.filter((z) => z.biome.abyss) : this.biome.abyss ? [{ x0: 0, x1: W.w, biome: this.biome }] : [];
      const abyss = abyssZones.length > 0;
      this.eco.draw(sctx, lights, this.biome.abyss ? 1 : dark, vv);
      if (this.civ) this.civ.draw(sctx, lights, dark, vv);
      for (const l of this.events.pendingLights || []) lights.push(l);
      this.events.pendingLights = [];
      this.events.drawWorld(sctx);
      for (const m of this.meteors) {
        sctx.fillStyle = '#fff4c0';
        sctx.fillRect(Math.round(m.x) - 1, Math.round(m.y) - 1, 3, 3);
        lights.push(Math.round(m.x), Math.round(m.y), 9);
      }
      this.fx.draw(sctx);
      this.weather.drawFront(sctx, daylight);
      this.events.drawOverlay(sctx);

      if (dark > 0.03 || abyss) {
        const L = this.lctx;
        L.globalCompositeOperation = 'source-over';
        L.clearRect(rx0, ry0, rw, rh);
        L.fillStyle = `rgba(8,12,38,${dark})`;
        L.fillRect(rx0, ry0, rw, rh);
        for (const z of abyssZones) {
          // sunlight fades away with depth
          const y0 = W.zones ? W.h * 0.55 : W.h * z.biome.abyss;
          const g = L.createLinearGradient(0, y0, 0, W.h);
          g.addColorStop(0, 'rgba(2,6,20,0)');
          g.addColorStop(0.5, 'rgba(2,6,20,0.75)');
          g.addColorStop(1, 'rgba(1,2,8,0.95)');
          L.fillStyle = g;
          L.fillRect(z.x0, y0, z.x1 - z.x0, W.h - y0);
          if (this.biome.abyss) dark = Math.max(dark, 0.6);
        }
        L.globalCompositeOperation = 'destination-out';
        for (let i = 0; i < lights.length; i += 3) {
          const k = lights[i + 2], r = LIGHTS[k].r;
          L.drawImage(this.masks[k], lights[i] - r, lights[i + 1] - r);
        }
        sctx.drawImage(this.light, rx0, ry0, rw, rh, rx0, ry0, rw, rh);
        sctx.globalCompositeOperation = 'lighter';
        sctx.globalAlpha = Math.min(1, dark * 1.1);
        for (let i = 0; i < lights.length; i += 3) {
          const k = lights[i + 2], r = LIGHTS[k].r;
          sctx.drawImage(this.glows[k], lights[i] - r, lights[i + 1] - r);
        }
        sctx.globalAlpha = 1;
        sctx.globalCompositeOperation = 'source-over';
      }

      const ctx = this.ctx, s = this.scale;
      let ox = 0, oy = 0;
      const shake = this.weather.shake;
      if (shake > 0) {
        const a = Math.min(3, shake / 20 + 0.5) * s * 0.5;
        ox = Math.round(U.rand(-a, a));
        oy = Math.round(U.rand(-a, a));
      }
      if (this.follow) {
        if (this.follow.dead) this.follow = null;
        else { this.cam.x += (this.follow.x - this.cam.x) * 0.15; this.cam.y += (this.follow.cy - this.cam.y) * 0.15; this.clampCam(); }
      }
      const v = this.view();
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#000';
      if (ox || oy) ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.drawImage(this.scene, v.x, v.y, v.w, v.h, ox, oy, v.w * v.s, v.h * v.s);
      this.god.drawOverlay(ctx, v);
      if (this.civ && this.mode === 'colony') this.civ.drawLabels(ctx, { x: v.x - ox / v.s, y: v.y - oy / v.s, s: v.s });
      this.drawMinimap(ctx);
    },

    // ------------------------------------------------------------ camera
    edgePan() {
      const m = this.mouse;
      if (!m || !this.settings.edgePan || m.overUI || this.god.held || document.body.classList.contains('watch-only')) return;
      const W = window.innerWidth, H = window.innerHeight;
      let dx = 0, dy = 0;
      if (m.x < EDGE) dx = -(1 - m.x / EDGE);
      else if (m.x > W - EDGE) dx = 1 - (W - m.x) / EDGE;
      if (m.y < EDGE) dy = -(1 - m.y / EDGE);
      else if (m.y > H - EDGE) dy = 1 - (H - m.y) / EDGE;
      if (!dx && !dy) return;
      const sp = 2.6 / this.cam.z;
      const before = this.cam.x + ',' + this.cam.y;
      this.panBy(dx * sp, dy * sp * 0.7);
      if (before === this.cam.x + ',' + this.cam.y) this.camT = Math.max(this.camT || 0, 40);
    },
    drawMinimap(ctx) {
      if (!(this.camT > 0)) return;
      this.camT--;
      const W = this.world, v = this.view();
      const mw = 130, mh = Math.round((mw * W.h) / W.w);
      const x0 = 10, y0 = this.canvas.height - mh - 12;
      const a = Math.min(1, this.camT / 30);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(x0 - 2, y0 - 2, mw + 4, mh + 4);
      ctx.drawImage(this.scene, x0, y0, mw, mh);
      ctx.strokeStyle = '#ffcf4a';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x0 + (v.x / W.w) * mw, y0 + (v.y / W.h) * mh, (v.w / W.w) * mw, (v.h / W.h) * mh);
      ctx.restore();
    },
    view() {
      const W = this.world, z = this.cam.z;
      const w = this.screenW / z, h = this.screenH / z;
      return { x: U.clamp(Math.round(this.cam.x - w / 2), 0, Math.max(0, Math.floor(W.w - w))), y: U.clamp(Math.round(this.cam.y - h / 2), 0, Math.max(0, Math.floor(W.h - h))), w, h, s: this.scale * z, z };
    },
    clampCam() {
      const W = this.world, z = this.cam.z;
      const hw = Math.min(W.w / 2, this.screenW / z / 2), hh = Math.min(W.h / 2, this.screenH / z / 2);
      this.cam.x = U.clamp(this.cam.x, hw, W.w - hw);
      this.cam.y = U.clamp(this.cam.y, hh, W.h - hh);
    },
    // zoom keeping the world point under screen position (sx, sy) fixed
    zoomBy(dir, sx = window.innerWidth / 2, sy = window.innerHeight / 2) {
      const levels = [1, 1.5, 2, 3, 4, 6, 8];
      let i = levels.findIndex((l) => l >= this.cam.z - 0.01);
      i = U.clamp(i + dir, 0, levels.length - 1);
      this.setZoom(levels[i], sx, sy);
    },
    setZoom(z, sx = window.innerWidth / 2, sy = window.innerHeight / 2) {
      const v = this.view();
      const wx = v.x + sx / v.s, wy = v.y + sy / v.s;
      this.cam.z = z;
      const s = this.scale * z;
      this.cam.x = wx - sx / s + this.screenW / z / 2;
      this.cam.y = wy - sy / s + this.screenH / z / 2;
      this.clampCam();
      this.updateHud();
    },
    panBy(dx, dy, keepFollow) {
      if (!keepFollow) this.follow = null;
      this.camT = 120;
      this.cam.x += dx;
      this.cam.y += dy;
      this.clampCam();
    },
    toast(text) {
      const t = document.getElementById('toast');
      if (!t) return;
      t.textContent = text;
      t.classList.add('show');
      clearTimeout(this.toastT);
      this.toastT = setTimeout(() => t.classList.remove('show'), 2600);
    },

    updateHud() {
      const h = Math.floor(this.time * 24), m = Math.floor((this.time * 24 * 60) % 60);
      const wIcons = { clear: '☀️', cloudy: '☁️', rain: '🌧️', storm: '⛈️', drylightning: '🌩️', windy: '💨', snow: '🌨️', sandstorm: '🌪️', ashfall: '🌋', fog: '🌫️' };
      let wt = this.weather.type;
      if ((wt === 'rain' || wt === 'storm') && this.world.temp < 0) wt = 'snow';
      const icon = this.daylight < 0.3 && wt === 'clear' ? '🌙' : wIcons[wt];
      document.getElementById('hud-line').textContent =
        `${this.biome.icon} ${this.biome.name} · ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} · ${icon} ${wt} · ${Math.round(this.world.temp)}°C · ${this.eco.list.length} creatures`;
      const badges = [];
      if (this.speed === 0) badges.push('⏸ paused');
      else if (this.speed > 1) badges.push(`⏩ ${this.speed}×`);
      if (this.tempOffsetT > 0) badges.push(this.tempOffset > 0 ? '🔥 heat wave' : '🧊 ice age');
      if (!this.weather.auto) badges.push('weather locked');
      if (this.cam.z > 1) badges.push(`🔍 ${this.cam.z}×`);
      if (this.follow && !this.follow.dead) badges.push(`👁 following ${this.follow.sp.name}`);
      for (const e of this.events.list) badges.push(DS.Events.DEFS[e.type][1] + ' ' + DS.Events.DEFS[e.type][0]);
      document.getElementById('hud-badges').innerHTML = badges.map((b) => `<span>${b}</span>`).join('');
      const ch = document.getElementById('colony-hud');
      const col = this.mode === 'colony' && this.civ && this.civ.local;
      if (col) {
        const C = DS.Civ, era = C.ERAS[col.era], r = col.research && C.TECHS[col.research];
        // the basics, plus whatever the current research and next building are waiting for
        const keys = new Set(['food', 'wood', 'stone']);
        for (const cost of [r && r.cost, col.wanted && C.BUILDINGS[col.wanted].cost]) for (const k in cost || {}) keys.add(k);
        if (col.offworld && DS.Space.PLANETS[col.planet]) for (const k of DS.Space.PLANETS[col.planet].res) keys.add(k);
        for (const [k] of C.RES) if (keys.size < 8 && col.res[k] >= 1) keys.add(k);
        const res = C.RES.filter(([k]) => keys.has(k)).map(([k, i]) => `<span title="${k}">${i} ${Math.floor(col.res[k])}</span>`).join('');
        ch.innerHTML = col.alive
          ? `<span class="era">${era.icon} ${col.name} · ${era.name}</span><span>👥 ${col.pop}/${col.housing}</span><span>🛡️ ${col.soldiers}</span>${res}<span>🔬 ${r ? `${r.name} ${Math.min(100, Math.floor((col.knowledge / r.k) * 100))}%` : `💡 ${Math.floor(col.knowledge)}`}</span>`
          : `<span class="era">💀 ${col.name} has fallen</span>`;
      }
      if (this.settings.showStats) {
        const counts = Object.entries(this.eco.count).sort((a, b) => b[1] - a[1]);
        let html = `<b>Population</b><br>`;
        html += counts.map(([id, n]) => `${DS.Species[id].name}<span class="n">${n}</span>`).join('<br>');
        for (const col of this.eco.colonies) html += `<br><b>Ant colony</b><br>workers<span class="n">${col.workers}</span><br>food<span class="n">${Math.floor(col.food)}</span>`;
        document.getElementById('stats').innerHTML = html;
      }
    },

    // ------------------------------------------------------------ desktop (Electron)
    setupDesktop() {
      const d = window.desktop;
      if (!d) return;
      document.body.classList.add('is-desktop');
      d.setBiomes(DS.Biomes.map((b) => ({ id: b.id, name: b.name, icon: b.icon })));
      const applyState = (s) => {
        Object.assign(this.desk, s);
        document.body.classList.toggle('watch-only', !!s.clickThrough);
        this.god.refresh();
      };
      d.getState().then((s) => {
        applyState(s);
        // running as a wallpaper or desktop strip: skip the menu and just play
        if (s.mode !== 'window' && this.menuOpen) { this.menu.close(); this.loadBiome(this.settings.biome); this.hasGame = true; }
      });
      d.onCommand((cmd) => {
        switch (cmd.type) {
          case 'biome': this.loadBiome(cmd.id); break;
          case 'weather': this.setWeather(cmd.id); break;
          case 'event': this.events.start(cmd.id); break;
          case 'time': this.setTime(cmd.value); break;
          case 'pause': this.setSpeed(this.speed === 0 ? 1 : 0); break;
          case 'toggle-ui': this.toggleUI(); break;
          case 'state': applyState(cmd.state); break;
        }
      });
    },
  };

  DS.App = App;
  window.addEventListener('DOMContentLoaded', () => App.init());
})();
