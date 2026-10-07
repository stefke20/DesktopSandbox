// Landscaping: raise / lower / flatten ground, build mountains, lakes, islands.
(function () {
  'use strict';
  const DS = window.DS;
  const { U, M, MP } = DS;
  const KL = DS.KIND.liquid;

  const SOFT_TOP = new Set([M.GRASS, M.DRYGRASS, M.SNOW]);
  const STACKABLE = (t) => t !== M.EMPTY && t !== M.BEDROCK;

  // Move the stack of cells sitting on top of (x, y) up by one, then put `mat` at y.
  function pushUp(W, x, y, mat, life = 0) {
    let k = y;
    while (k > 0 && STACKABLE(W.get(x, k)) && y - k < 60) k--;
    if (k <= 0 || W.get(x, k) !== M.EMPTY) return false;
    for (let yy = k; yy < y; yy++) copy(W, x, yy + 1, x, yy);
    W.set(x, y, mat, life);
    return true;
  }
  // Remove the cell at (x, y) and let the stack above sink by one.
  function pullDown(W, x, y) {
    let yy = y;
    while (yy > 0 && STACKABLE(W.get(x, yy - 1)) && y - yy < 60) { copy(W, x, yy - 1, x, yy); yy--; }
    W.set(x, yy, M.EMPTY);
  }
  function copy(W, sx, sy, dx, dy) {
    const a = sy * W.w + sx, b = dy * W.w + dx;
    W.cells[b] = W.cells[a];
    W.shade[b] = W.shade[a];
    W.life[b] = W.life[a];
  }

  const T = {
    // ground surface ignoring liquids and vegetation
    top(W, x) { return W.floorY(x); },

    raise(W, cx, r, kind) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (x < 1 || x >= W.w - 1) continue;
        const p = 1 - Math.abs(x - cx) / (r + 1);
        if (Math.random() > p * 0.7) continue;
        const y = W.floorY(x);
        if (y < 4 || y >= W.h) continue;
        const above = W.get(x, y - 1);
        if (above === M.WOOD || above === M.BIRCH || above === M.BAMBOO || above === M.CACTUS) continue;
        const cur = W.get(x, y);
        const wet = MP.kind[above] === KL;
        let mat;
        switch (kind) {
          case 'stone': mat = M.STONE; break;
          case 'sand': mat = M.SAND; break;
          case 'snow': mat = M.SNOW; break;
          case 'clay': mat = M.MUD; break;
          default:
            mat = wet ? M.SOIL : SOFT_TOP.has(cur) ? cur : M.GRASS;
            if (SOFT_TOP.has(cur) && !wet) W.set(x, y, M.SOIL);
        }
        if (wet) W.set(x, y - 1, mat);
        else pushUp(W, x, y - 1, mat);
      }
    },

    lower(W, cx, r) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (x < 1 || x >= W.w - 1) continue;
        const p = 1 - Math.abs(x - cx) / (r + 1);
        if (Math.random() > p * 0.7) continue;
        const y = W.floorY(x);
        if (y >= W.h - 2) continue;
        const t = W.get(x, y);
        if (t === M.BEDROCK) continue;
        pullDown(W, x, y);
        const below = W.get(x, y + 1);
        if (SOFT_TOP.has(t) && (below === M.SOIL || below === M.DIRT) && W.get(x, y) !== M.WATER) W.set(x, y + 1, t);
      }
    },

    flatten(W, cx, r, ty) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (x < 1 || x >= W.w - 1 || Math.random() > 0.5) continue;
        const y = W.floorY(x);
        if (y < ty) T.lower(W, x, 0);
        else if (y > ty + 1) T.raise(W, x, 0, W.get(x, y) === M.SAND ? 'sand' : W.get(x, y) === M.STONE ? 'stone' : 'soil');
      }
    },

    // Builds a mountain whose peak is at (x, peakY)
    mountain(W, x, peakY, opts = {}) {
      const mat = opts.mat || M.STONE;
      const rng = Math.random;
      const ground = W.floorY(U.clamp(x, 0, W.w - 1));
      const height = Math.max(6, ground - peakY);
      const half = Math.round(opts.half || Math.max(10, height * 1.25));
      const n = U.noise1D(U.rng((rng() * 1e9) | 0), 9, 2);
      const tops = [];
      for (let dx = -half; dx <= half; dx++) {
        const px = x + dx;
        if (px < 0 || px >= W.w) continue;
        const k = Math.pow(1 - Math.abs(dx) / half, opts.cone ? 1 : 1.3);
        const h = Math.round(k * height + (opts.cone ? 0 : (n(px) - 0.5) * height * 0.25 * k));
        const g = W.floorY(px);
        const top = Math.max(2, g - h);
        if (top >= g) continue;
        tops.push([px, top]);
        for (let y = top; y < g; y++) {
          let m = mat;
          if (!opts.cone) {
            if (y < top + 2 && top < W.h * 0.32) m = M.SNOW;
            else if (y === top && top > W.h * 0.5) m = M.GRASS;
            else if (y < top + 3 && top > W.h * 0.5) m = M.SOIL;
          } else if (y === top && Math.abs(dx) > 3) m = M.ASH;
          W.set(px, y, m);
        }
      }
      if (opts.cone) {
        // crater with vents
        const py = W.floorY(x);
        for (let dx = -2; dx <= 2; dx++) { W.set(x + dx, py, M.EMPTY); W.set(x + dx, py + 1, M.EMPTY); W.set(x + dx, py + 2, M.VENT); }
      } else {
        for (const [px, top] of tops) if (top > W.h * 0.42 && rng() < 0.06 && W.get(px, top) === M.GRASS) W.plant(px, top - 1, rng() < 0.6 ? 'pine' : 'spruce', rng);
      }
      W.quake = Math.max(W.quake, 30);
    },

    lake(W, x, r) {
      const rng = U.rng((Math.random() * 1e9) | 0);
      DS.Gen.pond(W, rng, U.clamp(Math.round(x), r + 2, W.w - r - 3), r, Math.max(3, Math.round(r * 0.45)), M.WATER, M.MUD);
      for (let i = 0; i < r / 2; i++) {
        const px = Math.round(x + U.rand(-r, r));
        const fy = W.floorY(px);
        if (W.get(px, fy - 1) === M.WATER) W.plant(px, fy - 1, rng() < 0.5 ? 'seaweed' : 'seagrass', rng);
      }
    },

    island(W, x, r) {
      for (let dx = -r; dx <= r; dx++) {
        const px = Math.round(x + dx);
        if (px < 1 || px >= W.w - 1) continue;
        const surf = W.groundY(px);
        if (!W.isLiquid(px, surf)) continue;
        const k = Math.sqrt(1 - (dx / (r + 0.5)) ** 2);
        const top = Math.round(surf - k * 4);
        const fy = W.floorY(px);
        for (let y = top; y < fy; y++) W.set(px, y, y < surf + 1 ? M.SAND : M.SOIL);
      }
      const s = W.floorY(Math.round(x));
      if (r > 5) W.plant(Math.round(x), s - 1, 'palm');
    },

    // plants a structure at the first suitable spot under (x, y)
    plantAt(W, x, y, kind, grow = true) {
      const aquatic = DS.Flora.aquatic.has(kind) || kind === 'lily';
      x = Math.round(x);
      if (x < 1 || x >= W.w - 1) return false;
      let yy = Math.max(1, Math.round(y));
      while (yy < W.h - 1 && !W.isSolid(x, yy) && !(kind === 'lily' && W.isLiquid(x, yy))) yy++;
      if (yy >= W.h - 1) return false;
      if (kind === 'lily') {
        if (!W.isLiquid(x, yy)) return false;
        W.plant(x, yy, 'lily', Math.random, true);
        return true;
      }
      const above = W.get(x, yy - 1);
      if (aquatic !== (MP.kind[above] === KL)) return false;
      if (!aquatic && above !== M.EMPTY && !MP.veg[above]) return false;
      if (grow) {
        W.set(x, yy - 1, aquatic ? M.SEAWEED : M.PLANT);
        W.addGrower(x, yy - 1, kind);
      } else W.plant(x, yy - 1, kind);
      return true;
    },
  };

  DS.Terrain = T;
})();
