// Main menu: Sandbox, World and Colony modes, with world setup screens.
(function () {
  'use strict';
  const DS = window.DS;
  const S = DS.Species;
  const KEY = 'pixel-terrarium.worldsetup';

  const el = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (attrs[k] !== false && attrs[k] != null) e.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    }
    for (const c of kids) if (c != null) e.append(c);
    return e;
  };

  const BIOME_GROUPS = [
    ['❄️ Cold', ['arctic', 'snowy', 'iceage', 'taiga', 'mountain']],
    ['🌳 Temperate', ['grasslands', 'autumn', 'lake', 'pond', 'river', 'wetlands', 'suburbs', 'enchanted', 'bamboo']],
    ['☀️ Warm & dry', ['desert', 'oasis', 'mesa', 'savanna', 'wasteland']],
    ['🌴 Tropical', ['rainforest', 'swamp', 'prehistoric']],
    ['🌊 Coast & ocean', ['beach', 'reef', 'sea', 'deepsea']],
  ];
  const DESC = {
    sandbox: 'Pick any landscape and play god in it. Everything from before: paint, spawn, powers and events.',
    world: 'One huge world generated from many biomes that blend into each other, with believable neighbours.',
    colony: 'A huge world with your own tribe. Guide it from the Stone Age to the stars, and beware of rival colonies.',
  };

  class Menu {
    constructor(app) {
      this.app = app;
      this.root = el('div', { id: 'menu' });
      document.body.append(this.root);
      this.setup = this.loadSetup();
    }

    loadSetup() {
      const d = { biomes: [], species: [], cats: [], events: [], eventEvery: 8, size: 'medium', seed: '', myth: true, enemies: 2, difficulty: 'normal', name: '' };
      try { return Object.assign(d, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return d; }
    }
    saveSetup() { try { localStorage.setItem(KEY, JSON.stringify(this.setup)); } catch (e) { /* ignore */ } }

    open(screen = 'main') {
      const app = this.app;
      app.menuOpen = true;
      document.body.classList.add('menu-open');
      this.root.classList.remove('hidden');
      if (!app.world || (screen === 'main' && !this.bgLoaded && !app.hasGame)) {
        // a random landscape plays behind the menu
        const ids = DS.Biomes.map((b) => b.id).filter((id) => id !== 'deepsea');
        app.loadBiome(ids[Math.floor(Math.random() * ids.length)]);
        app.setTime(0.3 + Math.random() * 0.35);
        this.bgLoaded = true;
      }
      this.show(screen);
    }

    close() {
      this.app.menuOpen = false;
      this.bgLoaded = false;
      document.body.classList.remove('menu-open');
      this.root.classList.add('hidden');
      this.root.innerHTML = '';
    }

    show(screen, mode) {
      this.screen = screen;
      this.root.innerHTML = '';
      const box = el('div', { class: 'menu-box' + (screen === 'main' ? ' main' : '') });
      this.root.append(box);
      if (screen === 'main') this.main(box);
      else if (screen === 'sandbox') this.sandbox(box);
      else this.worldSetup(box, mode || screen);
    }

    main(box) {
      box.append(
        el('div', { class: 'menu-title' }, 'Pixel Terrarium'),
        el('div', { class: 'menu-sub' }, 'a living world for your desktop'),
      );
      const cards = el('div', { class: 'mode-cards' });
      const card = (id, icon, name) => el('button', { class: 'mode-card', onclick: () => this.show(id === 'sandbox' ? 'sandbox' : 'setup', id) },
        el('div', { class: 'mode-icon' }, icon), el('div', { class: 'mode-name' }, name), el('div', { class: 'mode-desc' }, DESC[id]));
      cards.append(card('sandbox', '🏝️', 'Sandbox'), card('world', '🌍', 'World'), card('colony', '🏛️', 'Colony'));
      box.append(cards);
      const foot = el('div', { class: 'menu-foot' });
      if (this.app.hasGame) foot.append(el('button', { class: 'chip', onclick: () => this.close() }, '▶ Back to game'));
      if (window.desktop) foot.append(el('button', { class: 'chip', onclick: () => window.desktop.quit() }, '⏻ Quit'));
      box.append(foot);
    }

    sandbox(box) {
      box.append(this.header('🏝️ Sandbox', 'Choose a landscape'));
      const grid = el('div', { class: 'biome-grid' });
      for (const b of DS.Biomes) {
        const animals = (b.fauna || []).slice(0, 4).map(([id]) => S[id] && S[id].name).filter(Boolean).join(', ');
        grid.append(el('button', { class: 'biome-card', onclick: () => { this.app.loadBiome(b.id); this.app.hasGame = true; this.close(); } },
          el('div', { class: 'biome-icon' }, b.icon), el('div', { class: 'biome-name' }, b.name), el('div', { class: 'biome-desc' }, animals)));
      }
      box.append(grid);
    }

    header(title, sub) {
      return el('div', { class: 'menu-header' },
        el('button', { class: 'chip', onclick: () => this.show('main') }, '← Back'),
        el('div', {}, el('div', { class: 'menu-h1' }, title), el('div', { class: 'menu-sub' }, sub)));
    }

    worldSetup(box, mode) {
      const st = this.setup;
      const colony = mode === 'colony';
      box.append(this.header(colony ? '🏛️ Colony' : '🌍 World', colony ? 'Set up your world and your rivals' : 'Choose what your world may contain'));
      const tabs = el('div', { class: 'tabs' });
      const body = el('div', { class: 'setup-body' });
      const names = [['biomes', 'Biomes'], ['creatures', 'Creatures'], ['events', 'Events'], ['world', colony ? 'World & colony' : 'World']];
      const tab = this.setupTab || 'biomes';
      for (const [id, l] of names) tabs.append(el('button', { class: 'chip' + (tab === id ? ' active' : ''), onclick: () => { this.setupTab = id; this.show('setup', mode); } }, l));
      box.append(tabs, body);
      const toggleSet = (key, id, on) => {
        const set = new Set(st[key]);
        if (on) set.delete(id); else set.add(id);
        st[key] = [...set];
        this.saveSetup();
      };
      const chip = (label, on, onclick, title) => el('button', { class: 'chip toggle' + (on ? ' active' : ''), title: title || label, onclick }, (on ? '✓ ' : '') + label);

      if (tab === 'biomes') {
        const excluded = new Set(st.biomes);
        body.append(el('div', { class: 'hint' }, 'Unticked biomes never appear. Neighbouring biomes always make sense (deep sea only borders the sea, deserts never border the arctic...). The beehive, ant hill and backyard lawn are a different scale and are not part of world maps.'));
        for (const [g, ids] of BIOME_GROUPS) {
          const all = ids.every((id) => !excluded.has(id));
          const row = el('div', { class: 'grid' });
          for (const id of ids) {
            const b = DS.BiomeMap[id];
            row.append(chip(`${b.icon} ${b.name}`, !excluded.has(id), () => { toggleSet('biomes', id, excluded.has(id)); this.show('setup', mode); }));
          }
          body.append(el('h4', {}, el('label', { class: 'group-toggle' }, el('input', { type: 'checkbox', checked: all, onchange: (e) => { const s = new Set(st.biomes); for (const id of ids) e.target.checked ? s.delete(id) : s.add(id); st.biomes = [...s]; this.saveSetup(); this.show('setup', mode); } }), ' ' + g)), row);
        }
      } else if (tab === 'creatures') {
        const offCats = new Set(st.cats), offSp = new Set(st.species);
        body.append(el('div', { class: 'hint' }, 'Turn whole groups on or off, or open a group to pick individual creatures. Turned-off creatures never appear on their own, but you can still create them with the god tools.'));
        for (const [c, label] of DS.SpeciesCats) {
          const on = !offCats.has(c);
          const ids = Object.keys(S).filter((id) => S[id].cat === c && !S[id].lawn).sort((a, b) => S[a].name.localeCompare(S[b].name));
          const open = this.openCat === c;
          body.append(el('div', { class: 'cat-row' },
            el('label', { class: 'group-toggle' }, el('input', { type: 'checkbox', checked: on, onchange: () => { toggleSet('cats', c, !on); this.show('setup', mode); } }), ` ${label} `),
            el('span', { class: 'muted' }, `${ids.filter((id) => !offSp.has(id)).length}/${ids.length}`),
            el('button', { class: 'chip small', onclick: () => { this.openCat = open ? null : c; this.show('setup', mode); } }, open ? 'hide' : 'choose…')));
          if (open) {
            const g = el('div', { class: 'grid' });
            for (const id of ids) g.append(chip(S[id].name, on && !offSp.has(id), () => { toggleSet('species', id, offSp.has(id)); this.show('setup', mode); }));
            body.append(g);
          }
        }
      } else if (tab === 'events') {
        const off = new Set(st.events);
        body.append(el('div', { class: 'row' }, el('label', {}, 'Random disasters'), this.select([[0, 'never'], [15, 'rarely (every ~15 min)'], [8, 'sometimes (~8 min)'], [3, 'often (~3 min)']], st.eventEvery, (v) => { st.eventEvery = +v; this.saveSetup(); })));
        const g = el('div', { class: 'grid' });
        for (const id in DS.Events.DEFS) {
          const [label, icon] = DS.Events.DEFS[id];
          g.append(chip(`${icon} ${label}`, !off.has(id), () => { toggleSet('events', id, off.has(id)); this.show('setup', mode); }));
        }
        body.append(el('h4', {}, 'Events that may happen'), g, el('div', { class: 'hint' }, 'You can always trigger any event yourself from the 🌋 button.'));
      } else {
        body.append(
          el('div', { class: 'row' }, el('label', {}, 'World size'), this.select([['small', 'Small'], ['medium', 'Medium'], ['large', 'Large'], ['huge', 'Huge']], st.size, (v) => { st.size = v; this.saveSetup(); })),
          el('div', { class: 'row' }, el('label', {}, 'Seed'), el('input', { type: 'text', placeholder: 'random', value: st.seed, oninput: (e) => { st.seed = e.target.value; this.saveSetup(); }, onkeydown: (e) => e.stopPropagation() })),
        );
        if (colony) {
          body.append(
            el('div', { class: 'row' }, el('label', {}, 'Your colony'), el('input', { type: 'text', placeholder: 'random name', value: st.name, oninput: (e) => { st.name = e.target.value; this.saveSetup(); }, onkeydown: (e) => e.stopPropagation() })),
            el('div', { class: 'row' }, el('label', {}, 'Rival colonies'), this.select([[0, 'none'], [1, '1'], [2, '2'], [3, '3']], st.enemies, (v) => { st.enemies = +v; this.saveSetup(); })),
            el('div', { class: 'row' }, el('label', {}, 'Rivals'), this.select([['peaceful', 'Peaceful (never attack)'], ['normal', 'Normal'], ['hard', 'Aggressive']], st.difficulty, (v) => { st.difficulty = v; this.saveSetup(); })),
          );
        }
      }
      const enabledBiomes = DS.WorldGen.eligible().filter((b) => !st.biomes.includes(b.id));
      const start = el('button', { class: 'chip start', disabled: !enabledBiomes.length, onclick: () => this.start(colony) }, colony ? '🏛️ Found the colony' : '🌍 Create world');
      box.append(el('div', { class: 'menu-foot' }, enabledBiomes.length ? null : el('span', { class: 'muted' }, 'Pick at least one biome. '), start));
    }

    select(opts, value, onchange) {
      const s = el('select', { onchange: (e) => onchange(e.target.value) });
      for (const [v, l] of opts) s.append(el('option', { value: v, selected: String(v) === String(value) }, l));
      return s;
    }

    start(colony) {
      const st = this.setup;
      const offB = new Set(st.biomes), offC = new Set(st.cats), offS = new Set(st.species);
      const enabled = new Set(DS.WorldGen.eligible().map((b) => b.id).filter((id) => !offB.has(id)));
      if (colony) {
        // a colony needs somewhere to live
        const land = [...enabled].filter((id) => !DS.WorldGen.P[id].ocean);
        if (!land.length) enabled.add('grasslands');
      }
      const allowed = (id) => S[id] && !offC.has(S[id].cat) && !offS.has(id);
      let seed = null;
      if (st.seed) { seed = 0; for (const ch of String(st.seed)) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0; }
      const opts = {
        enabled, allowed, myth: !offC.has('myth'), size: st.size, seed,
        events: new Set(Object.keys(DS.Events.DEFS).filter((id) => !st.events.includes(id))), eventEvery: st.eventEvery,
        colony, enemies: st.enemies, difficulty: st.difficulty, name: st.name,
      };
      this.root.innerHTML = '<div class="menu-box main"><div class="menu-title">Creating world…</div></div>';
      setTimeout(() => {
        this.app.loadWorld(opts);
        this.app.hasGame = true;
        this.close();
      }, 30);
    }
  }

  DS.Menu = Menu;
})();
