// Creature species: pixel art + behaviour parameters.
// Art faces right. '.' is transparent; other characters map through `pal`.
(function () {
  'use strict';
  const DS = window.DS;

  // ---- procedural art helpers --------------------------------------------
  function bird(L, o) {
    const thick = o.thick || 1;
    const WL = Math.max(2, Math.round(L * 0.4));
    const s = Math.max(1, Math.round(L * 0.3));
    const rows = 4 + thick;
    const blank = () => '.'.repeat(L);
    const put = (row, from, to, ch) => {
      const a = row.split('');
      for (let i = from; i <= to; i++) if (i >= 0 && i < L) a[i] = ch;
      return a.join('');
    };
    const body = [];
    body.push('t' + 'b'.repeat(L - 3) + 'e' + 'y');
    if (thick > 1) body.push('.' + 'b'.repeat(L - 4) + '..');
    const up = [put(blank(), s + 1, s + WL - 1, 'w'), put(blank(), s, s + WL - 1, 'w'), ...body, blank(), blank()];
    const down = [blank(), blank(), ...body, put(blank(), s, s + WL - 1, 'w'), put(blank(), s, s + 1, 'w')];
    const folded = body.map((r, i) => (i === 0 ? put(r, s, s + WL - 1, 'w') : r));
    const perch = [blank(), blank(), ...folded, put(blank(), Math.floor(L / 2), Math.floor(L / 2), 'k')];
    while (perch.length < rows) perch.unshift(blank());
    return [up, down, perch.slice(-rows)];
  }

  function fish(L, H, o = {}) {
    const rows = [];
    const cx = (L + 1) / 2, rx = (L - 2) / 2, cy = (H - 1) / 2, ry = H / 2;
    for (let r = 0; r < H; r++) {
      let row = '';
      for (let c = 0; c < L; c++) {
        let ch = '.';
        if (c === 0) ch = r === 0 || r === H - 1 || H <= 2 ? 't' : '.';
        else if (c === 1) ch = Math.abs(r - cy) <= Math.max(0.5, H / 4) ? 't' : '.';
        else {
          const dx = (c - cx) / rx, dy = (r - cy) / ry;
          if (dx * dx + dy * dy <= 1.05) {
            ch = r > cy ? 'w' : 'b';
            if (o.stripes && o.stripes.includes(c)) ch = 's';
          }
        }
        row += ch;
      }
      rows.push(row);
    }
    const er = Math.max(0, Math.floor(cy - (H > 3 ? 1 : 0.5)));
    rows[er] = rows[er].slice(0, L - 2) + 'e' + rows[er].slice(L - 1);
    return [rows];
  }

  // ---- species table -------------------------------------------------------
  const S = {};
  const def = (id, o) => {
    S[id] = Object.assign({
      id, name: id, hab: 'ground', speed: 0.4, sense: 45, life: 360, mature: 45,
      breed: 0.01, max: 12, metab: 1 / 150, sleeps: true, nocturnal: false,
      eats: null, prey: null, sip: false, food: 0.15, idle: 0.3, step: 1,
      perches: 0.3, jumpy: false, flutter: false, school: false, breach: false,
      floats: false, waterOk: false, climbVeg: false, digs: false, glow: null,
      onlyNight: false, toxicOk: false, high: false, dives: false,
    }, o);
  };

  // Grasslands / temperate
  def('rabbit', { name: 'Rabbit', art: [['....k.', '....kk', '..bbbe', 'bbbbbb', '.b..b.']],
    pal: { b: '#a88462', k: '#8f6c4c', e: '#222' }, speed: 0.55, jumpy: true, eats: ['GRASS', 'PLANT', 'FLOWER'], breed: 0.03, max: 16, life: 240, mature: 30 });
  def('snowhare', { name: 'Snow hare', art: [['....k.', '....kk', '..bbbe', 'bbbbbb', '.b..b.']],
    pal: { b: '#f2f4f8', k: '#d0d6e0', e: '#222' }, speed: 0.55, jumpy: true, eats: ['GRASS', 'PLANT', 'NEEDLE', 'FLOWER'], breed: 0.025, max: 14, life: 240, mature: 30 });
  def('mouse', { name: 'Mouse', art: [['..bbe', 'tbbbb', '.k.k.']], pal: { b: '#8a8078', t: '#c09a94', e: '#111', k: '#5a504a' },
    speed: 0.5, eats: ['SEED', 'PLANT', 'LITTER', 'FUNGUS'], breed: 0.03, max: 14, nocturnal: true, life: 200, mature: 25 });
  def('fox', { name: 'Fox', art: [['........k.', 'w......bbe', 'tbbbbbbbbb', '.k.k..k.k.']],
    pal: { b: '#d9662a', t: '#d9662a', w: '#f4efe6', k: '#3a2418', e: '#111' }, speed: 0.7, prey: ['rabbit', 'mouse', 'songbird'], metab: 1 / 160, max: 4, breed: 0.006 });
  def('arcticfox', { name: 'Arctic fox', art: [['........k.', 'w......bbe', 'tbbbbbbbbb', '.k.k..k.k.']],
    pal: { b: '#eef0f4', t: '#eef0f4', w: '#ffffff', k: '#9aa0aa', e: '#111' }, speed: 0.7, prey: ['snowhare', 'mouse', 'ptarmigan'], max: 4, breed: 0.006 });
  def('wolf', { name: 'Wolf', art: [['.........k.', 'w.......bbe', '.bbbbbbbbbb', '.bbbbbbbb..', '.k.k...k.k.']],
    pal: { b: '#7e8088', w: '#aeb0b6', k: '#3e3e44', e: '#e8d040' }, speed: 0.75, prey: ['rabbit', 'deer', 'snowhare', 'reindeer', 'goat', 'mouse', 'marmot'], max: 5, breed: 0.005, nocturnal: true, metab: 1 / 170 });
  def('bear', { name: 'Bear', art: [['..........k.', '..bbbbb...bbe', '.bbbbbbbbbbbn', 'bbbbbbbbbbbb.', '.bbbbbbbbbb..', '.bb.b...b.bb.', '.kk.k...k.kk.']],
    pal: { b: '#6a4428', k: '#3a2414', e: '#111', n: '#2a1a10' }, hab: 'amph', speed: 0.4, eats: ['PLANT', 'FLOWER', 'FUNGUS'], prey: ['smallfish', 'bass', 'rabbit', 'mouse'], max: 2, breed: 0.003, metab: 1 / 200, life: 600 });
  def('polarbear', { name: 'Polar bear', art: [['..........k.', '..bbbbb...bbe', '.bbbbbbbbbbbn', 'bbbbbbbbbbbb.', '.bbbbbbbbbb..', '.bb.b...b.bb.', '.kk.k...k.kk.']],
    pal: { b: '#f0ece0', k: '#b8b2a4', e: '#111', n: '#111' }, hab: 'amph', speed: 0.4, prey: ['seal', 'penguin', 'cod'], max: 3, breed: 0.003, metab: 1 / 200, life: 600 });
  def('deer', { name: 'Deer', art: [['......a.a', '.......a.', '......bbe', '.......bn', 'wbbbbbbb.', '.bbbbbbb.', '.b.b..b.b', '.k.k..k.k']],
    pal: { b: '#a46a3c', w: '#f0e6d8', a: '#d8c8a0', k: '#3a2414', e: '#111', n: '#222' }, speed: 0.5, eats: ['GRASS', 'PLANT', 'LEAF', 'FLOWER'], max: 8, breed: 0.008, step: 2 });
  def('moose', { name: 'Moose', art: [['........a.a.a', '........aaaaa', '..........bb.', '..bbb.....bbe', '.bbbbbbbbbbbn', '.bbbbbbbbbb..', '.bbbbbbbbbb..', '..b.b...b.b..', '..b.b...b.b..', '..k.k...k.k..']],
    pal: { b: '#4a3426', a: '#c8b48a', k: '#221810', e: '#111', n: '#2a1a10' }, hab: 'amph', speed: 0.35, eats: ['GRASS', 'PLANT', 'LEAF', 'NEEDLE', 'LILY'], max: 4, breed: 0.004, step: 2, life: 600 });
  def('reindeer', { name: 'Reindeer', art: [['.......a.a', '.......aa.', '.......bbe', '........bn', '.bbbbbbwb.', 'wbbbbbbbb.', '.b.b...b.b', '.k.k...k.k']],
    pal: { b: '#8a6a4e', w: '#f0ece4', a: '#d8c8a0', k: '#2a1e14', e: '#111', n: '#3a2a20' }, speed: 0.45, eats: ['GRASS', 'PLANT', 'NEEDLE', 'SNOW'], sip: false, max: 8, breed: 0.006, step: 2 });
  def('bison', { name: 'Bison', art: [['..........kk.', '....hhhhhhhhk', '..bbbbbbbhhhe', 'tbbbbbbbbhhhh', '.bbbbbbbbbbb.', '..b.b...b.b..', '..k.k...k.k..']],
    pal: { b: '#6a4a30', h: '#3e2a1c', k: '#1e140e', e: '#111', t: '#3e2a1c' }, speed: 0.3, eats: ['GRASS', 'PLANT'], max: 8, breed: 0.005, step: 2, life: 600, food: 0.1 });
  def('goat', { name: 'Mountain goat', art: [['.....a.', '....ab.', '....bbe', 'bbbbbbn', '.bbbbb.', '.k.k.k.']],
    pal: { b: '#ece6da', a: '#6a6258', e: '#111', n: '#c0b0a0', k: '#3a3632' }, speed: 0.45, step: 3, jumpy: true, eats: ['GRASS', 'PLANT', 'NEEDLE', 'FLOWER'], max: 10, breed: 0.008 });
  def('marmot', { name: 'Marmot', art: [['...be', 'bbbbb', '.k.k.']], pal: { b: '#8a6a44', e: '#111', k: '#4a3624' }, speed: 0.4, eats: ['GRASS', 'PLANT', 'FLOWER'], max: 10, breed: 0.012 });
  def('camel', { name: 'Camel', art: [['..........bb.', '..........bbe', '...b.b....b..', '..bbbbb...b..', '.bbbbbbbbbb..', 'bbbbbbbbbbb..', '..b.b..b.b...', '..b.b..b.b...', '..k.k..k.k...']],
    pal: { b: '#c8a06a', e: '#111', k: '#6a5030' }, speed: 0.3, eats: ['PLANT', 'CACTUS', 'FLOWER', 'WOOD'], metab: 1 / 400, max: 5, breed: 0.004, life: 700, step: 2 });
  def('lizard', { name: 'Lizard', art: [['....bbe', 'tbbbbbb', '..k..k.']], pal: { b: '#a8a040', t: '#8a8434', e: '#111', k: '#6a6428' }, speed: 0.6, prey: ['beetle', 'butterfly', 'dragonfly'], eats: ['PLANT'], max: 10, breed: 0.01, idle: 0.6 });
  def('scorpion', { name: 'Scorpion', art: [['kk.....', '.k..k.p', '.kkkkkp', '..k.k..']], pal: { k: '#c8922a', p: '#a8721a' }, speed: 0.35, prey: ['beetle', 'mouse'], nocturnal: true, max: 8, breed: 0.008 });
  def('snake', { name: 'Snake', art: [['..bb...be', 'bb..bbbb.'], ['bb..bb.be', '..bb..bb.']], pal: { b: '#6a8a3a', e: '#111' }, speed: 0.4, prey: ['mouse', 'lizard', 'frog', 'rabbit'], max: 4, breed: 0.004, metab: 1 / 300 });
  def('beetle', { name: 'Beetle', art: [['.bb', 'k.k']], pal: { b: '#2a3a6a', k: '#111' }, speed: 0.25, eats: ['PLANT', 'LITTER', 'FUNGUS', 'LEAF'], max: 14, breed: 0.012, sleeps: false });
  def('tumbleweed', { name: 'Tumbleweed', hab: 'roller', art: [['.ttt.', 't.t.t', 'tt.tt', 't.t.t', '.ttt.'], ['.ttt.', 'tt.tt', 't.t.t', 'tt.tt', '.ttt.']], pal: { t: '#a08a5a' }, speed: 0.4, metab: 0, sleeps: false, breed: 0, life: 3000, max: 4 });

  // Birds & insects
  def('songbird', { name: 'Songbird', hab: 'air', art: bird(5, {}), pal: { b: '#c8584a', t: '#6a3a2a', w: '#7a4a3a', e: '#222', y: '#f0b030', k: '#3a2a20' }, speed: 0.8, prey: ['butterfly', 'dragonfly', 'beetle', 'aphid'], eats: ['SEED'], perches: 0.5, max: 10, breed: 0.01 });
  def('pigeon', { name: 'Pigeon', hab: 'air', art: bird(6, {}), pal: { b: '#8a92a8', t: '#5a6070', w: '#6a7288', e: '#e04a2a', y: '#d8b0a0', k: '#c86a5a' }, speed: 0.7, eats: ['SEED', 'LITTER'], perches: 0.7, max: 12, breed: 0.01 });
  def('crow', { name: 'Crow', hab: 'air', art: bird(6, {}), pal: { b: '#1e1e26', t: '#141418', w: '#2a2a34', e: '#c0c0c0', y: '#2a2a2a', k: '#1a1a1a' }, speed: 0.8, prey: ['cockroach', 'mouse', 'beetle'], eats: ['LITTER', 'SEED'], perches: 0.6, max: 10, breed: 0.008 });
  def('ptarmigan', { name: 'Ptarmigan', hab: 'air', art: bird(5, {}), pal: { b: '#f4f6fa', t: '#2a2a2a', w: '#e4e8ee', e: '#222', y: '#3a3a3a', k: '#d0d0d0' }, speed: 0.7, eats: ['NEEDLE', 'PLANT', 'SEED'], perches: 0.6, max: 10, breed: 0.008 });
  def('parrot', { name: 'Parrot', hab: 'air', art: bird(6, {}), pal: { b: '#e83a2a', t: '#2a6ae8', w: '#f0c020', e: '#fff', y: '#3a3a3a', k: '#3a3a3a' }, speed: 0.8, eats: ['FLOWER', 'LEAF'], sip: true, perches: 0.6, max: 10, breed: 0.008 });
  def('toucan', { name: 'Toucan', hab: 'air', art: bird(7, {}).map((f) => f.map((r) => r.replace(/ey$/, 'eyy'))), pal: { b: '#1a1a1a', t: '#1a1a1a', w: '#2a2a2a', e: '#f8f0c0', y: '#ff9a1a', k: '#3a3a3a' }, speed: 0.7, eats: ['FLOWER'], sip: true, perches: 0.6, max: 6, breed: 0.006 });
  def('seagull', { name: 'Seagull', hab: 'air', art: bird(8, {}), pal: { b: '#f4f4f4', t: '#3a3a3a', w: '#a8b0b8', e: '#222', y: '#f0b020', k: '#e0a020' }, speed: 0.9, prey: ['smallfish', 'crab'], dives: true, perches: 0.35, max: 8, breed: 0.006 });
  def('vulture', { name: 'Vulture', hab: 'air', art: bird(10, { thick: 2 }), pal: { b: '#3a2a22', t: '#2a1e18', w: '#4a3a30', e: '#e0a0a0', y: '#c8b0a0', k: '#8a7a6a' }, speed: 0.6, high: true, prey: ['mouse', 'lizard', 'snake'], perches: 0.2, max: 3, breed: 0.003, metab: 1 / 300 });
  def('eagle', { name: 'Eagle', hab: 'air', art: bird(10, { thick: 2 }), pal: { b: '#5a3a20', t: '#f4f4f4', w: '#4a2e18', e: '#f4f4f4', y: '#f0c020', k: '#f0c020' }, speed: 1.0, high: true, dives: true, prey: ['rabbit', 'marmot', 'snowhare', 'smallfish', 'mouse', 'ptarmigan'], perches: 0.3, max: 3, breed: 0.003, metab: 1 / 220 });
  def('owl', { name: 'Owl', hab: 'air', art: bird(6, { thick: 2 }), pal: { b: '#8a6a4a', t: '#6a4a30', w: '#a88a6a', e: '#f0d040', y: '#3a2a1a', k: '#c8a050' }, speed: 0.8, nocturnal: true, prey: ['mouse', 'rabbit', 'snowhare'], perches: 0.5, max: 3, breed: 0.004 });
  def('snowyowl', { name: 'Snowy owl', hab: 'air', art: bird(6, { thick: 2 }), pal: { b: '#f4f4f8', t: '#d8dce4', w: '#e8eaf0', e: '#f0d040', y: '#3a3a3a', k: '#c8c8c8' }, speed: 0.8, nocturnal: true, prey: ['mouse', 'snowhare', 'ptarmigan'], perches: 0.5, max: 3, breed: 0.004 });
  def('heron', { name: 'Heron', hab: 'air', art: bird(9, {}), pal: { b: '#9aa8b8', t: '#6a7888', w: '#b8c4d0', e: '#111', y: '#e0b020', k: '#e0b020' }, speed: 0.6, dives: true, prey: ['smallfish', 'frog'], perches: 0.6, max: 3, breed: 0.004 });
  def('butterfly', { name: 'Butterfly', hab: 'air', art: [['w.w', 'wbw'], ['...', 'wbw']], pal: { w: '#ffb030', b: '#2a1a10' }, variants: { w: ['#ffb030', '#ffffff', '#ffe040', '#ff70b0', '#70b0ff'] },
    speed: 0.4, flutter: true, eats: ['FLOWER'], sip: true, perches: 0.4, max: 14, breed: 0.01, life: 200, sleeps: true });
  def('morpho', { name: 'Blue morpho', hab: 'air', art: [['w.w', 'wbw'], ['...', 'wbw']], pal: { w: '#2a8aff', b: '#1a1a1a' }, speed: 0.4, flutter: true, eats: ['FLOWER'], sip: true, perches: 0.4, max: 12, breed: 0.01, life: 200 });
  def('dragonfly', { name: 'Dragonfly', hab: 'air', art: [['.ww..', 'bbbbe'], ['.....', 'bbbbe']], pal: { w: '#d8f0ff', b: '#2a9ac8', e: '#1a4a6a' }, speed: 0.9, flutter: true, metab: 0, perches: 0.2, max: 10, breed: 0.01, life: 200, sleeps: false });
  def('meganeura', { name: 'Meganeura', hab: 'air', art: [['..www...', '.wwww...', 'bbbbbbbe'], ['........', '........', 'bbbbbbbe']], pal: { w: '#d8f0e8', b: '#3a7a4a', e: '#1a3a2a' }, speed: 0.9, flutter: true, metab: 0, perches: 0.2, max: 6, breed: 0.006, sleeps: false });
  def('firefly', { name: 'Firefly', hab: 'air', art: [['y']], pal: { y: '#e8ff70' }, speed: 0.25, flutter: true, metab: 0, onlyNight: true, glow: '#e8ff70', perches: 0, max: 24, breed: 0, sleeps: false, life: 5000 });
  def('bat', { name: 'Bat', hab: 'air', art: [['k...k', 'kkekk'], ['.kkk.', 'k.e.k']], pal: { k: '#2a2230', e: '#c03030' }, speed: 1.0, flutter: true, onlyNight: true, prey: ['firefly', 'butterfly', 'dragonfly', 'moth'], perches: 0, max: 8, breed: 0, sleeps: false, life: 5000 });
  def('pterodactyl', { name: 'Pterodactyl', hab: 'air', art: bird(13, { thick: 2 }).map((f) => f.map((r, i) => (i === 2 ? r.replace(/^t/, '.') : r))), pal: { b: '#a8603a', t: '#a8603a', w: '#c88a5a', e: '#111', y: '#e8c890', k: '#6a3a20' }, speed: 0.9, dives: true, high: true, prey: ['smallfish', 'mammal', 'meganeura'], perches: 0.3, max: 4, breed: 0.004 });

  // Water & coast
  def('smallfish', { name: 'Small fish', hab: 'water', art: fish(5, 3), pal: { b: '#9ab0c8', w: '#d8e4ee', t: '#7a90a8', e: '#111' }, variants: { b: ['#9ab0c8', '#e8c040', '#5ab0a0', '#c8a0d0'] }, speed: 0.45, school: true, metab: 0, max: 30, breed: 0.012, sleeps: false, life: 500 });
  def('clownfish', { name: 'Clownfish', hab: 'water', art: fish(6, 3, { stripes: [3] }), pal: { b: '#ff8a2a', w: '#ff9a3a', t: '#ff8a2a', s: '#ffffff', e: '#111' }, speed: 0.35, metab: 0, max: 10, breed: 0.01, sleeps: false });
  def('cod', { name: 'Cod', hab: 'water', art: fish(7, 3), pal: { b: '#7a8a6a', w: '#c8ccb8', t: '#6a7a5a', e: '#111' }, speed: 0.4, school: true, metab: 0, max: 24, breed: 0.012, sleeps: false });
  def('bass', { name: 'Bass', hab: 'water', art: fish(8, 4), pal: { b: '#4a7a3a', w: '#c8d8a0', t: '#3a6a2a', e: '#111' }, speed: 0.55, prey: ['smallfish', 'frog'], max: 4, breed: 0.006, sleeps: false });
  def('tuna', { name: 'Tuna', hab: 'water', art: fish(10, 4), pal: { b: '#2a4a8a', w: '#c8d0e0', t: '#e8c030', e: '#111' }, speed: 0.8, school: true, prey: ['smallfish'], max: 8, breed: 0.006, sleeps: false });
  def('shark', { name: 'Shark', hab: 'water', art: [[
    '........k.........',
    '.......kk.........',
    'k.....kkkkkkkk....',
    'kk..kkkkkkkkkkkke..',
    '.kkkkwwwwwwwwwwkkk',
    'k......k..........']], pal: { k: '#6a7a8a', w: '#d8e0e8', e: '#111' }, speed: 0.6, prey: ['smallfish', 'clownfish', 'tuna', 'seal', 'octopus', 'cod', 'turtle'], max: 3, breed: 0.002, metab: 1 / 200, sense: 60, life: 900 });
  def('whale', { name: 'Whale', hab: 'water', art: [[
    'k.........................',
    'kk.......kkkkkkkkkk.......',
    '.kk...kkkkkkkkkkkkkkkkk...',
    '..kkkkkkkkkkkkkkkkkkkkkkk.',
    '.kkkkkkkkkkkkkkkkkkkkkke.k',
    'kk..wwwwwwwwwwwwwwwwwwwwwk',
    'k......wwwwwwwwwwwwwwwww..',
    '............k.............']], pal: { k: '#3a4a6a', w: '#a8b4c8', e: '#111' }, speed: 0.25, breach: true, prey: ['smallfish'], metab: 1 / 400, max: 2, breed: 0.001, life: 2000, sense: 30 });
  def('dolphin', { name: 'Dolphin', hab: 'water', art: [[
    '.....k......',
    'k...kkkkk...',
    '.kkkkkkkkkek',
    'k...wwwww.kk']], pal: { k: '#7a8aa0', w: '#d0d8e4', e: '#111' }, speed: 0.75, breach: true, school: true, prey: ['smallfish'], max: 6, breed: 0.003, sleeps: false });
  def('orca', { name: 'Orca', hab: 'water', art: [[
    '.......k.......',
    '......kk.......',
    'k...kkkkkkwkk..',
    'kk.kkkkkkkkkkek',
    '.kkkwwwwwkkkkkk',
    'k....k.........']], pal: { k: '#14141a', w: '#f0f0f0', e: '#f0f0f0' }, speed: 0.6, breach: true, prey: ['seal', 'penguin', 'cod', 'smallfish'], max: 2, breed: 0.002, metab: 1 / 220, sense: 60, life: 900 });
  def('jellyfish', { name: 'Jellyfish', hab: 'water', art: [['.ppp.', 'ppppp', 'p.p.p', 'p.p.p', '.p.p.'], ['.ppp.', 'ppppp', '.p.p.', 'p.p.p', 'p...p']], pal: { p: '#f0a0e0' }, speed: 0.12, flutter: true, metab: 0, max: 10, breed: 0.006, glow: '#f0a0ff', sleeps: false });
  def('octopus', { name: 'Octopus', hab: 'water', art: [['.rrr.', 'rerer', 'rrrrr', 'r.r.r'], ['.rrr.', 'rerer', 'rrrrr', '.r.r.']], pal: { r: '#c8503a', e: '#111' }, speed: 0.3, prey: ['crab', 'smallfish'], max: 4, breed: 0.004, sleeps: false });
  def('crab', { name: 'Crab', art: [['p...p', '.rrr.', 'r.r.r'], ['.p.p.', '.rrr.', '.r.r.']], pal: { r: '#d8402a', p: '#e86a4a' }, waterOk: true, speed: 0.3, eats: ['SEAWEED', 'LITTER', 'LILY'], max: 10, breed: 0.008, noFlip: true, sleeps: false });
  def('turtle', { name: 'Sea turtle', hab: 'amph', art: [['..sss...', '.sssssbe', '.b.b.b..']], pal: { s: '#5a7a3a', b: '#a8a868', e: '#111' }, speed: 0.25, eats: ['SEAWEED', 'LILY', 'PLANT'], max: 4, breed: 0.003, life: 1200 });
  def('seal', { name: 'Seal', hab: 'amph', art: [['.......be', 'tbbbbbbbb', '..b......']], pal: { b: '#6a6e78', t: '#5a5e68', e: '#111' }, speed: 0.4, prey: ['cod', 'smallfish'], max: 8, breed: 0.004 });
  def('penguin', { name: 'Penguin', hab: 'amph', art: [['.kk.', '.key', 'kww.', 'kww.', '.yy.']], pal: { k: '#1a1a24', w: '#f4f4f4', y: '#f0a020', e: '#fff' }, speed: 0.3, prey: ['cod', 'smallfish'], max: 14, breed: 0.008 });
  def('duck', { name: 'Duck', hab: 'amph', floats: true, art: [['....gg.', '....gey', 'wbbbbb.', '.bbbb..']], pal: { g: '#2a7a3a', y: '#f0a020', b: '#8a6a4a', w: '#e8e8e8', e: '#111' }, speed: 0.3, eats: ['SEAWEED', 'LILY', 'PLANT', 'SEED'], max: 10, breed: 0.008 });
  def('frog', { name: 'Frog', hab: 'amph', art: [['.ee.', 'gggg', 'g..g']], pal: { g: '#4aa83a', e: '#e8e040' }, speed: 0.4, jumpy: true, prey: ['dragonfly', 'butterfly', 'beetle', 'firefly'], max: 12, breed: 0.012, idle: 0.6 });
  def('poisonfrog', { name: 'Poison dart frog', hab: 'amph', art: [['.ee.', 'gkgg', 'g..g']], pal: { g: '#2a6aff', k: '#111', e: '#111' }, variants: { g: ['#2a6aff', '#ffcc1a', '#ff3a2a'] }, speed: 0.4, jumpy: true, prey: ['beetle', 'aphid', 'butterfly'], max: 10, breed: 0.01, idle: 0.6 });
  def('capybara', { name: 'Capybara', hab: 'amph', art: [['......be', '.bbbbbbb', 'bbbbbbbb', '.k.k.k.k']], pal: { b: '#9a6a3e', e: '#111', k: '#5a3a20' }, speed: 0.3, eats: ['GRASS', 'PLANT', 'LILY'], max: 8, breed: 0.006, idle: 0.6 });

  // Rainforest
  def('monkey', { name: 'Monkey', hab: 'climb', climbVeg: true, art: [['.bb.', '.fe.', 'bbbb', '.bb.', 'b..b']], pal: { b: '#6a4428', f: '#d8b088', e: '#111' }, speed: 0.6, eats: ['LEAF', 'FLOWER', 'VINE'], max: 10, breed: 0.007 });
  def('jaguar', { name: 'Jaguar', art: [['..........k.', 't.......bbbe', 'tbbsbbsbbbbn', '.bsbbsbbsbb.', '.k.k...k.k..']], pal: { b: '#e0a040', s: '#3a2410', t: '#c88a30', k: '#3a2410', e: '#111', n: '#2a1a10' }, speed: 0.75, prey: ['capybara', 'monkey', 'poisonfrog', 'mouse'], max: 2, breed: 0.003, metab: 1 / 200, nocturnal: true });
  def('treesnake', { name: 'Tree snake', hab: 'climb', climbVeg: true, art: [['..bb...be', 'bb..bbbb.'], ['bb..bb.be', '..bb..bb.']], pal: { b: '#3ab04a', e: '#111' }, speed: 0.4, prey: ['poisonfrog', 'mouse', 'aphid'], max: 4, breed: 0.004 });

  // Town / city
  const people = { h: ['#2a1a10', '#6a3a1a', '#d8b050', '#1a1a1a', '#a84a2a', '#8a8a8a'], f: ['#f0c8a0', '#c8946a', '#8a5a3a', '#e8b890', '#5a3a24'], s: ['#d83a3a', '#3a6ad8', '#3ab04a', '#e8c030', '#8a3ad8', '#f0f0f0', '#e87a2a'], p: ['#2a3a6a', '#3a3a3a', '#6a4a2a', '#8a8a8a', '#1a2a4a'] };
  def('person', { name: 'Person', art: [['.h.', '.f.', 'sss', 'sss', '.p.', 'p.p', 'p.p']], pal: { h: '#2a1a10', f: '#f0c8a0', s: '#d83a3a', p: '#2a3a6a' }, variants: people, speed: 0.25, metab: 0, breed: 0, max: 10, idle: 0.5, life: 99999 });
  def('survivor', { name: 'Survivor', art: [['.h.', '.f.', 'bss', 'bss', '.p.', 'p.p', 'p.p']], pal: { h: '#3a2a1a', f: '#c8946a', s: '#5a6a3a', p: '#3a3a3a', b: '#6a4a2a' }, variants: { h: people.h, f: people.f }, speed: 0.3, metab: 0, breed: 0, max: 8, idle: 0.4, life: 99999 });
  def('zombie', { name: 'Zombie', art: [['.h..', '.f..', 'sfff', 'ss..', '.p..', 'p.p.', 'p.p.']], pal: { h: '#2a2a1a', f: '#8aa868', s: '#6a5a4a', p: '#3a3a4a' }, speed: 0.12, prey: ['survivor', 'person'], infects: true, metab: 0, breed: 0, sleeps: false, max: 30, sense: 40, life: 99999, toxicOk: true });
  def('dog', { name: 'Dog', art: [['.....kk.', 't....bbe', '.bbbbbbn', '.k.k.k.k']], pal: { b: '#a8743a', t: '#a8743a', k: '#5a3a1a', e: '#111', n: '#111' }, variants: { b: ['#a8743a', '#2a2a2a', '#e8e0d0', '#c8a060'] }, speed: 0.55, chases: ['cat', 'squirrel', 'pigeon'], metab: 0, breed: 0, max: 6, idle: 0.4 });
  def('feraldog', { name: 'Feral dog', art: [['.....kk.', 't....bbe', '.bbbbbbn', '.k.k.k.k']], pal: { b: '#7a6a5a', t: '#6a5a4a', k: '#3a2e24', e: '#d04030', n: '#111' }, speed: 0.6, prey: ['rat', 'cockroach', 'mouse'], max: 5, breed: 0.004 });
  def('cat', { name: 'Cat', art: [['.....k.k', 't....bbe', 't.bbbbb.', '..k...k.']], pal: { b: '#e8963a', t: '#e8963a', k: '#5a3a1a', e: '#3ac83a' }, variants: { b: ['#e8963a', '#3a3a3a', '#a8a8a8', '#f0e8e0'] }, speed: 0.5, prey: ['mouse', 'songbird', 'pigeon'], metab: 1 / 300, breed: 0, max: 6, idle: 0.6, nocturnal: true });
  def('squirrel', { name: 'Squirrel', hab: 'climb', climbVeg: true, art: [['tt...', 't..be', 'tbbbb', '..k.k']], pal: { t: '#a85a2a', b: '#a85a2a', e: '#111', k: '#6a3a1a' }, speed: 0.7, eats: ['SEED', 'LITTER', 'FLOWER'], max: 8, breed: 0.008 });
  def('car', { name: 'Car', hab: 'vehicle', idle: 0, art: [['...rrrrr.....', '..rgggrgg....', 'bbbbbbbbbbbbl', 'bbbbbbbbbbbbb', '..kk.....kk..']], pal: { b: '#d83a3a', r: '#c03030', g: '#9fd0e8', l: '#fff0a0', k: '#1a1a1a' },
    variants: { b: ['#d83a3a', '#3a6ad8', '#e8e8e8', '#2a2a2a', '#e8c030', '#3ab04a'] }, speed: 0.9, metab: 0, breed: 0, sleeps: false, max: 6, life: 99999, glow: '#fff0a0' });
  def('rat', { name: 'Rat', art: [['..bbbe', 'tbbbbb', '.k..k.']], pal: { b: '#6a6058', t: '#b08a84', e: '#c02020', k: '#3a3430' }, speed: 0.55, eats: ['LITTER', 'PLANT', 'FUNGUS', 'SEED', 'ASH'], max: 16, breed: 0.02, nocturnal: true, toxicOk: true, life: 200, mature: 25 });
  def('cockroach', { name: 'Cockroach', hab: 'climb', art: [['bbbk', 'k.k.']], pal: { b: '#5a3418', k: '#2a1808' }, speed: 0.8, eats: ['LITTER', 'PLANT', 'ASH', 'FUNGUS'], max: 20, breed: 0.02, toxicOk: true, sleeps: false, life: 200, mature: 20 });

  // Prehistoric
  def('brontosaurus', { name: 'Brontosaurus', art: [[
    '....................bbb.',
    '...................bbbe.',
    '...................bb...',
    '..................bb....',
    '.................bb.....',
    '................bb......',
    '...............bb.......',
    '..............bb........',
    '.......bbbbbbbbb........',
    '.....bbbbbbbbbbbb.......',
    '...bbbbbbbbbbbbbbb......',
    '.bbbbbbbbbbbbbbbbb......',
    'bb..wwwwwwwwwwwww.......',
    '.....bb.bb..bb.bb.......',
    '.....bb.bb..bb.bb.......',
    '.....kk.kk..kk.kk.......']], pal: { b: '#6a8a5a', w: '#8aa87a', e: '#111', k: '#3a4a2a' }, speed: 0.15, eats: ['LEAF', 'NEEDLE', 'PLANT', 'VINE'], reach: 16, max: 3, breed: 0.002, life: 1500, step: 2, food: 0.06, metab: 1 / 300 });
  def('triceratops', { name: 'Triceratops', art: [[
    '..........f....',
    '.........ffw...',
    '..bbbbbb.fbbew.',
    '.bbbbbbbbbbbbbw',
    'bbbbbbbbbbbbbb.',
    'b.bbbbbbbbbb...',
    '..bb.bb..bb.bb.',
    '..kk.kk..kk.kk.']], pal: { b: '#8a6a4a', f: '#c86a3a', w: '#f0e8d0', e: '#111', k: '#4a3a2a' }, speed: 0.25, eats: ['PLANT', 'LEAF', 'GRASS', 'FLOWER'], max: 4, breed: 0.003, life: 1200, step: 2, food: 0.08 });
  def('raptor', { name: 'Raptor', art: [[
    '......bbe',
    '......bbw',
    '.....bb..',
    'tbbbbbb..',
    '...b.b...',
    '...k.k...']], pal: { b: '#8a6a3a', t: '#6a4a2a', w: '#f0f0e0', e: '#e8c020', k: '#3a2a1a' }, speed: 0.85, prey: ['mammal', 'meganeura'], max: 6, breed: 0.004, step: 2 });
  def('trex', { name: 'T-Rex', art: [[
    '...........bbbbbb.',
    '...........bbbbbe.',
    '...........bbbbbbb',
    '...........bbwwww.',
    '..........bbb.....',
    '.........bbbbb....',
    't.......bbbbbbbk..',
    'tt....bbbbbbbb....',
    '.ttbbbbbbbbbbb....',
    '....bbbbbbbbb.....',
    '.......bb..bb.....',
    '.......b...b......',
    '......kk..kk......']], pal: { b: '#5a6a3a', t: '#4a5a2e', w: '#f0f0e0', e: '#e8a020', k: '#2a321a' }, speed: 0.45, prey: ['triceratops', 'raptor', 'mammal', 'brontosaurus'], max: 2, breed: 0.002, metab: 1 / 250, step: 2, sense: 70, life: 1500 });
  def('mammal', { name: 'Early mammal', art: [['..be', 'bbbb', 'k..k']], pal: { b: '#8a6a4a', e: '#111', k: '#4a3a2a' }, speed: 0.5, eats: ['PLANT', 'SEED', 'LITTER'], max: 14, breed: 0.02, nocturnal: true, life: 200, mature: 25 });

  // Ant hill
  def('ant', { name: 'Ant', hab: 'climb', ant: true, digs: true, art: [['kk.kk', '.k.k.'], ['kk.kk', 'k.k.k']], pal: { k: '#5a1e10' }, speed: 0.9, metab: 0, breed: 0, max: 80, sleeps: false, life: 7200, sense: 0 });
  def('antqueen', { name: 'Ant queen', hab: 'climb', ant: true, queen: true, digs: true, art: [['..ww...', 'kkkk.kk', '.k.k.k.']], pal: { k: '#6a2410', w: '#e0e8f0' }, speed: 0.2, metab: 0, breed: 0, max: 6, sleeps: false, life: 99999 });
  def('aphid', { name: 'Aphid', hab: 'climb', climbVeg: true, art: [['gg.', '.gg']], pal: { g: '#9ad83a' }, speed: 0.15, eats: ['PLANT', 'LEAF', 'FLOWER'], sip: true, max: 20, breed: 0.015, sleeps: false, life: 300, mature: 30 });
  def('spider', { name: 'Spider', hab: 'climb', climbVeg: true, art: [['k.k.k', '.kkk.', 'k.r.k']], pal: { k: '#1a1a1a', r: '#c02020' }, speed: 0.5, prey: ['ant', 'aphid', 'beetle'], max: 3, breed: 0.004, metab: 1 / 250, sleeps: false });
  def('ladybug', { name: 'Ladybug', hab: 'climb', climbVeg: true, art: [['rrk', 'r.r']], pal: { r: '#e0281a', k: '#111' }, speed: 0.3, prey: ['aphid'], max: 6, breed: 0.006 });
  def('earthworm', { name: 'Earthworm', hab: 'burrow', art: [['..pp..', 'pp..pp'], ['pp..pp', '..pp..']], pal: { p: '#d88a8a' }, speed: 0.25, metab: 0, breed: 0.004, max: 8, sleeps: false, noFlip: false });

  // Wasteland extras
  def('moth', { name: 'Moth', hab: 'air', art: [['w.w', 'wbw'], ['...', 'wbw']], pal: { w: '#c8b8a0', b: '#5a4a3a' }, speed: 0.4, flutter: true, metab: 0, perches: 0.2, max: 10, breed: 0, onlyNight: true, life: 5000, sleeps: false });

  // Derived tables (run after every species file has loaded) -----------------
  const M = DS.M;
  DS.finalizeSpecies = function () {
  for (const id in S) {
    const sp0 = S[id];
    if (sp0.eatSet !== undefined) continue;
    const sp = sp0;
    sp.w = Math.max(...sp.art[0].map((r) => r.length));
    sp.h = sp.art[0].length;
    sp.eatSet = sp.eats ? new Set(sp.eats.map((n) => M[n])) : null;
    sp.preySet = sp.prey ? new Set(sp.prey) : null;
    sp.chaseSet = sp.chases ? new Set(sp.chases) : null;
    sp.life *= 60;
    sp.mature *= 60;
    sp.metab = sp.metab / 60;
    if (sp.reach == null) sp.reach = sp.h + 2;
  }
  for (const id in S) S[id].fears = new Set();
  for (const id in S) {
    for (const p of S[id].prey || []) if (S[p]) S[p].fears.add(id);
    for (const p of S[id].chases || []) if (S[p]) S[p].fears.add(id);
  }
  };

  DS.Species = S;
  DS.SpeciesKit = { def, bird, fish, S };
})();
