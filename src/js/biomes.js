// Biome definitions and terrain generators.
(function () {
  'use strict';
  const DS = window.DS;
  const { U, M, MP } = DS;

  // ---------------------------------------------------------------- helpers
  const G = {
    heights(W, rng, base, amp, scale = 60, oct = 3) {
      const n = U.noise1D(rng, scale, oct);
      const tops = new Int16Array(W.w);
      for (let x = 0; x < W.w; x++) tops[x] = Math.round(W.h * base - (n(x) - 0.5) * 2 * amp * W.h);
      return tops;
    },
    column(W, x, top, layers, fill = M.STONE) {
      let y = Math.max(0, top);
      for (const [mat, th] of layers) for (let k = 0; k < th && y < W.h - 1; k++) W.set(x, y++, mat);
      while (y < W.h - 1) W.set(x, y++, fill);
      W.set(x, W.h - 1, M.BEDROCK);
    },
    floor(W, x) { return W.floorY(x); },
    surf(W, x) {
      let y = 0;
      while (y < W.h && W.get(x, y) === M.EMPTY) y++;
      return y;
    },
    pond(W, rng, cx, r, depth, liquid = M.WATER, bottom = M.MUD) {
      cx = U.clamp(cx, r + 1, W.w - r - 2);
      const level = Math.max(G.surf(W, cx - r), G.surf(W, cx + r)) + 1;
      for (let x = cx - r; x <= cx + r; x++) {
        const k = 1 - ((x - cx) / r) ** 2;
        const d = Math.round(depth * Math.sqrt(Math.max(0, k)));
        if (d <= 0) continue;
        const s = G.surf(W, x);
        for (let y = Math.min(s, level); y < level + d; y++) W.set(x, y, M.EMPTY);
        for (let y = level + d; y < level + d + 2; y++) if (W.get(x, y) !== M.BEDROCK) W.set(x, y, bottom);
        for (let y = level; y < level + d; y++) W.set(x, y, liquid);
      }
      return level;
    },
    scatter(W, rng, kind, count, ok, opts = {}) {
      const x0 = opts.x0 == null ? 2 : opts.x0, x1 = opts.x1 == null ? W.w - 3 : opts.x1;
      let placed = 0;
      for (let k = 0; k < count * 5 && placed < count; k++) {
        const x = Math.floor(x0 + rng() * (x1 - x0));
        const y = opts.floor ? W.floorY(x) : G.surf(W, x);
        if (y >= W.h - 1 || y < 3) continue;
        const t = W.get(x, y);
        if (!ok.includes(t)) continue;
        if (opts.gap && G.near(W, x, y - 2, opts.gap, M.WOOD)) continue;
        W.plant(x, y - 1, kind, rng, opts.overwrite);
        placed++;
      }
    },
    near(W, x, y, r, mat) {
      for (let dx = -r; dx <= r; dx++) for (let dy = -3; dy <= 0; dy++) if (W.get(x + dx, y + dy) === mat) return true;
      return false;
    },
    blob(W, cx, cy, rx, ry, mat, rng, onlyOver = null) {
      for (let dy = -ry; dy <= ry; dy++)
        for (let dx = -rx; dx <= rx; dx++) {
          const d = (dx * dx) / (rx * rx + 0.3) + (dy * dy) / (ry * ry + 0.3);
          if (d > 1 || (d > 0.7 && rng() < 0.5)) continue;
          const x = cx + dx, y = cy + dy;
          if (!W.inb(x, y) || W.get(x, y) === M.BEDROCK) continue;
          if (onlyOver && !onlyOver.includes(W.get(x, y))) continue;
          W.set(x, y, mat);
        }
    },
    boulders(W, rng, n, mat = M.STONE) {
      for (let i = 0; i < n; i++) {
        const x = Math.floor(rng() * W.w);
        const y = G.surf(W, x);
        if (W.isLiquid(x, y)) continue;
        G.blob(W, x, y, 1 + Math.floor(rng() * 3), 1 + Math.floor(rng() * 2), mat, rng);
      }
    },
    litter(W, rng, n) {
      for (let i = 0; i < n; i++) {
        const x = Math.floor(rng() * W.w);
        const y = G.surf(W, x);
        if (y > 0 && !W.isLiquid(x, y) && W.get(x, y - 1) === M.EMPTY) W.set(x, y - 1, M.LITTER);
      }
    },
  };

  const SKY = {
    temperate: { day: ['#5fa8e8', '#cfe9f7'], dusk: ['#3a4a8a', '#f4a46a'], night: ['#060a1c', '#18213f'] },
    desert: { day: ['#4a9ae0', '#f0dcb0'], dusk: ['#5a3a7a', '#ff9a4a'], night: ['#0a0a1e', '#2a1e30'] },
    cold: { day: ['#7ab4e8', '#e4f0fa'], dusk: ['#4a4a8a', '#f0b0c0'], night: ['#040818', '#101a34'] },
    jungle: { day: ['#6ab0d8', '#d8f0e0'], dusk: ['#3a3a6a', '#f0a06a'], night: ['#040c12', '#10221e'] },
    apoc: { day: ['#9a8e74', '#d8c09a'], dusk: ['#6a3a2a', '#e07a3a'], night: ['#120c0a', '#2a1a14'] },
    prehistoric: { day: ['#d8946a', '#f8d8a0'], dusk: ['#7a2a2a', '#ff8a3a'], night: ['#100808', '#2a1410'] },
    sea: { day: ['#3a90e0', '#bfe4fa'], dusk: ['#3a3a7a', '#f8a070'], night: ['#040a1e', '#122040'] },
  };

  const B = [];
  const add = (b) => B.push(b);

  // ------------------------------------------------------------------ Grasslands
  add({
    id: 'grasslands', name: 'Grasslands', icon: '🌾', temp: 16,
    water: ['#4a90d9', '#123a6a'],
    bg: { sky: SKY.temperate, layers: [
      { type: 'mountains', color: '#8aa0c0', y: 0.48, amp: 0.14, scale: 90, haze: 0.6, snowcap: 0.3 },
      { type: 'hills', color: '#6a9a5a', y: 0.58, amp: 0.06, scale: 70, haze: 0.45 },
      { type: 'trees', color: '#3e6e3a', y: 0.63, amp: 0.03, scale: 30, haze: 0.3 },
    ] },
    weather: { clear: 5, cloudy: 3, rain: 2, storm: 0.6, fog: 0.6 },
    seeds: [['tree', 1], ['bush', 2], ['flower', 4], ['tuft', 4]], tufts: ['tuft', 'tuft', 'flower'],
    fauna: [['rabbit', 8], ['fox', 2], ['bison', 4], ['deer', 3], ['songbird', 5], ['butterfly', 7], ['mouse', 4], ['beetle', 3], ['owl', 1], ['firefly', 14]],
    gen(W, rng) {
      const tops = G.heights(W, rng, 0.68, 0.08, 90);
      for (let x = 0; x < W.w; x++) G.column(W, x, tops[x], [[M.GRASS, 1], [M.DIRT, 3], [M.SOIL, 9 + ((x * 7) % 3)]]);
      if (rng() < 0.75) G.pond(W, rng, Math.floor(W.w * (0.2 + rng() * 0.6)), 10 + Math.floor(rng() * 10), 4 + Math.floor(rng() * 3));
      G.boulders(W, rng, W.w / 90);
      G.scatter(W, rng, 'tree', W.w / 45, [M.GRASS], { gap: 6 });
      G.scatter(W, rng, 'bush', W.w / 30, [M.GRASS]);
      G.scatter(W, rng, 'flower', W.w / 5, [M.GRASS]);
      G.scatter(W, rng, 'tuft', W.w / 3, [M.GRASS]);
    },
  });

  // ------------------------------------------------------------------ Desert
  add({
    id: 'desert', name: 'Desert', icon: '🏜️', temp: 34,
    water: ['#4ab0c8', '#1a5a6a'],
    bg: { sky: SKY.desert, sun: '#fff8d8', layers: [
      { type: 'mesa', color: '#c87a4a', y: 0.55, amp: 0.16, scale: 70, haze: 0.5 },
      { type: 'dunes', color: '#e0b878', y: 0.64, amp: 0.06, scale: 60, haze: 0.35 },
    ] },
    weather: { clear: 8, cloudy: 1, sandstorm: 1.2, storm: 0.2 },
    seeds: [['cactus', 2], ['deadbush', 2], ['tuft', 1]], tufts: ['tuft'], fertility: 0.3,
    fauna: [['camel', 3], ['lizard', 5], ['scorpion', 3], ['snake', 2], ['vulture', 2], ['beetle', 4], ['tumbleweed', 2], ['mouse', 3], ['moth', 6]],
    gen(W, rng) {
      const n = U.noise1D(rng, 50, 3);
      const ph = rng() * 6;
      for (let x = 0; x < W.w; x++) {
        const top = Math.round(W.h * 0.7 - (Math.sin(x / (W.w * 0.07) + ph) * 0.5 + 0.5) * W.h * 0.07 - n(x) * W.h * 0.06);
        G.column(W, x, top, [[M.SAND, 9 + Math.floor(n(x * 3) * 6)]], M.SANDSTONE);
      }
      if (rng() < 0.6) {
        const x0 = Math.floor(rng() * (W.w - 40)), wd = 18 + Math.floor(rng() * 25), hh = 6 + Math.floor(rng() * 10);
        for (let x = x0; x < x0 + wd; x++) {
          const s = G.surf(W, x);
          const edge = Math.min(x - x0, x0 + wd - 1 - x);
          const top = s - Math.min(hh, edge * 2 + 1);
          for (let y = top; y < s; y++) W.set(x, y, M.SANDSTONE);
        }
      }
      if (rng() < 0.5) {
        const cx = Math.floor(W.w * (0.2 + rng() * 0.6));
        G.pond(W, rng, cx, 9, 3, M.WATER, M.MUD);
        G.scatter(W, rng, 'palm', 3, [M.SAND, M.MUD], { x0: cx - 18, x1: cx + 18, gap: 3 });
        G.scatter(W, rng, 'tuft', 8, [M.SAND, M.MUD], { x0: cx - 14, x1: cx + 14 });
      }
      G.scatter(W, rng, 'cactus', W.w / 28, [M.SAND], { gap: 3 });
      G.scatter(W, rng, 'deadbush', W.w / 30, [M.SAND]);
      G.scatter(W, rng, 'tuft', W.w / 50, [M.SAND]);
    },
  });

  // ------------------------------------------------------------------ Lake
  add({
    id: 'lake', name: 'Lake', icon: '🏞️', temp: 15,
    water: ['#4a98c8', '#0e3a4a'],
    bg: { sky: SKY.temperate, layers: [
      { type: 'mountains', color: '#7a90b0', y: 0.46, amp: 0.15, scale: 80, haze: 0.6, snowcap: 0.28 },
      { type: 'pines', color: '#2e5a46', y: 0.56, amp: 0.05, scale: 40, haze: 0.35 },
    ] },
    weather: { clear: 4, cloudy: 3, rain: 2, storm: 0.6, fog: 1.2 },
    seeds: [['tree', 2], ['bush', 2], ['reed', 2], ['flower', 3], ['tuft', 3]], tufts: ['tuft', 'flower', 'reed'],
    fauna: [['smallfish', 14], ['bass', 3], ['duck', 5], ['frog', 6], ['heron', 2], ['dragonfly', 6], ['turtle', 2], ['songbird', 3], ['butterfly', 3], ['firefly', 14], ['bat', 3]],
    gen(W, rng) {
      const level = Math.round(W.h * 0.58);
      const n = U.noise1D(rng, 40, 3);
      const c = 0.5 + (rng() - 0.5) * 0.15;
      const tops = new Int16Array(W.w);
      for (let x = 0; x < W.w; x++) {
        const f = x / W.w;
        const bowl = Math.max(0, 1 - ((f - c) / 0.33) ** 2);
        tops[x] = Math.round(level - 3 - n(x) * W.h * 0.07 + Math.pow(bowl, 0.7) * W.h * 0.32);
        const under = tops[x] >= level;
        G.column(W, x, tops[x], under ? [[rng() < 0.5 ? M.SAND : M.MUD, 2], [M.SOIL, 5]] : [[M.GRASS, 1], [M.DIRT, 3], [M.SOIL, 6]]);
        for (let y = level; y < tops[x]; y++) W.set(x, y, M.WATER);
      }
      for (let x = 2; x < W.w - 2; x++) {
        if (tops[x] >= level - 1 && tops[x] <= level + 2 && rng() < 0.45) W.plant(x, Math.min(tops[x], level) - 1, 'reed', rng, true);
        if (tops[x] > level + 4 && rng() < 0.05) for (let k = 0; k < 3; k++) if (W.get(x + k, level) === M.WATER) W.set(x + k, level, M.LILY, 0, k === 1 && rng() < 0.3 ? 2 : 0);
      }
      G.scatter(W, rng, 'seaweed', W.w / 10, [M.SAND, M.MUD], { floor: true });
      G.scatter(W, rng, 'tree', W.w / 45, [M.GRASS], { gap: 5 });
      G.scatter(W, rng, 'bush', W.w / 35, [M.GRASS]);
      G.scatter(W, rng, 'flower', W.w / 8, [M.GRASS]);
      G.scatter(W, rng, 'tuft', W.w / 4, [M.GRASS]);
    },
  });

  // ------------------------------------------------------------------ Sea
  add({
    id: 'sea', name: 'Open Sea', icon: '🌊', temp: 20,
    water: ['#3a8ad8', '#06183a'],
    bg: { sky: SKY.sea, layers: [{ type: 'flat', color: '#2a6ab0', y: 0.22, haze: 0.4 }] },
    weather: { clear: 5, cloudy: 3, rain: 1.5, storm: 1, fog: 0.6 },
    seeds: [['seaweed', 3], ['coral', 1]], tufts: ['tuft'],
    fauna: [['smallfish', 26], ['clownfish', 6], ['tuna', 6], ['shark', 2], ['jellyfish', 5], ['whale', 1], ['dolphin', 3], ['crab', 4], ['octopus', 2], ['seagull', 4], ['turtle', 2]],
    gen(W, rng) {
      const level = Math.round(W.h * 0.22);
      const n = U.noise1D(rng, 45, 4);
      for (let x = 0; x < W.w; x++) {
        const bed = Math.round(W.h * 0.8 + (n(x) - 0.5) * W.h * 0.3);
        G.column(W, x, bed, [[M.SAND, 3 + Math.floor(n(x * 2) * 3)]]);
        for (let y = level; y < bed; y++) W.set(x, y, M.WATER);
      }
      for (let i = 0; i < W.w / 60; i++) {
        const x = Math.floor(rng() * W.w);
        const y = W.floorY(x);
        G.blob(W, x, y, 2 + Math.floor(rng() * 4), 2 + Math.floor(rng() * 4), M.STONE, rng, [M.WATER, M.SAND]);
      }
      if (rng() < 0.4) {
        // a little rock island
        const cx = Math.floor(W.w * (0.15 + rng() * 0.7)), r = 8 + Math.floor(rng() * 6);
        for (let x = cx - r; x <= cx + r; x++) {
          const k = 1 - ((x - cx) / r) ** 2;
          const top = Math.round(level - k * 5);
          const s = G.surf(W, x);
          for (let y = top; y < s; y++) if (W.inb(x, y)) W.set(x, y, y < level + 1 ? M.SAND : M.STONE);
        }
        W.plant(cx, Math.round(level - 6), 'palm', rng);
      }
      G.scatter(W, rng, 'seaweed', W.w / 5, [M.SAND, M.STONE], { floor: true });
      G.scatter(W, rng, 'coral', W.w / 9, [M.SAND, M.STONE], { floor: true });
    },
  });

  // ------------------------------------------------------------------ Beach
  add({
    id: 'beach', name: 'Beach', icon: '🏖️', temp: 26,
    water: ['#3ac0d8', '#0a3a6a'],
    bg: { sky: SKY.sea, layers: [{ type: 'flat', color: '#2a7ab8', y: 0.55, haze: 0.4 }, { type: 'hills', color: '#5a8a5a', y: 0.52, amp: 0.05, scale: 60, haze: 0.5, cut: 0.4 }] },
    weather: { clear: 7, cloudy: 2, rain: 1, storm: 0.5 },
    seeds: [['palm', 1], ['tuft', 3]], tufts: ['tuft'],
    fauna: [['crab', 6], ['seagull', 5], ['turtle', 2], ['smallfish', 12], ['person', 3], ['dolphin', 2], ['jellyfish', 2]],
    gen(W, rng) {
      const level = Math.round(W.h * 0.62);
      const n = U.noise1D(rng, 30, 3);
      const flip = rng() < 0.5;
      for (let xx = 0; xx < W.w; xx++) {
        const x = flip ? W.w - 1 - xx : xx;
        const f = xx / W.w;
        const land = W.h * 0.54 + f * W.h * 0.12;
        const sea = W.h * 0.92;
        const top = Math.round(U.lerp(land, sea, U.smoothstep(0.4, 0.8, f)) + (n(x) - 0.5) * 4);
        G.column(W, x, top, [[M.SAND, 8 + Math.floor(n(x * 3) * 5)]]);
        for (let y = level; y < top; y++) W.set(x, y, M.WATER);
      }
      const landX0 = flip ? Math.floor(W.w * 0.62) : 2, landX1 = flip ? W.w - 3 : Math.floor(W.w * 0.38);
      G.scatter(W, rng, 'palm', Math.max(2, W.w / 50), [M.SAND], { x0: landX0, x1: landX1, gap: 6 });
      G.scatter(W, rng, 'tuft', W.w / 25, [M.SAND], { x0: landX0, x1: landX1 });
      G.scatter(W, rng, 'seaweed', W.w / 12, [M.SAND], { floor: true, x0: flip ? 2 : Math.floor(W.w * 0.55), x1: flip ? Math.floor(W.w * 0.45) : W.w - 3 });
      G.boulders(W, rng, W.w / 100);
    },
  });

  // ------------------------------------------------------------------ Taiga
  add({
    id: 'taiga', name: 'Taiga', icon: '🌲', temp: 4,
    water: ['#4a88b8', '#0e2a40'],
    bg: { sky: SKY.cold, layers: [
      { type: 'mountains', color: '#8090a8', y: 0.44, amp: 0.15, scale: 80, haze: 0.6, snowcap: 0.33 },
      { type: 'pines', color: '#2a4a40', y: 0.52, amp: 0.06, scale: 50, haze: 0.45 },
      { type: 'pines', color: '#1e3a30', y: 0.6, amp: 0.05, scale: 40, haze: 0.3 },
    ] },
    weather: { clear: 3, cloudy: 3, rain: 2, snow: 1.5, fog: 1.2, storm: 0.3 },
    seeds: [['pine', 4], ['tree', 1], ['bush', 1], ['mushroom', 1], ['tuft', 2]], tufts: ['tuft'], leafFall: 0.00001,
    fauna: [['moose', 2], ['wolf', 3], ['bear', 1], ['rabbit', 5], ['deer', 3], ['owl', 1], ['songbird', 3], ['squirrel', 3], ['mouse', 3], ['firefly', 6]],
    gen(W, rng) {
      const tops = G.heights(W, rng, 0.64, 0.1, 70);
      for (let x = 0; x < W.w; x++) G.column(W, x, tops[x], [[M.GRASS, 1], [M.DIRT, 3], [M.SOIL, 6 + ((x * 13) % 4)]]);
      if (rng() < 0.4) G.pond(W, rng, Math.floor(W.w * (0.2 + rng() * 0.6)), 9, 4);
      G.boulders(W, rng, W.w / 50);
      G.scatter(W, rng, 'pine', W.w / 9, [M.GRASS], { gap: 3 });
      G.scatter(W, rng, 'tree', W.w / 70, [M.GRASS], { gap: 4 });
      G.scatter(W, rng, 'mushroom', W.w / 60, [M.GRASS]);
      G.scatter(W, rng, 'tuft', W.w / 6, [M.GRASS]);
      W.dustSnow(0.25, rng);
    },
  });

  // ------------------------------------------------------------------ Snowy hills
  add({
    id: 'snowy', name: 'Snowy Hills', icon: '❄️', temp: -6,
    water: ['#5a98c8', '#14304a'],
    bg: { sky: SKY.cold, layers: [
      { type: 'mountains', color: '#b8c8e0', y: 0.46, amp: 0.14, scale: 90, haze: 0.5, snowcap: 0.5 },
      { type: 'hills', color: '#dce6f2', y: 0.56, amp: 0.07, scale: 70, haze: 0.35 },
      { type: 'pines', color: '#3a5a58', y: 0.62, amp: 0.04, scale: 40, haze: 0.3 },
    ] },
    weather: { clear: 3, cloudy: 3, snow: 4, fog: 1 },
    seeds: [['pine', 4], ['deadbush', 1]], tufts: ['tuft'], fertility: 0.4,
    fauna: [['snowhare', 6], ['arcticfox', 2], ['reindeer', 4], ['snowyowl', 1], ['ptarmigan', 4], ['wolf', 2], ['mouse', 2]],
    gen(W, rng) {
      const tops = G.heights(W, rng, 0.64, 0.13, 100);
      for (let x = 0; x < W.w; x++) G.column(W, x, tops[x], [[M.SNOW, 3], [M.DIRT, 2], [M.SOIL, 7]]);
      if (rng() < 0.7) {
        const cx = Math.floor(W.w * (0.2 + rng() * 0.6));
        const lvl = G.pond(W, rng, cx, 12, 4, M.WATER, M.SOIL);
        for (let x = cx - 12; x <= cx + 12; x++) if (W.get(x, lvl) === M.WATER) W.set(x, lvl, M.ICE);
      }
      G.scatter(W, rng, 'pine', W.w / 12, [M.SNOW], { gap: 3 });
      G.scatter(W, rng, 'deadtree', W.w / 120, [M.SNOW]);
      G.boulders(W, rng, W.w / 80);
      W.dustSnow(1, rng);
    },
  });

  // ------------------------------------------------------------------ Mountain
  add({
    id: 'mountain', name: 'Mountains', icon: '🏔️', temp: 6, lapse: 22,
    water: ['#4a98c8', '#0e2a48'],
    bg: { sky: SKY.cold, layers: [
      { type: 'mountains', color: '#9aa8c8', y: 0.42, amp: 0.2, scale: 70, haze: 0.6, snowcap: 0.3 },
      { type: 'mountains', color: '#6a7898', y: 0.52, amp: 0.16, scale: 50, haze: 0.4, snowcap: 0.38 },
    ] },
    weather: { clear: 4, cloudy: 3, snow: 2, rain: 1, storm: 0.6, fog: 1 },
    seeds: [['pine', 3], ['tuft', 2], ['flower', 1]], tufts: ['tuft', 'flower'], fertility: 0.6,
    fauna: [['goat', 6], ['eagle', 2], ['marmot', 5], ['songbird', 2], ['wolf', 1], ['butterfly', 2]],
    gen(W, rng) {
      const n = U.noise1D(rng, 60, 4);
      const n2 = U.noise1D(rng, 14, 2);
      for (let x = 0; x < W.w; x++) {
        const v = U.clamp((n(x) - 0.28) / 0.44, 0, 1);
        const ridge = 1 - Math.abs(2 * U.clamp((n(x * 1.7 + 300) - 0.2) / 0.6, 0, 1) - 1);
        let top = Math.round(W.h * 0.9 - Math.pow(v, 1.3) * W.h * 0.62 - ridge * W.h * 0.12 - n2(x) * 4);
        top = U.clamp(top, 6, W.h - 6);
        const f = top / W.h;
        let layers;
        if (f < 0.32) layers = [[M.SNOW, 3], [M.STONE, 2]];
        else if (f < 0.55) layers = [[M.STONE, 3]];
        else layers = [[M.GRASS, 1], [M.DIRT, 2], [M.SOIL, 5]];
        G.column(W, x, top, layers);
      }
      // grass patches on gentler stone slopes
      for (let x = 1; x < W.w - 1; x++) {
        const y = G.surf(W, x);
        if (W.get(x, y) === M.STONE && y / W.h > 0.42 && Math.abs(G.surf(W, x - 1) - G.surf(W, x + 1)) < 2 && rng() < 0.6) W.set(x, y, M.GRASS);
      }
      G.scatter(W, rng, 'pine', W.w / 14, [M.GRASS], { gap: 2 });
      G.scatter(W, rng, 'tuft', W.w / 6, [M.GRASS]);
      G.scatter(W, rng, 'flower', W.w / 12, [M.GRASS]);
      G.boulders(W, rng, W.w / 40);
      for (let x = 0; x < W.w; x++) {
        const y = G.surf(W, x);
        if (y / W.h < 0.36) W.set(x, y - 1, M.SNOW);
      }
    },
  });

  // ------------------------------------------------------------------ Arctic
  add({
    id: 'arctic', name: 'Arctic', icon: '🐧', temp: -12,
    water: ['#3a7ab0', '#061a30'],
    bg: { sky: SKY.cold, aurora: true, layers: [
      { type: 'ice', color: '#d8e8f4', y: 0.52, amp: 0.12, scale: 40, haze: 0.4 },
      { type: 'flat', color: '#2a5a88', y: 0.55, haze: 0.4 },
    ] },
    weather: { clear: 3, cloudy: 2, snow: 4, fog: 1 },
    seeds: [['tuft', 1]], tufts: ['tuft'], fertility: 0.1,
    fauna: [['polarbear', 2], ['penguin', 10], ['seal', 5], ['cod', 16], ['orca', 1], ['snowyowl', 1], ['arcticfox', 1]],
    gen(W, rng) {
      const level = Math.round(W.h * 0.55);
      const n = U.noise1D(rng, 40, 3);
      const flip = rng() < 0.5;
      const left = W.w * (0.25 + rng() * 0.1), right = W.w * (0.82 + rng() * 0.08);
      for (let xx = 0; xx < W.w; xx++) {
        const x = flip ? W.w - 1 - xx : xx;
        const bed = Math.round(W.h * 0.88 + (n(x * 2) - 0.5) * W.h * 0.12);
        G.column(W, x, bed, [[M.SAND, 2]]);
        const shelf = xx < left || xx > right;
        if (shelf) {
          const top = Math.round(level - 4 - n(x) * 7 - (xx < left ? (left - xx) * 0.08 : (xx - right) * 0.1));
          for (let y = top; y < level + 4; y++) W.set(x, y, M.ICE);
          for (let y = level + 4; y < bed; y++) W.set(x, y, M.WATER);
        } else {
          for (let y = level; y < bed; y++) W.set(x, y, M.WATER);
        }
      }
      // floating floes
      let x = Math.round(left) + 8;
      while (x < right - 10) {
        const wd = 5 + Math.floor(rng() * 10);
        if (rng() < 0.6) {
          for (let k = 0; k < wd; k++) {
            const cx = flip ? W.w - 1 - (x + k) : x + k;
            W.set(cx, level, M.ICE);
            W.set(cx, level + 1, M.ICE);
            W.set(cx, level - 1, M.ICE);
          }
        }
        x += wd + 6 + Math.floor(rng() * 14);
      }
      for (let i = 0; i < W.w / 40; i++) {
        const cx = Math.floor(rng() * W.w);
        const s = G.surf(W, cx);
        if (W.get(cx, s) === M.ICE) G.blob(W, cx, s - 1, 2 + Math.floor(rng() * 3), 2, M.ICE, rng, [M.EMPTY]);
      }
      W.dustSnow(1, rng);
      W.dustSnow(0.7, rng);
    },
  });

  // ------------------------------------------------------------------ Rainforest
  add({
    id: 'rainforest', name: 'Rainforest', icon: '🦜', temp: 27,
    water: ['#5a9a7a', '#123a2a'],
    bg: { sky: SKY.jungle, layers: [
      { type: 'hills', color: '#4a7a6a', y: 0.45, amp: 0.1, scale: 60, haze: 0.6 },
      { type: 'jungle', color: '#2a5a3a', y: 0.5, amp: 0.1, scale: 30, haze: 0.4 },
      { type: 'jungle', color: '#1a4228', y: 0.58, amp: 0.08, scale: 25, haze: 0.2 },
    ] },
    weather: { cloudy: 3, rain: 4, storm: 1.5, fog: 2, clear: 2 },
    seeds: [['jungle', 1], ['fern', 2], ['bush', 2], ['flower', 2], ['tuft', 2]], tufts: ['tuft', 'flower', 'fern'], fertility: 1.6,
    fauna: [['monkey', 6], ['parrot', 5], ['toucan', 3], ['jaguar', 1], ['poisonfrog', 5], ['treesnake', 2], ['capybara', 3], ['morpho', 6], ['smallfish', 6], ['firefly', 12], ['bat', 5]],
    gen(W, rng) {
      const tops = G.heights(W, rng, 0.7, 0.08, 60);
      for (let x = 0; x < W.w; x++) G.column(W, x, tops[x], [[M.GRASS, 1], [M.DIRT, 2], [M.SOIL, 8]]);
      G.pond(W, rng, Math.floor(W.w * (0.3 + rng() * 0.4)), Math.floor(W.w * 0.08) + 8, 6, M.WATER, M.MUD);
      G.scatter(W, rng, 'jungle', W.w / 24, [M.GRASS], { gap: 8 });
      G.scatter(W, rng, 'fern', W.w / 14, [M.GRASS]);
      G.scatter(W, rng, 'bush', W.w / 16, [M.GRASS]);
      G.scatter(W, rng, 'flower', W.w / 8, [M.GRASS]);
      G.scatter(W, rng, 'tuft', W.w / 4, [M.GRASS]);
      G.scatter(W, rng, 'reed', W.w / 20, [M.MUD]);
    },
  });

  // ------------------------------------------------------------------ Suburbs
  add({
    id: 'suburbs', name: 'Suburbs', icon: '🏡', temp: 17,
    water: ['#4a90d9', '#123a6a'],
    bg: { sky: SKY.temperate, layers: [
      { type: 'city', color: '#8a96aa', y: 0.62, amp: 0.3, haze: 0.55, antenna: true },
      { type: 'trees', color: '#4a7a4a', y: 0.68, amp: 0.04, scale: 30, haze: 0.35 },
    ] },
    weather: { clear: 5, cloudy: 3, rain: 2, storm: 0.5, snow: 0.5 },
    seeds: [['tree', 1], ['bush', 2], ['flower', 4], ['tuft', 3]], tufts: ['tuft', 'flower'],
    fauna: [['person', 6], ['dog', 2], ['cat', 2], ['squirrel', 3], ['pigeon', 6], ['car', 3], ['songbird', 3], ['butterfly', 3], ['mouse', 2], ['bat', 2]],
    gen(W, rng, eco) {
      const g = Math.round(W.h * 0.74);
      for (let x = 0; x < W.w; x++) G.column(W, x, g, [[M.GRASS, 1], [M.CONCRETE, 1], [M.ASPHALT, 4], [M.SOIL, 6]]);
      eco.roadY = g + 4;
      let x = 3 + Math.floor(rng() * 8);
      while (x < W.w - 22) {
        const hw = 15 + Math.floor(rng() * 9), hh = 7 + Math.floor(rng() * 5);
        const color = Math.floor(rng() * 4);
        const base = g - 1;
        for (let y = base - hh + 1; y <= base; y++) for (let i = 0; i < hw; i++) W.set(x + i, y, M.SIDING, 0, color);
        // windows
        for (let wy = base - hh + 2; wy < base - 2; wy += 4)
          for (let wx = x + 2; wx < x + hw - 2; wx += 4) {
            if (wx >= x + 2 && wx <= x + 4 && wy > base - 5) continue;
            const lit = rng() < 0.6 ? 1 : 0;
            for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) W.set(wx + a, wy + b, M.GLASS, lit);
          }
        for (let y = base - 3; y <= base; y++) { W.set(x + 2, y, M.WOOD, 0, 2); W.set(x + 3, y, M.WOOD, 0, 2); }
        // roof
        let r = 0;
        while (hw + 2 - r * 2 > 1) {
          for (let i = -1 + r; i <= hw - r; i++) W.set(x + i, base - hh - r, M.ROOF);
          r++;
        }
        const cx = x + hw - 4;
        for (let y = base - hh - 3; y < base - hh - 1; y++) { W.set(cx, y, M.BRICK); W.set(cx + 1, y, M.BRICK); }
        x += hw + 2;
        // yard
        const yard = 8 + Math.floor(rng() * 14);
        const kind = rng();
        if (kind < 0.5) W.plant(x + Math.floor(yard / 2), g - 1, rng() < 0.5 ? 'tree' : 'bush', rng);
        if (kind > 0.3) {
          // lamp post
          const lx = x + Math.floor(rng() * yard);
          for (let y = g - 8; y < g; y++) W.set(lx, y, M.METAL, 0, 2);
          W.set(lx, g - 9, M.LAMP);
          W.set(lx + 1, g - 9, M.LAMP);
        }
        if (rng() < 0.5) for (let i = 0; i < yard - 1; i += 2) { W.set(x + i, g - 1, M.WOOD, 0, 3); W.set(x + i, g - 2, M.WOOD, 0, 3); }
        for (let i = 0; i < yard; i++) if (rng() < 0.3 && W.get(x + i, g - 1) === M.EMPTY) W.plant(x + i, g - 1, rng() < 0.5 ? 'flower' : 'tuft', rng);
        x += yard;
      }
    },
  });

  // ------------------------------------------------------------------ Post-apocalyptic city
  add({
    id: 'wasteland', name: 'Ruined City', icon: '☢️', temp: 18,
    water: ['#6a7a5a', '#2a3020'],
    bg: { sky: SKY.apoc, sun: '#ffd8a0', layers: [
      { type: 'ruins', color: '#5a5048', y: 0.6, amp: 0.4, haze: 0.5 },
      { type: 'ruins', color: '#3e3630', y: 0.68, amp: 0.25, haze: 0.3 },
    ] },
    weather: { clear: 2, cloudy: 3, ashfall: 3, rain: 1, storm: 1, fog: 1 },
    seeds: [['tuft', 3], ['deadbush', 1], ['deadtree', 1]], tufts: ['tuft'], fertility: 0.4,
    fauna: [['rat', 8], ['cockroach', 10], ['crow', 5], ['survivor', 3], ['zombie', 3], ['feraldog', 2], ['moth', 4]],
    gen(W, rng, eco) {
      const n = U.noise1D(rng, 20, 2);
      const g = Math.round(W.h * 0.76);
      for (let x = 0; x < W.w; x++) G.column(W, x, g - Math.round(n(x) * 2), [[M.ASH, 1], [M.DIRT, 2], [M.ASPHALT, 2], [M.SOIL, 6]]);
      let x = 2 + Math.floor(rng() * 6);
      while (x < W.w - 16) {
        const bw = 12 + Math.floor(rng() * 18);
        const bh = Math.floor(W.h * (0.2 + rng() * 0.35));
        let jag = 0;
        for (let i = 0; i < bw; i++) {
          if (rng() < 0.35) jag = U.clamp(jag + Math.floor(rng() * 5) - 2, 0, Math.floor(bh * 0.5));
          const edge = Math.min(i, bw - 1 - i);
          const top = g - bh + jag + (edge < 2 ? Math.floor(rng() * bh * 0.4) : 0);
          for (let y = top; y < g; y++) W.set(x + i, y, M.FACADE, 0, (i + y) % 7 === 0 ? 3 : undefined);
        }
        for (let wy = g - bh + 3; wy < g - 3; wy += 4)
          for (let wx = x + 2; wx < x + bw - 2; wx += 3) {
            if (W.get(wx, wy) !== M.FACADE) continue;
            const r = rng();
            const lit = r < 0.08 ? 1 : 0;
            if (r < 0.4) { W.set(wx, wy, M.EMPTY); W.set(wx, wy + 1, M.EMPTY); }
            else { W.set(wx, wy, M.GLASS, lit, 3); W.set(wx, wy + 1, M.GLASS, lit, 3); }
          }
        // blast holes
        for (let h = 0; h < 2; h++) if (rng() < 0.6) G.blob(W, x + Math.floor(rng() * bw), g - Math.floor(rng() * bh), 2 + Math.floor(rng() * 3), 2 + Math.floor(rng() * 2), M.EMPTY, rng, [M.FACADE, M.GLASS]);
        // rubble at base
        G.blob(W, x + Math.floor(rng() * bw), g - 1, 3 + Math.floor(rng() * 4), 2, M.RUBBLE, rng, [M.EMPTY, M.FACADE]);
        x += bw + 6 + Math.floor(rng() * 16);
      }
      // wrecked cars and burning barrels
      for (let i = 0; i < W.w / 70; i++) {
        const cx = Math.floor(rng() * (W.w - 12));
        const s = W.floorY(cx + 5);
        for (let k = 0; k < 10; k++) for (let y = s - 3; y < s; y++) if (y > s - 3 || (k > 2 && k < 8)) W.set(cx + k, y, M.METAL, 0, rng() < 0.7 ? 0 : 1);
      }
      for (let i = 0; i < W.w / 60; i++) {
        const cx = Math.floor(rng() * W.w);
        const s = W.floorY(cx);
        W.set(cx, s - 1, M.METAL, 0, 2); W.set(cx, s - 2, M.METAL, 0, 2); W.set(cx, s - 3, M.EMBERS);
      }
      if (rng() < 0.7) G.pond(W, rng, Math.floor(W.w * (0.15 + rng() * 0.7)), 7 + Math.floor(rng() * 5), 3, M.TOXIC, M.MUD);
      G.scatter(W, rng, 'deadtree', W.w / 60, [M.ASH, M.DIRT, M.RUBBLE], { floor: true });
      G.scatter(W, rng, 'tuft', W.w / 8, [M.ASH, M.DIRT], { floor: true });
      G.litter(W, rng, W.w / 6);
    },
  });

  // ------------------------------------------------------------------ Prehistoric
  add({
    id: 'prehistoric', name: 'Prehistoric', icon: '🦖', temp: 30, ventRate: 0.012,
    water: ['#4a8a7a', '#0e2a26'],
    bg: { sky: SKY.prehistoric, plume: true, layers: [
      { type: 'volcano', color: '#5a4a48', y: 0.62, amp: 0.36, cx: 0.75, width: 0.3, haze: 0.5 },
      { type: 'jungle', color: '#3a5a3a', y: 0.6, amp: 0.08, scale: 30, haze: 0.4 },
    ] },
    weather: { clear: 4, cloudy: 2, rain: 2, storm: 1.2, ashfall: 1, fog: 1 },
    seeds: [['fern', 3], ['jungle', 1], ['bush', 2], ['tuft', 2]], tufts: ['tuft', 'fern'], fertility: 1.3,
    fauna: [['brontosaurus', 2], ['triceratops', 3], ['raptor', 3], ['trex', 1], ['pterodactyl', 2], ['meganeura', 4], ['mammal', 5], ['smallfish', 6], ['frog', 3]],
    gen(W, rng) {
      const tops = G.heights(W, rng, 0.72, 0.06, 70);
      const vx = Math.floor(W.w * (rng() < 0.5 ? 0.12 : 0.88)), vr = Math.floor(Math.min(W.w * 0.14, W.h * 0.7));
      const peak = Math.round(W.h * 0.3);
      for (let x = 0; x < W.w; x++) {
        const d = Math.abs(x - vx);
        let top = tops[x];
        let layers = [[M.GRASS, 1], [M.DIRT, 2], [M.SOIL, 6]];
        if (d < vr) {
          const cone = Math.round(peak + (d / vr) * (tops[x] - peak));
          if (cone < top) { top = cone; layers = [[M.ASH, 1], [M.BASALT, Math.max(4, Math.round((tops[x] - cone) * 1.2))]]; }
        }
        G.column(W, x, top, layers);
      }
      // crater with lava vents
      const cy = G.surf(W, vx);
      for (let dx = -3; dx <= 3; dx++) for (let y = cy - 1; y < cy + 3; y++) W.set(vx + dx, y, M.EMPTY);
      for (let dx = -3; dx <= 3; dx++) W.set(vx + dx, cy + 3, M.VENT);
      for (let dx = -2; dx <= 2; dx++) W.set(vx + dx, cy + 2, M.LAVA);
      G.pond(W, rng, Math.floor(W.w * 0.5 + (vx < W.w / 2 ? 1 : -1) * W.w * 0.15), 12, 5, M.WATER, M.MUD);
      G.scatter(W, rng, 'fern', W.w / 10, [M.GRASS]);
      G.scatter(W, rng, 'jungle', W.w / 40, [M.GRASS], { gap: 8 });
      G.scatter(W, rng, 'bush', W.w / 20, [M.GRASS]);
      G.scatter(W, rng, 'tuft', W.w / 5, [M.GRASS]);
      G.scatter(W, rng, 'reed', W.w / 30, [M.MUD]);
    },
  });

  // ------------------------------------------------------------------ Ant hill
  add({
    id: 'anthill', name: 'Inside an Ant Hill', icon: '🐜', temp: 18, noShade: true,
    water: ['#4a90d9', '#123a6a'],
    bg: { sky: SKY.temperate, under: '#3a2414', layers: [
      { type: 'trees', color: '#5a8a4a', y: 0.2, amp: 0.05, scale: 25, haze: 0.4 },
    ] },
    weather: { clear: 5, cloudy: 3, rain: 2.5, storm: 0.5 },
    seeds: [['flower', 3], ['tuft', 3], ['bush', 1]], tufts: ['tuft', 'flower'], leafFall: 0.0002, fertility: 1.2,
    fauna: [['antqueen', 1], ['aphid', 8], ['spider', 2], ['ladybug', 3], ['beetle', 4], ['earthworm', 6], ['butterfly', 2]],
    gen(W, rng, eco) {
      const g = Math.round(W.h * 0.26);
      const n = U.noise1D(rng, 30, 2);
      W.backY = new Int16Array(W.w);
      for (let x = 0; x < W.w; x++) {
        const top = g - Math.round(n(x) * 3);
        G.column(W, x, top, [[M.GRASS, 1], [M.DIRT, 1], [M.SOIL, W.h]]);
        W.backY[x] = top + 1;
      }
      // pebbles and roots
      for (let i = 0; i < (W.w * W.h) / 900; i++) {
        const x = Math.floor(rng() * W.w), y = g + 4 + Math.floor(rng() * (W.h - g - 6));
        G.blob(W, x, y, 1 + Math.floor(rng() * 3), 1 + Math.floor(rng() * 2), M.STONE, rng, [M.SOIL]);
      }
      for (let i = 0; i < W.w / 30; i++) {
        let x = Math.floor(rng() * W.w), y = G.surf(W, x) + 1;
        const len = 8 + Math.floor(rng() * 20);
        for (let k = 0; k < len; k++) {
          if (W.get(x, y) === M.SOIL) W.set(x, y, M.WOOD, 0, 1);
          y += rng() < 0.7 ? 1 : 0;
          x += rng() < 0.3 ? (rng() < 0.5 ? -1 : 1) : 0;
        }
      }
      // the colony
      const ex = Math.floor(W.w * (0.35 + rng() * 0.3));
      const depth = Math.floor((W.h - g) * 0.4);
      const col = DS.Ants.found(eco, ex, g, { depth, workers: 24 });
      if (col) {
        col.food = 20;
        const extra = 3 + Math.floor(rng() * 3);
        for (let i = 0; i < extra; i++) {
          const cx = U.clamp(col.x + Math.floor((rng() - 0.5) * W.w * 0.6), 6, W.w - 7);
          const cy = U.clamp(col.y + Math.floor((rng() - 0.4) * (W.h - g) * 0.6), g + 6, W.h - 5);
          const from = U.pick(col.chambers);
          DS.Ants.tunnel(W, from[0], from[1], cx, cy);
          DS.Ants.carve(W, cx, cy, 3 + Math.floor(rng() * 2), 1 + Math.floor(rng() * 2));
          col.chambers.push([cx, cy]);
        }
        for (let i = 0; i < 25; i++) col.storeFood(W);
        col.food = 20;
        // mound
        for (let dx = -10; dx <= 10; dx++) {
          if (Math.abs(dx) < 2) continue;
          const hgt = Math.round(4 * (1 - Math.abs(dx) / 11));
          const s = G.surf(W, ex + dx);
          for (let k = 1; k <= hgt; k++) W.set(ex + dx, s - k, M.DIRT);
        }
      }
      G.scatter(W, rng, 'bush', W.w / 30, [M.GRASS]);
      G.scatter(W, rng, 'flower', W.w / 6, [M.GRASS]);
      G.scatter(W, rng, 'tuft', W.w / 3, [M.GRASS]);
      G.litter(W, rng, W.w / 2);
    },
  });

  DS.Biomes = B;
  DS.BiomeMap = Object.fromEntries(B.map((b) => [b.id, b]));
  DS.Gen = G;
})();
