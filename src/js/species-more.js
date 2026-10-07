// More biodiversity: procedural sprite generators and many more species.
(function () {
  'use strict';
  const DS = window.DS;
  const U = DS.U;
  const { def, bird, fish, S } = DS.SpeciesKit;

  // ---------------------------------------------------------------- helpers
  function grid() {
    const g = new Map();
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    return {
      put(x, y, c, keep) {
        const k = x + ',' + y;
        if (keep && g.has(k)) return;
        g.set(k, c);
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      },
      rows() {
        const out = [];
        for (let y = y0; y <= y1; y++) {
          let r = '';
          for (let x = x0; x <= x1; x++) r += g.get(x + ',' + y) || '.';
          out.push(r);
        }
        return out;
      },
    };
  }
  const hash = (x, y) => Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;

  // Side-view four-legged animal
  function quad(o) {
    const G = grid();
    const L = o.L, H = o.H, leg = o.leg == null ? 2 : o.leg;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < L; x++) {
        if (H >= 3 && L >= 5 && (y === 0 || y === H - 1) && (x === 0 || x === L - 1)) continue;
        let c = 'b';
        if (o.belly && y === H - 1 && x > 0 && x < L - 1) c = 'w';
        if (o.stripes && x % 2 === 0 && x > 0 && x < L - 1 && y < H - (o.belly ? 1 : 0)) c = 's';
        if (o.spots && hash(x, y) < 0.3 && y < H - 1) c = 's';
        if (o.saddle && y === 0 && x > 1 && x < L - 2) c = 's';
        G.put(x, y, c);
      }
    if (o.hump) for (let x = Math.floor(L * 0.25); x < Math.ceil(L * 0.65); x++) { G.put(x, -1, 'b'); if (o.hump > 1 && x > L * 0.32 && x < L * 0.55) G.put(x, -2, 'b'); }
    if (o.shell) for (let x = 1; x < L - 1; x++) { G.put(x, -1, 's'); if (x > 1 && x < L - 2) G.put(x, -2, 's'); }
    // legs
    let lx;
    if (L >= 9) lx = [1, 3, L - 4, L - 2];
    else if (L >= 6) lx = [1, 2, L - 3, L - 2];
    else lx = [0, L - 1];
    if (o.legs2) lx = [Math.floor(L / 2) - 1, Math.floor(L / 2) + 1];
    for (const x of lx) for (let i = 1; i <= leg; i++) G.put(x, H - 1 + i, i === leg ? 'k' : 'd');
    // neck
    let nx = L - 1, ny = 0;
    const neck = o.neck || 0, slope = o.slope == null ? 0.5 : o.slope;
    for (let i = 1; i <= neck; i++) {
      nx = L - 1 + Math.round(i * slope);
      ny = -i;
      G.put(nx, ny, o.spots && hash(nx, ny) < 0.3 ? 's' : 'b');
      if (o.neckW > 1) G.put(nx - 1, ny, 'b');
      if (o.mane) G.put(nx - 1, ny, 'm');
    }
    // head
    const [hw, hh] = o.head || [2, 2];
    const hl = neck ? nx : L - 1 + (o.headIn ? 0 : 1);
    const ht = neck ? ny - hh + 1 : (o.headDy == null ? -1 : o.headDy);
    for (let y = 0; y < hh; y++) for (let x = 0; x < hw; x++) G.put(hl + x, ht + y, 'h');
    const hr = hl + hw - 1;
    for (let i = 1; i <= (o.snout || 0); i++) G.put(hr + i, ht + hh - 1, i === o.snout ? 'n' : 'h');
    if (!o.snout) G.put(hr, ht + hh - 1, 'n');
    G.put(hw >= 3 ? hr - 1 : hr, ht, 'e');
    if (o.ears === 'up') G.put(hl + (hw > 2 ? 1 : 0), ht - 1, 'r');
    if (o.ears === 'long') { G.put(hl, ht - 1, 'r'); G.put(hl, ht - 2, 'r'); }
    if (o.ears === 'big') { for (let y = 0; y < Math.min(hh + 1, 5); y++) { G.put(hl - 1, ht + y, 'r'); G.put(hl - 2, ht + y - 1, 'r'); } }
    if (o.ears === 'fennec') { G.put(hl, ht - 1, 'r'); G.put(hl, ht - 2, 'r'); G.put(hl + 1, ht - 1, 'r'); }
    switch (o.horns) {
      case 'small': G.put(hl + 1, ht - 1, 'a'); break;
      case 'two': G.put(hl, ht - 1, 'a'); G.put(hl + 1, ht - 2, 'a'); break;
      case 'curve': G.put(hl, ht - 1, 'a'); G.put(hl - 1, ht - 1, 'a'); G.put(hl - 1, ht, 'a'); break;
      case 'long': G.put(hl, ht - 1, 'a'); G.put(hl - 1, ht - 2, 'a'); G.put(hl - 2, ht - 3, 'a'); break;
      case 'antler': for (const [dx, dy] of [[0, -1], [0, -2], [-1, -3], [1, -3], [-2, -3], [2, -4], [-1, -4]]) G.put(hl + dx, ht + dy, 'a'); break;
      case 'bull': G.put(hl - 1, ht, 'a'); G.put(hl - 1, ht - 1, 'a'); G.put(hr + 1, ht - 1, 'a'); break;
      case 'rhino': G.put(hr + (o.snout || 0), ht - 1, 'a'); G.put(hr + (o.snout || 0), ht - 2, 'a'); G.put(hr - 1 + (o.snout || 0), ht, 'a'); break;
      case 'tusk': G.put(hr + (o.snout || 0), ht + hh, 'a'); break;
    }
    if (o.trunk) for (let i = 1; i <= o.trunk; i++) G.put(hr + 1 + (i > o.trunk - 1 ? 1 : 0), ht + i, 'h');
    if (o.tusks) { G.put(hr + 1, ht + hh, 'a'); G.put(hr + 2, ht + hh, 'a'); }
    if (o.mane) { for (let y = -1; y <= hh; y++) G.put(hl - 1, ht + y, 'm', true); for (let x = 0; x < hw - 1; x++) G.put(hl + x, ht - 1, 'm', true); }
    if (o.beard) G.put(hr - 1, ht + hh, 'm');
    // tail
    const tl = o.tail == null ? 2 : o.tail;
    for (let i = 1; i <= tl; i++) {
      const ty = o.tailUp ? -Math.floor(i / 2) : o.tailFlat ? 0 : Math.min(H - 1 + (o.tailLong ? i : 0), i - 1);
      G.put(-i, ty, i === tl && o.tuft ? 'k' : 't');
    }
    if (o.bigTail) for (let i = 1; i <= tl; i++) G.put(-i, -1 - Math.floor(i / 2), 't');
    return [G.rows()];
  }

  // Standing / walking bird (ostrich, flamingo, chicken, peacock...)
  function gbird(o) {
    const G = grid();
    const L = o.L, H = o.H || 2, leg = o.leg || 2, neck = o.neck || 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < L; x++) {
      if (H >= 3 && (y === 0 || y === H - 1) && (x === 0 || x === L - 1)) continue;
      G.put(x, y, y === 0 && x > 0 && x < L - 1 && o.wing ? 'w' : 'b');
    }
    const lx = Math.floor(L / 2);
    for (let i = 1; i <= leg; i++) { G.put(lx, H - 1 + i, 'k'); if (L > 4) G.put(lx - 1, H - 1 + i, i === leg ? 'k' : '.'); }
    let nx = L - 1, ny = 0;
    for (let i = 1; i <= neck; i++) { nx = L - 1 + (i > neck * 0.6 ? 1 : 0); ny = -i; G.put(nx, ny, 'n'); }
    if (o.sneck) { G.put(L, -1, 'n'); G.put(L + 1, -2, 'n'); G.put(L, -3, 'n'); G.put(L, -4, 'n'); nx = L; ny = -4; }
    const hx = nx, hy = ny - 1;
    G.put(hx, hy, 'h'); G.put(hx + 1, hy, 'h');
    G.put(hx + 1, hy, 'e');
    for (let i = 1; i <= (o.beak || 1); i++) G.put(hx + 1 + i, hy + (o.droop && i > 1 ? 1 : 0), 'y');
    if (o.comb) { G.put(hx, hy - 1, 'c'); G.put(hx + 1, hy - 1, 'c'); G.put(hx + 2, hy + 1, 'c'); }
    if (o.crest) { G.put(hx, hy - 1, 'c'); G.put(hx - 1, hy - 2, 'c'); }
    const tl = o.tail || 1;
    for (let i = 1; i <= tl; i++) G.put(-i, o.fan ? -i + 1 : 0, 't');
    if (o.fan) for (let i = 1; i <= tl; i++) for (let j = -1; j <= i; j++) G.put(-i, -j, (i + j) % 3 === 0 ? 'f' : 't');
    return [G.rows()];
  }

  // Default palette letters for generated sprites
  function P(b, extra = {}) {
    const dark = (f) => U.mixHex(b, '#000000', f);
    return Object.assign({ b, h: b, t: b, d: dark(0.15), k: dark(0.6), n: dark(0.55), e: '#111111', w: U.mixHex(b, '#ffffff', 0.45), a: '#e8dcc0', m: dark(0.45), s: dark(0.5), r: dark(0.2) }, extra);
  }
  const BP = (b, w, extra = {}) => Object.assign({ b, t: U.mixHex(b, '#000000', 0.3), w, e: '#111111', y: '#e8b030', k: '#c89a50' }, extra);

  let CAT = 'mammal';
  const D = (id, o) => def(id, Object.assign({ cat: CAT }, o));

  const GRAZE = ['GRASS', 'TALLGRASS', 'PLANT', 'FLOWER', 'DRYGRASS'];
  const BROWSE = ['LEAF', 'AUTUMN', 'BLOSSOM', 'BERRY', 'VINE', 'PLANT'];
  const FRUIT = ['BERRY', 'FLOWER', 'BLOSSOM', 'LEAF', 'AUTUMN'];
  const BUGS = ['butterfly', 'morpho', 'moth', 'dragonfly', 'beetle', 'grasshopper', 'cricket', 'fly', 'mosquito', 'bee', 'caterpillar', 'aphid', 'firefly', 'termite', 'ant', 'ladybug', 'snail', 'slug', 'worm'];
  const SMALLFISH = ['smallfish', 'sardine', 'anchovy', 'cod', 'clownfish', 'angelfish', 'butterflyfish', 'tang', 'lanternfish', 'shrimp', 'trout', 'minnow', 'mackerel'];

  // ======================================================== MAMMALS
  CAT = 'mammal';
  // savanna
  D('lion', { name: 'Lion', art: quad({ L: 10, H: 4, leg: 3, head: [3, 3], mane: true, tail: 5, tuft: true, belly: true }), pal: P('#c8963e', { m: '#7a4a1e', w: '#e0c080' }), speed: 0.7, prey: ['zebra', 'gazelle', 'warthog', 'wildebeest', 'buffalo'], max: 4, breed: 0.004, metab: 1 / 240, sense: 60, nocturnal: true, life: 900 });
  D('zebra', { name: 'Zebra', art: quad({ L: 10, H: 4, leg: 3, neck: 3, slope: 0.6, head: [3, 2], snout: 1, ears: 'up', stripes: true, mane: true, tail: 3, tuft: true }), pal: P('#f0f0ec', { s: '#1a1a1a', m: '#1a1a1a', k: '#1a1a1a', n: '#2a2a2a' }), speed: 0.55, eats: GRAZE, max: 10, breed: 0.006, step: 2 });
  D('giraffe', { name: 'Giraffe', art: quad({ L: 8, H: 4, leg: 6, neck: 9, slope: 0.35, head: [3, 2], snout: 1, horns: 'small', spots: true, tail: 3, tuft: true }), pal: P('#e8b45a', { s: '#8a4a1a', a: '#6a3a1a' }), speed: 0.35, eats: ['LEAF', 'BLOSSOM', 'AUTUMN', 'NEEDLE'], reach: 22, max: 5, breed: 0.003, step: 3, life: 1200 });
  D('elephant', { name: 'Elephant', art: quad({ L: 13, H: 7, leg: 4, head: [4, 5], headDy: -2, trunk: 5, ears: 'big', tusks: true, tail: 3, headIn: false }), pal: P('#8a8a8e', { r: '#7a7a80', a: '#f4f0e0' }), speed: 0.25, eats: ['LEAF', 'AUTUMN', 'GRASS', 'TALLGRASS', 'PLANT', 'BERRY', 'DRYGRASS'], reach: 14, max: 5, breed: 0.002, step: 3, life: 2000, food: 0.06 });
  D('hippo', { name: 'Hippo', hab: 'amph', art: quad({ L: 11, H: 5, leg: 2, head: [4, 3], snout: 2, ears: 'up', tail: 1 }), pal: P('#7a6a7a', { n: '#c890a0' }), speed: 0.25, eats: GRAZE, max: 4, breed: 0.003, life: 1200 });
  D('rhino', { name: 'Rhino', art: quad({ L: 11, H: 5, leg: 3, head: [4, 3], snout: 1, horns: 'rhino', ears: 'up', tail: 2 }), pal: P('#8a8680'), speed: 0.35, eats: GRAZE, max: 4, breed: 0.002, step: 2, life: 1500 });
  D('cheetah', { name: 'Cheetah', art: quad({ L: 9, H: 3, leg: 3, head: [2, 2], spots: true, tail: 5, ears: 'up', belly: true }), pal: P('#e0b050', { s: '#2a1a0a', w: '#f4e0b0' }), speed: 1.1, prey: ['gazelle', 'warthog', 'meerkat', 'hare'], max: 3, breed: 0.004, metab: 1 / 200 });
  D('hyena', { name: 'Hyena', art: quad({ L: 8, H: 4, leg: 3, head: [3, 2], snout: 1, ears: 'up', spots: true, tail: 2, saddle: true }), pal: P('#a89470', { s: '#4a3a2a' }), speed: 0.7, prey: ['gazelle', 'meerkat', 'warthog', 'zebra'], max: 6, breed: 0.004, nocturnal: true });
  D('gazelle', { name: 'Gazelle', art: quad({ L: 7, H: 3, leg: 3, neck: 2, head: [2, 2], horns: 'long', belly: true, tail: 1 }), pal: P('#c88a4a', { w: '#f4ece0', a: '#3a2a1a' }), speed: 0.8, jumpy: true, eats: GRAZE, max: 12, breed: 0.008, step: 2 });
  D('wildebeest', { name: 'Wildebeest', art: quad({ L: 9, H: 4, leg: 3, head: [3, 3], horns: 'bull', mane: true, beard: true, tail: 3, tuft: true }), pal: P('#5a5a62', { m: '#2a2a2e', a: '#2a2a2a' }), speed: 0.5, eats: GRAZE, max: 14, breed: 0.006, step: 2 });
  D('buffalo', { name: 'Cape buffalo', art: quad({ L: 11, H: 5, leg: 3, head: [3, 3], horns: 'bull', tail: 3, tuft: true }), pal: P('#3a3230', { a: '#6a6258' }), speed: 0.4, eats: GRAZE, max: 6, breed: 0.004, step: 2 });
  D('warthog', { name: 'Warthog', art: quad({ L: 7, H: 3, leg: 2, head: [3, 2], snout: 1, horns: 'tusk', mane: true, tail: 3, tailUp: true }), pal: P('#7a6a5a', { a: '#f0e8d8' }), speed: 0.55, eats: ['GRASS', 'TALLGRASS', 'PLANT', 'DRYGRASS', 'FUNGUS'], max: 8, breed: 0.008 });
  D('meerkat', { name: 'Meerkat', art: [['.be', '.bb', 'bb.', '.b.', 'k.k']], pal: { b: '#c8a878', e: '#111', k: '#6a5030' }, speed: 0.5, prey: ['beetle', 'scorpion', 'grasshopper', 'termite', 'cricket'], max: 12, breed: 0.012, idle: 0.6 });
  // temperate & farm
  D('horse', { name: 'Horse', art: quad({ L: 10, H: 4, leg: 4, neck: 3, slope: 0.6, head: [3, 2], snout: 1, ears: 'up', mane: true, tail: 4, tailLong: true }), pal: P('#8a5a3a', { m: '#2a1a10', t: '#2a1a10' }), variants: { b: ['#8a5a3a', '#e8e0d0', '#3a2a20', '#a87a4a', '#6a6a6a'], h: ['#8a5a3a', '#e8e0d0', '#3a2a20', '#a87a4a'] }, speed: 0.65, eats: GRAZE, max: 8, breed: 0.005, step: 2 });
  D('cow', { name: 'Cow', art: quad({ L: 10, H: 5, leg: 3, head: [3, 3], horns: 'small', ears: 'up', spots: true, tail: 3, tuft: true }), pal: P('#f0f0ec', { s: '#2a2a2a', n: '#e0a0a0', a: '#e8e0c8' }), speed: 0.3, eats: GRAZE, max: 8, breed: 0.004, step: 2, idle: 0.6 });
  D('sheep', { name: 'Sheep', art: quad({ L: 6, H: 4, leg: 2, head: [2, 2], headDy: 0, ears: 'up', tail: 1 }), pal: P('#f0ece0', { h: '#2a2a2a', d: '#2a2a2a', k: '#1a1a1a', n: '#3a3a3a', r: '#2a2a2a' }), speed: 0.3, eats: GRAZE, max: 12, breed: 0.008, idle: 0.6 });
  D('pig', { name: 'Pig', art: quad({ L: 7, H: 4, leg: 1, head: [3, 3], headDy: 0, snout: 1, ears: 'up', tail: 1, tailUp: true }), pal: P('#f0b0b0', { n: '#e08a8a' }), speed: 0.3, eats: ['GRASS', 'PLANT', 'FUNGUS', 'BERRY', 'LITTER'], max: 8, breed: 0.008, idle: 0.5 });
  D('goatfarm', { name: 'Goat', art: quad({ L: 6, H: 3, leg: 2, head: [2, 2], horns: 'curve', beard: true, tail: 1, tailUp: true }), pal: P('#c8b8a0', { a: '#6a5a4a', m: '#e8e0d0' }), speed: 0.45, jumpy: true, eats: GRAZE.concat(['LEAF']), max: 10, breed: 0.008, step: 2 });
  D('boar', { name: 'Wild boar', art: quad({ L: 8, H: 4, leg: 2, head: [3, 2], snout: 1, horns: 'tusk', mane: true, tail: 1 }), pal: P('#4a3a2e'), speed: 0.55, eats: ['FUNGUS', 'BERRY', 'PLANT', 'LITTER', 'GRASS'], prey: ['worm', 'snail', 'beetle'], max: 6, breed: 0.006 });
  D('elk', { name: 'Elk', art: quad({ L: 10, H: 4, leg: 4, neck: 3, slope: 0.6, head: [3, 2], snout: 1, horns: 'antler', tail: 1, mane: true }), pal: P('#8a6040', { m: '#4a3020', a: '#d8c8a8' }), speed: 0.45, eats: GRAZE.concat(['LEAF', 'AUTUMN']), max: 6, breed: 0.004, step: 2 });
  D('raccoon', { name: 'Raccoon', art: quad({ L: 5, H: 3, leg: 1, head: [2, 2], ears: 'up', stripes: true, tail: 3, bigTail: false }), pal: P('#8a8a8a', { s: '#8a8a8a', t: '#3a3a3a', h: '#d8d8d8', e: '#111', r: '#3a3a3a' }), speed: 0.45, eats: ['BERRY', 'LITTER', 'FUNGUS'], prey: ['frog', 'crayfish', 'snail'], nocturnal: true, max: 6, breed: 0.008 });
  D('skunk', { name: 'Skunk', art: quad({ L: 5, H: 2, leg: 1, head: [2, 2], saddle: true, tail: 3, tailUp: true }), pal: P('#1e1e22', { s: '#f0f0f0', t: '#f0f0f0' }), speed: 0.35, eats: ['BERRY', 'LITTER'], prey: ['beetle', 'worm', 'grasshopper'], nocturnal: true, max: 5, breed: 0.008 });
  D('hedgehog', { name: 'Hedgehog', art: [['.sss..', 'sssssb', 'ssssbe', '.k..kn']], pal: { s: '#6a5040', b: '#c8a888', e: '#111', n: '#111', k: '#4a3a2a' }, speed: 0.25, prey: ['beetle', 'worm', 'snail', 'slug', 'caterpillar'], nocturnal: true, max: 8, breed: 0.008 });
  D('badger', { name: 'Badger', art: quad({ L: 7, H: 3, leg: 1, head: [3, 2], snout: 1, stripes: false, saddle: true, tail: 1 }), pal: P('#5a5a5e', { s: '#3a3a3a', h: '#f0f0f0', e: '#111' }), speed: 0.35, prey: ['worm', 'beetle', 'mouse', 'snail'], eats: ['BERRY', 'FUNGUS'], nocturnal: true, max: 4, breed: 0.005, digs: true });
  D('beaver', { name: 'Beaver', hab: 'amph', art: quad({ L: 6, H: 3, leg: 1, head: [2, 2], tail: 3, tailFlat: true }), pal: P('#7a4a2a', { t: '#3a2a20', n: '#f0e8c0' }), speed: 0.35, eats: ['WOOD', 'BIRCH', 'LEAF', 'PLANT'], max: 6, breed: 0.006 });
  D('otter', { name: 'Otter', hab: 'amph', art: quad({ L: 7, H: 2, leg: 1, head: [2, 2], tail: 3, belly: true }), pal: P('#6a4a30', { w: '#c8a888' }), speed: 0.55, prey: ['smallfish', 'trout', 'minnow', 'crayfish', 'frog'], max: 6, breed: 0.006 });
  D('lynx', { name: 'Lynx', art: quad({ L: 7, H: 3, leg: 3, head: [3, 2], ears: 'up', spots: true, tail: 1 }), pal: P('#b89a7a', { s: '#6a5040', r: '#1a1a1a' }), speed: 0.75, prey: ['snowhare', 'rabbit', 'hare', 'mouse', 'squirrel', 'grouse'], max: 3, breed: 0.004, nocturnal: true });
  D('coyote', { name: 'Coyote', art: quad({ L: 8, H: 3, leg: 3, head: [3, 2], snout: 1, ears: 'up', tail: 3, belly: true }), pal: P('#a88a68', { w: '#d8c8a8' }), speed: 0.75, prey: ['rabbit', 'jackrabbit', 'mouse', 'lizard', 'roadrunner', 'hare'], max: 4, breed: 0.005, nocturnal: true });
  D('hare', { name: 'Hare', art: quad({ L: 5, H: 3, leg: 2, head: [2, 2], ears: 'long', tail: 1 }), pal: P('#a8845a'), speed: 0.75, jumpy: true, eats: GRAZE, max: 12, breed: 0.02, life: 240, mature: 30 });
  D('jackrabbit', { name: 'Jackrabbit', art: quad({ L: 5, H: 3, leg: 2, head: [2, 2], ears: 'long', tail: 1 }), pal: P('#b8a07a', { r: '#3a2a1a' }), speed: 0.8, jumpy: true, eats: ['DRYGRASS', 'PLANT', 'CACTUS', 'TALLGRASS'], max: 10, breed: 0.015 });
  D('fennec', { name: 'Fennec fox', art: quad({ L: 5, H: 2, leg: 2, head: [2, 2], ears: 'fennec', tail: 3, belly: true }), pal: P('#e8cc98', { r: '#d8a878' }), speed: 0.7, prey: ['beetle', 'lizard', 'mouse', 'grasshopper', 'scorpion'], nocturnal: true, max: 5, breed: 0.006 });
  D('chipmunk', { name: 'Chipmunk', hab: 'climb', climbVeg: true, art: [['t...', 't.be', 'tsss', '.k.k']], pal: { t: '#8a5a2a', s: '#a87a4a', b: '#a87a4a', e: '#111', k: '#5a3a1a' }, speed: 0.75, eats: ['BERRY', 'SEED', 'LITTER', 'FLOWER'], max: 10, breed: 0.01 });
  D('mole', { name: 'Mole', hab: 'burrow', art: [['.bbbn', 'bbbbb']], pal: { b: '#3a3236', n: '#e0a0a0' }, speed: 0.3, prey: ['worm', 'earthworm', 'termite'], max: 6, breed: 0.006 });
  D('bear2', { name: 'Black bear', hab: 'amph', art: quad({ L: 9, H: 5, leg: 2, head: [3, 3], snout: 1, ears: 'up', tail: 1 }), pal: P('#2a2426', { n: '#a88a6a' }), speed: 0.4, eats: ['BERRY', 'FUNGUS', 'PLANT', 'FLOWER'], prey: ['salmon', 'trout', 'smallfish', 'bee'], max: 2, breed: 0.003, metab: 1 / 220, life: 800 });
  // cold
  D('muskox', { name: 'Musk ox', art: quad({ L: 9, H: 5, leg: 2, head: [3, 3], horns: 'curve', mane: true, tail: 1 }), pal: P('#4a3a30', { m: '#2a2018', a: '#d8c8a8', d: '#d8d0c0' }), speed: 0.3, eats: ['GRASS', 'PLANT', 'NEEDLE', 'SNOW', 'DRYGRASS'], max: 8, breed: 0.004 });
  D('wolverine', { name: 'Wolverine', art: quad({ L: 6, H: 3, leg: 1, head: [2, 2], saddle: true, tail: 2 }), pal: P('#3a2a20', { s: '#a87a4a' }), speed: 0.6, prey: ['snowhare', 'lemming', 'ptarmigan', 'mouse'], max: 3, breed: 0.004 });
  D('walrus', { name: 'Walrus', hab: 'amph', art: [['.......bbe.', '.bbbbbbbbbb', 'bbbbbbbbbbm', 't......b.a.', '.........a.']], pal: { b: '#9a6a5a', e: '#111', m: '#c8a090', t: '#7a5a4a', a: '#f4f0e0' }, speed: 0.25, prey: ['clam', 'crab', 'cod', 'starfish'], max: 6, breed: 0.003 });
  D('snowleopard', { name: 'Snow leopard', art: quad({ L: 8, H: 3, leg: 2, head: [2, 2], spots: true, tail: 6, tailUp: false, ears: 'up' }), pal: P('#d8d4cc', { s: '#6a6a6a' }), speed: 0.8, step: 3, prey: ['goat', 'ibex', 'marmot', 'yak', 'hare', 'pika'], max: 2, breed: 0.003, metab: 1 / 220 });
  D('yak', { name: 'Yak', art: quad({ L: 9, H: 5, leg: 2, head: [3, 3], horns: 'bull', mane: true, hump: 1, tail: 3 }), pal: P('#2e2620', { m: '#1a1612', a: '#e8e0d0', d: '#2a2420' }), speed: 0.3, step: 3, eats: GRAZE.concat(['SNOW']), max: 6, breed: 0.004 });
  D('ibex', { name: 'Ibex', art: quad({ L: 7, H: 3, leg: 2, head: [2, 2], horns: 'long', beard: true, tail: 1 }), pal: P('#9a8060', { a: '#5a4a3a', m: '#5a4a3a' }), speed: 0.5, step: 4, jumpy: true, eats: GRAZE, max: 8, breed: 0.006 });
  D('pika', { name: 'Pika', art: [['.ke', 'bbb', 'k.k']], pal: { b: '#a89078', k: '#6a5a4a', e: '#111' }, speed: 0.5, eats: GRAZE, max: 10, breed: 0.015 });
  D('lemming', { name: 'Lemming', art: [['.be', 'sbb']], pal: { b: '#c8a070', s: '#3a2a1a', e: '#111' }, speed: 0.5, eats: GRAZE.concat(['NEEDLE']), max: 16, breed: 0.025, life: 150, mature: 20 });
  // jungle & elsewhere
  D('gorilla', { name: 'Gorilla', art: [['....bb.', '...bhhe', '.bbbbhn', 'bbbbbb.', 'bbbbbbb', 'b.bbb.b', '.bb.bb.']], pal: { b: '#2a2a2e', h: '#3e3e44', e: '#111', n: '#4a4a50' }, speed: 0.3, eats: ['LEAF', 'BAMBOO', 'BERRY', 'VINE', 'PLANT'], max: 4, breed: 0.003, idle: 0.6, life: 1200 });
  D('orangutan', { name: 'Orangutan', hab: 'climb', climbVeg: true, art: [['.bb..', 'bfeb.', 'bbbbb', 'b.b.b', 'b...b']], pal: { b: '#c8601a', f: '#e8a878', e: '#111' }, speed: 0.4, eats: ['BERRY', 'LEAF', 'BLOSSOM', 'VINE'], max: 4, breed: 0.004 });
  D('sloth', { name: 'Sloth', hab: 'climb', climbVeg: true, art: [['.bbb.', 'bfebb', 'bbbbb', 'k...k']], pal: { b: '#8a7a5a', f: '#d8c8a0', e: '#111', k: '#3a3020' }, speed: 0.05, eats: ['LEAF', 'VINE'], max: 6, breed: 0.004, idle: 0.8, metab: 1 / 600 });
  D('tapir', { name: 'Tapir', hab: 'amph', art: quad({ L: 8, H: 4, leg: 2, head: [3, 2], snout: 2, ears: 'up', saddle: true, tail: 1 }), pal: P('#2a2a2e', { s: '#e8e8e8', b: '#2a2a2e' }), speed: 0.35, eats: ['LEAF', 'PLANT', 'BERRY', 'GRASS'], max: 4, breed: 0.004 });
  D('panda', { name: 'Giant panda', art: quad({ L: 7, H: 4, leg: 2, head: [3, 3], headDy: -1, ears: 'up', saddle: true, tail: 1 }), pal: P('#f4f4f0', { s: '#1a1a1a', d: '#1a1a1a', k: '#1a1a1a', r: '#1a1a1a', e: '#1a1a1a' }), speed: 0.25, eats: ['BAMBOO', 'LEAF'], max: 4, breed: 0.003, idle: 0.6 });
  D('redpanda', { name: 'Red panda', hab: 'climb', climbVeg: true, art: [['ttt.r.', 't..bbe', 'tsbbbn', '..k.k.']], pal: { t: '#a84a1a', b: '#c8581e', s: '#3a1a10', r: '#f0f0f0', e: '#111', n: '#111', k: '#2a1a10' }, speed: 0.45, eats: ['BAMBOO', 'BERRY', 'LEAF'], max: 6, breed: 0.006 });
  D('anteater', { name: 'Anteater', art: quad({ L: 8, H: 4, leg: 2, head: [2, 1], headDy: 1, snout: 4, saddle: true, tail: 4, bigTail: true }), pal: P('#8a7a6a', { s: '#2a2a2a' }), speed: 0.35, prey: ['ant', 'termite'], eats: ['FUNGUS'], max: 3, breed: 0.004 });
  D('armadillo', { name: 'Armadillo', art: [['.sss..', 'sssssh', 'sssshe', 'tk..kn']], pal: { s: '#a89480', h: '#c8b0a0', e: '#111', n: '#8a7a6a', k: '#6a5a4a', t: '#a89480' }, speed: 0.3, prey: ['ant', 'termite', 'beetle', 'worm'], max: 6, breed: 0.006, nocturnal: true });
  D('kangaroo', { name: 'Kangaroo', art: [['...rr', '...bbe', '...bbn', '..bbb.', '.bbbb.', 'tbbb..', 't.bb..', 't..kkk']], pal: { b: '#b87a4a', r: '#a86a3a', e: '#111', n: '#3a2a1a', t: '#a86a3a', k: '#5a3a1a' }, speed: 0.8, jumpy: true, eats: GRAZE, max: 8, breed: 0.005, step: 2 });
  D('koala', { name: 'Koala', hab: 'climb', climbVeg: true, art: [['r..r', 'rbbr', 'bebb', 'bbnb', 'b..b']], pal: { b: '#9a9a9e', r: '#c8c8cc', e: '#111', n: '#2a2a2a' }, speed: 0.1, eats: ['LEAF'], max: 6, breed: 0.004, idle: 0.85, metab: 1 / 500 });
  D('capuchin', { name: 'Capuchin', hab: 'climb', climbVeg: true, art: [['.ff.', '.fe.', 'bbbb', 'tbb.', 't..b']], pal: { b: '#3a2a20', f: '#f0e0c8', e: '#111', t: '#3a2a20' }, speed: 0.7, eats: ['BERRY', 'BLOSSOM', 'FLOWER', 'LEAF'], prey: ['beetle', 'grasshopper'], max: 10, breed: 0.007 });

  // ======================================================== BIRDS
  CAT = 'bird';
  const BIRDS = [
    ['robin', 'Robin', 5, BP('#6a5a4a', '#5a4a3a', { b: '#c8582a', t: '#4a3a2a', w: '#5a4a3a', y: '#e8a020' }), { prey: ['worm', 'earthworm', 'caterpillar', 'beetle'], eats: ['BERRY'], perches: 0.6 }],
    ['bluejay', 'Blue jay', 6, BP('#3a6ad8', '#2a4aa8', { t: '#2a3a8a', y: '#2a2a2a' }), { eats: ['BERRY', 'SEED'], prey: ['caterpillar', 'beetle'], perches: 0.6 }],
    ['cardinal', 'Cardinal', 5, BP('#d82a2a', '#a81a1a', { t: '#a81a1a', y: '#f0a020', e: '#111' }), { eats: ['SEED', 'BERRY'], perches: 0.6 }],
    ['sparrow', 'Sparrow', 4, BP('#9a7a5a', '#6a4a30', { y: '#6a5a4a' }), { eats: ['SEED', 'LITTER'], prey: ['aphid', 'fly'], perches: 0.7, max: 16, breed: 0.012 }],
    ['swallow', 'Swallow', 6, BP('#1a2a5a', '#2a3a6a', { t: '#1a1a3a', y: '#1a1a1a', e: '#e85a2a' }), { prey: ['fly', 'mosquito', 'moth', 'bee', 'dragonfly'], speed: 1.2, perches: 0.2 }],
    ['goldfinch', 'Goldfinch', 4, BP('#f0d020', '#1a1a1a', { t: '#1a1a1a', y: '#e8a060' }), { eats: ['SEED', 'FLOWER'], sip: true, perches: 0.6 }],
    ['bluebird', 'Bluebird', 4, BP('#4a8ae0', '#3a6ab8', { y: '#2a2a2a' }), { prey: ['grasshopper', 'caterpillar', 'cricket'], eats: ['BERRY'], perches: 0.6 }],
    ['woodpecker', 'Woodpecker', 6, BP('#1a1a1a', '#f0f0f0', { e: '#d82a2a', y: '#5a5a5a' }), { prey: ['beetle', 'termite', 'ant', 'caterpillar'], perches: 0.8 }],
    ['magpie', 'Magpie', 7, BP('#1a1a22', '#f0f0f0', { t: '#2a3a6a', y: '#1a1a1a' }), { eats: ['LITTER', 'BERRY', 'SEED'], prey: ['beetle', 'worm'], perches: 0.6 }],
    ['kingfisher', 'Kingfisher', 5, BP('#1a8ac8', '#e87a2a', { t: '#1a6aa8', y: '#1a1a1a' }), { prey: ['smallfish', 'minnow', 'trout', 'shrimp'], dives: true, perches: 0.6 }],
    ['hummingbird', 'Hummingbird', 3, BP('#2ab06a', '#1a8a5a', { e: '#d82a6a', y: '#1a1a1a' }), { eats: ['FLOWER', 'BLOSSOM'], sip: true, flutter: true, speed: 1, perches: 0.3 }],
    ['hawk', 'Red-tailed hawk', 9, BP('#7a4a2a', '#a8784a', { t: '#c84a2a', e: '#f0c020', y: '#f0c020' }), { high: true, prey: ['mouse', 'rabbit', 'squirrel', 'chipmunk', 'snake', 'hare', 'lemming', 'jackrabbit'], dives: true, perches: 0.3, max: 3, breed: 0.003, speed: 1, metab: 1 / 240 }],
    ['falcon', 'Peregrine falcon', 7, BP('#4a5a6a', '#3a4a5a', { y: '#f0c020' }), { high: true, prey: ['pigeon', 'sparrow', 'songbird', 'starling', 'dove'], speed: 1.5, max: 2, breed: 0.003 }],
    ['condor', 'Condor', 12, BP('#1a1a1a', '#e8e8e8', { e: '#e8a0a0', y: '#d8c0b0' }), { high: true, eats: ['LITTER'], prey: ['mouse', 'lizard'], speed: 0.6, perches: 0.2, max: 2, breed: 0.002, metab: 1 / 400 }],
    ['albatross', 'Albatross', 12, BP('#f4f4f4', '#3a3a3a', { t: '#3a3a3a', y: '#f0c0a0' }), { prey: ['squid', 'smallfish', 'sardine', 'anchovy'], dives: true, speed: 0.9, perches: 0.1, max: 3, breed: 0.002 }],
    ['pelican', 'Pelican', 9, BP('#f0f0ea', '#c8c8c0', { y: '#f0b040', e: '#111' }), { prey: ['smallfish', 'sardine', 'anchovy', 'mackerel'], dives: true, perches: 0.4, max: 4 }],
    ['puffin', 'Puffin', 4, BP('#1a1a1a', '#f0f0f0', { y: '#f06a1a' }), { prey: ['sardine', 'smallfish', 'anchovy', 'cod'], dives: true, perches: 0.5, max: 10 }],
    ['macaw', 'Macaw', 7, BP('#2a7ae8', '#f0c020', { t: '#2a7ae8', y: '#2a2a2a' }), { eats: ['BERRY', 'BLOSSOM', 'FLOWER'], sip: true, perches: 0.6 }],
    ['scarletmacaw', 'Scarlet macaw', 7, BP('#e82a2a', '#2a7ae8', { t: '#e82a2a', w: '#f0c020', y: '#f0f0f0' }), { eats: ['BERRY', 'BLOSSOM', 'FLOWER'], sip: true, perches: 0.6 }],
    ['hornbill', 'Hornbill', 8, BP('#1a1a1a', '#f0f0f0', { y: '#f0b020' }), { eats: ['BERRY', 'FLOWER'], prey: ['lizard', 'beetle'], perches: 0.6, max: 4 }],
    ['cockatoo', 'Cockatoo', 6, BP('#f4f4f4', '#f0f0e8', { e: '#111', y: '#3a3a3a', t: '#f0e070' }), { eats: ['SEED', 'BERRY', 'FLOWER'], perches: 0.6 }],
    ['stork', 'Stork', 10, BP('#f0f0f0', '#1a1a1a', { y: '#e84a2a', k: '#e84a2a' }), { prey: ['frog', 'smallfish', 'grasshopper', 'mouse', 'snake'], dives: true, perches: 0.4, max: 4 }],
    ['egret', 'Egret', 8, BP('#ffffff', '#f0f0f0', { y: '#f0c020', k: '#1a1a1a' }), { prey: ['smallfish', 'frog', 'minnow', 'shrimp', 'crayfish'], dives: true, perches: 0.6, max: 5 }],
    ['starling', 'Starling', 4, BP('#2a2a3a', '#3a3a5a', { y: '#f0c020' }), { eats: ['SEED', 'BERRY'], prey: ['grasshopper', 'fly'], perches: 0.5, max: 18, breed: 0.012 }],
    ['dove', 'Dove', 5, BP('#e0dcd8', '#c8c0b8', { y: '#d88a8a' }), { eats: ['SEED'], perches: 0.6 }],
    ['grouse', 'Grouse', 6, BP('#7a5a3a', '#5a4030', { y: '#3a3a3a', e: '#e83a2a' }), { eats: ['BERRY', 'NEEDLE', 'SEED'], perches: 0.8, max: 8 }],
    ['raven', 'Raven', 8, BP('#121218', '#1e1e26', { y: '#1a1a1a', e: '#8a8a8a' }), { eats: ['LITTER'], prey: ['mouse', 'beetle', 'lemming'], perches: 0.5, max: 6 }],
    ['vulture2', 'Lappet vulture', 11, BP('#4a3a30', '#e8e0d8', { e: '#e86a6a', y: '#c8b0a0' }), { high: true, eats: ['LITTER'], prey: ['mouse', 'meerkat'], perches: 0.3, max: 3, metab: 1 / 400 }],
  ];
  for (const [id, name, L, pal, o] of BIRDS) D(id, Object.assign({ name, hab: 'air', art: bird(L, { thick: L >= 8 ? 2 : 1 }), pal, speed: 0.8, max: 10, breed: 0.008 }, o));
  // swimming birds
  D('swan', { name: 'Swan', hab: 'amph', floats: true, art: [['.....bb', '.....by', '.....b.', 'bbbbbb.', '.bbbb..']], pal: { b: '#f8f8f8', y: '#f06a1a' }, speed: 0.25, eats: ['SEAWEED', 'LILY', 'PLANT', 'GRASS'], max: 6, breed: 0.004 });
  D('blackswan', { name: 'Black swan', hab: 'amph', floats: true, art: [['.....bb', '.....by', '.....b.', 'bbbbbb.', '.bbbb..']], pal: { b: '#1e1e22', y: '#e82a2a' }, speed: 0.25, eats: ['SEAWEED', 'LILY', 'PLANT'], max: 4, breed: 0.004 });
  D('goose', { name: 'Canada goose', hab: 'amph', floats: true, art: [['....hh', '....hey', '....n.', 'wbbbb.', '.bbb..']], pal: { h: '#1a1a1a', e: '#f0f0f0', y: '#1a1a1a', n: '#1a1a1a', b: '#8a7a6a', w: '#f0f0f0' }, speed: 0.3, eats: ['GRASS', 'SEAWEED', 'PLANT', 'TALLGRASS'], max: 10, breed: 0.006 });
  D('loon', { name: 'Loon', hab: 'amph', floats: true, art: [['....hh.', '....hey', 'wbsbsb.', '.bbbb..']], pal: { h: '#1a2a2a', e: '#e82a2a', y: '#1a1a1a', b: '#1a1a1a', s: '#f0f0f0', w: '#1a1a1a' }, speed: 0.3, prey: ['smallfish', 'minnow', 'trout'], max: 4, breed: 0.004 });
  // walking birds
  D('ostrich', { name: 'Ostrich', art: gbird({ L: 6, H: 3, leg: 5, neck: 5, tail: 2, beak: 1, wing: true }), pal: { b: '#2a2a2a', w: '#f0f0f0', t: '#f0f0f0', n: '#e8b0a0', h: '#e8b0a0', e: '#111', y: '#e8c890', k: '#e8b0a0' }, speed: 0.9, eats: GRAZE.concat(['SEED']), max: 6, breed: 0.004, step: 2 });
  D('emu', { name: 'Emu', art: gbird({ L: 6, H: 3, leg: 4, neck: 4, tail: 2, beak: 1 }), pal: { b: '#5a4a3a', w: '#5a4a3a', t: '#4a3a2a', n: '#3a3a5a', h: '#3a3a5a', e: '#e8a020', y: '#3a3a3a', k: '#5a5a5a' }, speed: 0.85, eats: GRAZE.concat(['BERRY']), max: 6, breed: 0.004, step: 2 });
  D('flamingo', { name: 'Flamingo', waterOk: true, art: gbird({ L: 5, H: 2, leg: 6, sneck: true, tail: 1, beak: 2, droop: true }), pal: { b: '#f88aa8', w: '#f8a0b8', t: '#e86a8a', n: '#f88aa8', h: '#f88aa8', e: '#111', y: '#1a1a1a', k: '#e86a8a' }, speed: 0.3, eats: ['SEAWEED', 'KELP'], prey: ['shrimp'], max: 14, breed: 0.006, idle: 0.6 });
  D('heronstand', { name: 'Great blue heron', waterOk: true, art: gbird({ L: 5, H: 2, leg: 5, sneck: true, tail: 1, beak: 3, crest: true }), pal: { b: '#7a8aa0', w: '#9aa8b8', t: '#5a6a80', n: '#c8d0d8', h: '#f0f0f0', c: '#1a1a1a', e: '#111', y: '#e8c020', k: '#6a6a50' }, speed: 0.25, prey: ['smallfish', 'frog', 'minnow', 'crayfish'], max: 3, breed: 0.003, idle: 0.6 });
  D('chicken', { name: 'Chicken', art: gbird({ L: 4, H: 3, leg: 1, neck: 1, tail: 2, comb: true }), pal: { b: '#f4f0e8', w: '#e8e0d0', t: '#f4f0e8', n: '#f4f0e8', h: '#f4f0e8', c: '#e02a2a', e: '#111', y: '#f0b020', k: '#f0b020' }, variants: { b: ['#f4f0e8', '#c87a3a', '#3a3a3a'], t: ['#f4f0e8', '#8a4a1a', '#2a2a2a'] }, speed: 0.3, eats: ['SEED', 'GRASS', 'PLANT'], prey: ['worm', 'grasshopper', 'beetle'], max: 12, breed: 0.01, idle: 0.5 });
  D('turkey', { name: 'Wild turkey', art: gbird({ L: 6, H: 3, leg: 2, neck: 2, tail: 4, fan: true, comb: true }), pal: { b: '#4a3a2a', w: '#6a5a3a', t: '#5a4030', f: '#c8a070', n: '#c84a4a', h: '#8ab0d8', c: '#e02a2a', e: '#111', y: '#c8b090', k: '#a87a5a' }, speed: 0.4, eats: ['SEED', 'BERRY', 'GRASS'], prey: ['grasshopper', 'beetle'], max: 8, breed: 0.006 });
  D('peacock', { name: 'Peacock', art: gbird({ L: 5, H: 3, leg: 2, neck: 3, tail: 6, fan: true, crest: true }), pal: { b: '#1a5ac8', w: '#2a6ad8', t: '#2a8a5a', f: '#e8c040', n: '#1a5ac8', h: '#1a5ac8', c: '#1a5ac8', e: '#111', y: '#c8b090', k: '#9a8a7a' }, speed: 0.3, eats: ['SEED', 'BERRY', 'FLOWER'], prey: ['grasshopper'], max: 6, breed: 0.005 });
  D('roadrunner', { name: 'Roadrunner', art: gbird({ L: 5, H: 2, leg: 2, neck: 1, tail: 4, beak: 2, crest: true }), pal: { b: '#7a6a5a', w: '#a89a8a', t: '#4a3a30', n: '#7a6a5a', h: '#7a6a5a', c: '#3a3a3a', e: '#e85a2a', y: '#3a3a3a', k: '#5a5a5a' }, speed: 1.2, prey: ['lizard', 'scorpion', 'grasshopper', 'snake', 'mouse', 'tarantula'], max: 4, breed: 0.006 });
  D('dodo', { name: 'Dodo', art: gbird({ L: 5, H: 3, leg: 1, neck: 1, tail: 1, beak: 2, droop: true }), pal: { b: '#8a8a90', w: '#a8a8ae', t: '#f0f0f0', n: '#8a8a90', h: '#a8a8ae', e: '#111', y: '#e8d080', k: '#e8c060' }, speed: 0.25, eats: ['BERRY', 'SEED', 'PLANT'], max: 8, breed: 0.006, idle: 0.6 });

  // ======================================================== SEA & FRESHWATER
  CAT = 'sea';
  const FP = (b, w, extra = {}) => Object.assign({ b, w, t: U.mixHex(b, '#000000', 0.2), e: '#111111', s: '#ffffff' }, extra);
  const FISH = [
    ['angelfish', 'Angelfish', fish(5, 5, { stripes: [2, 4] }), FP('#f0d040', '#f0d040', { s: '#2a2a2a' }), { speed: 0.3 }],
    ['butterflyfish', 'Butterflyfish', fish(5, 4, { stripes: [4] }), FP('#f8e040', '#f8f0c0', { s: '#1a1a1a' }), { speed: 0.35 }],
    ['tang', 'Blue tang', fish(6, 4), FP('#2a5ae8', '#1a3ab8', { t: '#f0d020' }), { speed: 0.4, school: true }],
    ['parrotfish', 'Parrotfish', fish(8, 4, { stripes: [3, 6] }), FP('#3ac8a8', '#e86aa8', { s: '#f0c040' }), { eats: ['CORAL', 'SEAWEED'], sip: true }],
    ['lionfish', 'Lionfish', [['..s.s.s.', '.bsbsbs.', 'tbsbsbse', '.bsbsbs.', '..s.s.s.']], { b: '#e8a080', s: '#8a2a1a', t: '#e8a080', e: '#111' }, { speed: 0.2, prey: ['smallfish', 'shrimp', 'clownfish'], max: 4 }],
    ['pufferfish', 'Pufferfish', [['..s.s.', '.bbbb.', 'tbbbbe', '.wwww.', '..s.s.']], { b: '#c8b070', w: '#f0e8c8', s: '#6a5a3a', t: '#a89050', e: '#111' }, { speed: 0.2 }],
    ['sardine', 'Sardine', fish(4, 2), FP('#a8c0d8', '#e0e8f0'), { speed: 0.6, school: true, max: 40, breed: 0.015 }],
    ['anchovy', 'Anchovy', fish(4, 2), FP('#88a0b8', '#d0d8e0'), { speed: 0.6, school: true, max: 40, breed: 0.015 }],
    ['mackerel', 'Mackerel', fish(7, 3, { stripes: [2, 4] }), FP('#3a7a8a', '#d8e0e0', { s: '#1a3a4a' }), { speed: 0.7, school: true, prey: ['sardine', 'anchovy', 'shrimp'], max: 20 }],
    ['barracuda', 'Barracuda', fish(12, 3), FP('#8a9aa8', '#d8e0e8'), { speed: 0.9, prey: ['sardine', 'anchovy', 'smallfish', 'mackerel', 'tang', 'butterflyfish'], max: 4, metab: 1 / 200 }],
    ['salmon', 'Salmon', fish(8, 3), FP('#d87a6a', '#e8c0b0', { t: '#8a4a3a' }), { speed: 0.6, school: true, prey: ['shrimp', 'minnow'], max: 12 }],
    ['trout', 'Rainbow trout', fish(7, 3, { stripes: [3, 4] }), FP('#8aa070', '#e8d8c8', { s: '#e88a9a' }), { speed: 0.55, prey: ['mosquito', 'fly', 'minnow', 'shrimp'], max: 10 }],
    ['minnow', 'Minnow', fish(3, 2), FP('#b0b8a0', '#d8dcc8'), { speed: 0.5, school: true, max: 30, breed: 0.02 }],
    ['koi', 'Koi', fish(7, 3, { stripes: [3, 5] }), FP('#f8f8f0', '#f8f8f0', { s: '#f06a1a', t: '#f06a1a' }), { speed: 0.3, eats: ['SEAWEED', 'LILY'], sip: true, max: 10 }],
    ['goldfish', 'Goldfish', fish(5, 3), FP('#f8901a', '#f8b04a'), { speed: 0.3, eats: ['SEAWEED'], sip: true, max: 10 }],
    ['catfish', 'Catfish', [['.bbbbbb..', 'tbbbbbbbe', '.wwwwwwwkk']], { b: '#5a5040', w: '#a89a80', t: '#4a4030', e: '#111', k: '#3a3020' }, { speed: 0.25, bottom: true, eats: ['SEAWEED', 'LITTER'], prey: ['snail', 'shrimp', 'crayfish'], max: 6 }],
    ['pike', 'Pike', fish(11, 3, { stripes: [3, 6, 9] }), FP('#5a7a3a', '#c8d0a0', { s: '#a8b870' }), { speed: 0.8, prey: ['minnow', 'smallfish', 'trout', 'frog', 'duck'], max: 3, metab: 1 / 220 }],
    ['piranha', 'Piranha', fish(5, 4), FP('#7a8a8a', '#e83a2a'), { speed: 0.7, school: true, prey: ['smallfish', 'minnow', 'capybara', 'frog'], max: 16, metab: 1 / 150 }],
    ['anglerfish', 'Anglerfish', [['..y....', '..k....', '.bbbb..', 'bbbbbbe', 'twbwbwb', '.bbbbb.']], { b: '#3a2a2a', k: '#5a4a4a', y: '#e8ff80', w: '#f0f0f0', t: '#2a1a1a', e: '#e8e8a0' }, { speed: 0.15, deep: true, prey: ['lanternfish', 'shrimp', 'smallfish'], glow: '#e8ff80', max: 3 }],
    ['lanternfish', 'Lanternfish', fish(4, 2), FP('#3a4a6a', '#6a8ab0'), { speed: 0.4, deep: true, school: true, glow: '#80d0ff', max: 24 }],
    ['swordfish', 'Swordfish', [['....kk.......', '...kkkk......', 'kkbbbbbbbbebbbb', '...wwwwwww....', 'k.............']], { b: '#3a4a6a', k: '#2a3a5a', w: '#c8d0e0', e: '#111' }, { speed: 1.1, prey: ['mackerel', 'sardine', 'squid', 'tuna'], max: 2, metab: 1 / 220 }],
    ['hammerhead', 'Hammerhead shark', [['.......k.......k', '......kk.......k', 'k....kkkkkkkkkkk', 'kk.kkkkkkkkkkkkk', '.kkkwwwwwwwwwkek', 'k......k........']], { k: '#7a8a8a', w: '#d8e0e0', e: '#111' }, { speed: 0.6, prey: ['smallfish', 'mackerel', 'squid', 'mantaray', 'octopus', 'barracuda'], max: 2, metab: 1 / 220, sense: 60 }],
    ['mantaray', 'Manta ray', [['.....k.....', '...kkkkk...', 'kkkkkkkkkkk', '...kwwwk...', 'tttt.......']], { k: '#2a3a4a', w: '#e8e8e8', t: '#2a3a4a' }, { speed: 0.35, breach: true, max: 3 }],
    ['seahorse', 'Seahorse', [['.bb', 'bbe', 'b..', 'bb.', '.b.', 'b..']], { b: '#f0a020', e: '#111' }, { speed: 0.08, max: 8, bottom: true, flutter: true }],
    ['moray', 'Moray eel', [['..........bbe', '.bbbbbbbbbbbn', 'b..bbbbbb....']], { b: '#5a7a2a', e: '#f0f0a0', n: '#3a5a1a' }, { speed: 0.3, bottom: true, prey: ['smallfish', 'octopus', 'shrimp', 'crab'], max: 3 }],
    ['squid', 'Squid', [['k.k.bbbb..', '.kkkbbbbb.', 'k.k.bbbbbb', '.kkkbebbb.']], { b: '#e8a8b0', k: '#d88890', e: '#111' }, { speed: 0.5, prey: ['shrimp', 'sardine', 'anchovy', 'lanternfish'], max: 8, school: true }],
    ['narwhal', 'Narwhal', [['...........aaaa', '...bbbbbbbbb...', 'tbbbbbbbbbbbe..', '..wwwwwwww.....']], { b: '#8a9098', w: '#d8dcde', t: '#6a7078', e: '#111', a: '#f0ece0' }, { speed: 0.45, prey: ['cod', 'squid', 'shrimp'], max: 4, breach: true }],
    ['beluga', 'Beluga', [['...bbbbbbb..', 'tbbbbbbbbbbe', '..bbbbbbbbb.']], { b: '#f0f4f8', t: '#d8dce0', e: '#111' }, { speed: 0.4, prey: ['cod', 'squid', 'shrimp'], max: 4 }],
    ['manatee', 'Manatee', [['..bbbbbbb..', 'tbbbbbbbbbe', '...b...b...']], { b: '#8a8a86', t: '#7a7a76', e: '#111' }, { speed: 0.12, eats: ['SEAWEED', 'KELP', 'LILY'], max: 4 }],
  ];
  for (const [id, name, art, pal, o] of FISH) D(id, Object.assign({ name, hab: 'water', art, pal, speed: 0.4, metab: 0, max: 12, breed: 0.008, sleeps: false }, o));
  // fish predators need hunger
  for (const id of ['barracuda', 'pike', 'piranha', 'anglerfish', 'swordfish', 'hammerhead', 'moray', 'lionfish', 'squid', 'narwhal', 'beluga', 'mackerel', 'salmon', 'trout']) S[id].metab = S[id].metab || 1 / 260;
  D('seaotter', { name: 'Sea otter', hab: 'amph', floats: true, art: [['....bbe', 'tbbbbbn', '..k.k..']], pal: { b: '#5a3a2a', e: '#111', n: '#d8c0a0', t: '#4a2a1a', k: '#3a2a1a' }, speed: 0.3, prey: ['urchin', 'crab', 'clam', 'starfish'], max: 6, breed: 0.004 });
  // bottom dwellers walk on the sea floor
  D('starfish', { name: 'Starfish', art: [['..o..', 'ooooo', '.o.o.']], pal: { o: '#e8603a' }, variants: { o: ['#e8603a', '#a83ac8', '#f0a020', '#e83a6a'] }, waterOk: true, speed: 0.04, eats: ['CORAL', 'SEAWEED'], sip: true, max: 10, breed: 0.004, noFlip: true, sleeps: false });
  D('lobster', { name: 'Lobster', art: [['p.....p', '.rrrrrr', 'tr.r.rr']], pal: { r: '#a8301a', p: '#c84a2a', t: '#a8301a' }, waterOk: true, speed: 0.2, prey: ['clam', 'snail'], eats: ['SEAWEED', 'LITTER'], max: 6, breed: 0.005, sleeps: false });
  D('shrimp', { name: 'Shrimp', art: [['.ppk', 'pppp', 'k.k.']], pal: { p: '#f0909a', k: '#d8707a' }, waterOk: true, speed: 0.25, eats: ['SEAWEED', 'LITTER'], sip: true, max: 20, breed: 0.015, sleeps: false });
  D('crayfish', { name: 'Crayfish', art: [['k...k', '.bbbb', 't.b.b']], pal: { b: '#7a3a2a', k: '#9a4a3a', t: '#7a3a2a' }, waterOk: true, speed: 0.25, eats: ['SEAWEED', 'LITTER', 'PLANT'], max: 10, breed: 0.01, sleeps: false });
  D('urchin', { name: 'Sea urchin', art: [['k.k.k', '.kpk.', 'kpppk']], pal: { k: '#3a1a4a', p: '#6a2a7a' }, waterOk: true, speed: 0.02, eats: ['KELP', 'SEAWEED'], max: 10, breed: 0.006, noFlip: true, sleeps: false });
  D('clam', { name: 'Clam', art: [['.ss.', 'ssss']], pal: { s: '#c8b8a8' }, waterOk: true, speed: 0.01, metab: 0, max: 12, breed: 0.006, noFlip: true, sleeps: false, idle: 0.9 });
  D('hermitcrab', { name: 'Hermit crab', art: [['.ss.', 'ssssp', '.r.r.']], pal: { s: '#d8b890', p: '#e86a3a', r: '#e86a3a' }, waterOk: true, speed: 0.2, eats: ['LITTER', 'SEAWEED'], max: 10, breed: 0.008 });
  D('seaturtle2', { name: 'Green sea turtle', hab: 'water', art: [['..sssss..', '.sssssssbe', 'f.ssssss.b', '...f..f...']], pal: { s: '#4a6a3a', b: '#8aa870', e: '#111', f: '#8aa870' }, speed: 0.3, eats: ['SEAWEED', 'KELP'], max: 4, breed: 0.002, sleeps: false });
  D('greatwhite', { name: 'Great white shark', hab: 'water', art: [['.........k..........', '........kk..........', 'k......kkkkkkkk.....', 'kk...kkkkkkkkkkkkk..', '.kkkkkkwwwwwwwwwwkek', 'k........k....wwww..']], pal: { k: '#5a6878', w: '#e8eef2', e: '#111' }, speed: 0.6, prey: ['seal', 'tuna', 'seaturtle2', 'turtle', 'dolphin', 'sealion', 'mackerel', 'squid'], max: 2, breed: 0.0015, metab: 1 / 250, sense: 70, life: 1200 });
  D('sealion', { name: 'Sea lion', hab: 'amph', art: [['......bbe', '.....bbbn', 'tbbbbbbb.', '.f...f...']], pal: { b: '#7a5a3a', e: '#111', n: '#3a2a1a', t: '#6a4a2a', f: '#5a3a20' }, speed: 0.5, prey: ['sardine', 'anchovy', 'squid', 'mackerel', 'smallfish'], max: 8, breed: 0.004 });

  // ======================================================== REPTILES & AMPHIBIANS
  CAT = 'reptile';
  D('crocodile', { name: 'Crocodile', hab: 'amph', art: [['.....s.s.s......', 'tttbbbbbbbbbbeb..', '..bbbbbbbbbbbbbbbb', '...k..k...k..k....']], pal: { b: '#4a5a30', s: '#3a4a24', t: '#4a5a30', e: '#e8c020', k: '#3a4a24' }, speed: 0.3, prey: ['zebra', 'gazelle', 'wildebeest', 'capybara', 'smallfish', 'catfish', 'duck', 'frog', 'tapir', 'piranha'], max: 3, breed: 0.002, metab: 1 / 400, idle: 0.6, sense: 35 });
  D('alligator', { name: 'Alligator', hab: 'amph', art: [['.....s.s.s.....', 'tttbbbbbbbbbbeb.', '..bbbbbbbbbbbbbbb', '...k..k...k..k...']], pal: { b: '#2a3a24', s: '#1e2a1a', t: '#2a3a24', e: '#e8c020', k: '#1e2a1a' }, speed: 0.3, prey: ['catfish', 'smallfish', 'duck', 'frog', 'turtle', 'raccoon', 'heronstand', 'egret'], max: 3, breed: 0.002, metab: 1 / 400, idle: 0.6 });
  D('iguana', { name: 'Iguana', hab: 'climb', climbVeg: true, art: [['....s.s.bb.', 'tttbbbbbbbe', '...k...k...']], pal: { b: '#5aa84a', s: '#3a8a3a', t: '#4a8a3a', e: '#111', k: '#3a7a2a' }, speed: 0.3, eats: ['LEAF', 'FLOWER', 'BERRY'], max: 6, breed: 0.006, idle: 0.6 });
  D('tortoise', { name: 'Tortoise', art: [['..sss..', '.sssss.', 'ssssssbe', '.k...k..']], pal: { s: '#7a6a3a', b: '#8a8a6a', e: '#111', k: '#6a6a50' }, speed: 0.06, eats: ['PLANT', 'GRASS', 'FLOWER', 'CACTUS', 'DRYGRASS'], max: 6, breed: 0.002, life: 3000, idle: 0.5 });
  D('chameleon', { name: 'Chameleon', hab: 'climb', climbVeg: true, art: [['..sss..', 'tbbbbbe', 't.k.k..']], pal: { b: '#6ac84a', s: '#4aa83a', t: '#4aa83a', e: '#f0d020', k: '#3a8a2a' }, variants: { b: ['#6ac84a', '#e8a03a', '#3aa8c8', '#c84a8a'] }, speed: 0.08, prey: ['fly', 'cricket', 'grasshopper', 'butterfly', 'morpho', 'mosquito'], max: 5, breed: 0.004, idle: 0.6 });
  D('gecko', { name: 'Gecko', hab: 'climb', art: [['.k.k.', 'tbbbe', '.k.k.']], pal: { b: '#c8b878', t: '#a89858', e: '#111', k: '#a89858' }, speed: 0.6, prey: ['fly', 'mosquito', 'cricket', 'moth', 'cockroach'], max: 8, breed: 0.008, nocturnal: true });
  D('salamander', { name: 'Fire salamander', hab: 'amph', art: [['....bbe', 'tbsbsbb', '.k...k.']], pal: { b: '#1a1a1a', s: '#f0c020', t: '#1a1a1a', e: '#111', k: '#1a1a1a' }, speed: 0.15, prey: ['worm', 'slug', 'snail', 'beetle'], max: 6, breed: 0.006, nocturnal: true });
  D('newt', { name: 'Newt', hab: 'amph', art: [['...be', 'tbbbb', '.k.k.']], pal: { b: '#e8702a', t: '#e8702a', e: '#111', k: '#c8502a' }, speed: 0.2, prey: ['mosquito', 'worm', 'snail'], max: 8, breed: 0.008 });
  D('toad', { name: 'Toad', hab: 'amph', art: [['.ee.', 'bsbb', 'b..b']], pal: { b: '#8a7a4a', s: '#6a5a3a', e: '#e8c020' }, speed: 0.3, jumpy: true, prey: ['fly', 'mosquito', 'beetle', 'cricket', 'slug', 'worm', 'moth'], max: 10, breed: 0.01, idle: 0.6, nocturnal: true });
  D('treefrog', { name: 'Red-eyed tree frog', hab: 'climb', climbVeg: true, art: [['.ee.', 'gggg', 'o..o']], pal: { g: '#5ad83a', e: '#e82a2a', o: '#f08a1a' }, speed: 0.4, jumpy: true, prey: ['fly', 'mosquito', 'cricket', 'moth'], max: 8, breed: 0.008, nocturnal: true });
  D('cobra', { name: 'Cobra', art: [['......bb', '.....bbe', 'bb..bb..', '.bbbb...']], pal: { b: '#6a5a3a', e: '#111' }, speed: 0.35, prey: ['mouse', 'frog', 'lizard', 'meerkat', 'rat'], max: 3, breed: 0.003, metab: 1 / 300 });
  D('rattlesnake', { name: 'Rattlesnake', art: [['...ss...be', 'kbbbbbbbb.'], ['kbbss..bbe', '...bbbbb..']], pal: { b: '#b89a6a', s: '#6a5030', e: '#111', k: '#e8d8b8' }, speed: 0.3, prey: ['mouse', 'lizard', 'jackrabbit', 'rat'], max: 3, breed: 0.003, metab: 1 / 300, nocturnal: true });
  D('python', { name: 'Python', hab: 'climb', climbVeg: true, art: [['..ss..ss.be', 'bbbbbbbbbb.']], pal: { b: '#8a7a3a', s: '#4a3a1a', e: '#111' }, speed: 0.15, prey: ['mouse', 'capybara', 'monkey', 'capuchin', 'rat', 'parrot'], max: 2, breed: 0.002, metab: 1 / 500 });
  D('komodo', { name: 'Komodo dragon', art: [['.........bb.', 'ttttbbbbbbbe', '...bbbbbbbbn', '...k..k.k...']], pal: { b: '#6a6050', t: '#5a5040', e: '#111', n: '#e8a020', k: '#4a4030' }, speed: 0.35, prey: ['boar', 'goatfarm', 'pig', 'monkey', 'mouse'], max: 2, breed: 0.002, metab: 1 / 400 });
  D('snapper', { name: 'Snapping turtle', hab: 'amph', art: [['.ssss..', 'ssssssbe', 't.k.k.b.']], pal: { s: '#4a4a30', b: '#6a6a4a', e: '#111', t: '#5a5a3a', k: '#4a4a30' }, speed: 0.15, prey: ['smallfish', 'minnow', 'frog', 'crayfish', 'snail'], max: 4, breed: 0.003 });

  // ======================================================== INSECTS & BUGS
  CAT = 'bug';
  D('bee', { name: 'Honeybee', hab: 'air', art: [['.w.', 'ykyk'], ['...', 'ykyk']], pal: { y: '#f0c020', k: '#2a2a1a', w: '#e8f4ff' }, speed: 0.6, flutter: true, eats: ['FLOWER', 'BLOSSOM'], sip: true, perches: 0.5, max: 16, breed: 0.012, sleeps: true, life: 240 });
  D('bumblebee', { name: 'Bumblebee', hab: 'air', art: [['.ww.', 'ykyk', 'kyky'], ['....', 'ykyk', 'kyky']], pal: { y: '#f0c020', k: '#1a1a1a', w: '#e8f4ff' }, speed: 0.45, flutter: true, eats: ['FLOWER', 'BLOSSOM'], sip: true, perches: 0.5, max: 10, breed: 0.01, life: 240 });
  D('wasp', { name: 'Wasp', hab: 'air', art: [['.w..', 'ykyke'], ['....', 'ykyke']], pal: { y: '#f0d020', k: '#1a1a1a', w: '#e8f4ff', e: '#1a1a1a' }, speed: 0.8, flutter: true, prey: ['caterpillar', 'fly', 'aphid', 'bee'], eats: ['BERRY'], sip: true, max: 8, breed: 0.008, life: 240 });
  D('fly', { name: 'Fly', hab: 'air', art: [['w.', 'kk'], ['..', 'kk']], pal: { k: '#2a2a2a', w: '#c8d8e8' }, speed: 0.8, flutter: true, eats: ['LITTER', 'FUNGUS', 'BERRY'], sip: true, perches: 0.3, max: 20, breed: 0.02, life: 150, mature: 15, sleeps: false });
  D('mosquito', { name: 'Mosquito', hab: 'air', art: [['.w.', 'kkk'], ['...', 'kkk']], pal: { k: '#4a4a40', w: '#e0e8f0' }, speed: 0.5, flutter: true, metab: 0, perches: 0.2, max: 20, breed: 0.02, life: 150, mature: 15, nocturnal: true, sleeps: false });
  D('grasshopper', { name: 'Grasshopper', art: [['.k...', 'ggggge', '.k.k.']], pal: { g: '#7ab83a', e: '#111', k: '#5a8a2a' }, speed: 0.5, jumpy: true, eats: ['GRASS', 'TALLGRASS', 'PLANT', 'LEAF', 'DRYGRASS'], max: 18, breed: 0.015, life: 200, mature: 20 });
  D('cricket', { name: 'Cricket', art: [['k...', 'bbbe', 'k.k.']], pal: { b: '#3a2a1a', e: '#111', k: '#2a1a10' }, speed: 0.4, jumpy: true, eats: ['PLANT', 'LITTER', 'GRASS'], max: 16, breed: 0.015, nocturnal: true, life: 200, mature: 20 });
  D('mantis', { name: 'Praying mantis', hab: 'climb', climbVeg: true, art: [['.....g', '....gg', 'gggg.g', '.k.k..']], pal: { g: '#6ac04a', k: '#4a9a3a' }, speed: 0.15, prey: ['fly', 'bee', 'grasshopper', 'cricket', 'moth', 'aphid', 'butterfly', 'mosquito'], max: 4, breed: 0.004, idle: 0.6 });
  D('caterpillar', { name: 'Caterpillar', hab: 'climb', climbVeg: true, art: [['gygygk'], ['gygyg.']], pal: { g: '#5ac83a', y: '#f0e040', k: '#1a1a1a' }, speed: 0.08, eats: ['LEAF', 'AUTUMN', 'BLOSSOM', 'PLANT'], max: 12, breed: 0.008, sleeps: false, life: 300 });
  D('snail', { name: 'Snail', art: [['.ss.k', 'sssbb', 'bbbbb']], pal: { s: '#a8704a', b: '#c8b8a0', k: '#8a7a6a' }, speed: 0.03, eats: ['LEAF', 'PLANT', 'FUNGUS', 'LITTER'], max: 12, breed: 0.008, nocturnal: true });
  D('slug', { name: 'Slug', art: [['...kk', 'bbbbb']], pal: { b: '#c8a050', k: '#8a7030' }, speed: 0.03, eats: ['LEAF', 'PLANT', 'FUNGUS', 'FLOWER'], max: 10, breed: 0.008, nocturnal: true });
  D('termite', { name: 'Termite', hab: 'climb', digs: false, art: [['wwk']], pal: { w: '#f0e8d0', k: '#a8601a' }, speed: 0.4, eats: ['WOOD', 'LITTER', 'BIRCH'], max: 30, breed: 0.02, sleeps: false, life: 300, mature: 20 });
  D('stagbeetle', { name: 'Stag beetle', art: [['....kk', '.bbbbk', 'k.k.k.']], pal: { b: '#3a1e14', k: '#5a2e1e' }, speed: 0.15, eats: ['LITTER', 'BERRY', 'WOOD'], max: 6, breed: 0.005, nocturnal: true });
  D('dungbeetle', { name: 'Dung beetle', art: [['oo.bb', 'ook.k']], pal: { o: '#6a4a2a', b: '#1a1a2a', k: '#1a1a1a' }, speed: 0.2, eats: ['LITTER', 'DRYGRASS'], max: 10, breed: 0.008 });
  D('waterstrider', { name: 'Water strider', hab: 'amph', floats: true, art: [['k.kk.k']], pal: { k: '#3a3a3a' }, speed: 0.6, prey: ['mosquito', 'fly'], max: 12, breed: 0.01, sleeps: false });
  D('centipede', { name: 'Centipede', hab: 'climb', art: [['bbbbbbbe', 'k.k.k.k.']], pal: { b: '#a84a1a', e: '#1a1a1a', k: '#c86a2a' }, speed: 0.4, prey: ['worm', 'termite', 'ant', 'cricket', 'slug'], max: 4, breed: 0.004, nocturnal: true });
  D('millipede', { name: 'Millipede', hab: 'climb', art: [['bbbbbbbbbe', 'kkkkkkkkk.']], pal: { b: '#3a2a3a', e: '#1a1a1a', k: '#6a4a3a' }, speed: 0.12, eats: ['LITTER', 'FUNGUS'], max: 8, breed: 0.006 });
  D('tarantula', { name: 'Tarantula', art: [['k.bb.k', '.bbbb.', 'k.k.k.']], pal: { b: '#3a2a1e', k: '#5a3a2a' }, speed: 0.2, prey: ['cricket', 'grasshopper', 'beetle', 'mouse', 'lizard'], max: 4, breed: 0.003, nocturnal: true });
  D('worm', { name: 'Worm', hab: 'burrow', art: [['..pp', 'pp..'], ['pp..', '..pp']], pal: { p: '#c87a7a' }, speed: 0.2, metab: 0, breed: 0.006, max: 14, sleeps: false });
  D('monarch', { name: 'Monarch butterfly', hab: 'air', art: [['w.w', 'wbw'], ['...', 'wbw']], pal: { w: '#f08a1a', b: '#1a1a1a' }, speed: 0.4, flutter: true, eats: ['FLOWER'], sip: true, perches: 0.4, max: 12, breed: 0.01, life: 200 });
  D('cicada', { name: 'Cicada', hab: 'climb', climbVeg: true, art: [['www.', 'gbbe']], pal: { w: '#c8e0f0', g: '#4a6a3a', b: '#3a4a2a', e: '#e83a2a' }, speed: 0.1, eats: ['WOOD', 'LEAF'], sip: true, max: 8, breed: 0.006 });
  D('glowworm', { name: 'Glow-worm', art: [['bbby']], pal: { b: '#6a6a4a', y: '#d8ff60' }, speed: 0.04, prey: ['snail', 'slug'], glow: '#d8ff60', max: 10, breed: 0.008, nocturnal: true });
  D('dragonfly2', { name: 'Red darter', hab: 'air', art: [['.ww..', 'rrrre'], ['.....', 'rrrre']], pal: { w: '#e8f4ff', r: '#d83a2a', e: '#8a1a1a' }, speed: 0.9, flutter: true, prey: ['mosquito', 'fly'], perches: 0.3, max: 8, breed: 0.008, sleeps: false });

  // ======================================================== PREHISTORIC
  CAT = 'prehistoric';
  D('stegosaurus', { name: 'Stegosaurus', art: [['......p.p.p.....', '.....ppppppp....', 'tt.bbbbbbbbbbb...', '.ttbbbbbbbbbbbbbe', '...bbbbbbbbbbb.bn', '....bb.b...b.bb..', '....kk.k...k.kk..']], pal: { b: '#7a8a5a', p: '#c8603a', t: '#6a7a4a', e: '#111', n: '#5a6a3a', k: '#4a5a3a' }, speed: 0.15, eats: ['PLANT', 'LEAF', 'GRASS', 'FLOWER'], max: 3, breed: 0.002, step: 2, life: 1500 });
  D('ankylosaurus', { name: 'Ankylosaurus', art: [['....s.s.s.s.s...', '...sssssssssss..', 'kk.bbbbbbbbbbbbbe', 'kkbbbbbbbbbbbbbbn', '...bb.bb...bb.bb.', '...kk.kk...kk.kk.']], pal: { b: '#8a7a5a', s: '#6a5a3a', k: '#5a4a2a', e: '#111', n: '#6a5a3a' }, speed: 0.15, eats: ['PLANT', 'GRASS', 'FLOWER', 'LEAF'], max: 3, breed: 0.002, step: 2, life: 1500 });
  D('parasaurolophus', { name: 'Parasaurolophus', art: [['.........ccc', '..........bbe', '..........bbn', '...bbbbbbbb..', 'tbbbbbbbbbb..', '...bbbbbbb...', '....b...b....', '....b...b....', '...kk..kk....']], pal: { b: '#5a8a8a', c: '#c8503a', t: '#4a7a7a', e: '#111', n: '#3a6a6a', k: '#2a4a4a' }, speed: 0.35, eats: ['LEAF', 'PLANT', 'NEEDLE', 'VINE'], reach: 12, max: 5, breed: 0.003, step: 2 });
  D('pachy', { name: 'Pachycephalosaurus', art: [['.......ww.', '......wbbe', '......bbn.', 'tbbbbbbb..', '...bbbb...', '...b..b...', '..kk.kk...']], pal: { b: '#9a7a5a', w: '#d8c8a0', t: '#8a6a4a', e: '#111', n: '#7a5a3a', k: '#5a4a2a' }, speed: 0.45, eats: ['PLANT', 'FLOWER', 'BERRY'], max: 5, breed: 0.004, step: 2 });
  D('compy', { name: 'Compsognathus', art: [['...be', 'tbbb.', '.k.k.']], pal: { b: '#8a9a4a', t: '#7a8a3a', e: '#111', k: '#5a6a2a' }, speed: 0.9, prey: ['meganeura', 'mammal', 'dragonfly', 'beetle', 'cricket'], max: 10, breed: 0.01 });
  D('spinosaurus', { name: 'Spinosaurus', hab: 'amph', art: [['......pppp........', '.....pppppp.......', '....pppppppp..bbbbb', 't..bbbbbbbbbbbbbbbe', 'tbbbbbbbbbbbbb..bbbb', '.....bbbbbbbb......', '......b...b........', '.....kk..kk........']], pal: { b: '#6a5a4a', p: '#c87a4a', t: '#5a4a3a', e: '#e8c020', k: '#4a3a2a' }, speed: 0.4, prey: ['smallfish', 'catfish', 'plesiosaur', 'mammal', 'raptor', 'pike'], max: 2, breed: 0.002, metab: 1 / 300, life: 1500, step: 2 });
  D('dimetrodon', { name: 'Dimetrodon', art: [['...ppppp...', '..ppppppp..', 'ttbbbbbbbbe', '..bbbbbbbbn', '..k..k.k...']], pal: { b: '#6a5a6a', p: '#c86a4a', t: '#5a4a5a', e: '#e8c020', n: '#5a4a5a', k: '#4a3a4a' }, speed: 0.3, prey: ['mammal', 'compy', 'meganeura'], max: 3, breed: 0.003, metab: 1 / 300 });
  D('mammoth', { name: 'Woolly mammoth', art: quad({ L: 13, H: 7, leg: 4, head: [4, 5], headDy: -3, trunk: 5, tusks: true, hump: 2, tail: 2 }), pal: P('#6a4a2e', { a: '#f0e8d0', h: '#5a3a24' }), speed: 0.22, eats: ['GRASS', 'TALLGRASS', 'PLANT', 'NEEDLE', 'SNOW', 'DRYGRASS', 'LEAF'], max: 4, breed: 0.002, step: 3, life: 2000 });
  D('sabertooth', { name: 'Sabertooth cat', art: quad({ L: 9, H: 4, leg: 3, head: [3, 2], snout: 1, horns: 'tusk', ears: 'up', tail: 1, belly: true }), pal: P('#b88a50', { a: '#f8f4e8', w: '#e0c898' }), speed: 0.75, prey: ['mammoth', 'mammal', 'boar', 'deer', 'elk', 'horse'], max: 2, breed: 0.003, metab: 1 / 240 });
  D('archaeopteryx', { name: 'Archaeopteryx', hab: 'air', art: bird(6, {}), pal: { b: '#5a7a8a', t: '#3a5a6a', w: '#c84a3a', e: '#111', y: '#3a3a3a', k: '#3a3a3a' }, speed: 0.7, prey: ['meganeura', 'dragonfly', 'beetle'], perches: 0.6, max: 6, breed: 0.005 });
  D('plesiosaur', { name: 'Plesiosaurus', hab: 'water', art: [['............bbe', '...........bb..', '..........bb...', '...bbbbbbbb....', 'tbbbbbbbbb.....', '..f....f.......']], pal: { b: '#4a6a7a', e: '#111', t: '#3a5a6a', f: '#3a5a6a' }, speed: 0.45, prey: ['smallfish', 'ammonite', 'squid', 'sardine'], max: 3, breed: 0.002, metab: 1 / 300, sleeps: false });
  D('mosasaur', { name: 'Mosasaurus', hab: 'water', art: [['.....ssss..........', 'k..bbbbbbbbbbbbbbe.', 'kkbbbbbbbbbbbbbbbbbb', 'k..wwwwwwwwwwwwwww..', '.....f.......f......']], pal: { b: '#3a4a5a', s: '#2a3a4a', k: '#2a3a4a', w: '#c8d0d8', e: '#e8c020', f: '#2a3a4a' }, speed: 0.6, prey: ['plesiosaur', 'smallfish', 'ammonite', 'shark', 'tuna', 'squid'], max: 1, breed: 0.001, metab: 1 / 300, sleeps: false, life: 2000, sense: 70 });
  D('ammonite', { name: 'Ammonite', hab: 'water', art: [['.sss.', 'sbsbs', 'sbbsk', '.sssk']], pal: { s: '#d8b080', b: '#a8784a', k: '#e8a0a0' }, speed: 0.15, metab: 0, max: 12, breed: 0.01, sleeps: false });
  D('trilobite', { name: 'Trilobite', art: [['.sss.', 'sbsbs', 'k.k.k']], pal: { s: '#6a5a4a', b: '#8a7a6a', k: '#4a3a2a' }, waterOk: true, speed: 0.08, eats: ['SEAWEED', 'LITTER'], sip: true, max: 14, breed: 0.01, sleeps: false });

  // ======================================================== PEOPLE, MACHINES & ODDITIES
  CAT = 'other';
  D('boat', { name: 'Rowing boat', hab: 'amph', floats: true, art: [['...h...', '...f...', '.wwwww.', 'bbbbbbb', '.bbbbb.']], pal: { h: '#e8c020', f: '#f0c8a0', w: '#d83a2a', b: '#8a5a3a' }, speed: 0.2, metab: 0, breed: 0, max: 4, sleeps: false, life: 99999, idle: 0.4 });
  D('sailboat', { name: 'Sailboat', hab: 'amph', floats: true, art: [['....s.....', '...ss.....', '..sss.....', '.ssss.....', 'sssss.....', '....m.....', 'bbbbbbbbbb', '.bbbbbbbb.']], pal: { s: '#f8f8f0', m: '#6a4a2a', b: '#2a4a8a' }, speed: 0.4, metab: 0, breed: 0, max: 3, sleeps: false, life: 99999, idle: 0.2 });
  D('balloon', { name: 'Hot-air balloon', hab: 'air', art: [['.rryrr.', 'rryrryr', 'rryrryr', '.rryrr.', '..k.k..', '..k.k..', '..bbb..']], pal: { r: '#e83a2a', y: '#f0d020', k: '#5a4a3a', b: '#8a5a2a' }, variants: { r: ['#e83a2a', '#3a6ad8', '#3ab04a', '#a83ad8'], y: ['#f0d020', '#ffffff', '#f08a1a'] }, speed: 0.15, high: true, metab: 0, breed: 0, max: 3, perches: 0, sleeps: false, life: 99999 });
  D('plane', { name: 'Airplane', hab: 'air', art: [['k........', 'kk.......', 'wwwwwwwwwb', '...kk....']], pal: { w: '#f0f0f4', k: '#c83a2a', b: '#3a4a6a' }, speed: 1.6, high: true, metab: 0, breed: 0, max: 2, perches: 0, sleeps: false, life: 99999, glow: '#ff6060' });
  D('alien', { name: 'Little green alien', art: [['b...b', '.bbb.', 'bebeb', '.bbb.', '.sss.', 'sssss', '.b.b.']], pal: { b: '#7ae84a', e: '#1a1a1a', s: '#9aa0b0' }, speed: 0.35, metab: 0, breed: 0, max: 12, glow: '#7ae84a', sleeps: false, life: 99999, idle: 0.3, toxicOk: true });
  D('farmer', { name: 'Farmer', art: [['hhh', '.f.', 'sss', 'sss', '.p.', 'p.p', 'p.p']], pal: { h: '#d8b050', f: '#e8b890', s: '#3a6ad8', p: '#3a5a8a' }, variants: { f: ['#e8b890', '#8a5a3a', '#c8946a'] }, speed: 0.22, metab: 0, breed: 0, max: 6, idle: 0.5, life: 99999 });
  D('jogger', { name: 'Jogger', art: [['.h.', '.f.', 'sss', 'sss', '.p.', 'p.p', 'k.k']], pal: { h: '#3a2a1a', f: '#e8b890', s: '#f0f040', p: '#1a1a1a', k: '#f0f0f0' }, variants: { s: ['#f0f040', '#f06aa8', '#3ad8c8'], f: ['#e8b890', '#8a5a3a', '#c8946a'] }, speed: 0.55, metab: 0, breed: 0, max: 4, idle: 0.05, life: 99999 });

  // categories for the original species
  const OLDCAT = {
    bird: ['songbird', 'pigeon', 'crow', 'ptarmigan', 'parrot', 'toucan', 'seagull', 'vulture', 'eagle', 'owl', 'snowyowl', 'heron', 'duck', 'penguin'],
    sea: ['smallfish', 'clownfish', 'cod', 'bass', 'tuna', 'shark', 'whale', 'dolphin', 'orca', 'jellyfish', 'octopus', 'crab', 'turtle', 'seal'],
    reptile: ['lizard', 'snake', 'treesnake', 'frog', 'poisonfrog'],
    bug: ['beetle', 'butterfly', 'morpho', 'dragonfly', 'firefly', 'moth', 'ant', 'antqueen', 'aphid', 'spider', 'ladybug', 'earthworm', 'scorpion', 'cockroach'],
    prehistoric: ['brontosaurus', 'triceratops', 'raptor', 'trex', 'mammal', 'pterodactyl', 'meganeura'],
    other: ['person', 'survivor', 'zombie', 'car', 'tumbleweed'],
  };
  for (const id in S) if (!S[id].cat) S[id].cat = 'mammal';
  for (const c in OLDCAT) for (const id of OLDCAT[c]) if (S[id]) S[id].cat = c;
  // the original small fish also schools with similar fish as prey for new predators
  void SMALLFISH; void BUGS; void FRUIT; void BROWSE;

  DS.finalizeSpecies();
  DS.SpeciesCats = [['mammal', 'Mammals'], ['bird', 'Birds'], ['sea', 'Fish & sea life'], ['reptile', 'Reptiles & amphibians'], ['bug', 'Insects & bugs'], ['prehistoric', 'Prehistoric'], ['other', 'People & machines']];
})();
