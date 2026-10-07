// Additional landscapes: pond, river, deep sea, beehive, lawn, wetlands,
// mesa, oasis and an enchanted forest.
(function () {
  'use strict';
  const DS = window.DS;
  const { U, M } = DS;
  const G = DS.Gen;
  const B = DS.Biomes;
  const add = (b) => { b.weather = Object.assign({ windy: 0.5 }, b.weather); B.push(b); DS.BiomeMap[b.id] = b; };

  const SKY = {
    temperate: { day: ['#5fa8e8', '#cfe9f7'], dusk: ['#3a4a8a', '#f4a46a'], night: ['#060a1c', '#18213f'] },
    desert: { day: ['#4a9ae0', '#f0dcb0'], dusk: ['#5a3a7a', '#ff9a4a'], night: ['#0a0a1e', '#2a1e30'] },
    sea: { day: ['#3a90e0', '#bfe4fa'], dusk: ['#3a3a7a', '#f8a070'], night: ['#040a1e', '#122040'] },
    magic: { day: ['#8a8ae8', '#f0d0f0'], dusk: ['#5a2a8a', '#f890b0'], night: ['#0a0620', '#24124a'] },
  };

  // a bowl of water between two banks
  function basin(W, rng, level, x0f, x1f, depthF, under, bank) {
    const n = U.noise1D(rng, 35, 3);
    for (let x = 0; x < W.w; x++) {
      const f = x / W.w;
      const mid = (x0f + x1f) / 2, half = (x1f - x0f) / 2;
      const bowl = Math.max(0, 1 - ((f - mid) / half) ** 2);
      const top = Math.round(level - 3 - n(x) * W.h * 0.06 + Math.pow(bowl, 0.6) * W.h * depthF);
      G.column(W, x, top, top >= level ? under : bank);
      for (let y = level; y < top; y++) W.set(x, y, M.WATER);
    }
  }

  // ------------------------------------------------------------------ Pond
  add({
    id: 'pond', name: 'Garden Pond', icon: '🪷', temp: 18,
    water: ['#5aa8a0', '#123a32'],
    bg: { sky: SKY.temperate, layers: [
      { type: 'trees', color: '#5a8a5a', y: 0.48, amp: 0.06, scale: 30, haze: 0.5 },
      { type: 'hills', color: '#4a7a4a', y: 0.55, amp: 0.03, scale: 50, haze: 0.3 },
    ] },
    weather: { clear: 4, cloudy: 3, rain: 2, fog: 1, storm: 0.4 },
    seeds: [['cattail', 2], ['flower', 2], ['tulip', 1], ['tuft', 2], ['willow', 0.3]], tufts: ['tuft', 'flower', 'cattail'],
    waterSeeds: [['seagrass', 3], ['seaweed', 1]],
    fauna: [['koi', 8], ['goldfish', 6], ['tadpole', 14], ['frog', 6], ['toad', 3], ['newt', 3], ['waterstrider', 8], ['dragonfly', 5], ['dragonfly2', 4], ['duck', 3], ['heronstand', 1], ['snail', 3], ['snapper', 1], ['kingfisher', 1], ['mosquito', 6], ['butterfly', 4], ['bee', 4], ['firefly', 14], ['robin', 2]],
    gen(W, rng) {
      const level = Math.round(W.h * 0.6);
      basin(W, rng, level, 0.22, 0.78, 0.22, [[M.MUD, 2], [M.SOIL, 6]], [[M.GRASS, 1], [M.DIRT, 3], [M.SOIL, 8]]);
      for (let x = 2; x < W.w - 2; x++) {
        const s = W.groundY(x);
        if (W.get(x, s) === M.WATER && W.floorY(x) - s > 3 && rng() < 0.05) for (let k = 0; k < 3; k++) if (W.get(x + k, level) === M.WATER) W.set(x + k, level, M.LILY, 0, k === 1 && rng() < 0.4 ? 2 : 0);
      }
      G.scatter(W, rng, 'cattail', W.w / 12, [M.GRASS, M.MUD]);
      G.scatter(W, rng, 'seagrass', W.w / 8, [M.MUD], { floor: true });
      G.scatter(W, rng, 'willow', W.w / 120, [M.GRASS], { gap: 10 });
      G.scatter(W, rng, 'cherry', W.w / 150, [M.GRASS], { gap: 10 });
      G.scatter(W, rng, 'flower', W.w / 6, [M.GRASS]);
      G.scatter(W, rng, 'tulip', W.w / 20, [M.GRASS]);
      G.scatter(W, rng, 'tuft', W.w / 4, [M.GRASS]);
      G.boulders(W, rng, W.w / 60);
    },
  });

  // ------------------------------------------------------------------ River
  add({
    id: 'river', name: 'River & Waterfall', icon: '🏞️', temp: 14, current: 1,
    water: ['#4a98c0', '#0e2e44'],
    bg: { sky: SKY.temperate, layers: [
      { type: 'mountains', color: '#8098b0', y: 0.42, amp: 0.15, scale: 70, haze: 0.6, snowcap: 0.3 },
      { type: 'pines', color: '#2e5a46', y: 0.52, amp: 0.05, scale: 40, haze: 0.35 },
    ] },
    weather: { clear: 4, cloudy: 3, rain: 2, fog: 1.5, storm: 0.5 },
    seeds: [['birch', 1], ['spruce', 1], ['tree', 1], ['fern2', 2], ['tuft', 2], ['berrybush', 1]], tufts: ['tuft', 'fern2', 'cattail'],
    waterSeeds: [['seaweed', 2], ['seagrass', 2]],
    fauna: [['salmon', 10], ['trout', 8], ['minnow', 14], ['pike', 1], ['otter', 2], ['beaver', 2], ['grizzly', 1], ['kingfisher', 1], ['heronstand', 1], ['duck', 3], ['dragonfly', 4], ['crayfish', 5], ['frog', 3], ['mosquito', 4], ['eagle', 1], ['deer', 2], ['waterstrider', 5]],
    gen(W, rng) {
      const level = Math.round(W.h * 0.62);
      const cliffX = Math.round(W.w * 0.14), bankX = Math.round(W.w * 0.86);
      const n = U.noise1D(rng, 30, 3);
      const cliffTop = Math.round(W.h * 0.3);
      for (let x = 0; x < W.w; x++) {
        let top;
        if (x < cliffX) top = cliffTop + Math.round(n(x) * 4);
        else if (x > bankX) top = level - 4 - Math.round(n(x) * 4);
        else top = Math.round(W.h * 0.78 + (n(x) - 0.5) * W.h * 0.08);
        const rocky = x < cliffX + 2;
        G.column(W, x, top, rocky ? [[M.GRASS, 1], [M.DIRT, 2], [M.STONE, 3]] : x > bankX ? [[M.GRASS, 1], [M.DIRT, 3], [M.SOIL, 6]] : [[M.SAND, 1], [M.STONE, 2], [M.SOIL, 6]]);
        if (x >= cliffX && x <= bankX) for (let y = level; y < top; y++) W.set(x, y, M.WATER);
      }
      // waterfall springs in the cliff face, overflow drains in the far bank
      for (let y = cliffTop + 2; y < cliffTop + 6; y++) W.set(cliffX - 1, y, M.SPRING);
      for (let y = level - 1; y <= level + 1; y++) for (let k = 0; k < 2; k++) W.set(bankX + 1 + k, y, M.DRAIN);
      // boulders in the stream and a fallen log
      for (let i = 0; i < W.w / 70; i++) { const x = U.clamp(Math.round(W.w * (0.2 + rng() * 0.6)), cliffX + 4, bankX - 4); G.blob(W, x, W.floorY(x), 2 + Math.floor(rng() * 3), 2 + Math.floor(rng() * 2), M.STONE, rng, [M.WATER, M.SAND, M.STONE, M.SOIL]); }
      const lx = Math.round(W.w * (0.35 + rng() * 0.3));
      for (let k = 0; k < 14; k++) W.set(lx + k, level - 1 + (k > 6 ? 0 : 0), M.WOOD, 0, 1);
      G.scatter(W, rng, 'spruce', W.w / 50, [M.GRASS], { gap: 4 });
      G.scatter(W, rng, 'birch', W.w / 60, [M.GRASS], { gap: 4 });
      G.scatter(W, rng, 'fern2', W.w / 15, [M.GRASS]);
      G.scatter(W, rng, 'berrybush', W.w / 70, [M.GRASS]);
      G.scatter(W, rng, 'seaweed', W.w / 12, [M.SAND, M.STONE], { floor: true });
      G.scatter(W, rng, 'cattail', W.w / 50, [M.GRASS]);
    },
  });

  // ------------------------------------------------------------------ Deep sea
  add({
    id: 'deepsea', name: 'Deep Sea', icon: '🦑', temp: 4, abyss: 0.3, marineSnow: true, noShade: false,
    water: ['#2a6ab0', '#000612'],
    bg: { sky: SKY.sea, layers: [{ type: 'flat', color: '#1a4a8a', y: 0.08, haze: 0.4 }] },
    weather: { clear: 5, cloudy: 3, rain: 1, storm: 0.5 },
    seeds: [['tubeworm', 1]], waterSeeds: [['tubeworm', 2], ['seagrass', 1]],
    fauna: [['anglerfish', 4], ['lanternfish', 24], ['hatchetfish', 16], ['vampiresquid', 4], ['giantsquid', 1], ['gulper', 2], ['dumbo', 3], ['spermwhale', 1], ['jellyfish', 6], ['seacucumber', 6], ['isopod', 5], ['shrimp', 8], ['squid', 4], ['seagull', 2]],
    gen(W, rng) {
      const level = Math.round(W.h * 0.08);
      const n = U.noise1D(rng, 40, 4);
      const tx = W.w * (0.35 + rng() * 0.3);
      for (let x = 0; x < W.w; x++) {
        const trench = Math.max(0, 1 - Math.abs(x - tx) / (W.w * 0.12));
        const bed = Math.round(W.h * 0.86 + (n(x) - 0.5) * W.h * 0.12 + trench * W.h * 0.1);
        G.column(W, x, Math.min(bed, W.h - 3), [[M.SAND, 2], [M.BASALT, 6]], M.BASALT);
        for (let y = level; y < Math.min(bed, W.h - 3); y++) W.set(x, y, M.WATER);
      }
      for (let i = 0; i < W.w / 60; i++) {
        const x = Math.round(rng() * W.w), y = W.floorY(x);
        G.blob(W, x, y, 2 + Math.floor(rng() * 5), 2 + Math.floor(rng() * 5), M.BASALT, rng, [M.WATER, M.SAND]);
      }
      // hydrothermal vents with tube worm colonies
      for (let i = 0; i < Math.max(2, W.w / 120); i++) {
        const x = Math.round(W.w * (0.1 + rng() * 0.8)), y = W.floorY(x);
        for (let k = 0; k < 4; k++) { W.set(x, y - k, M.BASALT); W.set(x + 1, y - k, M.BASALT); }
        W.set(x, y - 4, M.HVENT); W.set(x + 1, y - 4, M.HVENT);
        for (let k = 0; k < 4; k++) W.plant(x + U.randInt(-8, 8), W.floorY(x) - 1, 'tubeworm', rng);
      }
      G.scatter(W, rng, 'tubeworm', W.w / 40, [M.SAND, M.BASALT], { floor: true });
    },
  });

  // ------------------------------------------------------------------ Beehive
  add({
    id: 'beehive', name: 'Inside a Beehive', icon: '🐝', temp: 22, noShade: true,
    water: ['#4a90d9', '#123a6a'],
    bg: { sky: SKY.temperate, layers: [
      { type: 'trees', color: '#6a9a5a', y: 0.6, amp: 0.08, scale: 30, haze: 0.5 },
      { type: 'hills', color: '#7aaa5a', y: 0.8, amp: 0.03, scale: 60, haze: 0.3 },
    ] },
    weather: { clear: 6, cloudy: 3, rain: 1.5, storm: 0.3 },
    seeds: [['flower', 4], ['lavender', 2], ['sunflower', 1], ['tulip', 2], ['tuft', 2]], tufts: ['flower', 'lavender', 'tulip'], fertility: 1.4,
    fauna: [['hivequeen', 1], ['bumblebee', 4], ['butterfly', 6], ['monarch', 3], ['hornet', 1], ['hummingbird', 2], ['songbird', 2], ['ladybug', 3], ['aphid', 6], ['beekeeper', 1]],
    gen(W, rng, eco) {
      const g = Math.round(W.h * 0.9);
      for (let x = 0; x < W.w; x++) G.column(W, x, g - Math.round(Math.sin(x * 0.03) * 2), [[M.GRASS, 1], [M.DIRT, 2], [M.SOIL, 6]]);
      // an old oak holding the hive on a branch
      const tx = Math.round(W.w * 0.2), branchY = Math.round(W.h * 0.12);
      for (let y = branchY; y < g; y++) for (let k = -4; k <= 4; k++) W.set(tx + k, y, M.WOOD, 0, (k + y) % 5 === 0 ? 1 : 0);
      for (let x = tx; x < W.w * 0.75; x++) for (let k = 0; k < 4; k++) W.set(x, branchY + k + Math.round((x - tx) * 0.04), M.WOOD, k === 0 ? 1 : 0);
      G.blob(W, tx, branchY - 4, 22, 9, M.LEAF, rng);
      G.blob(W, Math.round(W.w * 0.6), branchY - 3, 28, 7, M.LEAF, rng);
      const cx = Math.round(W.w * 0.5);
      const rx = Math.round(Math.min(W.w * 0.17, W.h * 0.45)), ry = Math.round(W.h * 0.3);
      const top = branchY + Math.round((cx - tx) * 0.04) + 4;
      const hive = DS.Hive.found(eco, cx, top + ry + 2, { rx, ry, workers: 30, honey: 20, max: 80 });
      if (hive) {
        // attach the hive to the branch
        for (let y = top; y < hive.cy - ry + 2; y++) for (let k = -3; k <= 3; k++) W.set(cx + k, y, M.COMB, 0, 3);
      }
      G.scatter(W, rng, 'flower', W.w / 2, [M.GRASS]);
      G.scatter(W, rng, 'lavender', W.w / 10, [M.GRASS]);
      G.scatter(W, rng, 'sunflower', W.w / 25, [M.GRASS]);
      G.scatter(W, rng, 'tulip', W.w / 12, [M.GRASS]);
      G.scatter(W, rng, 'berrybush', W.w / 50, [M.GRASS]);
    },
  });

  // ------------------------------------------------------------------ Lawn
  add({
    id: 'lawn', name: 'Backyard Lawn (bug’s-eye)', icon: '🌱', temp: 22,
    water: ['#7ac0e0', '#2a5a80'],
    bg: { sky: SKY.temperate, layers: [
      { type: 'pines', color: '#7ab06a', y: 0.55, amp: 0.4, scale: 20, haze: 0.55 },
      { type: 'pines', color: '#5a9a4a', y: 0.72, amp: 0.35, scale: 14, haze: 0.35 },
    ] },
    weather: { clear: 5, cloudy: 3, rain: 2, storm: 0.4 },
    seeds: [['blade', 4], ['clover', 1], ['dandelion', 0.3]], tufts: ['blade', 'blade', 'clover'], fertility: 1.2,
    fauna: [['lawnqueen', 1], ['lawnaphid', 8], ['lawnladybug', 3], ['lawnspider', 1], ['lawnbee', 2], ['lawnmite', 6], ['lawnweevil', 3], ['lawnstinkbug', 3], ['lawnworm', 4], ['lawncaterpillar', 2], ['lawnsnail', 2], ['lawngnat', 6], ['lawnmosquito', 3], ['lawnbeetle', 1], ['lawnmantis', 1], ['lawngrasshopper', 2], ['lawnwolfspider', 1]],
    gen(W, rng, eco) {
      const g = Math.round(W.h * 0.84);
      const n = U.noise1D(rng, 40, 2);
      for (let x = 0; x < W.w; x++) G.column(W, x, g - Math.round(n(x) * 4), [[M.GRASS, 1], [M.DIRT, 3], [M.SOIL, 10]]);
      // a dew puddle
      G.pond(W, rng, Math.round(W.w * (0.6 + rng() * 0.25)), 10, 3);
      // pebbles the size of boulders
      for (let i = 0; i < W.w / 40; i++) { const x = Math.round(rng() * W.w); G.blob(W, x, W.floorY(x) - 2, 3 + Math.floor(rng() * 5), 2 + Math.floor(rng() * 3), M.STONE, rng); }
      // a discarded soda can and a twig
      const cx = Math.round(W.w * (0.15 + rng() * 0.25)), cy = W.floorY(cx);
      for (let x = 0; x < 34; x++) for (let y = 0; y < 13; y++) {
        const edge = x < 2 || x > 31;
        W.set(cx + x, cy - 13 + y, edge ? M.METAL : y === 4 || y === 5 ? M.CONCRETE : M.BRICK, 0, edge ? 2 : y % 4 === 0 ? 1 : 0);
      }
      const tw = Math.round(W.w * (0.45 + rng() * 0.1));
      for (let x = 0; x < 40; x++) { const y = W.floorY(tw + x) - 1 - Math.round(Math.sin(x * 0.1) * 1); W.set(tw + x, y, M.WOOD); W.set(tw + x, y - 1, M.WOOD, 0, 1); }
      G.scatter(W, rng, 'blade', W.w / 1.6, [M.GRASS]);
      G.scatter(W, rng, 'clover', W.w / 22, [M.GRASS]);
      G.scatter(W, rng, 'dandelion', W.w / 50, [M.GRASS], { gap: 6 });
      G.litter(W, rng, W.w / 4);
      DS.Ants.found(eco, Math.round(W.w * 0.5), g - 1, { queen: 'lawnqueen', worker: 'lawnant', workers: 20, depth: Math.round((W.h - g) * 0.55) });
    },
  });

  // ------------------------------------------------------------------ Wetlands
  add({
    id: 'wetlands', name: 'Wetlands', icon: '🦩', temp: 16,
    water: ['#6a98a0', '#1a3a3a'],
    bg: { sky: SKY.temperate, layers: [
      { type: 'hills', color: '#8aa898', y: 0.5, amp: 0.04, scale: 90, haze: 0.6 },
      { type: 'trees', color: '#6a8a5a', y: 0.6, amp: 0.02, scale: 15, haze: 0.4 },
    ] },
    weather: { clear: 3, cloudy: 3, rain: 2, fog: 2, storm: 0.4 },
    seeds: [['reed', 3], ['cattail', 3], ['tallgrass', 3], ['willow', 0.2]], tufts: ['reed', 'cattail', 'tallgrass'],
    waterSeeds: [['seagrass', 3]],
    fauna: [['crane', 3], ['spoonbill', 4], ['ibis', 4], ['egret', 2], ['heronstand', 2], ['goose', 4], ['swan', 2], ['coot', 5], ['duck', 4], ['muskrat', 3], ['otter', 1], ['beaver', 1], ['frog', 5], ['toad', 2], ['newt', 2], ['dragonfly', 5], ['dragonfly2', 3], ['mosquito', 6], ['minnow', 12], ['catfish', 2], ['tadpole', 10], ['crayfish', 4], ['snapper', 1], ['waterstrider', 6]],
    gen(W, rng) {
      const level = Math.round(W.h * 0.68);
      const n = U.noise1D(rng, 22, 3);
      for (let x = 0; x < W.w; x++) {
        const top = Math.round(level + (n(x) - 0.52) * 14);
        G.column(W, x, top, top > level ? [[M.MUD, 2], [M.SOIL, 6]] : [[M.GRASS, 1], [M.MUD, 2], [M.SOIL, 6]]);
        for (let y = level; y < top; y++) W.set(x, y, M.WATER);
      }
      G.scatter(W, rng, 'reed', W.w / 5, [M.GRASS, M.MUD], { floor: true });
      G.scatter(W, rng, 'cattail', W.w / 6, [M.GRASS, M.MUD], { floor: true });
      G.scatter(W, rng, 'tallgrass', W.w / 4, [M.GRASS]);
      G.scatter(W, rng, 'willow', W.w / 160, [M.GRASS], { gap: 12 });
      G.scatter(W, rng, 'seagrass', W.w / 10, [M.MUD], { floor: true });
    },
  });

  // ------------------------------------------------------------------ Mesa
  add({
    id: 'mesa', name: 'Mesa Canyons', icon: '🪨', temp: 28,
    water: ['#5a9aa8', '#1a3a40'],
    bg: { sky: SKY.desert, sun: '#fff0c8', layers: [
      { type: 'mesa', color: '#c87a4a', y: 0.5, amp: 0.22, scale: 60, haze: 0.55 },
      { type: 'mesa', color: '#a8583a', y: 0.6, amp: 0.15, scale: 45, haze: 0.35 },
    ] },
    weather: { clear: 7, drylightning: 1, windy: 1.5, sandstorm: 0.6, storm: 0.3 },
    seeds: [['juniper', 2], ['agave', 1], ['pricklypear', 1], ['deadbush', 2]], tufts: ['tuft'], fertility: 0.3,
    fauna: [['cougar', 1], ['bighorn', 4], ['javelina', 3], ['gila', 1], ['coyote', 2], ['roadrunner', 2], ['rattlesnake', 2], ['jackrabbit', 3], ['condor', 1], ['eagle', 1], ['lizard', 4], ['tarantula', 2], ['scorpion', 2], ['vulture', 2]],
    gen(W, rng) {
      const n = U.noise1D(rng, 90, 2), n2 = U.noise1D(rng, 9, 2);
      const floor = Math.round(W.h * 0.8), plateau = Math.round(W.h * 0.36);
      for (let x = 0; x < W.w; x++) {
        const v = n(x);
        // flat tops with near-vertical cliffs and a little scree at the foot
        const q = U.clamp((v - 0.5) / 0.008, 0, 1) * 0.92 + U.clamp((v - 0.47) / 0.03, 0, 1) * 0.08;
        const top = Math.round(floor - q * (floor - plateau) - n2(x) * 3);
        G.column(W, x, top, [[q > 0.9 ? M.SANDSTONE : M.SAND, 2]], M.SANDSTONE);
        // red rock strata
        for (let y = top; y < W.h - 1; y++) if (W.get(x, y) === M.SANDSTONE) W.shade[y * W.w + x] = (Math.floor((y + Math.sin(x * 0.05) * 2) / 3)) & 3;
      }
      G.scatter(W, rng, 'juniper', W.w / 30, [M.SAND, M.SANDSTONE], { gap: 4 });
      G.scatter(W, rng, 'agave', W.w / 40, [M.SAND]);
      G.scatter(W, rng, 'pricklypear', W.w / 40, [M.SAND]);
      G.scatter(W, rng, 'deadbush', W.w / 30, [M.SAND, M.SANDSTONE]);
      G.boulders(W, rng, W.w / 60, M.SANDSTONE);
    },
  });

  // ------------------------------------------------------------------ Oasis
  add({
    id: 'oasis', name: 'Oasis', icon: '🌴', temp: 36,
    water: ['#3ab8c0', '#0e3a48'],
    bg: { sky: SKY.desert, sun: '#fff8d8', layers: [
      { type: 'dunes', color: '#e8c088', y: 0.6, amp: 0.1, scale: 70, haze: 0.45 },
      { type: 'dunes', color: '#dcb070', y: 0.68, amp: 0.06, scale: 50, haze: 0.3 },
    ] },
    weather: { clear: 8, cloudy: 1, sandstorm: 1.5, windy: 1 },
    seeds: [['datepalm', 2], ['palm', 1], ['reed', 2], ['tuft', 2]], tufts: ['tuft', 'reed'], fertility: 0.8,
    fauna: [['camel', 4], ['fennec', 2], ['gazelle', 4], ['dove', 4], ['sparrow', 4], ['frog', 3], ['smallfish', 8], ['minnow', 6], ['dragonfly', 4], ['scorpion', 2], ['lizard', 3], ['jackrabbit', 2], ['flamingo', 4], ['ibis', 2], ['beetle', 3], ['moth', 4]],
    gen(W, rng) {
      const n = U.noise1D(rng, 50, 3);
      const ph = rng() * 6;
      for (let x = 0; x < W.w; x++) {
        const top = Math.round(W.h * 0.7 - (Math.sin(x / (W.w * 0.06) + ph) * 0.5 + 0.5) * W.h * 0.06 - n(x) * W.h * 0.05);
        G.column(W, x, top, [[M.SAND, 12]], M.SANDSTONE);
      }
      const cx = Math.round(W.w * 0.5);
      const r = Math.round(W.w * 0.13);
      const lvl = G.pond(W, rng, cx, r, Math.round(W.h * 0.08), M.WATER, M.MUD);
      // a green ring of grass around the water
      for (let x = cx - r - 14; x <= cx + r + 14; x++) { const y = W.floorY(x); if (W.get(x, y) === M.SAND && !W.isLiquid(x, y - 1)) W.set(x, y, M.GRASS); }
      G.scatter(W, rng, 'datepalm', 7, [M.GRASS, M.SAND, M.MUD], { x0: cx - r - 18, x1: cx + r + 18, gap: 4 });
      G.scatter(W, rng, 'reed', 14, [M.GRASS, M.MUD], { x0: cx - r - 4, x1: cx + r + 4 });
      G.scatter(W, rng, 'tuft', 20, [M.GRASS], { x0: cx - r - 14, x1: cx + r + 14 });
      G.scatter(W, rng, 'seagrass', 6, [M.MUD], { floor: true, x0: cx - r, x1: cx + r });
      G.scatter(W, rng, 'cactus', W.w / 60, [M.SAND], { gap: 4 });
      G.scatter(W, rng, 'deadbush', W.w / 40, [M.SAND]);
      void lvl;
    },
  });

  // ------------------------------------------------------------------ Enchanted forest
  add({
    id: 'enchanted', name: 'Enchanted Forest', icon: '🧚', temp: 15,
    water: ['#6a8ad8', '#1a1a5a'],
    bg: { sky: SKY.magic, aurora: true, layers: [
      { type: 'mountains', color: '#9a8ac8', y: 0.42, amp: 0.16, scale: 60, haze: 0.6 },
      { type: 'jungle', color: '#4a5a8a', y: 0.55, amp: 0.08, scale: 25, haze: 0.4 },
    ] },
    weather: { clear: 4, fog: 3, cloudy: 2, rain: 1 },
    seeds: [['cherry', 2], ['oak', 1], ['bigmushroom', 2], ['flower', 3], ['fern2', 2], ['lavender', 1]], tufts: ['flower', 'fern2', 'mushroom', 'lavender'], fertility: 1.5,
    fauna: [['fairy', 8], ['pixie', 6], ['unicorn', 2], ['elf', 4], ['gnome', 4], ['ent', 1], ['kitsune', 1], ['pegasus', 1], ['satyr', 1], ['deer', 3], ['rabbit', 4], ['owl', 1], ['firefly', 20], ['monarch', 4], ['snail', 3], ['hedgehog', 2], ['cupid', 1]],
    gen(W, rng) {
      const tops = G.heights(W, rng, 0.68, 0.08, 70);
      for (let x = 0; x < W.w; x++) G.column(W, x, tops[x], [[M.GRASS, 1], [M.DIRT, 3], [M.SOIL, 9]]);
      if (rng() < 0.8) G.pond(W, rng, Math.floor(W.w * (0.3 + rng() * 0.4)), 12, 4);
      G.scatter(W, rng, 'cherry', W.w / 40, [M.GRASS], { gap: 6 });
      G.scatter(W, rng, 'oak', W.w / 60, [M.GRASS], { gap: 8 });
      G.scatter(W, rng, 'bigmushroom', W.w / 18, [M.GRASS]);
      G.scatter(W, rng, 'flower', W.w / 3, [M.GRASS]);
      G.scatter(W, rng, 'lavender', W.w / 15, [M.GRASS]);
      G.scatter(W, rng, 'fern2', W.w / 10, [M.GRASS]);
      G.scatter(W, rng, 'mushroom', W.w / 20, [M.GRASS]);
    },
  });
})();
