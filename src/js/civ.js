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
    hut: { name: 'Hut', tech: 'huts', cost: { wood: 15 }, w: 11, housing: 3, home: 1 },
    cottage: { name: 'Timber cottage', tech: 'huts', minEra: 2, cost: { wood: 25, stone: 5 }, w: 11, housing: 4, home: 2 },
    farm: { name: 'Farm', tech: 'agriculture', cost: { wood: 10 }, w: 16 },
    pen: { name: 'Animal pen', tech: 'domestication', cost: { wood: 20 }, w: 16 },
    mine: { name: 'Mine', tech: 'mining', cost: { wood: 25 }, w: 7 },
    smithy: { name: 'Smithy', tech: 'bronze', cost: { stone: 20, wood: 10 }, w: 9 },
    library: { name: 'Library', tech: 'writing', cost: { stone: 30, wood: 20 }, w: 11 },
    house: { name: 'Stone house', tech: 'masonry', minEra: 3, cost: { stone: 30, wood: 20 }, w: 11, housing: 5, home: 3 },
    townhouse: { name: 'Brick townhouse', tech: 'masonry', minEra: 4, cost: { stone: 40, iron: 5 }, w: 11, housing: 7, home: 4 },
    apartment: { name: 'Apartment tower', tech: 'electricity', minEra: 5, cost: { stone: 60, steel: 15 }, w: 11, housing: 12, home: 5 },
    well: { name: 'Well', tech: null, minEra: 1, cost: { stone: 10 }, w: 5 },
    market: { name: 'Market', tech: 'pottery', minEra: 2, cost: { wood: 30, stone: 10 }, w: 11 },
    temple: { name: 'Temple', tech: 'writing', minEra: 3, cost: { stone: 60, gold: 2 }, w: 11 },
    stockpile: { name: 'Stockpile', tech: null, cost: {}, w: 7, auto: true },
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

  // the best kind of home for each age
  const HOME_BY_ERA = ['hut', 'hut', 'cottage', 'house', 'townhouse', 'apartment', 'apartment', 'apartment'];
  const OUTSKIRTS = new Set(['farm', 'pen', 'mine', 'derrick', 'windmill', 'factory', 'launchpad', 'barracks', 'castle', 'dish']);
  const CORE = 65; // half-width of the town core kept for homes and civic buildings
  const HOMES = new Set(['hut', 'cottage', 'house', 'townhouse', 'apartment']);

  const HUNTABLE = new Set(['deer', 'rabbit', 'hare', 'boar', 'bison', 'elk', 'moose', 'reindeer', 'goat', 'ibex', 'gazelle', 'zebra', 'wildebeest', 'warthog', 'capybara', 'turkey', 'grouse', 'muskox', 'yak', 'sheep', 'cow', 'pig', 'chicken', 'goatfarm', 'duck', 'goose', 'mammoth', 'snowhare', 'javelina', 'bighorn', 'kangaroo', 'tapir', 'camel']);
  const FISH = new Set(['smallfish', 'trout', 'salmon', 'minnow', 'cod', 'bass', 'sardine', 'mackerel', 'catfish', 'carp', 'koi', 'tuna']);
  const ORES = { copper: [M.COPPER, 'mining'], tin: [M.TIN, 'mining'], coal: [M.COAL, 'coal'], iron: [M.IRON, 'iron'], gold: [M.GOLD, 'iron'],
    he3: [M.HELIUM3, 'rocketry'], rareearth: [M.RAREEARTH, 'rocketry'], sulfur: [M.SULFUR, 'rocketry'], platinum: [M.PLATINUM, 'rocketry'], deuterium: [M.ICE, 'rocketry'], crystal: [M.CRYSTAL, 'rocketry'], aether: [M.AETHER, 'rocketry'] };
  const ROCK = new Set([M.STONE, M.SANDSTONE, M.BASALT, M.MASONRY, M.MOONROCK, M.MARSROCK]);
  // built materials villagers never dig through
  const HARD = new Set([M.CONCRETE, M.METAL, M.GLASS, M.BRICK, M.MASONRY, M.LAMP, M.BANNER]);
  // building materials people walk in front of
  const WALK = new Set([M.CONCRETE, M.METAL, M.GLASS, M.BRICK, M.MASONRY, M.LAMP, M.BANNER, M.ROOF]);
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
  const ORE_SET = new Set(Object.values(ORES).map((o) => o[0]));
  let THREATS = new Set();
  const refreshThreats = () => { THREATS = new Set(Object.keys(S).filter((id) => S[id].preySet && (S[id].preySet.has('villager') || S[id].preySet.has('soldier')) && !S[id].civ)); };
  refreshThreats();

  // ------------------------------------------------------------------ buildings
  function template(type, col, era = 0) {
    const out = [];
    const rect = (x0, y0, w, h, mat, sh) => { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out.push([x0 + x, y0 - y, mat, sh]); };
    const roof = (x0, y0, w, mat) => { for (let r = 0; w - r * 2 > 0; r++) for (let x = r; x < w - r; x++) out.push([x0 + x, y0 - r, mat, 0]); };
    switch (type) {
      case 'center':
        if (era <= 0) {
          // a totem with the tribe's banner
          rect(4, 0, 1, 9, M.WOOD, 1);
          rect(5, -6, 3, 2, M.BANNER, col);
          rect(1, 0, 1, 1, M.MASONRY, 1); rect(7, 0, 1, 1, M.MASONRY, 1);
        } else if (era <= 2) {
          // village green: a stone well under a little roof and a flag pole
          rect(1, 0, 5, 2, M.MASONRY, 1); rect(2, -1, 3, 1, M.WATER, 0);
          rect(1, -2, 1, 4, M.WOOD, 2); rect(5, -2, 1, 4, M.WOOD, 2); roof(0, -6, 7, M.THATCH);
          rect(8, 0, 1, 12, M.WOOD, 1); rect(9, -8, 3, 2, M.BANNER, col);
        } else if (era === 3) {
          // town hall
          rect(0, 0, 9, 8, M.STONEBRICK, 0); rect(3, 0, 3, 4, M.WOOD, 2);
          for (const x of [1, 6]) rect(x, -4, 2, 2, M.GLASS, 0);
          roof(-1, -8, 11, M.ROOF);
          rect(4, -13, 1, 3, M.WOOD, 1); rect(5, -15, 2, 2, M.BANNER, col);
        } else if (era === 4) {
          // town hall with a clock tower
          rect(0, 0, 9, 9, M.BRICK, 0); rect(3, 0, 3, 4, M.WOOD, 2);
          for (const x of [1, 6]) rect(x, -5, 2, 2, M.GLASS, 0);
          rect(2, -9, 5, 10, M.BRICK, 1); out.push([4, -15, M.LAMP, 0], [3, -15, M.GLASS, 0], [5, -15, M.GLASS, 0]);
          roof(2, -19, 5, M.ROOF); rect(4, -22, 1, 2, M.METAL, 2); out.push([5, -23, M.BANNER, col]);
        } else {
          // city hall skyscraper
          rect(0, 0, 9, 34, M.CONCRETE, 0);
          for (let y = -2; y > -33; y -= 3) for (let x = 1; x < 8; x += 2) rect(x, y, 1, 2, M.GLASS, 0);
          rect(3, 0, 3, 3, M.GLASS, 0);
          rect(4, -34, 1, 5, M.METAL, 2); out.push([4, -39, M.LAMP, 0]);
          rect(5, -37, 2, 2, M.BANNER, col);
        }
        break;
      case 'well':
        rect(0, 0, 5, 2, M.MASONRY, 1); rect(1, -1, 3, 1, M.WATER, 0);
        rect(0, -2, 1, 3, M.WOOD, 2); rect(4, -2, 1, 3, M.WOOD, 2); rect(0, -5, 5, 1, M.PLANK, 0); out.push([2, -4, M.METAL, 2]);
        break;
      case 'market':
        for (const x0 of [0, 6]) {
          rect(x0, 0, 5, 1, M.PLANK, 0); rect(x0, -1, 1, 4, M.WOOD, 2); rect(x0 + 4, -1, 1, 4, M.WOOD, 2);
          for (let x = 0; x < 5; x++) out.push([x0 + x, -5, M.BANNER, (x + col) % 4]);
          out.push([x0 + 1, -1, M.BERRY, 0], [x0 + 2, -1, M.WHEAT, 2], [x0 + 3, -1, M.FUNGUS, 0]);
        }
        break;
      case 'temple':
        rect(0, 0, 11, 1, M.MASONRY, 1);
        for (const x of [1, 3, 7, 9]) rect(x, -1, 1, 7, M.STONEBRICK, 2);
        rect(0, -8, 11, 1, M.MASONRY, 1); roof(0, -9, 11, M.STONEBRICK);
        rect(5, -14, 1, 3, M.BANNER, 1);
        rect(4, -1, 3, 4, M.WOOD, 2);
        break;
      case 'stockpile':
        break;
      case 'campfire': out.push([1, 0, M.MASONRY, 1], [3, 0, M.MASONRY, 1], [2, 0, M.ASH, 0]); break;
      case 'hut':
        for (let y = 0; y < 6; y++) { const hw = Math.round(4.5 * Math.sqrt(1 - (y / 6) ** 2)); for (let x = 5 - hw; x <= 5 + hw; x++) if (!(y < 3 && x === 5)) out.push([x, -y, M.THATCH, (x + y) & 1]); }
        break;
      case 'cottage':
        rect(1, 0, 9, 6, M.PLANK, 0);
        rect(2, 0, 2, 3, M.WOOD, 2);
        rect(6, -2, 2, 2, M.GLASS, 0);
        roof(0, -6, 11, M.THATCH);
        rect(8, -8, 1, 3, M.MASONRY, 1);
        break;
      case 'townhouse':
        rect(0, 0, 11, 15, M.BRICK, 0);
        rect(1, 0, 2, 4, M.WOOD, 2);
        for (const y of [-2, -6, -10]) for (const x of [5, 8]) rect(x, y, 2, 2, M.GLASS, 0);
        for (const y of [-6, -10]) rect(1, y, 2, 2, M.GLASS, 0);
        rect(-1, -15, 13, 1, M.MASONRY, 1); roof(0, -16, 11, M.ROOF);
        rect(8, -19, 1, 3, M.BRICK, 1);
        break;
      case 'apartment':
        rect(0, 0, 11, 26, M.CONCRETE, 0);
        for (let y = -2; y > -25; y -= 3) for (const x of [1, 4, 7]) rect(x, y, 2, 2, M.GLASS, 0);
        rect(4, 0, 3, 3, M.GLASS, 0);
        rect(0, -26, 11, 1, M.METAL, 2); out.push([2, -27, M.METAL, 2], [8, -28, M.LAMP, 0], [8, -27, M.METAL, 2]);
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
        rect(0, 0, 11, 7, M.STONEBRICK, 0);
        rect(2, 0, 2, 4, M.WOOD, 2);
        for (const x of [5, 8]) rect(x, -3, 2, 2, M.GLASS, 0);
        roof(-1, -7, 13, M.ROOF);
        rect(8, -10, 1, 3, M.MASONRY, 1);
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
    get housing() { return 8 + this.buildings.reduce((s, b) => s + (b.done ? BUILDINGS[b.type].housing || 0 : b.old ? b.old.housing : 0), 0); }
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
    researchMult() { return (this.hasBuilt('temple') ? 1.15 : 1) * (this.hasBuilt('library') ? 1.5 : 1) * (this.has('astronomy') ? 1.5 : 1) * (this.has('computers') ? 1.5 : 1) * (this.hasBuilt('dish') ? 1.25 : 1) * (this.has('aetherics') ? 1.5 : 1); }
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
        for (const k in ORES) if (ORES[k][0] === t && col.has(ORES[k][1])) res = k;
        if (!res && ROCK.has(t) && col.has('tools')) res = 'stone';
        if (res && !c.load) {
          if (c.job === 'mine' && res === 'stone') { col.res.stone += 0.25; return; }
          c.load = { res, amt: res === 'stone' ? 3 : 2 };
          c.carry = t;
          Brain.goHome(c);
        }
      }
    },
    // ------------------------------------------------------------ movement
    // Terraria-style: walk along the surface, hop small steps, climb walls,
    // swim across water, and dig person-sized tunnels (which takes time).
    move(c, eco, mul) {
      const W = eco.world;
      c.x = Math.round(c.x); c.y = Math.round(c.y);
      if (c.digT > 0) { c.digT--; if (c.digT <= 0) Brain.finishDig(c, eco); return; }
      if (W.isLiquid(c.x, c.y) && W.isLiquid(c.x, c.y - 1)) { c.y--; return; } // swim up
      // underground, people follow their path on ladders and ropes; elsewhere gravity applies
      const onPath = c.path && c.path.length;
      if (!onPath && !c.climbing && !Brain.supported(W, c.x, c.y)) { c.y++; return; }
      if (!mul) return;
      c.mv = (c.mv || 0) + c.sp.speed * mul * (c.speedMul || 1) * (W.isLiquid(c.x, c.y) ? 0.5 : 1);
      for (let n = 0; c.mv >= 1 && n < 3; n++) {
        c.mv -= 1;
        if (Brain.step(c, eco)) { c.mv = 0; break; }
      }
    },

    // something to hold on to when climbing a cliff face
    wallNear(W, x, y) {
      for (const [dx, dy] of [[-1, 0], [1, 0], [-1, -1], [1, -1], [0, -1]]) { const t = W.get(x + dx, y + dy); if (MP.solid[t] && !WALK.has(t)) return true; }
      return false;
    },

    // ground height for people: buildings are walked through, not over
    gy(W, x) {
      x = U.clamp(x | 0, 0, W.w - 1);
      let y = W.groundY(x);
      while (y < W.h - 1 && WALK.has(W.get(x, y))) {
        y++;
        while (y < W.h - 1 && (WALK.has(W.get(x, y)) || (!MP.solid[W.get(x, y)] && !W.isLiquid(x, y)))) y++;
      }
      return y;
    },

    supported(W, x, y) {
      if (y >= W.h - 2) return true;
      const b = W.get(x, y + 1);
      return (MP.solid[b] === 1 && !WALK.has(b)) || W.isLiquid(x, y + 1) || W.isLiquid(x, y);
    },

    passable(W, x, y) {
      const t = W.get(x, y);
      return W.inb(x, y) && (!MP.solid[t] || WALK.has(t)) && t !== M.BEDROCK;
    },

    // is (x, y) out in the open, standing on the surface?
    atSurface(W, x, y) { return y <= Brain.gy(W, x) + 1; },

    // one cell of progress; returns true when it should stop for this tick
    step(c, eco) {
      const W = eco.world, x = c.x, y = c.y, tx = c.tx, ty = c.ty;
      if (tx == null) return true;
      c.climbing = false;
      const solidT = MP.solid[W.get(tx, ty)] === 1 && !WALK.has(W.get(tx, ty));
      const ax = Math.abs(tx - x), ay = Math.abs(ty - y);
      if (solidT ? ax <= 1 && ay <= 1 : ax <= 1 && ay <= 3) { c.arrived = true; c.path = null; return true; }
      // following a dug or planned route
      if (c.path && c.path.length) return Brain.follow(c, eco);
      const deep = ty > Brain.gy(W, tx) + 1;
      const under = !Brain.atSurface(W, x, y);
      if ((deep && ax <= 24) || under) {
        c.path = Brain.findPath(c, W, deep && ax <= 24 ? [tx, ty] : null);
        if (!c.path) { c.bumps = (c.bumps || 0) + 4; return true; }
        return Brain.follow(c, eco);
      }
      // walk the surface
      const dir = Math.sign(tx - x);
      const nx = x + dir;
      if (nx < 1 || nx > W.w - 2) { c.bumps = (c.bumps || 0) + 1; return true; }
      if (ax <= 1) {
        // the target is overhead: climb a cliff if there is one, otherwise wait underneath
        if (ty < y && Brain.passable(W, x, y - 1) && Brain.wallNear(W, x, y)) { c.y--; c.climbing = true; return false; }
        c.arrived = true; return true;
      }
      c.dir = dir;
      const g = Brain.gy(W, nx);
      const ny = W.isLiquid(nx, g) ? g : g - 1;
      const dy = ny - y;
      if (Brain.hazard(W, nx, ny) || Brain.hazard(W, nx + dir, ny)) { c.bumps = (c.bumps || 0) + 6; return true; }
      if (dy > 3) {
        // a narrow hole (a mine shaft): hop over it rather than fall in
        for (const k of [2, 3]) {
          const fx = x + dir * k;
          if (fx < 1 || fx > W.w - 2) break;
          const fy = Brain.gy(W, fx) - 1;
          if (Math.abs(fy - y) <= 2) { c.x = fx; c.y = fy; return false; }
        }
      }
      if (dy >= -1) { c.x = nx; if (dy <= 1) c.y = ny; return false; } // walk (or step off and drop)
      if (dy >= -4) { c.x = nx; c.y = ny; return false; } // hop up
      if (Brain.passable(W, x, y - 1)) { c.y--; c.climbing = true; return false; } // climb the cliff face
      c.path = Brain.findPath(c, W, [nx, ny]); // dig a way up
      if (!c.path) { c.bumps = (c.bumps || 0) + 4; return true; }
      return false;
    },

    follow(c, eco) {
      const W = eco.world;
      const [nx, ny] = c.path[0];
      if (Math.abs(nx - c.x) > 1 || Math.abs(ny - c.y) > 1) { c.path = null; return false; } // knocked off course
      const cost = Brain.digCost(c, W, nx, ny);
      if (cost === Infinity || Brain.hazard(W, nx, ny)) { c.path = null; c.bumps = (c.bumps || 0) + 3; return true; }
      if (nx !== c.x) c.dir = Math.sign(nx - c.x);
      if (cost > 0) { c.digT = cost; c.digAt = [nx, ny]; return true; }
      c.x = nx; c.y = ny; c.climbing = true;
      c.path.shift();
      return false;
    },

    // cheapest route through the ground: open tunnels cost little, digging costs more.
    // goal = [x, y] to reach (next to it), or null = the nearest way out to the surface
    findPath(c, W, goal) {
      const sx = c.x, sy = c.y;
      const gx = goal ? goal[0] : sx;
      const x0 = Math.max(1, Math.min(sx, gx) - 22), x1 = Math.min(W.w - 2, Math.max(sx, gx) + 22);
      const top = Math.min(sy, goal ? goal[1] : sy, Brain.gy(W, sx), goal ? Brain.gy(W, gx) : sy);
      const y0 = Math.max(3, top - 6), y1 = Math.min(W.h - 2, Math.max(sy, goal ? goal[1] : sy) + 8);
      const bw = x1 - x0 + 1, bh = y1 - y0 + 1, N = bw * bh;
      if (N > 60000 || sx < x0 || sx > x1 || sy < y0 || sy > y1) return null;
      const dist = new Float32Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1);
      const heap = [];
      const push = (d, i) => { heap.push([d, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
      const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
      const si = (sy - y0) * bw + (sx - x0);
      // A*: estimated remaining distance keeps the search pointed at the goal
      const h = goal ? (x, y) => Math.max(Math.abs(x - goal[0]), Math.abs(y - goal[1])) : (x, y) => Math.max(0, y - Brain.gy(W, x));
      dist[si] = 0; push(h(sx, sy), si);
      let found = -1, n = 0;
      while (heap.length && n < 6000) {
        const [f, i] = pop();
        const x0i = i % bw, y0i = (i / bw) | 0;
        if (f - h(x0 + x0i, y0 + y0i) > dist[i] + 1e-6) continue;
        n++;
        const d = dist[i];
        const x = x0 + (i % bw), y = y0 + ((i / bw) | 0);
        if (goal ? Math.abs(x - goal[0]) <= 1 && Math.abs(y - goal[1]) <= 1 : i !== si && Brain.atSurface(W, x, y)) { found = i; break; }
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < x0 || nx > x1 || ny < y0 || ny > y1) continue;
          const cost = Brain.digCost(c, W, nx, ny);
          if (cost === Infinity) continue;
          const nd = d + (dx && dy ? 1.4 : 1) + (cost ? 6 + cost * 2 : 0) + (dy < 0 ? 0.3 : 0);
          const ni = (ny - y0) * bw + (nx - x0);
          if (nd < dist[ni]) { dist[ni] = nd; prev[ni] = i; push(nd + h(nx, ny), ni); }
        }
      }
      if (found < 0) return null;
      const path = [];
      for (let i = found; i !== si && i >= 0; i = prev[i]) path.push([x0 + (i % bw), y0 + ((i / bw) | 0)]);
      return path.reverse();
    },

    digCost(c, W, x, y) {
      let cost = 0;
      for (let k = 0; k < 3; k++) {
        const t = W.get(x, y - k);
        if (!MP.solid[t] || WALK.has(t)) continue;
        if (t === M.BEDROCK || HARD.has(t)) return Infinity;
        if (SOFT.has(t) || MP.dig[t]) cost += 3;
        else if (t === M.ROAD) cost += 8;
        else if (ROCK.has(t) || t === M.ICE) { if (!c.colony || !c.colony.has('tools')) return Infinity; cost += 9; }
        else {
          let ore = false;
          for (const k2 in ORES) if (ORES[k2][0] === t) ore = true;
          if (!ore) return Infinity;
          cost += 12;
        }
      }
      return cost && Math.max(2, Math.round(cost / (c.colony ? Math.sqrt(c.colony.gatherMult()) : 1)));
    },

    finishDig(c, eco) {
      const W = eco.world;
      const [x, y] = c.digAt;
      for (let k = 0; k < 3; k++) {
        const t = W.get(x, y - k);
        if (!MP.solid[t] || t === M.BEDROCK || HARD.has(t) || WALK.has(t)) continue;
        W.set(x, y - k, M.EMPTY);
        if (k === 0 || ORE_SET.has(t)) Brain.dug(c, eco, t);
      }
      if (Math.random() < 0.4) eco.fx.burst(x, y - 1, ['#8a7a6a', '#6a5a4a'], 3, 0.4);
    },

    goHome(c) {
      const col = c.colony;
      c.path = null;
      c.phase = 'return';
      c.tx = col.x + U.randInt(-3, 3);
      c.ty = Brain.gy(col.civ.world, c.tx) - 1;
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
      if (!c.sp.soldier && c.order !== 'attack') {
        const p = eco.nearest(c, 22, (o) => THREATS.has(o.sp.id) && !o.sleep || (o.sp.soldier && o.colony && o.colony !== col));
        let fire = false;
        for (let dx = -4; dx <= 4 && !fire; dx += 2) fire = Brain.hazard(W, Math.round(c.x) + dx, Math.round(c.y));
        if (fire && c.phase !== 'flee') { c.phase = 'flee'; c.tx = U.clamp(Math.round(c.x + (Math.random() < 0.5 ? -30 : 30)), 3, W.w - 4); c.ty = Brain.gy(W, c.tx) - 1; c.arrived = false; c.goalT = 0; c.indoors = false; return; }
        if (p) { c.phase = 'flee'; c.tx = U.clamp(Math.round(c.x + (c.x >= p.x ? 35 : -35)), 3, W.w - 4); c.ty = Brain.gy(W, c.tx) - 1; c.load = c.load || null; c.goalT = 0; c.arrived = false; c.indoors = false; return; }
        if (c.phase === 'flee') c.phase = null;
      }
      if (c.sp.soldier) return Brain.soldier(c, eco);
      if (c.phase && c.goalT < 900 && !c.arrived) return;
      if (c.phase === 'work' && c.arrived) return; // waiting at a site (handled in after)
      if (c.load) { Brain.goHome(c); return; }
      // night: go home
      if (eco.daylight < 0.1 && !c.order && c.job !== 'rest' && col.civ.t - (c.wokeT || -1e9) > 7200) {
        // bedtime: head home (a house if there is one) and sleep indoors
        const homes = col.buildings.filter((b) => b.done && (HOMES.has(b.type) || b.type === 'dome' || b.type === 'pod'));
        const h = homes.length ? homes[(c.id || 0) % homes.length] : null;
        c.job = 'rest'; c.phase = 'go'; c.bed = h;
        c.tx = h ? h.x + 2 + U.randInt(0, BUILDINGS[h.type].w - 5) : col.x + U.randInt(-8, 8);
        c.ty = Brain.gy(W, c.tx) - 1; c.arrived = false; c.goalT = 0; c.bumps = 0;
        return;
      }
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
      c.phase = 'go';
      c.arrived = false;
      c.goalT = 0;
      c.waitT = 0;
      c.bumps = 0;
      // a standing order from the god's flag comes first
      if (c.order) {
        const m = col.markers[c.order];
        if (m && m.t > 0 && Brain.ordered(c, eco, m)) return;
        if (!m || m.t <= 0) c.order = null;
      }
      const job = U.weighted(opts.filter((o) => o[1] > 0));
      c.job = job;
      const mk = (type) => col.markers[type] && col.markers[type].t > 0 ? col.markers[type] : null;
      const near = (type) => mk(type) || { x: col.x, y: Brain.gy(W, col.x) };
      const R = 70 + col.era * 25;
      switch (job) {
        case 'food': {
          // farms first, then pens' animals, berries, hunting, fishing
          const farm = col.buildings.find((b) => b.type === 'farm' && b.done && b.ripe);
          if (farm) { c.job = 'farm'; c.site = farm; return Brain.toSurf(c, W, farm.x + U.randInt(1, 14)); }
          const r = Math.random();
          if (col.has('hunting') && r < 0.45) {
            const m = near('hunt');
            const prey = eco.nearest({ x: m.x, cy: m.y, sp: {} }, R, (o) => HUNTABLE.has(o.sp.id) && !o.home && o.sp.hab !== 'water' && o.sp.hab !== 'air' && !o.dead);
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
          const prey = eco.nearest({ x: col.x, cy: Brain.gy(W, col.x), sp: {} }, R, (o) => (o.sp.id === 'rabbit' || o.sp.id === 'chicken' || o.sp.id === 'mouse' || o.sp.id === 'hare') && !o.dead);
          if (prey) { c.job = 'hunt'; c.target = prey; return Brain.to(c, prey.x, prey.y); }
          // forage roots, nuts and herbs on open ground
          c.job = 'forage';
          let fx = col.x;
          for (let k = 0; k < 8; k++) { const xx = U.clamp(Math.round(near('gather').x + U.rand(-R * 0.6, R * 0.6)), 2, W.w - 3); if (Brain.safe(W, xx)) { fx = xx; break; } }
          return Brain.to(c, fx, Brain.gy(W, fx) - 1);
        }
        case 'wood': return Brain.pickWood(c, eco, near('gather'), R);
        case 'quarry': {
          const m = near('mine');
          const s = Brain.findCell(W, m.x, R, (t) => ROCK.has(t) && t !== M.MASONRY, true);
          if (s) return Brain.to(c, s[0], s[1]);
          // dig down near the town
          { const x = Brain.digSite(col, W); return Brain.to(c, x, W.floorY(x) + U.randInt(6, 14)); }
        }
        case 'mine': {
          const target = Brain.pickOre(col, eco);
          if (target) return Brain.to(c, target[0], target[1]);
          c.job = 'quarry';
          { const x = Brain.digSite(col, W); return Brain.to(c, x, W.floorY(x) + U.randInt(8, 20)); }
        }
        case 'build': {
          const site = col.buildings.find((b) => !b.done);
          c.site = site;
          return Brain.toSurf(c, W, site.x + U.randInt(0, BUILDINGS[site.type].w - 1));
        }
        case 'research': {
          const lib = col.buildings.find((b) => b.type === 'library' && b.done) || col.buildings.find((b) => b.type === 'center');
          return Brain.toSurf(c, W, (lib ? lib.x + 2 : col.x) + U.randInt(0, 5));
        }
      }
    },

    // carry out a flag order; returns false if there is nothing to do there
    ordered(c, eco, m) {
      const col = c.colony, W = eco.world;
      const R = 45;
      switch (c.order) {
        case 'gather': {
          const t = Brain.findTree(W, m.x, R, col.civ);
          if (t) { c.job = 'wood'; Brain.to(c, t[0], t[1]); return true; }
          const b = Brain.findCell(W, m.x, R, (q) => q === M.BERRY || q === M.FUNGUS || q === M.FLOWER || q === M.XENOBULB);
          if (b) { c.job = 'berries'; Brain.to(c, b[0], b[1]); return true; }
          c.job = 'brush'; Brain.to(c, m.x + U.randInt(-10, 10), Brain.gy(W, m.x) - 1); return true;
        }
        case 'hunt': {
          const prey = eco.nearest({ x: m.x, cy: m.y, sp: {} }, R + 20, (o) => HUNTABLE.has(o.sp.id) && !o.home && o.sp.hab !== 'water' && o.sp.hab !== 'air' && !o.dead);
          if (prey) { c.job = 'hunt'; c.target = prey; Brain.to(c, prey.x, prey.y); return true; }
          const spot = Brain.findWaterEdge(W, m.x, R);
          if (spot) { c.job = 'fish'; Brain.to(c, spot[0], spot[1]); return true; }
          c.job = 'forage'; Brain.to(c, m.x + U.randInt(-10, 10), Brain.gy(W, m.x) - 1); return true;
        }
        case 'mine': {
          // the nearest ore or rock to the flag, dug out with a tunnel if needed
          let best = null, bd = 1e9;
          for (let k = 0; k < 120; k++) {
            const x = Math.round(m.x + U.rand(-25, 25)), y = Math.round(m.y + U.rand(-20, 25));
            const t = W.get(x, y);
            const ok = (ORE_SET.has(t) && [...Object.values(ORES)].some((o) => o[0] === t && col.has(o[1]))) || (ROCK.has(t) && t !== M.MASONRY && col.has('tools'));
            if (!ok) continue;
            const d = Math.abs(x - m.x) + Math.abs(y - m.y) * 1.2 - (ORE_SET.has(t) ? 15 : 0);
            if (d < bd) { bd = d; best = [x, y]; }
          }
          c.job = col.has('mining') ? 'mine' : 'quarry';
          if (best) Brain.to(c, best[0], best[1]);
          else Brain.to(c, m.x, Math.max(m.y, Brain.gy(W, m.x) + 6));
          return true;
        }
        case 'build': {
          const site = col.buildings.find((b) => !b.done);
          if (site) { c.job = 'build'; c.site = site; Brain.toSurf(c, W, site.x + U.randInt(0, BUILDINGS[site.type].w - 1)); return true; }
          return false;
        }
        case 'attack': {
          const foe = eco.nearest({ x: m.x, cy: m.y, sp: {} }, 60, (o) => (o.sp.civ && o.colony && o.colony !== col && o.colony.alive) || THREATS.has(o.sp.id));
          if (foe) { c.job = 'fight'; c.target = foe; Brain.to(c, foe.x, foe.y); return true; }
          c.job = 'rally'; Brain.to(c, m.x + U.randInt(-5, 5), Brain.gy(W, m.x) - 1); return true;
        }
      }
      return false;
    },

    pickWood(c, eco, m, R) {
      const W = eco.world;
      const t = Brain.findTree(W, m.x, R * 2.5, c.colony.civ);
      if (t) { c.job = 'wood'; return Brain.to(c, t[0], t[1]); }
      // no trees left: gather brushwood and driftwood
      c.job = 'brush';
      let x = c.colony.x;
      for (let k = 0; k < 8; k++) { const xx = U.clamp(Math.round(m.x + U.rand(-R, R)), 2, W.w - 3); if (Brain.safe(W, xx)) { x = xx; break; } }
      return Brain.to(c, x, Brain.gy(W, x) - 1);
    },

    toSurf(c, W, x) { x = U.clamp(Math.round(x), 2, W.w - 3); return Brain.to(c, x, Brain.gy(W, x) - 1); },

    // somewhere to dig down outside the built-up core (never through roads and floors)
    // everyone digs down the same quarry shaft (or the mine's), so the land isn't riddled with holes
    digSite(col, W) {
      const mine = col.buildings.find((b) => b.type === 'mine' && b.done);
      if (mine) return mine.x + 3;
      if (col.quarryX == null || !Brain.safe(W, col.quarryX)) {
        col.quarryX = col.x + CORE + 10;
        for (let k = 0; k < 12; k++) {
          const x = U.clamp(Math.round(col.x + (k % 2 ? -1 : 1) * (CORE + 10 + k * 6)), 3, W.w - 4);
          if (Brain.safe(W, x) && !Brain.built(col.civ, x) && Brain.pathSafe(W, col.x, x)) { col.quarryX = x; break; }
        }
      }
      return col.quarryX;
    },

    // no lava, vents, fire or poison anywhere near a building plot
    siteSafe(W, x0, bw) {
      for (let x = x0 - 12; x < x0 + bw + 12; x += 2) {
        const g = Brain.gy(W, x);
        for (let y = g - 18; y < g + 8; y += 2) {
          const t = W.get(x, y);
          if (t === M.LAVA || t === M.VENT || t === M.FIRE || t === M.TOXIC || t === M.ACID || t === M.EMBERS) return false;
        }
      }
      return true;
    },

    // can people walk there from town without crossing lava, fire or poison?
    pathSafe(W, a, b) {
      const s = Math.sign(b - a) || 1;
      for (let x = a; x !== b; x += s * 2) {
        if ((x - b) * s > 0) break;
        const g = Brain.gy(W, x);
        for (let dy = -2; dy <= 1; dy++) { const t = W.get(x, g + dy); if (t === M.LAVA || t === M.FIRE || t === M.TOXIC || t === M.ACID) return false; }
      }
      return true;
    },

    // fire, lava or poison just ahead?
    hazard(W, x, y) {
      for (let dy = -3; dy <= 1; dy++) { const t = W.get(x, y + dy); if (t === M.FIRE || t === M.LAVA || t === M.TOXIC || t === M.ACID) return true; }
      return false;
    },

    to(c, x, y) {
      c.tx = U.clamp(Math.round(x), 2, c.colony.civ.world.w - 3);
      c.ty = Math.round(y);
      c.arrived = false;
      c.goalT = 0;
      c.bumps = 0;
      c.indoors = false;
      c.path = null;
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
        const xx = U.clamp(x + dx, 0, W.w - 1), g = Brain.gy(W, xx), t = W.get(xx, g);
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
        const g = Brain.gy(W, x);
        if (!W.isLiquid(x, g)) continue;
        for (const d of [-1, 1]) for (let s = 1; s < 8; s++) {
          const nx = x + d * s, ng = Brain.gy(W, nx);
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
      const mineB = col.buildings.find((b) => b.type === 'mine' && b.done);
      const m = col.markers.mine && col.markers.mine.t > 0 ? col.markers.mine : mineB ? { x: mineB.x + 3, y: W.floorY(mineB.x + 3) } : { x: col.x, y: W.floorY(col.x) };
      let best = null, bd = 1e9;
      for (let i = 0; i < 30; i++) {
        const p = U.pick(col.ore[k]);
        if (W.get(p[0], p[1]) !== ORES[k][0]) continue;
        const d = Math.abs(p[0] - m.x) * 2 + Math.abs(p[1] - m.y) * 0.5;
        if (d < bd) { bd = d; best = p; }
      }
      return best;
    },

    soldier(c, eco) {
      const col = c.colony, W = eco.world;
      const enemy = eco.nearest(c, c.sp.sense, (o) => (o.sp.civ && o.colony && o.colony !== col && o.colony.alive) || (THREATS.has(o.sp.id) && Math.abs(o.x - col.x) < 90));
      if (enemy) { c.job = 'fight'; c.target = enemy; return Brain.to(c, enemy.x, enemy.y); }
      c.target = null;
      if (col.raid && col.raid.alive) { c.job = 'raid'; return Brain.to(c, col.raid.x + U.randInt(-6, 6), Brain.gy(W, col.raid.x) - 1); }
      const m = col.markers.attack && col.markers.attack.t > 0 ? col.markers.attack : null;
      if (m) {
        const foe = eco.nearest({ x: m.x, cy: m.y, sp: {} }, 70, (o) => (o.sp.civ && o.colony && o.colony !== col && o.colony.alive) || THREATS.has(o.sp.id));
        if (foe) { c.job = 'fight'; c.target = foe; return Brain.to(c, foe.x, foe.y); }
        c.job = 'rally'; return Brain.to(c, m.x + U.randInt(-5, 5), Brain.gy(W, m.x) - 1);
      }
      if (c.arrived || c.goalT > 900 || c.job !== 'patrol') { c.job = 'patrol'; const x = col.x + U.randInt(-60, 60); Brain.to(c, x, Brain.gy(W, U.clamp(x, 0, W.w - 1)) - 1); }
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
      if (!c.arrived && Math.hypot(c.tx - c.x, c.ty - c.y) > 1.8) {
        if (c.goalT > 1500 || (c.bumps || 0) > 40) { c.phase = null; c.job = null; c.thinkT = 0; c.bumps = 0; }
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
        case 'rally': c.phase = null; c.thinkT = 60; return;
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
          } else if (c.job === 'rest') {
            c.indoors = !!c.bed && c.bed.done;
            if (eco.daylight > 0.2 || c.waitT > 1800) { c.phase = null; c.thinkT = 0; c.indoors = false; c.bed = null; c.job = null; c.wokeT = col.civ.t; }
          }
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
  const FIRST = ['Ada', 'Bram', 'Cora', 'Dirk', 'Edda', 'Finn', 'Greta', 'Hugo', 'Ines', 'Jory', 'Kara', 'Lars', 'Mira', 'Nils', 'Olga', 'Pim', 'Quin', 'Rosa', 'Sven', 'Tess', 'Ulf', 'Vera', 'Wim', 'Xena', 'Yara', 'Zeb', 'Anouk', 'Bas', 'Lotte', 'Joris', 'Femke', 'Ruben', 'Sanne', 'Thijs', 'Noor', 'Daan', 'Elin', 'Otto', 'Ida', 'Milo'];
  const JOB_TEXT = { wood: 'chopping wood', berries: 'picking berries', forage: 'foraging', brush: 'gathering brushwood', hunt: 'hunting', fish: 'fishing', farm: 'harvesting the fields', quarry: 'quarrying stone', mine: 'mining', build: 'building', research: 'studying', rest: 'resting at home', fight: 'fighting', rally: 'answering the call', raid: 'raiding', patrol: 'on patrol', food: 'looking for food' };
  const ROLE = { wood: 'Woodcutter', berries: 'Gatherer', forage: 'Gatherer', brush: 'Gatherer', hunt: 'Hunter', fish: 'Fisher', farm: 'Farmer', quarry: 'Quarrier', mine: 'Miner', build: 'Builder', research: 'Scholar', fight: 'Militia', rally: 'Militia', raid: 'Raider', patrol: 'Guard' };
  const MARK_COL = { gather: '#5ac850', hunt: '#e0a040', mine: '#a0a0b0', build: '#e8d060', attack: '#e04040' };
  const MARK_ICON = { gather: '🌳', hunt: '🦌', mine: '⛏️', build: '🔨', attack: '⚔️' };
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
          if (W.isLiquid(x, Brain.gy(W, x)) || g > W.h * 0.47) continue;
          if (avoid.some((s) => Math.abs(s - x) < W.w / (n + 1.5))) continue;
          found++;
          const sc = score(x);
          if (sc > bs) { bs = sc; best = x; }
        }
        if (best != null) return best;
        for (let k = 0; k < 400; k++) { const x = Math.round(rng() * (W.w - 40)) + 20; if (!W.isLiquid(x, Brain.gy(W, x)) && !avoid.some((s) => Math.abs(s - x) < 80)) return x; }
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
      this.app.cam.y = Brain.gy(W, p.x) - this.app.screenH * 0.25;
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
      if (!col.species) { const sp = this.placeBuilding(col, 'stockpile'); if (sp) this.progress(col, sp, 1e9); }
      for (let i = 0; i < (extra && extra.people || 6); i++) this.spawnVillager(col);
      return col;
    }

    spawnVillager(col, x) {
      const W = this.world;
      x = x == null ? col.x + U.randInt(-6, 6) : x;
      const c = this.eco.spawn(col.kinds.worker, x, Brain.gy(W, U.clamp(x, 0, W.w - 1)) - 1, {});
      if (!c) return null;
      this.dress(c, col);
      return c;
    }

    dress(c, col) {
      c.colony = col;
      if (!c.cname) c.cname = U.pick(FIRST);
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
    placeBuilding(col, type, at, keep) {
      const W = this.world;
      const bw = BUILDINGS[type].w;
      const taken = (x) => (col.badSpots || []).some((bx) => Math.abs(bx - x) < 12) || col.buildings.some((b) => x < b.x + BUILDINGS[b.type].w + 3 && x + bw + 3 > b.x) || this.colonies.some((o) => o !== col && o.planet === col.planet && Math.abs(o.x - x) < 40);
      let x = null;
      if (at != null) x = at - Math.floor(bw / 2);
      else if (type === 'waterwheel') {
        const s = Brain.findWaterEdge(W, col.x, 90);
        if (!s) return null;
        x = s[0] - Math.floor(bw / 2);
      } else {
        const flag = col.markers.build && col.markers.build.t > 0;
        const m = flag ? col.markers.build.x : col.x;
        // zoning: homes and civic buildings in the core, fields and industry outside it
        const outer = OUTSKIRTS.has(type) && !flag;
        const start = outer ? CORE + 4 : 6;
        for (let k = 0; k < 90 && x == null; k++) {
          const d = (start + k * 4) * (k % 2 ? 1 : -1);
          if (!outer && !flag && Math.abs(d) > CORE && k < 60 && !col.offworld) { k = Math.max(k, 59); continue; }
          const cx = Math.round(m + d);
          if (cx < 5 || cx + bw > W.w - 5 || taken(cx)) continue;
          let wet = false;
          for (let i = 0; i < bw; i++) if (W.isLiquid(cx + i, Brain.gy(W, cx + i))) wet = true;
          if (!wet && Brain.siteSafe(W, cx, bw) && Brain.pathSafe(W, col.x, cx)) x = cx;
        }
      }
      if (x == null) return null;
      // level the ground to the median height
      const hs = [];
      for (let i = 0; i < bw; i++) hs.push(W.floorY(x + i));
      hs.sort((a, b) => a - b);
      const g = typeof keep === 'number' ? keep : hs[Math.floor(hs.length / 2)];
      for (let i = -1; i <= bw; i++) {
        const px = x + i;
        const f = W.floorY(px);
        if (!keep) for (let y = Math.min(f, g - 30); y < g; y++) { const t = W.get(px, y); if (t !== M.EMPTY && MP.kind[t] !== DS.KIND.liquid) W.set(px, y, M.EMPTY); }
        for (let y = g; y < f; y++) W.set(px, y, y === g ? M.GRASS : M.SOIL);
      }
      const cells = template(type, col.color, col.era);
      const b = { type, x, g, cells, placed: 0, progress: 0, progT: col.t, cost: Math.max(4, cells.length / 6), done: false, grow: 0, ripe: false, t: 0 };
      if (type === 'farm') b.crops = cells.filter((c) => c[2] === M.WHEAT).map(([dx, dy]) => [x + dx, g - 1 + dy]);
      col.buildings.push(b);
      return b;
    }

    progress(col, b, amt) {
      const W = this.world;
      b.progress += amt;
      b.progT = col.t;
      const want = Math.min(b.cells.length, Math.ceil((b.progress / b.cost) * b.cells.length));
      for (; b.placed < want; b.placed++) {
        const [dx, dy, mat, sh] = b.cells[b.placed];
        W.set(b.x + dx, b.g - 1 + dy, mat, mat === M.GLASS && (col.era >= 2 || col.has('electricity')) && !['greenhouse', 'dome'].includes(b.type) ? 1 : 0, sh);
      }
      if (b.placed >= b.cells.length && !b.done) {
        b.done = true;
        if (b.old) {
          // clear what is left of the old building
          const keepSet = new Set(b.cells.map(([dx, dy]) => (b.x + dx) + ',' + (b.g - 1 + dy)));
          for (const [dx, dy, mat] of b.old.cells) { const x = b.old.x + dx, y = b.old.g - 1 + dy; if (!keepSet.has(x + ',' + y) && W.get(x, y) === mat) W.set(x, y, M.EMPTY); }
          b.old = null;
        }
        if (col.isPlayer && b.type !== 'center') this.app.toast(`🔨 ${BUILDINGS[b.type].name} built`);
        if (b.type === 'pen') this.stockPen(col, b);
        this.pave(col);
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

    // ------------------------------------------------------------ the town grows
    homes(col) { return col.buildings.filter((b) => HOMES.has(b.type)); }
    maxHomes(col) { return 4 + col.era * 2; }

    // roads between the buildings: dirt paths, then cobbles, then asphalt
    pave(col) {
      if (col.species || col.planet !== this.planet || col.era < 1) return;
      const W = this.world;
      const xs = col.buildings.filter((b) => b.done && !['farm', 'pen', 'mine', 'waterwheel', 'launchpad'].includes(b.type));
      if (!xs.length) return;
      const x0 = Math.min(...xs.map((b) => b.x)) - 2, x1 = Math.max(...xs.map((b) => b.x + BUILDINGS[b.type].w)) + 2;
      const shade = col.era >= 4 ? 2 : col.era >= 2 ? 1 : 0;
      for (let x = Math.max(1, x0); x < Math.min(W.w - 1, x1); x++) {
        const y = W.floorY(x);
        const t = W.get(x, y);
        if (W.isLiquid(x, y - 1)) continue;
        if (t === M.ROAD || SOFT.has(t) || t === M.STONE || t === M.SANDSTONE) W.set(x, y, M.ROAD, 0, shade);
      }
    }

    // swap a building for a newer kind in the same spot (new style, same plot)
    // (the old building stays up and keeps its beds until the new one is finished)
    rebuild(col, b, type) {
      col.buildings.splice(col.buildings.indexOf(b), 1);
      const nb = this.placeBuilding(col, type, b.x + Math.floor(BUILDINGS[type].w / 2), b.g);
      if (!nb) { col.buildings.push(b); return null; }
      nb.old = { x: b.x, g: b.g, cells: b.cells, housing: b.done ? BUILDINGS[b.type].housing || 0 : 0 };
      return nb;
    }

    // a new age: the town hall changes, and old homes get rebuilt one by one
    renew(col) {
      if (col.planet !== this.planet) return;
      const c = col.buildings.find((b) => b.type === 'center');
      if (c && !col.species) { const nb = this.rebuild(col, c, 'center'); if (nb) this.progress(col, nb, 1e9); }
      this.pave(col);
    }

    upgradeHomes(col) {
      const best = HOME_BY_ERA[col.era];
      const B = BUILDINGS[best];
      if (!col.has(B.tech) || col.buildings.some((b) => !b.done)) return false;
      const old = this.homes(col).filter((b) => b.done && BUILDINGS[b.type].home < B.home).sort((a, b) => BUILDINGS[a.type].home - BUILDINGS[b.type].home)[0];
      if (!old || !col.canAfford(B.cost)) return false;
      col.pay(B.cost);
      const nb = this.rebuild(col, old, best);
      if (col.isPlayer && nb && col.planet === this.planet && Math.random() < 0.3) this.app.toast(`🏗️ ${col.name} is rebuilding a home as a ${B.name.toLowerCase()}`);
      return !!nb;
    }

    queue(col, type) {
      const B = BUILDINGS[type];
      if (B.tech && !col.has(B.tech)) return false;
      if (B.offworld && !col.offworld) return false;
      if (B.minEra && col.era < B.minEra) return false;
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
      this.storyteller();
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
      if (t % 600 === 0 && col.res.food >= 12 + col.pop * 2 && col.pop < col.housing && eco.list.length < 1400) {
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
        // the guarded area covers the whole town, fields included
        let x0 = col.x - 45 - col.era * 12, x1 = col.x + 45 + col.era * 12;
        for (const b of col.buildings) { x0 = Math.min(x0, b.x - 25); x1 = Math.max(x1, b.x + BUILDINGS[b.type].w + 25); }
        const folk = eco.list.filter((c) => c.colony === col && !c.dead && !c.indoors);
        for (const o of eco.list) {
          if (o.dead || o.sp.civ || !THREATS.has(o.sp.id) || o.x < x0 || o.x > x1 || Math.random() < 0.25) continue;
          // a beast in town gets mobbed by whoever is around
          const near = folk.filter((c) => Math.abs(c.x - o.x) < 10 && Math.abs(c.y - o.y) < 10).length;
          if ((near >= 2 || Math.abs(o.x - col.x) < 16) && col.pop >= 4 && Math.random() < 0.1 + near * 0.08 + col.era * 0.03) {
            eco.fx.burst(o.x, o.cy, ['#ffffff', '#d8d8d8', '#ffd040'], 10, 0.8);
            if (col.isPlayer && col.planet === this.planet) this.app.toast(`🔥 The people of ${col.name} drove off a ${o.sp.name}!`);
            eco.kill(o, null);
            continue;
          }
          const away = o.x < col.x ? -1 : 1;
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
      // a building site nobody can reach (flooded, burnt, cut off) is abandoned and refunded
      if (t % 300 === 0) for (const b of col.buildings) {
        if (b.done || b.old || b.type === 'center' || t - (b.progT || 0) < 60 * 75) continue;
        const W2 = this.world;
        for (let i = 0; i < b.placed; i++) { const [dx, dy, mat] = b.cells[i]; if (W2.get(b.x + dx, b.g - 1 + dy) === mat) W2.set(b.x + dx, b.g - 1 + dy, M.EMPTY); }
        for (const [k, v] of Object.entries(BUILDINGS[b.type].cost)) col.res[k] = (col.res[k] || 0) + v;
        col.buildings.splice(col.buildings.indexOf(b), 1);
        (col.badSpots = col.badSpots || []).push(b.x);
        if (col.isPlayer && col.planet === this.planet) this.app.toast(`🚧 The ${BUILDINGS[b.type].name.toLowerCase()} site was abandoned; the builders will try elsewhere.`);
        break;
      }
      if (t % 900 === 450 && (col.ai || col.autoBuild) && !col.species && !col.offworld) this.upgradeHomes(col);
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

    // ------------------------------------------------------------ storyteller
    // RimWorld-style little events for the player's town in view
    storyteller() {
      const col = this.local;
      if (!col || !col.alive || col.planet !== this.planet || col.pop < 3) return;
      if (this.storyT == null) this.storyT = 60 * 60 * U.rand(3, 5);
      if (--this.storyT > 0) return;
      this.storyT = 60 * 60 * U.rand(3, 6);
      const eco = this.eco, W = this.world, app = this.app;
      const evs = [['wanderer', 3], ['traders', col.era >= 1 ? 3 : 0], ['harvest', col.hasBuilt('farm') ? 2 : 0], ['festival', 2], ['wolves', this.opts.difficulty !== 'peaceful' && !col.offworld ? 1.5 : 0], ['blight', col.built('farm') > 1 ? 1 : 0], ['inspiration', 2]];
      switch (U.weighted(evs.filter((e) => e[1] > 0))) {
        case 'wanderer': {
          const side = Math.random() < 0.5 ? -1 : 1;
          const x = U.clamp(col.x + side * 120, 3, W.w - 4);
          const c = this.spawnVillager(col, x);
          if (c) { c.tx = col.x; c.ty = Brain.gy(W, col.x) - 1; app.toast(`🧳 A wanderer named ${c.cname} asks to join ${col.name}.`); }
          break;
        }
        case 'traders': {
          // swap some of what we have most of for what we lack most
          const keys = Object.keys(col.res).filter((k) => !['food'].includes(k));
          const rich = keys.sort((a, b) => col.res[b] - col.res[a])[0];
          const wants = new Set(); for (const cost of [col.research && TECHS[col.research].cost, col.wanted && BUILDINGS[col.wanted].cost]) for (const k in cost || {}) if (col.res[k] < cost[k]) wants.add(k);
          const need = [...wants][0] || ['copper', 'tin', 'iron', 'stone', 'wood'].find((k) => col.res[k] < 20) || 'food';
          const give = Math.min(40, Math.floor(col.res[rich] * 0.3));
          if (give < 5 || rich === need) { app.toast(`🐫 A trader caravan passes ${col.name} by.`); break; }
          col.res[rich] -= give; col.res[need] = (col.res[need] || 0) + Math.ceil(give * 0.7);
          app.toast(`🐫 Traders visit ${col.name}: ${give} ${rich} traded for ${Math.ceil(give * 0.7)} ${need}.`);
          break;
        }
        case 'harvest':
          for (const b of col.buildings) if (b.type === 'farm' && b.done) { b.ripe = true; Brain.setCrop(W, b, 2); }
          app.toast(`🌾 A bumper crop! The fields of ${col.name} are ready early.`);
          break;
        case 'festival':
          col.knowledge += 10 + col.pop * 2;
          for (const c of eco.list) if (c.colony === col && Math.random() < 0.5) eco.fx.glyph(c.x, c.y - 10, 'heart', '#ff8aa8');
          app.toast(`🎉 ${col.name} holds a festival. Spirits (and ideas) are high.`);
          break;
        case 'inspiration':
          col.knowledge += 20 + col.era * 25;
          app.toast(`💡 A scholar of ${col.name} has a flash of inspiration!`);
          break;
        case 'blight': {
          const f = col.buildings.find((b) => b.type === 'farm' && b.done);
          if (f) { f.ripe = false; f.grow = 0; Brain.setCrop(W, f, 0); }
          app.toast(`🥀 Blight! A field of ${col.name} has withered.`);
          break;
        }
        case 'wolves': {
          const side = Math.random() < 0.5 ? -1 : 1;
          const id = ['wolf', 'bear', 'boar'].find((k) => S[k]) || null;
          if (!id) break;
          for (let i = 0; i < (id === 'wolf' ? 3 : 1); i++) { const x = U.clamp(col.x + side * (90 + i * 4), 3, W.w - 4); eco.spawn(id, x, Brain.gy(W, x) - 1); }
          app.toast(`🐺 ${id === 'wolf' ? 'A wolf pack' : 'A wild ' + S[id].name.toLowerCase()} is prowling near ${col.name}!`);
          break;
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
        for (const o of this.colonies) if (o.emp === col.emp && o.alive) this.renew(o);
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
      if (pop >= col.housing - 2 && this.homes(col).length < this.maxHomes(col)) {
        let best = null;
        for (let e = col.era; e >= 0 && !best; e--) { const h = HOME_BY_ERA[e]; if (col.has(BUILDINGS[h].tech) && (BUILDINGS[h].minEra || 0) <= col.era) best = h; }
        list.push(best);
      }
      if (col.era >= 1 && !col.built('well')) list.push('well');
      if (col.has('pottery') && col.era >= 2 && col.built('market') < 1 + Math.floor(pop / 30)) list.push('market');
      if (col.has('writing') && col.era >= 3 && !col.built('temple')) list.push('temple');
      if (col.has('agriculture') && col.built('farm') < 1 + Math.floor(pop / 10)) list.push('farm');
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
          if (b.type === 'stockpile') this.drawStock(ctx, col, b);
          if (b.type === 'launchpad' && !(b.launchT > 0)) this.drawRocket(ctx, b.x + 6, b.g - 2, lights, false);
          if (b.type === 'derrick') { const k = Math.sin(t * 0.06) * 2; ctx.fillStyle = '#3a3a3a'; ctx.fillRect(b.x + 1, Math.round(b.g - 7 + k), 5, 1); }
        }
        for (const k in col.markers) {
          const m = col.markers[k];
          if (m.t <= 0) continue;
          const wave = (t >> 4) & 1;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.round(m.x), Math.round(m.y) - 12, 1, 12);
          ctx.fillStyle = MARK_COL[k] || COLORS[col.color];
          ctx.fillRect(Math.round(m.x) + 1, Math.round(m.y) - 12 + wave, 5, 3);
          ctx.fillRect(Math.round(m.x) + 1, Math.round(m.y) - 11 - wave, 4, 1);
        }
      }
    }

    // piles of logs, stone and sacks that grow and shrink with the stores
    drawStock(ctx, col, b) {
      const r = col.res, gy = b.g - 1;
      const logs = Math.min(12, Math.floor(r.wood / 12));
      for (let i = 0; i < logs; i++) {
        const row = Math.floor(i / 3), k = i % 3;
        ctx.fillStyle = (i & 1) ? '#7a5030' : '#6a4426';
        ctx.fillRect(b.x + k, gy - row, 1, 1);
      }
      const stone = Math.min(10, Math.floor(r.stone / 12));
      for (let i = 0; i < stone; i++) {
        const row = i < 4 ? 0 : i < 7 ? 1 : i < 9 ? 2 : 3, k = i < 4 ? i : i < 7 ? i - 4 : i < 9 ? i - 7 : 0;
        ctx.fillStyle = (i % 3) ? '#8a8a8e' : '#6e6e74';
        ctx.fillRect(b.x + 3 + k + (row >> 1), gy - row, 1, 1);
      }
      const sacks = Math.min(5, Math.floor(r.food / 30));
      for (let i = 0; i < sacks; i++) { ctx.fillStyle = i % 2 ? '#c8a860' : '#b8944a'; ctx.fillRect(b.x + i, gy - 4 - (i % 2), 1, 1); }
      const ore = ['copper', 'tin', 'iron', 'coal', 'gold'].filter((k) => r[k] >= 5);
      ore.forEach((k, i) => { ctx.fillStyle = { copper: '#c8703a', tin: '#d8dce4', iron: '#a8482a', coal: '#2a2a2e', gold: '#f0c030' }[k]; ctx.fillRect(b.x + 6, gy - i, 1, 1); });
    }

    // what the settlement has grown into
    rank(col) {
      const p = col.pop, e = col.era;
      if (col.offworld) return p < 10 ? 'Outpost' : p < 25 ? 'Base' : 'Colony';
      if (p >= 70 && e >= 5) return 'Metropolis';
      if (p >= 40 && e >= 4) return 'City';
      if (p >= 22 && e >= 2) return 'Town';
      if (p >= 10) return 'Village';
      return 'Camp';
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
        for (let i = 0; i < 4; i++) { const s = this.eco.spawn('soldier', out.x + U.randInt(-5, 5), Brain.gy(this.world, out.x) - 1, {}); if (s) this.dress(s, out); }
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
        const g = Brain.gy(W, cx);
        if (W.isLiquid(cx, g) || !Brain.safe(W, cx) || natives.some((o) => Math.abs(o.x - cx) < Math.min(220, W.w / 3))) continue;
        let flat = 0;
        for (let dx = -8; dx <= 8; dx += 4) flat = Math.max(flat, Math.abs(Brain.gy(W, cx + dx) - g));
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
      for (let k = 0; k < 60; k++) { const cx = Math.round(W.w * (0.15 + rng() * 0.7)); if (!W.isLiquid(cx, Brain.gy(W, cx)) && Brain.safe(W, cx)) { x = cx; break; } }
      const era = DS.Space.BY[id].fantasy ? 6 : 3;
      const emp = { res: Object.fromEntries(RES.map(([k]) => [k, 0])), knowledge: 0, techs: new Set(Object.keys(TECHS).filter((t) => TECHS[t].era <= Math.min(era, 4))), era, research: null, autoResearch: false };
      emp.res.food = 200; emp.res.wood = 100;
      const col = this.found(x, 1 + (this.colonies.filter((c) => c.species).length % 3), `${S[kinds.worker].name}s of ${DS.Space.BY[id].name}`, { isPlayer: false, ai: true, emp, species: kinds, people: 8, planet: id });
      emp.home = col;
      col.weights = { food: 3, wood: 2, stone: 1, mining: 1, research: 0.5, build: 2, military: this.opts.difficulty === 'peaceful' ? 0 : 2 };
      for (const type of ['pod', 'pod', 'spire']) { const b = this.placeBuilding(col, type); if (b) this.progress(col, b, 1e9); }
      col.raidT = 60 * 60 * (this.opts.difficulty === 'hard' ? 2 : 4);
      for (let i = 0; i < 3; i++) { const s = this.eco.spawn(kinds.soldier, x + U.randInt(-6, 6), Brain.gy(W, x) - 1, {}); if (s) this.dress(s, col); }
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
        const sx = (col.x - v.x) * v.s, sy = (Brain.gy(this.world, col.x) - 16 - v.y) * v.s;
        if (sx < -100 || sx > ctx.canvas.width + 100) continue;
        const label = `${ERAS[col.era].icon} ${col.species ? col.name : this.rank(col) + ' of ' + col.name} · 👥 ${col.pop}`;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        const w = ctx.measureText(label).width + 12;
        ctx.fillRect(sx - w / 2, sy - 14, w, 18);
        ctx.fillStyle = COLORS[col.color];
        ctx.fillRect(sx - w / 2, sy - 14, 3, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, sx, sy);
        if (!col.isPlayer) continue;
        for (const k in col.markers) {
          const m = col.markers[k];
          if (m.t <= 0) continue;
          const busy = this.eco.list.filter((c) => c.colony === col && c.order === k && !c.dead).length;
          const mx = (m.x - v.x) * v.s, my = (m.y - 16 - v.y) * v.s;
          ctx.font = '600 11px system-ui, sans-serif';
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          const txt = `${MARK_ICON[k]} ${busy}`;
          const tw = ctx.measureText(txt).width + 8;
          ctx.fillRect(mx - tw / 2, my - 12, tw, 15);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(txt, mx, my);
          ctx.font = '600 12px system-ui, sans-serif';
        }
      }
      ctx.restore();
    }

    // ------------------------------------------------------------ god help
    placeMarker(type, x, y) {
      const col = this.local;
      if (!col || col.planet !== this.planet) return;
      if (!col) return;
      col.markers[type] = { x: Math.round(x), y: Math.round(y), t: 60 * 180 };
      // send the nearest share of the townsfolk (soldiers for attacks)
      const eco = this.eco;
      let crew = eco.list.filter((c) => c.colony === col && !c.dead && (type === 'attack' ? true : !c.sp.soldier));
      if (type === 'attack' && crew.some((c) => c.sp.soldier)) crew = crew.filter((c) => c.sp.soldier);
      crew.sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x));
      const n = type === 'attack' ? crew.length : Math.max(1, Math.ceil(crew.length * (type === 'build' ? 0.5 : 0.6)));
      for (const c of eco.list) if (c.colony === col && c.order === type) c.order = null;
      for (const c of crew.slice(0, n)) {
        c.order = type;
        if (!c.load) { c.phase = null; c.job = null; c.target = null; c.thinkT = U.randInt(0, 20); }
        eco.fx.glyph(c.x, c.y - 10, 'bang', '#ffd040');
      }
      col.markers[type].n = n;
      const verb = { gather: 'to gather', hunt: 'to hunt', mine: 'to dig', build: 'to build', attack: 'to attack' }[type];
      this.app.toast(`🚩 ${n} ${type === 'attack' && crew[0] && crew[0].sp.soldier ? 'soldiers' : 'villagers'} sent ${verb} at the flag`);
    }

    // what a villager is up to, for the tooltip
    describe(c) {
      const role = c.sp.soldier ? (c.colony && c.colony.has('gunpowder') ? 'Rifleman' : 'Soldier') : ROLE[c.job] || 'Villager';
      let doing = c.phase === 'flee' ? 'running from danger!' : c.phase === 'return' && c.load ? `carrying ${Math.max(1, Math.round(c.load.amt))} ${c.load.res} home` : JOB_TEXT[c.job] || 'idling';
      if (c.digT > 0) doing += ' (digging)';
      if (c.order) doing += ' 🚩';
      return `${c.cname || c.sp.name} · ${role} — ${doing}`;
    }

    buildingAt(x, y) {
      for (const col of this.here()) for (const b of col.buildings) {
        const B = BUILDINGS[b.type];
        if (x < b.x - 1 || x > b.x + B.w) continue;
        let top = 0;
        for (const cell of b.cells) top = Math.min(top, cell[1]);
        if (y > b.g + 1 || y < b.g - 1 + top - 2) continue;
        let txt = `${B.name}`;
        if (!b.done) txt += ` — under construction ${Math.floor((b.placed / Math.max(1, b.cells.length)) * 100)}%`;
        else if (B.housing) txt += ` — home for ${B.housing}`;
        else if (b.type === 'farm') txt += b.ripe ? ' — ready to harvest' : ' — growing';
        else if (b.type === 'stockpile') txt += ` — ${Math.floor(col.res.wood)} wood, ${Math.floor(col.res.stone)} stone, ${Math.floor(col.res.food)} food`;
        return `${txt} (${col.name})`;
      }
      return null;
    }

    clearOrders(col) {
      col.markers = {};
      for (const c of this.eco.list) if (c.colony === col) c.order = null;
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
