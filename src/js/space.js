// The solar system: every landable body is a biome-like world definition
// with its own terrain, sky, weather, resources, life and (sometimes) natives.
(function () {
  'use strict';
  const DS = window.DS;
  const { U, M } = DS;
  const G = DS.Gen;

  const SKY = {
    airless: { day: ['#010208', '#0c0e1a'], dusk: ['#010208', '#0c0e1a'], night: ['#000004', '#05060c'] },
    mars: { day: ['#b8805e', '#e8c4a0'], dusk: ['#3a4a7a', '#7a9ad0'], night: ['#0a0606', '#1c120e'] },
    venus: { day: ['#b88a30', '#f0d890'], dusk: ['#7a4a18', '#e09a40'], night: ['#1a1206', '#3a2a10'] },
    titan: { day: ['#8a5a28', '#d8a058'], dusk: ['#5a3418', '#c07a3a'], night: ['#120a04', '#2a1a0a'] },
    nibiru: { day: ['#4a2a7a', '#e090c8'], dusk: ['#2a1a5a', '#ff7aa0'], night: ['#08040e', '#1a0c24'] },
    vulcan: { day: ['#ff7a20', '#ffe8a0'], dusk: ['#a82a10', '#ffb040'], night: ['#1a0602', '#3a1206'] },
    mirror: { day: ['#6ad8b0', '#e0f8f0'], dusk: ['#5a3a8a', '#f0a0d0'], night: ['#06120e', '#122a24'] },
  };
  const JUP = { x: 0.72, y: 0.16, r: 26, color: '#d8a878', bands: ['#b88458', '#e8c8a0', '#a86a48'] };
  const SAT = { x: 0.7, y: 0.18, r: 18, color: '#e8d4a0', bands: ['#d0b880', '#f0e0b8'], ring: '#c8b890' };
  const URA = { x: 0.68, y: 0.17, r: 16, color: '#a0e0e8' };
  const NEP = { x: 0.7, y: 0.15, r: 15, color: '#3a6ae0', bands: ['#2a58c8'] };
  const EARTH = { x: 0.74, y: 0.15, r: 9, color: '#3a7ad8', bands: ['#4aa860', '#f0f4f8'] };

  // ---------------------------------------------------------------- terrain
  function terrain(W, rng, o) {
    const tops = G.heights(W, rng, o.base || 0.5, o.amp || 0.05, o.scale || 60);
    for (let x = 0; x < W.w; x++) G.column(W, x, tops[x], o.top, o.fill);
    // craters: bowls with raised rims
    for (let i = 0; i < (o.craters || 0) * W.w / 400; i++) {
      const cx = Math.floor(rng() * W.w), r = 6 + Math.floor(rng() * (o.craterR || 18));
      const s = G.surf(W, cx);
      for (let x = cx - r - 3; x <= cx + r + 3; x++) {
        if (x < 0 || x >= W.w) continue;
        const d = Math.abs(x - cx) / r;
        const top = G.surf(W, x);
        if (d < 1) { const depth = Math.round((1 - d * d) * r * 0.45); for (let y = top; y < s + depth; y++) W.set(x, y, M.EMPTY); }
        else { const rim = Math.round((1 - (d - 1) * 3) * 2); for (let y = top - rim; y < top; y++) W.set(x, y, o.top[0][0]); }
      }
    }
    // a global liquid level (seas of water, methane or acid)
    if (o.sea) {
      const L = Math.round(W.h * o.sea.level);
      for (let x = 0; x < W.w; x++) for (let y = 0; y < W.h; y++) if (y >= L && W.get(x, y) === M.EMPTY) W.set(x, y, o.sea.mat);
    }
    // hidden ocean under a shell of ice (Europa, Enceladus)
    if (o.iceOcean) {
      const y0 = Math.round(W.h * o.iceOcean[0]), y1 = Math.round(W.h * o.iceOcean[1]);
      const n = U.noise1D(rng, 40, 2);
      for (let x = 0; x < W.w; x++) {
        const a = y0 + Math.round(n(x) * 8), b = y1 - Math.round(n(x + 500) * 10);
        for (let y = a; y < b; y++) W.set(x, y, M.WATER);
        if (rng() < 0.02) for (let y = b; y < b + 2; y++) W.set(x, y, M.HVENT);
      }
      // cracks to the surface
      for (let i = 0; i < W.w / 160; i++) {
        let x = Math.floor(rng() * W.w);
        for (let y = G.surf(W, x); y < y0 + 4; y++) { W.set(x, y, M.EMPTY); if (rng() < 0.3) x += rng() < 0.5 ? -1 : 1; }
      }
    }
    for (const l of o.lakes || []) for (let i = 0; i < l.n * W.w / 600; i++) G.pond(W, rng, Math.floor(rng() * W.w), l.r + Math.floor(rng() * l.r), 3 + Math.floor(rng() * 4), l.mat, l.bottom || o.fill);
    // ore veins below the surface
    for (const [mat, n, rr] of o.ores || []) {
      for (let i = 0; i < n * W.w / 300; i++) {
        const x = Math.floor(rng() * W.w), top = W.floorY(x);
        const y = Math.round(top + 6 + (W.h - top - 8) * (0.1 + rng() * 0.8));
        G.blob(W, x, y, rr + Math.floor(rng() * 3), 1 + Math.floor(rng() * 2), mat, rng, [o.fill, ...o.top.map((t) => t[0])]);
      }
    }
    // surface boulders and features
    if (o.boulders) G.boulders(W, rng, Math.round(o.boulders * W.w / 100), o.boulderMat || o.fill);
    // flora and crystals
    const ground = [...new Set(o.top.map((t) => t[0]).concat([o.fill]))];
    for (const [kind, n] of o.flora || []) G.scatter(W, rng, kind, Math.round(n * W.w / 300), ground, { gap: kind === 'xenotree' ? 4 : 0 });
  }

  // ---------------------------------------------------------------- bodies
  // tier: exploration tier (0 = home). parent: what it orbits in the overview.
  const BODIES = [
    { id: 'sun', name: 'The Sun', icon: '☀️', kind: 'star', dist: 0, r: 16, color: '#ffd040' },
    { id: 'vulcan', name: 'Vulcan', icon: '🌋', kind: 'planet', fantasy: true, tier: 7, dist: 24, r: 3, color: '#ff6a20', period: 30,
      desc: 'The legendary hidden planet inside the orbit of Mercury, once hunted by astronomers. Rivers of lava and folk of living flame.' },
    { id: 'mercury', name: 'Mercury', icon: '☿️', kind: 'planet', tier: 2, dist: 36, r: 3, color: '#a89888', period: 45, desc: 'A scorched, cratered world baked by the nearby Sun.' },
    { id: 'venus', name: 'Venus', icon: '♀️', kind: 'planet', tier: 2, dist: 50, r: 5, color: '#e8c070', period: 70, desc: 'Crushing clouds, sulfur dunes and lakes of acid. Something drifts in the clouds.' },
    { id: 'earth', name: 'Earth', icon: '🌍', kind: 'planet', tier: 0, dist: 66, r: 5, color: '#3a7ad8', period: 100, phase: 0.1, desc: 'Home.' },
    { id: 'moon', name: 'The Moon', icon: '🌕', kind: 'moon', parent: 'earth', tier: 1, dist: 10, r: 2, color: '#c8c8cc', period: 12, desc: 'Grey dust, deep craters and Helium-3 in the regolith. Legend says a jade rabbit lives here.' },
    { id: 'antichthon', name: 'Antichthon', icon: '🪞', kind: 'planet', fantasy: true, tier: 7, dist: 66, r: 5, color: '#a0e8d0', period: 100, phase: 0.6,
      desc: 'The Counter-Earth of the ancient Greeks, forever hidden behind the Sun. A mirror of our world, home of the Mirror folk.' },
    { id: 'mars', name: 'Mars', icon: '🔴', kind: 'planet', tier: 2, dist: 84, r: 4, color: '#d0603a', period: 140, desc: 'Red deserts, canyons and polar ice. The Martians do not like visitors.' },
    { id: 'ceres', name: 'Ceres', icon: '🪨', kind: 'asteroid', tier: 3, dist: 104, r: 2, color: '#8a8478', period: 200, desc: 'The largest body of the asteroid belt: briny ice and rock.' },
    { id: 'vesta', name: 'Vesta', icon: '🪨', kind: 'asteroid', tier: 3, dist: 100, r: 2, color: '#a89a88', period: 190, phase: 0.33, desc: 'A battered protoplanet full of metals.' },
    { id: 'pallas', name: 'Pallas', icon: '🪨', kind: 'asteroid', tier: 3, dist: 108, r: 2, color: '#7a7a80', period: 210, phase: 0.66, desc: 'A tilted, platinum-rich asteroid.' },
    { id: 'phaeton', name: 'Phaeton', icon: '💠', kind: 'asteroid', fantasy: true, tier: 7, dist: 112, r: 2, color: '#80ffe8', period: 220, phase: 0.15,
      desc: 'A shard of the mythical lost planet that shattered to form the asteroid belt. Aether glows in its broken crust.' },
    { id: 'jupiter', name: 'Jupiter', icon: '🟠', kind: 'giant', dist: 132, r: 10, color: '#d8a878', period: 300, desc: 'A gas giant: no surface to land on, but its moons are worlds of their own.' },
    { id: 'io', name: 'Io', icon: '🟡', kind: 'moon', parent: 'jupiter', tier: 4, dist: 15, r: 2, color: '#e8d040', period: 8, desc: 'The most volcanic place in the solar system: sulfur plains and lava lakes.' },
    { id: 'europa', name: 'Europa', icon: '🧊', kind: 'moon', parent: 'jupiter', tier: 4, dist: 19, r: 2, color: '#d8e8f0', period: 11, desc: 'A shell of ice over a dark global ocean, warmed by vents. Life glows below.' },
    { id: 'ganymede', name: 'Ganymede', icon: '⚪', kind: 'moon', parent: 'jupiter', tier: 4, dist: 23, r: 3, color: '#a89a8a', period: 15, desc: 'The largest moon. Grey aliens keep a quiet base here.' },
    { id: 'callisto', name: 'Callisto', icon: '⚫', kind: 'moon', parent: 'jupiter', tier: 4, dist: 27, r: 2, color: '#6a6058', period: 20, desc: 'Ancient, frozen and covered in craters.' },
    { id: 'saturn', name: 'Saturn', icon: '🪐', kind: 'giant', dist: 160, r: 9, color: '#e8d4a0', ring: true, period: 420, phase: 0.4, desc: 'The ringed giant. Its moons hide methane seas and ice geysers.' },
    { id: 'titan', name: 'Titan', icon: '🟤', kind: 'moon', parent: 'saturn', tier: 5, dist: 17, r: 3, color: '#d8a050', period: 12, desc: 'Orange haze, methane rain and hydrocarbon seas. The Titanians fish its lakes.' },
    { id: 'enceladus', name: 'Enceladus', icon: '❄️', kind: 'moon', parent: 'saturn', tier: 5, dist: 22, r: 2, color: '#f0f8ff', period: 9, desc: 'A bright snowball with an ocean beneath its south pole.' },
    { id: 'uranus', name: 'Uranus', icon: '🔵', kind: 'giant', dist: 184, r: 7, color: '#a0e0e8', period: 520, phase: 0.75, desc: 'A sideways ice giant.' },
    { id: 'miranda', name: 'Miranda', icon: '🔷', kind: 'moon', parent: 'uranus', tier: 5, dist: 12, r: 2, color: '#b0c0d0', period: 8, desc: 'A patchwork moon of cliffs and crystal canyons.' },
    { id: 'titania', name: 'Titania', icon: '💎', kind: 'moon', parent: 'uranus', tier: 5, dist: 16, r: 2, color: '#c0a8d8', period: 12, desc: 'Fairy queen of the moons: crystal forests under a cyan sky-giant.' },
    { id: 'neptune', name: 'Neptune', icon: '🔵', kind: 'giant', dist: 204, r: 7, color: '#3a6ae0', period: 620, phase: 0.2, desc: 'The windiest planet, deep blue and far away.' },
    { id: 'triton', name: 'Triton', icon: '🧊', kind: 'moon', parent: 'neptune', tier: 6, dist: 13, r: 2, color: '#e0d0d8', period: 10, desc: 'A captured world of nitrogen ice and dark geysers.' },
    { id: 'pluto', name: 'Pluto', icon: '🤍', kind: 'planet', tier: 6, dist: 222, r: 2, color: '#e8d0c0', period: 760, phase: 0.6, desc: 'The little world with a heart of ice.' },
    { id: 'nibiru', name: 'Nibiru', icon: '🟣', kind: 'planet', fantasy: true, tier: 7, dist: 236, r: 6, color: '#a050e0', period: 1000, phase: 0.85,
      desc: 'The wandering planet of legend on its long, strange orbit. Home of the towering Nibirans and their winged serpents.' },
  ];
  const BY = Object.fromEntries(BODIES.map((b) => [b.id, b]));

  // world definitions for every landable body
  const ROCKY = [[M.REGOLITH, 4], [M.MOONROCK, 6]];
  const W8 = { clear: 1 };
  const DEF = {
    moon: { temp: -20, sky: SKY.airless, bodies: [EARTH], weather: W8, res: ['he3'],
      layers: [{ type: 'mountains', color: '#3a3a40', y: 0.5, amp: 0.14, scale: 80, haze: 0.1 }, { type: 'hills', color: '#55555c', y: 0.58, amp: 0.05, scale: 40, haze: 0.05 }],
      t: { base: 0.5, amp: 0.04, top: ROCKY, fill: M.MOONROCK, craters: 6, ores: [[M.HELIUM3, 3, 2]], boulders: 2 },
      fauna: [['moonrabbit', 4], ['regmite', 8], ['crawler', 2]] },
    mercury: { temp: 60, sky: SKY.airless, sunR: 9, weather: W8, res: ['iron', 'gold'],
      layers: [{ type: 'mountains', color: '#4a4038', y: 0.5, amp: 0.12, scale: 70, haze: 0.1 }],
      t: { base: 0.5, amp: 0.05, top: [[M.ASH, 2], [M.BASALT, 6]], fill: M.BASALT, craters: 7, ores: [[M.IRON, 3, 2], [M.GOLD, 2, 1]], boulders: 2, lakes: [{ mat: M.LAVA, n: 0.6, r: 6 }] },
      fauna: [['emberlizard', 5], ['lithovore', 4]] },
    venus: { temp: 90, sky: SKY.venus, weather: { cloudy: 3, fog: 2, drylightning: 2, windy: 1 }, res: ['sulfur'],
      layers: [{ type: 'volcano', color: '#7a5a2a', y: 0.5, amp: 0.2, cx: 0.4, width: 0.25, haze: 0.3 }, { type: 'dunes', color: '#a87a3a', y: 0.6, amp: 0.05, scale: 50, haze: 0.2 }],
      t: { base: 0.5, amp: 0.04, top: [[M.SULFUR, 3], [M.BASALT, 6]], fill: M.BASALT, ores: [[M.GOLD, 1, 1]], lakes: [{ mat: M.ACID, n: 2, r: 10 }, { mat: M.LAVA, n: 0.6, r: 5 }], flora: [['sulfurbloom', 12]] },
      fauna: [['cloudmanta', 4], ['acidslug', 6], ['sulfurmoth', 8]] },
    mars: { temp: -10, sky: SKY.mars, weather: { clear: 5, sandstorm: 2, windy: 2 }, res: ['rareearth', 'iron'], natives: 'martian',
      bodies: [{ x: 0.3, y: 0.12, r: 2, color: '#8a7a6a' }, { x: 0.82, y: 0.2, r: 1, color: '#7a6a5a' }],
      layers: [{ type: 'mesa', color: '#8a3a20', y: 0.52, amp: 0.16, scale: 80, haze: 0.3 }, { type: 'dunes', color: '#b8603a', y: 0.6, amp: 0.05, scale: 50, haze: 0.2 }],
      t: { base: 0.5, amp: 0.06, top: [[M.MARSDUST, 5], [M.MARSROCK, 4]], fill: M.MARSROCK, craters: 2, ores: [[M.RAREEARTH, 3, 2], [M.IRON, 2, 2], [M.ICE, 1, 3]], boulders: 1.5, flora: [['tendril', 6], ['bulbplant', 6]] },
      moss: 0.25, fauna: [['skitter', 8], ['rustbeetle', 6], ['dunewyrm', 1], ['redstalker', 2]] },
    ceres: { temp: -40, sky: SKY.airless, weather: W8, res: ['platinum', 'deuterium'],
      layers: [{ type: 'hills', color: '#3a3832', y: 0.55, amp: 0.06, scale: 30, haze: 0.05 }],
      t: { base: 0.5, amp: 0.05, top: [[M.REGOLITH, 3], [M.ICE, 2], [M.STONE, 4]], fill: M.STONE, craters: 5, ores: [[M.PLATINUM, 2, 2], [M.ICE, 3, 3]], boulders: 3 },
      fauna: [['lithovore', 6], ['voidmite', 6]] },
    vesta: { temp: -40, sky: SKY.airless, weather: W8, res: ['platinum', 'iron'],
      layers: [{ type: 'mountains', color: '#4a4238', y: 0.52, amp: 0.12, scale: 40, haze: 0.05 }],
      t: { base: 0.5, amp: 0.08, scale: 35, top: [[M.REGOLITH, 3], [M.BASALT, 5]], fill: M.BASALT, craters: 6, ores: [[M.PLATINUM, 3, 2], [M.IRON, 3, 2]], boulders: 3 },
      fauna: [['lithovore', 8], ['voidmite', 4]] },
    pallas: { temp: -40, sky: SKY.airless, weather: W8, res: ['platinum'],
      layers: [{ type: 'hills', color: '#38383e', y: 0.55, amp: 0.08, scale: 30, haze: 0.05 }],
      t: { base: 0.5, amp: 0.07, scale: 30, top: ROCKY, fill: M.MOONROCK, craters: 6, ores: [[M.PLATINUM, 4, 2]], boulders: 4 },
      fauna: [['lithovore', 6], ['voidmite', 8]] },
    io: { temp: 10, sky: SKY.airless, bodies: [JUP], weather: { clear: 3, ashfall: 2 }, res: ['sulfur'],
      layers: [{ type: 'volcano', color: '#6a5a20', y: 0.5, amp: 0.22, cx: 0.6, width: 0.2, haze: 0.2 }],
      t: { base: 0.5, amp: 0.04, top: [[M.SULFUR, 4], [M.BASALT, 5]], fill: M.BASALT, lakes: [{ mat: M.LAVA, n: 2, r: 8 }], flora: [['sulfurbloom', 14]] },
      fauna: [['lavasal', 6], ['sulfurcrab', 8]] },
    europa: { temp: -30, sky: SKY.airless, bodies: [JUP], weather: { clear: 3, snow: 1 }, res: ['deuterium'], water: ['#2a7aa8', '#06122a'], abyss: 0.5,
      layers: [{ type: 'ice', color: '#a8c0d0', y: 0.55, amp: 0.1, scale: 40, haze: 0.1 }],
      t: { base: 0.3, amp: 0.02, top: [[M.SNOW, 2], [M.ICE, 8]], fill: M.STONE, iceOcean: [0.4, 0.85], flora: [['icefern', 6]] },
      waterSeeds: [['kelp', 2], ['tubeworm', 2], ['anemone', 1]],
      fauna: [['gloweel', 10], ['ventshrimp', 14], ['icekraken', 1], ['glacierhop', 3]] },
    ganymede: { temp: -35, sky: SKY.airless, bodies: [JUP], weather: W8, res: ['deuterium', 'iron'], natives: 'grey',
      layers: [{ type: 'hills', color: '#4a4440', y: 0.55, amp: 0.08, scale: 50, haze: 0.05 }],
      t: { base: 0.5, amp: 0.04, top: [[M.ICE, 2], [M.ALIENSOIL, 3], [M.STONE, 4]], fill: M.STONE, craters: 3, ores: [[M.ICE, 3, 3], [M.IRON, 2, 2]], flora: [['bulbplant', 8], ['sporecap', 3]] },
      moss: 0.6, fauna: [['frostback', 5], ['iceworm', 6]] },
    callisto: { temp: -45, sky: SKY.airless, bodies: [JUP], weather: W8, res: ['deuterium'],
      layers: [{ type: 'hills', color: '#2e2a26', y: 0.55, amp: 0.06, scale: 40, haze: 0.05 }],
      t: { base: 0.5, amp: 0.04, top: [[M.REGOLITH, 2], [M.ICE, 3], [M.MOONROCK, 4]], fill: M.MOONROCK, craters: 9, ores: [[M.ICE, 3, 3]], boulders: 2, flora: [['icefern', 4]] },
      fauna: [['iceworm', 8], ['frostback', 3]] },
    titan: { temp: -60, sky: SKY.titan, bodies: [SAT], weather: { fog: 2, cloudy: 3, clear: 1 }, res: ['methane'], natives: 'titanian',
      layers: [{ type: 'hills', color: '#6a4a24', y: 0.52, amp: 0.08, scale: 60, haze: 0.4 }, { type: 'dunes', color: '#8a5a2a', y: 0.6, amp: 0.04, scale: 40, haze: 0.3 }],
      t: { base: 0.5, amp: 0.05, top: [[M.ALIENSOIL, 3], [M.ICE, 4]], fill: M.STONE, sea: { mat: M.METHANE, level: 0.53 }, lakes: [{ mat: M.METHANE, n: 2, r: 9 }], flora: [['sporecap', 6], ['tendril', 8]] },
      moss: 0.7, fauna: [['methray', 6], ['hydrojelly', 6], ['frostback', 3]] },
    enceladus: { temp: -50, sky: SKY.airless, bodies: [SAT], weather: { snow: 3, clear: 1 }, res: ['deuterium'], water: ['#3a8ab8', '#08142a'], abyss: 0.52,
      layers: [{ type: 'ice', color: '#d0e0ec', y: 0.55, amp: 0.1, scale: 30, haze: 0.1 }],
      t: { base: 0.32, amp: 0.02, top: [[M.SNOW, 3], [M.ICE, 7]], fill: M.STONE, iceOcean: [0.42, 0.88], flora: [['icefern', 8]] },
      waterSeeds: [['tubeworm', 2], ['anemone', 1]],
      fauna: [['gloweel', 8], ['ventshrimp', 12], ['icekraken', 1]] },
    miranda: { temp: -60, sky: SKY.airless, bodies: [URA], weather: W8, res: ['crystal'],
      layers: [{ type: 'mesa', color: '#4a5260', y: 0.5, amp: 0.2, scale: 50, haze: 0.05 }],
      t: { base: 0.5, amp: 0.1, scale: 35, top: [[M.ICE, 3], [M.STONE, 5]], fill: M.STONE, ores: [[M.CRYSTAL, 2, 2]], flora: [['crystalspire', 8]] },
      fauna: [['crystalback', 4], ['shardling', 8]] },
    titania: { temp: -60, sky: SKY.airless, bodies: [URA], weather: W8, res: ['crystal'],
      layers: [{ type: 'hills', color: '#3a3448', y: 0.55, amp: 0.06, scale: 40, haze: 0.05 }],
      t: { base: 0.5, amp: 0.04, top: [[M.ALIENSOIL, 3], [M.STONE, 5]], fill: M.STONE, ores: [[M.CRYSTAL, 3, 2]], flora: [['crystalspire', 14], ['bulbplant', 10], ['xenotree', 4]] },
      moss: 0.8, fauna: [['crystalback', 6], ['shardling', 10], ['aetherwisp', 3]] },
    triton: { temp: -70, sky: SKY.airless, bodies: [NEP], weather: { snow: 1, clear: 2 }, res: ['methane', 'crystal'],
      layers: [{ type: 'ice', color: '#b0a0a8', y: 0.55, amp: 0.08, scale: 40, haze: 0.05 }],
      t: { base: 0.5, amp: 0.04, top: [[M.SNOW, 3], [M.ICE, 6]], fill: M.STONE, lakes: [{ mat: M.METHANE, n: 1, r: 7 }], ores: [[M.CRYSTAL, 2, 2]], flora: [['icefern', 6], ['crystalspire', 4]] },
      fauna: [['glacierhop', 8], ['iceworm', 6], ['shardling', 4]] },
    pluto: { temp: -80, sky: SKY.airless, weather: { snow: 2, clear: 2 }, res: ['methane', 'crystal'], sunR: 1,
      layers: [{ type: 'mountains', color: '#8a7a70', y: 0.5, amp: 0.14, scale: 60, haze: 0.05 }],
      t: { base: 0.5, amp: 0.05, top: [[M.SNOW, 4], [M.ICE, 6]], fill: M.STONE, ores: [[M.CRYSTAL, 2, 2]], lakes: [{ mat: M.METHANE, n: 1, r: 8 }], flora: [['icefern', 5]] },
      fauna: [['glacierhop', 10], ['iceworm', 4]] },
    vulcan: { temp: 120, sky: SKY.vulcan, sunR: 12, weather: { clear: 2, ashfall: 2, drylightning: 1 }, res: ['aether', 'gold'], natives: 'vulcanite',
      layers: [{ type: 'volcano', color: '#5a1a0a', y: 0.48, amp: 0.25, cx: 0.5, width: 0.3, haze: 0.2 }],
      t: { base: 0.5, amp: 0.05, top: [[M.ASH, 2], [M.BASALT, 6]], fill: M.BASALT, lakes: [{ mat: M.LAVA, n: 3, r: 8 }], ores: [[M.AETHER, 2, 2], [M.GOLD, 2, 2]], flora: [['sulfurbloom', 8]] },
      fauna: [['magmagolem', 3], ['emberlizard', 8], ['lavasal', 4]] },
    nibiru: { temp: 15, sky: SKY.nibiru, weather: { clear: 3, rain: 1, storm: 1, fog: 1 }, res: ['aether', 'crystal'], natives: 'nibiran',
      layers: [{ type: 'mountains', color: '#3a1a5a', y: 0.48, amp: 0.2, scale: 90, haze: 0.4 }, { type: 'jungle', color: '#5a2a6a', y: 0.6, amp: 0.06, scale: 40, haze: 0.3 }],
      t: { base: 0.5, amp: 0.05, top: [[M.ALIENMOSS, 1], [M.ALIENSOIL, 6]], fill: M.STONE, ores: [[M.AETHER, 2, 2], [M.CRYSTAL, 2, 2]], lakes: [{ mat: M.WATER, n: 1.5, r: 9 }], flora: [['xenotree', 18], ['sporecap', 6], ['bulbplant', 14], ['tendril', 10]] },
      seeds: [['xenotree', 2], ['sporecap', 1], ['bulbplant', 2]], fauna: [['skyserpent', 2], ['frostback', 4], ['skitter', 6], ['aetherwisp', 4]] },
    antichthon: { temp: 16, sky: SKY.mirror, weather: { clear: 4, rain: 2, cloudy: 2, storm: 0.5 }, res: ['aether'], natives: 'mirrorfolk',
      layers: [{ type: 'mountains', color: '#3a7a8a', y: 0.48, amp: 0.15, scale: 80, haze: 0.4 }, { type: 'trees', color: '#2a6a5a', y: 0.6, amp: 0.04, scale: 30, haze: 0.3 }],
      t: { base: 0.5, amp: 0.04, top: [[M.GRASS, 1], [M.SOIL, 6]], fill: M.STONE, ores: [[M.AETHER, 1, 2], [M.IRON, 2, 2], [M.COAL, 2, 2]], lakes: [{ mat: M.WATER, n: 1.5, r: 10 }], flora: [['birch', 14], ['tree', 10], ['flower', 20], ['tuft', 30]] },
      seeds: [['birch', 2], ['tree', 1]], tufts: ['tuft', 'flower'], earthly: true, fauna: [['mirrorstag', 6], ['rabbit', 6], ['songbird', 6], ['butterfly', 6], ['deer', 3]] },
    phaeton: { temp: -30, sky: SKY.airless, weather: W8, res: ['aether', 'platinum'],
      layers: [{ type: 'mountains', color: '#2a3a40', y: 0.5, amp: 0.18, scale: 30, haze: 0.05 }],
      t: { base: 0.5, amp: 0.09, scale: 25, top: [[M.REGOLITH, 2], [M.BASALT, 6]], fill: M.BASALT, craters: 4, ores: [[M.AETHER, 3, 2], [M.PLATINUM, 2, 2]], flora: [['crystalspire', 10]] },
      fauna: [['aetherwisp', 8], ['shardling', 8], ['voidmite', 6]] },
  };

  // turn each definition into a biome object the engine understands
  const PLANETS = {};
  for (const id in DEF) {
    const d = DEF[id], b = BY[id];
    const kinds = (d.t.flora || []).map(([k]) => k);
    PLANETS[id] = Object.assign({}, b, {
      id: 'planet:' + id, body: id, space: true,
      temp: d.temp, water: d.water || ['#4a90c8', '#123a6a'],
      bg: { sky: d.sky, layers: d.layers, sun: d.sun, sunR: d.sunR, bodies: d.bodies, alwaysStars: d.sky === SKY.airless },
      weather: d.weather, noClouds: d.sky === SKY.airless,
      seeds: d.seeds || (kinds.length ? kinds.slice(0, 3).map((k) => [k, 1]) : [['bulbplant', 1]]),
      tufts: d.tufts || ['bulbplant'], fertility: d.earthly ? 1 : 0.35, leafFall: 0,
      waterSeeds: d.waterSeeds || [['tubeworm', 1]], res: d.res, natives: d.natives, abyss: d.abyss,
      fauna: d.fauna,
      gen(W, rng) {
        terrain(W, rng, d.t);
        // patches of alien moss on worlds that have it
        if (d.moss) {
          const n = U.noise1D(rng, 70, 2);
          for (let x = 0; x < W.w; x++) if (n(x) < d.moss) {
            const y = W.floorY(x);
            if (y < W.h - 2 && !W.isLiquid(x, y - 1)) { W.set(x, y, M.ALIENMOSS); W.set(x, y + 1, M.ALIENSOIL); }
          }
        }
      },
    });
  }

  // resources found off-world (icons for the colony UI)
  const RES = [['oil', '🛢️'], ['he3', '🔹'], ['rareearth', '🧲'], ['sulfur', '🟨'], ['platinum', '💿'], ['deuterium', '💧'], ['methane', '🟤'], ['crystal', '🔮'], ['aether', '✨']];

  DS.Space = { BODIES, BY, PLANETS, RES, terrain };
})();
