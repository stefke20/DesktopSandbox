// Application: world lifecycle, main loop, rendering, settings, desktop bridge.
(function () {
  'use strict';
  const DS = window.DS;
  const { U, M } = DS;

  const DEFAULTS = {
    biome: 'grasslands', scale: 4, dayMinutes: 12, autoCycle: 0, showStats: false, showHud: true,
    idleDelay: 5, fps: 60, stripHeight: 0.3,
  };
  const KEY = 'pixel-terrarium.settings';

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
      this.acc = 0;
      this.prev = performance.now();
      requestAnimationFrame((t) => this.loop(t));
    },

    // ------------------------------------------------------------ settings
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.settings)); } catch (e) { /* ignore */ } },
    setSetting(k, v) {
      this.settings[k] = v;
      this.save();
      if (k === 'scale') this.loadBiome(this.biome.id);
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
    loadBiome(id, seed) {
      if (this.events && this.world) this.events.clear();
      const biome = DS.BiomeMap[id] || DS.Biomes[0];
      this.biome = biome;
      this.settings.biome = biome.id;
      this.save();
      document.getElementById('biome').value = biome.id;
      const scale = this.settings.scale;
      this.scale = scale;
      const w = Math.max(80, Math.ceil(window.innerWidth / scale));
      const h = Math.max(50, Math.ceil(window.innerHeight / scale));
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
      const fx = new DS.FX(W);
      const eco = new DS.Ecosystem(W, fx);
      const weather = new DS.Weather(W, eco, fx);
      eco.weather = weather;
      this.world = W;
      this.fx = fx;
      this.eco = eco;
      this.weather = weather;
      this.meteors = [];
      this.tempOffset = 0;
      this.tempOffsetT = 0;
      const rng = U.rng(seed == null ? (Math.random() * 1e9) | 0 : seed);
      biome.gen(W, rng, eco);
      W.frame++;
      this.bg = new DS.Background(W, biome, rng);
      weather.setBiome(biome);
      this.updateClock(0);
      eco.daylight = this.daylight;
      eco.populate(biome.fauna || []);
      for (let i = 0; i < 40; i++) W.step();
      this.scene.width = this.cells.width = this.light.width = w;
      this.scene.height = this.cells.height = this.light.height = h;
      this.img = this.cctx.createImageData(w, h);
      this.buf = new Uint32Array(this.img.data.buffer);
      this.canvas.width = w * scale;
      this.canvas.height = h * scale;
      this.canvas.style.width = w * scale + 'px';
      this.canvas.style.height = h * scale + 'px';
      this.ctx.imageSmoothingEnabled = false;
      this.cycleT = 0;
      this.follow = null;
      this.cam = { z: this.cam ? this.cam.z : 1, x: w / 2, y: h / 2 };
      this.clampCam();
      if (this.god) { this.god.refresh(); this.updateHud(); }
    },

    nextBiome(d) {
      const list = DS.Biomes;
      const i = list.findIndex((b) => b.id === this.biome.id);
      this.loadBiome(list[(i + d + list.length) % list.length].id);
    },

    onResize() {
      const w = Math.ceil(window.innerWidth / this.scale), h = Math.ceil(window.innerHeight / this.scale);
      if (Math.abs(w - this.world.w) > 2 || Math.abs(h - this.world.h) > 2) this.loadBiome(this.biome.id);
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
      W.temp = this.biome.temp + (this.daylight - 0.5) * 8 + wAdj + this.tempOffset + this.events.tempOffset();
      W.daylight = this.daylight;
      eco.daylight = this.daylight;
      eco.flare = this.flare;
      this.weather.update(this.daylight);
      this.events.update();
      W.step();
      eco.update();
      this.fx.update();
      this.updateMeteors();
      this.god.update();
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
      this.render();
      // idle handling
      const idleDelay = this.settings.idleDelay;
      if (idleDelay > 0 && !this.god.down && !this.god.tab && now - this.lastInput > idleDelay * 1000) document.body.classList.add('idle');
      if (this.settings.autoCycle > 0 && this.speed > 0) {
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
      sctx.drawImage(this.bg.render(this.time, daylight, this.weather), 0, 0);
      this.bg.drawDynamic(sctx, this.time, daylight, this.frame, this.flare);
      this.weather.drawClouds(sctx, daylight, this.bg.skyBottom || [200, 220, 240]);
      W.render(this.buf, this.flare ? 0 : dark);
      this.cctx.putImageData(this.img, 0, 0);
      sctx.drawImage(this.cells, 0, 0);
      const lights = W.lights;
      this.eco.draw(sctx, lights, dark);
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

      if (dark > 0.03) {
        const L = this.lctx;
        L.globalCompositeOperation = 'source-over';
        L.clearRect(0, 0, W.w, W.h);
        L.fillStyle = `rgba(8,12,38,${dark})`;
        L.fillRect(0, 0, W.w, W.h);
        L.globalCompositeOperation = 'destination-out';
        for (let i = 0; i < lights.length; i += 3) {
          const k = lights[i + 2], r = LIGHTS[k].r;
          L.drawImage(this.masks[k], lights[i] - r, lights[i + 1] - r);
        }
        sctx.drawImage(this.light, 0, 0);
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
    },

    // ------------------------------------------------------------ camera
    view() {
      const W = this.world, z = this.cam.z;
      const w = W.w / z, h = W.h / z;
      return { x: U.clamp(Math.round(this.cam.x - w / 2), 0, Math.max(0, Math.floor(W.w - w))), y: U.clamp(Math.round(this.cam.y - h / 2), 0, Math.max(0, Math.floor(W.h - h))), w, h, s: this.scale * z, z };
    },
    clampCam() {
      const W = this.world, z = this.cam.z;
      const hw = W.w / z / 2, hh = W.h / z / 2;
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
      this.cam.x = wx - sx / s + this.world.w / z / 2;
      this.cam.y = wy - sy / s + this.world.h / z / 2;
      this.clampCam();
      this.updateHud();
    },
    panBy(dx, dy) {
      this.follow = null;
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
      d.getState().then(applyState);
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
