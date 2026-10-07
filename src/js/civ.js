// Colony mode: tribes that grow from the Stone Age to the Industrial Age.
(function () {
  'use strict';
  const DS = window.DS;
  const { U, M, MP } = DS;
  const S = DS.Species;
  const { def } = DS.SpeciesKit;

  // ------------------------------------------------------------------ data
  const ERAS = [
    { name: 'Stone Age', icon: '🪨', need: 4 },
    { name: 'Bronze Age', icon: '🥉', need: 3 },
    { name: 'Iron Age', icon: '⚔️', need: 3 },
    { name: 'Medieval Age', icon: '🏰', need: 3 },
    { name: 'Industrial Age', icon: '🏭', need: 4 },
    { name: 'Space Age', icon: '🚀', need: 3 },
    { name: 'Interplanetary Age', icon: '🪐', need: 3 },
    { name: 'Stellar Age', icon: '✨', need: 99 },
  ];
  const COLORS = ['#3a6ad8', '#d83a3a', '#e8c030', '#9a3ad8'];
  const RES = [['food', '🍖'], ['wood', '🪵'], ['stone', '🪨'], ['copper', '🟠'], ['tin', '⚪'], ['coal', '⚫'], ['iron', '🔩'], ['gold', '🟡'], ['bronze', '🥉'], ['steel', '⚙️'],
    ['oil', '🛢️'], ['he3', '🔹'], ['rareearth', '🧲'], ['sulfur', '🟨'], ['platinum', '💿'], ['deuterium', '💧'], ['methane', '🟤'], ['crystal', '🔮'], ['aether', '✨']];

  const TECHS = {
    tools: { era: 0, name: 'Stone tools', k: 15, desc: 'Quarry stone. Gathering +30%.' },
    fire: { era: 0, name: 'Fire', k: 15, desc: 'Campfires: cooked food goes 20% further.' },
    hunting: { era: 0, name: 'Hunting', k: 20, desc: 'Hunt deer, boar and other big game.' },
    huts: { era: 0, name: 'Huts', k: 25, cost: { wood: 15 }, desc: 'Build huts (+4 housing).' },
    fishing: { era: 0, name: 'Fishing', k: 30, req: ['tools'], desc: 'Catch fish from lakes, rivers and the sea.' },
    agriculture: { era: 0, name: 'Agriculture', k: 40, req: ['tools'], cost: { wood: 10 }, desc: 'Farms grow wheat.' },
    domestication: { era: 0, name: 'Domestication', k: 45, req: ['hunting'], desc: 'Pens with sheep, cows and chickens.' },
    mining: { era: 1, name: 'Mining', k: 70, req: ['tools'], cost: { wood: 30 }, desc: 'Mines: dig for copper and tin.' },
    bronze: { era: 1, name: 'Bronze working', k: 110, req: ['mining', 'fire'], cost: { copper: 8, tin: 8 }, desc: 'Smithy turns copper and tin into bronze. Gathering +30%, stronger soldiers.' },
    pottery: { era: 1, name: 'Pottery', k: 70, req: ['agriculture'], desc: 'Stored food spoils less (-20% eaten).' },
    writing: { era: 1, name: 'Writing', k: 120, req: ['pottery'], desc: 'Library: research +50%.' },
    wheel: { era: 1, name: 'The wheel', k: 100, req: ['tools'], cost: { wood: 40 }, desc: 'Carts: villagers move 20% faster.' },
    coal: { era: 2, name: 'Coal mining', k: 160, req: ['mining'], cost: { wood: 40 }, desc: 'Mine coal.' },
    iron: { era: 2, name: 'Iron smelting', k: 240, req: ['bronze', 'coal'], cost: { coal: 10 }, desc: 'Mine iron ore. Gathering +30%, iron weapons.' },
    masonry: { era: 2, name: 'Masonry', k: 200, req: ['mining'], cost: { stone: 50 }, desc: 'Stone houses (+8 housing) and watchtowers.' },
    waterwheel: { era: 2, name: 'Water wheel', k: 220, req: ['wheel', 'masonry'], cost: { wood: 60, stone: 20 }, desc: 'Water wheels by rivers and lakes: production +25%.' },
    military: { era: 2, name: 'Military', k: 200, req: ['bronze'], cost: { bronze: 10 }, desc: 'Barracks train soldiers.' },
    windmill: { era: 3, name: 'Windmill', k: 350, req: ['waterwheel', 'agriculture'], cost: { wood: 80, stone: 40 }, desc: 'Windmills: food +30%.' },
    castles: { era: 3, name: 'Castles', k: 450, req: ['masonry', 'military'], cost: { stone: 150 }, desc: 'Castle keep (+12 housing), stronger towers.' },
    steel: { era: 3, name: 'Blacksmithing', k: 400, req: ['iron'], cost: { iron: 30, coal: 20 }, desc: 'Steel from iron and coal. Gathering +20%, steel swords.' },
    astronomy: { era: 3, name: 'Astronomy', k: 380, req: ['writing'], desc: 'Research +50%.' },
    steam: { era: 4, name: 'Steam power', k: 800, req: ['coal', 'steel'], cost: { iron: 40, coal: 60 }, desc: 'Factories: production +50% (and smoke).' },
    gunpowder: { era: 4, name: 'Gunpowder', k: 700, req: ['steel', 'castles'], cost: { coal: 30, iron: 20 }, desc: 'Riflemen.' },
    railways: { era: 4, name: 'Railways', k: 1000, req: ['steam'], cost: { iron: 80 }, desc: 'Villagers move 30% faster.' },
    electricity: { era: 4, name: 'Electricity', k: 1400, req: ['steam'], cost: { copper: 60, coal: 40 }, desc: 'Street lights and lit windows.' },
    oil: { era: 4, name: 'Oil drilling', k: 900, req: ['steam'], cost: { iron: 30 }, desc: 'Oil derricks pump crude oil: fuel for engines and rockets.' },
    combustion: { era: 4, name: 'Combustion engine', k: 1100, req: ['oil'], cost: { oil: 40, steel: 20 }, desc: 'Cars and tractors: villagers 20% faster, food +25%.' },
    flight: { era: 4, name: 'Flight', k: 1300, req: ['combustion'], cost: { oil: 60, steel: 30 }, desc: 'Aircraft. The sky is no longer the limit.' },
    // the space race
    rocketry: { era: 5, name: 'Rocketry', k: 1800, req: ['flight', 'electricity'], cost: { oil: 120, steel: 60 }, desc: 'Launch pads and rockets. Exploration tier 1: the Moon.' },
    computers: { era: 5, name: 'Computers', k: 1600, req: ['electricity'], cost: { copper: 60, gold: 10 }, desc: 'Research +50%.' },
    satellites: { era: 5, name: 'Satellites', k: 2000, req: ['rocketry'], cost: { steel: 60, oil: 60 }, desc: 'Satellite dishes: research +25%.' },
    lifesupport: { era: 5, name: 'Life support', k: 2400, req: ['rocketry'], cost: { he3: 30 }, desc: 'Domes and greenhouses keep colonists alive on hostile worlds. Needed for tier 2.' },
    iondrive: { era: 5, name: 'Ion drive', k: 2600, req: ['rocketry', 'computers'], cost: { he3: 40, copper: 40 }, desc: 'Efficient engines. With Life support: tier 2 (Mercury, Venus, Mars).' },
    asteroidMining: { era: 6, name: 'Asteroid mining', k: 3400, req: ['iondrive', 'lifesupport'], cost: { rareearth: 40, sulfur: 20 }, desc: 'Tier 3: the asteroid belt (Ceres, Vesta, Pallas).' },
    robotics: { era: 6, name: 'Robotics', k: 3200, req: ['computers'], cost: { rareearth: 30, steel: 60 }, desc: 'Robots lend a hand: gathering +40%.' },
    fusion: { era: 6, name: 'Fusion power', k: 4400, req: ['asteroidMining'], cost: { he3: 80, platinum: 30 }, desc: 'Tier 4: the moons of Jupiter. Production +30%.' },
    terraforming: { era: 6, name: 'Terraforming', k: 4000, req: ['lifesupport', 'robotics'], cost: { sulfur: 40, platinum: 20 }, desc: 'Greenhouses grow twice as much; outposts grow faster.' },
    cryogenics: { era: 7, name: 'Cryogenics', k: 5600, req: ['fusion'], cost: { deuterium: 80 }, desc: 'Tier 5: the moons of Saturn and Uranus.' },
    deepSpace: { era: 7, name: 'Deep space travel', k: 7000, req: ['cryogenics'], cost: { methane: 80, crystal: 40 }, desc: 'Tier 6: Triton and Pluto.' },
    warpDrive: { era: 7, name: 'Warp drive', k: 9000, req: ['deepSpace'], cost: { crystal: 80, platinum: 60, deuterium: 60 }, desc: 'Tier 7: the legendary worlds — Vulcan, Phaeton, Nibiru and Antichthon.' },
    aetherics: { era: 7, name: 'Aetherics', k: 12000, req: ['warpDrive'], cost: { aether: 60 }, desc: 'Master the fifth element: research and production +50%.' },
  };
  // exploration tiers: technologies needed, and the cost of one colony ship
  const TIERS = {
    1: { techs: ['rocketry'], cost: { oil: 80, steel: 40 } },
    2: { techs: ['lifesupport', 'iondrive'], cost: { oil: 120, steel: 60, he3: 20 } },
    3: { techs: ['asteroidMining'], cost: { oil: 150, steel: 80, he3: 40, rareearth: 20 } },
    4: { techs: ['fusion'], cost: { oil: 150, he3: 60, platinum: 20 } },
    5: { techs: ['cryogenics'], cost: { oil: 150, he3: 80, platinum: 30, deuterium: 30 } },
    6: { techs: ['deepSpace'], cost: { he3: 100, deuterium: 60, methane: 40 } },
    7: { techs: ['warpDrive'], cost: { he3: 120, deuterium: 80, crystal: 40, methane: 40 } },
  };

  // pacing: knowledge and material costs are scaled here
  for (const id in TECHS) {
    const T = TECHS[id];
    T.k = Math.round(T.k * 0.7);
    if (T.cost) for (const k in T.cost) T.cost[k] = Math.max(2, Math.round(T.cost[k] * 0.6));
  }

  const BUILDINGS = {
    center: { name: 'Town center', tech: null, cost: {}, w: 9 },
    campfire: { name: 'Campfire', tech: 'fire', cost: { wood: 5 }, w: 5 },
    hut: { name: 'Hut', tech: 'huts', cost: { wood: 15 }, w: 9, housing: 4 },
    farm: { name: 'Farm', tech: 'agriculture', cost: { wood: 10 }, w: 16 },
    pen: { name: 'Animal pen', tech: 'domestication', cost: { wood: 20 }, w: 16 },
    mine: { name: 'Mine', tech: 'mining', cost: { wood: 25 }, w: 7 },
    smithy: { name: 'Smithy', tech: 'bronze', cost: { stone: 20, wood: 10 }, w: 9 },
    library: { name: 'Library', tech: 'writing', cost: { stone: 30, wood: 20 }, w: 11 },
    house: { name: 'Stone house', tech: 'masonry', cost: { stone: 30, wood: 20 }, w: 12, housing: 8 },
    tower: { name: 'Watchtower', tech: 'masonry', cost: { stone: 40 }, w: 5 },
    waterwheel: { name: 'Water wheel', tech: 'waterwheel', cost: { wood: 40, stone: 10 }, w: 9 },
    barracks: { name: 'Barracks', tech: 'military', cost: { wood: 40, stone: 20 }, w: 13 },
    windmill: { name: 'Windmill', tech: 'windmill', cost: { wood: 50, stone: 30 }, w: 7 },
    castle: { name: 'Castle', tech: 'castles', cost: { stone: 150 }, w: 22, housing: 12 },
    factory: { name: 'Factory', tech: 'steam', cost: { stone: 80, iron: 30 }, w: 15 },
    lamp: { name: 'Street lamp', tech: 'electricity', cost: { iron: 2, copper: 2 }, w: 1 },
    derrick: { name: 'Oil derrick', tech: 'oil', cost: { steel: 10, wood: 20 }, w: 7 },
    launchpad: { name: 'Launch pad', tech: 'rocketry', cost: { steel: 40, stone: 60 }, w: 15 },
    dish: { name: 'Satellite dish', tech: 'satellites', cost: { steel: 20, copper: 20 }, w: 7 },
    dome: { name: 'Habitat dome', tech: 'rocketry', cost: { steel: 15 }, w: 13, housing: 6, offworld: true },
    greenhouse: { name: 'Greenhouse', tech: 'rocketry', cost: { steel: 10 }, w: 11, offworld: true },
    extractor: { name: 'Extractor', tech: 'rocketry', cost: { steel: 15 }, w: 7, offworld: true },
    pod: { name: 'Alien pod', tech: null, cost: {}, w: 9, housing: 5, alien: true },
    spire: { name: 'Alien spire', tech: null, cost: {}, w: 5, alien: true },
  };

  const HUNTABLE = new Set(['deer', 'rabbit', 'hare', 'boar', 'bison', 'elk', 'moose', 'reindeer', 'goat', 'ibex', 'gazelle', 'zebra', 'wildebeest', 'warthog', 'capybara', 'turkey', 'grouse', 'muskox', 'yak', 'sheep', 'cow', 'pig', 'chicken', 'goatfarm', 'duck', 'goose', 'mammoth', 'snowhare', 'javelina', 'bighorn', 'kangaroo', 'tapir', 'camel']);
  const FISH = new Set(['smallfish', 'trout', 'salmon', 'minnow', 'cod', 'bass', 'sardine', 'mackerel', 'catfish', 'carp', 'koi', 'tuna']);
  const ORES = { copper: [M.COPPER, 'mining'], tin: [M.TIN, 'mining'], coal: [M.COAL, 'coal'], iron: [M.IRON, 'iron'], gold: [M.GOLD, 'iron'],
    he3: [M.HELIUM3, 'rocketry'], rareearth: [M.RAREEARTH, 'rocketry'], sulfur: [M.SULFUR, 'rocketry'], platinum: [M.PLATINUM, 'rocketry'], deuterium: [M.ICE, 'rocketry'], crystal: [M.CRYSTAL, 'rocketry'], aether: [M.AETHER, 'rocketry'] };
  const ROCK = new Set([M.STONE, M.SANDSTONE, M.BASALT, M.MASONRY, M.MOONROCK, M.MARSROCK]);
  const TRUNK = new Set([M.WOOD, M.BIRCH, M.BAMBOO, M.CACTUS, M.XENOWOOD]);
  const SOFT = new Set([M.DIRT, M.SOIL, M.SAND, M.GRASS, M.SNOW, M.MUD, M.DRYGRASS, M.ASH, M.TILLED, M.RUBBLE, M.REGOLITH, M.MARSDUST, M.ALIENSOIL, M.ALIENMOSS]);

  // ------------------------------------------------------------------ people
  const people = { h: ['#2a1a10', '#6a3a1a', '#d8b050', '#1a1a1a', '#a84a2a', '#8a8a8a'], f: ['#f0c8a0', '#c8946a', '#8a5a3a', '#e8b890', '#5a3a24'] };
  def('villager', { name: 'Villager', cat: 'other', hab: 'climb', civ: true, digs: true, humanoid: true, art: [['.h.', '.f.', 'sss', 'sss', '.p.', 'p.p', 'p.p'], ['.h.', '.f.', 'sss', 'sss', '.p.', '.p.', 'p.p']], pal: { h: '#2a1a10', f: '#f0c8a0', e: '#111', s: '#3a6ad8', p: '#6a4a2a', k: '#2a1a10' }, variants: people, speed: 0.6, metab: 0, breed: 0, sleeps: false, max: 400, life: 60 * 15, sense: 60 });
  def('soldier', { name: 'Soldier', cat: 'other', hab: 'climb', civ: true, soldier: true, humanoid: true, art: [['.m..w', '.f..w', 'sssfd', 'sss.d', '.p..d', 'p.p.d', 'p.p..'], ['.m..w', '.f..w', 'sssfd', 'sss.d', '.p..d', '.p..d', 'p.p..']], pal: { m: '#8a6a3a', f: '#f0c8a0', e: '#111', s: '#3a6ad8', p: '#4a3a2a', k: '#2a1a10', w: '#c8c8c8', d: '#6a4a2a' }, variants: { f: people.f }, speed: 0.7, metab: 0, breed: 0, sleeps: false, max: 300, life: 60 * 15, sense: 80 });
  // wild predators and monsters find villagers tasty
  for (const id of ['wolf', 'bear', 'bear2', 'grizzly', 'polarbear', 'lion', 'jaguar', 'cougar', 'trex', 'raptor', 'crocodile', 'alligator', 'dragon', 'troll', 'ogre', 'cyclops', 'orc', 'goblin', 'werewolf', 'hydra', 'minotaur', 'cerberus', 'sabertooth', 'komodo', 'snowleopard', 'yeti']) {
    if (S[id]) { S[id].prey = (S[id].prey || []).concat(['villager', 'soldier']); S[id].preySet = new Set(S[id].prey); }
  }
  for (const id of ['zombie', 'vampire']) if (S[id]) { S[id].prey = S[id].prey.concat(['villager']); S[id].preySet = new Set(S[id].prey); }
  DS.finalizeSpecies();
  let THREATS = new Set();
  const refreshThreats = () => { THREATS = new Set(Object.keys(S).filter((id) => S[id].preySet && (S[id].preySet.has('villager') || S[id].preySet.has('soldier')) && !S[id].civ)); };
  refreshThreats();

  // ------------------------------------------------------------------ buildings
  function template(type, col) {
    const out = [];
    const rect = (x0, y0, w, h, mat, sh) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out.push([x0 + x, y0 - y, mat, sh]); };
    const roof = (x0, y0, w, mat) => { for (let r = 0; w - r * 2 > 0; r++) for (let x = r; x < w - r; x++) out.push([x0 + x, y0 - r, mat, 0]); };
    switch (type) {
      case 'center':
        rect(4, 0, 1, 9, M.WOOD, 1);
        rect(5, -6, 3, 2, M.BANNER, col);
        rect(1, 0, 1, 1, M.STONE, 1); rect(7, 0, 1, 1, M.STONE, 1);
        break;
      case 'campfire': out.push([1, 0, M.STONE, 1], [3, 0, M.STONE, 1], [2, 0, M.ASH, 0]); break;
      case 'hut':
        for (let y = 0; y < 6; y++) { const hw = Math.round(4.5 * Math.sqrt(1 - (y / 6) ** 2)); for (let x = 4 - hw; x <= 4 + hw; x++) if (!(y < 3 && x === 4)) out.push([x, -y, M.THATCH, (x + y) & 1]); }
        break;
      case 'farm':
        rect(0, 1, 16, 1, M.TILLED, 0);
        for (let x = 1; x < 15; x += 2) { out.push([x, 0, M.WHEAT, 0], [x, -1, M.WHEAT, 0]); }
        out.push([0, 0, M.WOOD, 3], [15, 0, M.WOOD, 3]);
        break;
      case 'pen':
        for (let x = 0; x < 16; x += 3) { out.push([x, 0, M.WOOD, 3], [x, -1, M.WOOD, 3], [x, -2, M.WOOD, 3]); }
        rect(0, -2, 16, 1, M.PLANK, 1);
        break;
      case 'mine':
        rect(0, 0, 1, 5, M.WOOD, 1); rect(6, 0, 1, 5, M.WOOD, 1); rect(0, -5, 7, 1, M.WOOD, 1);
        rect(1, 1, 5, 1, M.PLANK, 0);
        break;
      case 'smithy':
        rect(0, 0, 9, 6, M.STONEBRICK, 0); rect(6, -6, 2, 3, M.MASONRY, 0);
        out.push([3, 0, M.ASH, 0]);
        roof(-1, -6, 11, M.ROOF);
        break;
      case 'library':
        rect(0, 0, 11, 1, M.CONCRETE, 0);
        for (const x of [1, 4, 6, 9]) rect(x, -1, 1, 6, M.CONCRETE, 2);
        rect(0, -7, 11, 1, M.CONCRETE, 0); roof(0, -8, 11, M.CONCRETE);
        rect(2, -1, 2, 6, M.STONEBRICK, 3); rect(7, -1, 2, 6, M.STONEBRICK, 3);
        break;
      case 'house':
        rect(0, 0, 12, 7, M.STONEBRICK, 0);
        rect(2, 0, 2, 4, M.WOOD, 2);
        for (const x of [6, 9]) rect(x, -3, 2, 2, M.GLASS, 0);
        roof(-1, -7, 14, M.ROOF);
        break;
      case 'tower':
        rect(0, 0, 5, 14, M.MASONRY, 0);
        for (const x of [0, 2, 4]) out.push([x, -14, M.MASONRY, 1]);
        out.push([2, -16, M.BANNER, col], [2, -15, M.WOOD, 1]);
        break;
      case 'waterwheel':
        rect(0, 0, 9, 8, M.PLANK, 0); roof(-1, -8, 11, M.THATCH);
        break;
      case 'barracks':
        rect(0, 0, 13, 6, M.PLANK, 1); roof(-1, -6, 15, M.ROOF);
        out.push([6, -10, M.WOOD, 1], [6, -11, M.WOOD, 1], [7, -11, M.BANNER, col], [8, -11, M.BANNER, col]);
        break;
      case 'windmill':
        rect(1, 0, 5, 12, M.STONEBRICK, 1); roof(0, -12, 7, M.ROOF);
        rect(3, 0, 1, 3, M.WOOD, 2);
        break;
      case 'castle':
        rect(0, 0, 22, 12, M.MASONRY, 0);
        for (const x of [0, 17]) rect(x, -12, 5, 6, M.MASONRY, 1);
        for (let x = 5; x < 17; x += 2) out.push([x, -12, M.MASONRY, 1]);
        rect(9, 0, 4, 6, M.WOOD, 2);
        out.push([2, -18, M.BANNER, col], [19, -18, M.BANNER, col]);
        break;
      case 'factory':
        rect(0, 0, 15, 9, M.BRICK, 0);
        for (const x of [2, 6, 10]) rect(x, -3, 2, 3, M.GLASS, 1);
        rect(11, -9, 2, 7, M.BRICK, 2); rect(3, -9, 2, 5, M.BRICK, 2);
        break;
      case 'lamp':
        rect(0, 0, 1, 7, M.METAL, 2); out.push([0, -7, M.LAMP, 0]);
        break;
      case 'derrick':
        for (let y = 0; y < 12; y++) { const d = Math.round((12 - y) / 4); out.push([3 - d, -y, M.METAL, 2], [3 + d, -y, M.METAL, 2]); if (y % 3 === 0) for (let x = 3 - d; x <= 3 + d; x++) out.push([x, -y, M.METAL, 2]); }
        out.push([3, -12, M.METAL, 2]);
        break;
      case 'launchpad':
        rect(0, 0, 15, 1, M.CONCRETE, 1);
        rect(12, -1, 1, 15, M.METAL, 2); rect(13, -1, 1, 15, M.METAL, 2);
        for (const y of [-5, -9, -13]) rect(9, y, 3, 1, M.METAL, 2);
        out.push([12, -16, M.LAMP, 0]);
        break;
      case 'dish':
        rect(3, 0, 1, 4, M.METAL, 2);
        for (let x = 0; x < 7; x++) out.push([x, -4 - Math.round(Math.abs(x - 3) ** 2 / 4), M.METAL, 3]);
        out.push([3, -7, M.LAMP, 0]);
        break;
      case 'dome':
        for (let x = 0; x < 13; x++) { const hh = Math.round(Math.sqrt(Math.max(0, 1 - ((x - 6) / 6.5) ** 2)) * 7); out.push([x, 0, M.METAL, 2], [x, -hh, M.GLASS, 0]); if (x === 0 || x === 12) for (let y = 1; y < hh; y++) out.push([x, -y, M.GLASS, 0]); }
        out.push([6, -8, M.BANNER, col], [6, -7, M.METAL, 2]);
        break;
      case 'greenhouse':
        rect(0, 0, 11, 1, M.METAL, 2);
        rect(0, -1, 1, 4, M.GLASS, 0); rect(10, -1, 1, 4, M.GLASS, 0); rect(0, -5, 11, 1, M.GLASS, 0);
        for (let x = 2; x < 10; x += 2) out.push([x, -1, M.WHEAT, 0], [x, -2, M.WHEAT, 0]);
        break;
      case 'extractor':
        rect(2, 0, 3, 9, M.METAL, 2); rect(0, 0, 7, 1, M.METAL, 2); out.push([3, -9, M.LAMP, 0]);
        break;
      case 'pod':
        for (let x = 0; x < 9; x++) { const hh = Math.round(Math.sqrt(Math.max(0, 1 - ((x - 4) / 4.5) ** 2)) * 6); for (let y = 0; y <= hh; y++) out.push([x, -y, y === hh || x === 0 || x === 8 ? M.CRYSTAL : y === 3 && x % 3 === 1 ? M.GLASS : M.XENOWOOD, 0]); }
        out.push([4, -7, M.BANNER, col]);
        break;
      case 'spire':
        for (let y = 0; y < 16; y++) { const d = y < 10 ? 2 : y < 14 ? 1 : 0; for (let x = 2 - d; x <= 2 + d; x++) out.push([x, -y, M.CRYSTAL, 0]); }
        out.push([2, -16, M.XENOBULB, 0]);
        break;
    }
    // build bottom-up
    return out.sort((a, b) => b[1] - a[1]);
  }

  class Colony {
    constructor(civ, o) {
      Object.assign(this, o);
      this.civ = civ;
      this.planet = o.planet || 'earth';
      // resources, knowledge and techs are shared by all towns of one people (across planets)
      if (!this.emp) {
        const res = { food: 40, wood: 40 };
        for (const [k] of RES) if (res[k] == null) res[k] = 0;
        this.emp = { res, knowledge: 0, techs: new Set(), era: 0, research: null, autoResearch: true, home: this };
      }
      this.buildings = [];
      this.weights = { food: 3, wood: 2, stone: 1, mining: 1, research: 2, build: 2, military: 1 };
      this.markers = {};
      this.t = 0;
      this.pop = 0;
      this.soldiers = 0;
      this.alive = true;
      this.autoBuild = true;
      this.raidT = 60 * 60 * (o.isPlayer ? 99 : U.rand(5, 9));
      this.raid = null;
      this.ore = {};
      this.oreT = 0;
    }
    get res() { return this.emp.res; }
    get knowledge() { return this.emp.knowledge; }
    set knowledge(v) { this.emp.knowledge = v; }
    get techs() { return this.emp.techs; }
    get era() { return this.emp.era; }
    set era(v) { this.emp.era = v; }
    get research() { return this.emp.research; }
    set research(v) { this.emp.research = v; }
    get autoResearch() { return this.emp.autoResearch; }
    set autoResearch(v) { this.emp.autoResearch = v; }
    get offworld() { return this.planet !== 'earth'; }
    get kinds() { return this.species || { worker: 'villager', soldier: 'soldier' }; }
    has(t) { return this.techs.has(t); }
    get housing() { return 8 + this.buildings.reduce((s, b) => s + (b.done && BUILDINGS[b.type].housing || 0), 0); }
    built(type) { return this.buildings.filter((b) => b.type === type).length; }
    hasBuilt(type) { return this.buildings.some((b) => b.type === type && b.done); }
    gatherMult() {
      let m = 1;
      if (this.has('tools')) m *= 1.3;
      if (this.has('bronze')) m *= 1.3;
      if (this.has('iron')) m *= 1.3;
      if (this.has('steel')) m *= 1.2;
      if (this.hasBuilt('waterwheel')) m *= 1.25;
      if (this.hasBuilt('factory')) m *= 1.5;
      if (this.has('robotics')) m *= 1.4;
      if (this.has('fusion')) m *= 1.3;
      if (this.has('aetherics')) m *= 1.5;
      return m;
    }
    foodMult() { return this.gatherMult() * (this.has('fire') ? 1.2 : 1) * (this.hasBuilt('windmill') ? 1.3 : 1) * (this.has('combustion') ? 1.25 : 1); }
    researchMult() { return (this.hasBuilt('library') ? 1.5 : 1) * (this.has('astronomy') ? 1.5 : 1) * (this.has('computers') ? 1.5 : 1) * (this.hasBuilt('dish') ? 1.25 : 1) * (this.has('aetherics') ? 1.5 : 1); }
    speedMult() { return (this.has('wheel') ? 1.2 : 1) * (this.has('railways') ? 1.3 : 1) * (this.has('combustion') ? 1.2 : 1); }
    strength(c) {
      let s = 1 + this.era * 0.6;
      if (c.sp.soldier) s += 2;
      if (this.has('bronze')) s += 0.5;
      if (this.has('steel')) s += 1;
      if (this.has('gunpowder') && c.sp.soldier) s += 3;
      if (this.has('robotics') && c.sp.soldier) s += 3;
      return s;
    }
    canAfford(cost) { return Object.entries(cost || {}).every(([k, v]) => (this.res[k] || 0) >= v); }
    pay(cost) { for (const [k, v] of Object.entries(cost || {})) this.res[k] -= v; }
    available(id) {
      const t = TECHS[id];
      return !this.has(id) && t.era <= this.era && (t.req || []).every((r) => this.has(r));
    }
    eraName() { return ERAS[this.era].name; }
  }

  // ------------------------------------------------------------------ brains (called from creatures.js)
  const Brain = {
    canDig(c, t) {
      const col = c.colony;
      if (!col || t === M.BEDROCK || t === M.EMPTY) return false;
      const job = c.job;
      const soft = SOFT.has(t) || MP.dig[t];
      if (job === 'mine' || job === 'quarry') {
        if (soft) return true;
        if (ROCK.has(t)) return col.has('tools');
        for (const k in ORES) if (ORES[k][0] === t) return col.has(ORES[k][1]);
        return false;
      }
      return soft && c.bumps > 6;
    },
    dug(c, eco, t) {
      const col = c.colony;
      if (!col) return;
      if (c.job === 'mine' || c.job === 'quarry') {
        let res = null;
        for (const k in ORES) if (ORES[k][0] === t) res = k;
        if (!res && ROCK.has(t) && col.has('tools')) res = 'stone';
        if (res && !c.load) {
          if (c.job === 'mine' && res === 'stone') { col.res.stone += 0.25; return; }
          c.load = { res, amt: res === 'stone' ? 3 : 2 };
          c.carry = t;
          Brain.goHome(c);
        }
      }
    },
    goHome(c) {
      const col = c.colony;
      c.phase = 'return';
      c.tx = col.x + U.randInt(-3, 3);
      c.ty = col.civ.world.groundY(c.tx) - 1;
      c.arrived = false;
      c.goalT = 0;
      c.goal = 'wander';
    },

    decide(c, eco) {
      const col = c.colony;
      const W = eco.world;
      if (!col || !col.alive) { c.die(eco, 'lost', true); return; }
      c.goal = 'wander';
      // flee from wild animals and monsters
      if (!c.sp.soldier) {
        const p = eco.nearest(c, 22, (o) => THREATS.has(o.sp.id) && !o.sleep || (o.sp.soldier && o.colony && o.colony !== col));
        if (p) { c.phase = 'flee'; c.tx = col.x; c.ty = W.groundY(col.x) - 1; c.load = c.load || null; c.goalT = 0; return; }
        if (c.phase === 'flee') c.phase = null;
      }
      if (c.sp.soldier) return Brain.soldier(c, eco);
      if (c.phase && c.goalT < 900 && !c.arrived) return;
      if (c.phase === 'work' && c.arrived) return; // waiting at a site (handled in after)
      if (c.load) { Brain.goHome(c); return; }
      // night: go home
      if (eco.daylight < 0.15 && Math.abs(c.x - col.x) > 12) { c.job = 'rest'; c.phase = 'go'; c.tx = col.x + U.randInt(-8, 8); c.ty = W.groundY(c.tx) - 1; c.arrived = false; c.goalT = 0; return; }
      Brain.pickJob(c, eco);
    },

    pickJob(c, eco) {
      const col = c.colony, W = eco.world;
      const w = col.weights;
      const needFood = col.res.food < col.pop * 4 ? 2.5 : 1;
      const next = col.research ? TECHS[col.research].k : 60 * (col.era + 1);
      // whatever blocks the current research or the next building is wanted more
      const need = {};
      const want = [col.research && TECHS[col.research].cost, col.wanted && BUILDINGS[col.wanted].cost];
      for (const cost of want) for (const k in cost || {}) if (col.res[k] < cost[k]) need[k] = 3;
      const ore = ['copper', 'tin', 'coal', 'iron', 'gold'].some((k) => need[k]) ? 3 : 1;
      const opts = [['food', w.food * needFood], ['wood', w.wood * (col.res.wood < 30 ? 1.5 : 1) * (need.wood || 1)], ['research', w.research * (col.knowledge > next ? 0.25 : 1)]];
      if (col.has('tools')) opts.push(['quarry', w.stone * (col.res.stone < 30 ? 1.3 : 0.8) * (need.stone || 1)]);
      if (col.has('mining') && col.hasBuilt('mine')) opts.push(['mine', w.mining * 1.5 * ore]);
      if (col.buildings.some((b) => !b.done)) opts.push(['build', w.build * 2]);
      const job = U.weighted(opts.filter((o) => o[1] > 0));
      c.job = job;
      c.phase = 'go';
      c.arrived = false;
      c.goalT = 0;
      c.waitT = 0;
      c.bumps = 0;
      const mk = (type) => col.markers[type] && col.markers[type].t > 0 ? col.markers[type] : null;
      const near = (type) => mk(type) || { x: col.x, y: W.groundY(col.x) };
      const R = 70 + col.era * 25;
      switch (job) {
        case 'food': {
          // farms first, then pens' animals, berries, hunting, fishing
          const farm = col.buildings.find((b) => b.type === 'farm' && b.done && b.ripe);
          if (farm) { c.job = 'farm'; c.site = farm; return Brain.to(c, farm.x + U.randInt(1, 14), farm.g - 1); }
          const r = Math.random();
          if (col.has('hunting') && r < 0.45) {
            const m = near('hunt');
            const prey = eco.nearest({ x: m.x, cy: m.y, sp: {} }, R, (o) => HUNTABLE.has(o.sp.id) && !o.home && o.sp.hab !== 'water' && !o.dead);
            if (prey) { c.job = 'hunt'; c.target = prey; return Brain.to(c, prey.x, prey.y); }
          }
          if (col.has('domestication') && r < 0.6) {
            const animal = eco.list.find((o) => o.home && o.home.col === col && !o.dead && (eco.count[o.sp.id] || 0) > 2 && Math.random() < 0.3);
            if (animal) { c.job = 'hunt'; c.target = animal; return Brain.to(c, animal.x, animal.y); }
          }
          if (col.has('fishing') && r < 0.8) {
            const spot = Brain.findWaterEdge(W, near('hunt').x, R);
            if (spot) { c.job = 'fish'; return Brain.to(c, spot[0], spot[1]); }
          }
          const b = Brain.findCell(W, near('gather').x, R, (t) => t === M.BERRY || t === M.FUNGUS || t === M.FLOWER && Math.random() < 0.1);
          if (b) { c.job = 'berries'; return Brain.to(c, b[0], b[1]); }
          const prey = eco.nearest({ x: col.x, cy: W.groundY(col.x), sp: {} }, R, (o) => (o.sp.id === 'rabbit' || o.sp.id === 'chicken' || o.sp.id === 'mouse' || o.sp.id === 'hare') && !o.dead);
          if (prey) { c.job = 'hunt'; c.target = prey; return Brain.to(c, prey.x, prey.y); }
          // forage roots, nuts and herbs on open ground
          c.job = 'forage';
          let fx = col.x;
          for (let k = 0; k < 8; k++) { const xx = U.clamp(Math.round(near('gather').x + U.rand(-R * 0.6, R * 0.6)), 2, W.w - 3); if (Brain.safe(W, xx)) { fx = xx; break; } }
          return Brain.to(c, fx, W.groundY(fx) - 1);
        }
        case 'wood': return Brain.pickWood(c, eco, near('gather'), R);
        case 'quarry': {
          const m = near('mine');
          const s = Brain.findCell(W, m.x, R, (t) => ROCK.has(t) && t !== M.MASONRY, true);
          if (s) return Brain.to(c, s[0], s[1]);
          // dig down near the town
          return Brain.to(c, col.x + U.randInt(-30, 30), W.floorY(col.x) + U.randInt(6, 14));
        }
        case 'mine': {
          const target = Brain.pickOre(col, eco);
          if (target) return Brain.to(c, target[0], target[1]);
          c.job = 'quarry';
          return Brain.to(c, col.x + U.randInt(-25, 25), W.floorY(col.x) + U.randInt(8, 20));
        }
        case 'build': {
          const site = col.buildings.find((b) => !b.done);
          c.site = site;
          return Brain.to(c, site.x + U.randInt(0, BUILDINGS[site.type].w - 1), site.g - 1);
        }
        case 'research': {
          const lib = col.buildings.find((b) => b.type === 'library' && b.done) || col.buildings.find((b) => b.type === 'center');
          return Brain.to(c, (lib ? lib.x + 2 : col.x) + U.randInt(0, 5), (lib ? lib.g : W.groundY(col.x)) - 1);
        }
      }
    },

    pickWood(c, eco, m, R) {
      const W = eco.world;
      const t = Brain.findTree(W, m.x, R * 2.5, c.colony.civ);
      if (t) { c.job = 'wood'; return Brain.to(c, t[0], t[1]); }
      // no trees left: gather brushwood and driftwood
      c.job = 'brush';
      let x = c.colony.x;
      for (let k = 0; k < 8; k++) { const xx = U.clamp(Math.round(m.x + U.rand(-R, R)), 2, W.w - 3); if (Brain.safe(W, xx)) { x = xx; break; } }
      return Brain.to(c, x, W.groundY(x) - 1);
    },

    to(c, x, y) {
      c.tx = U.clamp(Math.round(x), 2, c.colony.civ.world.w - 3);
      c.ty = Math.round(y);
      c.arrived = false;
      c.goalT = 0;
    },

    // nearest standing trunk, scanning outward; skips anything built by a colony
    findTree(W, cx, R, civ) {
      const off = Math.random() < 0.5 ? 1 : -1;
      for (let d = 0; d <= R; d++) for (const sgn of [off, -off]) {
        const x = Math.round(cx + d * sgn);
        if (x < 2 || x > W.w - 3 || (d === 0 && sgn === -off)) continue;
        const g = W.floorY(x);
        const t = W.get(x, g - 1);
        if (TRUNK.has(t) && TRUNK.has(W.get(x, g - 3)) && !(civ && Brain.built(civ, x)) && Brain.safe(W, x)) return [x, g - 1];
      }
      return null;
    },

    // no toxic pools, lava or deep water underfoot nearby
    safe(W, x) {
      for (let dx = -4; dx <= 4; dx += 2) {
        const xx = U.clamp(x + dx, 0, W.w - 1), g = W.groundY(xx), t = W.get(xx, g);
        if (t === M.TOXIC || t === M.LAVA || t === M.FIRE || t === M.ACID || (W.isLiquid(xx, g) && (dx === 0 || W.isLiquid(xx, g + 2)))) return false;
      }
      return true;
    },

    built(civ, x) {
      for (const col of civ.here()) for (const b of col.buildings) if (x >= b.x - 2 && x <= b.x + BUILDINGS[b.type].w + 1) return true;
      return false;
    },

    findCell(W, cx, R, test, exposed) {
      for (let k = 0; k < 50; k++) {
        const x = U.clamp(Math.round(cx + U.rand(-R, R)), 2, W.w - 3);
        let y = 0;
        while (y < W.h - 1 && (W.get(x, y) === M.EMPTY || MP.kind[W.get(x, y)] === DS.KIND.gas)) y++;
        if (!Brain.safe(W, x)) continue;
        for (let d = 0; d < 6; d++) if (test(W.get(x, y + d))) return [x, y + d];
        if (exposed) {
          const f = W.floorY(x);
          if (test(W.get(x, f))) return [x, f];
        }
      }
      return null;
    },

    findWaterEdge(W, cx, R) {
      for (let k = 0; k < 40; k++) {
        const x = U.clamp(Math.round(cx + U.rand(-R, R)), 3, W.w - 4);
        const g = W.groundY(x);
        if (!W.isLiquid(x, g)) continue;
        for (const d of [-1, 1]) for (let s = 1; s < 8; s++) {
          const nx = x + d * s, ng = W.groundY(nx);
          if (!W.isLiquid(nx, ng) && Math.abs(ng - g) < 4) return [nx, ng - 1];
        }
      }
      return null;
    },

    pickOre(col, eco) {
      const W = eco.world;
      if (col.oreT <= 0) {
        // scan around the town for ore veins
        col.oreT = 60 * 60;
        col.ore = {};
        const x0 = Math.max(0, col.x - 160), x1 = Math.min(W.w, col.x + 160);
        for (let x = x0; x < x1; x += 2) for (let y = W.floorY(x); y < W.h - 1; y += 2) {
          const t = W.get(x, y);
          for (const k in ORES) if (ORES[k][0] === t) (col.ore[k] = col.ore[k] || []).push([x, y]);
        }
      }
      const kinds = Object.keys(ORES).filter((k) => col.has(ORES[k][1]) && col.ore[k] && col.ore[k].length);
      if (!kinds.length) return null;
      // dig for what is scarcest
      kinds.sort((a, b) => col.res[a] - col.res[b]);
      const k = Math.random() < 0.6 ? kinds[0] : U.pick(kinds);
      const m = col.markers.mine && col.markers.mine.t > 0 ? col.markers.mine : { x: col.x, y: W.floorY(col.x) };
      let best = null, bd = 1e9;
      for (let i = 0; i < 30; i++) {
        const p = U.pick(col.ore[k]);
        if (W.get(p[0], p[1]) !== ORES[k][0]) continue;
        const d = Math.abs(p[0] - m.x) + Math.abs(p[1] - m.y) * 1.5;
        if (d < bd) { bd = d; best = p; }
      }
      return best;
    },

    soldier(c, eco) {
      const col = c.colony, W = eco.world;
      const enemy = eco.nearest(c, c.sp.sense, (o) => (o.sp.civ && o.colony && o.colony !== col && o.colony.alive) || (THREATS.has(o.sp.id) && Math.abs(o.x - col.x) < 90));
      if (enemy) { c.job = 'fight'; c.target = enemy; return Brain.to(c, enemy.x, enemy.y); }
      c.target = null;
      if (col.raid && col.raid.alive) { c.job = 'raid'; return Brain.to(c, col.raid.x + U.randInt(-6, 6), W.groundY(col.raid.x) - 1); }
      const m = col.markers.attack && col.markers.attack.t > 0 ? col.markers.attack : null;
      if (m) { c.job = 'rally'; return Brain.to(c, m.x + U.randInt(-5, 5), m.y); }
      if (c.arrived || c.goalT > 900 || c.job !== 'patrol') { c.job = 'patrol'; const x = col.x + U.randInt(-60, 60); Brain.to(c, x, W.groundY(U.clamp(x, 0, W.w - 1)) - 1); }
    },

    after(c, eco) {
      const col = c.colony;
      if (!col) return;
      const W = eco.world;
      // follow moving targets
      if ((c.job === 'hunt' || c.job === 'fight') && c.target) {
        const t = c.target;
        if (t.dead) { c.target = null; c.job = null; c.phase = null; c.thinkT = 0; return; }
        c.tx = Math.round(t.x); c.ty = Math.round(t.y);
        if (Math.abs(t.x - c.x) < 2.5 && Math.abs(t.cy - c.cy) < 4) {
          if (c.job === 'hunt') {
            eco.kill(t, null);
            c.load = { res: 'food', amt: Math.max(3, Math.round(t.sp.w / 2)) * col.foodMult() };
            c.carry = M.BERRY;
            Brain.goHome(c);
          } else Brain.fight(c, t, eco);
        }
        return;
      }
      if (Math.hypot(c.tx - c.x, c.ty - c.y) > 1.8) {
        if (c.goalT > 1500) { c.phase = null; c.job = null; c.thinkT = 0; }
        return;
      }
      c.arrived = true;
      if (c.phase === 'return') {
        if (c.load) { col.res[c.load.res] = (col.res[c.load.res] || 0) + c.load.amt; c.load = null; c.carry = 0; }
        c.phase = null; c.job = null; c.thinkT = 0;
        return;
      }
      if (c.sp.soldier) {
        if (c.job === 'raid' && col.raid) Brain.plunder(col, col.raid, eco);
        c.thinkT = 0;
        return;
      }
      const mult = col.gatherMult();
      switch (c.job) {
        case 'wood': {
          let n = 0;
          const civ = col.civ;
          for (let dx = -3; dx <= 3; dx++) {
            if (Brain.built(civ, c.tx + dx)) continue;
            for (let dy = -24; dy <= 1; dy++) {
              const t = W.get(c.tx + dx, c.ty + dy);
              if (TRUNK.has(t)) { W.set(c.tx + dx, c.ty + dy, M.EMPTY); n++; }
            }
          }
          for (let dx = -8; dx <= 8; dx++) if (!Brain.built(civ, c.tx + dx)) for (let dy = -30; dy <= 0; dy++) {
            const t = W.get(c.tx + dx, c.ty + dy);
            if ((t === M.LEAF || t === M.NEEDLE || t === M.AUTUMN || t === M.BLOSSOM || t === M.VINE) && Math.random() < 0.7) W.set(c.tx + dx, c.ty + dy, Math.random() < 0.2 ? M.LITTER : M.EMPTY);
          }
          if (n && W.get(c.tx, c.ty + 1) !== M.EMPTY && Math.random() < 0.7) W.set(c.tx, c.ty, M.SEED);
          if (n) { c.load = { res: 'wood', amt: Math.max(4, n * 1.2) * mult }; c.carry = M.WOOD; eco.fx.burst(c.tx, c.ty - 2, ['#7a5030', '#5a3a20'], 6, 0.6); }
          return n ? Brain.goHome(c) : (c.thinkT = 0, c.phase = null);
        }
        case 'berries': {
          let n = 0;
          for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const t = W.get(c.tx + dx, c.ty + dy); if (t === M.BERRY || t === M.FUNGUS || t === M.FLOWER) { W.set(c.tx + dx, c.ty + dy, M.EMPTY); n++; } }
          if (n) { c.load = { res: 'food', amt: (1 + n * 0.5) * col.foodMult() }; c.carry = M.BERRY; return Brain.goHome(c); }
          c.phase = null; c.thinkT = 0;
          return;
        }
        case 'quarry': case 'mine': {
          // dig the target cell if it is still there
          const t = W.get(c.tx, c.ty);
          if (t !== M.EMPTY && Brain.canDig(c, t)) { W.set(c.tx, c.ty, M.EMPTY); Brain.dug(c, eco, t); }
          if (!c.load) { c.phase = null; c.thinkT = 0; }
          return;
        }
        case 'fish': case 'farm': case 'research': case 'build': case 'rest': case 'forage': case 'brush': {
          c.phase = 'work';
          c.waitT = (c.waitT || 0) + 1;
          if (c.job === 'brush' && c.waitT > 240) { c.load = { res: 'wood', amt: 3 * mult }; c.carry = M.WOOD; c.waitT = 0; Brain.goHome(c); }
          else if (c.job === 'forage' && c.waitT > 200) { const wet = W.isLiquid(c.x, c.y + 1); c.load = wet ? null : { res: 'food', amt: 2 * col.foodMult() }; c.waitT = 0; if (c.load) { c.carry = M.BERRY; Brain.goHome(c); } else { c.phase = null; c.thinkT = 0; } }
          else if (c.job === 'fish' && c.waitT > 300) { c.load = { res: 'food', amt: 3 * col.foodMult() * (col.has('fishing') ? 1 : 0.3) }; c.carry = M.BERRY; c.waitT = 0; Brain.goHome(c); }
          else if (c.job === 'farm' && c.waitT > 120) { const f = c.site; if (f && f.ripe) { f.ripe = false; f.grow = 0; Brain.setCrop(W, f, 0); c.load = { res: 'food', amt: 12 * col.foodMult() }; c.carry = M.WHEAT; Brain.goHome(c); } else { c.phase = null; c.thinkT = 0; } }
          else if (c.job === 'research' && c.waitT > 240) { col.knowledge += 2.5 * col.researchMult(); c.waitT = 0; c.phase = null; c.thinkT = 0; if (Math.random() < 0.3) eco.fx.glyph(c.x, c.y - 10, 'bang', '#80e0ff'); }
          else if (c.job === 'build' && c.waitT % 15 === 0) {
            const b = c.site;
            if (!b || b.done) { c.phase = null; c.thinkT = 0; return; }
            col.civ.progress(col, b, 1);
            eco.fx.add(c.x + c.dir * 2, c.y - 3, U.rand(-0.3, 0.3), -0.4, '#d8c8a0', 10, 0.05);
          } else if (c.job === 'rest' && (c.waitT > 600 || eco.daylight > 0.25)) { c.phase = null; c.thinkT = 0; }
          return;
        }
      }
    },

    setCrop(W, f, shade) {
      for (const [x, y] of f.crops) {
        const t = W.get(x, y);
        if (t === M.WHEAT || t === M.EMPTY) W.set(x, y, M.WHEAT, 0, shade);
      }
    },

    fight(c, enemy, eco) {
      const ca = c.colony, cb = enemy.colony;
      const sa = ca.strength(c), sb = cb ? cb.strength(enemy) : Math.max(1.5, enemy.sp.w / 3);
      const loser = Math.random() < sa / (sa + sb) ? enemy : c;
      eco.fx.burst(enemy.x, enemy.cy, ['#ffffff', '#d8d8d8'], 4, 0.6);
      if (loser === enemy) eco.kill(enemy, null); else c.die(eco, 'eaten');
      c.target = null; c.job = null; c.thinkT = 0;
    },

    plunder(raider, victim, eco) {
      const W = eco.world;
      if (Math.abs(raider.civ.app.cam.x - victim.x) < 400 && victim.isPlayer) raider.civ.app.toast(`⚔️ ${raider.name} is plundering ${victim.name}!`);
      for (const k of ['food', 'wood', 'stone']) { const take = Math.min(victim.res[k], 10); victim.res[k] -= take; raider.res[k] += take; }
      const b = victim.buildings.filter((b) => b.done && b.type !== 'center');
      if (b.length && Math.random() < 0.5) { const t = U.pick(b); W.set(t.x + 2, t.g - 2, M.FIRE, 120); }
      raider.raid = null;
    },
  };

  // ------------------------------------------------------------------ manager
  const NAMES = ['Oakhaven', 'Stonebrook', 'Ashford', 'Riverend', 'Highmoor', 'Emberfall', 'Wolfden', 'Saltmarsh', 'Goldcrest', 'Thornwick', 'Mistvale', 'Redcliff'];

  class Civ {
    constructor(app, opts) {
      this.app = app;
      this.opts = opts;
      this.colonies = [];
      this.t = 0;
      this.missions = [];
      this.rockets = [];
      this.visited = new Set(['earth']);
    }
    get world() { return this.app.world; }
    get eco() { return this.app.eco; }
    get planet() { return this.app.planet || 'earth'; }
    // the player's home town (or whatever is left of the empire)
    get player() { return this.colonies.find((c) => c.isPlayer && !c.offworld && c.alive) || this.colonies.find((c) => c.isPlayer && c.alive) || this.colonies.find((c) => c.isPlayer); }
    // the player's town on the planet in view, if any
    get local() { return this.colonies.find((c) => c.isPlayer && c.alive && c.planet === this.planet) || this.player; }
    here() { return this.colonies.filter((c) => c.planet === this.planet); }

    clear() { this.colonies = []; this.missions = []; this.rockets = []; }

    start(rng) {
      refreshThreats();
      const W = this.world;
      const okZone = (z) => !z.p.ocean && !z.p.ridge && !z.p.volcano && !['mesa', 'wasteland', 'swamp', 'iceage', 'snowy', 'prehistoric'].includes(z.id);
      const GOOD = new Set(['grasslands', 'autumn', 'taiga', 'rainforest', 'bamboo', 'enchanted', 'savanna', 'lake', 'river', 'pond', 'suburbs']);
      const land = W.zones.filter(okZone);
      const n = 1 + (this.opts.enemies || 0);
      const names = NAMES.slice().sort(() => rng() - 0.5);
      const sites = [];
      const BAD = { beach: 25, swamp: 20, desert: 25, tundra: 15, wetlands: 15, volcanic: 40, badlands: 15, oasis: 5, glacier: 30 };
      const score = (x) => {
        let trunks = 0;
        for (let dx = -120; dx <= 120; dx += 2) { const xx = U.clamp(x + dx, 0, W.w - 1); if (TRUNK.has(W.get(xx, W.floorY(xx) - 1))) trunks++; }
        const z = W.zones[W.zoneIdx[x]];
        let danger = 0;
        for (const dx of [-160, -80, 80, 160]) { const zz = W.zones[W.zoneIdx[U.clamp(x + dx, 0, W.w - 1)]]; if (zz.id === 'prehistoric' || zz.p.volcano) danger += 10; }
        return Math.min(trunks, 30) - (BAD[z.id] || 0) - danger - (z.p.volcano ? 30 : 0) + rng() * 4;
      };
      const pickSite = (zoneList, avoid) => {
        let best = null, bs = -1e9;
        for (let k = 0, found = 0; k < 300 && found < 24; k++) {
          const z = zoneList[Math.floor(rng() * zoneList.length)];
          const x = Math.round(z.x0 + 40 + rng() * Math.max(1, z.x1 - z.x0 - 80));
          const g = W.floorY(x);
          if (W.isLiquid(x, W.groundY(x)) || g > W.h * 0.47) continue;
          if (avoid.some((s) => Math.abs(s - x) < W.w / (n + 1.5))) continue;
          found++;
          const sc = score(x);
          if (sc > bs) { bs = sc; best = x; }
        }
        if (best != null) return best;
        for (let k = 0; k < 400; k++) { const x = Math.round(rng() * (W.w - 40)) + 20; if (!W.isLiquid(x, W.groundY(x)) && !avoid.some((s) => Math.abs(s - x) < 80)) return x; }
        return Math.round(rng() * W.w);
      };
      const zones = land.length ? land : W.zones;
      const mid = zones.slice().sort((a, b) => Math.abs((a.x0 + a.x1) / 2 - W.w / 2) - Math.abs((b.x0 + b.x1) / 2 - W.w / 2));
      for (let i = 0; i < n; i++) {
        const good = zones.filter((z) => GOOD.has(z.id));
        const pool = i === 0 ? (good.length ? good : mid.slice(0, Math.max(1, Math.ceil(mid.length / 2)))) : (good.length > n ? good : zones);
        const x = pickSite(pool, sites);
        sites.push(x);
        this.found(x, i, i === 0 ? this.opts.name || names[0] : names[i]);
      }
      const p = this.player;
      this.app.cam.x = p.x;
      this.app.cam.y = W.groundY(p.x) - this.app.screenH * 0.25;
      this.app.clampCam();
      this.app.toast(`🏛️ ${p.name} is founded!`);
    }

    found(x, idx, name, extra) {
      const W = this.world;
      const col = new Colony(this, Object.assign({ x, name, color: idx, isPlayer: idx === 0, ai: idx !== 0, difficulty: this.opts.difficulty || 'normal', planet: this.planet }, extra || {}));
      if (col.ai) { col.weights = { food: 3, wood: 2, stone: 1.5, mining: 1.5, research: 2, build: 2, military: this.opts.difficulty === 'hard' ? 3 : this.opts.difficulty === 'peaceful' ? 0 : 1.5 }; }
      this.colonies.push(col);
      const b = this.placeBuilding(col, 'center', x);
      if (b) this.progress(col, b, 1e9);
      for (let i = 0; i < (extra && extra.people || 6); i++) this.spawnVillager(col);
      return col;
    }

    spawnVillager(col, x) {
      const W = this.world;
      x = x == null ? col.x + U.randInt(-6, 6) : x;
      const c = this.eco.spawn(col.kinds.worker, x, W.groundY(U.clamp(x, 0, W.w - 1)) - 1, {});
      if (!c) return null;
      this.dress(c, col);
      return c;
    }

    dress(c, col) {
      c.colony = col;
      c.age = 0;
      c.speedMul = col.speedMult();
      if (col.species) return; // aliens wear their own colours
      const era = Math.min(col.era, 4);
      c.vpal = Object.assign({}, c.vpal || {}, { s: COLORS[col.color], p: ['#6a4a2a', '#8a6a3a', '#4a4a52', '#3a3a6a', '#2a2a2a'][era] });
      if (col.era >= 5) Object.assign(c.vpal, { p: '#d8dce4' });
      if (c.sp.soldier) c.vpal.m = ['#8a6a3a', '#c8903a', '#9aa0a8', '#d0d8e0', '#2a3a5a', '#e8ecf0', '#e8ecf0', '#c0f0ff'][col.era];
      // space suits away from home
      if (col.offworld && !(DS.Space && DS.Space.PLANETS[col.planet] && DS.Space.PLANETS[col.planet].fertility >= 1)) Object.assign(c.vpal, { h: '#f0f4f8', f: '#80c8ff', m: '#f0f4f8' });
      c.vkey = 'civ' + col.color + '.' + col.era + '.' + Object.values(c.vpal).join(',');
      c.age = 0;
      c.speedMul = col.speedMult();
    }

    // find a flat-ish site near the town and level it
    placeBuilding(col, type, at) {
      const W = this.world;
      const bw = BUILDINGS[type].w;
      const taken = (x) => col.buildings.some((b) => x < b.x + BUILDINGS[b.type].w + 3 && x + bw + 3 > b.x) || this.colonies.some((o) => o !== col && o.planet === col.planet && Math.abs(o.x - x) < 40);
      let x = null;
      if (at != null) x = at - Math.floor(bw / 2);
      else if (type === 'waterwheel') {
        const s = Brain.findWaterEdge(W, col.x, 90);
        if (!s) return null;
        x = s[0] - Math.floor(bw / 2);
      } else {
        const m = col.markers.build && col.markers.build.t > 0 ? col.markers.build.x : col.x;
        for (let k = 0; k < 60 && x == null; k++) {
          const d = (6 + k * 4) * (k % 2 ? 1 : -1);
          const cx = Math.round(m + d);
          if (cx < 5 || cx + bw > W.w - 5 || taken(cx)) continue;
          let wet = false;
          for (let i = 0; i < bw; i++) if (W.isLiquid(cx + i, W.groundY(cx + i))) wet = true;
          if (!wet) x = cx;
        }
      }
      if (x == null) return null;
      // level the ground to the median height
      const hs = [];
      for (let i = 0; i < bw; i++) hs.push(W.floorY(x + i));
      hs.sort((a, b) => a - b);
      const g = hs[Math.floor(hs.length / 2)];
      for (let i = -1; i <= bw; i++) {
        const px = x + i;
        const f = W.floorY(px);
        for (let y = Math.min(f, g - 30); y < g; y++) { const t = W.get(px, y); if (t !== M.EMPTY && MP.kind[t] !== DS.KIND.liquid) W.set(px, y, M.EMPTY); }
        for (let y = g; y < f; y++) W.set(px, y, y === g ? M.GRASS : M.SOIL);
      }
      const cells = template(type, col.color);
      const b = { type, x, g, cells, placed: 0, progress: 0, cost: Math.max(4, cells.length / 6), done: false, grow: 0, ripe: false, t: 0 };
      if (type === 'farm') b.crops = cells.filter((c) => c[2] === M.WHEAT).map(([dx, dy]) => [x + dx, g - 1 + dy]);
      col.buildings.push(b);
      return b;
    }

    progress(col, b, amt) {
      const W = this.world;
      b.progress += amt;
      const want = Math.min(b.cells.length, Math.ceil((b.progress / b.cost) * b.cells.length));
      for (; b.placed < want; b.placed++) {
        const [dx, dy, mat, sh] = b.cells[b.placed];
        W.set(b.x + dx, b.g - 1 + dy, mat, 0, sh);
      }
      if (b.placed >= b.cells.length && !b.done) {
        b.done = true;
        if (col.isPlayer && b.type !== 'center') this.app.toast(`🔨 ${BUILDINGS[b.type].name} built`);
        if (b.type === 'pen') this.stockPen(col, b);
      }
    }

    stockPen(col, b) {
      const W = this.world;
      const kinds = ['sheep', 'cow', 'chicken', 'pig'];
      for (let i = 0; i < 3; i++) {
        const c = this.eco.spawn(U.pick(kinds), b.x + 3 + i * 4, b.g - 2, {});
        if (c) { c.home = { x: b.x + 8, r: 6, col }; c.age = c.sp.mature + 1; }
      }
      void W;
    }

    queue(col, type) {
      const B = BUILDINGS[type];
      if (B.tech && !col.has(B.tech)) return false;
      if (B.offworld && !col.offworld) return false;
      if (!col.canAfford(B.cost)) return false;
      const b = this.placeBuilding(col, type);
      if (!b) return false;
      col.pay(B.cost);
      return true;
    }

    // ------------------------------------------------------------ simulation
    update() {
      this.t++;
      const eco = this.eco, W = this.world;
      const here = this.here();
      // counts (towns on other planets keep their last census)
      for (const col of here) { col.pop = 0; col.soldiers = 0; }
      for (const c of eco.list) if (c.sp.civ && c.colony && !c.dead) { c.colony.pop++; if (c.sp.soldier) c.colony.soldiers++; }
      // research runs once per people, wherever their towns are
      const emps = new Set();
      for (const col of this.colonies) if (col.alive && !col.species && !emps.has(col.emp)) { emps.add(col.emp); if (!col.emp.home.alive) col.emp.home = col; this.researchTick(col.emp.home); }
      if (this.t % 60 === 0) for (const col of this.colonies) if (col.alive && col.planet !== this.planet) this.abstractTick(col);
      this.updateMissions();
      this.updateRockets();
      for (const col of here) {
        if (!col.alive) continue;
        col.t++;
        for (const k in col.markers) if (col.markers[k].t > 0) col.markers[k].t--;
        if (col.pop === 0) {
          col.alive = false;
          this.app.toast(col.isPlayer ? `💀 ${col.name} has fallen…` : `🏳️ ${col.name} has fallen!`);
          if (col.species && col.planet !== 'earth') this.conquered(col);
          continue;
        }
        this.colonyTick(col, eco, W);
      }
    }

    colonyTick(col, eco, W) {
      const t = col.t;
      if (col.oreT > 0) col.oreT--;
      // growth
      if (t % 600 === 0 && col.res.food >= 12 + col.pop * 2 && col.pop < col.housing && eco.list.length < eco.cap) {
        col.res.food -= 12;
        const c = this.spawnVillager(col);
        if (c) eco.fx.glyph(c.x, c.y - 10, 'heart', '#ff8aa8');
      }
      // eating
      if (t % 1800 === 0) {
        col.res.food -= col.pop * 0.7 * (col.has('pottery') ? 0.8 : 1);
        if (col.res.food < 0) {
          col.res.food = 0;
          const v = Math.random() < 0.5 && eco.list.find((c) => c.colony === col && !c.sp.soldier && !c.dead);
          if (v) { v.die(eco, 'starve'); if (col.isPlayer) this.app.toast('😟 Your people are starving!'); }
        }
      }
      // passive knowledge and pens
      if (t % 60 === 0) {
        col.knowledge += col.pop * 0.03 * col.researchMult();
        col.res.food += col.built('pen') * 0.12 + (col.hasBuilt('farm') ? 0 : 0);
      }
      // the town's fires and noise keep most wild beasts at bay
      if (t % 20 === 0) {
        const R = 45 + col.era * 12;
        for (const o of eco.list) {
          if (o.dead || o.sp.civ || !THREATS.has(o.sp.id) || Math.abs(o.x - col.x) > R || Math.random() < 0.25) continue;
          // a beast in the middle of town gets mobbed by the townsfolk
          if (Math.abs(o.x - col.x) < 16 && col.pop >= 4 && Math.random() < 0.12 + col.era * 0.03) {
            eco.fx.burst(o.x, o.cy, ['#ffffff', '#d8d8d8', '#ffd040'], 10, 0.8);
            if (col.isPlayer && col.planet === this.planet) this.app.toast(`🔥 The people of ${col.name} drove off a ${o.sp.name}!`);
            eco.kill(o, null);
            continue;
          }
          const away = Math.sign(o.x - col.x) || 1;
          o.goal = 'flee'; o.goalT = 0; o.target = null; o.threat = { dead: false, x: col.x, y: o.y };
          o.dir = away; o.tx = o.x + away * 70;
        }
      }
      // farms ripen
      for (const b of col.buildings) {
        if (b.type === 'farm' && b.done && !b.ripe && ++b.grow > 2400) { b.ripe = true; Brain.setCrop(W, b, 2); }
        if (b.type === 'factory' && b.done && t % 20 === 0) for (const dx of [3, 11]) if (W.get(b.x + dx, b.g - 11) === M.EMPTY) W.set(b.x + dx, b.g - 11, M.SMOKE);
        if ((b.type === 'tower' || b.type === 'spire') && b.done && t % 50 === 0) this.towerShoot(col, b, eco);
        if (!b.done) continue;
        if (b.type === 'derrick' && t % 300 === 0) {
          col.res.oil += 3 * col.gatherMult();
          // the pump draws on real oil deposits below if there are any
          for (let y = b.g; y < W.h - 1; y += 3) if (W.get(b.x + 3, y) === M.OIL) { W.set(b.x + 3, y, M.STONE); col.res.oil += 2; break; }
        }
        if (b.type === 'greenhouse' && t % 300 === 0) col.res.food += 3 * (col.has('terraforming') ? 2 : 1);
        if (b.type === 'extractor' && t % 400 === 0 && DS.Space) { const P = DS.Space.PLANETS[col.planet]; if (P) for (const r of P.res) col.res[r] += 1.5 * col.gatherMult(); }
        if (b.type === 'pod' && t % 300 === 0) col.res.food += 2;
      }
      // smithy: bronze and steel
      if (t % 900 === 0 && col.hasBuilt('smithy')) {
        if (col.has('bronze') && col.res.copper >= 1 && col.res.tin >= 1) { col.res.copper--; col.res.tin--; col.res.bronze += 2; }
        if (col.has('steel') && col.res.iron >= 1 && col.res.coal >= 1) { col.res.iron--; col.res.coal--; col.res.steel += 2; }
      }
      // building
      if (t % 300 === 0 && (col.ai || col.autoBuild) && !col.buildings.some((b) => !b.done)) {
        const want = this.wantBuilding(col);
        // don't spend what the current research is waiting for, unless people need roofs
        const T = col.research && TECHS[col.research];
        const clash = T && T.cost && want && Object.keys(BUILDINGS[want].cost).some((k) => T.cost[k] && col.res[k] - BUILDINGS[want].cost[k] < T.cost[k]);
        if (want && (!clash || ((want === 'hut' || want === 'house') && col.pop >= col.housing))) this.queue(col, want);
      }
      // soldiers
      if (t % 600 === 0 && ((col.has('military') && col.hasBuilt('barracks')) || (col.species && col.hasBuilt('spire')))) {
        const share = col.weights.military / Object.values(col.weights).reduce((a, b) => a + b, 0);
        const want = Math.max(2, Math.round(col.pop * share * 1.3));
        if (col.soldiers < want && col.pop > 6) {
          const v = eco.list.find((c) => c.colony === col && !c.sp.soldier && !c.dead && !c.load);
          if (v) {
            const s = eco.spawn(col.kinds.soldier, v.x, v.y, {});
            if (s) { this.dress(s, col); v.die(eco, 'lost', true); }
          }
        }
      }
      // AI raids
      if (col.ai && col.difficulty !== 'peaceful' && col.soldiers >= (col.difficulty === 'hard' ? 3 : 5) && --col.raidT <= 0) {
        col.raidT = 60 * 60 * U.rand(col.difficulty === 'hard' ? 3 : 5, col.difficulty === 'hard' ? 5 : 9);
        const targets = this.colonies.filter((o) => o !== col && o.alive && o.planet === col.planet && !(o.species && col.species));
        if (targets.length) {
          col.raid = targets.find((o) => o.isPlayer && o.alive) || U.pick(targets);
          if (col.raid.isPlayer) this.app.toast(`⚔️ ${col.name} is sending raiders against you!`);
        }
      }
      if (col.raid && t % 3600 === 0) col.raid = null;
    }

    researchTick(col) {
      const t = this.t;
      if (!col.research && (col.ai || col.autoResearch)) col.research = this.chooseResearch(col);
      if (col.research) {
        const T = TECHS[col.research];
        if (col.has(col.research)) col.research = null;
        else if (col.knowledge >= T.k && !col.canAfford(T.cost) && (col.ai || col.autoResearch) && t % 600 === 0) {
          // stuck waiting for materials: try something we can afford meanwhile
          const alt = Object.keys(TECHS).filter((id) => col.available(id) && col.canAfford(TECHS[id].cost) && TECHS[id].k <= col.knowledge).sort((a, b) => TECHS[a].k - TECHS[b].k)[0];
          if (alt) col.research = alt;
        } else if (col.knowledge >= T.k && col.canAfford(T.cost)) {
          col.knowledge -= T.k;
          col.pay(T.cost);
          this.learn(col, col.research);
          col.research = null;
        }
      }
    }

    // a town on another planet keeps working while nobody watches
    abstractTick(col) {
      if (col.species || !col.isPlayer) return;
      const k = col.pop * 0.012 * col.gatherMult();
      col.knowledge += col.pop * 0.03 * col.researchMult();
      const P = DS.Space && DS.Space.PLANETS[col.planet];
      const list = col.planet === 'earth' ? ['food', 'wood', 'stone'].concat(Object.keys(ORES).filter((r) => ORES[r][0] !== M.ICE && col.has(ORES[r][1]) && !P)) : (P ? P.res : []);
      for (const r of list) col.res[r] = (col.res[r] || 0) + k * (r === 'food' ? 1.2 : 0.5);
      if (col.planet !== 'earth') col.res.food += col.built('greenhouse') * 0.3;
      if (col.hasBuilt('derrick')) col.res.oil += col.built('derrick') * 0.4 * col.gatherMult();
      if (col.hasBuilt('smithy') && col.has('steel') && col.res.iron >= 1 && col.res.coal >= 1 && this.t % 900 < 60) { col.res.iron--; col.res.coal--; col.res.steel += 2; }
    }

    towerShoot(col, b, eco) {
      const tx = b.x + 2, ty = b.g - 15;
      const range = col.has('castles') ? 60 : 40;
      const enemy = eco.nearest({ x: tx, cy: ty, sp: {} }, range, (o) => (o.sp.civ && o.colony && o.colony !== col && !(o.colony.species && col.species)) || THREATS.has(o.sp.id));
      if (!enemy) return;
      const steps = 10;
      for (let i = 0; i < steps; i++) eco.fx.add(U.lerp(tx, enemy.x, i / steps), U.lerp(ty, enemy.cy, i / steps), 0, 0, '#e8e0c8', 4, 0);
      if (Math.random() < 0.5) eco.kill(enemy, null);
    }

    chooseResearch(col) {
      const avail = Object.keys(TECHS).filter((id) => col.available(id));
      if (!avail.length) return null;
      avail.sort((a, b) => TECHS[a].k - TECHS[b].k);
      return col.ai ? avail[Math.floor(Math.random() * Math.min(2, avail.length))] : avail[0];
    }

    learn(col, id) {
      col.techs.add(id);
      if (col.isPlayer) this.app.toast(`💡 ${col.name} discovered ${TECHS[id].name}!`);
      const learnt = Object.keys(TECHS).filter((k) => col.has(k) && TECHS[k].era === col.era).length;
      if (col.era < ERAS.length - 1 && learnt >= ERAS[col.era].need) {
        col.era++;
        this.app.toast(col.isPlayer ? `${ERAS[col.era].icon} ${col.name} enters the ${ERAS[col.era].name}!` : `${ERAS[col.era].icon} ${col.name} has reached the ${ERAS[col.era].name}`);
        for (const c of this.eco.list) if (c.colony && c.colony.emp === col.emp && c.sp.civ) this.dress(c, c.colony);
      }
      for (const tier in TIERS) if (col.isPlayer && TIERS[tier].techs.includes(id) && this.tierOpen(+tier, col)) {
        const names = DS.Space.BODIES.filter((b) => b.tier === +tier).map((b) => b.name).join(', ');
        setTimeout(() => this.app.toast(`🚀 Tier ${tier} unlocked: ${names}. Open the 🪐 solar system!`), 2800);
      }
      if (id === 'wheel' || id === 'railways' || id === 'combustion') for (const c of this.eco.list) if (c.colony && c.colony.emp === col.emp && c.sp.civ) c.speedMul = col.speedMult();
      if (id === 'electricity' && col.planet === this.planet) {
        const W = this.world;
        for (const b of col.buildings) for (const [dx, dy, mat] of b.cells) if (mat === M.GLASS) W.life[(b.g - 1 + dy) * W.w + b.x + dx] = 1;
      }
    }

    wantBuilding(col) {
      const pop = col.pop;
      const list = [];
      if (col.species) {
        // alien natives
        if (pop >= col.housing - 2) list.push('pod');
        if (col.built('spire') < 2) list.push('spire');
        col.wanted = list[0] || null;
        return col.wanted;
      }
      if (col.offworld) {
        if (pop >= col.housing - 2) list.push('dome');
        if (col.built('greenhouse') < 1 + Math.floor(pop / 6)) list.push('greenhouse');
        if (!col.built('mine')) list.push('mine');
        if (col.built('extractor') < 1 + Math.floor(pop / 10)) list.push('extractor');
        if (col.has('masonry') && col.built('tower') < 2) list.push('tower');
        if (col.has('military') && !col.built('barracks')) list.push('barracks');
        if (col.has('electricity') && col.built('lamp') < 4) list.push('lamp');
        const ok = list.filter((t) => col.canAfford(BUILDINGS[t].cost));
        col.wanted = list[0] || null;
        return ok.length ? ok[0] : null;
      }
      if (col.has('oil') && col.built('derrick') < 2) list.push('derrick');
      if (col.has('rocketry') && !col.built('launchpad')) list.push('launchpad');
      if (col.has('satellites') && !col.built('dish')) list.push('dish');
      if (col.has('fire') && !col.built('campfire')) list.push('campfire');
      if (pop >= col.housing - 2) list.push(col.has('masonry') ? 'house' : col.has('huts') ? 'hut' : null);
      if (col.has('agriculture') && col.built('farm') < 1 + Math.floor(pop / 6)) list.push('farm');
      if (col.has('domestication') && col.built('pen') < 1 + Math.floor(pop / 18)) list.push('pen');
      if (col.has('mining') && col.built('mine') < 1) list.push('mine');
      if (col.has('bronze') && !col.built('smithy')) list.push('smithy');
      if (col.has('writing') && !col.built('library')) list.push('library');
      if (col.has('military') && !col.built('barracks')) list.push('barracks');
      if (col.has('masonry') && col.built('tower') < (col.has('castles') ? 4 : 2)) list.push('tower');
      if (col.has('waterwheel') && !col.built('waterwheel')) list.push('waterwheel');
      if (col.has('windmill') && !col.built('windmill')) list.push('windmill');
      if (col.has('castles') && !col.built('castle')) list.push('castle');
      if (col.has('steam') && col.built('factory') < 2) list.push('factory');
      if (col.has('electricity') && col.built('lamp') < 6) list.push('lamp');
      const all = list.filter(Boolean);
      col.wanted = all[0] || null;
      const ok = all.filter((t) => col.canAfford(BUILDINGS[t].cost));
      return ok.length ? ok[0] : null;
    }

    // ------------------------------------------------------------ drawing
    draw(ctx, lights, dark, v) {
      const t = this.app.frame;
      for (const r of this.rockets) if (r.planet === this.planet) this.drawRocket(ctx, r.x, r.y, lights, true);
      for (const col of this.here()) {
        for (const b of col.buildings) {
          if (!b.done || b.x > v.x + v.w + 20 || b.x + 30 < v.x) continue;
          if (b.type === 'windmill') this.spokes(ctx, b.x + 3.5, b.g - 12, 7, t * 0.02, '#e8e0d0');
          if (b.type === 'waterwheel') this.spokes(ctx, b.x + 10.5, b.g - 3, 4, t * 0.05, '#8a5a30');
          if (b.type === 'campfire' || b.type === 'smithy') {
            const fx = b.x + (b.type === 'campfire' ? 2 : 3), fy = b.g - 2;
            const fl = ['#ffd040', '#ff8a20', '#e04010'];
            for (let i = 0; i < 3; i++) { ctx.fillStyle = fl[(i + (t >> 3)) % 3]; ctx.fillRect(fx + ((i === 1) ? 0 : ((t >> 4) + i) % 2 ? -1 : 1) * (i ? 1 : 0), fy - i, 1, 1); }
            lights.push(fx, fy, 4);
          }
          if (b.type === 'center' && dark > 0.3) lights.push(b.x + 4, b.g - 4, 9);
          if (b.type === 'launchpad' && !(b.launchT > 0)) this.drawRocket(ctx, b.x + 6, b.g - 2, lights, false);
          if (b.type === 'derrick') { const k = Math.sin(t * 0.06) * 2; ctx.fillStyle = '#3a3a3a'; ctx.fillRect(b.x + 1, Math.round(b.g - 7 + k), 5, 1); }
        }
        for (const k in col.markers) {
          const m = col.markers[k];
          if (m.t <= 0) continue;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.round(m.x), Math.round(m.y) - 8, 1, 8);
          ctx.fillStyle = COLORS[col.color];
          ctx.fillRect(Math.round(m.x) + 1, Math.round(m.y) - 8, 3, 2);
        }
      }
    }

    drawRocket(ctx, x, y, lights, flying) {
      x = Math.round(x); y = Math.round(y);
      ctx.fillStyle = '#e8ecf0'; ctx.fillRect(x - 1, y - 11, 3, 10);
      ctx.fillStyle = '#d83a3a'; ctx.fillRect(x, y - 13, 1, 2); ctx.fillRect(x - 1, y - 11, 3, 1);
      ctx.fillStyle = '#3a6ad8'; ctx.fillRect(x, y - 8, 1, 1);
      ctx.fillStyle = '#8a8e96'; ctx.fillRect(x - 2, y - 3, 1, 3); ctx.fillRect(x + 2, y - 3, 1, 3);
      if (flying) { lights.push(x, y + 1, 4); ctx.fillStyle = Math.random() < 0.5 ? '#ffd040' : '#ff7a20'; ctx.fillRect(x - 1, y - 1, 3, 3 + ((Math.random() * 3) | 0)); }
    }

    updateRockets() {
      for (let i = this.rockets.length - 1; i >= 0; i--) {
        const r = this.rockets[i];
        r.vy = Math.max(-2.5, r.vy - 0.02);
        r.y += r.vy;
        if (r.planet === this.planet) {
          const fx = this.eco.fx;
          fx.add(r.x + U.rand(-1, 1), r.y + 2, U.rand(-0.3, 0.3), U.rand(0.2, 0.6), U.pick(['#ffd040', '#ff7a20', '#d8d8d8', '#b8b8b8']), 40, -0.005);
          if (r.y > this.world.h * 0.2) for (let k = 0; k < 2; k++) fx.add(r.x + U.rand(-3, 3), r.y + 3, U.rand(-1, 1), U.rand(-0.1, 0.2), 'rgba(220,220,220,0.8)', 120, -0.002);
        }
        if (r.y < -40) this.rockets.splice(i, 1);
      }
    }

    // ------------------------------------------------------------ space
    tierOpen(tier, col = this.player) {
      if (!tier) return true;
      return !!col && TIERS[tier].techs.every((t) => col.has(t));
    }

    status(id) {
      if (id === 'earth') return 'home';
      const B = DS.Space.BY[id];
      if (!B.tier) return 'none';
      if (this.colonies.some((c) => c.isPlayer && c.alive && c.planet === id)) {
        return this.colonies.some((c) => c.species && c.alive && c.planet === id) ? 'contested' : 'outpost';
      }
      if (this.missions.some((m) => m.body === id)) return 'travelling';
      return this.tierOpen(B.tier) ? 'open' : 'locked';
    }

    pad(col = this.player) { return this.colonies.some((c) => c.emp === col.emp && c.alive && c.hasBuilt('launchpad')); }

    // send a colony ship (or troops) to another world
    launch(id, kind = 'colony') {
      const col = this.player;
      const B = DS.Space.BY[id];
      if (!col || !B || !B.tier) return 'Nowhere to go';
      if (!this.tierOpen(B.tier, col)) return `Needs ${TIERS[B.tier].techs.map((t) => TECHS[t].name).join(' + ')}`;
      if (!this.pad(col)) return 'Build a launch pad first';
      const cost = kind === 'troops' ? { oil: 40, steel: 30 } : TIERS[B.tier].cost;
      if (!col.canAfford(cost)) return 'Not enough resources';
      if (kind === 'troops' && !this.colonies.some((c) => c.isPlayer && c.alive && c.planet === id)) return 'You need an outpost there first';
      col.pay(cost);
      this.missions.push({ body: id, kind, t: 60 * (12 + B.tier * 8), total: 60 * (12 + B.tier * 8) });
      // lift-off from the launch pad if it is on this planet
      const pc = this.colonies.find((c) => c.emp === col.emp && c.alive && c.hasBuilt('launchpad') && c.planet === this.planet);
      if (pc) {
        const b = pc.buildings.find((q) => q.type === 'launchpad' && q.done);
        b.launchT = 1800;
        this.rockets.push({ x: b.x + 6, y: b.g - 2, vy: -0.05, planet: this.planet });
      }
      this.app.toast(`🚀 ${kind === 'troops' ? 'Troop ship' : 'Colony ship'} launched for ${B.name}!`);
      return null;
    }

    updateMissions() {
      for (const col of this.colonies) for (const b of col.buildings) if (b.launchT > 0) b.launchT--;
      for (let i = this.missions.length - 1; i >= 0; i--) {
        const m = this.missions[i];
        if (--m.t > 0) continue;
        this.missions.splice(i, 1);
        this.app.withPlanet(m.body, () => this.land(m));
      }
    }

    // a ship touches down (the target planet is loaded while this runs)
    land(m) {
      const B = DS.Space.BY[m.body];
      const home = this.player;
      const out = this.colonies.find((c) => c.isPlayer && c.alive && c.planet === m.body);
      this.app.toast(`${B.icon} Touchdown on ${B.name}!`);
      if (m.kind === 'troops') {
        if (!out) return;
        for (let i = 0; i < 4; i++) { const s = this.eco.spawn('soldier', out.x + U.randInt(-5, 5), this.world.groundY(out.x) - 1, {}); if (s) this.dress(s, out); }
        return;
      }
      if (out) { for (let i = 0; i < 4; i++) this.spawnVillager(out); return; }
      this.foundOutpost(m.body, home);
    }

    foundOutpost(id, home) {
      const W = this.world;
      const natives = this.colonies.filter((c) => c.planet === id && c.alive);
      let x = null;
      for (let k = 0; k < 300 && x == null; k++) {
        const cx = Math.round(W.w * (0.1 + Math.random() * 0.8));
        const g = W.groundY(cx);
        if (W.isLiquid(cx, g) || !Brain.safe(W, cx) || natives.some((o) => Math.abs(o.x - cx) < Math.min(220, W.w / 3))) continue;
        let flat = 0;
        for (let dx = -8; dx <= 8; dx += 4) flat = Math.max(flat, Math.abs(W.groundY(cx + dx) - g));
        if (flat < 5 || k > 200) x = cx;
      }
      if (x == null) x = Math.round(W.w / 2);
      const col = this.found(x, home.color, `${DS.Space.BY[id].name.replace('The ', '')} ${['Base', 'Outpost', 'Colony', 'Station'][this.colonies.filter((c) => c.isPlayer).length % 4]}`, { isPlayer: true, ai: false, emp: home.emp, planet: id, people: 5 });
      col.weights = Object.assign({}, home.weights);
      col.pop = 5;
      for (const type of ['dome', 'greenhouse']) { const b = this.placeBuilding(col, type); if (b) this.progress(col, b, 1e9); }
      this.visited.add(id);
      return col;
    }

    // first visit to a world: its natives (if any) settle in
    arrive(id, rng) {
      const P = DS.Space && DS.Space.PLANETS[id];
      if (!P || !P.natives || this.colonies.some((c) => c.planet === id && c.species)) return;
      const kinds = DS.AlienCiv[P.natives];
      const W = this.world;
      let x = Math.round(W.w * (0.25 + rng() * 0.5));
      for (let k = 0; k < 60; k++) { const cx = Math.round(W.w * (0.15 + rng() * 0.7)); if (!W.isLiquid(cx, W.groundY(cx)) && Brain.safe(W, cx)) { x = cx; break; } }
      const era = DS.Space.BY[id].fantasy ? 6 : 3;
      const emp = { res: Object.fromEntries(RES.map(([k]) => [k, 0])), knowledge: 0, techs: new Set(Object.keys(TECHS).filter((t) => TECHS[t].era <= Math.min(era, 4))), era, research: null, autoResearch: false };
      emp.res.food = 200; emp.res.wood = 100;
      const col = this.found(x, 1 + (this.colonies.filter((c) => c.species).length % 3), `${S[kinds.worker].name}s of ${DS.Space.BY[id].name}`, { isPlayer: false, ai: true, emp, species: kinds, people: 8, planet: id });
      emp.home = col;
      col.weights = { food: 3, wood: 2, stone: 1, mining: 1, research: 0.5, build: 2, military: this.opts.difficulty === 'peaceful' ? 0 : 2 };
      for (const type of ['pod', 'pod', 'spire']) { const b = this.placeBuilding(col, type); if (b) this.progress(col, b, 1e9); }
      col.raidT = 60 * 60 * (this.opts.difficulty === 'hard' ? 2 : 4);
      for (let i = 0; i < 3; i++) { const s = this.eco.spawn(kinds.soldier, x + U.randInt(-6, 6), W.groundY(x) - 1, {}); if (s) this.dress(s, col); }
    }

    conquered(col) {
      const p = this.player;
      const B = DS.Space.BY[col.planet];
      if (!p || !this.colonies.some((c) => c.isPlayer && c.alive && c.planet === col.planet)) return;
      for (const r of DS.Space.PLANETS[col.planet].res) p.res[r] += 60;
      this.app.toast(`🏆 ${B.name} is yours! The ${col.name} have been conquered.`);
    }

    spokes(ctx, cx, cy, r, a, col) {
      ctx.fillStyle = col;
      for (let s = 0; s < 4; s++) {
        const ang = a + (s * Math.PI) / 2;
        for (let i = 1; i <= r; i++) ctx.fillRect(Math.round(cx + Math.cos(ang) * i), Math.round(cy + Math.sin(ang) * i), 1, 1);
      }
      ctx.fillRect(Math.round(cx), Math.round(cy), 1, 1);
    }

    // screen-space name labels above each town
    drawLabels(ctx, v) {
      ctx.save();
      ctx.font = '600 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      for (const col of this.here()) {
        if (!col.alive) continue;
        const sx = (col.x - v.x) * v.s, sy = (this.world.groundY(col.x) - 16 - v.y) * v.s;
        if (sx < -100 || sx > ctx.canvas.width + 100) continue;
        const label = `${ERAS[col.era].icon} ${col.name} · ${col.pop}`;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        const w = ctx.measureText(label).width + 12;
        ctx.fillRect(sx - w / 2, sy - 14, w, 18);
        ctx.fillStyle = COLORS[col.color];
        ctx.fillRect(sx - w / 2, sy - 14, 3, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, sx, sy);
      }
      ctx.restore();
    }

    // ------------------------------------------------------------ god help
    placeMarker(type, x, y) {
      const col = this.local;
      if (!col || col.planet !== this.planet) return;
      if (!col) return;
      col.markers[type] = { x: Math.round(x), y: Math.round(y), t: 60 * 180 };
      for (const c of this.eco.list) if (c.colony === col && !c.load) { c.phase = null; c.thinkT = U.randInt(0, 60); }
    }
  }

  Civ.TIERS = TIERS;
  Civ.refreshThreats = refreshThreats;
  Civ.ERAS = ERAS;
  Civ.TECHS = TECHS;
  Civ.BUILDINGS = BUILDINGS;
  Civ.RES = RES;
  Civ.COLORS = COLORS;
  DS.Civ = Civ;
  DS.CivBrain = Brain;
})();
