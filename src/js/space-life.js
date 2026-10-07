// Alien flora and fauna for the worlds of the solar system (Colony mode).
(function () {
  'use strict';
  const DS = window.DS;
  const { M } = DS;
  const { def } = DS.SpeciesKit;
  const F = DS.Flora;

  // ---------------------------------------------------------------- alien plants
  const ri = (rng, a, b) => Math.floor(a + rng() * (b - a + 1));
  const blob = (out, cx, cy, rx, ry, mat, rng, dens = 0.9) => {
    for (let dy = -ry; dy <= ry; dy++) for (let dx = -rx; dx <= rx; dx++) {
      const d = (dx * dx) / (rx * rx + 0.01) + (dy * dy) / (ry * ry + 0.01);
      if (d <= 1 && (d < 0.6 || rng() < dens)) out.push([cx + dx, cy + dy, mat]);
    }
  };
  const B = F.builders;
  // tall purple tree with a drooping magenta canopy and glowing fruit
  B.xenotree = (rng) => {
    const out = [];
    const h = ri(rng, 8, 15);
    let x = 0;
    for (let y = 0; y < h; y++) { if (y > 3 && rng() < 0.2) x += rng() < 0.5 ? -1 : 1; out.push([x, -y, M.XENOWOOD, y > h - 4 ? M.XENOLEAF : 0]); }
    const cy = -h;
    blob(out, x, cy, ri(rng, 4, 6), 2, M.XENOLEAF, rng);
    for (let i = -5; i <= 5; i += 2) if (rng() < 0.7) for (let d = 1; d < ri(rng, 2, 5); d++) out.push([x + i, cy + 2 + d, M.XENOLEAF]);
    for (let k = 0; k < 3; k++) out.push([x + ri(rng, -4, 4), cy + 3, M.XENOBULB]);
    return out;
  };
  B.bulbplant = (rng) => {
    const out = [];
    const h = ri(rng, 1, 3);
    for (let y = 0; y < h; y++) out.push([0, -y, M.XENOLEAF]);
    out.push([0, -h, M.XENOBULB]);
    if (rng() < 0.5) out.push([1, -h + 1, M.XENOBULB]);
    return out;
  };
  B.crystalspire = (rng) => {
    const out = [];
    const h = ri(rng, 4, 12);
    for (let y = 0; y < h; y++) { const wd = Math.max(0, Math.round((1 - y / h) * 1.6)); for (let dx = -wd; dx <= wd; dx++) out.push([dx, -y, M.CRYSTAL]); }
    if (rng() < 0.6) { const s = rng() < 0.5 ? -1 : 1; for (let i = 1; i < h / 2; i++) out.push([s * (1 + i), -i, M.CRYSTAL]); }
    return out;
  };
  B.sporecap = (rng) => {
    const out = [];
    const h = ri(rng, 4, 9);
    for (let y = 0; y < h; y++) out.push([0, -y, M.FUNGUS]);
    const r = ri(rng, 3, 5);
    for (let dx = -r; dx <= r; dx++) { out.push([dx, -h, M.XENOLEAF]); if (Math.abs(dx) < r) out.push([dx, -h - 1, M.XENOLEAF]); }
    for (let dx = -r + 1; dx < r; dx += 2) out.push([dx, -h + 1, M.XENOBULB]);
    return out;
  };
  B.tendril = (rng) => {
    const out = [];
    const h = ri(rng, 3, 8);
    let x = 0;
    for (let y = 0; y < h; y++) { x += Math.round(Math.sin(y * 0.9) * 0.8); out.push([x, -y, M.XENOLEAF]); }
    out.push([x, -h, M.XENOBULB]);
    return out;
  };
  B.sulfurbloom = (rng) => {
    const out = [];
    const h = ri(rng, 2, 4);
    for (let y = 0; y < h; y++) out.push([0, -y, M.BASALT]);
    blob(out, 0, -h, 2, 1, M.SULFUR, rng, 1);
    return out;
  };
  B.icefern = (rng) => {
    const out = [];
    const h = ri(rng, 3, 7);
    for (let y = 0; y < h; y++) { out.push([0, -y, M.ICE]); if (y > 1 && y % 2) { out.push([-1, -y, M.ICE]); out.push([1, -y - 1, M.ICE]); } }
    out.push([0, -h, M.XENOBULB]);
    return out;
  };
  Object.assign(F.labels, { xenotree: 'Xeno tree', bulbplant: 'Glow bulb', crystalspire: 'Crystal spire', sporecap: 'Spore cap', tendril: 'Tendril', sulfurbloom: 'Sulfur bloom', icefern: 'Ice fern' });

  // ---------------------------------------------------------------- alien animals
  const A = (id, o) => def(id, Object.assign({ cat: 'alien', metab: 1 / 300, breed: 0.004, max: 10, sense: 50, life: 900, mature: 60, alien: true }, o));

  // The Moon
  A('moonrabbit', { name: 'Jade rabbit', art: [['.w.w..', '.w.w..', '.wwwwe', 'wwwww.', '.w.w..']], pal: { w: '#e8f0e4', e: '#40c080' }, speed: 0.5, jumpy: true, metab: 0, glow: '#a0ffd0', max: 8, breed: 0.01 });
  A('regmite', { name: 'Regolith mite', hab: 'burrow', art: [['.kk.', 'kkkk', 'k..k']], pal: { k: '#c8c8d0' }, speed: 0.3, metab: 0, max: 20, breed: 0.01 });
  A('crawler', { name: 'Crater crawler', art: [['..bbbb..', '.bbbbbbe', 'k.k.k.k.']], pal: { b: '#5a5a66', e: '#ff4040', k: '#2a2a30' }, speed: 0.35, metab: 0, prey: ['regmite', 'moonrabbit', 'villager'], max: 4 });
  // Mars
  A('skitter', { name: 'Dust skitter', art: [['..rr.', '.rrre', 'r.r.r']], pal: { r: '#d8783a', e: '#ffe060' }, speed: 0.7, jumpy: true, eats: ['ALIENMOSS', 'XENOLEAF'], max: 16, breed: 0.012 });
  A('rustbeetle', { name: 'Rust beetle', art: [['.ooo.', 'ooooe', 'k.k.k']], pal: { o: '#9a3a1a', e: '#e8c040', k: '#3a1a10' }, speed: 0.25, eats: ['ALIENMOSS', 'XENOBULB'], max: 14, breed: 0.01 });
  A('dunewyrm', { name: 'Dune wyrm', hab: 'burrow', digs: true, art: [['.....tt', 'sssssst', 's.s.s.e']], pal: { s: '#b8603a', t: '#e8a070', e: '#200808' }, speed: 0.45, prey: ['skitter', 'rustbeetle', 'villager', 'martian'], max: 2, breed: 0.002, life: 3000 });
  A('redstalker', { name: 'Red stalker', art: [['......hh', 'tt.bbbbhe', '..bbbbbb.', '..k.k.k..', '..k...k..']], pal: { b: '#8a2a1a', h: '#a83a24', t: '#8a2a1a', e: '#ffd040', k: '#3a100a' }, speed: 0.75, prey: ['skitter', 'rustbeetle', 'villager'], max: 3, breed: 0.003, life: 2000 });
  // Venus & Mercury
  A('cloudmanta', { name: 'Cloud manta', hab: 'air', art: [['w.....w', 'wwwwwww', '..www..', '...t...'], ['.......', 'wwwwwww', 'w.www.w', '...t...']], pal: { w: '#e8d890', t: '#b8a860' }, speed: 0.35, flutter: true, metab: 0, perches: 0, sleeps: false, max: 8 });
  A('acidslug', { name: 'Acid slug', art: [['...ee', '.gggg', 'ggggg']], pal: { g: '#b8c830', e: '#202010' }, speed: 0.1, toxicOk: true, eats: ['ALIENMOSS', 'SULFUR'], max: 12 });
  A('sulfurmoth', { name: 'Sulfur moth', hab: 'air', art: [['y.y', 'yby'], ['...', 'yby']], pal: { y: '#f0e040', b: '#5a4a10' }, speed: 0.4, flutter: true, metab: 0, glow: '#f0e040', perches: 0.3, max: 14 });
  A('emberlizard', { name: 'Ember lizard', art: [['....oe', 'ttoooo', '..k.k.']], pal: { o: '#e86a20', t: '#c84a10', e: '#ffff80', k: '#3a1a08' }, speed: 0.55, metab: 0, glow: '#ff8a30', prey: ['sulfurmoth'], max: 8 });
  // asteroids
  A('lithovore', { name: 'Rock grazer', hab: 'burrow', digs: true, art: [['.ggg.', 'ggggg', 'gegeg']], pal: { g: '#8a8478', e: '#40e0ff' }, speed: 0.2, metab: 0, max: 10 });
  A('voidmite', { name: 'Void mite', hab: 'air', art: [['.v.', 'vgv', '.v.']], pal: { v: '#8060ff', g: '#e0d0ff' }, speed: 0.3, flutter: true, metab: 0, glow: '#9080ff', perches: 0, sleeps: false, max: 20, life: 5000 });
  // Io
  A('lavasal', { name: 'Lava salamander', art: [['.....oo', 'ttooooe', '..k..k.']], pal: { o: '#ff7a20', t: '#ffb040', e: '#2a0a00', k: '#a83a10' }, speed: 0.4, metab: 0, glow: '#ff7a20', max: 8 });
  A('sulfurcrab', { name: 'Sulfur crab', art: [['y...y', 'yyyyy', '.yey.', 'k.k.k']], pal: { y: '#e8c830', e: '#1a1a1a', k: '#8a6a10' }, speed: 0.3, eats: ['SULFUR', 'XENOBULB'], max: 12 });
  // icy ocean moons
  A('gloweel', { name: 'Glow eel', hab: 'water', art: [['.ggggggge'], ['gggggg.ge']], pal: { g: '#40e0c0', e: '#ffffff' }, speed: 0.45, school: true, metab: 0, glow: '#40ffd0', sleeps: false, max: 18, breed: 0.01 });
  A('ventshrimp', { name: 'Vent shrimp', hab: 'water', art: [['.pp.', 'pppe', 'p.p.']], pal: { p: '#f0a0c0', e: '#202020' }, speed: 0.35, school: true, metab: 0, sleeps: false, max: 24, breed: 0.012 });
  A('icekraken', { name: 'Ice kraken', hab: 'water', art: [['..bbbb..', '.bbbbbb.', '.bebbeb.', 'b.b.b.b.', 'b..b..b.']], pal: { b: '#5a7ab0', e: '#ffffa0' }, speed: 0.4, metab: 0, prey: ['gloweel', 'ventshrimp'], sleeps: false, max: 2, life: 5000 });
  // Ganymede, Callisto, Pluto
  A('frostback', { name: 'Frostback', art: [['.......hh', '.wwwwwwhe', 'wwwwwwww.', '.k.k..k.k']], pal: { w: '#c8dcf0', h: '#a8bcd8', e: '#1a2a4a', k: '#5a6a8a' }, speed: 0.3, eats: ['ALIENMOSS', 'XENOBULB'], max: 8, breed: 0.006 });
  A('iceworm', { name: 'Ice worm', hab: 'burrow', digs: true, art: [['bbbbbe']], pal: { b: '#d8f0ff', e: '#4080c0' }, speed: 0.25, metab: 0, max: 12 });
  A('glacierhop', { name: 'Glacier hopper', art: [['.hh.', 'hhhe', 'h..h']], pal: { h: '#f0d8c8', e: '#2a1a1a' }, speed: 0.6, jumpy: true, eats: ['ALIENMOSS'], max: 12, breed: 0.01 });
  // Titan & Uranus moons
  A('methray', { name: 'Methane ray', hab: 'water', art: [['o.....o', 'ooooooe', '...t...']], pal: { o: '#c88a40', e: '#ffffff', t: '#8a5a20' }, speed: 0.35, metab: 0, sleeps: false, max: 8 });
  A('hydrojelly', { name: 'Hydrocarbon jelly', hab: 'air', art: [['.ooo.', 'ooooo', 'o.o.o', 'o.o..'], ['.ooo.', 'ooooo', '.o.o.', '.o.o.']], pal: { o: '#e8a050' }, speed: 0.2, flutter: true, metab: 0, glow: '#ffb060', perches: 0, sleeps: false, max: 10 });
  A('crystalback', { name: 'Crystal crawler', art: [['..c.c.', '.ccccc', 'bbbbbe', 'k.k.k.']], pal: { c: '#c080ff', b: '#4a3a6a', e: '#ffffff', k: '#2a2040' }, speed: 0.25, metab: 0, glow: '#c080ff', max: 8 });
  A('shardling', { name: 'Shardling', art: [['.c.', 'cec', 'c.c']], pal: { c: '#a0e8ff', e: '#203040' }, speed: 0.5, jumpy: true, metab: 0, max: 16, breed: 0.01 });
  // fantasy worlds
  A('magmagolem', { name: 'Magma golem', art: [['.rrr.', '.rer.', 'rrrrr', 'r.o.r', '.r.r.', '.r.r.']], pal: { r: '#4a2a20', o: '#ff7a20', e: '#ffd040' }, speed: 0.15, metab: 0, glow: '#ff7a20', max: 4, life: 9000 });
  A('skyserpent', { name: 'Winged serpent', hab: 'air', art: [['..w.w...', 'ggggggge', '.....w..'], ['........', 'ggggggge', '..w.w...']], pal: { g: '#30c060', w: '#f0d040', e: '#ff3030' }, speed: 0.8, flutter: true, prey: ['skitter', 'glacierhop', 'villager'], max: 3 });
  A('aetherwisp', { name: 'Aether wisp', hab: 'air', art: [['.a.', 'aaa', '.a.']], pal: { a: '#80ffe8' }, speed: 0.4, flutter: true, metab: 0, glow: '#80ffe8', perches: 0, sleeps: false, max: 16, life: 6000 });
  A('mirrorstag', { name: 'Mirror stag', art: [['w.w....', '.w.....', '.ss....', '.ssssss', '..s..s.', '..s..s.']], pal: { w: '#d0e0ff', s: '#e8eef8' }, speed: 0.55, jumpy: true, eats: ['GRASS', 'PLANT', 'LEAF'], max: 8, breed: 0.006 });

  // ---------------------------------------------------------------- alien civilisations (workers + warriors)
  const CIV = {};
  const people = (id, name, w, s, o) => {
    A(id, Object.assign({ name, cat: 'alien', hab: 'climb', civ: true, digs: true, humanoid: true, art: w, speed: 0.55, metab: 0, breed: 0, sleeps: false, max: 300, life: 60 * 15, sense: 60 }, o));
    A(id + 'war', Object.assign({ name: name + ' warrior', cat: 'alien', hab: 'climb', civ: true, soldier: true, humanoid: true, art: s, speed: 0.65, metab: 0, breed: 0, sleeps: false, max: 200, life: 60 * 15, sense: 80 }, o));
    CIV[id] = { worker: id, soldier: id + 'war' };
  };
  people('martian', 'Martian',
    [['a...a', '.ggg.', '.geg.', '.sss.', 'gsssg', '.p.p.', '.p.p.']],
    [['a...a', '.ggg.', '.geg.', '.sssw', 'gsssd', '.p.pd', '.p.p.']],
    { pal: { a: '#80ff80', g: '#60d060', e: '#101010', s: '#c0c8d0', p: '#60d060', w: '#ff40ff', d: '#606870' } });
  people('grey', 'Grey',
    [['.ggg.', 'ggggg', 'eg.ge', '.ggg.', '..s..', '.sss.', '.s.s.', '.s.s.']],
    [['.ggg.', 'ggggg', 'eg.ge', '.ggg.', '..s.w', '.sssd', '.s.sd', '.s.s.']],
    { pal: { g: '#a8b0b8', e: '#0a0a0a', s: '#8a929a', w: '#40e0ff', d: '#505860' } });
  people('titanian', 'Titanian',
    [['.oo.', 'oooo', '.ee.', 'ssss', '.ss.', 's..s', 's..s']],
    [['.oo..', 'oooow', '.ee.d', 'ssssd', '.ss.d', 's..s.', 's..s.']],
    { pal: { o: '#d89a50', e: '#3a1a00', s: '#a86a30', w: '#ffd060', d: '#6a4a20' } });
  people('vulcanite', 'Salamander folk',
    [['.rr.', 'rre.', '.rr.', 'oooo', '.oo.', 'r..r', 'r..r']],
    [['.rr..', 'rre.w', '.rr.d', 'ooood', '.oo.d', 'r..r.', 'r..r.']],
    { pal: { r: '#e84a20', e: '#ffff60', o: '#ff9a30', w: '#ffe060', d: '#5a2a10' }, glow: '#ff7a30' });
  people('nibiran', 'Nibiran',
    [['.yy.', '.ff.', '.fe.', 'bbbb', 'bbbb', 'bbbb', '.bb.', '.b.b', '.b.b']],
    [['.yy..', '.ff.w', '.fe.w', 'bbbbd', 'bbbbd', 'bbbbd', '.bb.d', '.b.b.', '.b.b.']],
    { pal: { y: '#f0d040', f: '#5a8ac8', e: '#ffffff', b: '#2a3a8a', w: '#f0f0ff', d: '#c8a020' } });
  people('mirrorfolk', 'Mirror folk',
    [['.h.', '.f.', 'sss', 'sss', '.p.', 'p.p', 'p.p']],
    [['.h..w', '.f..w', 'sssfd', 'sss.d', '.p..d', 'p.p.d', 'p.p..']],
    { pal: { h: '#e8e8f0', f: '#c0d8f0', s: '#f0f0f8', p: '#b0b8d0', w: '#ffffff', k: '#a0a0b0', d: '#8090a8' }, alpha: 0.9 });

  DS.finalizeSpecies();
  if (!DS.SpeciesCats.some((c) => c[0] === 'alien')) DS.SpeciesCats.push(['alien', 'Alien life']);
  DS.AlienCiv = CIV;
})();
