// Cell material definitions.
(function () {
  'use strict';
  const DS = window.DS;
  const U = DS.U;

  // kind: static | powder | liquid | gas | fire
  // solid: creatures stand on / collide with it
  // veg:   vegetation (creatures walk through, rendered as part of the world)
  const defs = [
    ['EMPTY',     { kind: 'none', colors: ['#000000'] }],
    ['BEDROCK',   { kind: 'static', solid: true, colors: ['#2b2b30', '#26262b', '#303036', '#29292e'] }],
    ['STONE',     { kind: 'static', solid: true, colors: ['#7a7a80', '#6e6e75', '#85858b', '#737379'] }],
    ['DIRT',      { kind: 'powder', solid: true, density: 3, sticky: 0.06, dig: true, colors: ['#7a5232', '#6f4a2c', '#835a38', '#76502f'] }],
    ['SAND',      { kind: 'powder', solid: true, density: 3, sticky: 1, dig: true, colors: ['#e2c98a', '#d9bf7f', '#e8d195', '#dcc384'] }],
    ['GRASS',     { kind: 'static', solid: true, flammable: 0.08, burn: 20, edible: true, dig: true, colors: ['#4f9e3a', '#5aab42', '#468f34', '#62b54a'] }],
    ['WATER',     { kind: 'liquid', density: 2, spread: 5, colors: ['#3a7bd5'] }],
    ['LAVA',      { kind: 'liquid', density: 2.6, spread: 1, glow: '#ff7a1a', colors: ['#ff5a0a', '#ff7a14', '#f04a08', '#ff9a2a'] }],
    ['SNOW',      { kind: 'powder', solid: true, density: 2.5, sticky: 0.5, dig: true, colors: ['#f4f8ff', '#e8eef8', '#ffffff', '#dfe8f4'] }],
    ['ICE',       { kind: 'static', solid: true, colors: ['#a8d8f0', '#b8e2f6', '#9ccfe8', '#c4e8f8'] }],
    ['FIRE',      { kind: 'fire', glow: '#ffb040', colors: ['#ff4a10', '#ff8a1a', '#ffd040', '#ff6a14'] }],
    ['SMOKE',     { kind: 'gas', density: 0.2, colors: ['#5a5a5e', '#646468', '#505054', '#6a6a6e'], alpha: 150 }],
    ['STEAM',     { kind: 'gas', density: 0.2, colors: ['#d8e4ee', '#c8d6e2', '#e4eef6', '#d0dde8'], alpha: 120 }],
    ['WOOD',      { kind: 'static', veg: true, flammable: 0.02, burn: 90, colors: ['#6b4423', '#5e3b1e', '#774c28', '#634020'] }],
    ['LEAF',      { kind: 'static', veg: true, flammable: 0.06, burn: 25, edible: true, colors: ['#3f8f2f', '#4a9e36', '#357f28', '#56aa3e'] }],
    ['NEEDLE',    { kind: 'static', veg: true, flammable: 0.06, burn: 25, edible: true, colors: ['#1f5e3a', '#246b42', '#1a5232', '#2a7548'] }],
    ['PLANT',     { kind: 'static', veg: true, flammable: 0.1, burn: 15, edible: true, colors: ['#5dbb3f', '#4fa836', '#6cc94a', '#58b03c'] }],
    ['FLOWER',    { kind: 'static', veg: true, flammable: 0.1, burn: 10, edible: true, colors: ['#ff5a7a', '#ffd23a', '#b06aff', '#ffffff'] }],
    ['CACTUS',    { kind: 'static', veg: true, flammable: 0.004, burn: 60, colors: ['#3e8e4a', '#358040', '#47995a', '#2f7a3c'] }],
    ['SEAWEED',   { kind: 'static', veg: true, edible: true, colors: ['#2e8a4e', '#3a9a58', '#267a42', '#45a862'] }],
    ['CORAL',     { kind: 'static', solid: true, colors: ['#ff7f7f', '#ff9f5a', '#d86ad8', '#ffd06a'] }],
    ['SEED',      { kind: 'powder', density: 2.2, flammable: 0.1, burn: 5, colors: ['#a07840', '#8a6636', '#b08850', '#946e3a'] }],
    ['ASH',       { kind: 'powder', solid: true, density: 2.4, sticky: 0.3, colors: ['#6e6e6e', '#5e5e5e', '#7e7e7e', '#666666'] }],
    ['RUBBLE',    { kind: 'powder', solid: true, density: 3, sticky: 0.25, colors: ['#8a8a86', '#767672', '#9a968e', '#6e6a66'] }],
    ['BRICK',     { kind: 'static', solid: true, colors: ['#a8483a', '#b4523f', '#983f33', '#c8c0b0'] }],
    ['CONCRETE',  { kind: 'static', solid: true, colors: ['#a6a49e', '#9c9a94', '#b0aea8', '#94928c'] }],
    ['GLASS',     { kind: 'static', solid: true, colors: ['#9fd0e8', '#8cc0dc', '#b0dcf0', '#88b8d4'], alpha: 190 }],
    ['METAL',     { kind: 'static', solid: true, colors: ['#8a5a3a', '#7a4a30', '#6a6e74', '#9a6440'] }],
    ['ASPHALT',   { kind: 'static', solid: true, colors: ['#3c3c40', '#38383c', '#424246', '#353539'] }],
    ['ROOF',      { kind: 'static', solid: true, colors: ['#6a3a32', '#5e332c', '#76423a', '#64362f'] }],
    ['SANDSTONE', { kind: 'static', solid: true, colors: ['#c89a62', '#bd8f58', '#d2a56c', '#b88a52'] }],
    ['MUD',       { kind: 'powder', solid: true, density: 3, sticky: 0.03, dig: true, colors: ['#4e3a26', '#463422', '#57412b', '#4a3724'] }],
    ['LITTER',    { kind: 'powder', veg: true, density: 2.1, sticky: 0.4, flammable: 0.12, burn: 10, edible: true, colors: ['#c4762a', '#d6a03a', '#a8562a', '#8e9a32'] }],
    ['TOXIC',     { kind: 'liquid', density: 2, spread: 3, glow: '#7aff3a', colors: ['#6adf2a', '#5ccf22', '#7aef3a', '#52bf1e'], alpha: 220 }],
    ['EMBERS',    { kind: 'static', solid: true, glow: '#ff6a1a', colors: ['#c83a10', '#a02a0a', '#e85a1a', '#802008'] }],
    ['LILY',      { kind: 'static', veg: true, edible: true, colors: ['#3aa84a', '#46b456', '#ff9ad0', '#34983f'] }],
    ['VINE',      { kind: 'static', veg: true, flammable: 0.05, burn: 15, edible: true, colors: ['#2f8a2a', '#3a9a32', '#267a22', '#44a83c'] }],
    ['LAMP',      { kind: 'static', solid: true, glow: '#ffe8a0', colors: ['#fff0b0', '#ffe8a0', '#fff6c8', '#ffe090'] }],
    ['OIL',       { kind: 'liquid', density: 1.5, spread: 3, flammable: 0.3, burn: 60, colors: ['#2a2420', '#332c26', '#241f1b', '#3a322b'] }],
    ['VENT',      { kind: 'static', solid: true, glow: '#ff5a10', colors: ['#3a2a26', '#4a2a20', '#2e2220', '#5a3020'] }],
    ['SOIL',      { kind: 'static', solid: true, dig: true, colors: ['#6e4a2e', '#654329', '#775033', '#69462b'] }],
    ['BASALT',    { kind: 'static', solid: true, colors: ['#4a4442', '#433e3c', '#524b48', '#3e3937'] }],
    ['SIDING',    { kind: 'static', veg: true, flammable: 0.01, burn: 80, colors: ['#e8d8b0', '#b8d0e0', '#e0b8b0', '#c8dcb8'] }],
    ['FACADE',    { kind: 'static', veg: true, colors: ['#6e6c68', '#64625e', '#787672', '#5a5854'] }],
    ['AUTUMN',    { kind: 'static', veg: true, flammable: 0.07, burn: 22, edible: true, colors: ['#e0782a', '#c8402a', '#f0b030', '#d8602a'] }],
    ['BLOSSOM',   { kind: 'static', veg: true, flammable: 0.06, burn: 20, edible: true, colors: ['#f8b8d0', '#ffd0e0', '#f098b8', '#fff0f4'] }],
    ['BIRCH',     { kind: 'static', veg: true, flammable: 0.02, burn: 80, colors: ['#e8e4dc', '#f4f0e8', '#2a2a2a', '#dcd8d0'] }],
    ['KELP',      { kind: 'static', veg: true, edible: true, colors: ['#6a6a24', '#7a7a2a', '#5a5a1e', '#8a8434'] }],
    ['BAMBOO',    { kind: 'static', veg: true, flammable: 0.03, burn: 40, edible: true, colors: ['#8ac04a', '#7ab03e', '#9ad058', '#5a8a2a'] }],
    ['TALLGRASS', { kind: 'static', veg: true, flammable: 0.12, burn: 10, edible: true, colors: ['#6ac44a', '#58b03c', '#7ad458', '#4a9a32'] }],
    ['DRYGRASS',  { kind: 'static', solid: true, flammable: 0.2, burn: 12, edible: true, dig: true, colors: ['#c8b45a', '#b8a24a', '#d8c46a', '#a89040'] }],
    ['BERRY',     { kind: 'static', veg: true, flammable: 0.05, burn: 10, edible: true, colors: ['#d02a3a', '#3a3ac8', '#e84a5a', '#6a2a8a'] }],
    ['SPRING',    { kind: 'static', solid: true, colors: ['#3a6aa8', '#4a7ab8', '#2a5a98', '#5a8ac8'] }],
    ['DRAIN',     { kind: 'static', solid: true, colors: ['#1a1a22', '#22222a', '#141418', '#2a2a32'] }],
    ['FUNGUS',    { kind: 'static', veg: true, edible: true, colors: ['#e8dcc0', '#d8c8a8', '#f4ead4', '#cbb994'] }],
  ];

  const M = {};
  const N = defs.length;
  const P = {
    name: [], kind: new Uint8Array(N), solid: new Uint8Array(N), veg: new Uint8Array(N),
    density: new Float32Array(N), sticky: new Float32Array(N), flammable: new Float32Array(N),
    burn: new Uint8Array(N), edible: new Uint8Array(N), dig: new Uint8Array(N), spread: new Uint8Array(N),
    glow: [], colorsHex: [],
  };
  const KIND = { none: 0, static: 1, powder: 2, liquid: 3, gas: 4, fire: 5 };
  // Palette: 4 shades per material as packed uint32 (ABGR)
  const PAL = new Uint32Array(N * 4);

  defs.forEach(([name, d], id) => {
    M[name] = id;
    P.name[id] = name;
    P.kind[id] = KIND[d.kind];
    P.solid[id] = d.solid ? 1 : 0;
    P.veg[id] = d.veg ? 1 : 0;
    P.density[id] = d.density || (d.kind === 'static' ? 99 : 0);
    P.sticky[id] = d.sticky == null ? 1 : d.sticky;
    P.flammable[id] = d.flammable || 0;
    P.burn[id] = d.burn || 0;
    P.edible[id] = d.edible ? 1 : 0;
    P.dig[id] = d.dig ? 1 : 0;
    P.spread[id] = d.spread || 0;
    P.glow[id] = d.glow || null;
    P.colorsHex[id] = d.colors;
    for (let s = 0; s < 4; s++) {
      const c = U.hex(d.colors[s % d.colors.length]);
      const f = d.colors.length === 1 ? 1 + (s - 1.5) * 0.04 : 1;
      PAL[id * 4 + s] = U.pack(c[0] * f, c[1] * f, c[2] * f, d.alpha || 255);
    }
  });
  M.COUNT = N;

  DS.M = M;
  DS.MP = P;
  DS.KIND = KIND;
  DS.PAL = PAL;
})();
