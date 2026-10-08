// Saving and loading games (IndexedDB, so big worlds fit). A save regenerates
// the same world from its seed (zones, scenery) and then restores the exact
// terrain, creatures, colonies, research and every visited planet.
(function () {
  'use strict';
  const DS = window.DS;
  const S = DS.Species;
  const META = 'pixel-terrarium.saves';
  const SLOTS = [['auto', '🔁 Autosave'], ['quick', '⚡ Quicksave'], ['slot1', '💾 Slot 1'], ['slot2', '💾 Slot 2'], ['slot3', '💾 Slot 3']];

  // ---------------------------------------------------------------- storage
  let dbp = null;
  function db() {
    if (!dbp) dbp = new Promise((res, rej) => {
      const r = indexedDB.open('pixel-terrarium', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('saves');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  async function put(key, val) {
    const d = await db();
    return new Promise((res, rej) => { const tx = d.transaction('saves', 'readwrite'); tx.objectStore('saves').put(val, key); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
  }
  async function get(key) {
    const d = await db();
    return new Promise((res, rej) => { const r = d.transaction('saves').objectStore('saves').get(key); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  }
  async function del(key) {
    const d = await db();
    return new Promise((res) => { const tx = d.transaction('saves', 'readwrite'); tx.objectStore('saves').delete(key); tx.oncomplete = res; tx.onerror = res; });
  }
  const meta = () => { try { return JSON.parse(localStorage.getItem(META) || '{}'); } catch (e) { return {}; } };
  const setMeta = (m) => { try { localStorage.setItem(META, JSON.stringify(m)); } catch (e) { /* ignore */ } };

  // ---------------------------------------------------------------- snapshot
  function snapWorld(app, civIdx) {
    const W = app.world, eco = app.eco;
    const creatures = [];
    for (const c of eco.list) {
      if (c.dead || c.sp.ant || c.sp.hive || c.sp.queen) continue;
      const o = { id: c.sp.id, x: Math.round(c.x), y: Math.round(c.y), dir: c.dir, age: c.age, hunger: c.hunger };
      if (c.vkey) { o.vkey = c.vkey; o.vpal = c.vpal; }
      if (c.mutant) o.mutant = 1;
      if (c.cname) o.cname = c.cname;
      if (c.sp.civ && c.colony && civIdx.has(c.colony)) o.col = civIdx.get(c.colony);
      if (c.home && c.home.col && civIdx.has(c.home.col)) o.home = { x: c.home.x, r: c.home.r, col: civIdx.get(c.home.col) };
      creatures.push(o);
    }
    return { w: W.w, h: W.h, cells: W.cells.slice(), shade: W.shade.slice(), life: W.life.slice(), creatures, cam: Object.assign({}, app.cam), weather: app.weather.type };
  }

  function snapCiv(civ) {
    const cols = civ.colonies, idx = new Map(cols.map((c, i) => [c, i]));
    const emps = [], empIdx = new Map();
    for (const c of cols) if (!empIdx.has(c.emp)) { empIdx.set(c.emp, emps.length); emps.push(c.emp); }
    return {
      idx,
      data: {
        t: civ.t, storyT: civ.storyT, missions: civ.missions, visited: [...civ.visited],
        emps: emps.map((e) => ({ res: e.res, knowledge: e.knowledge, techs: [...e.techs], era: e.era, research: e.research, autoResearch: e.autoResearch, home: idx.get(e.home) })),
        colonies: cols.map((c) => ({
          x: c.x, name: c.name, color: c.color, isPlayer: c.isPlayer, ai: c.ai, difficulty: c.difficulty, planet: c.planet, species: c.species || null,
          weights: c.weights, markers: c.markers, autoBuild: c.autoBuild, raidT: c.raidT, raid: c.raid ? idx.get(c.raid) : null, quarryX: c.quarryX, badSpots: c.badSpots || [],
          t: c.t, alive: c.alive, pop: c.pop, soldiers: c.soldiers, wanted: c.wanted || null, emp: empIdx.get(c.emp),
          buildings: c.buildings.map((b) => ({ type: b.type, x: b.x, g: b.g, cells: b.cells, placed: b.placed, progress: b.progress, progT: b.progT, cost: b.cost, done: b.done, grow: b.grow, ripe: b.ripe, crops: b.crops || null, launchT: b.launchT || 0, old: b.old || null })),
        })),
      },
    };
  }

  function serializeOpts(o) {
    if (!o) return null;
    const r = Object.assign({}, o);
    delete r.allowed;
    if (o.enabled) r.enabled = [...o.enabled];
    if (o.events) r.events = [...o.events];
    return r;
  }
  function reviveOpts(o) {
    const r = Object.assign({}, o);
    if (o.enabled) r.enabled = new Set(o.enabled);
    if (o.events) r.events = new Set(o.events);
    const offC = new Set((o.off && o.off.cats) || []), offS = new Set((o.off && o.off.species) || []);
    r.allowed = (id) => S[id] && !offC.has(S[id].cat) && !offS.has(id);
    return r;
  }

  function snapshot(app) {
    const civ = app.civ;
    const cs = civ ? snapCiv(civ) : { idx: new Map(), data: null };
    const planets = {};
    planets[app.planet || 'earth'] = snapWorld(app, cs.idx);
    // other visited planets are snapshotted from their parked slots
    for (const id in app.planets || {}) {
      if (id === (app.planet || 'earth')) continue;
      const cur = app.saveSlot();
      app.loadSlotQuiet(app.planets[id]);
      planets[id] = snapWorld(app, cs.idx);
      app.loadSlotQuiet(cur);
    }
    return {
      v: 1, date: Date.now(), mode: app.mode, biome: app.mode === 'sandbox' ? app.biome.id : null, seed: app.worldSeed,
      opts: serializeOpts(app.worldOpts), time: app.time, planet: app.planet || 'earth', planets, civ: cs.data,
    };
  }

  // ---------------------------------------------------------------- restore
  function applyWorld(app, snap, cols) {
    const W = app.world, eco = app.eco;
    if (snap.w !== W.w || snap.h !== W.h) return false;
    W.cells.set(snap.cells); W.shade.set(snap.shade); W.life.set(snap.life);
    W.growers = [];
    W.frame++;
    eco.list = []; eco.count = {};
    for (const o of snap.creatures) {
      if (!S[o.id]) continue;
      const c = eco.spawn(o.id, o.x, o.y, {});
      if (!c) continue;
      c.dir = o.dir; c.age = o.age; c.hunger = o.hunger;
      if (o.vkey) { c.vkey = o.vkey; c.vpal = o.vpal; }
      if (o.mutant) c.mutant = true;
      if (o.cname) c.cname = o.cname;
      if (o.col != null && cols[o.col]) { c.colony = cols[o.col]; c.speedMul = c.colony.speedMult(); }
      if (o.home && cols[o.home.col]) c.home = { x: o.home.x, r: o.home.r, col: cols[o.home.col] };
    }
    app.cam = Object.assign({}, snap.cam);
    app.clampCam();
    if (snap.weather) app.weather.set(snap.weather, true);
    return true;
  }

  function restoreCiv(app, data, opts) {
    const civ = new DS.Civ(app, opts);
    const emps = data.emps.map((e) => ({ res: e.res, knowledge: e.knowledge, techs: new Set(e.techs), era: e.era, research: e.research, autoResearch: e.autoResearch, home: null }));
    const cols = data.colonies.map((d) => {
      const col = new DS.Civ.Colony(civ, { x: d.x, name: d.name, color: d.color, isPlayer: d.isPlayer, ai: d.ai, difficulty: d.difficulty, planet: d.planet, species: d.species || undefined, emp: emps[d.emp] });
      Object.assign(col, { weights: d.weights, markers: d.markers || {}, autoBuild: d.autoBuild, raidT: d.raidT, quarryX: d.quarryX, badSpots: d.badSpots, t: d.t, alive: d.alive, pop: d.pop, soldiers: d.soldiers, wanted: d.wanted, buildings: d.buildings });
      return col;
    });
    data.colonies.forEach((d, i) => { cols[i].raid = d.raid != null ? cols[d.raid] : null; });
    data.emps.forEach((e, i) => { emps[i].home = cols[e.home] || cols.find((c) => c.emp === emps[i]); });
    civ.colonies = cols;
    civ.t = data.t; civ.storyT = data.storyT; civ.missions = data.missions || []; civ.visited = new Set(data.visited || ['earth']);
    DS.Civ.refreshThreats();
    return { civ, cols };
  }

  function restore(app, s) {
    app.events.clear();
    if (s.mode === 'sandbox') {
      app.loadBiome(s.biome, s.seed);
      applyWorld(app, s.planets.earth, []);
    } else {
      const opts = reviveOpts(s.opts || {});
      opts.seed = s.seed;
      app.loadWorld(opts);
      let cols = [];
      if (s.civ) { const r = restoreCiv(app, s.civ, opts); app.civ = r.civ; cols = r.cols; }
      applyWorld(app, s.planets.earth, cols);
      // rebuild every planet that had been visited
      for (const id in s.planets) {
        if (id === 'earth') continue;
        app.goPlanet(id, true);
        applyWorld(app, s.planets[id], cols);
      }
      if (s.planet && s.planet !== app.planet) app.goPlanet(s.planet, true);
      const cur = s.planets[s.planet || 'earth'];
      if (cur) { app.cam = Object.assign({}, cur.cam); app.clampCam(); }
    }
    app.setTime(s.time || 0.3);
    app.hasGame = true;
    if (app.god) app.god.refresh();
    app.updateHud();
  }

  // ---------------------------------------------------------------- public
  function summary(app) {
    if (app.mode === 'sandbox') return `${app.biome.icon} Sandbox · ${app.biome.name}`;
    const col = app.civ && app.civ.player;
    if (col) return `🏛️ ${col.name} · ${DS.Civ.ERAS[col.era].name} · 👥 ${col.pop}`;
    return `🌍 World · ${(app.worldOpts && app.worldOpts.size) || 'medium'}`;
  }

  const Saves = {
    SLOTS,
    list() { return meta(); },
    async save(slot, app = DS.App) {
      if (!app.hasGame || !app.world) return false;
      const snap = snapshot(app);
      await put(slot, snap);
      const m = meta();
      m[slot] = { date: snap.date, text: summary(app) };
      setMeta(m);
      return true;
    },
    async load(slot, app = DS.App) {
      const s = await get(slot);
      if (!s) return false;
      restore(app, s);
      return true;
    },
    async remove(slot) {
      await del(slot);
      const m = meta(); delete m[slot]; setMeta(m);
    },
    has(slot) { return !!meta()[slot]; },
    ago(ts) {
      const s = Math.max(0, (Date.now() - ts) / 1000);
      if (s < 60) return 'just now';
      if (s < 3600) return `${Math.round(s / 60)} min ago`;
      if (s < 86400) return `${Math.round(s / 3600)} h ago`;
      return new Date(ts).toLocaleDateString();
    },
  };
  DS.Saves = Saves;
})();
