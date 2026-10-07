// Special events triggered from the god bar.
(function () {
  'use strict';
  const DS = window.DS;
  const { U, M, MP } = DS;

  const UFO = [
    '.....ggg.....',
    '....gwwwg....',
    '..mmmmmmmmm..',
    'mmlmmlmmlmmlm',
    '..mmmmmmmmm..',
  ];
  const UFO_PAL = { g: '#9ae8ff', w: '#e8fbff', m: '#9aa4b4', l: '#ffe860' };
  let ufoImg = null;
  function ufoSprite() {
    if (ufoImg) return ufoImg;
    const c = document.createElement('canvas');
    c.width = UFO[0].length;
    c.height = UFO.length;
    const x = c.getContext('2d');
    UFO.forEach((row, y) => [...row].forEach((ch, i) => { if (UFO_PAL[ch]) { x.fillStyle = UFO_PAL[ch]; x.fillRect(i, y, 1, 1); } }));
    ufoImg = c;
    return c;
  }

  // name, icon, positional?, duration (s), description
  const DEFS = {
    volcano: ['Volcano eruption', '🌋', true, 35],
    abduction: ['Alien abduction', '🛸', true, 22],
    tornado: ['Tornado', '🌪️', true, 28],
    blackhole: ['Black hole', '🕳️', true, 16],
    radiation: ['Radiation storm', '☢️', false, 40],
    hurricane: ['Hurricane', '🌀', false, 50],
    solarflare: ['Solar flare', '☀️', false, 22],
    drought: ['Drought', '🏜️', false, 100],
    monsoon: ['Monsoon', '🌧️', false, 90],
  };

  class Events {
    constructor(app) {
      this.app = app;
      this.list = [];
    }
    get W() { return this.app.world; }
    light(x, y, k) {
      if (!this.pendingLights) this.pendingLights = [];
      if (this.pendingLights.length < 300) this.pendingLights.push(x, y, k);
    }
    active(type) { return this.list.some((e) => e.type === type); }
    clear() {
      for (const e of this.list) this.finish(e);
      this.list = [];
    }

    start(type, x, y) {
      const d = DEFS[type];
      if (!d) return;
      const W = this.W;
      // global events don't stack: restart instead
      if (!d[2]) this.list = this.list.filter((e) => { if (e.type === type) { this.finish(e); return false; } return true; });
      const e = { type, t: 0, dur: d[3] * 60, x: U.clamp(x == null ? this.app.cam.x + U.rand(-0.3, 0.3) * this.app.view().w : x, 4, W.w - 5), y: y == null ? this.app.view().y + this.app.view().h * 0.4 : y };
      this.init(e);
      this.list.push(e);
      this.app.toast(`${d[1]} ${d[0]}!`);
    }

    init(e) {
      const app = this.app, W = this.W, weather = app.weather;
      switch (e.type) {
        case 'volcano': {
          const x = Math.round(e.x);
          const g = W.floorY(x);
          const peak = Math.max(Math.round(W.h * 0.22), g - Math.round(W.h * 0.35));
          // reuse an existing high crater if one is right here
          if (g > peak + 6) DS.Terrain.mountain(W, x, peak, { mat: M.BASALT, cone: true, half: Math.round((g - peak) * 1.3) });
          e.cx = x;
          e.cy = W.floorY(x) - 1;
          e.prevWeather = [weather.type, weather.auto];
          break;
        }
        case 'abduction':
          e.ux = e.x < W.w / 2 ? -20 : W.w + 20;
          e.uy = Math.max(6, Math.round(W.h * 0.12));
          e.phase = 'arrive';
          e.caught = [];
          break;
        case 'tornado':
          e.vx = U.rand(-0.35, 0.35) || 0.2;
          e.spin = 0;
          weather.cloudCover = Math.max(weather.cloudCover, 0.85);
          break;
        case 'blackhole':
          e.y = U.clamp(e.y, 6, W.h - 6);
          e.r = 1;
          break;
        case 'hurricane':
          weather.set('storm');
          weather.targetWind = (Math.random() < 0.5 ? -1 : 1) * 4;
          weather.boost = 2;
          e.dir = Math.sign(weather.targetWind);
          break;
        case 'monsoon':
          weather.set('rain');
          weather.targetIntensity = 1;
          weather.boost = 2.6;
          weather.targetWind = U.rand(-1, 1);
          W.fertility *= 2;
          break;
        case 'drought':
          weather.set('clear');
          W.drought = 1;
          e.fert = W.fertility;
          W.fertility *= 0.2;
          break;
        case 'solarflare':
          app.flare = true;
          break;
        case 'radiation':
          break;
      }
    }

    finish(e) {
      const app = this.app, W = this.W, weather = app.weather;
      switch (e.type) {
        case 'volcano': if (e.prevWeather) { weather.auto = true; weather.timer = 60 * 20; } break;
        case 'abduction': for (const c of e.caught) if (!c.dead) c.held = false; break;
        case 'hurricane': weather.boost = 1; weather.targetWind = U.rand(-0.5, 0.5); weather.auto = true; weather.timer = 60 * 30; break;
        case 'monsoon': weather.boost = 1; W.fertility /= 2; weather.auto = true; weather.timer = 60 * 30; break;
        case 'drought': W.drought = 0; W.fertility = e.fert || 1; weather.auto = true; weather.timer = 60 * 30; break;
        case 'solarflare': app.flare = false; break;
      }
    }

    // temperature contribution of running events
    tempOffset() {
      let t = 0;
      for (const e of this.list) {
        if (e.type === 'drought') t += 12;
        if (e.type === 'solarflare') t += 30 * Math.sin(Math.PI * Math.min(1, e.t / e.dur));
        if (e.type === 'monsoon') t -= 3;
        if (e.type === 'hurricane') t -= 4;
      }
      return t;
    }

    update() {
      for (let i = this.list.length - 1; i >= 0; i--) {
        const e = this.list[i];
        e.t++;
        this[e.type](e);
        if (e.t >= e.dur || e.done) { this.finish(e); this.list.splice(i, 1); }
      }
    }

    // -------------------------------------------------------- event bodies
    volcano(e) {
      const app = this.app, W = this.W, fx = app.fx;
      const x = e.cx;
      let cy = W.floorY(x);
      // keep the crater open
      if (cy < e.cy - 2) { for (let dx = -1; dx <= 1; dx++) W.set(x + dx, cy, M.LAVA); }
      cy = Math.min(cy, e.cy);
      if (e.t < 150) {
        app.weather.shake = Math.max(app.weather.shake, 6);
        W.quake = Math.max(W.quake, 10);
        if (e.t % 4 === 0) W.set(x + U.randInt(-1, 1), cy - 1, M.SMOKE);
        return;
      }
      if (e.t === 150) { app.weather.set('ashfall', true); app.weather.auto = false; app.weather.flash = 0.4; app.weather.shake = 40; }
      const power = e.t < e.dur * 0.6 ? 1 : 1 - (e.t - e.dur * 0.6) / (e.dur * 0.4);
      if (Math.random() < 0.9 * power) {
        for (let k = 0; k < 3; k++) fx.debris(x + U.rand(-1.5, 1.5), cy - 2, U.rand(-1.6, 1.6), -U.rand(1.8, 4.2) * (0.6 + power * 0.4), Math.random() < 0.8 ? M.LAVA : M.BASALT);
      }
      if (Math.random() < 0.5 * power) for (let dx = -1; dx <= 1; dx++) if (W.get(x + dx, cy - 1) === M.EMPTY) W.set(x + dx, cy - 1, M.LAVA);
      for (let k = 0; k < 3; k++) fx.add(x + U.rand(-2, 2), cy - 3, U.rand(-0.3, 0.3) + W.wind * 0.1, -U.rand(0.3, 1), U.pick(['#3a3430', '#4a4440', '#2a2624', '#6a5a50']), 120, -0.004);
      if (e.t % 3 === 0 && W.get(x, cy - 4) === M.EMPTY) W.set(x + U.randInt(-2, 2), cy - 4, M.SMOKE);
      if (e.t % 90 === 0) app.weather.shake = Math.max(app.weather.shake, 15);
      this.light(x, cy - 1, 9);
    }

    abduction(e) {
      const app = this.app, W = this.W, eco = app.eco, fx = app.fx;
      const speed = 0.9;
      if (e.phase === 'arrive') {
        e.ux += Math.sign(e.x - e.ux) * speed;
        if (Math.abs(e.ux - e.x) < 1) { e.phase = 'beam'; e.beamT = 0; }
      } else if (e.phase === 'beam') {
        e.beamT++;
        e.ux = e.x + Math.sin(e.beamT * 0.02) * 6;
        const bx = e.ux;
        for (const c of eco.list) {
          if (c.dead || c.held && !c.abducted) continue;
          if (Math.abs(c.x - bx) < 3 + (c.y - e.uy) * 0.12 && c.y > e.uy && !c.sp.queen) {
            if (!c.abducted) { c.abducted = true; c.held = true; c.perched = false; e.caught.push(c); }
            c.x += (bx - c.x) * 0.05;
            c.y -= 0.35;
            if (c.y < e.uy + 4) { c.die(eco, 'abduct', true); fx.burst(c.x, c.y, ['#9ae8ff', '#ffffff'], 6, 0.5, 0, 20); }
          }
        }
        // a few loose things float up too
        if (e.beamT % 5 === 0) {
          const gx = Math.round(bx + U.rand(-3, 3)), gy = W.groundY(gx);
          const t = W.get(gx, gy - 1);
          if (MP.veg[t] && t !== M.WOOD && t !== M.SIDING && t !== M.FACADE) { W.set(gx, gy - 1, M.EMPTY); fx.add(gx, gy - 1, 0, -0.4, MP.colorsHex[t][0], 80, 0); }
        }
        if (e.beamT > 60 * 11) {
          e.phase = 'leave';
          if (Math.random() < 0.5) {
            const gx = Math.round(e.ux), gy = W.groundY(gx);
            if (!W.isLiquid(gx, gy)) for (let k = 0; k < U.randInt(1, 3); k++) eco.spawn('alien', gx + k * 3, gy - 1);
          }
          // crop circle
          const cx = Math.round(e.ux);
          for (let dx = -8; dx <= 8; dx++) {
            const gx = cx + dx, gy = W.floorY(gx);
            if (Math.abs(dx) > 5 || Math.abs(dx) < 3) { const t = W.get(gx, gy - 1); if (t === M.TALLGRASS || t === M.PLANT || t === M.FLOWER) W.set(gx, gy - 1, M.EMPTY); }
          }
        }
      } else {
        e.uy -= 0.6;
        e.ux += 0.3;
        if (e.uy < -10) e.done = true;
      }
      if (e.phase === 'beam') for (let y = e.uy + 5; y < W.groundY(Math.round(e.ux)); y += 6) this.light(Math.round(e.ux), Math.round(y), 8);
      this.light(Math.round(e.ux), Math.round(e.uy) + 2, 6);
    }

    tornado(e) {
      const app = this.app, W = this.W, eco = app.eco, fx = app.fx;
      e.spin += 0.25;
      if (Math.random() < 0.01) e.vx = U.clamp(e.vx + U.rand(-0.25, 0.25), -0.5, 0.5);
      e.x += e.vx;
      if (e.x < 6 || e.x > W.w - 7) e.vx = -e.vx;
      const fade = Math.min(1, e.t / 120, (e.dur - e.t) / 120);
      e.fade = fade;
      const gx = Math.round(e.x);
      const gy = W.groundY(gx);
      e.gy = gy;
      const R = Math.round(3 + 4 * fade);
      for (let k = 0; k < 10 * fade; k++) {
        const x = gx + U.randInt(-R, R), y = gy + U.randInt(-R * 2, 1);
        const t = W.get(x, y);
        if (t === M.EMPTY || t === M.BEDROCK) continue;
        const hard = t === M.STONE || t === M.BASALT || t === M.CONCRETE || t === M.BRICK || t === M.METAL || t === M.SANDSTONE || t === M.ICE || t === M.ASPHALT;
        if (hard || (t === M.SOIL && Math.random() < 0.7)) continue;
        W.set(x, y, M.EMPTY);
        const dir = x < e.x ? 1 : -1;
        fx.debris(x, y - 1, dir * U.rand(0.5, 1.6) + e.vx * 2, -U.rand(2, 4), t === M.GRASS ? M.DIRT : t === M.SOIL ? M.DIRT : t);
      }
      for (const c of eco.list) {
        if (c.dead || c.held || c.sp.hab === 'water' || c.sp.hab === 'burrow') continue;
        if (Math.abs(c.x - e.x) < R + 2 && c.y > gy - 30 && c.y <= gy + 1 && Math.random() < 0.08 * fade) {
          c.thrown = true; c.throwT = 0; c.perched = false;
          c.vx = (Math.random() < 0.5 ? -1 : 1) * U.rand(1, 2.6);
          c.vy = -U.rand(2.5, 4);
        }
      }
      app.weather.shake = Math.max(app.weather.shake, 2);
    }

    blackhole(e) {
      const app = this.app, W = this.W, eco = app.eco, fx = app.fx;
      const life = e.t / e.dur;
      e.r = life < 0.8 ? 1.5 + 6 * (life / 0.8) : 7.5 * (1 - (life - 0.8) / 0.2) + 0.5;
      const core = e.r, reach = e.r * 3.2;
      const cx = e.x, cy = e.y;
      for (let k = 0; k < 120; k++) {
        const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * reach;
        const x = Math.round(cx + Math.cos(a) * d), y = Math.round(cy + Math.sin(a) * d);
        const t = W.get(x, y);
        if (t === M.EMPTY || t === M.BEDROCK || !W.inb(x, y)) continue;
        if (d < core + 0.5) {
          W.set(x, y, M.EMPTY);
          fx.add(x, y, (cx - x) * 0.1, (cy - y) * 0.1, MP.colorsHex[t][0], 8, 0);
          continue;
        }
        const nx = x + Math.sign(Math.round(cx) - x), ny = y + Math.sign(Math.round(cy) - y);
        if (W.get(nx, ny) === M.EMPTY && Math.random() < 0.8) {
          W.set(nx, ny, t, W.life[y * W.w + x], W.shade[y * W.w + x]);
          W.set(x, y, M.EMPTY);
        }
      }
      for (const c of eco.list) {
        if (c.dead) continue;
        const dx = cx - c.x, dy = cy - c.cy, d = Math.hypot(dx, dy);
        if (d < reach * 1.6) {
          c.held = true;
          c.bh = e;
          c.x += (dx / d) * Math.min(d, 0.6 + 6 / (d + 1));
          c.y += (dy / d) * Math.min(d, 0.6 + 6 / (d + 1));
          if (d < core + 1.5) { c.die(eco, 'void', true); fx.burst(c.x, c.cy, ['#b07aff', '#ffffff'], 5, 0.4, 0, 12); }
        } else if (c.bh === e) { c.held = false; c.bh = null; }
      }
      // swallow particles and rain too
      for (const p of fx.p) {
        const dx = cx - p.x, dy = cy - p.y, d2 = dx * dx + dy * dy;
        if (d2 < reach * reach * 4) { p.vx += dx * 0.02; p.vy += dy * 0.02 - p.grav; if (d2 < core * core) p.life = 0; }
      }
      app.weather.shake = Math.max(app.weather.shake, 1);
      if (e.t === e.dur - 1) {
        app.weather.flash = 1;
        fx.burst(cx, cy, ['#ffffff', '#b07aff', '#80c0ff'], 60, 2.5, 0, 40);
        for (const c of eco.list) if (c.bh === e) { c.held = false; c.bh = null; }
      }
    }

    radiation(e) {
      const app = this.app, W = this.W, eco = app.eco, fx = app.fx;
      const fade = Math.min(1, e.t / 180, (e.dur - e.t) / 180);
      e.fade = fade;
      for (let k = 0; k < 4 * fade; k++) fx.add(U.rand(0, W.w), U.rand(-5, 0), U.rand(-0.2, 0.2) + W.wind * 0.2, U.rand(0.3, 0.8), U.pick(['#9aff4a', '#c8ff6a', '#6aff3a']), 240, 0.002);
      if (e.t % 25 === 0 && eco.list.length) {
        const c = U.pick(eco.list);
        if (!c.dead && c.sp.hab !== 'vehicle') {
          const r = Math.random();
          if (r < 0.65) mutate(c);
          else if (r < 0.8 && c.sp.metab) c.die(eco, 'toxic');
          else if (c.sp.breed && eco.list.length < eco.cap) { const b = eco.birth(c); if (b) mutate(b); }
        }
      }
      if (e.t % 6 === 0) {
        const x = U.randInt(1, W.w - 2), y = W.groundY(x) - 1;
        const t = W.get(x, y + 1);
        if (t === M.GRASS) W.set(x, y + 1, M.DRYGRASS);
        else if (MP.veg[t] && MP.edible[t] && Math.random() < 0.3) W.set(x, y + 1, M.FUNGUS);
      }
      for (let k = 0; k < 6; k++) this.light(U.randInt(0, W.w), U.randInt(0, W.h), 3);
    }

    hurricane(e) {
      const app = this.app, W = this.W, eco = app.eco, fx = app.fx;
      const fade = Math.min(1, e.t / 300, (e.dur - e.t) / 300);
      e.fade = fade;
      app.weather.targetWind = e.dir * 4.5 * fade + e.dir * 0.3;
      app.weather.shake = Math.max(app.weather.shake, Math.round(2 * fade));
      // shred vegetation and blow loose things away
      for (let k = 0; k < 8 * fade; k++) {
        const x = U.randInt(1, W.w - 2), y = U.randInt(2, W.h - 2);
        const t = W.get(x, y);
        if (t === M.LEAF || t === M.AUTUMN || t === M.BLOSSOM || t === M.NEEDLE || t === M.LITTER || t === M.TALLGRASS || t === M.FLOWER || t === M.SNOW || t === M.SAND && Math.random() < 0.2) {
          if (W.get(x, y - 1) !== M.EMPTY && W.get(x + e.dir, y) !== M.EMPTY) continue;
          W.set(x, y, M.EMPTY);
          fx.debris(x, y, e.dir * U.rand(1.5, 3.5), -U.rand(0.2, 1.2), t === M.LEAF || t === M.AUTUMN || t === M.BLOSSOM || t === M.NEEDLE ? M.LITTER : t);
        }
      }
      // storm surge: the sea piles up on the downwind side
      if (e.t % 8 === 0) {
        for (let k = 0; k < 3; k++) {
          const x = e.dir > 0 ? U.randInt(Math.floor(W.w * 0.6), W.w - 2) : U.randInt(1, Math.floor(W.w * 0.4));
          const gy = W.groundY(x);
          if (W.get(x, gy) === M.WATER && W.get(x, gy - 1) === M.EMPTY && Math.random() < 0.5 * fade) W.set(x, gy - 1, M.WATER);
        }
      }
      for (const c of eco.list) {
        if (c.dead || c.held || c.sp.hab === 'water' || c.sp.hab === 'burrow') continue;
        if (c.sp.hab === 'air' && !c.perched) c.x = U.clamp(c.x + e.dir * 0.4 * fade, 1, W.w - 2);
        else if (Math.random() < 0.0015 * fade && c.sp.w < 8) { c.thrown = true; c.throwT = 0; c.vx = e.dir * U.rand(1.5, 3); c.vy = -U.rand(1, 2.5); }
      }
    }

    monsoon(e) {
      const W = this.W;
      if (e.t % 40 === 0) {
        // run-off swells rivers and lakes
        const x = U.randInt(1, W.w - 2), gy = W.groundY(x);
        if (W.get(x, gy) === M.WATER) for (let k = 0; k < 3; k++) if (W.get(x + k, gy - 1) === M.EMPTY) W.set(x + k, gy - 1, M.WATER);
      }
    }

    drought(e) {
      const W = this.W;
      e.fade = Math.min(1, e.t / 300, (e.dur - e.t) / 300);
      W.drought = Math.max(0.2, e.fade);
      this.app.weather.targetIntensity = 0;
      if (e.t % 20 === 0) {
        const x = U.randInt(1, W.w - 2), gy = W.groundY(x);
        const t = W.get(x, gy - 1);
        if ((t === M.TALLGRASS || t === M.FLOWER || t === M.PLANT) && Math.random() < 0.5) W.set(x, gy - 1, M.LITTER, 0, 1);
      }
      // dry lightning starts wildfires
      if (e.t % 900 === 450 && Math.random() < 0.6) this.app.weather.strike(U.randInt(5, W.w - 5));
    }

    solarflare(e) {
      const W = this.W, app = this.app;
      const k = Math.sin(Math.PI * Math.min(1, e.t / e.dur));
      e.fade = k;
      if (Math.random() < 0.08 * k) {
        const x = U.randInt(1, W.w - 2), y = app.eco.topY(x);
        const t = W.get(x, y);
        if (MP.flammable[t] > 0) W.set(x, y, M.FIRE, 60);
      }
      if (e.t % 50 === 0) app.weather.flash = Math.max(app.weather.flash, 0.25 * k);
    }

    // -------------------------------------------------------- drawing
    drawWorld(ctx) {
      const W = this.W;
      for (const e of this.list) {
        if (e.type === 'abduction') {
          const img = ufoSprite();
          const gx = Math.round(e.ux), gy = W.groundY(U.clamp(gx, 0, W.w - 1));
          if (e.phase === 'beam') {
            const g = ctx.createLinearGradient(0, e.uy + 4, 0, gy);
            g.addColorStop(0, 'rgba(160,240,255,0.55)');
            g.addColorStop(1, 'rgba(160,240,255,0.12)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(e.ux - 2, e.uy + 4);
            ctx.lineTo(e.ux + 3, e.uy + 4);
            ctx.lineTo(e.ux + 8, gy);
            ctx.lineTo(e.ux - 7, gy);
            ctx.fill();
          }
          ctx.drawImage(img, Math.round(e.ux - 6), Math.round(e.uy + Math.sin(e.t * 0.08)));
        } else if (e.type === 'tornado') {
          const f = e.fade || 0;
          const top = Math.round(W.h * 0.12), bot = e.gy || W.h;
          for (let y = top; y < bot; y++) {
            const k = (y - top) / Math.max(1, bot - top);
            const hw = (11 - 9 * k) * f;
            const sway = Math.sin(y * 0.15 + e.spin * 0.3) * 2 * (1 - k) + (e.x - W.w / 2) * 0;
            const cx = e.x + sway * (1 - k) + (1 - k) * 3 * Math.sin(e.t * 0.02);
            ctx.fillStyle = `rgba(110,110,118,${0.35 * f})`;
            ctx.fillRect(Math.round(cx - hw), y, Math.round(hw * 2) + 1, 1);
            ctx.fillStyle = `rgba(70,70,78,${0.6 * f})`;
            const p = Math.sin(y * 0.6 + e.spin);
            ctx.fillRect(Math.round(cx + p * hw), y, 1, 1);
            ctx.fillRect(Math.round(cx - p * hw * 0.6), y, 1, 1);
          }
        } else if (e.type === 'blackhole') {
          const r = e.r;
          const cx = e.x, cy = e.y;
          const t = e.t * 0.1;
          for (let i = 0; i < 70; i++) {
            const a = (i / 70) * Math.PI * 2 + t;
            const rr = r * (1.5 + 0.35 * Math.sin(i * 1.7 + t * 2));
            ctx.fillStyle = i % 3 ? 'rgba(255,170,80,0.85)' : 'rgba(190,120,255,0.85)';
            ctx.fillRect(Math.round(cx + Math.cos(a) * rr), Math.round(cy + Math.sin(a) * rr * 0.45), 1, 1);
          }
          ctx.strokeStyle = 'rgba(255,255,255,0.25)';
          ctx.beginPath();
          ctx.arc(cx, cy, r * 2.4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(0.8, r), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    drawOverlay(ctx) {
      const W = this.W;
      for (const e of this.list) {
        let col = null;
        switch (e.type) {
          case 'radiation': col = `rgba(90,255,60,${0.13 * (e.fade || 0) * (0.8 + 0.2 * Math.sin(e.t * 0.2))})`; break;
          case 'solarflare': col = `rgba(255,200,120,${0.28 * (e.fade || 0) * (0.85 + 0.15 * Math.sin(e.t * 0.3))})`; break;
          case 'drought': col = `rgba(220,170,90,${0.12 * (e.fade || 0)})`; break;
          case 'hurricane': col = `rgba(40,50,60,${0.18 * (e.fade || 0)})`; break;
        }
        if (col) { ctx.fillStyle = col; ctx.fillRect(...(this.app.weather.vrect || [0, 0, W.w, W.h])); }
      }
    }
  }

  function mutate(c) {
    const pal = {};
    for (const k in c.sp.pal) pal[k] = U.toHex([U.rand(40, 255), U.rand(40, 255), U.rand(40, 255)]);
    pal.e = '#e8ff40';
    c.vpal = pal;
    c.vkey = 'm' + Math.random().toString(36).slice(2, 8);
    c.mutant = true;
  }

  Events.DEFS = DEFS;
  DS.Events = Events;
})();
