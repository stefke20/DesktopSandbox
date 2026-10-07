// Sky gradient, sun/moon/stars and parallax silhouette layers per biome.
(function () {
  'use strict';
  const DS = window.DS;
  const { U } = DS;

  function genLayer(l, w, h, rng) {
    const ys = new Float32Array(w);
    const n = U.noise1D(rng, l.scale || 50, l.oct || 3);
    const base = (l.y || 0.5) * h, amp = (l.amp || 0.1) * h;
    const windows = [];
    switch (l.type) {
      case 'city': case 'ruins': {
        let x = 0;
        while (x < w) {
          const bw = U.randInt(5, 16);
          const bh = (0.25 + rng() * 0.75) * amp;
          const gap = Math.floor(rng() * 3);
          for (let i = 0; i < bw && x + i < w; i++) {
            let y = base - bh;
            if (l.type === 'ruins' && (i < 2 || i > bw - 3 || rng() < 0.15)) y += rng() * bh * 0.4;
            if (l.antenna && i === (bw >> 1) && rng() < 0.3) y -= 4;
            ys[x + i] = y;
          }
          for (let wy = Math.round(base - bh) + 2; wy < base - 2; wy += 3)
            for (let wx = x + 1; wx < x + bw - 1; wx += 2)
              if (rng() < (l.type === 'ruins' ? 0.06 : 0.35)) windows.push([wx, wy, rng()]);
          for (let i = 0; i < gap && x + bw + i < w; i++) ys[x + bw + i] = base;
          x += bw + gap;
        }
        break;
      }
      default:
        for (let x = 0; x < w; x++) {
          const v = n(x);
          let y;
          switch (l.type) {
            case 'mountains': { const r = 1 - Math.abs(2 * v - 1); y = base - Math.pow(r, 1.4) * amp * 1.6 + amp * 0.3; break; }
            case 'dunes': { const s = Math.sin(x / ((l.scale || 50) * 0.35) + v * 5) * 0.5 + 0.5; y = base - (s * 0.6 + v * 0.4) * amp; break; }
            case 'mesa': { const q = v > 0.56 ? 1 : v > 0.5 ? (v - 0.5) / 0.06 : 0; y = base - q * amp - v * 3; break; }
            case 'trees': y = base - (v - 0.5) * amp - Math.abs(Math.sin(x * 0.7) + Math.sin(x * 1.9 + 1)) * 1.5; break;
            case 'pines': { const p = 5; const tri = 1 - Math.abs(((x % p) / p) * 2 - 1); const hh = 0.5 + Math.abs(Math.sin(Math.floor(x / p) * 12.9898)) * 0.5; y = base - (v - 0.5) * amp - tri * hh * amp * 0.9; break; }
            case 'jungle': y = base - v * amp - Math.abs(Math.sin(x * 0.18)) * amp * 0.35; break;
            case 'volcano': { const cx = (l.cx || 0.7) * w, wd = (l.width || 0.3) * w; const d = Math.abs(x - cx); y = base - Math.max(0, 1 - d / wd) * amp - v * 4; if (d < 3) y += 3; break; }
            case 'ice': y = base - (v > 0.6 ? (v - 0.6) * 2.5 * amp : 0); break;
            case 'flat': y = base; break;
            default: y = base - (v - 0.5) * 2 * amp; // hills
          }
          ys[x] = y;
        }
    }
    return { ...l, ys, windows };
  }

  class Background {
    constructor(world, biome, rng) {
      this.world = world;
      this.biome = biome;
      const w = world.w, h = world.h;
      this.canvas = document.createElement('canvas');
      this.canvas.width = w;
      this.canvas.height = h;
      this.ctx = this.canvas.getContext('2d');
      this.layers = (biome.bg.layers || []).map((l) => genLayer(l, w, h, rng));
      // world mode: every zone has its own scenery
      if (world.zones) this.zoneLayers = world.zones.map((z) => (z.biome.bg.layers || []).map((l) => genLayer(Object.assign({}, l, { y: (l.y || 0.5) * 0.62 }), w, h, rng)));
      this.stars = [];
      for (let i = 0; i < (w * h) / 90; i++) this.stars.push([Math.floor(rng() * w), Math.floor(rng() * h * 0.6), 0.3 + rng() * 0.7]);
      this.key = '';
      this.puffs = [];
    }

    skyAt(t, daylight, biome = this.biome) {
      const s = biome.bg.sky;
      const sunH = Math.sin(Math.PI * 2 * (t - 0.25));
      const duskAmt = 1 - U.clamp(Math.abs(sunH) / 0.35, 0, 1);
      const pick = (i) => {
        let c = U.mix(U.hex(s.night[i]), U.hex(s.day[i]), daylight);
        return U.mix(c, U.hex(s.dusk[i]), duskAmt * 0.75);
      };
      return { top: pick(0), bottom: pick(1), sunH };
    }

    render(t, daylight, weather, view) {
      if (view) { this.vx0 = Math.max(0, Math.floor(view.x)); this.vx1 = Math.ceil(view.x + view.w); this.vy0 = this.world.zones ? Math.max(0, view.y) : 0; }
      const cover = weather ? weather.cloudCover : 0;
      const key = Math.round(t * 720) + '|' + Math.round(cover * 10) + '|' + (view ? Math.round(view.x / 3) + ',' + Math.round(view.y / 3) + ',' + Math.round(view.w) : '');
      if (key === this.key) return this.canvas;
      this.key = key;
      const ctx = this.ctx, W = this.world, w = W.w, h = W.h;
      let sky = this.skyAt(t, daylight);
      if (W.zones && view) {
        const z = W.zoneMixAt(Math.round(view.x + view.w / 2));
        const a = this.skyAt(t, daylight, W.zones[z.a].biome), b = this.skyAt(t, daylight, W.zones[z.b].biome);
        sky = { top: U.mix(a.top, b.top, z.t), bottom: U.mix(a.bottom, b.bottom, z.t), sunH: a.sunH };
      }
      let top = sky.top, bottom = sky.bottom;
      const grey = U.clamp((cover - 0.4) * 1.4, 0, 0.6);
      if (grey > 0) { top = U.mix(top, U.shade([120, 126, 138], 0.3 + daylight * 0.7), grey); bottom = U.mix(bottom, U.shade([150, 156, 166], 0.3 + daylight * 0.7), grey); }
      this.skyBottom = bottom;
      const g = ctx.createLinearGradient(0, 0, 0, h * 0.75);
      g.addColorStop(0, U.css(top));
      g.addColorStop(1, U.css(bottom));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // stars
      const night = this.biome.bg.alwaysStars ? Math.max(0.85, 1 - daylight) : 1 - daylight;
      if (night > 0.3 && this.biome.bg.stars !== false) {
        for (const [x, y, b] of this.stars) {
          ctx.fillStyle = `rgba(255,255,240,${(night - 0.3) * 1.4 * b * (1 - grey)})`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      // planets hanging in the sky (Earth from the Moon, Jupiter from its moons...)
      for (const p of this.biome.bg.bodies || []) {
        const vx0 = view ? view.x : 0, vw0 = view ? view.w : w, vy0 = view ? view.y : 0, vh0 = view ? view.h : h;
        const cx = Math.round(vx0 + vw0 * p.x), cy = Math.round(vy0 + vh0 * p.y), r = p.r;
        if (p.ring) { ctx.fillStyle = p.ring; ctx.fillRect(cx - r * 2, cy, r * 4 + 1, 1); ctx.fillRect(cx - Math.round(r * 1.7), cy - 1, Math.round(r * 3.4) + 1, 1); }
        for (let dy = -r; dy <= r; dy++) {
          const hw = Math.round(Math.sqrt(r * r - dy * dy));
          const band = p.bands ? p.bands[Math.abs(Math.floor((dy + r) / Math.max(2, r / 4))) % p.bands.length] : p.color;
          ctx.fillStyle = (dy + r) % 3 === 0 && p.bands ? band : p.color;
          ctx.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1);
          // night side
          ctx.fillStyle = 'rgba(0,0,10,0.45)';
          ctx.fillRect(cx + Math.round(hw * 0.3), cy + dy, Math.max(0, hw - Math.round(hw * 0.3)) + 1, 1);
        }
        if (p.ring) { ctx.fillStyle = p.ring; ctx.fillRect(cx - r * 2, cy + 1, r * 4 + 1, 1); }
      }
      // sun & moon
      // the sun and moon arc across whatever part of the world is in view
      const vx = view ? view.x : 0, vw = view ? view.w : w, vy = view ? view.y : 0, vh = view ? view.h : h;
      const horizon = vy + vh * 0.6;
      const body = (tt, r, col, glow) => {
        const p = (tt - 0.2) / 0.6;
        if (p < 0 || p > 1) return;
        const x = vx + vw * (0.05 + 0.9 * p);
        const y = horizon - Math.sin(Math.PI * p) * vh * 0.6 * 0.85;
        if (glow) {
          const gg = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
          gg.addColorStop(0, glow);
          gg.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = gg;
          ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
        }
        ctx.fillStyle = col;
        for (let dy = -r; dy <= r; dy++) {
          const hw = Math.round(Math.sqrt(r * r - dy * dy));
          ctx.fillRect(Math.round(x) - hw, Math.round(y) + dy, hw * 2 + 1, 1);
        }
        return [x, y];
      };
      if (grey < 0.5) {
        body(t, this.biome.bg.sunR || 4, this.biome.bg.sun || '#fff4c8', 'rgba(255,240,180,0.45)');
        const m = this.biome.space ? null : body((t + 0.5) % 1, 3, '#e8ecf4', 'rgba(200,210,255,0.18)');
        if (m) { ctx.fillStyle = 'rgba(160,170,190,0.8)'; ctx.fillRect(Math.round(m[0]) - 1, Math.round(m[1]) - 1, 1, 1); ctx.fillRect(Math.round(m[0]) + 1, Math.round(m[1]) + 1, 1, 1); }
      }

      // parallax layers
      const nightTint = [12, 16, 34];
      const lx0 = view ? Math.max(0, Math.floor(view.x) - 4) : 0, lx1 = view ? Math.min(w, Math.ceil(view.x + view.w) + 4) : w;
      if (this.zoneLayers) {
        this.drawZoneLayers(ctx, lx0, lx1, bottom, night, daylight, nightTint);
      } else for (const l of this.layers) {
        let c = U.mix(U.hex(l.color), bottom, l.haze == null ? 0.3 : l.haze);
        c = U.mix(c, nightTint, night * 0.75);
        ctx.fillStyle = U.css(c);
        for (let x = lx0; x < lx1; x++) {
          const y = Math.round(l.ys[x]);
          if (y < h) ctx.fillRect(x, y, 1, h - y);
        }
        if (l.rim) {
          ctx.fillStyle = U.css(U.mix(c, [255, 255, 255], 0.12 * daylight));
          for (let x = lx0; x < lx1; x++) ctx.fillRect(x, Math.round(l.ys[x]), 1, 1);
        }
        if (l.snowcap) {
          ctx.fillStyle = U.css(U.mix(U.mix([240, 244, 250], bottom, 0.3), nightTint, night * 0.7));
          const cap = l.snowcap * h;
          for (let x = lx0; x < lx1; x++) { const y = Math.round(l.ys[x]); if (y < cap) ctx.fillRect(x, y, 1, Math.min(3, cap - y) + 1); }
        }
        if (l.windows.length && night > 0.3) {
          for (const [x, y, r] of l.windows) {
            if (r > 0.75) continue;
            ctx.fillStyle = r < 0.06 ? `rgba(255,120,40,${night})` : `rgba(255,220,130,${(night - 0.3) * 1.2})`;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }

      // backdrops of hollow things (hive interiors...)
      for (const sh of W.backShapes || []) {
        ctx.fillStyle = sh.color;
        for (let dy = -sh.ry; dy <= sh.ry; dy++) {
          const hw = Math.floor(sh.rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (sh.ry * sh.ry))));
          ctx.fillRect(sh.cx - hw, sh.cy + dy, hw * 2 + 1, 1);
        }
      }
      // underground backdrop (cross-section biomes)
      if (W.backY) {
        const ub = U.hex(this.biome.bg.under || '#3a2618');
        ctx.fillStyle = U.css(ub);
        for (let x = 0; x < w; x++) ctx.fillRect(x, W.backY[x], 1, h - W.backY[x]);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        for (let x = 0; x < w; x++) {
          const y0 = W.backY[x];
          for (let y = y0 + 2; y < h; y += 7) if (((x * 31 + y * 17) % 11) === 0) ctx.fillRect(x, y, 1, 1);
        }
      }
      return this.canvas;
    }

    drawZoneLayers(ctx, x0, x1, bottom, night, daylight, nightTint) {
      const W = this.world, h = W.h;
      // layer colours per zone, then blended across transitions in 8 steps
      const base = this.zoneLayers.map((ls) => ls.map((l) => U.mix(U.mix(U.hex(l.color), bottom, l.haze == null ? 0.3 : l.haze), nightTint, night * 0.75)));
      const cache = new Map();
      const colour = (za, zb, li, t) => {
        const step = Math.round(t * 8);
        const key = za + ',' + zb + ',' + li + ',' + step;
        let c = cache.get(key);
        if (!c) {
          const ca = base[za][li] || base[zb][li], cb = base[zb][li] || base[za][li];
          c = U.css(U.mix(ca, cb, step / 8));
          cache.set(key, c);
        }
        return c;
      };
      const nl = Math.max(...this.zoneLayers.map((ls) => ls.length));
      for (let li = 0; li < nl; li++) {
        for (let x = x0; x < x1; x++) {
          const m = W.zoneMixAt(x);
          const la = this.zoneLayers[m.a][li], lb = this.zoneLayers[m.b][li];
          if (!la && !lb) continue;
          const ya = la ? la.ys[x] : h, yb = lb ? lb.ys[x] : h;
          const y = Math.round(U.lerp(ya, yb, m.t));
          if (y >= h) continue;
          ctx.fillStyle = colour(m.a, m.b, li, m.t);
          ctx.fillRect(x, y, 1, h - y);
          const cap = (la && la.snowcap) || (lb && lb.snowcap);
          if (cap && y < cap * h * 0.62) { ctx.fillStyle = U.css(U.mix([240, 244, 250], nightTint, night * 0.7)); ctx.fillRect(x, y, 1, 3); }
        }
      }
    }

    // Animated sky features: aurora, volcano plume
    drawDynamic(ctx, t, daylight, frame, flare) {
      const W = this.world;
      const bg = this.biome.bg;
      const night = 1 - daylight;
      if ((bg.aurora && night > 0.4) || flare) {
        const a = flare ? 0.9 : (night - 0.4) * 1.2;
        const T = frame * 0.01;
        const ax0 = this.vx0 || 0, ax1 = Math.min(W.w, this.vx1 || W.w);
        for (let x = ax0; x < ax1; x++) {
          const y0 = (this.vy0 || 0) + W.h * 0.08 + Math.sin(x * 0.025 + T) * 6 + Math.sin(x * 0.07 + T * 0.7) * 3;
          const len = 10 + Math.sin(x * 0.05 + T * 1.3) * 6 + Math.sin(x * 0.13 - T) * 3;
          const k = (Math.sin(x * 0.04 + T * 0.5) + 1) / 2;
          const g = ctx.createLinearGradient(0, y0, 0, y0 + len);
          g.addColorStop(0, `rgba(${Math.round(120 + 80 * k)},80,220,0)`);
          g.addColorStop(0.5, `rgba(60,${Math.round(230 - 60 * k)},150,${0.5 * a})`);
          g.addColorStop(1, 'rgba(60,255,150,0)');
          ctx.fillStyle = g;
          ctx.fillRect(x, y0, 1, len);
        }
      }
      if (bg.plume) {
        const vol = this.layers.find((l) => l.type === 'volcano');
        if (vol) {
          const cx = Math.round((vol.cx || 0.7) * W.w);
          const cy = Math.round(vol.ys[cx]);
          if (frame % 6 === 0) this.puffs.push({ x: cx + U.rand(-2, 2), y: cy, r: 2, a: 0.6 });
          for (let i = this.puffs.length - 1; i >= 0; i--) {
            const p = this.puffs[i];
            p.y -= 0.15;
            p.x += 0.08 + (W.wind || 0) * 0.1;
            p.r += 0.03;
            p.a -= 0.0025;
            if (p.a <= 0) { this.puffs.splice(i, 1); continue; }
            ctx.fillStyle = `rgba(${Math.round(70 + 40 * daylight)},${Math.round(64 + 36 * daylight)},${Math.round(60 + 34 * daylight)},${p.a})`;
            const r = p.r;
            for (let dy = -Math.floor(r); dy <= r; dy++) {
              const hw = Math.floor(Math.sqrt(r * r - dy * dy));
              ctx.fillRect(Math.round(p.x) - hw, Math.round(p.y) + dy, hw * 2 + 1, 1);
            }
          }
          if (night > 0.3) {
            ctx.fillStyle = `rgba(255,90,20,${0.5 * night})`;
            ctx.fillRect(cx - 2, cy, 5, 2);
          }
        }
      }
    }
  }

  DS.Background = Background;
})();
