// Species for the newer landscapes, a humanoid sprite generator and
// scaled-up "backyard" bugs for the lawn biome.
(function () {
  'use strict';
  const DS = window.DS;
  const U = DS.U;
  const { def, bird, fish, S } = DS.SpeciesKit;

  // ---------------------------------------------------------------- humanoids
  // Builds a side-view person-like sprite. Palette letters: h hair, f skin,
  // e eye, s clothes, p legs, k feet/dark, a horns, m hat, c cape, v wings,
  // t tail, w weapon blade, d weapon handle, g glow, b beard
  function humanoid(o) {
    const g = new Map();
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    const put = (x, y, c, keep) => {
      const k = x + ',' + y;
      if (keep && g.has(k)) return;
      g.set(k, c);
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    };
    const H = o.h || 7, w = o.w || 3, bw = Math.floor(w / 2);
    const [hw, hh] = o.head || [Math.max(1, w - 2 + (w <= 3 ? 0 : 0)), Math.max(1, Math.round(H * 0.2))];
    const legH = o.legs == null ? Math.max(2, Math.round(H * 0.3)) : o.legs;
    const bodyH = Math.max(2, H - legH - hh);
    const hl = -Math.floor(hw / 2), hr = hl + hw - 1;
    // head
    for (let y = 0; y < hh; y++) for (let x = hl; x <= hr; x++) put(x, y, 'f');
    if (o.hair) { for (let x = hl; x <= hr; x++) put(x, 0, 'h'); if (o.hair === 'long') for (let y = 0; y < hh + 1; y++) put(hl - 1, y, 'h'); }
    if (o.snakehair) for (let x = hl - 1; x <= hr + 1; x++) { put(x, -1, x % 2 ? 'h' : '.'); put(x, 0, 'h'); }
    if (o.eye === 'one') put(Math.round((hl + hr) / 2), Math.floor(hh / 2), 'e');
    else put(hr, Math.min(hh - 1, Math.floor(hh / 2)), 'e');
    if (o.snout) for (let i = 1; i <= o.snout; i++) put(hr + i, hh - 1, 'f');
    if (o.ears) { put(hl, -1, 'f'); put(hr, -1, 'f'); }
    if (o.horns) { put(hl - 1, -1, 'a'); put(hr + 1, -1, 'a'); if (o.horns === 'big') { put(hl - 2, -2, 'a'); put(hr + 2, -2, 'a'); } }
    if (o.antenna) { put(0, -1, 'a'); put(0, -2, 'g'); }
    if (o.beard) for (let y = hh - 1; y < hh + (o.beard === 'long' ? bodyH : 2); y++) for (let x = hl; x <= hr; x++) put(x, y, 'b');
    switch (o.hat) {
      case 'wizard': put(0, -1, 'm'); put(-1, -1, 'm'); put(1, -1, 'm'); put(0, -2, 'm'); put(0, -3, 'm'); put(1, -4, 'm'); for (let x = hl - 1; x <= hr + 1; x++) put(x, 0, 'm'); break;
      case 'helmet': for (let x = hl; x <= hr; x++) put(x, -1, 'm'); put(hl, 0, 'm'); break;
      case 'crown': for (let x = hl; x <= hr; x++) put(x, -1, x % 2 ? 'y' : 'm'); break;
      case 'hood': for (let x = hl - 1; x <= hr; x++) put(x, -1, 'm'); for (let y = 0; y < hh; y++) put(hl - 1, y, 'm'); break;
      case 'cap': for (let x = hl; x <= hr + 1; x++) put(x, -1, 'm'); break;
    }
    // body
    const by = hh;
    for (let y = by; y < by + bodyH; y++) for (let x = -bw; x <= bw; x++) put(x, y, o.belt && y === by + bodyH - 1 ? 'k' : 's', true);
    if (o.belly) put(bw + 1, by + Math.floor(bodyH / 2), 's');
    // arms / hands
    const handY = by + Math.floor(bodyH * 0.6);
    put(bw + 1, handY, 'f');
    if (!o.noBackArm) put(-bw - 1, handY, 'f', true);
    if (o.cape) for (let y = by; y < by + bodyH + legH; y++) put(-bw - 1, y, 'c');
    if (o.wings) for (let y = by - 2; y < by + bodyH - 1; y++) for (let i = 1; i <= Math.min(4, 1 + (y - by + 2)); i++) put(-bw - i, y, 'v', true);
    if (o.tail) for (let i = 1; i <= o.tail; i++) put(-bw - i, by + bodyH - 1 + Math.floor(i / 2), 't', true);
    // weapon in the front hand
    const wx = bw + 2;
    switch (o.weapon) {
      case 'sword': for (let y = handY - 4; y < handY; y++) put(wx, y, 'w'); put(wx, handY, 'd'); break;
      case 'club': for (let y = handY - 4; y <= handY; y++) { put(wx, y, 'd'); if (y < handY - 1) put(wx + 1, y, 'd'); } break;
      case 'axe': for (let y = handY - 4; y <= handY + 1; y++) put(wx, y, 'd'); put(wx + 1, handY - 4, 'w'); put(wx + 1, handY - 3, 'w'); put(wx + 2, handY - 4, 'w'); break;
      case 'staff': for (let y = handY - bodyH - hh; y <= handY + legH; y++) put(wx, y, 'd'); put(wx, handY - bodyH - hh - 1, 'g'); break;
      case 'spear': for (let y = handY - bodyH - hh; y <= handY + legH; y++) put(wx, y, 'd'); put(wx, handY - bodyH - hh - 1, 'w'); put(wx, handY - bodyH - hh - 2, 'w'); break;
      case 'trident': for (let y = handY - bodyH - hh + 1; y <= handY + legH; y++) put(wx, y, 'd'); for (const dx of [-1, 0, 1]) { put(wx + dx, handY - bodyH - hh, 'w'); if (dx) put(wx + dx, handY - bodyH - hh - 1, 'w'); } put(wx, handY - bodyH - hh - 2, 'w'); break;
      case 'bow': for (let y = handY - 2; y <= handY + 2; y++) put(wx + (Math.abs(y - handY) < 2 ? 1 : 0), y, 'd'); break;
      case 'shield': for (let y = handY - 1; y <= handY + 1; y++) { put(wx, y, 'w'); put(wx + 1, y, 'w'); } break;
    }
    // legs
    const ly = by + bodyH;
    if (o.robe) {
      for (let y = ly; y < ly + legH; y++) for (let x = -bw - (y - ly > 0 ? 1 : 0); x <= bw; x++) put(x, y, 's');
    } else if (o.float) {
      for (let y = ly; y < ly + legH; y++) for (let x = -bw + (y - ly); x <= bw - (y - ly); x++) put(x, y, 's');
    } else if (o.goatLegs) {
      for (let y = ly; y < ly + legH; y++) { put(-bw + 1 - (y === ly + 1 ? 1 : 0), y, 'p'); put(bw - 1 + (y === ly + 1 ? 1 : 0), y, 'p'); }
      put(-bw, ly + legH, 'k'); put(bw, ly + legH, 'k');
    } else {
      const lx = Math.max(1, bw - (w >= 7 ? 2 : w >= 5 ? 1 : 0));
      const thick = w >= 7;
      for (let y = ly; y < ly + legH; y++) {
        const c = y === ly + legH - 1 ? 'k' : 'p';
        put(-lx, y, c); put(lx, y, c);
        if (thick) { put(-lx + 1, y, c); put(lx - 1, y, c); }
      }
    }
    if (o.cloud) for (let y = 0; y < 2; y++) for (let x = -bw - 3; x <= bw + 3; x++) if (y || Math.abs(x) < bw + 2) put(x, ly + legH + y, 'u');
    const rows = [];
    for (let y = y0; y <= y1; y++) { let r = ''; for (let x = x0; x <= x1; x++) r += g.get(x + ',' + y) || '.'; rows.push(r); }
    return [rows];
  }
  DS.SpeciesKit.humanoid = humanoid;

  let CAT = 'mammal';
  const D = (id, o) => def(id, Object.assign({ cat: CAT }, o));

  // ---------------------------------------------------------------- hive
  CAT = 'bug';
  D('hivebee', { name: 'Worker honeybee', hab: 'air', hive: true, art: [['..ww.', '.ykyke', 'ykyky.'], ['.....', '.ykyke', 'ykyky.']], pal: { y: '#f0c020', k: '#2a2010', w: '#e0f0ff', e: '#1a1a1a' }, speed: 0.7, metab: 0, breed: 0, sleeps: false, perches: 0, max: 90, life: 1800 });
  D('hivequeen', { name: 'Queen bee', hab: 'climb', hive: true, queen: true, art: [['...ww...', 'ykykykke', '.k.k.k..']], pal: { y: '#e8a818', k: '#2a1a08', w: '#e0f0ff', e: '#111' }, speed: 0.15, metab: 0, breed: 0, sleeps: false, max: 6, life: 99999 });
  D('hornet', { name: 'Hornet', hab: 'air', art: [['..ww..', 'rkykyke'], ['......', 'rkykyke']], pal: { y: '#f0b020', k: '#3a1a10', r: '#8a2a1a', w: '#e8f0f8', e: '#1a1a1a' }, speed: 0.9, flutter: true, prey: ['hivebee', 'bee', 'bumblebee', 'caterpillar', 'fly'], max: 4, breed: 0.004, metab: 1 / 200 });
  CAT = 'mammal';
  D('honeybadger', { name: 'Honey badger', art: [['.sssss..', 'bsssssbe', 'bbbbbbbn', '.k..k...']], pal: { s: '#e8e8e0', b: '#1e1e1e', e: '#111', n: '#3a3a3a', k: '#111' }, speed: 0.5, eats: ['HONEY', 'COMB', 'BROOD', 'BERRY'], prey: ['hivebee', 'snake', 'cobra', 'scorpion', 'mouse'], max: 3, breed: 0.004 });
  D('grizzly', { name: 'Grizzly bear', hab: 'amph', art: [['...........k..', '..bbbbbbb..bbe', '.bbbbbbbbbbbbn', 'bbbbbbbbbbbbb.', '.bbbbbbbbbbb..', '.bb.b....b.bb.', '.kk.k....k.kk.']], pal: { b: '#7a5232', k: '#3a2414', e: '#111', n: '#2a1a10' }, speed: 0.4, eats: ['BERRY', 'FUNGUS', 'HONEY', 'COMB', 'PLANT'], prey: ['salmon', 'trout', 'hivebee', 'marmot', 'elk'], max: 3, breed: 0.003, metab: 1 / 220, life: 900 });
  for (const id of ['bear', 'bear2']) S[id].eats = (S[id].eats || []).concat(['HONEY', 'COMB']);
  CAT = 'other';
  D('beekeeper', { name: 'Beekeeper', humanoid: true, art: humanoid({ h: 8, w: 3, hat: 'cap', belt: true }), pal: { f: '#d8d8d0', h: '#f0f0e8', m: '#f0f0e8', e: '#1a1a1a', s: '#f4f4ee', p: '#f4f4ee', k: '#8a8a7a' }, speed: 0.2, metab: 0, breed: 0, max: 3, idle: 0.6, life: 99999 });

  // ---------------------------------------------------------------- deep sea
  CAT = 'sea';
  const deep = { hab: 'water', deep: true, metab: 0, sleeps: false, breed: 0.006 };
  D('gulper', Object.assign({}, deep, { name: 'Gulper eel', art: [['.kkk.........', 'k...kkkkkkkk.', 'k.e.k......kp', '.kkk.........']].map((f) => f.map((r) => r.split('').reverse().join(''))), pal: { k: '#2a2a3a', e: '#e8e8a0', p: '#ff6aa0' }, speed: 0.2, prey: ['lanternfish', 'hatchetfish', 'shrimp'], metab: 1 / 400, glow: '#ff6aa0', max: 4 }));
  D('hatchetfish', Object.assign({}, deep, { name: 'Hatchetfish', art: fish(4, 4), pal: { b: '#a8b8c8', w: '#e0e8f0', t: '#8a9aa8', e: '#111' }, speed: 0.35, school: true, glow: '#80c0ff', max: 30 }));
  D('vampiresquid', Object.assign({}, deep, { name: 'Vampire squid', art: [['.rrr.', 'rerer', 'rrrrr', 'r.r.r', '.r.r.'], ['.rrr.', 'rerer', 'rrrrr', '.rrr.', 'r...r']], pal: { r: '#8a1a2a', e: '#4ad8ff' }, speed: 0.15, flutter: true, glow: '#60a0ff', max: 6 }));
  D('giantsquid', Object.assign({}, deep, { name: 'Giant squid', art: [['k.k.k.k.bbbbbbb...', '.kkkkkkkbbbbbbbbb.', 'kk.k.k.kbbbebbbbbb', '.kkkkkkkbbbbbbbbb.', 'k.k.k.k.bbbbbbb...']].map((f) => f.map((r) => r.split('').reverse().join(''))), pal: { b: '#c84a3a', k: '#a83a2a', e: '#f0f0a0' }, speed: 0.3, prey: ['lanternfish', 'hatchetfish', 'smallfish', 'squid'], metab: 1 / 300, max: 2, breed: 0.002 }));
  D('spermwhale', { name: 'Sperm whale', hab: 'water', art: [['k...........................', 'kk...........kk.............', '.kk.kkkkkkkkkkkkkkkkkkkkkkk.', '..kkkkkkkkkkkkkkkkkkkkkkkekk', '.kkkkkkkkkkkkkkkkkkkkkkkkkkk', 'kk..........kkkk.....k......']], pal: { k: '#5a5a62', e: '#111' }, speed: 0.25, prey: ['giantsquid', 'squid', 'vampiresquid'], metab: 1 / 400, max: 1, breed: 0.001, life: 3000, sleeps: false });
  D('seacucumber', { name: 'Sea cucumber', art: [['..bbbbbb.', 'bbbbbbbbb']], pal: { b: '#8a4a3a' }, waterOk: true, speed: 0.02, eats: ['LITTER'], sip: true, max: 12, breed: 0.005, sleeps: false });
  D('isopod', { name: 'Giant isopod', art: [['.sssss.', 'sssssss', 'k.k.k.k']], pal: { s: '#b8b0a8', k: '#8a8278' }, waterOk: true, speed: 0.08, eats: ['LITTER', 'SEAWEED'], max: 10, breed: 0.004, sleeps: false });
  D('dumbo', Object.assign({}, deep, { name: 'Dumbo octopus', art: [['p.ppp.p', '.ppppp.', '.pepep.', '..ppp..', '.p.p.p.']], pal: { p: '#f0a0a8', e: '#111' }, speed: 0.12, flutter: true, max: 6 }));
  D('tadpole', { name: 'Tadpole', hab: 'water', art: [['tkk']], pal: { k: '#2a2a1a', t: '#4a4a3a' }, speed: 0.3, school: true, metab: 0, max: 30, breed: 0.01, sleeps: false, life: 300 });
  S.salmon.breach = true;

  // ---------------------------------------------------------------- wetlands, mesa
  CAT = 'bird';
  const gbirdArt = (L, leg, neck, beak, droop, crest) => {
    const rows = [];
    // simple tall wader: head + neck + body + legs
    const w = L + 2 + beak;
    const line = (s) => (s + '.'.repeat(w)).slice(0, w);
    rows.push(line('.'.repeat(L) + (crest ? 'cc' : 'hh')));
    rows.push(line('.'.repeat(L) + 'he' + 'y'.repeat(beak)));
    if (droop) rows[1] = line('.'.repeat(L) + 'he' + 'y'.repeat(beak - 1)), rows.push(line('.'.repeat(L + 2 + beak - 1) + 'y'));
    for (let i = 0; i < neck; i++) rows.push(line('.'.repeat(L) + 'n'));
    rows.push(line('t' + 'b'.repeat(L)));
    rows.push(line('.' + 'b'.repeat(L - 1)));
    for (let i = 0; i < leg; i++) rows.push(line('.'.repeat(Math.floor(L / 2)) + 'k'));
    return [rows];
  };
  D('crane', { name: 'Red-crowned crane', waterOk: true, art: gbirdArt(5, 5, 4, 2, false, true), pal: { b: '#f4f4f0', t: '#1a1a1a', n: '#1a1a1a', h: '#f4f4f0', c: '#e02a2a', e: '#111', y: '#c8b878', k: '#3a3a3a' }, speed: 0.3, prey: ['frog', 'smallfish', 'minnow', 'snail', 'crayfish', 'tadpole'], max: 6, breed: 0.004, idle: 0.6 });
  D('spoonbill', { name: 'Roseate spoonbill', waterOk: true, art: gbirdArt(4, 4, 2, 3, true), pal: { b: '#f0a0b8', t: '#e06a8a', n: '#f8d0dc', h: '#f8d0dc', e: '#e82a2a', y: '#c8b090', k: '#c86a7a' }, speed: 0.3, prey: ['shrimp', 'minnow', 'tadpole', 'crayfish'], max: 8, breed: 0.005, idle: 0.6 });
  D('ibis', { name: 'Ibis', waterOk: true, art: gbirdArt(4, 3, 2, 3, true), pal: { b: '#f8f8f4', t: '#1a1a1a', n: '#f8f8f4', h: '#1a1a1a', e: '#111', y: '#1a1a1a', k: '#3a3a3a' }, speed: 0.3, prey: ['crayfish', 'snail', 'worm', 'tadpole'], max: 8, breed: 0.005 });
  D('coot', { name: 'Coot', hab: 'amph', floats: true, art: [['...bb.', '...bey', 'bbbbb.', '.bbb..']], pal: { b: '#1e1e22', e: '#e83a2a', y: '#f4f4f0' }, speed: 0.3, eats: ['SEAWEED', 'LILY', 'PLANT'], max: 10, breed: 0.008 });
  CAT = 'mammal';
  D('muskrat', { name: 'Muskrat', hab: 'amph', art: [['...bbe', 'tbbbbb', '.k..k.']], pal: { b: '#6a4a30', t: '#3a2a1a', e: '#111', k: '#3a2a1a' }, speed: 0.4, eats: ['PLANT', 'TALLGRASS', 'LILY', 'SEAWEED'], max: 8, breed: 0.01 });
  D('cougar', { name: 'Cougar', art: [['.........k.', 't.......bbe', 't.bbbbbbbbn', '.tbbbbbbbb.', '..k.k..k.k.']], pal: { b: '#c8a070', t: '#a88050', k: '#4a3a2a', e: '#111', n: '#3a2a20' }, speed: 0.85, step: 3, prey: ['bighorn', 'deer', 'jackrabbit', 'javelina', 'coyote', 'hare'], max: 2, breed: 0.003, metab: 1 / 240, nocturnal: true });
  D('bighorn', { name: 'Bighorn sheep', art: [['....aa.', '...a.a.', '....bbe', 'bbbbbbn', '.bbbbb.', '.k.k.k.']], pal: { b: '#9a7a5a', a: '#c8b088', e: '#111', n: '#e8e0d0', k: '#3a2a1a' }, speed: 0.45, step: 4, jumpy: true, eats: ['DRYGRASS', 'GRASS', 'PLANT', 'TALLGRASS'], max: 8, breed: 0.006 });
  D('javelina', { name: 'Javelina', art: [['.mmmmm..', 'bbbbbbbe', 'bbbbbbbbn', '.k..k...']], pal: { b: '#5a5450', m: '#3a3634', e: '#111', n: '#2a2a2a', k: '#2a2a2a' }, speed: 0.45, eats: ['CACTUS', 'PLANT', 'BERRY', 'DRYGRASS'], max: 8, breed: 0.006 });
  CAT = 'reptile';
  D('gila', { name: 'Gila monster', art: [['....obobe', 'tobobobob', '..k...k..']], pal: { o: '#f08a3a', b: '#1a1a1a', t: '#f08a3a', e: '#111', k: '#1a1a1a' }, speed: 0.15, prey: ['mouse', 'lizard', 'tarantula'], max: 3, breed: 0.003, idle: 0.6 });

  // ---------------------------------------------------------------- lawn (bug's-eye scale)
  function upscale(art, k) {
    return art.map((frame) => frame.flatMap((row) => { const r = [...row].map((ch) => ch.repeat(k)).join(''); return Array(k).fill(r); }));
  }
  const LAWN = {};
  const giant = (id, newId, k, o) => { LAWN[id] = newId; GIANTS.push([id, newId, k, o]); };
  const GIANTS = [];
  // new small bugs first (normal size), then everything gets a lawn-scale twin
  D('mite', { name: 'Mite', cat: 'bug', art: [['.rr', 'rrr']], pal: { r: '#d82a1a' }, speed: 0.2, eats: ['PLANT', 'TALLGRASS'], sip: true, max: 20, breed: 0.015, sleeps: false });
  D('weevil', { name: 'Weevil', cat: 'bug', art: [['.bbb.kk', 'bbbbbk.', '.k.k...']], pal: { b: '#6a5a4a', k: '#3a3020' }, speed: 0.15, eats: ['SEED', 'PLANT', 'FLOWER', 'LEAF'], max: 10, breed: 0.008 });
  D('stinkbug', { name: 'Stink bug', cat: 'bug', art: [['.gggg.', 'gggggk', '.k.k..']], pal: { g: '#5a7a3a', k: '#2a3a1a' }, speed: 0.15, eats: ['PLANT', 'LEAF', 'BERRY', 'TALLGRASS'], sip: true, max: 10, breed: 0.008 });
  giant('ant', 'lawnant', 2, { name: 'Lawn ant', max: 60 });
  giant('antqueen', 'lawnqueen', 2, { name: 'Lawn ant queen', worker: 'lawnant' });
  giant('aphid', 'lawnaphid', 3, { name: 'Lawn aphid' });
  giant('ladybug', 'lawnladybug', 3, { name: 'Lawn ladybug' });
  giant('spider', 'lawnspider', 3, { name: 'Lawn orb weaver', speed: 0.7 });
  giant('bee', 'lawnbee', 3, { name: 'Lawn bee' });
  giant('mite', 'lawnmite', 3, { name: 'Lawn mite' });
  giant('weevil', 'lawnweevil', 3, { name: 'Lawn weevil' });
  giant('stinkbug', 'lawnstinkbug', 3, { name: 'Lawn stink bug' });
  giant('worm', 'lawnworm', 3, { name: 'Lawn worm' });
  giant('caterpillar', 'lawncaterpillar', 3, { name: 'Lawn caterpillar' });
  giant('snail', 'lawnsnail', 3, { name: 'Lawn snail' });
  giant('fly', 'lawngnat', 3, { name: 'Lawn gnat' });
  giant('mosquito', 'lawnmosquito', 3, { name: 'Lawn mosquito' });
  giant('beetle', 'lawnbeetle', 4, { name: 'Lawn bombardier beetle' });
  giant('mantis', 'lawnmantis', 3, { name: 'Lawn praying mantis' });
  giant('grasshopper', 'lawngrasshopper', 3, { name: 'Lawn grasshopper' });
  giant('wolf', 'lawnwolfspider', 1, { name: 'Lawn wolf spider', art: upscale([['k.k..k.k.', '.kkkkkkk.', 'kksssskke', '.kkkkkkk.', 'k.k..k.k.']], 2), pal: { k: '#3a3026', s: '#6a5a46', e: '#e8e8c0' }, hab: 'climb', prey: ['lawnant', 'lawngnat', 'lawnmite', 'lawnweevil', 'lawngrasshopper', 'lawnaphid', 'lawncaterpillar'], speed: 0.8, nocturnal: true, max: 2 });
  const STRIP = new Set(['eatSet', 'preySet', 'chaseSet', 'fears', 'w', 'h', 'reach', 'id']);
  for (const [id, newId, k, o] of GIANTS) {
    const base = S[id];
    const c = {};
    for (const key in base) if (!STRIP.has(key)) c[key] = base[key];
    if (base.eatSet !== undefined) { c.life = base.life / 60; c.mature = base.mature / 60; c.metab = base.metab * 60; }
    c.art = upscale(base.art, k);
    c.speed = base.speed * 1.4;
    c.cat = 'bug';
    c.lawn = true;
    if (base.prey) c.prey = base.prey.map((p) => LAWN[p]).filter(Boolean);
    def(newId, Object.assign(c, o));
  }

  // people & farm folk can be turned (zombies, vampires)
  for (const id of ['person', 'survivor', 'farmer', 'jogger', 'beekeeper']) if (S[id]) S[id].humanoid = true;

  DS.finalizeSpecies();
})();
