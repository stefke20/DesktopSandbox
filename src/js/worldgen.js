// World mode: one large world stitched together from many biomes, with
// believable neighbours and smooth gradients between them.
(function () {
  'use strict';
  const DS = window.DS;
  const { U, M, MP } = DS;
  const G = DS.Gen;

  const GR = [[M.GRASS, 1], [M.DIRT, 3], [M.SOIL, 10]];
  // h: surface height (fraction of world height, sea level is 0.45); amp: hilliness
  const P = {
    grasslands: { h: 0.4, amp: 0.035 },
    autumn: { h: 0.39, amp: 0.04 },
    enchanted: { h: 0.39, amp: 0.04 },
    taiga: { h: 0.38, amp: 0.05, snow: 0.2 },
    rainforest: { h: 0.405, amp: 0.035 },
    bamboo: { h: 0.39, amp: 0.05 },
    prehistoric: { h: 0.4, amp: 0.035, volcano: true },
    suburbs: { h: 0.41, amp: 0.004, houses: true },
    wasteland: { h: 0.41, amp: 0.01, top: [[M.ASH, 1], [M.DIRT, 2], [M.SOIL, 8]], ruins: true },
    savanna: { h: 0.41, amp: 0.02, top: [[M.DRYGRASS, 1], [M.DIRT, 2], [M.SOIL, 9]] },
    desert: { h: 0.405, amp: 0.02, top: [[M.SAND, 12]], fill: M.SANDSTONE, dunes: true },
    oasis: { h: 0.405, amp: 0.015, top: [[M.SAND, 12]], fill: M.SANDSTONE, lake: 18, dunes: true },
    mesa: { h: 0.42, amp: 0.01, top: [[M.SAND, 2]], fill: M.SANDSTONE, mesa: true },
    mountain: { h: 0.36, amp: 0.03, ridge: 0.26, lapse: 22 },
    snowy: { h: 0.37, amp: 0.06, top: [[M.SNOW, 3], [M.DIRT, 2], [M.SOIL, 7]], snow: 1 },
    iceage: { h: 0.38, amp: 0.05, top: [[M.SNOW, 2], [M.DIRT, 2], [M.SOIL, 7]], snow: 1 },
    lake: { h: 0.4, amp: 0.02, lake: 0.3 },
    pond: { h: 0.4, amp: 0.02, lake: 14 },
    river: { h: 0.41, amp: 0.015, lake: 0.38, shallow: true },
    wetlands: { h: 0.443, amp: 0.006, top: [[M.GRASS, 1], [M.MUD, 2], [M.SOIL, 6]], pools: true },
    swamp: { h: 0.443, amp: 0.006, top: [[M.GRASS, 1], [M.MUD, 2], [M.SOIL, 6]], pools: true },
    beach: { h: 0.435, amp: 0.008, top: [[M.SAND, 10]] },
    reef: { h: 0.56, amp: 0.03, top: [[M.SAND, 3], [M.SANDSTONE, 4]], ocean: true },
    sea: { h: 0.68, amp: 0.05, top: [[M.SAND, 3]], ocean: true },
    deepsea: { h: 0.9, amp: 0.03, top: [[M.SAND, 2], [M.BASALT, 6]], fill: M.BASALT, ocean: true, vents: true },
    arctic: { h: 0.47, amp: 0.01, top: [[M.SAND, 2]], ocean: true, ice: true, snow: 1 },
  };

  // which biomes may sit next to each other
  const ADJ = {
    deepsea: ['sea'],
    sea: ['deepsea', 'reef', 'beach', 'arctic'],
    reef: ['sea', 'beach'],
    beach: ['sea', 'reef', 'grasslands', 'rainforest', 'suburbs', 'savanna', 'wetlands', 'desert'],
    arctic: ['sea', 'snowy', 'iceage'],
    snowy: ['arctic', 'iceage', 'taiga', 'mountain'],
    iceage: ['snowy', 'arctic', 'taiga'],
    taiga: ['snowy', 'iceage', 'mountain', 'autumn', 'lake', 'grasslands', 'river'],
    mountain: ['snowy', 'taiga', 'grasslands', 'autumn', 'mesa', 'bamboo', 'river'],
    grasslands: ['taiga', 'mountain', 'autumn', 'lake', 'pond', 'river', 'suburbs', 'savanna', 'beach', 'wetlands', 'enchanted', 'prehistoric'],
    autumn: ['taiga', 'mountain', 'grasslands', 'lake', 'enchanted', 'suburbs', 'river', 'pond'],
    lake: ['grasslands', 'taiga', 'autumn', 'wetlands', 'enchanted'],
    pond: ['grasslands', 'autumn', 'bamboo', 'suburbs', 'enchanted'],
    river: ['grasslands', 'taiga', 'mountain', 'autumn', 'wetlands', 'rainforest'],
    wetlands: ['lake', 'swamp', 'grasslands', 'beach', 'river'],
    swamp: ['wetlands', 'rainforest', 'prehistoric'],
    rainforest: ['swamp', 'beach', 'bamboo', 'prehistoric', 'river', 'savanna'],
    bamboo: ['rainforest', 'mountain', 'enchanted', 'pond'],
    savanna: ['grasslands', 'desert', 'rainforest', 'beach'],
    desert: ['savanna', 'mesa', 'oasis', 'wasteland', 'beach'],
    oasis: ['desert'],
    mesa: ['desert', 'mountain'],
    wasteland: ['desert', 'suburbs'],
    suburbs: ['grasslands', 'autumn', 'wasteland', 'beach', 'pond'],
    prehistoric: ['rainforest', 'swamp', 'grasslands'],
    enchanted: ['grasslands', 'autumn', 'bamboo', 'lake', 'pond'],
  };

  // monsters that roam each biome when fantasy creatures are enabled
  const MYTH = {
    mountain: ['dragon', 'griffin', 'cyclops', 'zeus'], snowy: ['yeti'], iceage: ['yeti'], arctic: ['yeti'], taiga: ['troll', 'werewolf', 'bigfoot'],
    autumn: ['witch', 'werewolf', 'ent'], grasslands: ['centaur', 'unicorn', 'satyr', 'knight'], sea: ['kraken', 'seaserpent', 'mermaid', 'hippocampus', 'poseidon'],
    deepsea: ['kraken'], reef: ['mermaid'], lake: ['nessie'], desert: ['sphinx', 'basilisk'], oasis: ['sphinx', 'djinn'], mesa: ['thunderbird'],
    wasteland: ['robot', 'drone', 'skeleton', 'ghost'], suburbs: ['vampire', 'ghost', 'robodog'], swamp: ['hydra', 'witch'], wetlands: ['hydra'],
    prehistoric: ['wyvern', 'dragon'], bamboo: ['kitsune'], savanna: ['chimera', 'griffin'], beach: ['siren', 'cyclops'], rainforest: ['harpy'],
    enchanted: ['fairy', 'pixie', 'unicorn', 'elf', 'gnome', 'pegasus'], river: ['nessie', 'dwarf'], pond: ['fairy'],
  };

  const EXCLUDE = new Set(['anthill', 'beehive', 'lawn']);

  // build a sequence of zones that respects ADJ (falls back gracefully when biomes are disabled)
  function plan(rng, enabled, width) {
    const ok = (id) => enabled.has(id);
    const used = new Map();
    const pickW = (list) => U.weighted(list.map((id) => [id, used.has(id) ? 1 : 4]), rng);
    const landish = [...enabled].filter((id) => !P[id].ocean);
    const rpick = (a) => a[Math.floor(rng() * a.length)];
    let cur = landish.includes('grasslands') && rng() < 0.4 ? 'grasslands' : rpick(landish.length ? landish : [...enabled]);
    const seq = [];
    let x = 0;
    while (x < width) {
      const zw = Math.round((P[cur].ocean ? 200 : 170) + rng() * 120);
      seq.push({ id: cur, x0: x, x1: Math.min(width, x + zw) });
      used.set(cur, (used.get(cur) || 0) + 1);
      x += zw;
      const prev = seq.length > 1 ? seq[seq.length - 2].id : null;
      let next = (ADJ[cur] || []).filter((id) => ok(id) && id !== prev);
      if (!next.length) next = (ADJ[cur] || []).filter(ok);
      if (!next.length) {
        // walk the neighbour graph (through disabled biomes) to the closest enabled one
        const seen = new Set([cur]);
        let frontier = [cur], found = null;
        while (frontier.length && !found) {
          const nf = [];
          for (const f of frontier) for (const n of ADJ[f] || []) {
            if (seen.has(n)) continue;
            seen.add(n);
            if (ok(n) && n !== cur) { found = found || n; }
            nf.push(n);
          }
          frontier = nf;
        }
        next = found ? [found] : [...enabled];
      }
      cur = pickW(next);
    }
    // the last zone stretches to the edge
    seq[seq.length - 1].x1 = width;
    return seq;
  }

  function house(W, x, g, rng) {
    const hw = 13 + Math.floor(rng() * 8), hh = 7 + Math.floor(rng() * 4), color = Math.floor(rng() * 4), base = g - 1;
    for (let y = base - hh + 1; y <= base; y++) for (let i = 0; i < hw; i++) W.set(x + i, y, M.SIDING, 0, color);
    for (let wy = base - hh + 2; wy < base - 2; wy += 4) for (let wx = x + 5; wx < x + hw - 2; wx += 4) for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) W.set(wx + a, wy + b, M.GLASS, rng() < 0.6 ? 1 : 0);
    for (let y = base - 3; y <= base; y++) { W.set(x + 2, y, M.WOOD, 0, 2); W.set(x + 3, y, M.WOOD, 0, 2); }
    for (let r = 0; hw + 2 - r * 2 > 1; r++) for (let i = -1 + r; i <= hw - r; i++) W.set(x + i, base - hh - r, M.ROOF);
    return hw;
  }

  function ruin(W, x, g, rng) {
    const bw = 10 + Math.floor(rng() * 14), bh = Math.floor(W.h * (0.08 + rng() * 0.14));
    let jag = 0;
    for (let i = 0; i < bw; i++) {
      if (rng() < 0.35) jag = U.clamp(jag + Math.floor(rng() * 5) - 2, 0, Math.floor(bh * 0.5));
      for (let y = g - bh + jag; y < g; y++) W.set(x + i, y, M.FACADE);
    }
    for (let wy = g - bh + 3; wy < g - 3; wy += 4) for (let wx = x + 2; wx < x + bw - 2; wx += 3) if (W.get(wx, wy) === M.FACADE) { const lit = rng() < 0.08 ? 1 : 0; W.set(wx, wy, rng() < 0.4 ? M.EMPTY : M.GLASS, lit, 3); }
    G.blob(W, x + Math.floor(rng() * bw), g - 1, 3, 2, M.RUBBLE, rng, [M.EMPTY, M.FACADE]);
    return bw;
  }

  function ores(W, rng, x0, x1) {
    const kinds = [[M.COAL, 0.12, 0.35, 3], [M.COPPER, 0.15, 0.45, 2], [M.TIN, 0.15, 0.45, 2], [M.IRON, 0.25, 0.7, 2], [M.GOLD, 0.45, 0.9, 1], [M.OIL, 0.45, 0.9, 3]];
    const n = (x1 - x0) / 25;
    for (const [mat, d0, d1, rr] of kinds) {
      for (let i = 0; i < n; i++) {
        const x = Math.round(x0 + rng() * (x1 - x0));
        const top = W.floorY(x);
        const y = Math.round(top + 8 + (W.h - top - 10) * (d0 + rng() * (d1 - d0)));
        G.blob(W, x, y, rr + Math.floor(rng() * 3), 1 + Math.floor(rng() * 2), mat, rng, [M.STONE, M.SOIL, M.SANDSTONE, M.BASALT]);
      }
    }
  }

  const WG = {
    P, ADJ, MYTH, EXCLUDE,
    eligible() { return DS.Biomes.filter((b) => !EXCLUDE.has(b.id) && P[b.id]); },

    // Generates terrain into W, populates eco. opts: { enabled:Set, allowed(id), myth:boolean, ores }
    build(W, eco, rng, opts) {
      const H = W.h, L = Math.round(H * 0.45);
      const enabled = opts.enabled && opts.enabled.size ? opts.enabled : new Set(Object.keys(P));
      const seq = plan(rng, enabled, W.w);
      const zones = seq.map((z) => {
        const biome = DS.BiomeMap[z.id];
        const p = P[z.id];
        return Object.assign(z, { biome, p, n: U.noise1D(rng, 90, 3), n2: U.noise1D(rng, 14, 2), n3: U.noise1D(rng, p.mesa ? 60 : 40, 2), ph: rng() * 6 });
      });
      const T = 60;
      const zoneA = new Uint8Array(W.w), zoneB = new Uint8Array(W.w), zoneT = new Float32Array(W.w);
      W.zoneIdx = new Uint8Array(W.w);
      W.zoneBg = new Uint8Array(W.w);
      W.colTemp = new Float32Array(W.w);
      W.colLapse = new Float32Array(W.w);
      const heightOf = (zi, x) => {
        const z = zones[zi], p = z.p;
        let r = p.h * H + (z.n(x) - 0.5) * 2 * (p.amp || 0.03) * H + (z.n2(x) - 0.5) * 3;
        const f = U.clamp((x - z.x0) / (z.x1 - z.x0), 0, 1);
        if (p.ridge) r -= Math.pow(Math.sin(Math.PI * f), 0.6) * Math.pow(1 - Math.abs(2 * z.n3(x) - 1), 1.1) * p.ridge * H;
        if (p.mesa) r -= U.clamp((z.n3(x) - 0.5) / 0.01, 0, 1) * Math.pow(Math.sin(Math.PI * f), 0.3) * 0.13 * H;
        if (p.dunes) r -= (Math.sin(x / 28 + z.ph) * 0.5 + 0.5) * 0.025 * H;
        return r;
      };
      let zi = 0;
      for (let x = 0; x < W.w; x++) {
        while (x >= zones[zi].x1 && zi < zones.length - 1) zi++;
        let a = zi, b = zi, t = 0;
        const z = zones[zi];
        if (zi < zones.length - 1 && x > z.x1 - T / 2) { b = zi + 1; t = U.smooth((x - (z.x1 - T / 2)) / T); }
        else if (zi > 0 && x < z.x0 + T / 2) { a = zi - 1; t = U.smooth((x - (z.x0 - T / 2)) / T); }
        zoneA[x] = a; zoneB[x] = b; zoneT[x] = t;
        const pick = rng() < t ? b : a;
        W.zoneIdx[x] = t < 0.5 ? a : b;
        W.zoneBg[x] = ((Math.sin(x * 12.9898) * 43758.5453) % 1 + 1) % 1 < t ? b : a;
        const za = zones[a], zb = zones[b];
        W.colTemp[x] = U.lerp(za.biome.temp, zb.biome.temp, t);
        W.colLapse[x] = U.lerp(za.p.lapse || 0, zb.p.lapse || 0, t);
        const top = Math.round(U.lerp(heightOf(a, x), heightOf(b, x), t));
        const pz = zones[pick].p;
        let layers = pz.top || GR;
        if (pz.ridge) layers = top < H * 0.2 ? [[M.SNOW, 3], [M.STONE, 3]] : top < H * 0.3 ? [[M.STONE, 3]] : GR;
        if (top < H * 0.18 && !pz.ridge) layers = [[M.SNOW, 2]].concat(layers);
        G.column(W, x, top, layers, pz.fill || M.STONE);
        for (let y = L; y < top; y++) W.set(x, y, M.WATER);
        if (pz.mesa) for (let y = top; y < H - 1; y++) if (W.get(x, y) === M.SANDSTONE) W.shade[y * W.w + x] = Math.floor((y + Math.sin(x * 0.05) * 2) / 3) & 3;
      }
      W.zoneMixAt = (x) => { x = U.clamp(Math.round(x), 0, W.w - 1); return { a: zoneA[x], b: zoneB[x], t: zoneT[x] }; };
      W.zones = zones;
      W.zoneParams = zones.map((z) => {
        const b = z.biome;
        return { seedKinds: b.seeds || [['tree', 1]], tuftKinds: b.tufts || ['tuft'], waterSeeds: b.waterSeeds || [['seaweed', 3], ['coral', 1]], fertility: b.fertility != null ? b.fertility : 1, leafFall: b.leafFall != null ? b.leafFall : 0.00002 };
      });
      W.zoneWater = zones.map((z) => DS.World.makeWater(z.biome.water[0], z.biome.water[1]));

      // per-zone features, flora and fauna
      for (const z of zones) {
        const p = z.p, b = z.biome;
        const zx0 = z.x0 + 25, zx1 = z.x1 - 25, zw = z.x1 - z.x0;
        if (zx1 <= zx0) continue;
        const mid = Math.round((z.x0 + z.x1) / 2);
        if (p.lake) {
          const r = Math.round(p.lake < 1 ? zw * p.lake : p.lake);
          G.pond(W, rng, mid, Math.min(r, Math.round(zw * 0.4)), p.shallow ? 6 : Math.max(4, Math.round(r * 0.3)), M.WATER, M.MUD);
        }
        if (p.pools) for (let i = 0; i < zw / 40; i++) G.pond(W, rng, Math.round(zx0 + rng() * (zx1 - zx0)), 6 + Math.floor(rng() * 8), 3, M.WATER, M.MUD);
        if (p.volcano) { const g = W.floorY(mid); DS.Terrain.mountain(W, mid, Math.max(Math.round(H * 0.12), g - Math.round(H * 0.2)), { cone: true, mat: M.BASALT, half: Math.round(zw * 0.3) }); }
        if (p.houses) { let x = zx0; while (x < zx1 - 20) { const g = W.floorY(x + 8); if (!W.isLiquid(x + 8, g - 1)) x += house(W, x, g, rng) + 6 + Math.floor(rng() * 14); else x += 10; } }
        if (p.ruins) { let x = zx0; while (x < zx1 - 20) { const g = W.floorY(x + 6); x += ruin(W, x, g, rng) + 6 + Math.floor(rng() * 16); } }
        if (p.ice) {
          for (let x = z.x0; x < z.x1; x++) {
            if (W.get(x, L) !== M.WATER) continue;
            if (Math.floor(x / 9 + Math.sin(x * 0.03) * 3) % 3 === 0) for (let y = L - 1; y <= L + 1; y++) W.set(x, y, M.ICE);
          }
        }
        if (p.vents) for (let i = 0; i < zw / 120; i++) {
          const x = Math.round(zx0 + rng() * (zx1 - zx0)), y = W.floorY(x);
          for (let k = 0; k < 4; k++) { W.set(x, y - k, M.BASALT); W.set(x + 1, y - k, M.BASALT); }
          W.set(x, y - 4, M.HVENT); W.set(x + 1, y - 4, M.HVENT);
        }
        // flora: land plants on the surface, water plants on the sea floor
        const okLand = [M.GRASS, M.SAND, M.SNOW, M.DRYGRASS, M.MUD, M.ASH, M.DIRT];
        for (const [kind, wt] of b.seeds || []) {
          if (DS.Flora.aquatic.has(kind)) continue;
          const big = ['tree', 'oak', 'pine', 'spruce', 'jungle', 'palm', 'datepalm', 'baobab', 'acacia', 'maple', 'birch', 'cherry', 'willow', 'cypress', 'mangrove', 'bamboo', 'cactus', 'joshua'].includes(kind);
          G.scatter(W, rng, kind, Math.round((zw / 100) * wt * (big ? 1.6 : 5)), okLand, { x0: zx0, x1: zx1, gap: big ? 4 : 0 });
        }
        for (const k of b.tufts || []) G.scatter(W, rng, k, Math.round(zw / 10), okLand, { x0: zx0, x1: zx1 });
        if (p.ocean || p.lake || p.pools) for (const [kind, wt] of b.waterSeeds || [['seaweed', 1]]) G.scatter(W, rng, kind, Math.round((zw / 40) * wt), [M.SAND, M.MUD, M.STONE, M.BASALT, M.SANDSTONE], { x0: zx0, x1: zx1, floor: true });
        if (p.snow) {
          for (let x = z.x0; x < z.x1; x++) {
            if (rng() > p.snow) continue;
            let y = 0;
            while (y < H && W.get(x, y) === M.EMPTY) y++;
            if (y > 0 && y < H && !W.isLiquid(x, y)) W.set(x, y - 1, M.SNOW);
          }
        }
        if (opts.ores !== false) ores(W, rng, z.x0, z.x1);
      }
      // creatures, zone by zone
      eco.natives = [];
      eco.allowed = opts.allowed || null;
      for (const z of zones) {
        const allowed = (id) => DS.Species[id] && (!opts.allowed || opts.allowed(id));
        const fauna = (z.biome.fauna || []).filter(([id]) => allowed(id) && !DS.Species[id].ant && !DS.Species[id].hive && !DS.Species[id].lawn);
        if (opts.myth) for (const id of MYTH[z.id] || []) if (allowed(id) && DS.Species[id].cat === 'myth') fauna.push([id, rng() < 0.6 ? 1 : 0]);
        eco.populate(fauna.filter(([, n]) => n > 0), [z.x0 + 8, z.x1 - 8], (z.x1 - z.x0) / 320);
      }
      return zones;
    },
  };

  DS.WorldGen = WG;
})();
