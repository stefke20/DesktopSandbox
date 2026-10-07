// Beehives: worker bees forage nectar and fill comb cells with honey,
// the queen lays brood that hatches into new bees.
(function () {
  'use strict';
  const DS = window.DS;
  const { U, M, MP } = DS;
  const NECTAR = new Set([M.FLOWER, M.BLOSSOM]);

  class HiveColony {
    constructor(o) {
      Object.assign(this, o);
      this.honey = 0;
      this.brood = [];
      this.dead = false;
      this.t = 0;
      this.workers = 0;
      this.queen = null;
    }
    inside(x, y) { return ((x - this.cx) / this.rx) ** 2 + ((y - this.cy) / this.ry) ** 2 < 0.8; }
    boxFree(W, b) { return W.get(b[0], b[1]) === M.EMPTY && W.get(b[0] + 1, b[1] + 1) === M.EMPTY; }
    fill(W, b, mat) { for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 2; dx++) if (W.get(b[0] + dx, b[1] + dy) === M.EMPTY) W.set(b[0] + dx, b[1] + dy, mat); }
    clear(W, b) { for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 2; dx++) { const t = W.get(b[0] + dx, b[1] + dy); if (t === M.BROOD || t === M.HONEY) W.set(b[0] + dx, b[1] + dy, M.EMPTY); } }
    freeBox(W, near) {
      const list = near ? this.boxes.slice().sort((a, b) => Math.abs(a[0] - near) - Math.abs(b[0] - near)).slice(0, 30) : this.boxes;
      for (let k = 0; k < 20; k++) { const b = U.pick(list); if (this.boxFree(W, b)) return b; }
      return null;
    }
    corridorNear(x) { return this.corridors.reduce((a, c) => (Math.abs(c - x) < Math.abs(a - x) ? c : a), this.corridors[0]); }

    update(eco) {
      const W = eco.world;
      this.t++;
      if (W.get(this.cx, this.cy - this.ry) === M.EMPTY && W.get(this.cx, this.cy + this.ry - 1) === M.EMPTY && W.get(this.cx - this.rx + 1, this.cy) === M.EMPTY) { this.dead = true; return; }
      let n = 0;
      for (const c of eco.list) if (c.hive === this && !c.sp.queen) n++;
      this.workers = n;
      const queenAlive = this.queen && !this.queen.dead;
      if (!queenAlive && !n && !this.brood.length) { this.dead = true; return; }
      if (queenAlive && this.t % 80 === 0 && this.honey >= 1 && n + this.brood.length < this.max && eco.list.length < eco.cap) {
        const b = this.freeBox(W, this.queen.x);
        if (b) { this.fill(W, b, M.BROOD); this.brood.push({ b, t: 900 }); this.honey -= 0.5; }
      }
      for (let i = this.brood.length - 1; i >= 0; i--) {
        const br = this.brood[i];
        if (W.get(br.b[0], br.b[1]) !== M.BROOD) { this.brood.splice(i, 1); continue; }
        if (--br.t > 0) continue;
        this.clear(W, br.b);
        const bee = eco.spawn(this.workerId, br.b[0], br.b[1] + 1, { newborn: true });
        if (bee) { bee.hive = this; bee.age = 0; }
        this.brood.splice(i, 1);
      }
      if (this.t % 900 === 0) {
        this.honey -= n * 0.02;
        if (this.honey < 0) {
          // eat a stored honey cell
          for (let k = 0; k < 30; k++) {
            const b = U.pick(this.boxes);
            if (W.get(b[0], b[1]) === M.HONEY) { this.clear(W, b); this.honey += 3; break; }
          }
          this.honey = Math.max(0, this.honey);
        }
      }
    }
  }

  function build(W, cx, cy, rx, ry, rng = Math.random) {
    const boxes = [], corridors = new Set();
    const top = cy - ry, bandY = Math.round(cy + ry * 0.55);
    const shell = Math.max(1.5, Math.min(rx, ry) * 0.12);
    for (let y = cy - ry; y <= cy + ry; y++) {
      for (let x = cx - rx; x <= cx + rx; x++) {
        if (!W.inb(x, y)) continue;
        const nx = (x - cx) / rx, ny = (y - cy) / ry;
        const d = Math.sqrt(nx * nx + ny * ny);
        if (d > 1) continue;
        if (d > 1 - shell / Math.min(rx, ry)) { W.set(x, y, M.COMB, 0, (x + y) % 3 === 0 ? 3 : 1); continue; }
        W.set(x, y, M.EMPTY);
        if (y >= bandY || y < top + ry * 0.25) continue;
        const lx = x - (cx - rx), ry0 = y - top;
        const col = lx % 11;
        if (col < 3) { if (col === 1) corridors.add(x); continue; }
        const band = Math.floor(ry0 / 4);
        const sx = col - 3 + (band % 2);
        if (ry0 % 4 === 0 || sx % 3 === 0) W.set(x, y, M.COMB, 0, (x * 7 + y) % 4 === 0 ? 2 : 0);
        else if (sx % 3 === 1 && ry0 % 4 === 1) boxes.push([x, y]);
      }
    }
    // keep only boxes that are fully enclosed 2x3 cavities
    const good = boxes.filter(([x, y]) => W.get(x, y) === M.EMPTY && W.get(x + 1, y + 2) === M.EMPTY && W.get(x + 2, y) === M.COMB);
    for (const b of good) {
      const r = rng();
      const mat = r < 0.4 ? M.HONEY : r < 0.5 ? M.BROOD : 0;
      if (mat) for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 2; dx++) W.set(b[0] + dx, b[1] + dy, mat);
    }
    // entrance at the bottom
    const by = cy + ry;
    for (let y = by - Math.ceil(shell) - 1; y <= by + 1; y++) for (let dx = -1; dx <= 1; dx++) if (W.get(cx + dx, y) === M.COMB) W.set(cx + dx, y, M.EMPTY);
    return new HiveColony({
      cx, cy, rx, ry, boxes: good, corridors: [...corridors].sort((a, b) => a - b), bandY: Math.round((bandY + cy + ry * 0.85) / 2),
      eOut: [cx, by + 4], eIn: [cx, by - Math.ceil(shell) - 2], max: 40, workerId: 'hivebee',
    });
  }

  const Hive = {
    build,
    // a queen founds a new hive
    found(eco, x, y, opts = {}) {
      const W = eco.world;
      const rx = opts.rx || 11, ry = opts.ry || 9;
      x = U.clamp(x, rx + 2, W.w - rx - 3);
      const gy = W.groundY(x);
      const cy = U.clamp(Math.min(y, gy - ry - 3), ry + 2, W.h - ry - 3);
      const h = build(W, x, cy, rx, ry);
      W.backShapes = W.backShapes || [];
      W.backShapes.push({ cx: x, cy, rx, ry, color: '#5a3a12' });
      if (eco.bgDirty) eco.bgDirty();
      h.max = opts.max || 30;
      h.honey = opts.honey == null ? 4 : opts.honey;
      eco.hives = eco.hives || [];
      eco.hives.push(h);
      const c = h.corridors[Math.floor(h.corridors.length / 2)] || x;
      h.queen = eco.spawn('hivequeen', c, Math.round(cy), { colony: h });
      if (h.queen) h.queen.hive = h;
      for (let i = 0; i < (opts.workers == null ? 8 : opts.workers); i++) {
        const b = eco.spawn(h.workerId, U.pick(h.corridors) || x, h.bandY, {});
        if (b) b.hive = h;
      }
      return h;
    },

    findFlower(W) {
      for (let k = 0; k < 50; k++) {
        const x = U.randInt(2, W.w - 3);
        let y = 0;
        while (y < W.h - 1 && W.get(x, y) === M.EMPTY) y++;
        for (let d = 0; d < 8; d++) if (NECTAR.has(W.get(x, y + d))) return [x, y + d];
      }
      return null;
    },

    route(c, pts) {
      c.wp = pts;
      const p = c.wp.shift();
      c.tx = p[0];
      c.ty = p[1];
      c.arrived = false;
      c.goal = 'wander';
      c.goalT = 0;
    },

    decide(c, eco) {
      const h = c.hive;
      const W = eco.world;
      if (c.sp.queen) {
        if (!h || h.dead) return;
        if (c.arrived || c.goalT > 600) { c.tx = U.pick(h.corridors) || h.cx; c.ty = U.randInt(Math.round(h.cy - h.ry * 0.5), h.bandY); c.arrived = false; c.goalT = 0; }
        return;
      }
      if (!h || h.dead) {
        // homeless bee: just visit flowers
        if (c.arrived || c.goalT > 400) { const f = Hive.findFlower(W); if (f) Hive.route(c, [[f[0], f[1] - 1]]); }
        return;
      }
      if (c.wp && c.wp.length && !c.arrived && c.goalT < 700) return;
      if (c.goalT >= 700) c.wp = [];
      if (c.wp && c.wp.length) return;
      if (!c.arrived && c.goalT < 700 && c.job) return;
      const inside = h.inside(c.x, c.y);
      const night = eco.daylight < 0.25;
      const corridor = (x) => [h.corridorNear(x), h.bandY];
      if (c.carry || night) {
        const b = c.carry ? h.freeBox(W) : null;
        const tail = b ? [[h.corridorNear(b[0]), b[1] + 1]] : [[U.pick(h.corridors) || h.cx, U.randInt(Math.round(h.cy - h.ry * 0.4), h.bandY)]];
        c.job = c.carry ? 'deposit' : 'rest';
        c.box = b;
        Hive.route(c, inside ? [corridor(tail[0][0])].concat(tail) : [h.eOut, h.eIn, corridor(tail[0][0])].concat(tail));
        return;
      }
      const f = Hive.findFlower(W);
      if (!f) { c.job = 'rest'; return; }
      c.job = 'forage';
      c.flower = f;
      Hive.route(c, inside ? [corridor(c.x), h.eIn, h.eOut, [f[0], f[1] - 1]] : [[f[0], f[1] - 1]]);
    },

    // called after movement every frame
    after(c, eco) {
      if (c.sp.queen) return;
      const W = eco.world;
      const d = Math.hypot(c.tx - c.x, c.ty - c.y);
      if (d > 2.2) return;
      if (c.wp && c.wp.length) { const p = c.wp.shift(); c.tx = p[0]; c.ty = p[1]; c.goalT = 0; return; }
      const h = c.hive;
      if (c.job === 'forage') {
        const f = c.flower;
        if (f && NECTAR.has(W.get(f[0], f[1]))) { c.carry = M.HONEY; eco.fx.add(c.x, c.y, 0, -0.1, '#fff0a0', 15, 0); }
        c.job = null;
        c.arrived = true;
        c.thinkT = 0;
      } else if (c.job === 'deposit') {
        if (h && c.box && h.boxFree(W, c.box)) { h.fill(W, c.box, M.HONEY); h.honey += 1; }
        else if (h) h.honey += 0.5;
        c.carry = 0;
        c.job = null;
        c.arrived = true;
        c.thinkT = 0;
      } else {
        c.arrived = true;
        if (c.job === 'rest' && eco.daylight > 0.3) { c.job = null; c.thinkT = 0; }
      }
    },
  };

  DS.Hive = Hive;
})();
