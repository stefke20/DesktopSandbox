// The cell grid: falling-sand style simulation and pixel rendering.
(function () {
  'use strict';
  const DS = window.DS;
  const { U, M, MP, PAL } = DS;
  const K = MP.kind;
  const KS = 1, KP = 2, KL = 3, KG = 4, KF = 5;

  // Static materials that need occasional updates
  const ACTIVE_STATIC = new Uint8Array(M.COUNT);
  [M.HVENT, M.GRASS, M.DRYGRASS, M.WOOD, M.BIRCH, M.BAMBOO, M.LEAF, M.AUTUMN, M.BLOSSOM, M.ICE, M.EMBERS, M.VENT, M.SPRING, M.DRAIN, M.PLANT, M.TALLGRASS, M.FLOWER, M.ALIENMOSS, M.XENOWOOD].forEach((t) => (ACTIVE_STATIC[t] = 1));

  // Darker palette variants for cells deep below the surface
  const DEPTH_LEVELS = 8;
  const PALD = new Uint32Array(M.COUNT * 4 * DEPTH_LEVELS);
  for (let i = 0; i < M.COUNT * 4; i++) {
    const c = PAL[i];
    const r = c & 255, g = (c >> 8) & 255, b = (c >> 16) & 255, a = (c >>> 24) & 255;
    for (let l = 0; l < DEPTH_LEVELS; l++) {
      const f = 1 - l * 0.065;
      PALD[i * DEPTH_LEVELS + l] = U.pack(r * f, g * f * 0.98, b * f * 0.96, a);
    }
  }
  const SOLID = MP.solid;
  // self-lit materials (skip depth shading and cast light)
  const GLW = new Uint8Array(M.COUNT);
  for (const t of [M.LAVA, M.EMBERS, M.TOXIC, M.VENT, M.HVENT, M.CRYSTAL, M.AETHER, M.XENOBULB]) GLW[t] = 1;

  const UNDERWATER = new Uint8Array(M.COUNT);
  [M.SEAWEED, M.KELP, M.CORAL].forEach((t) => (UNDERWATER[t] = 1));

  const N8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

  class Grower {
    constructor(x, y, list) {
      this.x = x;
      this.y = y;
      // grow bottom-up / inside-out
      this.list = list.slice().sort((a, b) => b[1] - a[1] || Math.abs(a[0]) - Math.abs(b[0]));
      this.i = 0;
      this.timer = 0;
      this.done = false;
    }
    update(world) {
      if (++this.timer < 7) return;
      this.timer = 0;
      const base = world.get(this.x, this.y);
      if (this.i > 0 && !MP.veg[base]) { this.done = true; return; }
      for (let n = 0; n < 2 && this.i < this.list.length; n++) {
        const [dx, dy, mat, life, shade] = this.list[this.i++];
        const x = this.x + dx, y = this.y + dy;
        if (!world.inb(x, y)) continue;
        const t = world.get(x, y);
        if (t === M.EMPTY || (MP.veg[t] && t !== M.WOOD) || t === M.SNOW || (t === M.WATER && UNDERWATER[mat])) world.set(x, y, mat, life || 0, shade);
      }
      if (this.i >= this.list.length) this.done = true;
    }
  }

  class World {
    constructor(w, h) {
      this.w = w;
      this.h = h;
      const n = w * h;
      this.cells = new Uint8Array(n);
      this.shade = new Uint8Array(n);
      this.life = new Uint8Array(n);
      this.stamp = new Uint8Array(n);
      this.clock = 0;
      this.frame = 0;
      this.growers = [];
      this.depth = new Uint16Array(w);
      this.sdepth = new Uint16Array(w);
      this.wseen = new Uint8Array(w);
      this.shadeDepth = true;
      this.surf = new Int16Array(w);
      this.surfFrame = new Int32Array(w).fill(-1);
      this.lights = [];
      // environment, set by biome/weather each frame
      this.baseTemp = 15;
      this.temp = 15;
      this.daylight = 1;
      this.wind = 0;
      this.quake = 0;
      this.fertility = 1;
      this.leafFall = 0.00002;
      this.tuftRate = 0.0004;
      this.tuftKinds = ['tuft'];
      this.seedKinds = [['tree', 1]];
      this.waterSeeds = [['seaweed', 3], ['coral', 1]];
      this.ventRate = 0.002;
      this.lapse = 0;
      this.drought = 0;
      this.tempDelta = 0;
      this.colActive = new Uint8Array(w).fill(1);
      this.zoneParams = null;
      this.zoneIdx = null;
      this.zoneWater = null;
      this.current = 0;
      this.fx = null;
      this.backY = null;
      this.setWater('#4a90d9', '#0c2a5a');
    }

    setWater(shallow, deep, alphaTop = 170) {
      Object.assign(this, World.makeWater(shallow, deep, alphaTop));
    }
    static makeWater(shallow, deep, alphaTop = 170) {
      const waterPal = new Uint32Array(40);
      const a = U.hex(shallow), b = U.hex(deep);
      for (let i = 0; i < 40; i++) {
        const t = Math.min(1, i / 36);
        const c = U.mix(a, b, Math.pow(t, 0.8));
        const alpha = U.lerp(alphaTop, 250, Math.min(1, i / 10));
        waterPal[i] = U.pack(c[0], c[1], c[2], alpha);
      }
      const hl = U.mix(a, [255, 255, 255], 0.35);
      return { waterPal, waterTop: U.pack(hl[0], hl[1], hl[2], 200) };
    }

    inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
    get(x, y) {
      if (x < 0 || x >= this.w || y >= this.h) return M.BEDROCK;
      if (y < 0) return M.EMPTY;
      return this.cells[y * this.w + x];
    }
    set(x, y, t, life = 0, shade) {
      if (!this.inb(x, y)) return;
      const i = y * this.w + x;
      this.cells[i] = t;
      this.shade[i] = shade == null ? (Math.random() * 4) | 0 : shade & 3;
      this.life[i] = life || this.defaultLife(t);
      this.stamp[i] = this.clock;
    }
    defaultLife(t) {
      if (t === M.FIRE) return 20 + ((Math.random() * 40) | 0);
      if (t === M.SMOKE) return 60 + ((Math.random() * 80) | 0);
      if (t === M.STEAM) return 80 + ((Math.random() * 80) | 0);
      return 0;
    }
    tempAt(y, x) {
      if (this.colTemp && x != null) return this.colTemp[x] + this.tempDelta - this.colLapse[x] * (1 - y / this.h);
      return this.temp - this.lapse * (1 - y / this.h);
    }
    // per-column biome parameters (world mode) or the world's own (sandbox)
    zp(x) { return this.zoneParams ? this.zoneParams[this.zoneIdx[x]] : this; }
    isSolid(x, y) { return MP.solid[this.get(x, y)] === 1; }
    isLiquid(x, y) { return K[this.get(x, y)] === KL; }
    isFree(x, y) {
      const t = this.get(x, y);
      return t === M.EMPTY || MP.veg[t] === 1 || K[t] === KG || t === M.FIRE;
    }

    // First solid-or-liquid row from the top (cached per frame)
    groundY(x) {
      x = U.clamp(x | 0, 0, this.w - 1);
      if (this.surfFrame[x] === this.frame) return this.surf[x];
      let y = 0;
      const { cells, w, h } = this;
      while (y < h) {
        const t = cells[y * w + x];
        if (MP.solid[t] || K[t] === KL) break;
        y++;
      }
      this.surf[x] = y;
      this.surfFrame[x] = this.frame;
      return y;
    }
    // First solid row from the top (ignores liquids)
    floorY(x, from = 0) {
      x = U.clamp(x | 0, 0, this.w - 1);
      let y = Math.max(0, from);
      while (y < this.h && !MP.solid[this.cells[y * this.w + x]]) y++;
      return y;
    }

    swap(i, j) {
      const c = this.cells, s = this.shade, l = this.life;
      const t = c[i]; c[i] = c[j]; c[j] = t;
      const a = s[i]; s[i] = s[j]; s[j] = a;
      const b = l[i]; l[i] = l[j]; l[j] = b;
      this.stamp[i] = this.clock;
      this.stamp[j] = this.clock;
    }

    addGrower(x, y, kind, rng) {
      if (this.growers.length > 400) return;
      this.growers.push(new Grower(x, y, DS.Flora.build(kind, rng)));
    }

    // Place a plant structure instantly (used by generators)
    plant(x, y, kind, rng = Math.random, overwrite = false) {
      for (const [dx, dy, mat, life, shade] of DS.Flora.build(kind, rng)) {
        const px = x + dx, py = y + dy;
        if (!this.inb(px, py)) continue;
        const t = this.get(px, py);
        if (overwrite || t === M.EMPTY || (MP.veg[t] && mat !== M.LEAF && mat !== M.NEEDLE) || (t === M.WATER && UNDERWATER[mat])) {
          this.set(px, py, mat, life || 0, shade);
        }
      }
    }

    // ------------------------------------------------------------ simulation
    step() {
      this.frame++;
      let clk = (this.clock + 1) & 255;
      if (clk === 0) clk = 1;
      this.clock = clk;
      const { w, h, cells, stamp } = this;
      const ltr = clk & 1;
      // far-away columns are simulated at a quarter of the rate (in rotating stripes)
      const act = this.colActive;
      if (this.activeRanges) {
        const phase = this.frame & 3;
        for (let x = 0; x < w; x++) act[x] = ((x >> 5) & 3) === phase ? 1 : 0;
        for (const [a, b] of this.activeRanges) for (let x = Math.max(0, a); x < Math.min(w, b); x++) act[x] = 1;
      }
      for (let y = h - 1; y >= 0; y--) {
        const row = y * w;
        for (let k = 0; k < w; k++) {
          const x = ltr ? k : w - 1 - k;
          if (!act[x]) continue;
          const i = row + x;
          const t = cells[i];
          if (t === 0 || stamp[i] === clk) continue;
          switch (K[t]) {
            case KS: if (ACTIVE_STATIC[t]) this.updStatic(i, x, y, t); break;
            case KP: this.updPowder(i, x, y, t); break;
            case KL: this.updLiquid(i, x, y, t); break;
            case KG: this.updGas(i, x, y, t); break;
            case KF: this.updFire(i, x, y); break;
          }
        }
      }
      for (let g = this.growers.length - 1; g >= 0; g--) {
        const gr = this.growers[g];
        if (!act[U.clamp(gr.x, 0, w - 1)]) continue;
        gr.update(this);
        if (gr.done) this.growers.splice(g, 1);
      }
      if (this.quake > 0) this.quake--;
    }

    lighter(t, target) {
      // can material t displace target?
      if (target === 0) return true;
      const k = K[target];
      if (k === KG || k === KF) return true;
      if (k === KL) return MP.density[target] < MP.density[t];
      return false;
    }

    updPowder(i, x, y, t) {
      const { w, h, cells } = this;
      if (y < h - 1) {
        const b = i + w;
        const bt = cells[b];
        if (this.lighter(t, bt)) {
          if (K[bt] === KL && Math.random() < 0.5) return;
          this.swap(i, b);
          return;
        }
        let slide = MP.sticky[t];
        if (this.quake > 0) slide = Math.max(slide, 0.5);
        if (Math.random() < slide) {
          const d = Math.random() < 0.5 ? -1 : 1;
          for (let s = 0; s < 2; s++) {
            const dx = s === 0 ? d : -d;
            const nx = x + dx;
            if (nx < 0 || nx >= w) continue;
            if (this.lighter(t, cells[b + dx]) && this.lighter(t, cells[i + dx])) {
              this.swap(i, b + dx);
              return;
            }
          }
        }
      }
      // at rest
      if (t === M.SEED) this.germinate(i, x, y);
      else if (t === M.SNOW) {
        const tt = this.tempAt(y, x);
        if (tt > 2 && Math.random() < 0.0004 * (tt - 1)) this.set(x, y, M.WATER);
      } else if (t === M.LITTER) {
        if (Math.random() < 0.0004) this.set(x, y, M.EMPTY); // decomposes
      }
    }

    germinate(i, x, y) {
      if (Math.random() > 0.02) return;
      const below = this.get(x, y + 1);
      const inWater = this.isLiquid(x, y - 1) || this.get(x, y - 1) === M.WATER;
      if (inWater && (below === M.SAND || below === M.DIRT || below === M.SOIL || below === M.MUD || below === M.STONE)) {
        this.cells[i] = M.SEAWEED;
        this.addGrower(x, y, U.weighted(this.zp(x).waterSeeds));
        return;
      }
      if (below === M.DIRT || below === M.SOIL || below === M.GRASS || below === M.DRYGRASS || below === M.MUD || below === M.SAND || below === M.SNOW || below === M.ASH || below === M.ALIENMOSS || below === M.ALIENSOIL || below === M.MARSDUST || below === M.REGOLITH) {
        let kind = U.weighted(this.zp(x).seedKinds);
        if (below === M.SAND && kind !== 'cactus' && kind !== 'palm' && kind !== 'deadbush' && Math.random() < 0.6) kind = 'tuft';
        this.cells[i] = M.PLANT;
        this.shade[i] = 0;
        this.addGrower(x, y, kind);
      } else if (Math.random() < 0.05) {
        this.cells[i] = M.EMPTY;
      }
    }

    updLiquid(i, x, y, t) {
      const { w, h, cells } = this;
      if (t === M.LAVA) {
        if (this.lavaReact(i, x, y)) return;
        if (Math.random() < 0.6) return; // viscous
      } else if (t === M.HONEY) {
        if (Math.random() < 0.85) return;
      } else if (t === M.WATER) {
        const above = y > 0 ? cells[i - w] : 0;
        if (above === 0) {
          const tt = this.tempAt(y, x);
          if (tt < -4) {
            const nb = (x > 0 && cells[i - 1] === M.ICE) || (x < w - 1 && cells[i + 1] === M.ICE);
            if (Math.random() < (nb ? (tt < -14 ? 0.0004 : 0.00005) : 0.000004)) { this.set(x, y, M.ICE); return; }
          }
          const below = y < h - 1 ? cells[i + w] : M.BEDROCK;
          if (below !== M.WATER && Math.random() < 0.003 &&
              (x === 0 || cells[i - 1] !== M.WATER) && (x === w - 1 || cells[i + 1] !== M.WATER)) {
            cells[i] = 0; return; // puddle dries
          }
          if ((this.tempAt(y, x) > 24 && this.daylight > 0.5 && Math.random() < 0.0002) || (this.drought > 0 && Math.random() < 0.004 * this.drought)) { cells[i] = 0; return; }
        }
      } else if (t === M.TOXIC) {
        if (Math.random() < 0.05) {
          const [dx, dy] = N8[(Math.random() * 8) | 0];
          const nt = this.get(x + dx, y + dy);
          if (MP.veg[nt]) this.set(x + dx, y + dy, Math.random() < 0.5 ? M.EMPTY : M.SMOKE);
        }
      }
      // fast path: a liquid cell boxed in below and on both sides cannot move
      if (y < h - 1 && x > 0 && x < w - 1) {
        const b = cells[i + w], l = cells[i - 1], r = cells[i + 1];
        if (b && l && r && K[b] !== KG && K[l] !== KG && K[r] !== KG && K[b] !== KF && K[l] !== KF && K[r] !== KF &&
            !this.lighter(t, b) && !this.lighter(t, l) && !this.lighter(t, r)) return;
      }
      if (y < h - 1) {
        const b = i + w;
        if (this.lighter(t, cells[b])) { this.swap(i, b); return; }
        const d = Math.random() < 0.5 ? -1 : 1;
        for (let s = 0; s < 2; s++) {
          const dx = s === 0 ? d : -d;
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;
          if (this.lighter(t, cells[b + dx]) && this.lighter(t, cells[i + dx])) { this.swap(i, b + dx); return; }
        }
      }
      // spread sideways
      const spread = MP.spread[t];
      let dir = Math.random() < 0.5 ? -1 : 1;
      if (this.wind && Math.random() < Math.abs(this.wind) * 0.2) dir = Math.sign(this.wind);
      if (this.current && t === M.WATER && Math.random() < 0.8) dir = Math.sign(this.current);
      let last = 0;
      for (let s = 1; s <= spread; s++) {
        const nx = x + dir * s;
        if (nx < 0 || nx >= w) {
          // a river flows off one edge and back in at the other
          if (this.current && t === M.WATER && last === s - 1) {
            const j = y * w + (nx < 0 ? w - 1 : 0);
            if (cells[j] === 0) { this.swap(i, j); return; }
          }
          break;
        }
        const nt = cells[i + dir * s];
        if (nt === 0 || K[nt] === KG) last = s;
        else break;
        if (y < h - 1 && this.lighter(t, cells[i + dir * s + w])) break;
      }
      if (last > 0) this.swap(i, i + dir * last);
    }

    lavaReact(i, x, y) {
      const [dx, dy] = N8[(Math.random() * 8) | 0];
      const nx = x + dx, ny = y + dy;
      if (!this.inb(nx, ny)) return false;
      const nt = this.get(nx, ny);
      if (nt === M.WATER) {
        this.set(x, y, M.STONE);
        this.set(nx, ny, M.STEAM);
        return true;
      }
      if (nt === M.SNOW || nt === M.ICE) { this.set(nx, ny, M.STEAM); return false; }
      if (MP.flammable[nt] > 0 && Math.random() < 0.3) this.set(nx, ny, M.FIRE, MP.burn[nt] + 10);
      else if (nt === M.EMPTY && dy < 0 && Math.random() < 0.01) this.set(nx, ny, Math.random() < 0.3 ? M.FIRE : M.SMOKE);
      if (Math.random() < 0.00015 && this.get(x, y - 1) === M.EMPTY) { this.set(x, y, M.STONE); return true; }
      return false;
    }

    updGas(i, x, y, t) {
      const { w, cells, life } = this;
      if (life[i] <= 1) {
        if (t === M.STEAM && y < this.h * 0.3 && Math.random() < 0.15) { cells[i] = M.WATER; return; }
        cells[i] = 0;
        return;
      }
      life[i]--;
      if (y === 0) { if (Math.random() < 0.1) cells[i] = 0; return; }
      const r = Math.random();
      if (r < 0.7) {
        const up = i - w;
        if (cells[up] === 0) { this.swap(i, up); return; }
      }
      let dx = Math.random() < 0.5 ? -1 : 1;
      if (this.wind && Math.random() < Math.min(0.8, Math.abs(this.wind) * 0.5)) dx = Math.sign(this.wind);
      const nx = x + dx;
      if (nx < 0 || nx >= w) { cells[i] = 0; return; }
      if (cells[i - w + dx] === 0 && r < 0.85) this.swap(i, i - w + dx);
      else if (cells[i + dx] === 0) this.swap(i, i + dx);
    }

    updFire(i, x, y) {
      const { w, cells, life } = this;
      if (life[i] <= 1) {
        const below = this.get(x, y + 1);
        if (MP.solid[below] && Math.random() < 0.12) this.set(x, y, M.ASH);
        else if (Math.random() < 0.45) this.set(x, y, M.SMOKE);
        else cells[i] = 0;
        return;
      }
      life[i]--;
      for (let n = 0; n < 2; n++) {
        const [dx, dy] = N8[(Math.random() * 8) | 0];
        const nx = x + dx, ny = y + dy;
        if (!this.inb(nx, ny)) continue;
        const j = ny * w + nx;
        const nt = cells[j];
        if (nt === M.WATER) {
          this.set(x, y, M.STEAM);
          if (Math.random() < 0.3) this.set(nx, ny, M.STEAM);
          return;
        }
        if (nt === M.SNOW || nt === M.ICE) { this.set(nx, ny, M.WATER); continue; }
        const f = MP.flammable[nt];
        if (f > 0 && Math.random() < f * 4) {
          this.set(nx, ny, M.FIRE, Math.min(250, MP.burn[nt] + ((Math.random() * 20) | 0)));
        }
      }
      if (y > 0 && cells[i - w] === 0) {
        if (life[i] < 25 && Math.random() < 0.35) this.swap(i, i - w);
        else if (Math.random() < 0.04) this.set(x, y - 1, M.SMOKE);
      }
    }

    updStatic(i, x, y, t) {
      const r = Math.random();
      const { w, cells } = this;
      switch (t) {
        case M.GRASS: {
          if (r > 0.02) return;
          const above = y > 0 ? cells[i - w] : 0;
          if (MP.solid[above] && above !== M.SNOW) { this.set(x, y, M.DIRT); return; }
          if (this.drought > 0 && r < 0.004) { this.set(x, y, M.DRYGRASS); return; }
          if (this.tempAt(y, x) < -2) return;
          const zp = this.zp(x);
          if (r < 0.012 * zp.fertility) {
            const dx = Math.random() < 0.5 ? -1 : 1;
            const dy = ((Math.random() * 3) | 0) - 1;
            const nx = x + dx, ny = y + dy;
            if (this.get(nx, ny) === M.DIRT && this.isFree(nx, ny - 1) && !this.isLiquid(nx, ny - 1)) this.set(nx, ny, M.GRASS);
          } else if (r < 0.0125 * zp.fertility + this.tuftRate && above === 0) {
            this.addGrower(x, y - 1, U.pick(zp.tuftKinds));
            this.set(x, y - 1, M.PLANT);
          }
          return;
        }
        case M.WOOD: case M.BIRCH: case M.BAMBOO: case M.XENOWOOD: {
          // life holds the foliage material to regrow (1 = leaf, 2 = needle, else a material id)
          const code = this.life[i];
          if (code === 0 || r > 0.004 * this.zp(x).fertility || this.tempAt(y, x) < -8 || this.drought > 0) return;
          const dx = ((Math.random() * 7) | 0) - 3, dy = ((Math.random() * 7) | 0) - 3;
          const nx = x + dx, ny = y + dy;
          if (this.get(nx, ny) === M.EMPTY) this.set(nx, ny, code === 1 ? M.LEAF : code === 2 ? M.NEEDLE : code);
          return;
        }
        case M.ALIENMOSS: {
          // alien moss creeps over alien soil and sprouts strange little plants
          if (r > 0.02) return;
          const above = y > 0 ? cells[i - w] : 0;
          if (MP.solid[above]) { this.set(x, y, M.ALIENSOIL); return; }
          const zp = this.zp(x);
          if (r < 0.012 * zp.fertility) {
            const nx = x + (Math.random() < 0.5 ? -1 : 1), ny = y + ((Math.random() * 3) | 0) - 1;
            if (this.get(nx, ny) === M.ALIENSOIL && this.isFree(nx, ny - 1)) this.set(nx, ny, M.ALIENMOSS);
          } else if (r < 0.0125 * zp.fertility + this.tuftRate && above === 0) {
            this.addGrower(x, y - 1, U.pick(zp.tuftKinds));
            this.set(x, y - 1, M.PLANT);
          }
          return;
        }
        case M.DRYGRASS:
          if (r < 0.0004 && this.drought <= 0 && this.tempAt(y, x) > 2) this.set(x, y, M.GRASS);
          return;
        case M.PLANT: case M.TALLGRASS: case M.FLOWER:
          if (this.drought > 0 && r < 0.0006) this.set(x, y, t === M.FLOWER ? M.EMPTY : M.LITTER, 0, 1);
          return;
        case M.HVENT:
          if (r < 0.12 && this.fx && K[this.get(x, y - 1)] === KL) this.fx.add(x + Math.random() - 0.5, y - 1, (Math.random() - 0.5) * 0.1, -0.25, Math.random() < 0.5 ? '#bcd8f0' : '#8aa8c8', 160, -0.002);
          return;
        case M.SPRING:
          if (r < 0.35) {
            const [dx, dy] = N8[(Math.random() * 8) | 0];
            if (dy >= 0 && this.get(x + dx, y + dy) === M.EMPTY) this.set(x + dx, y + dy, M.WATER);
          }
          return;
        case M.DRAIN:
          for (let k = 0; k < 2; k++) {
            const [dx, dy] = N8[(Math.random() * 8) | 0];
            const nt = this.get(x + dx, y + dy);
            if (K[nt] === KL || K[nt] === KG) this.set(x + dx, y + dy, M.EMPTY);
          }
          return;
        case M.LEAF: case M.AUTUMN: case M.BLOSSOM: {
          const fall = this.zp(x).leafFall * (t === M.LEAF ? 1 : 4) * (this.drought > 0 ? 20 : 1) * (1 + Math.abs(this.wind) * 3);
          if (r < fall && y < this.h - 1 && cells[i + w] === 0) this.set(x, y, M.LITTER, 0, t === M.LEAF ? undefined : t === M.AUTUMN ? 0 : 3);
          return;
        }
        case M.ICE:
          if (r < 0.003) { const tt = this.tempAt(y, x); if (tt > 2 && r < 0.0003 * (tt - 1)) this.set(x, y, M.WATER); }
          return;
        case M.EMBERS:
          if (r < 0.2 && y > 0 && cells[i - w] === 0) this.set(x, y - 1, M.FIRE, 15 + ((Math.random() * 25) | 0));
          return;
        case M.VENT:
          if (y > 0 && cells[i - w] === 0) {
            if (r < this.ventRate) this.set(x, y - 1, M.LAVA);
            else if (r < this.ventRate * 6) this.set(x, y - 1, M.SMOKE);
          }
          return;
      }
    }

    // ------------------------------------------------------------ tools
    explode(cx, cy, r, fx) {
      cx |= 0; cy |= 0;
      for (let y = cy - r; y <= cy + r; y++) {
        for (let x = cx - r; x <= cx + r; x++) {
          if (!this.inb(x, y)) continue;
          const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
          if (d2 > r * r) continue;
          const t = this.get(x, y);
          if (t === M.BEDROCK) continue;
          const d = Math.sqrt(d2) / r;
          if (d < 0.75 || Math.random() < 0.5) {
            if (t !== M.EMPTY && fx && Math.random() < 0.08) {
              fx.debris(x, y, (x - cx) * 0.25 + U.rand(-0.5, 0.5), (y - cy) * 0.2 - U.rand(1, 2.5), t === M.WATER ? M.WATER : (MP.solid[t] ? M.RUBBLE : t));
            }
            this.set(x, y, Math.random() < 0.15 ? M.FIRE : Math.random() < 0.1 ? M.SMOKE : M.EMPTY);
          } else if (MP.flammable[t] > 0) {
            this.set(x, y, M.FIRE, 40);
          } else if (t === M.STONE || t === M.CONCRETE || t === M.BRICK) {
            if (Math.random() < 0.4) this.set(x, y, M.RUBBLE);
          }
        }
      }
      this.quake = Math.max(this.quake, 20);
    }

    // Sprinkle snow on top of every column (generation)
    dustSnow(prob = 1, rng = Math.random) {
      for (let x = 0; x < this.w; x++) {
        let y = 0;
        while (y < this.h && this.get(x, y) === M.EMPTY) y++;
        if (y > 0 && y < this.h && rng() < prob && this.get(x, y) !== M.WATER) this.set(x, y - 1, M.SNOW);
      }
    }

    // ------------------------------------------------------------ rendering
    render(buf, darkness, rx0 = 0, rx1 = this.w, ry1 = this.h) {
      const { w, cells, shade, depth, sdepth, wseen, life } = this;
      const h = Math.min(this.h, ry1);
      rx0 = Math.max(0, rx0);
      rx1 = Math.min(w, rx1);
      const zw = this.zoneWater, zi = this.zoneIdx;
      depth.fill(0);
      sdepth.fill(0);
      wseen.fill(0);
      const lights = this.lights;
      lights.length = 0;
      const lit = darkness > 0.3;
      const fr = this.frame;
      const warm = U.pack(255, 214, 120);
      const shadeOn = this.shadeDepth;
      for (let y = 0; y < h; y++) {
        const row = y * w;
        for (let x = rx0; x < rx1; x++) {
          const i = row + x;
          const t = cells[i];
          if (t === 0) { buf[i] = 0; depth[x] = 0; wseen[x] = 0; if (sdepth[x] < 12) sdepth[x] = 0; continue; }
          if (t === M.WATER) {
            const d = depth[x]++;
            wseen[x] = 1;
            if (sdepth[x] < 12) sdepth[x] = 0;
            const wp = zw ? zw[zi[x]] : this;
            buf[i] = d === 0 && (y === 0 || cells[i - w] === 0) ? wp.waterTop : wp.waterPal[d > 39 ? 39 : d];
            continue;
          }
          if (wseen[x]) depth[x]++;
          if (t === M.FIRE) {
            buf[i] = PAL[t * 4 + ((Math.random() * 4) | 0)];
            if (((x * 7 + y * 13 + fr) & 7) === 0 && lights.length < 600) lights.push(x, y, 1);
            continue;
          }
          if (GLW[t]) {
            buf[i] = PAL[t * 4 + shade[i]];
            if (((x * 5 + y * 11) % 9) === 0 && lights.length < 600) lights.push(x, y, t === M.TOXIC ? 3 : 2);
            continue;
          }
          if (lit && t === M.GLASS && life[i] === 1) {
            buf[i] = warm;
            if (((x + y * 3) & 3) === 0 && lights.length < 900) lights.push(x, y, 4);
            continue;
          }
          if (t === M.LAMP && lit) lights.push(x, y, 5);
          if (SOLID[t] && shadeOn) {
            const sd = sdepth[x]++;
            const l = sd < 4 ? 0 : (sd - 4) >> 3;
            buf[i] = PALD[(t * 4 + shade[i]) * DEPTH_LEVELS + (l > 7 ? 7 : l)];
            continue;
          }
          buf[i] = PAL[t * 4 + shade[i]];
        }
      }
    }
  }

  DS.World = World;
})();
