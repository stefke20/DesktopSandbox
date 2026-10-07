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

  // ---- more trees ---------------------------------------------------------
  function trunk(out, h, mat = M.WOOD, thick = false, lean = 0) {
    let x = 0;
    for (let y = 0; y < h; y++) {
      if (lean && y > h / 3 && y % 4 === 0) x += lean;
      out.push([x, -y, mat]);
      if (thick) out.push([x + 1, -y, mat]);
    }
    return x;
  }

  B.birch = (rng) => {
    const out = [];
    const h = ri(rng, 9, 15);
    for (let y = 0; y < h; y++) out.push([0, -y, M.BIRCH, 0, y % 3 === 1 && rng() < 0.6 ? 2 : (rng() < 0.5 ? 0 : 1)]);
    const cy = -h - 1;
    out.push([0, cy + 2, M.BIRCH, M.LEAF], [0, cy, M.BIRCH, M.LEAF]);
    blob(out, 0, cy, ri(rng, 2, 3), ri(rng, 3, 5), M.LEAF, rng, 0.8);
    return out;
  };

  B.oak = (rng) => {
    const out = [];
    const h = ri(rng, 6, 10);
    trunk(out, h, M.WOOD, true);
    const cy = -h - 2;
    for (let i = -4; i <= 5; i++) out.push([i, cy + 2 - (Math.abs(i) > 2 ? 1 : 0), M.WOOD, 1]);
    blob(out, 0, cy, ri(rng, 6, 8), ri(rng, 3, 4), M.LEAF, rng);
    blob(out, ri(rng, -3, 3), cy - 3, ri(rng, 4, 5), 2, M.LEAF, rng);
    return out;
  };

  B.maple = (rng) => {
    const out = [];
    const h = ri(rng, 7, 11);
    trunk(out, h);
    const cy = -h - 3;
    const leaf = M.AUTUMN;
    for (let i = -2; i <= 2; i++) out.push([i, cy + 2, M.WOOD, leaf]);
    blob(out, 0, cy, ri(rng, 4, 6), ri(rng, 3, 5), leaf, rng);
    return out.map((e) => (e[2] === leaf ? [e[0], e[1], leaf, 0, (Math.abs(e[0] * 7 + e[1] * 3) % 4)] : e));
  };

  B.cherry = (rng) => {
    const out = [];
    const h = ri(rng, 5, 8);
    const tx = trunk(out, h, M.WOOD, false, rng() < 0.5 ? 1 : -1);
    const cy = -h - 2;
    for (let i = -3; i <= 3; i++) out.push([tx + i, cy + 2 + (Math.abs(i) > 1 ? -1 : 0), M.WOOD, M.BLOSSOM]);
    blob(out, tx, cy, ri(rng, 5, 7), ri(rng, 2, 3), M.BLOSSOM, rng);
    return out;
  };

  B.willow = (rng) => {
    const out = [];
    const h = ri(rng, 6, 9);
    trunk(out, h, M.WOOD, true);
    const cy = -h - 2;
    const rx = ri(rng, 5, 7);
    for (let i = -2; i <= 3; i++) out.push([i, cy + 1, M.WOOD, 1]);
    blob(out, 0, cy, rx, 2, M.LEAF, rng);
    for (let x = -rx; x <= rx; x++) {
      if (rng() < 0.3) continue;
      const len = ri(rng, 3, h);
      for (let i = 1; i <= len; i++) out.push([x, cy + 1 + i, M.VINE, 0, x % 2 ? 1 : 0]);
    }
    return out;
  };

  B.baobab = (rng) => {
    const out = [];
    const h = ri(rng, 8, 12);
    for (let y = 0; y < h; y++) {
      const wdt = y < h - 2 ? 2 : 1;
      for (let x = -wdt; x <= wdt + 1; x++) out.push([x, -y, M.WOOD, 0, 1]);
    }
    const top = -h;
    const arms = [[-4, -2], [-2, -3], [2, -3], [5, -2]];
    for (const [ax, ay] of arms) {
      for (let i = 0; i <= Math.abs(ax); i++) out.push([Math.sign(ax) * i + (ax > 0 ? 1 : 0), top + Math.round((ay * i) / Math.abs(ax)), M.WOOD, i === Math.abs(ax) ? 1 : 0, 1]);
      blob(out, ax + (ax > 0 ? 1 : 0), top + ay - 1, 2, 1, M.LEAF, rng, 0.7);
    }
    return out;
  };

  B.acacia = (rng) => {
    const out = [];
    const h = ri(rng, 6, 10);
    const tx = trunk(out, h, M.WOOD, false, rng() < 0.5 ? 1 : -1);
    const top = -h;
    for (let i = 1; i <= 3; i++) { out.push([tx - i, top - Math.floor(i / 2), M.WOOD, 1]); out.push([tx + i, top - Math.floor(i / 2), M.WOOD, 1]); }
    const rx = ri(rng, 6, 9);
    for (let x = -rx; x <= rx; x++) {
      const t = 1 + (Math.abs(x) < rx - 2 ? 1 : 0);
      for (let y = 0; y < t; y++) if (rng() < 0.9) out.push([tx + x, top - 2 - y, M.LEAF, 0, 2]);
    }
    return out;
  };

  B.joshua = (rng) => {
    const out = [];
    const h = ri(rng, 4, 7);
    trunk(out, h, M.WOOD, false);
    const tips = [];
    let n = ri(rng, 2, 4);
    for (let b = 0; b < n; b++) {
      let x = 0, y = -h + 1;
      const d = b % 2 ? 1 : -1;
      const len = ri(rng, 2, 4);
      for (let i = 0; i < len; i++) { x += d; y -= rng() < 0.6 ? 1 : 0; out.push([x, y, M.WOOD]); }
      tips.push([x, y - 1]);
    }
    tips.push([0, -h]);
    for (const [x, y] of tips) { out.push([x, y, M.NEEDLE], [x - 1, y, M.NEEDLE], [x + 1, y, M.NEEDLE], [x, y - 1, M.NEEDLE]); }
    return out;
  };

  B.pricklypear = (rng) => {
    const out = [];
    blob(out, 0, -1, 1, 1, M.CACTUS, rng, 1);
    blob(out, ri(rng, -2, 2), -3, 1, 1, M.CACTUS, rng, 1);
    if (rng() < 0.6) out.push([ri(rng, -1, 1), -5, M.FLOWER, 0, 1]);
    return out;
  };

  B.agave = (rng) => {
    const out = [];
    for (let i = -3; i <= 3; i++) {
      const len = 3 - Math.abs(i) + ri(rng, 0, 1);
      for (let y = 0; y < len; y++) out.push([i + Math.sign(i) * Math.floor(y / 2), -y, M.CACTUS, 0, 2]);
    }
    return out;
  };

  B.spruce = (rng) => {
    const out = [];
    const h = ri(rng, 12, 22);
    for (let y = 0; y < h; y++) out.push([0, -y, M.WOOD, y > 2 ? 2 : 0, 1]);
    for (let l = 0; l < h - 1; l++) {
      const y = -h + l;
      const wdt = Math.floor(l * 0.22) + (l % 3 === 2 ? 1 : 0);
      for (let dx = -wdt; dx <= wdt; dx++) if (dx || l === 0) out.push([dx, y, M.NEEDLE, 0, 2]);
    }
    return out;
  };

  B.cypress = (rng) => {
    const out = [];
    const h = ri(rng, 10, 16);
    for (let y = 0; y < h; y++) out.push([0, -y, M.WOOD, y > 3 ? 2 : 0]);
    out.push([-1, 0, M.WOOD], [1, 0, M.WOOD], [-2, 1, M.WOOD], [2, 1, M.WOOD]);
    for (let y = 3; y <= h + 1; y++) {
      const wdt = y > h - 1 ? 0 : 1;
      for (let dx = -wdt; dx <= wdt; dx++) if (dx) out.push([dx, -y, M.NEEDLE, 0, 3]);
    }
    for (let i = 0; i < 4; i++) {
      const sx = ri(rng, -1, 1) * 2, sy = -ri(rng, 4, h - 2);
      const len = ri(rng, 2, 5);
      for (let k = 1; k <= len; k++) out.push([sx, sy + k, M.VINE, 0, 3]);
    }
    return out;
  };

  B.fruittree = (rng) => {
    const out = B.tree(rng);
    const leaves = out.filter((e) => e[2] === M.LEAF);
    for (let i = 0; i < Math.max(3, leaves.length / 10); i++) {
      const l = leaves[Math.floor(rng() * leaves.length)];
      out.push([l[0], l[1], M.BERRY, 0, 0]);
    }
    return out;
  };

  B.berrybush = (rng) => {
    const out = B.bush(rng);
    const col = rng() < 0.5 ? 1 : 0;
    const extra = [];
    for (const e of out) if (e[2] === M.LEAF && rng() < 0.25) extra.push([e[0], e[1], M.BERRY, 0, col]);
    return out.concat(extra);
  };

  B.hedge = (rng) => {
    const out = [];
    const wdt = ri(rng, 3, 6), h = ri(rng, 2, 4);
    for (let y = 0; y < h; y++) for (let x = 0; x < wdt; x++) out.push([x, -y, M.LEAF, 0, 2]);
    return out;
  };

  B.bamboo = (rng) => {
    const out = [];
    const stalks = ri(rng, 2, 4);
    for (let s = 0; s < stalks; s++) {
      const x = s * 2 - stalks + 1;
      const h = ri(rng, 10, 22);
      for (let y = 0; y < h; y++) out.push([x, -y, M.BAMBOO, y > h - 4 ? M.LEAF : 0, y % 4 === 3 ? 3 : (y & 1)]);
      for (let k = 0; k < 3; k++) {
        const ly = -h + 1 + k * 3;
        const d = k % 2 ? 1 : -1;
        out.push([x + d, ly, M.LEAF], [x + d * 2, ly + 1, M.LEAF]);
      }
    }
    return out;
  };

  B.kelp = (rng) => {
    const out = [];
    const h = ri(rng, 12, 40);
    const ph = rng() * 6;
    for (let y = 0; y < h; y++) {
      const x = Math.round(Math.sin(y * 0.25 + ph) * 1.2);
      out.push([x, -y, M.KELP]);
      if (y % 3 === 1) out.push([x + (y % 6 === 1 ? 1 : -1), -y, M.KELP, 0, 3]);
    }
    return out;
  };

  B.seagrass = (rng) => {
    const out = [];
    for (let s = -2; s <= 2; s++) {
      const h = ri(rng, 1, 4);
      for (let y = 0; y < h; y++) out.push([s, -y, M.SEAWEED, 0, 2]);
    }
    return out;
  };

  B.anemone = (rng) => {
    const out = [];
    const shade = ri(rng, 0, 3);
    out.push([0, 0, M.CORAL, 0, shade], [-1, 0, M.CORAL, 0, shade], [1, 0, M.CORAL, 0, shade]);
    for (let i = -2; i <= 2; i++) out.push([i, -1 - (Math.abs(i) < 2 ? ri(rng, 0, 1) : 0), M.CORAL, 0, shade]);
    return out;
  };

  B.sunflower = (rng) => {
    const out = [];
    const h = ri(rng, 4, 7);
    for (let y = 0; y < h; y++) out.push([0, -y, M.PLANT, 0, 1]);
    out.push([-1, -2, M.LEAF], [1, -3, M.LEAF]);
    out.push([0, -h, M.WOOD, 0, 2], [-1, -h, M.FLOWER, 0, 1], [1, -h, M.FLOWER, 0, 1], [0, -h - 1, M.FLOWER, 0, 1], [0, -h + 1, M.FLOWER, 0, 1]);
    return out;
  };

  B.tallgrass = (rng) => {
    const out = [];
    for (let s = -1; s <= 1; s++) {
      if (rng() < 0.3) continue;
      const h = ri(rng, 2, 5);
      for (let y = 0; y < h; y++) out.push([s + (y > 2 && rng() < 0.4 ? s : 0), -y, M.TALLGRASS]);
    }
    if (!out.length) out.push([0, 0, M.TALLGRASS]);
    return out;
  };

  B.lavender = (rng) => {
    const out = [];
    for (let s = -1; s <= 1; s++) {
      const h = ri(rng, 2, 4);
      for (let y = 0; y < h; y++) out.push([s, -y, y < h - 2 ? M.PLANT : M.FLOWER, 0, y < h - 2 ? 1 : 2]);
    }
    return out;
  };

  B.tulip = (rng) => {
    const c = ri(rng, 0, 3);
    return [[0, 0, M.PLANT], [0, -1, M.PLANT], [-1, -1, M.LEAF], [0, -2, M.FLOWER, 0, c], [-1, -3, M.FLOWER, 0, c], [1, -3, M.FLOWER, 0, c]];
  };

  B.bigmushroom = (rng) => {
    const out = [];
    const h = ri(rng, 3, 6);
    for (let y = 0; y < h; y++) out.push([0, -y, M.FUNGUS, 0, 2]);
    const r = ri(rng, 2, 4);
    for (let x = -r; x <= r; x++) {
      out.push([x, -h, M.BERRY, 0, 0]);
      if (Math.abs(x) < r) out.push([x, -h - 1, M.BERRY, 0, Math.abs(x) % 3 === 1 ? 2 : 0]);
    }
    return out;
  };

  B.mangrove = (rng) => {
    const out = [];
    const h = ri(rng, 6, 9);
    for (let y = 3; y < h; y++) out.push([0, -y, M.WOOD]);
    for (const d of [-3, -2, -1, 1, 2, 3]) {
      for (let y = 0; y < 4; y++) out.push([Math.round((d * (3 - y)) / 3), -y, M.WOOD, 0, 1]);
    }
    blob(out, 0, -h - 2, ri(rng, 4, 6), 2, M.LEAF, rng);
    for (let i = -2; i <= 2; i++) out.push([i, -h, M.WOOD, 1]);
    return out;
  };

  B.cattail = (rng) => {
    const out = [];
    for (let s = -1; s <= 1; s += 2) {
      const h = ri(rng, 4, 7);
      for (let y = 0; y < h; y++) out.push([s, -y, M.PLANT, 0, 1]);
      out.push([s, -h, M.WOOD, 0, 2], [s, -h - 1, M.WOOD, 0, 2]);
    }
    out.push([0, 0, M.PLANT], [0, -1, M.PLANT], [0, -2, M.PLANT]);
    return out;
  };

  B.fern2 = (rng) => {
    // small forest-floor fern
    const out = [];
    for (let f = -2; f <= 2; f++) {
      const len = ri(rng, 2, 4);
      for (let i = 1; i <= len; i++) out.push([Math.round(f * i * 0.6), -Math.round(i * (1 - Math.abs(f) * 0.2)) + (i === len && f ? 1 : 0), M.PLANT, 0, 2]);
    }
    out.push([0, 0, M.PLANT, 0, 2]);
    return out;
  };


  B.datepalm = (rng) => {
    const out = B.palm(rng);
    const top = out.find((e) => e[2] === M.WOOD && e[3] === 1) || [0, -10];
    for (let i = -1; i <= 1; i++) out.push([top[0] + i, top[1] + 2, M.BERRY, 0, 2], [top[0] + i, top[1] + 3, M.BERRY, 0, 2]);
    return out;
  };

  B.juniper = (rng) => {
    const out = [];
    const h = ri(rng, 3, 6);
    let x = 0;
    for (let y = 0; y < h; y++) { if (rng() < 0.4) x += rng() < 0.5 ? -1 : 1; out.push([x, -y, M.WOOD, y === h - 1 ? 2 : 0]); }
    blob(out, x, -h - 1, ri(rng, 2, 3), 1, M.NEEDLE, rng, 0.8);
    blob(out, x + ri(rng, -2, 2), -h + 1, 2, 1, M.NEEDLE, rng, 0.7);
    return out;
  };

  B.tubeworm = (rng) => {
    const out = [];
    for (let s = -2; s <= 2; s++) {
      const h = ri(rng, 3, 9);
      for (let y = 0; y < h; y++) out.push([s, -y, M.FUNGUS, 0, 2]);
      out.push([s, -h, M.BERRY, 0, 0]);
    }
    return out;
  };

  // giant grass blade for the bug's-eye lawn
  B.blade = (rng) => {
    const out = [];
    const h = ri(rng, 25, 85);
    const bend = (rng() < 0.5 ? -1 : 1) * rng() * 0.25;
    const shade = ri(rng, 0, 3);
    for (let y = 0; y < h; y++) {
      const x = Math.round((bend * y * y) / h);
      out.push([x, -y, M.TALLGRASS, 0, shade]);
      if (y < h * 0.7) out.push([x + 1, -y, M.TALLGRASS, 0, (shade + 1) & 3]);
    }
    return out;
  };

  B.dandelion = (rng) => {
    const out = [];
    const h = ri(rng, 45, 90);
    for (let y = 0; y < h; y++) out.push([Math.round(Math.sin(y * 0.08) * 1.5), -y, M.PLANT, 0, 1]);
    const tx = Math.round(Math.sin(h * 0.08) * 1.5);
    const puff = rng() < 0.4;
    blob(out, tx, -h - 4, 5, 4, M.FLOWER, rng, 1);
    for (const e of out) if (e[2] === M.FLOWER) e[4] = puff ? 3 : 1;
    for (let i = 0; i < 6; i++) { const ly = -ri(rng, 1, 8), d = rng() < 0.5 ? -1 : 1; for (let k = 1; k <= 5; k++) out.push([d * k, ly - Math.floor(k / 2), M.LEAF]); }
    return out;
  };

  B.clover = (rng) => {
    const out = [];
    const h = ri(rng, 10, 26);
    for (let y = 0; y < h; y++) out.push([0, -y, M.PLANT, 0, 2]);
    for (const [dx, dy] of [[-4, -1], [4, -1], [0, -4]]) blob(out, dx, -h + dy, 3, 3, M.LEAF, rng, 1);
    if (rng() < 0.3) blob(out, 0, -h - 6, 2, 2, M.FLOWER, rng, 1);
    return out;
  };

  // names shown in the terrain/vegetation panel
  const LABELS = {
    tree: 'Tree', oak: 'Oak', birch: 'Birch', maple: 'Maple (autumn)', cherry: 'Cherry blossom', willow: 'Willow',
    fruittree: 'Apple tree', pine: 'Pine', spruce: 'Spruce', cypress: 'Swamp cypress', palm: 'Palm', jungle: 'Jungle giant',
    baobab: 'Baobab', acacia: 'Acacia', mangrove: 'Mangrove', bamboo: 'Bamboo', joshua: 'Joshua tree', deadtree: 'Dead tree',
    cactus: 'Saguaro', pricklypear: 'Prickly pear', agave: 'Agave', bush: 'Bush', berrybush: 'Berry bush', hedge: 'Hedge',
    deadbush: 'Dry shrub', fern: 'Giant fern', fern2: 'Fern', tuft: 'Grass tuft', tallgrass: 'Tall grass', flower: 'Wildflower',
    tulip: 'Tulip', lavender: 'Lavender', sunflower: 'Sunflower', reed: 'Reed', cattail: 'Cattail', mushroom: 'Mushroom',
    bigmushroom: 'Toadstool', datepalm: 'Date palm', juniper: 'Juniper', tubeworm: 'Tube worms', blade: 'Giant grass blade', dandelion: 'Giant dandelion', clover: 'Giant clover', lily: 'Lily pad', seaweed: 'Seaweed', seagrass: 'Seagrass', kelp: 'Kelp', coral: 'Coral', anemone: 'Anemone',
  };

  DS.Flora = {
    builders: B,
    labels: LABELS,
    aquatic: new Set(['seaweed', 'seagrass', 'kelp', 'coral', 'anemone', 'tubeworm']),

    build(kind, rng = Math.random) {
      const fn = B[kind] || B.tuft;
      return fn(rng);
    },
  };
})();
