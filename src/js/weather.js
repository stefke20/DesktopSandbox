// Weather: clouds, rain, snow, storms with lightning, sandstorms, ash, fog.
(function () {
  'use strict';
  const DS = window.DS;
  const { U, M, MP } = DS;

  const TYPES = ['clear', 'cloudy', 'rain', 'storm', 'drylightning', 'windy', 'snow', 'sandstorm', 'ashfall', 'fog'];

  class Weather {
    constructor(world, eco, fx) {
      this.world = world;
      this.eco = eco;
      this.fx = fx;
      this.type = 'clear';
      this.auto = true;
      this.timer = 60 * 60;
      this.intensity = 0;
      this.targetIntensity = 0;
      this.wind = 0;
      this.targetWind = 0;
      this.flash = 0;
      this.bolts = [];
      this.boltT = 200;
      this.drops = [];
      this.clouds = [];
      this.cloudCover = 0.2;
      this.fog = 0;
      this.probs = { clear: 1 };
      this.shake = 0;
      this.boost = 1;
    }

    get raining() { return (this.type === 'rain' || this.type === 'storm') && this.intensity > 0.2; }

    setBiome(biome) {
      this.probs = biome.weather || { clear: 1 };
      this.noClouds = !!biome.noClouds;
      this.clouds = [];
      this.drops = [];
      this.auto = true;
      this.set(U.weighted(Object.entries(this.probs)), true);
      const W = this.world;
      const n = Math.round(W.w / 60) + 2;
      for (let i = 0; i < n; i++) this.addCloud(U.rand(-20, W.w));
    }

    set(type, auto = false) {
      if (!TYPES.includes(type)) return;
      this.type = type;
      if (!auto) this.auto = false;
      this.timer = U.randInt(60 * 60 * 1.5, 60 * 60 * 4);
      const map = { clear: [0, 0.15], cloudy: [0, 0.6], rain: [0.6, 0.85], storm: [1, 1], drylightning: [0.8, 0.45], windy: [0, 0.35], snow: [0.6, 0.7], sandstorm: [0.8, 0.3], ashfall: [0.5, 0.6], fog: [0, 0.4] };
      const [inten, cover] = map[type];
      this.targetIntensity = inten;
      this.cloudCover = cover;
      this.targetWind = type === 'storm' ? U.rand(-1.6, 1.6) : type === 'sandstorm' ? (Math.random() < 0.5 ? -2.2 : 2.2) : type === 'windy' ? (Math.random() < 0.5 ? -1 : 1) * U.rand(2, 3) : type === 'drylightning' ? U.rand(-1, 1) : U.rand(-0.6, 0.6);
      this.fogTarget = type === 'fog' ? 0.55 : type === 'rain' ? 0.12 : type === 'sandstorm' ? 0.35 : 0;
    }

    addCloud(x) {
      if (this.noClouds) return;
      const W = this.world;
      const w = U.randInt(14, 40);
      const puffs = [];
      const n = Math.round(w / 5);
      for (let i = 0; i < n; i++) puffs.push([U.rand(-w / 2, w / 2), U.rand(-2, 2), U.rand(3, 7)]);
      this.clouds.push({ x, y: U.rand(4, Math.max(6, W.h * 0.18)), w, puffs, speed: U.rand(0.04, 0.12) });
    }

    // strike lightning at column x
    strike(x) {
      const W = this.world, eco = this.eco;
      x = U.clamp(Math.round(x), 1, W.w - 2);
      let y = 0;
      while (y < W.h - 1) {
        const t = W.get(x, y);
        if (t !== M.EMPTY && MP.kind[t] !== DS.KIND.gas) break;
        const c = eco.at(x, y, 2);
        if (c) break;
        y++;
      }
      const pts = [];
      let bx = x + U.randInt(-15, 15);
      for (let yy = 0; yy <= y; yy += U.randInt(2, 5)) {
        pts.push([bx, yy]);
        bx += U.randInt(-2, 2);
        bx += Math.sign(x - bx) * Math.min(2, Math.abs(x - bx)) * (yy / Math.max(1, y));
      }
      pts.push([x, y]);
      this.bolts.push({ pts, life: 12 });
      this.flash = 1;
      this.shake = 8;
      const t = W.get(x, y);
      eco.killNear(x, y, 4, 'zap');
      if (t === M.WATER) eco.killNear(x, y, 10, 'zap', (c) => c.inWater);
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          const cx = x + dx, cy = y + dy;
          const ct = W.get(cx, cy);
          if (ct === M.SAND && Math.random() < 0.7) W.set(cx, cy, M.GLASS);
          else if (MP.flammable[ct] > 0) W.set(cx, cy, M.FIRE, 60);
          else if (ct === M.EMPTY && Math.random() < 0.3 && dy < 0) W.set(cx, cy, M.FIRE);
          else if (ct === M.SNOW || ct === M.ICE) W.set(cx, cy, M.WATER);
        }
      this.fx.burst(x, y - 1, ['#ffffff', '#fff6a0', '#a0c8ff'], 14, 1.6);
    }

    update(daylight) {
      const W = this.world;
      if (this.auto && --this.timer <= 0) this.set(U.weighted(Object.entries(this.probs)), true);
      this.intensity += (this.targetIntensity - this.intensity) * 0.004;
      this.wind += (this.targetWind - this.wind) * 0.003;
      if (Math.random() < 0.002) this.targetWind += U.rand(-0.2, 0.2);
      this.fog += ((this.fogTarget || 0) - this.fog) * 0.003;
      W.wind = this.wind;
      if (this.flash > 0) this.flash *= 0.85;
      if (this.shake > 0) this.shake--;

      // clouds
      const want = Math.round((W.w / 30) * (0.2 + this.cloudCover));
      if (this.clouds.length < want && Math.random() < 0.02) this.addCloud(this.wind >= 0 ? -30 : W.w + 30);
      for (let i = this.clouds.length - 1; i >= 0; i--) {
        const c = this.clouds[i];
        c.x += (this.wind * 0.3 + (this.wind >= 0 ? 1 : -1) * c.speed);
        if (c.x < -60 || c.x > W.w + 60 || (this.clouds.length > want + 2 && Math.random() < 0.002)) this.clouds.splice(i, 1);
      }

      // precipitation
      let kind = null;
      if (this.type === 'rain' || this.type === 'storm') kind = W.temp < 0 ? 'snow' : 'rain';
      else if (this.type === 'snow') kind = 'snow';
      else if (this.type === 'ashfall') kind = 'ash';
      else if (this.type === 'sandstorm') kind = 'sand';
      const maxDrops = Math.round((this.spawnRange ? this.spawnRange[1] - this.spawnRange[0] : W.w) * (kind === 'rain' ? 1.4 : kind === 'sand' ? 1.2 : 0.9) * this.intensity * this.boost);
      if (kind && this.drops.length < maxDrops) {
        const n = Math.min(12 * this.boost, maxDrops - this.drops.length);
        for (let i = 0; i < n; i++) this.spawnDrop(kind);
      }
      if (this.type === 'sandstorm' && this.intensity > 0.3 && Math.random() < this.intensity) {
        // wind lifts sand from the dunes
        const x = U.randInt(1, W.w - 2);
        const gy = W.groundY(x);
        if (W.get(x, gy) === M.SAND && W.get(x, gy - 1) === M.EMPTY) {
          W.set(x, gy, M.EMPTY);
          this.drops.push({ x, y: gy, vx: this.wind, vy: -U.rand(0.2, 0.8), kind: 'sand', lift: true });
        }
      }
      this.updateDrops();

      // gusts lift loose leaves, litter, snow and sand
      if (Math.abs(this.wind) > 1.6) {
        const gust = (Math.abs(this.wind) - 1.6) * (1 + 0.5 * Math.sin(W.frame * 0.01));
        for (let k = 0; k < gust * 2; k++) {
          const x = U.randInt(1, W.w - 2), y = W.groundY(x) - 1;
          const t = W.get(x, y);
          const t2 = W.get(x, y + 1);
          const lift = t === M.LITTER ? t : (t2 === M.SNOW || (t2 === M.SAND && Math.abs(this.wind) > 2.5) || t2 === M.ASH) && W.get(x, y) === M.EMPTY ? t2 : 0;
          if (!lift) continue;
          W.set(x, lift === t ? y : y + 1, M.EMPTY);
          this.fx.debris(x, lift === t ? y : y + 1, this.wind * U.rand(0.5, 1), -U.rand(0.3, 1.2), lift);
        }
        if (Math.random() < gust * 0.3) this.fx.add(this.wind > 0 ? 0 : W.w, U.rand(0, W.h * 0.8), this.wind * U.rand(1.5, 2.5), U.rand(-0.1, 0.1), 'rgba(255,255,255,0.35)', 120, 0);
      }

      // lightning
      if ((this.type === 'storm' || this.type === 'drylightning') && this.intensity > 0.5 && --this.boltT <= 0) {
        this.boltT = U.randInt(150, this.type === 'drylightning' ? 400 : 600);
        this.strike(U.randInt(5, W.w - 5));
      }
      for (let i = this.bolts.length - 1; i >= 0; i--) if (--this.bolts[i].life <= 0) this.bolts.splice(i, 1);
    }

    spawnDrop(kind) {
      const W = this.world;
      const x = this.spawnRange ? U.rand(this.spawnRange[0], this.spawnRange[1]) : U.rand(-20, W.w + 20);
      if (W.colTemp && (kind === 'rain' || (kind === 'snow' && (this.type === 'rain' || this.type === 'storm')))) {
        const tx = U.clamp(Math.round(x), 0, W.w - 1);
        kind = W.tempAt(Math.round(W.h * 0.3), tx) < 0 ? 'snow' : 'rain';
      }
      const d = { x, y: U.rand(-10, 0), kind, vx: 0, vy: 0 };
      if (kind === 'rain') { d.vy = U.rand(2.2, 3); d.vx = this.wind * 0.6; }
      else if (kind === 'snow') { d.vy = U.rand(0.25, 0.5); d.vx = this.wind * 0.3; d.ph = Math.random() * 6; }
      else if (kind === 'ash') { d.vy = U.rand(0.15, 0.35); d.vx = this.wind * 0.3; d.ph = Math.random() * 6; }
      else if (kind === 'sand') { d.x = this.wind >= 0 ? U.rand(-20, 0) : U.rand(W.w, W.w + 20); d.y = U.rand(0, W.h); d.vx = this.wind * U.rand(0.8, 1.4); d.vy = U.rand(-0.1, 0.25); }
      this.drops.push(d);
    }

    updateDrops() {
      const W = this.world;
      const drops = this.drops;
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        if (d.kind === 'snow' || d.kind === 'ash') d.x += Math.sin((d.ph += 0.05)) * 0.15;
        if (d.kind === 'sand') d.vy += 0.01;
        const px = d.x, py = d.y;
        d.x += d.vx;
        d.y += d.vy;
        const rx = Math.round(d.x), ry = Math.round(d.y);
        if (ry >= W.h || rx < -25 || rx > W.w + 25) { drops.splice(i, 1); continue; }
        if (ry < 0 || rx < 0 || rx >= W.w) continue;
        const t = W.get(rx, ry);
        if (t === M.EMPTY || MP.kind[t] === DS.KIND.gas) continue;
        // hit something
        const lx = Math.round(px), ly = Math.round(py);
        const free = W.inb(lx, ly) && W.get(lx, ly) === M.EMPTY;
        switch (d.kind) {
          case 'rain':
            if (t === M.FIRE) W.set(rx, ry, Math.random() < 0.5 ? M.STEAM : M.SMOKE);
            else if (t === M.LAVA) { if (free) W.set(lx, ly, M.STEAM); }
            else if (MP.kind[t] === DS.KIND.liquid) { if (Math.random() < 0.3) this.fx.add(rx, ry - 1, U.rand(-0.3, 0.3), -0.5, '#b8d8f8', 8, 0.1); }
            else {
              if (free && Math.random() < 0.03 * this.boost) W.set(lx, ly, M.WATER);
              if (t === M.DRYGRASS && Math.random() < 0.05) W.set(rx, ry, M.GRASS);
              else if (Math.random() < 0.25) this.fx.add(lx, ly, U.rand(-0.4, 0.4), -0.4, '#b8d8f8', 6, 0.1);
              if (t === M.DIRT && Math.random() < 0.01 && W.temp > 0) W.set(rx, ry, M.GRASS);
            }
            break;
          case 'snow':
            if (t === M.FIRE || t === M.LAVA) break;
            if (free && MP.kind[t] !== DS.KIND.liquid && Math.random() < (W.temp < 2 ? 0.2 : 0.03)) W.set(lx, ly, M.SNOW);
            break;
          case 'ash':
            if (free && MP.kind[t] !== DS.KIND.liquid && Math.random() < 0.06) W.set(lx, ly, M.ASH);
            break;
          case 'sand':
            if (free && MP.kind[t] !== DS.KIND.liquid && Math.random() < (d.lift ? 1 : 0.15)) W.set(lx, ly, M.SAND);
            break;
        }
        drops.splice(i, 1);
      }
    }

    drawClouds(ctx, daylight, sky) {
      const storm = this.type === 'storm' || this.type === 'rain' || this.type === 'ashfall' ? Math.min(1, this.intensity * 1.2) : this.type === 'drylightning' ? 0.6 : 0;
      let base = U.mix([255, 255, 255], [90, 95, 110], storm * 0.8);
      if (this.type === 'ashfall') base = U.mix(base, [80, 70, 60], 0.5);
      const night = 1 - daylight;
      const col = U.mix(base, U.mix(sky, [20, 24, 40], 0.5), night * 0.85);
      const shadow = U.shade(col, 0.82);
      const v = this.vrect;
      for (const c of this.clouds) {
        if (v && (c.x + c.w < v[0] || c.x - c.w > v[0] + v[2])) continue;
        ctx.fillStyle = U.css(shadow, 0.9);
        for (const [dx, dy, r] of c.puffs) this.disc(ctx, c.x + dx, c.y + dy + 1, r);
        ctx.fillStyle = U.css(col, 0.95);
        for (const [dx, dy, r] of c.puffs) this.disc(ctx, c.x + dx, c.y + dy - 0.5, r - 0.5);
      }
    }

    disc(ctx, cx, cy, r) {
      cx = Math.round(cx); cy = Math.round(cy);
      for (let dy = -Math.floor(r); dy <= r; dy++) {
        const hw = Math.floor(Math.sqrt(r * r - dy * dy) * 1.6);
        ctx.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1);
      }
    }

    drawFront(ctx, daylight) {
      const W = this.world;
      for (const d of this.drops) {
        const x = Math.round(d.x), y = Math.round(d.y);
        switch (d.kind) {
          case 'rain':
            ctx.fillStyle = 'rgba(170,200,240,0.65)';
            ctx.fillRect(x, y, 1, 2);
            break;
          case 'snow':
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.fillRect(x, y, 1, 1);
            break;
          case 'ash':
            ctx.fillStyle = 'rgba(120,115,110,0.9)';
            ctx.fillRect(x, y, 1, 1);
            break;
          case 'sand':
            ctx.fillStyle = 'rgba(220,190,130,0.8)';
            ctx.fillRect(x, y, 1, 1);
            break;
        }
      }
      if (this.fog > 0.01) {
        const g = ctx.createLinearGradient(0, 0, 0, W.h);
        const fc = this.type === 'sandstorm' ? '210,170,110' : daylight > 0.4 ? '225,230,236' : '70,78,96';
        g.addColorStop(0, `rgba(${fc},${this.fog * 0.3})`);
        g.addColorStop(1, `rgba(${fc},${this.fog})`);
        ctx.fillStyle = g;
        ctx.fillRect(...(this.vrect || [0, 0, W.w, W.h]));
      }
      for (const b of this.bolts) {
        ctx.strokeStyle = `rgba(255,255,255,${Math.min(1, b.life / 6)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < b.pts.length; i++) {
          const [x, y] = b.pts[i];
          if (i === 0) ctx.moveTo(x + 0.5, y);
          else ctx.lineTo(x + 0.5, y);
        }
        ctx.stroke();
      }
      if (this.flash > 0.02) {
        ctx.fillStyle = `rgba(230,236,255,${this.flash * 0.5})`;
        ctx.fillRect(...(this.vrect || [0, 0, W.w, W.h]));
      }
    }
  }

  Weather.TYPES = TYPES;
  DS.Weather = Weather;
})();
