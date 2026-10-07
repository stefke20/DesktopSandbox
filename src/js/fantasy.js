// Fantasy & mythical creatures, and the magic that makes them special.
(function () {
  'use strict';
  const DS = window.DS;
  const { U, M, MP } = DS;
  const { def, bird, S, humanoid: H } = DS.SpeciesKit;
  const D = (id, o) => def(id, Object.assign({ cat: 'myth', metab: 1 / 240, breed: 0.002, max: 4, sense: 55 }, o));

  const HUMANS = ['person', 'survivor', 'farmer', 'jogger', 'beekeeper', 'elf', 'dwarf', 'knight', 'wizard', 'gnome'];
  const LIVESTOCK = ['sheep', 'cow', 'pig', 'goatfarm', 'chicken', 'horse', 'deer', 'goat', 'rabbit'];
  const MONSTERS = ['dragon', 'wyvern', 'orc', 'goblin', 'troll', 'ogre', 'cyclops', 'hydra', 'minotaur', 'chimera', 'basilisk', 'werewolf', 'vampire', 'skeleton', 'zombie', 'cerberus'];

  // ---------------------------------------------------------------- machines & undead
  D('robot', { name: 'Robot', art: H({ h: 9, w: 5, head: [4, 3], antenna: true, belt: true }), pal: { f: '#a8b0bc', s: '#7a8494', p: '#6a7484', e: '#ff3030', k: '#3a3a44', a: '#9aa4b4', g: '#ff3030', h: '#a8b0bc' }, speed: 0.3, metab: 0, sleeps: false, glow: '#ff5050', idle: 0.3, life: 99999, breed: 0 });
  D('robodog', { name: 'Robot dog', art: [['.....kk.', 't....bbe', '.bbbbbbb', '.k.k.k.k']], pal: { b: '#9aa4b4', t: '#6a7484', k: '#3a3a44', e: '#40d0ff' }, speed: 0.6, metab: 0, sleeps: false, chases: ['cat', 'squirrel', 'goblin'], glow: '#40d0ff', life: 99999, breed: 0 });
  D('drone', { name: 'Drone', hab: 'air', art: [['k.k.k', '.www.', '..g..']], pal: { k: '#2a2a2a', w: '#d0d4dc', g: '#40ff60' }, speed: 0.8, flutter: true, metab: 0, sleeps: false, perches: 0.1, glow: '#40ff60', life: 99999, breed: 0 });
  D('vampire', { name: 'Vampire', humanoid: false, art: H({ h: 9, w: 3, hair: true, cape: true }), pal: { h: '#141414', f: '#e8e4ec', e: '#e02020', s: '#2a1a2a', p: '#1a1a1a', k: '#0a0a0a', c: '#a01020' }, speed: 0.45, nocturnal: true, prey: HUMANS.concat(['sheep', 'cow', 'deer']), infects: 'vampire', magic: 'vampire', max: 8 });
  D('werewolf', { name: 'Werewolf', art: H({ h: 11, w: 5, head: [3, 3], snout: 2, ears: true, tail: 2 }), pal: { f: '#6a6a72', h: '#6a6a72', e: '#f0e040', s: '#5a5a62', p: '#5a5a62', k: '#2a2a2e', t: '#5a5a62' }, speed: 0.7, nocturnal: true, prey: LIVESTOCK.concat(HUMANS), magic: 'moon', step: 2 });
  D('ghost', { name: 'Ghost', hab: 'air', phase: true, alpha: 0.6, art: [['.www.', 'wwwww', 'wewew', 'wwwww', 'wwwww', 'w.w.w'], ['.www.', 'wwwww', 'wewew', 'wwwww', 'wwwww', '.w.w.']], pal: { w: '#f0f4ff', e: '#1a1a2a' }, speed: 0.3, flutter: true, onlyNight: true, metab: 0, perches: 0, sleeps: false, glow: '#c0d0ff', max: 10, breed: 0, life: 99999 });
  D('skeleton', { name: 'Skeleton', art: H({ h: 8, w: 3, weapon: 'sword' }), pal: { f: '#f0ece0', e: '#1a1a1a', s: '#e0dcd0', p: '#e0dcd0', k: '#c8c4b8', w: '#a8b0b8', d: '#6a4a2a' }, speed: 0.25, nocturnal: true, sleeps: true, metab: 0, prey: ['knight'], max: 10, breed: 0, life: 99999 });

  // ---------------------------------------------------------------- folk of the realm
  D('witch', { name: 'Witch', hab: 'air', art: [['....m....', '...mmm...', '..mmmmm..', '....fe...', '...sss...', '..ssss...', 'kkkkkkkyy', '....p....']], pal: { m: '#1a1a2a', f: '#8ac868', e: '#111', s: '#5a2a7a', k: '#7a5030', y: '#d8b860', p: '#1a1a1a' }, speed: 0.7, nocturnal: true, perches: 0.2, magic: 'frog', metab: 0 });
  D('wizard', { name: 'Wizard', humanoid: true, art: H({ h: 10, w: 5, head: [3, 2], hat: 'wizard', beard: 'long', robe: true, weapon: 'staff' }), pal: { m: '#2a3a9a', f: '#f0c8a0', e: '#111', b: '#e8e8e8', s: '#3a4ab0', d: '#7a5030', g: '#80e0ff' }, speed: 0.2, metab: 0, magic: 'spell', glow: '#80e0ff', idle: 0.5, life: 99999 });
  D('knight', { name: 'Knight', humanoid: true, art: H({ h: 8, w: 3, hat: 'helmet', weapon: 'sword', cape: true }), pal: { m: '#a8b0b8', f: '#c8ccd4', e: '#1a1a1a', s: '#b8c0c8', p: '#8a9098', k: '#4a4a52', w: '#e8eef4', d: '#7a5030', c: '#2a4ab0' }, speed: 0.45, metab: 0, prey: MONSTERS, sense: 70, life: 99999 });
  D('fairy', { name: 'Fairy', hab: 'air', art: [['v.v', 'vfv', '.s.'], ['...', 'vfv', '.s.']], pal: { v: '#c8f0ff', f: '#f8d8c0', s: '#ff8ad8' }, variants: { s: ['#ff8ad8', '#8ad8ff', '#d8ff8a', '#ffd88a'] }, speed: 0.5, flutter: true, eats: ['FLOWER', 'BLOSSOM'], sip: true, magic: 'grow', glow: '#ffd0ff', metab: 1 / 400, max: 14, breed: 0.006 });
  D('pixie', { name: 'Pixie', hab: 'air', art: [['v.v', 'vfv', '.g.'], ['...', 'vfv', '.g.']], pal: { v: '#d0ffd0', f: '#e8c8a8', g: '#3ad06a' }, speed: 0.8, flutter: true, eats: ['FLOWER', 'BERRY'], sip: true, magic: 'sparkle', glow: '#a0ffa0', metab: 1 / 400, max: 14, breed: 0.006 });
  D('elf', { name: 'Elf', humanoid: true, art: H({ h: 8, w: 3, hair: 'long', ears: true, weapon: 'bow' }), pal: { h: '#f0e090', f: '#f4dcc0', e: '#2a6a3a', s: '#3a8a4a', p: '#5a4a2a', k: '#3a2a1a', d: '#8a6a3a' }, speed: 0.45, eats: ['BERRY', 'FLOWER'], metab: 1 / 400, max: 8, breed: 0.003, idle: 0.4 });
  D('dwarf', { name: 'Dwarf', humanoid: true, hab: 'climb', digs: true, art: H({ h: 6, w: 5, head: [3, 2], hat: 'helmet', beard: 'long', weapon: 'axe', legs: 1 }), pal: { m: '#8a8a92', f: '#f0c0a0', e: '#111', b: '#d8601a', s: '#6a3a2a', p: '#4a3a2a', k: '#2a1a10', w: '#c8d0d8', d: '#6a4a2a' }, speed: 0.4, magic: 'miner', eats: ['FUNGUS', 'BERRY'], metab: 1 / 400, max: 8, breed: 0.003 });
  D('gnome', { name: 'Gnome', humanoid: true, art: H({ h: 5, w: 3, head: [1, 1], hat: 'wizard', beard: true, legs: 1 }), pal: { m: '#e02a2a', f: '#f0c0a0', e: '#111', b: '#f4f4f4', s: '#2a6ad8', p: '#5a3a1a', k: '#3a2a1a' }, speed: 0.25, eats: ['BERRY', 'FUNGUS', 'FLOWER'], metab: 1 / 400, max: 10, breed: 0.004, idle: 0.6, magic: 'grow' });
  D('goblin', { name: 'Goblin', art: H({ h: 6, w: 3, head: [2, 2], ears: true, weapon: 'club', legs: 2 }), pal: { f: '#6aa83a', e: '#f0e040', s: '#6a4a2a', p: '#4a3a2a', k: '#2a1a10', d: '#5a3a1a' }, speed: 0.55, prey: ['chicken', 'rabbit', 'mouse', 'sheep', 'gnome', 'elf'], eats: ['BERRY', 'FUNGUS'], max: 10, breed: 0.006 });
  D('orc', { name: 'Orc', art: H({ h: 10, w: 5, head: [3, 3], weapon: 'axe', belt: true, horns: false }), pal: { f: '#5a7a4a', e: '#e02020', s: '#4a3a2a', p: '#3a3028', k: '#1a1610', w: '#a8b0b8', d: '#5a3a1a' }, speed: 0.45, prey: LIVESTOCK.concat(['elf', 'dwarf', 'person', 'farmer', 'gnome']), max: 8, breed: 0.004, step: 2 });

  // ---------------------------------------------------------------- giants
  D('troll', { name: 'Troll', art: H({ h: 13, w: 7, head: [4, 3], snout: 1, weapon: 'club', belly: true }), pal: { f: '#7a8a6a', e: '#e8c020', s: '#5a6a4a', p: '#4a5a3a', k: '#2a3a20', d: '#5a3a1a' }, speed: 0.22, prey: ['goat', 'goatfarm', 'sheep', 'cow', 'person', 'farmer'], magic: 'troll', nocturnal: true, step: 3 });
  D('ogre', { name: 'Ogre', art: H({ h: 14, w: 7, head: [4, 3], weapon: 'club', belly: true, belt: true }), pal: { f: '#c8a870', e: '#3a2a1a', s: '#7a5a3a', p: '#5a4030', k: '#2a1a10', d: '#5a3a1a' }, speed: 0.22, prey: ['cow', 'pig', 'sheep', 'horse', 'person', 'farmer', 'boar'], step: 3 });
  D('cyclops', { name: 'Cyclops', art: H({ h: 16, w: 7, head: [5, 4], eye: 'one', weapon: 'club', belt: true }), pal: { f: '#d8b080', e: '#1a1a1a', s: '#8a6a3a', p: '#d8b080', k: '#6a4a2a', d: '#5a3a1a' }, speed: 0.22, prey: ['sheep', 'goat', 'goatfarm', 'cow', 'person', 'knight'], step: 4, life: 2000 });
  D('titan', { name: 'Titan', art: H({ h: 22, w: 9, head: [5, 4], hair: true, beard: true, robe: false }), pal: { h: '#6a4a2a', b: '#6a4a2a', f: '#c8905a', e: '#f0d040', s: '#c8a040', p: '#c8905a', k: '#8a6030' }, speed: 0.12, metab: 0, magic: 'quake', step: 5, max: 2, breed: 0, life: 99999 });
  D('talos', { name: 'Talos (bronze giant)', art: H({ h: 18, w: 7, head: [4, 4], hat: 'helmet', weapon: 'spear' }), pal: { m: '#a8702a', f: '#c88a3a', e: '#ffd040', s: '#b8782a', p: '#a8702a', k: '#6a4a1a', w: '#e8c870', d: '#8a5a2a' }, speed: 0.18, metab: 0, sleeps: false, prey: ['orc', 'goblin', 'troll', 'minotaur'], glow: '#ffd040', step: 4, max: 2, breed: 0, life: 99999 });
  D('yeti', { name: 'Yeti', art: H({ h: 12, w: 7, head: [4, 3], belly: true }), pal: { f: '#e8eef4', e: '#3a6ab0', s: '#f0f4f8', p: '#e0e6ec', k: '#9aa4b0' }, speed: 0.35, prey: ['goat', 'ibex', 'snowhare', 'yak', 'penguin', 'person'], eats: ['BERRY'], step: 3 });
  D('bigfoot', { name: 'Bigfoot', art: H({ h: 12, w: 6, head: [4, 3] }), pal: { f: '#6a4a30', e: '#111', s: '#5a3e28', p: '#5a3e28', k: '#3a2818' }, speed: 0.4, eats: ['BERRY', 'FUNGUS', 'LEAF'], prey: ['trout', 'salmon'], idle: 0.5, step: 3 });
  D('ent', { name: 'Ent (tree giant)', art: [['..lllll..', '.lllllll.', 'lllllllll', '.lllllll.', '...bbb...', '...beb...', '...bbb...', '..bbbbb..', '.b.bbb.b.', '.b.bbb.b.', '...bbb...', '...bbb...', '...b.b...', '...b.b...', '..bb.bb..']], pal: { l: '#3a8a2a', b: '#6b4423', e: '#f0e060' }, speed: 0.08, metab: 0, magic: 'plant', step: 3, max: 3, breed: 0, life: 99999 });

  // ---------------------------------------------------------------- beasts & monsters
  D('hydra', { name: 'Hydra', hab: 'amph', art: [['.e....e....e..', 'nn...nn...nn..', '.n....n...n...', '..n...n..n..e.', '...n..n.n..nn.', '....nnnnn.n...', '..bbbbbbbbb...', '.bbbbbbbbbbb..', 'tbbbbbbbbbbb..', '.tbb.bb.bb.b..', '..kk.kk.kk.k..']], pal: { n: '#3a7a5a', e: '#f0e040', b: '#2e6a4a', t: '#2e6a4a', k: '#1e4a32' }, speed: 0.3, prey: LIVESTOCK.concat(['knight', 'person', 'crocodile', 'smallfish']), splits: true, max: 6, step: 2 });
  D('dragon', { name: 'Dragon', hab: 'air', high: true, dives: true, art: [
    ['......vv..........', '.....vvvv.........', '....vvvvvv.....hh.', 'tt.bbbbbbbbbb.hhhe', '.ttbbbbbbbbbbbhhhn', '...bbbbbbbbbb.....', '....k..k...k......'],
    ['..................', '..................', '...............hh.', 'tt.bbbbbbbbbb.hhhe', '.ttbbbbbbbbbbbhhhn', '...bvvvvvvbbb.....', '....vvvvvk.k......']], pal: { b: '#b8281a', h: '#c8301e', t: '#b8281a', v: '#e8803a', e: '#f0e040', n: '#3a1a10', k: '#3a1a10' }, variants: { b: ['#b8281a', '#2a7a3a', '#2a3a8a', '#1a1a1a', '#c8a020'] }, speed: 0.9, prey: LIVESTOCK.concat(['knight', 'unicorn', 'person', 'farmer', 'pegasus']), magic: 'firebreath', perches: 0.25, max: 3, life: 3000 });
  D('wyvern', { name: 'Wyvern', hab: 'air', art: bird(12, { thick: 2 }), pal: { b: '#4a7a3a', t: '#3a6a2a', w: '#7aa84a', e: '#f0e040', y: '#e8e0c0', k: '#3a3a2a' }, speed: 0.9, prey: LIVESTOCK, magic: 'poison', dives: true, perches: 0.3 });
  D('phoenix', { name: 'Phoenix', hab: 'air', art: bird(10, { thick: 2 }), pal: { b: '#f06a1a', t: '#f0d020', w: '#ffb020', e: '#fff8c0', y: '#f0d020', k: '#c84a10' }, speed: 0.8, high: true, glow: '#ffb040', magic: 'phoenix', rebirth: true, eats: ['BERRY', 'BLOSSOM'], sip: true, perches: 0.3, max: 3, life: 3000 });
  D('thunderbird', { name: 'Thunderbird', hab: 'air', art: bird(14, { thick: 2 }), pal: { b: '#2a4a8a', t: '#f0f0f0', w: '#4a7ae8', e: '#f0f040', y: '#f0d020', k: '#f0d020' }, speed: 1.0, high: true, magic: 'thunder', prey: ['whale', 'orca', 'elk', 'deer'], perches: 0.2, max: 2 });
  D('griffin', { name: 'Griffin', hab: 'air', art: bird(11, { thick: 2 }), pal: { b: '#c8963e', t: '#a8762e', w: '#f0f0e8', e: '#111', y: '#f0c020', k: '#f0c020' }, speed: 1.0, high: true, dives: true, prey: ['horse', 'goat', 'sheep', 'deer', 'rabbit', 'boar'], perches: 0.4 });
  D('harpy', { name: 'Harpy', hab: 'air', art: [['vv...hh.', 'vvv.hffe', '.vvvsss.', '..vvss..', '...k.k..'], ['........', '....hhe.', '.vvvsfff', 'vvvvss..', '...k.k..']], pal: { v: '#6a5a4a', h: '#2a1a10', f: '#d8a888', e: '#e02020', s: '#8a7a6a', k: '#e8c020' }, speed: 0.9, prey: ['chicken', 'rabbit', 'mouse', 'sheep', 'goatfarm', 'pigeon'], dives: true, perches: 0.4, max: 6 });
  D('siren', { name: 'Siren', hab: 'air', art: [['v....hh.', 'vv..hffe', '.vvvsss.', '..vvss..', '...k.k..'], ['........', '....hhe.', '.vvvsff.', 'vvvvss..', '...k.k..']], pal: { v: '#8ab0d8', h: '#f0d070', f: '#f4dcc8', e: '#2a6ab0', s: '#a8c8e8', k: '#e8c020' }, speed: 0.6, magic: 'lure', prey: ['sailboat', 'boat', 'smallfish', 'sardine'], dives: true, perches: 0.5, max: 4 });
  D('pegasus', { name: 'Pegasus', hab: 'air', art: [['...vvv.....', '..vvvvv..mm', '.vvvvvv..bbe', 'tbbbbbbbbbbn', 't.bbbbbbb...', '..b.b..b.b..', '..k.k..k.k..']], pal: { v: '#f4f8ff', b: '#f4f4f8', m: '#c8d8f0', t: '#c8d8f0', e: '#3a6ab0', n: '#d8c8c8', k: '#a8a8b0' }, speed: 0.9, high: true, eats: ['GRASS', 'TALLGRASS', 'FLOWER'], magic: 'sparkle', perches: 0.4, max: 3 });
  D('unicorn', { name: 'Unicorn', art: [['..........a', '.........ma.', '........mbbe', 't.......mbbn', 'tbbbbbbbbb..', '.bbbbbbbb...', '.b.b..b.b...', '.k.k..k.k...']], pal: { b: '#f8f8fc', a: '#f0d040', m: '#ff8ad8', t: '#8ad0ff', e: '#7a3ab0', n: '#e8d8e0', k: '#d8c8d8' }, speed: 0.6, eats: ['GRASS', 'FLOWER', 'TALLGRASS', 'BLOSSOM'], magic: 'rainbow', glow: '#ffd0ff', step: 2, max: 4, metab: 1 / 400 });
  D('centaur', { name: 'Centaur', humanoid: false, art: [['......hh..', '......fe..', '......ssd.', '.....sss.d', '......s..d', 'tbbbbbbb..', 't.bbbbbb..', '..b.b.b.b.', '..k.k.k.k.']], pal: { h: '#5a3a1a', f: '#d8a878', e: '#111', s: '#d8a878', b: '#8a5a3a', t: '#3a2a1a', d: '#8a6a3a', k: '#3a2a1a' }, speed: 0.7, eats: ['GRASS', 'BERRY', 'TALLGRASS'], prey: ['deer', 'boar', 'rabbit'], step: 2, max: 6 });
  D('minotaur', { name: 'Minotaur', art: H({ h: 12, w: 5, head: [3, 3], snout: 1, horns: 'big', weapon: 'axe', belt: true }), pal: { f: '#6a4028', a: '#f0e8d0', e: '#e02020', s: '#7a4a2e', p: '#6a4028', k: '#2a1a10', w: '#b8c0c8', d: '#5a3a1a' }, speed: 0.4, prey: HUMANS.concat(['sheep', 'cow']), step: 2, max: 2 });
  D('medusa', { name: 'Medusa', art: H({ h: 9, w: 3, snakehair: true, robe: true }), pal: { h: '#3aa83a', f: '#a8c8a0', e: '#f0e040', s: '#c8a040' }, speed: 0.2, magic: 'petrify', metab: 0, max: 1, breed: 0, life: 99999, idle: 0.5 });
  D('basilisk', { name: 'Basilisk', art: [['...........yy.', '..ss..ss..bbbe', 'bbbbbbbbbbbbbn', '.bb..bb..bb...']], pal: { b: '#3a6a3a', s: '#2a4a2a', y: '#f0c020', e: '#f0f040', n: '#2a3a2a' }, speed: 0.25, magic: 'petrify', prey: ['mouse', 'rat', 'chicken'], max: 1, breed: 0 });
  D('cerberus', { name: 'Cerberus', art: [['.........k.k', '......kbbbbe', '.......k.bbn', 'w.....bbbbe.', 'w.bbbbbbbbbn', '.bbbbbbbbbe.', '.bbbbbbbbbn.', '.b.b...b.b..', '.k.k...k.k..']], pal: { b: '#2a2226', k: '#1a1416', e: '#ff3020', n: '#ff5040', w: '#4a3a3e' }, speed: 0.75, prey: HUMANS.concat(LIVESTOCK, ['skeleton', 'ghost']), nocturnal: false, sleeps: false, step: 2, max: 2 });
  D('chimera', { name: 'Chimera', art: [['........a..', 'gg.....mmbbe', 'g.g...mbbbbn', '...gbbbbbbb.', '...bbbbbbb..', '...b.b.b.b..', '...k.k.k.k..']], pal: { b: '#c8963e', m: '#7a4a1e', a: '#e8e0c8', g: '#4a8a3a', e: '#f0e040', n: '#3a2010', k: '#3a2010' }, speed: 0.65, prey: LIVESTOCK, magic: 'firebreath', step: 2, max: 2 });
  D('sphinx', { name: 'Sphinx', art: [['.........hhh', '.........hfe', '.........hff', 't..bbbbbbbs.', 'tbbbbbbbbbbs', '.kkkkkkkkkkk']], pal: { h: '#2a3a8a', f: '#d8a868', e: '#111', b: '#d8b070', s: '#d8a868', t: '#b8904a', k: '#b8904a' }, speed: 0.1, idle: 0.9, metab: 0, sleeps: false, magic: 'riddle', max: 1, breed: 0, life: 99999 });
  D('satyr', { name: 'Satyr', art: H({ h: 8, w: 3, hair: true, horns: true, goatLegs: true, tail: 1 }), pal: { h: '#5a3a1a', a: '#e8dcc0', f: '#e0b090', e: '#111', s: '#e0b090', p: '#7a5a3a', k: '#2a1a10', t: '#7a5a3a' }, speed: 0.5, jumpy: true, eats: ['BERRY', 'FLOWER', 'GRASS'], magic: 'music', max: 4 });
  D('kitsune', { name: 'Kitsune (nine-tailed fox)', art: [['tt.......k.', 'ttt.....bbe', 'tttbbbbbbbn', 'tt.bbbbbb..', '...k.k.k.k.']], pal: { b: '#f0a040', t: '#fff4e0', k: '#3a2418', e: '#111', n: '#111' }, speed: 0.75, prey: ['mouse', 'rabbit', 'hare', 'chicken'], magic: 'foxfire', glow: '#80b0ff', nocturnal: true, max: 3, metab: 1 / 300 });
  D('imp', { name: 'Imp', hab: 'air', art: [['v..v.', 'vrrv.', '.rer.', '.rr..', 't....'], ['.....', '.rr..', 'vrervv', '.rr..', 't....']], pal: { v: '#5a1a1a', r: '#c8281a', e: '#f0e040', t: '#8a1a1a' }, speed: 0.9, flutter: true, magic: 'mischief', prey: ['fly', 'mosquito', 'moth', 'cricket'], perches: 0.3, max: 8, breed: 0.004 });
  D('slime', { name: 'Slime', art: [['.ggg.', 'ggegg', 'ggggg'], ['.....', 'gggeg', 'ggggg']], pal: { g: '#5ad84a', e: '#1a3a1a' }, variants: { g: ['#5ad84a', '#4aa8f0', '#e85ab8', '#f0a83a'] }, speed: 0.3, jumpy: true, eats: ['PLANT', 'LEAF', 'LITTER', 'FUNGUS', 'GRASS', 'TALLGRASS', 'BERRY'], splits: true, max: 16, breed: 0.01, alpha: 0.85, sleeps: false });

  // ---------------------------------------------------------------- sea legends
  D('mermaid', { name: 'Mermaid', hab: 'water', art: [['.hh.....', 'hffe....', 'hsssfttt', '..sssss.']], pal: { h: '#e85a2a', f: '#f4d8c0', e: '#2a6ab0', s: '#3ab0a0', t: '#3ab0a0' }, variants: { h: ['#e85a2a', '#f0d070', '#1a1a1a', '#8a3ad8'], s: ['#3ab0a0', '#8a3ad8', '#3a8ad8'] }, speed: 0.45, prey: ['smallfish', 'sardine'], eats: ['SEAWEED', 'KELP'], sip: true, magic: 'sparkle', max: 6, breed: 0.003, sleeps: false });
  D('poseidon', { name: 'Poseidon', hab: 'water', art: H({ h: 10, w: 5, head: [3, 3], hat: 'crown', beard: 'long', weapon: 'trident', float: true }), pal: { m: '#f0c020', y: '#ffe060', f: '#c8d8e8', e: '#2a6ab0', b: '#e8f0f8', s: '#2a8ab0', w: '#f0c020', d: '#c8a020' }, speed: 0.4, metab: 0, magic: 'surge', glow: '#80d0ff', max: 1, breed: 0, life: 99999, sleeps: false });
  D('kraken', { name: 'Kraken', hab: 'water', art: [['.......bbbbbb.', '......bbbbbbbb', '......bbebbebb', '......bbbbbbbb', 'k.k.k.kbbbbbb.', '.k.k.kk.kk.k..', 'k.k.k..k..k.k.', '.k...k..k...k.', 'k...k....k....']], pal: { b: '#7a2a4a', e: '#f0e040', k: '#9a3a5a' }, speed: 0.35, prey: ['whale', 'spermwhale', 'shark', 'greatwhite', 'orca', 'dolphin', 'giantsquid', 'boat', 'sailboat'], magic: 'sink', max: 1, sleeps: false, life: 5000, sense: 80 });
  D('seaserpent', { name: 'Sea serpent', hab: 'water', breach: true, art: [['..ss...ss...ss.....hh.', '.bbbb.bbbb.bbbb..hhhhe', 'b....b....b....bbhhhh.'], ['b....b....b....bbhhhe.', '.bbbb.bbbb.bbbb..hhhh.', '..ss...ss...ss........']], pal: { b: '#2a6a7a', s: '#e8803a', h: '#3a7a8a', e: '#f0e040' }, speed: 0.6, prey: ['tuna', 'dolphin', 'seal', 'sealion', 'boat', 'shark'], max: 2, sleeps: false });
  D('nessie', { name: 'Loch Ness monster', hab: 'water', breach: true, art: [['...........bbe', '..........bb..', '.........bb...', '..bbbbbbbb....', 'tbbbbbbbb.....', '..f....f......']], pal: { b: '#3a5a3a', e: '#111', t: '#2a4a2a', f: '#2a4a2a' }, speed: 0.3, prey: ['salmon', 'trout', 'pike'], idle: 0.3, max: 1, breed: 0, sleeps: false });
  D('hippocampus', { name: 'Hippocampus', hab: 'water', art: [['......mm.', '.....mbbe', 'tt..bbbbn', '.tttbbbb.', '....f.f..']], pal: { b: '#4ab0c0', m: '#e8f8ff', t: '#3a90a8', e: '#111', n: '#2a7a8a', f: '#3a90a8' }, speed: 0.6, eats: ['SEAWEED', 'KELP'], max: 4, sleeps: false });

  // ---------------------------------------------------------------- gods & spirits
  D('zeus', { name: 'Zeus', hab: 'air', art: H({ h: 10, w: 5, head: [3, 3], hair: true, beard: 'long', robe: true, weapon: 'spear', cloud: true, legs: 2 }), pal: { h: '#f0f0f0', b: '#f0f0f0', f: '#e8c8a0', e: '#2a6ab0', s: '#f4f4f0', w: '#ffe060', d: '#ffe060', u: '#c8ccd8' }, speed: 0.3, high: true, perches: 0, metab: 0, magic: 'zeus', glow: '#ffe880', max: 1, breed: 0, life: 99999, sleeps: false });
  D('cupid', { name: 'Cupid', hab: 'air', art: [['v.hh.', 'vvffe', '.vsf.', '..ss.', '..f.f']], pal: { v: '#f8f8ff', h: '#f0d070', f: '#f8d0b8', e: '#111', s: '#ff8aa8' }, speed: 0.6, flutter: true, perches: 0.2, metab: 0, magic: 'love', max: 3, breed: 0, life: 99999 });

  // ---------------------------------------------------------------- magic
  const rainbow = ['#ff4a4a', '#ff9a3a', '#ffe84a', '#4ae86a', '#4aa8ff', '#9a6aff'];
  const isMyth = (c) => c.sp.cat === 'myth';

  function petrify(eco, c) {
    const W = eco.world, sp = c.sp;
    const rows = sp.art[0];
    const x0 = Math.round(c.x - sp.w / 2), y0 = Math.round(c.y - sp.h + 1);
    for (let y = 0; y < rows.length; y++)
      for (let x = 0; x < rows[y].length; x++) {
        if (rows[y][x] === '.') continue;
        const px = c.dir < 0 && !sp.noFlip ? x0 + sp.w - 1 - x : x0 + x;
        const t = W.get(px, y0 + y);
        if (t === M.EMPTY || MP.veg[t] || MP.kind[t] === DS.KIND.liquid) W.set(px, y0 + y, M.STONE, 0, (x + y) % 2 ? 1 : 2);
      }
    eco.fx.burst(c.x, c.cy, ['#a8a8a8', '#d8d8d8'], 10, 0.6);
    c.die(eco, 'stone', true);
  }

  function breathe(eco, c, mat) {
    const W = eco.world, sp = c.sp;
    const dir = c.dir || 1;
    const mx = c.x + dir * (sp.w / 2), my = c.cy;
    for (let i = 1; i <= 14; i++) {
      const px = Math.round(mx + dir * i), py = Math.round(my + i * 0.55 + U.rand(-1, 1));
      eco.fx.add(px, py, dir * U.rand(0.3, 0.8), U.rand(-0.2, 0.3), mat === M.FIRE ? U.pick(['#ffd040', '#ff8a1a', '#ff4a10']) : U.pick(['#9aff4a', '#6ad83a']), 18, 0);
      const t = W.get(px, py);
      if (mat === M.FIRE) {
        if ((t === M.EMPTY && Math.random() < 0.35) || MP.flammable[t] > 0) W.set(px, py, M.FIRE, 30);
        else if (t === M.SNOW || t === M.ICE) W.set(px, py, M.WATER);
      } else if (t === M.EMPTY && Math.random() < 0.15) W.set(px, py, M.TOXIC);
      for (const o of eco.list) if (o !== c && !o.dead && Math.abs(o.x - px) < 2 && Math.abs(o.cy - py) < 2 && !isMyth(o)) o.die(eco, mat === M.FIRE ? 'burn' : 'toxic');
    }
  }

  function groundBelow(W, x, y) {
    x = Math.round(x);
    let yy = Math.max(0, Math.round(y));
    while (yy < W.h - 1 && !W.isSolid(x, yy) && !W.isLiquid(x, yy)) yy++;
    return yy;
  }

  const Magic = {
    petrify,
    tick(c, eco) {
      const W = eco.world, fx = eco.fx, sp = c.sp, r = Math.random();
      switch (sp.magic) {
        case 'firebreath':
          if ((c.goal === 'hunt' && c.target && Math.abs(c.target.x - c.x) < 22 && r < 0.03) || r < 0.0005) breathe(eco, c, M.FIRE);
          break;
        case 'poison':
          if ((c.goal === 'hunt' && r < 0.02) || r < 0.001) breathe(eco, c, M.TOXIC);
          break;
        case 'phoenix':
          if (r < 0.6) fx.add(c.x - c.dir * sp.w / 2, c.cy, U.rand(-0.2, 0.2), U.rand(-0.1, 0.2), U.pick(['#ffd040', '#ff8a1a', '#ff4a10']), 20, 0.02);
          if (r < 0.0015) { const gx = Math.round(c.x), gy = eco.topY(gx); if (MP.flammable[W.get(gx, gy)] > 0) W.set(gx, gy, M.FIRE, 40); }
          break;
        case 'thunder':
          if (r < 0.0005) eco.weather.strike(c.x + U.rand(-10, 10));
          break;
        case 'zeus':
          if (r < 0.0012) {
            const victims = eco.list.filter((o) => !o.dead && !isMyth(o) && Math.abs(o.x - c.x) < 60 && o.sp.hab !== 'water');
            eco.weather.strike(victims.length ? U.pick(victims).x : c.x + U.rand(-40, 40));
          }
          break;
        case 'petrify':
          if (c.anim % 25 === 0) {
            const o = eco.nearest(c, 10, (o) => !isMyth(o) && o.sp.hab !== 'water' && o.sp.hab !== 'burrow');
            if (o && Math.random() < 0.35) petrify(eco, o);
          }
          break;
        case 'troll':
          if (eco.daylight > 0.7 && r < 0.004 && eco.topY(Math.round(c.x)) >= c.y - sp.h) petrify(eco, c);
          break;
        case 'vampire':
          if (eco.daylight > 0.7 && r < 0.004 && eco.topY(Math.round(c.x)) >= c.y - sp.h) c.die(eco, 'burn');
          break;
        case 'grow':
          if (r < 0.3) fx.add(c.x + U.rand(-1, 1), c.cy + 1, U.rand(-0.1, 0.1), 0.15, U.pick(['#ffffff', '#ffd0ff', '#fff0a0']), 25, 0.005);
          if (r < 0.004) { const gy = groundBelow(W, c.x, c.y); DS.Terrain.plantAt(W, c.x, gy - 2, U.pick(['flower', 'tulip', 'lavender', 'tuft'])); }
          break;
        case 'sparkle':
          if (r < 0.35) fx.add(c.x + U.rand(-1, 1), c.cy, U.rand(-0.15, 0.15), U.rand(-0.1, 0.15), U.pick(['#ffffff', '#c0ffff', '#fff0a0']), 20, 0.004);
          break;
        case 'rainbow':
          if (c.moving) fx.add(c.x - c.dir * sp.w / 2, c.cy + U.randInt(-1, 1), 0, -0.02, rainbow[(c.anim >> 2) % rainbow.length], 40, 0);
          if (r < 0.005) { const gy = groundBelow(W, c.x, c.y); DS.Terrain.plantAt(W, c.x - c.dir * 3, gy - 2, 'flower'); }
          break;
        case 'plant':
          if (r < 0.0015 && c.moving) { const gy = groundBelow(W, c.x, c.y); DS.Terrain.plantAt(W, c.x - c.dir * 6, gy - 2, U.pick(['oak', 'birch', 'tree', 'pine', 'bush'])); }
          break;
        case 'spell':
          if (r < 0.0025) {
            fx.burst(c.x + c.dir * 4, c.cy - 4, ['#80e0ff', '#ffffff', '#c080ff'], 16, 1, 0, 25);
            const s = Math.random();
            if (s < 0.3) for (let i = 0; i < 6; i++) { const px = c.x + U.rand(-12, 12); DS.Terrain.plantAt(W, px, groundBelow(W, px, c.y) - 2, 'flower'); }
            else if (s < 0.5) eco.weather.strike(c.x + c.dir * U.rand(10, 30));
            else if (s < 0.7) eco.spawn(U.pick(['rabbit', 'chicken', 'frog']), c.x + c.dir * 4, c.y);
            else if (s < 0.85) { c.x = U.clamp(c.x + U.rand(-60, 60), 3, W.w - 4); c.y = groundBelow(W, c.x, 0) - 1; fx.burst(c.x, c.cy, ['#c080ff', '#ffffff'], 12, 0.8); }
            else eco.fx.glyph(c.x, c.y - sp.h - 4, 'bang', '#80e0ff');
          }
          break;
        case 'frog':
          if (r < 0.002) {
            const o = eco.nearest(c, 30, (o) => !isMyth(o) && o.sp.id !== 'frog' && o.sp.hab !== 'water');
            if (o) { fx.burst(o.x, o.cy, ['#6aff4a', '#c080ff'], 12, 0.8); o.die(eco, 'magic', true); eco.spawn('frog', o.x, o.y); }
          }
          break;
        case 'love':
          if (r < 0.006) {
            const o = eco.nearest(c, 25, (o) => !isMyth(o) && o.sp.breed > 0 && o.sp.hab !== 'vehicle');
            if (o && eco.list.length < eco.cap) { eco.birth(o); fx.glyph(o.x, o.y - o.sp.h - 4, 'heart', '#ff5a8a'); }
          }
          break;
        case 'lure':
          if (c.anim % 40 === 0) {
            fx.glyph(c.x, c.y - sp.h - 4, 'note', '#c0e0ff');
            for (const o of eco.list) if (!o.dead && !isMyth(o) && o.sp.hab !== 'water' && Math.abs(o.x - c.x) < 35 && Math.random() < 0.5) { o.setGoal('wander'); o.tx = c.x; }
          }
          break;
        case 'music':
          if (c.anim % 50 === 0 && r < 0.6) {
            fx.glyph(c.x + 2, c.y - sp.h - 4, 'note', '#fff0a0');
            for (const o of eco.list) if (!o.dead && !isMyth(o) && Math.abs(o.x - c.x) < 20 && o.goal === 'wander') o.setGoal('idle');
          }
          break;
        case 'miner':
          if (c.anim % 500 === 1 && r < 0.6) { c.tx = U.clamp(Math.round(c.x + U.rand(-25, 25)), 2, W.w - 3); c.ty = Math.min(W.h - 3, W.groundY(c.tx) + U.randInt(4, 25)); c.arrived = false; c.goal = 'wander'; }
          break;
        case 'quake':
          if (c.moving && c.anim % 30 === 0) { eco.weather.shake = Math.max(eco.weather.shake, 4); W.quake = Math.max(W.quake, 20); }
          break;
        case 'foxfire':
          if (r < 0.2) fx.add(c.x - c.dir * 4 + U.rand(-1, 1), c.cy - 2, U.rand(-0.1, 0.1), -0.15, U.pick(['#80b0ff', '#a0e0ff']), 30, -0.002);
          break;
        case 'mischief':
          if (r < 0.002) { const gx = Math.round(c.x), gy = eco.topY(gx); if (MP.flammable[W.get(gx, gy)] > 0) { W.set(gx, gy, M.FIRE, 30); fx.glyph(c.x, c.y - 6, 'bang', '#ff6a3a'); } }
          break;
        case 'surge':
          if (r < 0.01) { const gx = Math.round(c.x + U.rand(-15, 15)), gy = W.groundY(gx); if (W.get(gx, gy) === M.WATER && W.get(gx, gy - 1) === M.EMPTY) W.set(gx, gy - 1, M.WATER); }
          if (r < 0.3) fx.add(c.x, c.cy, U.rand(-0.2, 0.2), -0.2, '#c0e8ff', 25, -0.003);
          break;
        case 'sink':
          if (c.anim % 20 === 0) {
            const o = eco.nearest(c, 20, (o) => o.sp.id === 'boat' || o.sp.id === 'sailboat');
            if (o) { c.tx = o.x; c.ty = o.y; if (Math.abs(o.x - c.x) < 8) { fx.burst(o.x, o.y, ['#ffffff', '#c0e0ff', '#8a5a3a'], 20, 1.5); o.die(eco, 'eaten'); } }
          }
          break;
        case 'moon':
          if (eco.daylight < 0.2 && r < 0.002) fx.glyph(c.x + 2, c.y - sp.h - 4, 'note', '#e0e0ff');
          break;
        case 'riddle':
          if (r < 0.002) fx.glyph(c.x + 3, c.y - sp.h - 4, 'bang', '#ffe080');
          break;
      }
    },

    // hydras and slimes split, phoenixes are reborn from their ashes
    onDeath(c, eco, cause) {
      const sp = c.sp;
      if (sp.rebirth && cause !== 'lost' && cause !== 'stone') {
        eco.fx.burst(c.x, c.cy, ['#ffd040', '#ff8a1a', '#ff4a10', '#ffffff'], 24, 1.2, -0.02, 40);
        setTimeout(() => { if (eco.world && !c.reborn) { const p = eco.spawn(sp.id, c.x, c.y, { newborn: true }); if (p) { p.reborn = true; p.age = 0; } } }, 1500);
        return;
      }
      if (sp.splits && (cause === 'eaten' || cause === 'zap' || cause === 'burn') && (eco.count[sp.id] || 0) < sp.max * (eco.scale || 1)) {
        for (let i = 0; i < 2; i++) eco.spawn(sp.id, c.x + (i ? 2 : -2), c.y, { newborn: true });
      }
    },
  };

  DS.Magic = Magic;
  for (const id of HUMANS) if (S[id]) S[id].humanoid = true;
  DS.finalizeSpecies();
  DS.SpeciesCats.push(['myth', 'Fantasy & myth']);
})();
