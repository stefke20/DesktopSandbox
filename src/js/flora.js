// Plant structures. Each builder returns a list of cells relative to the
// base cell (0,0) which sits on top of the ground; dy is negative upward.
// Entry: [dx, dy, material, life, shade]  (life: for WOOD = foliage code to
// regrow: 1 leaf, 2 needle; shade: fixed colour variant or undefined).
(function () {
  'use strict';
  const DS = window.DS;
  const M = DS.M;

  const ri = (rng, a, b) => Math.floor(a + rng() * (b - a + 1));

  function blob(out, cx, cy, rx, ry, mat, rng, density = 0.92) {
    for (let dy = -ry; dy <= ry; dy++) {
      for (let dx = -rx; dx <= rx; dx++) {
        const d = (dx * dx) / (rx * rx + 0.01) + (dy * dy) / (ry * ry + 0.01);
        if (d <= 1 && (d < 0.6 || rng() < density)) out.push([cx + dx, cy + dy, mat]);
      }
    }
  }

  const B = {};

  B.tree = (rng) => {
    const out = [];
    const h = ri(rng, 6, 12);
    const thick = h > 9;
    for (let y = 0; y < h; y++) {
      out.push([0, -y, M.WOOD]);
      if (thick && y < h - 3) out.push([1, -y, M.WOOD]);
    }
    const rx = ri(rng, 3, 6), ry = ri(rng, 2, 4);
    const cy = -h - ry + 2;
    for (let i = -2; i <= 2; i++) out.push([i, cy + 1 + Math.abs(i) * -0.5 | 0, M.WOOD, 1]);
    out.push([0, cy, M.WOOD, 1]);
    blob(out, 0, cy, rx, ry, M.LEAF, rng);
    if (rng() < 0.5) blob(out, ri(rng, -2, 2), cy - ry + 1, rx - 1, ry - 1, M.LEAF, rng);
    return out;
  };

  B.bush = (rng) => {
    const out = [[0, 0, M.WOOD, 1]];
    blob(out, 0, -1, ri(rng, 2, 3), ri(rng, 1, 2), M.LEAF, rng, 0.85);
    return out;
  };

  B.pine = (rng) => {
    const out = [];
    const h = ri(rng, 9, 18);
    for (let y = 0; y < h; y++) out.push([0, -y, M.WOOD, y > 2 ? 2 : 0]);
    const top = -h - 1;
    out.push([0, top, M.NEEDLE]);
    const levels = h - 2;
    for (let l = 0; l < levels; l++) {
      const y = top + 1 + l;
      const tier = l % 4;
      const wdt = Math.floor(l * 0.32) + tier * 0.6 + 1;
      for (let dx = -Math.floor(wdt); dx <= Math.floor(wdt); dx++) {
        if (dx === 0 && l > 0) continue;
        out.push([dx, y, M.NEEDLE]);
      }
    }
    return out;
  };

  B.palm = (rng) => {
    const out = [];
    const h = ri(rng, 9, 15);
    const lean = rng() < 0.5 ? -1 : 1;
    let x = 0;
    for (let y = 0; y < h; y++) {
      x = Math.round(lean * (y * y) / (h * 4));
      out.push([x, -y, M.WOOD, y === h - 1 ? 1 : 0, y % 2]);
    }
    const tx = x, ty = -h;
    out.push([tx, ty, M.WOOD, 1]);
    out.push([tx - 1, ty + 1, M.WOOD, 0, 2], [tx + 1, ty + 1, M.WOOD, 0, 2]);
    const fronds = [[-1, -0.6], [1, -0.6], [-1, 0.1], [1, 0.1], [-0.4, -1]];
    for (const [fx, fy] of fronds) {
      const len = ri(rng, 4, 7);
      for (let i = 1; i <= len; i++) {
        const px = Math.round(tx + fx * i);
        const py = Math.round(ty + fy * i + (i * i) / (len * 1.6));
        out.push([px, py, M.LEAF]);
      }
    }
    return out;
  };

  B.cactus = (rng) => {
    const out = [];
    const h = ri(rng, 4, 9);
    for (let y = 0; y < h; y++) out.push([0, -y, M.CACTUS]);
    const arms = ri(rng, 0, 2);
    for (let a = 0; a < arms; a++) {
      const side = a === 0 ? -1 : 1;
      const ay = -ri(rng, 1, Math.max(1, h - 3));
      out.push([side, ay, M.CACTUS], [side * 2, ay, M.CACTUS]);
      const up = ri(rng, 1, 3);
      for (let u = 1; u <= up; u++) out.push([side * 2, ay - u, M.CACTUS]);
    }
    if (rng() < 0.3) out.push([0, -h, M.FLOWER, 0, rng() < 0.5 ? 0 : 1]);
    return out;
  };

  B.deadbush = (rng) => {
    const out = [[0, 0, M.WOOD]];
    for (let i = 0; i < 3; i++) {
      const dx = ri(rng, -1, 1);
      out.push([dx, -1, M.WOOD], [dx * 2, -2, M.WOOD]);
    }
    return out;
  };

  B.deadtree = (rng) => {
    const out = [];
    const h = ri(rng, 5, 10);
    for (let y = 0; y < h; y++) out.push([0, -y, M.WOOD]);
    const n = ri(rng, 2, 4);
    for (let b = 0; b < n; b++) {
      const by = -ri(rng, Math.floor(h / 2), h - 1);
      const side = rng() < 0.5 ? -1 : 1;
      const len = ri(rng, 2, 4);
      for (let i = 1; i <= len; i++) out.push([side * i, by - Math.floor(i / 2), M.WOOD]);
    }
    return out;
  };

  B.tuft = (rng) => {
    const out = [];
    const h = ri(rng, 1, 2);
    for (let y = 0; y < h; y++) out.push([0, -y, M.PLANT]);
    if (rng() < 0.5) out.push([rng() < 0.5 ? -1 : 1, 0, M.PLANT]);
    return out;
  };

  B.flower = (rng) => {
    const out = [];
    const h = ri(rng, 1, 3);
    for (let y = 0; y < h; y++) out.push([0, -y, M.PLANT]);
    const c = ri(rng, 0, 3);
    out.push([0, -h, M.FLOWER, 0, c]);
    if (rng() < 0.4) out.push([-1, -h + 1, M.FLOWER, 0, c], [1, -h + 1, M.FLOWER, 0, c]);
    return out;
  };

  B.reed = (rng) => {
    const out = [];
    const h = ri(rng, 3, 7);
    for (let y = 0; y < h; y++) out.push([0, -y, M.PLANT, 0, 1]);
    out.push([0, -h, M.WOOD, 0, 2], [0, -h - 1, M.WOOD, 0, 2]);
    return out;
  };

  B.seaweed = (rng) => {
    const out = [];
    const h = ri(rng, 3, 13);
    const ph = rng() * 6;
    for (let y = 0; y < h; y++) out.push([Math.round(Math.sin(y * 0.6 + ph) * 0.8), -y, M.SEAWEED]);
    return out;
  };

  B.coral = (rng) => {
    const out = [];
    const shade = ri(rng, 0, 3);
    const branches = ri(rng, 2, 4);
    for (let b = 0; b < branches; b++) {
      let x = 0;
      const h = ri(rng, 2, 6);
      const drift = rng() < 0.5 ? -1 : 1;
      for (let y = 0; y < h; y++) {
        if (rng() < 0.35) x += drift;
        out.push([x, -y, M.CORAL, 0, shade]);
      }
    }
    return out;
  };

  B.jungle = (rng) => {
    const out = [];
    const h = ri(rng, 16, 30);
    for (let y = 0; y < h; y++) {
      out.push([0, -y, M.WOOD], [1, -y, M.WOOD]);
    }
    out.push([-1, 0, M.WOOD], [2, 0, M.WOOD], [-2, 1, M.WOOD], [3, 1, M.WOOD]);
    const rx = ri(rng, 6, 10), ry = ri(rng, 3, 5);
    const cy = -h - 1;
    for (let i = -rx + 2; i <= rx - 2; i++) out.push([i, cy + 1, M.WOOD, 1]);
    blob(out, 0, cy - 1, rx, ry, M.LEAF, rng);
    blob(out, ri(rng, -3, 3), cy - ry, rx - 2, ry - 1, M.LEAF, rng);
    // hanging vines
    const vines = ri(rng, 2, 5);
    for (let v = 0; v < vines; v++) {
      const vx = ri(rng, -rx + 1, rx - 1);
      if (vx === 0 || vx === 1) continue;
      const len = ri(rng, 3, 12);
      for (let i = 0; i < len; i++) out.push([vx, cy + ry - 1 + i, M.VINE]);
    }
    // a lower side branch
    const side = rng() < 0.5 ? -1 : 2;
    const by = -Math.floor(h * 0.55);
    const dir = side < 0 ? -1 : 1;
    for (let i = 1; i <= 4; i++) out.push([side + dir * i, by - Math.floor(i / 2), M.WOOD, 1]);
    blob(out, side + dir * 5, by - 3, 3, 2, M.LEAF, rng);
    return out;
  };

  B.fern = (rng) => {
    // giant prehistoric fern / cycad
    const out = [];
    const h = ri(rng, 2, 6);
    for (let y = 0; y < h; y++) out.push([0, -y, M.WOOD, y === h - 1 ? 1 : 0, 1]);
    const n = ri(rng, 4, 6);
    for (let f = 0; f < n; f++) {
      const ang = -Math.PI / 2 + (f - (n - 1) / 2) * 0.55;
      const len = ri(rng, 4, 8);
      for (let i = 1; i <= len; i++) {
        const px = Math.round(Math.cos(ang) * i);
        const py = Math.round(-h + Math.sin(ang) * i + (i * i) / (len * 2.2));
        out.push([px, py, M.LEAF, 0, 3]);
      }
    }
    return out;
  };

  B.mushroom = (rng) => {
    const out = [[0, 0, M.FUNGUS], [0, -1, M.FUNGUS]];
    blob(out, 0, -2, 2, 1, M.FUNGUS, rng, 1);
    return out;
  };

  B.lily = () => [[0, 0, M.LILY], [1, 0, M.LILY], [-1, 0, M.LILY, 0, 2]];

  DS.Flora = {
    builders: B,
    build(kind, rng = Math.random) {
      const fn = B[kind] || B.tuft;
      return fn(rng);
    },
  };
})();
