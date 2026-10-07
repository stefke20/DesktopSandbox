// God mode: tools, panels, keyboard and pointer interaction.
(function () {
  'use strict';
  const DS = window.DS;
  const { U, M, MP } = DS;
  const S = DS.Species;

  const PAINT = [
    ['SAND', 'Sand'], ['DIRT', 'Dirt'], ['STONE', 'Stone'], ['WATER', 'Water'], ['LAVA', 'Lava'],
    ['SNOW', 'Snow'], ['ICE', 'Ice'], ['FIRE', 'Fire'], ['OIL', 'Oil'], ['TOXIC', 'Toxic sludge'],
    ['SEED', 'Seeds'], ['GRASS', 'Grass'], ['WOOD', 'Wood'], ['LEAF', 'Leaves'], ['MUD', 'Mud'],
    ['BRICK', 'Brick'], ['GLASS', 'Glass'], ['CONCRETE', 'Concrete'], ['METAL', 'Metal'], ['ASH', 'Ash'],
    ['VENT', 'Lava vent'], ['EMBERS', 'Eternal flame'], ['SPRING', 'Spring'], ['DRAIN', 'Drain'], ['SOIL', 'Soil'],
    ['BASALT', 'Basalt'], ['SMOKE', 'Smoke'], ['STEAM', 'Steam'], ['ERASE', 'Eraser'],
  ];

  const TERRAIN = [
    ['raise', '⬆️', 'Raise land'], ['lower', '⬇️', 'Lower / dig'], ['flatten', '➖', 'Flatten'],
    ['mountain', '🏔️', 'Mountain (click)'], ['lake', '💧', 'Lake (click)'], ['island', '🏝️', 'Island (click)'],
  ];
  const TERRAIN_MATS = [['soil', 'Soil & grass'], ['stone', 'Stone'], ['sand', 'Sand'], ['snow', 'Snow'], ['clay', 'Mud']];
  const FLORA_GROUPS = [
    ['Trees', ['tree', 'oak', 'birch', 'maple', 'cherry', 'willow', 'fruittree', 'pine', 'spruce', 'cypress', 'palm', 'jungle', 'baobab', 'acacia', 'mangrove', 'joshua', 'datepalm', 'juniper', 'deadtree']],
    ['Shrubs & desert', ['bush', 'berrybush', 'hedge', 'bamboo', 'deadbush', 'cactus', 'pricklypear', 'agave', 'fern', 'fern2']],
    ['Grasses & flowers', ['tuft', 'tallgrass', 'flower', 'tulip', 'lavender', 'sunflower', 'reed', 'cattail', 'mushroom', 'bigmushroom']],
    ['Water plants', ['lily', 'seaweed', 'seagrass', 'kelp', 'coral', 'anemone', 'tubeworm']],
    ['Bug\'s-eye giants', ['blade', 'dandelion', 'clover']],
  ];

  const POWERS = [
    ['lightning', '⚡', 'Lightning', true],
    ['meteor', '☄️', 'Meteor', true],
    ['bomb', '💥', 'Explosion', true],
    ['quake', '〰️', 'Earthquake', true],
    ['smite', '💀', 'Smite', false],
    ['bless', '💞', 'Bless (offspring)', false],
    ['grow', '🌱', 'Grow plants', false],
    ['feed', '🍃', 'Scatter food', false],
    ['heat', '🔥', 'Heat wave', true],
    ['cold', '🧊', 'Ice age', true],
    ['colony', '🐜', 'Ant colony', true],
  ];

  const WEATHER = [
    ['auto', '🔁', 'Auto'], ['clear', '☀️', 'Clear'], ['cloudy', '☁️', 'Cloudy'], ['rain', '🌧️', 'Rain'],
    ['storm', '⛈️', 'Thunderstorm'], ['snow', '🌨️', 'Snow'], ['sandstorm', '🌪️', 'Sandstorm'],
    ['ashfall', '🌋', 'Ash fall'], ['fog', '🌫️', 'Fog'], ['drylightning', '🌩️', 'Dry lightning'], ['windy', '💨', 'Windy'],
  ];

  const el = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
      else if (k === 'html') e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    for (const c of kids) if (c != null) e.append(c);
    return e;
  };

  class God {
    constructor(app) {
      this.app = app;
      this.tool = { kind: 'hand' };
      this.brush = 4;
      this.tab = null;
      this.down = false;
      this.button = 0;
      this.pos = null;
      this.last = null;
      this.vel = [0, 0];
      this.held = null;
      this.timer = 0;
      this.panel = document.getElementById('panel');
      this.label = document.getElementById('tool-label');
      this.tooltip = document.getElementById('tooltip');
      this.bind();
      this.setTool({ kind: 'hand' }, 'Hand');
    }

    get world() { return this.app.world; }
    get eco() { return this.app.eco; }

    // ------------------------------------------------------------ dock & panels
    bind() {
      document.querySelectorAll('.dock-btn').forEach((b) =>
        b.addEventListener('click', () => {
          const tab = b.dataset.tab;
          if (tab === 'hand') { this.setTool({ kind: 'hand' }, 'Hand'); this.openTab(this.tab === 'hand' ? null : 'hand'); return; }
          this.openTab(this.tab === tab ? null : tab);
        }));
      const sel = document.getElementById('biome');
      for (const b of DS.Biomes) sel.append(el('option', { value: b.id }, `${b.icon}  ${b.name}`));
      sel.addEventListener('change', () => { this.app.loadBiome(sel.value); sel.blur(); });

      const cv = this.app.canvas;
      cv.addEventListener('pointerdown', (e) => this.onDown(e));
      window.addEventListener('pointermove', (e) => this.onMove(e));
      window.addEventListener('pointerup', (e) => this.onUp(e));
      cv.addEventListener('contextmenu', (e) => e.preventDefault());
      cv.addEventListener('wheel', (e) => {
        e.preventDefault();
        this.app.poke();
        if (e.shiftKey || e.ctrlKey || e.altKey) this.setBrush(this.brush + (e.deltaY < 0 ? 1 : -1));
        else {
          this.wheelAcc = (this.wheelAcc || 0) + e.deltaY;
          if (Math.abs(this.wheelAcc) >= 60) { this.app.zoomBy(this.wheelAcc < 0 ? 1 : -1, e.clientX, e.clientY); this.wheelAcc = 0; }
        }
      }, { passive: false });
      cv.addEventListener('dblclick', (e) => {
        if (this.tool.kind !== 'hand') return;
        const p = this.toWorld(e);
        const c = this.eco.at(p[0], p[1], 6);
        if (c) { this.app.follow = c; if (this.app.cam.z < 3) this.app.setZoom(3, e.clientX, e.clientY); this.app.toast(`👁 Following ${c.sp.name}`); }
      });
      document.getElementById('zoom-in').addEventListener('click', () => this.app.zoomBy(1));
      document.getElementById('menu-btn').addEventListener('click', () => this.app.menu.open('main'));
      document.getElementById('zoom-out').addEventListener('click', () => this.app.zoomBy(-1));
      window.addEventListener('keydown', (e) => this.onKey(e));
      document.addEventListener('mouseleave', () => { this.app.mouse = null; });
      window.addEventListener('blur', () => { this.app.mouse = null; });
    }

    setBrush(v) {
      this.brush = U.clamp(v, 1, 30);
      const r = document.getElementById('brush-range');
      if (r) r.value = this.brush;
    }

    openTab(tab) {
      this.tab = tab;
      document.querySelectorAll('.dock-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab || (b.dataset.tab === 'hand' && this.tool.kind === 'hand' && !tab)));
      if (!tab) { this.panel.classList.add('hidden'); return; }
      this.panel.classList.remove('hidden');
      this.renderPanel();
    }

    refresh() { if (this.tab) this.renderPanel(); }

    renderPanel() {
      const p = this.panel;
      p.innerHTML = '';
      const app = this.app;
      const brushRow = () => el('div', { class: 'row' }, el('label', {}, 'Brush size'),
        el('input', { type: 'range', min: 1, max: 30, value: this.brush, id: 'brush-range', oninput: (e) => this.setBrush(+e.target.value) }));
      switch (this.tab) {
        case 'hand':
          p.append(el('h4', {}, 'Hand of god'),
            el('div', { class: 'hint', html: 'Click and drag a creature to pick it up, then let go to throw it. Hover to see what it is doing.' }));
          break;
        case 'paint': {
          p.append(el('h4', {}, 'Paint elements'));
          const g = el('div', { class: 'grid' });
          for (const [name, label] of PAINT) {
            const col = name === 'ERASE' ? 'transparent' : MP.colorsHex[M[name]][0];
            const active = this.tool.kind === 'paint' && this.tool.mat === name;
            g.append(el('button', { class: 'chip' + (active ? ' active' : ''), onclick: () => { this.setTool({ kind: 'paint', mat: name }, label); this.renderPanel(); } },
              el('span', { class: 'sw', style: `background:${col};${name === 'ERASE' ? 'border:1px dashed #aaa' : ''}` }), label));
          }
          p.append(g, brushRow(), el('div', { class: 'hint', html: 'Left-drag to paint · right-drag to erase · <kbd>Shift</kbd>+wheel or <kbd>[</kbd> <kbd>]</kbd> changes brush size.' }));
          break;
        }
        case 'life': {
          const native = (app.biome.fauna || []).map(([id]) => id);
          const cat = this.lifeCat || 'native';
          const tabs = el('div', { class: 'tabs' });
          for (const [c, l] of [['native', `Native to ${app.biome.name}`]].concat(DS.SpeciesCats))
            tabs.append(el('button', { class: 'chip' + (cat === c ? ' active' : ''), onclick: () => { this.lifeCat = c; this.lifeQ = ''; this.renderPanel(); } }, l));
          const search = el('input', { type: 'search', placeholder: `Search ${Object.keys(S).length} creatures…`, value: this.lifeQ || '' });
          search.addEventListener('input', () => { this.lifeQ = search.value; this.renderLifeGrid(grid, native); });
          search.addEventListener('keydown', (e) => e.stopPropagation());
          p.append(tabs, el('div', { class: 'row' }, search));
          const grid = el('div', { class: 'grid' });
          p.append(grid, el('div', { class: 'hint', html: 'Click to create; hold and drag to create several. Sea creatures look for the nearest water. Double-click a creature with the hand to follow it.' }));
          this.renderLifeGrid(grid, native);
          break;
        }
        case 'terrain': {
          p.append(el('h4', {}, 'Landscape'));
          const g = el('div', { class: 'grid' });
          for (const [id, icon, label] of TERRAIN) {
            const active = this.tool.kind === 'terrain' && this.tool.id === id;
            g.append(el('button', { class: 'chip' + (active ? ' active' : ''), onclick: () => { this.setTool({ kind: 'terrain', id }, label); this.renderPanel(); } }, `${icon} ${label}`));
          }
          const g2 = el('div', { class: 'grid' });
          for (const [id, label] of TERRAIN_MATS) g2.append(el('button', { class: 'chip' + ((this.terrainMat || 'soil') === id ? ' active' : ''), onclick: () => { this.terrainMat = id; this.renderPanel(); } }, label));
          p.append(g, el('div', { class: 'row' }, el('label', {}, 'Raise with'), g2), brushRow());
          for (const [title, kinds] of FLORA_GROUPS) {
            p.append(el('h4', {}, title));
            const gg = el('div', { class: 'grid' });
            for (const k of kinds) {
              const active = this.tool.kind === 'plant' && this.tool.id === k;
              gg.append(el('button', { class: 'chip' + (active ? ' active' : ''), onclick: () => { this.setTool({ kind: 'plant', id: k }, 'Plant ' + DS.Flora.labels[k]); this.renderPanel(); } }, DS.Flora.labels[k]));
            }
            p.append(gg);
          }
          p.append(el('div', { class: 'hint', html: 'Drag to raise, dig or flatten the ground; click to drop a mountain (click height sets the peak), lake or island. Plants grow where you drag. Paint has springs and drains for rivers.' }));
          break;
        }
        case 'events': {
          p.append(el('h4', {}, 'Special events'));
          const g = el('div', { class: 'grid' });
          for (const id in DS.Events.DEFS) {
            const [label, icon, positional] = DS.Events.DEFS[id];
            const active = this.tool.kind === 'event' && this.tool.id === id;
            const running = app.events.active(id);
            g.append(el('button', { class: 'chip' + (active || running ? ' active' : ''), onclick: () => {
              if (positional) { this.setTool({ kind: 'event', id }, `${label}: click where`); this.openTab(null); }
              else { app.events.start(id); this.renderPanel(); }
            } }, `${icon} ${label}`));
          }
          p.append(g, el('div', { class: 'hint', html: 'Volcano, alien abduction, tornado and black hole: pick one, then click in the world to place it. The others start straight away.' }));
          break;
        }
        case 'powers': {
          p.append(el('h4', {}, 'Godly powers'));
          const g = el('div', { class: 'grid' });
          for (const [id, icon, label] of POWERS) {
            const active = this.tool.kind === 'power' && this.tool.id === id;
            g.append(el('button', { class: 'chip' + (active ? ' active' : ''), onclick: () => { this.setTool({ kind: 'power', id }, label); this.renderPanel(); } }, `${icon} ${label}`));
          }
          p.append(g, brushRow());
          break;
        }
        case 'weather': {
          p.append(el('h4', {}, 'Weather'));
          const g = el('div', { class: 'grid' });
          const w = app.weather;
          for (const [id, icon, label] of WEATHER) {
            const active = id === 'auto' ? w.auto : !w.auto && w.type === id;
            g.append(el('button', { class: 'chip' + (active ? ' active' : ''), onclick: () => { app.setWeather(id); this.renderPanel(); } }, `${icon} ${label}`));
          }
          p.append(g, el('div', { class: 'row' }, el('label', {}, 'Wind'),
            el('input', { type: 'range', min: -25, max: 25, value: Math.round(w.targetWind * 10), oninput: (e) => { w.targetWind = +e.target.value / 10; } })));
          break;
        }
        case 'time': {
          p.append(el('h4', {}, 'Time of day'));
          const g = el('div', { class: 'grid' });
          for (const [t, label] of [[0.25, '🌅 Sunrise'], [0.5, '☀️ Noon'], [0.75, '🌇 Sunset'], [0, '🌙 Midnight']])
            g.append(el('button', { class: 'chip', onclick: () => { app.setTime(t); this.renderPanel(); } }, label));
          p.append(g);
          p.append(el('div', { class: 'row' }, el('label', {}, 'Time'),
            el('input', { type: 'range', min: 0, max: 1000, value: Math.round(app.time * 1000), oninput: (e) => app.setTime(+e.target.value / 1000) })));
          const daySel = el('select', { onchange: (e) => app.setSetting('dayMinutes', +e.target.value) });
          for (const [v, l] of [[0, 'Frozen'], [3, '3 minutes'], [12, '12 minutes'], [30, '30 minutes'], [60, '1 hour'], [-1, 'Real clock']])
            daySel.append(el('option', Object.assign({ value: v }, app.settings.dayMinutes === v ? { selected: '' } : {}), l));
          p.append(el('div', { class: 'row' }, el('label', {}, 'Length of a day'), daySel));
          p.append(el('h4', {}, 'Simulation speed'));
          const g2 = el('div', { class: 'grid' });
          for (const [v, l] of [[0, '⏸ Pause'], [1, '▶ 1×'], [2, '⏩ 2×'], [4, '⏩ 4×']])
            g2.append(el('button', { class: 'chip' + (app.speed === v ? ' active' : ''), onclick: () => { app.setSpeed(v); this.renderPanel(); } }, l));
          p.append(g2);
          break;
        }
        case 'settings':
          this.renderSettings(p);
          break;
        case 'colony':
          this.renderColony(p);
          break;
      }
    }

    // ------------------------------------------------------------ colony mode
    renderColony(p) {
      const civ = this.app.civ;
      const col = civ && civ.local;
      if (!col) { p.append(el('h4', {}, 'Colony'), el('div', { class: 'hint' }, 'Start a colony from the main menu (☰).')); return; }
      const C = DS.Civ;
      const sub = this.colTab || 'overview';
      const tabs = el('div', { class: 'tabs' });
      for (const [id, l] of [['overview', '🏛️ Colony'], ['tech', '🔬 Tech tree'], ['build', '🔨 Build'], ['guide', '🚩 Guide']])
        tabs.append(el('button', { class: 'chip' + (sub === id ? ' active' : ''), onclick: () => { this.colTab = id; this.renderPanel(); } }, l));
      p.append(tabs);
      if (!col.alive) { p.append(el('h4', {}, `💀 ${col.name} has fallen`), el('div', { class: 'hint' }, 'Open the main menu to found a new colony.')); return; }

      if (sub === 'overview') {
        const era = C.ERAS[col.era];
        p.append(el('h4', {}, `${era.icon} ${col.name} · ${era.name}`));
        p.append(el('div', { class: 'col-stats' },
          el('span', {}, `👥 ${col.pop - col.soldiers}/${col.housing}`), el('span', {}, `🛡️ ${col.soldiers}`),
          el('span', {}, `💡 ${Math.floor(col.knowledge)}`), el('span', {}, `🏠 ${col.buildings.filter((b) => b.done).length}`)));
        const res = el('div', { class: 'col-res' });
        for (const [k, icon] of C.RES) if (col.res[k] > 0 || ['food', 'wood', 'stone'].includes(k)) res.append(el('span', { title: k }, `${icon} ${Math.floor(col.res[k])}`));
        p.append(res);
        const r = col.research && C.TECHS[col.research];
        p.append(el('div', { class: 'row' }, el('label', {}, 'Researching'),
          el('span', {}, r ? `${r.name} (${Math.min(100, Math.floor((col.knowledge / r.k) * 100))}%)` : '—')));
        p.append(el('h4', {}, 'Priorities'));
        for (const [k, l] of [['food', '🍖 Food'], ['wood', '🪵 Wood'], ['stone', '🪨 Stone'], ['mining', '⛏️ Mining'], ['research', '🔬 Research'], ['build', '🔨 Building'], ['military', '⚔️ Military']])
          p.append(el('div', { class: 'row' }, el('label', {}, l),
            el('input', { type: 'range', min: 0, max: 6, step: 0.5, value: col.weights[k], oninput: (e) => { col.weights[k] = +e.target.value; } })));
        const auto = el('div', { class: 'grid' },
          el('button', { class: 'chip' + (col.autoResearch ? ' active' : ''), onclick: () => { col.autoResearch = !col.autoResearch; this.renderPanel(); } }, '🔬 Auto research'),
          el('button', { class: 'chip' + (col.autoBuild ? ' active' : ''), onclick: () => { col.autoBuild = !col.autoBuild; this.renderPanel(); } }, '🔨 Auto build'));
        p.append(auto);
        p.append(el('h4', {}, 'Divine help'));
        const now = performance.now();
        const ready = !this.helpAt || now - this.helpAt > 45000;
        const help = el('div', { class: 'grid' });
        const gift = (label, fn) => help.append(el('button', { class: 'chip', onclick: () => { if (performance.now() - (this.helpAt || 0) < 45000) return; fn(); this.helpAt = performance.now(); this.app.toast(label); this.renderPanel(); } }, label));
        if (ready) {
          gift('💡 Inspire', () => { col.knowledge += 25 + 60 * col.era; });
          gift('🍖 Bountiful harvest', () => { col.res.food += 40; });
          gift('🪵 Gift of timber', () => { col.res.wood += 40; });
          gift('🪨 Gift of stone', () => { col.res.stone += 40; });
          gift('👶 Blessed child', () => { for (let i = 0; i < 2; i++) civ.spawnVillager(col); });
        } else help.append(el('div', { class: 'hint' }, `The gods rest… ${Math.ceil((45000 - (now - this.helpAt)) / 1000)}s`));
        p.append(help);
        const rivals = civ.colonies.filter((c) => !c.isPlayer);
        if (rivals.length) {
          p.append(el('h4', {}, 'Rival colonies'));
          for (const o of rivals) {
            const dist = Math.round((o.x - col.x) / 10);
            p.append(el('div', { class: 'row rival' },
              el('span', { class: 'sw', style: `background:${C.COLORS[o.color]}` }),
              el('label', {}, o.alive ? `${C.ERAS[o.era].icon} ${o.name} · 👥 ${o.pop} · 🛡️ ${o.soldiers}` : `💀 ${o.name}`),
              el('button', { class: 'chip', onclick: () => { this.app.cam.x = o.x; this.app.cam.y = this.app.world.groundY(o.x) - 40; this.app.clampCam(); } }, `${dist < 0 ? '◀' : '▶'} ${Math.abs(dist)}`)));
          }
        }
        p.append(el('div', { class: 'row' }, el('button', { class: 'chip', onclick: () => { this.app.cam.x = col.x; this.app.cam.y = this.app.world.groundY(col.x) - 40; this.app.clampCam(); } }, '🏛️ Go to my colony')));
      } else if (sub === 'tech') {
        p.append(el('div', { class: 'hint' }, 'Click a technology to research it next. Knowledge comes from your people; libraries and astronomy speed it up. Some techs also need materials.'));
        for (let e = 0; e < C.ERAS.length; e++) {
          const era = C.ERAS[e];
          const row = el('div', { class: 'tech-era' + (e > col.era ? ' locked' : '') });
          row.append(el('div', { class: 'era-name' }, `${era.icon} ${era.name}` + (e > col.era ? ' 🔒' : e === col.era && e < C.ERAS.length - 1 ? ` · ${Object.keys(C.TECHS).filter((k) => col.has(k) && C.TECHS[k].era === e).length}/${era.need} to advance` : '')));
          const g = el('div', { class: 'tech-row' });
          for (const id in C.TECHS) {
            const T = C.TECHS[id];
            if (T.era !== e) continue;
            const state = col.has(id) ? 'done' : col.research === id ? 'current' : col.available(id) ? 'avail' : 'locked';
            const cost = Object.entries(T.cost || {}).map(([k, v]) => `${(C.RES.find((r) => r[0] === k) || [0, k])[1]}${v}`).join(' ');
            const req = (T.req || []).map((r) => C.TECHS[r].name).join(', ');
            g.append(el('button', {
              class: 'tech ' + state,
              title: `${T.desc}${req ? `\nNeeds: ${req}` : ''}`,
              onclick: () => { if (state === 'avail' || state === 'current') { col.research = state === 'current' ? null : id; this.renderPanel(); } },
            }, el('b', {}, (state === 'done' ? '✓ ' : '') + T.name), el('small', {}, `💡${T.k}${cost ? ' · ' + cost : ''}`)));
          }
          row.append(g);
          p.append(row);
        }
      } else if (sub === 'build') {
        p.append(el('div', { class: 'hint' }, 'Order a building; villagers carry the materials and build it near your 🔨 build flag (or the town centre).'));
        const g = el('div', { class: 'grid' });
        for (const id in C.BUILDINGS) {
          const B = C.BUILDINGS[id];
          if (id === 'center' || B.alien || (!!B.offworld !== col.offworld && !['mine', 'tower', 'barracks', 'lamp'].includes(id))) continue;
          const unlocked = !B.tech || col.has(B.tech);
          const cost = Object.entries(B.cost).map(([k, v]) => `${(C.RES.find((r) => r[0] === k) || [0, k])[1]}${v}`).join(' ');
          const afford = col.canAfford(B.cost);
          g.append(el('button', {
            class: 'chip build' + (unlocked && afford ? '' : ' dim'),
            title: unlocked ? `${B.name}${B.housing ? ` (+${B.housing} housing)` : ''}` : `Needs ${C.TECHS[B.tech].name}`,
            onclick: () => {
              if (!unlocked) return this.app.toast(`🔒 Needs ${C.TECHS[B.tech].name}`);
              if (!afford) return this.app.toast('Not enough materials');
              if (!civ.queue(col, id)) return this.app.toast('No room to build that here');
              this.app.toast(`🔨 ${B.name} ordered`);
              this.renderPanel();
            },
          }, `${unlocked ? '' : '🔒 '}${B.name}`, el('small', {}, ` ${cost} · ${col.built(id)}`)));
        }
        p.append(g);
        const pending = col.buildings.filter((b) => !b.done);
        if (pending.length) p.append(el('div', { class: 'hint' }, 'Under construction: ' + pending.map((b) => `${C.BUILDINGS[b.type].name} ${Math.floor((b.placed / b.cells.length) * 100)}%`).join(', ')));
      } else {
        p.append(el('div', { class: 'hint' }, 'Pick an order, then click in the world. About half of your people (the nearest ones) drop what they are doing and work at the flag for 3 minutes. Attack sends every soldier, or a militia if you have none.'));
        const g = el('div', { class: 'grid' });
        for (const [id, l] of [['gather', '🌳 Gather here (trees, berries)'], ['hunt', '🦌 Hunt & fish here'], ['mine', '⛏️ Mine / quarry here'], ['build', '🔨 Build here'], ['attack', '⚔️ Attack here']]) {
          const active = this.tool.kind === 'guide' && this.tool.id === id;
          const m = col.markers[id];
          g.append(el('button', { class: 'chip' + (active ? ' active' : ''), onclick: () => { this.setTool({ kind: 'guide', id }, l.slice(3) + ': click in the world'); this.renderPanel(); } }, l + (m && m.t > 0 ? ' 🚩' : '')));
        }
        p.append(g, el('div', { class: 'row' }, el('button', { class: 'chip', onclick: () => { civ.clearOrders(col); this.renderPanel(); } }, '✖ Clear all flags')));
      }
    }

    renderLifeGrid(grid, native) {
      grid.innerHTML = '';
      const q = (this.lifeQ || '').trim().toLowerCase();
      const cat = this.lifeCat || 'native';
      let ids = q ? Object.keys(S).filter((id) => S[id].name.toLowerCase().includes(q) || id.includes(q))
        : cat === 'native' ? native : Object.keys(S).filter((id) => S[id].cat === cat);
      if (q || cat !== 'native') ids = ids.sort((a, b) => S[a].name.localeCompare(S[b].name));
      for (const id of ids.slice(0, 200)) {
        const sp = S[id];
        const active = this.tool.kind === 'spawn' && this.tool.id === id;
        grid.append(el('button', { class: 'chip' + (active ? ' active' : ''), title: sp.name, onclick: () => { this.setTool({ kind: 'spawn', id }, sp.name); this.renderLifeGrid(grid, native); } },
          el('img', { src: DS.Sprites.icon(sp, sp.w > 16 ? 1 : sp.w > 9 ? 2 : 3) }), sp.name));
      }
      if (!ids.length) grid.append(el('div', { class: 'hint' }, 'No creatures match.'));
    }

    renderSettings(p) {
      const app = this.app, st = app.settings;
      const select = (key, opts, onChange) => {
        const s = el('select', { onchange: (e) => { const v = isNaN(+e.target.value) ? e.target.value : +e.target.value; onChange ? onChange(v) : app.setSetting(key, v); } });
        for (const [v, l] of opts) s.append(el('option', Object.assign({ value: v }, st[key] === v ? { selected: '' } : {}), l));
        return s;
      };
      const check = (key, onChange) => el('input', { type: 'checkbox', ...(st[key] ? { checked: '' } : {}), onchange: (e) => (onChange ? onChange(e.target.checked) : app.setSetting(key, e.target.checked)) });
      p.append(el('h4', {}, 'Display'),
        el('div', { class: 'row' }, el('label', {}, 'Pixel size'), select('scale', [[2, '2 (tiny, slow)'], [3, '3'], [4, '4'], [5, '5'], [6, '6 (chunky)']])),
        el('div', { class: 'row' }, el('label', {}, 'Frame rate'), select('fps', [[60, '60 fps'], [30, '30 fps (saves battery)']])),
        el('div', { class: 'row' }, el('label', {}, 'Show info'), check('showHud'), el('span', {}, 'clock & weather'), check('showStats'), el('span', {}, 'population')),
        el('div', { class: 'row' }, el('label', {}, 'Edge scrolling'), check('edgePan'), el('span', {}, 'move the mouse to a screen edge to look around')),
        el('div', { class: 'row' }, el('label', {}, 'Hide controls after'), select('idleDelay', [[3, '3 s'], [5, '5 s'], [10, '10 s'], [30, '30 s'], [0, 'never']])),
        el('div', { class: 'row' }, el('label', {}, 'Main menu'), check('showMenu'), el('span', {}, 'show the main menu when the app starts')),
        el('h4', {}, 'Idle mode'),
        el('div', { class: 'row' }, el('label', {}, 'Change biome every'), select('autoCycle', [[0, 'never'], [5, '5 minutes'], [15, '15 minutes'], [30, '30 minutes'], [60, '1 hour']])),
      );
      if (window.desktop) {
        const d = window.desktop;
        p.append(el('h4', {}, 'Desktop'));
        const g = el('div', { class: 'grid' });
        for (const [m, l] of [['window', '🪟 Window'], ['strip', '▁ Desktop strip'], ['wallpaper', '🖼️ Full-screen wallpaper']])
          g.append(el('button', { class: 'chip' + (app.desk.mode === m ? ' active' : ''), onclick: () => { d.setMode(m); app.desk.mode = m; this.renderPanel(); } }, l));
        p.append(g,
          el('div', { class: 'row' }, el('label', {}, 'Strip height'), select('stripHeight', [[0.2, '20%'], [0.3, '30%'], [0.4, '40%'], [0.5, '50%']], (v) => { app.setSetting('stripHeight', v); d.setStripHeight(v); })),
          el('div', { class: 'row' }, el('label', {}, 'Always on top'), el('input', { type: 'checkbox', ...(app.desk.alwaysOnTop ? { checked: '' } : {}), onchange: (e) => { d.setAlwaysOnTop(e.target.checked); app.desk.alwaysOnTop = e.target.checked; } })),
          el('div', { class: 'row' }, el('label', {}, 'Start with computer'), el('input', { type: 'checkbox', ...(app.desk.openAtLogin ? { checked: '' } : {}), onchange: (e) => { d.setOpenAtLogin(e.target.checked); app.desk.openAtLogin = e.target.checked; } })),
          el('div', { class: 'row' }, el('button', { class: 'chip', onclick: () => d.setClickThrough(true) }, '👻 Watch only (click-through)'), el('button', { class: 'chip', onclick: () => d.quit() }, '⏻ Quit')),
          el('div', { class: 'hint', html: 'In watch-only mode clicks pass through to your desktop. Press <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>G</kbd> (or use the tray icon) to play god again.' }));
      }
      p.append(el('div', { class: 'hint', html: 'Keys: <kbd>H</kbd> hide controls · <kbd>Space</kbd> pause · mouse wheel or <kbd>+</kbd> <kbd>-</kbd> zoom · drag or <kbd>WASD</kbd> to pan when zoomed · <kbd>0</kbd> reset zoom · <kbd>B</kbd> next biome · <kbd>N</kbd> day/night · <kbd>R</kbd> rain · <kbd>I</kbd> population · <kbd>[</kbd> <kbd>]</kbd> brush · <kbd>Esc</kbd> hand' }));
    }

    setTool(tool, label) {
      this.tool = tool;
      this.label.textContent = label;
      document.body.classList.toggle('tool-hand', tool.kind === 'hand');
    }

    // ------------------------------------------------------------ input
    toWorld(e) {
      const v = this.app.view();
      return [v.x + e.clientX / v.s, v.y + e.clientY / v.s];
    }

    onDown(e) {
      this.app.poke();
      const p = this.toWorld(e);
      if (e.button === 1) { this.panning = [e.clientX, e.clientY]; e.preventDefault(); return; }
      this.pos = p;
      this.last = p;
      this.down = true;
      this.button = e.button;
      this.timer = 0;
      this.app.canvas.setPointerCapture && this.app.canvas.setPointerCapture(e.pointerId);
      if (this.tab && !['paint', 'powers', 'life', 'terrain', 'colony'].includes(this.tab)) this.openTab(null);
      if (this.tool.kind === 'hand' && e.button === 0) {
        const c = this.eco.at(p[0], p[1], 6);
        if (c) {
          this.held = c;
          c.held = true;
          c.perched = false;
          c.sleep = false;
          document.body.classList.add('grabbing');
        } else if (this.app.cam.z > 1) {
          this.panning = [e.clientX, e.clientY];
          document.body.classList.add('grabbing');
        }
        return;
      }
      if (this.tool.kind === 'power') {
        const def = POWERS.find((q) => q[0] === this.tool.id);
        if (def && def[3]) this.power(this.tool.id, p[0], p[1]);
      }
      if (this.tool.kind === 'spawn') this.spawn(this.tool.id, p[0], p[1]);
      if (this.tool.kind === 'guide') { if (this.app.civ) { this.app.civ.placeMarker(this.tool.id, p[0], p[1]); this.app.toast('🚩 Flag planted'); } this.down = false; this.refresh(); return; }
      if (this.tool.kind === 'event') { this.app.events.start(this.tool.id, p[0], p[1]); this.down = false; return; }
      if (this.tool.kind === 'terrain' && ['mountain', 'lake', 'island'].includes(this.tool.id)) { this.terraformClick(this.tool.id, p[0], p[1]); this.down = false; return; }
      if (this.tool.kind === 'terrain' && this.tool.id === 'flatten') this.flatY = Math.round(p[1]);
      this.apply();
    }

    onMove(e) {
      this.app.mouse = { x: e.clientX, y: e.clientY, overUI: !!(e.target && e.target.closest && e.target.closest('#ui')) };
      if (this.panning) {
        const s = this.app.view().s;
        this.app.panBy(-(e.clientX - this.panning[0]) / s, -(e.clientY - this.panning[1]) / s);
        this.panning = [e.clientX, e.clientY];
      }
      const p = this.toWorld(e);
      if (this.pos) this.vel = [p[0] - this.pos[0], p[1] - this.pos[1]];
      this.pos = p;
      this.app.poke();
      if (this.held) {
        this.held.x = U.clamp(p[0], 1, this.world.w - 2);
        this.held.y = U.clamp(p[1] + (this.held.sp.h >> 1), 1, this.world.h - 2);
      }
      this.updateTooltip(e);
    }

    onUp() {
      if (this.panning) { this.panning = null; document.body.classList.remove('grabbing'); }
      if (this.held) {
        const c = this.held;
        c.held = false;
        c.thrown = true;
        c.throwT = 0;
        c.vx = U.clamp(this.vel[0], -3, 3);
        c.vy = U.clamp(this.vel[1], -3, 3);
        this.held = null;
        document.body.classList.remove('grabbing');
      }
      this.down = false;
    }

    updateTooltip(e) {
      const tt = this.tooltip;
      if (this.tool.kind !== 'hand' || !this.pos || this.held) { tt.style.display = 'none'; return; }
      const c = this.eco.at(this.pos[0], this.pos[1], 5);
      const civ = this.app.civ;
      let text = null;
      if (c && c.sp.civ && civ) text = civ.describe(c);
      else if (!c && civ) text = civ.buildingAt(this.pos[0], this.pos[1]);
      if (text) {
        tt.textContent = text;
        tt.style.display = 'block';
        tt.style.left = Math.min(window.innerWidth - tt.offsetWidth - 6, e.clientX + 14) + 'px';
        tt.style.top = e.clientY + 14 + 'px';
        return;
      }
      if (!c) { tt.style.display = 'none'; return; }
      const sp = c.sp;
      const doing = c.sleep ? 'sleeping' : c.thrown ? 'flying through the air!' : ({
        flee: 'running away', hunt: 'hunting', chase: 'chasing', graze: 'eating', idle: 'resting', perch: 'looking for a perch', wander: sp.ant ? (c.carry ? 'carrying ' + (c.job === 'mound' ? 'soil' : 'food') : c.job || 'exploring') : 'wandering',
      })[c.goal] || c.goal;
      const hunger = sp.metab ? (c.hunger > 0.7 ? ' · starving' : c.hunger > 0.4 ? ' · hungry' : '') : '';
      tt.textContent = `${sp.name} — ${doing}${hunger}`;
      tt.style.display = 'block';
      tt.style.left = Math.min(window.innerWidth - tt.offsetWidth - 6, e.clientX + 14) + 'px';
      tt.style.top = e.clientY + 14 + 'px';
    }

    onKey(e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
      const app = this.app;
      if (app.solar && app.solar.isOpen) { if (e.key === 'Escape') app.solar.close(); return; }
      if (app.menuOpen) { if (e.key === 'Escape' && app.menu.screen !== 'main') app.menu.show('main'); else if (e.key === 'Escape' && app.hasGame) app.menu.close(); return; }
      app.poke();
      switch (e.key) {
        case 'h': case 'H': app.toggleUI(); break;
        case ' ': app.setSpeed(app.speed === 0 ? 1 : 0); e.preventDefault(); break;
        case 'b': app.nextBiome(1); break;
        case 'B': app.nextBiome(-1); break;
        case 'n': case 'N': app.setTime(app.daylight > 0.5 ? 0 : 0.5); break;
        case 'r': case 'R': app.setWeather(app.weather.type === 'rain' && !app.weather.auto ? 'clear' : 'rain'); break;
        case 'i': case 'I': app.setSetting('showStats', !app.settings.showStats); break;
        case '+': case '=': app.zoomBy(1); break;
        case '-': case '_': app.zoomBy(-1); break;
        case '0': app.setZoom(1); break;
        case 'ArrowLeft': case 'a': case 'A': app.panBy(-12 / app.cam.z, 0); break;
        case 'ArrowRight': case 'd': case 'D': app.panBy(12 / app.cam.z, 0); break;
        case 'ArrowUp': case 'w': case 'W': app.panBy(0, -8 / app.cam.z); break;
        case 'ArrowDown': case 's': case 'S': app.panBy(0, 8 / app.cam.z); break;
        case 'f': case 'F': app.follow = null; break;
        case '[': this.setBrush(this.brush - 1); break;
        case ']': this.setBrush(this.brush + 1); break;
        case 'Escape': this.setTool({ kind: 'hand' }, 'Hand'); this.openTab(null); app.follow = null; break;
        default: return;
      }
      this.refresh();
    }

    // called every simulation tick
    update() {
      if (this.tab === 'colony' && this.app.frame % 60 === 0 && !this.panel.matches(':hover')) this.renderPanel();
      if (!this.down || !this.pos || this.held) return;
      this.timer++;
      this.apply();
    }

    apply() {
      const [x, y] = this.pos;
      const t = this.tool;
      if (this.button === 2) { this.strokeLine((cx, cy) => this.paintAt(cx, cy, 'ERASE')); return; }
      switch (t.kind) {
        case 'paint':
          this.strokeLine((cx, cy) => this.paintAt(cx, cy, t.mat));
          break;
        case 'spawn':
          if (this.timer > 0 && this.timer % 12 === 0) this.spawn(t.id, x + U.rand(-this.brush, this.brush), y);
          break;
        case 'terrain': {
          const W = this.world, cx = Math.round(x);
          if (this.timer % 2) break;
          if (t.id === 'raise') DS.Terrain.raise(W, cx, this.brush, this.terrainMat || 'soil');
          else if (t.id === 'lower') DS.Terrain.lower(W, cx, this.brush);
          else if (t.id === 'flatten') DS.Terrain.flatten(W, cx, this.brush, this.flatY == null ? Math.round(y) : this.flatY);
          break;
        }
        case 'plant':
          if (this.timer % 8 === 0) {
            for (let k = 0; k < Math.max(1, this.brush / 6); k++) DS.Terrain.plantAt(this.world, x + U.rand(-this.brush, this.brush), y - this.brush, t.id);
          }
          break;
        case 'power': {
          const def = POWERS.find((q) => q[0] === t.id);
          if (def && !def[3]) this.power(t.id, x, y);
          break;
        }
      }
      this.last = this.pos;
    }

    strokeLine(fn) {
      const [x1, y1] = this.pos;
      const [x0, y0] = this.last || this.pos;
      const d = Math.hypot(x1 - x0, y1 - y0);
      const steps = Math.max(1, Math.ceil(d / Math.max(1, this.brush * 0.5)));
      for (let i = 0; i <= steps; i++) fn(Math.round(U.lerp(x0, x1, i / steps)), Math.round(U.lerp(y0, y1, i / steps)));
    }

    paintAt(cx, cy, name) {
      const W = this.world, r = this.brush;
      const mat = M[name];
      const kind = name === 'ERASE' ? -1 : MP.kind[mat];
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > r * r + r * 0.5) continue;
          const x = cx + dx, y = cy + dy;
          if (!W.inb(x, y)) continue;
          const t = W.get(x, y);
          if (t === M.BEDROCK) continue;
          if (kind === -1) { if (t !== M.EMPTY) W.set(x, y, M.EMPTY); continue; }
          if (mat === M.FIRE) {
            if ((t === M.EMPTY && Math.random() < 0.25) || MP.flammable[t] > 0) W.set(x, y, M.FIRE, 50 + ((Math.random() * 60) | 0));
            continue;
          }
          if (kind === DS.KIND.static) {
            if (t !== mat) W.set(x, y, mat);
          } else if ((t === M.EMPTY || MP.kind[t] === DS.KIND.gas) && Math.random() < (kind === DS.KIND.gas ? 0.2 : 0.4)) {
            W.set(x, y, mat);
          }
        }
      }
    }

    spawn(id, x, y) {
      const W = this.world, sp = S[id];
      x = U.clamp(Math.round(x), 2, W.w - 3);
      y = U.clamp(Math.round(y), 1, W.h - 2);
      if (sp.hab === 'water' && !W.isLiquid(x, y)) {
        let found = null;
        for (let r = 1; r < 50 && !found; r++) {
          for (let k = 0; k < 12; k++) {
            const a = (k / 12) * Math.PI * 2;
            const px = Math.round(x + Math.cos(a) * r), py = Math.round(y + Math.sin(a) * r);
            if (W.get(px, py) === M.WATER && W.get(px, py - 2) === M.WATER) { found = [px, py]; break; }
          }
        }
        if (found) [x, y] = found;
      }
      if (sp.hab !== 'water' && sp.hab !== 'burrow') {
        let k = 0;
        while (k++ < 30 && W.isSolid(x, y)) y--;
      }
      const c = this.eco.spawn(id, x, sp.hab === 'water' ? y + (sp.h >> 1) : y);
      if (c) {
        c.age = Math.max(c.age, sp.mature + 1);
        c.hunger = 0.1;
        this.eco.fx.burst(x, y - sp.h / 2, ['#ffffff', '#fff6b0', '#b0f0ff'], 8, 0.8, 0, 20);
      }
    }

    terraformClick(id, x, y) {
      const W = this.world, r = Math.max(4, this.brush * 2);
      if (id === 'mountain') {
        const g = W.floorY(U.clamp(Math.round(x), 0, W.w - 1));
        DS.Terrain.mountain(W, Math.round(x), Math.min(Math.round(y), g - 8), { half: g - y > 4 ? undefined : r * 2 });
      } else if (id === 'lake') DS.Terrain.lake(W, x, r);
      else if (id === 'island') DS.Terrain.island(W, x, r);
      this.app.weather.shake = Math.max(this.app.weather.shake, 8);
    }

    power(id, x, y) {
      const app = this.app, W = this.world, eco = this.eco, fx = eco.fx;
      const r = this.brush;
      switch (id) {
        case 'lightning': app.weather.strike(x); break;
        case 'meteor': app.addMeteor(x, y); break;
        case 'bomb':
          W.explode(x, y, 6, fx);
          eco.killNear(x, y, 8, 'burn');
          fx.burst(x, y, ['#ffd040', '#ff7a1a', '#ff3a10', '#ffffff'], 40, 2.2, 0.05, 30);
          app.weather.shake = 14;
          break;
        case 'quake': app.quake(); break;
        case 'smite':
          if (this.timer % 3 === 0) eco.killNear(x, y, r + 1, 'zap');
          break;
        case 'bless':
          if (this.timer % 25 === 0) {
            for (const c of eco.list.slice()) {
              if (c.dead || U.dist2(c.x, c.cy, x, y) > (r + 4) * (r + 4)) continue;
              c.hunger = 0;
              if (c.sp.ant || c.sp.hab === 'vehicle') continue;
              if ((eco.count[c.sp.id] || 0) < c.sp.max * 1.5 && eco.list.length < eco.cap && Math.random() < 0.6) eco.birth(c);
            }
            fx.glyph(x - 1, y - 4, 'heart', '#ff5a8a');
          }
          break;
        case 'grow':
          if (this.timer % 3 === 0) {
            const kinds = app.biome.seeds || [['tree', 1]];
            for (let k = 0; k < 2; k++) {
              const gx = Math.round(x + U.rand(-r, r));
              let gy = Math.round(y - r);
              while (gy < y + r && gy < W.h - 1 && !W.isSolid(gx, gy) && !W.isLiquid(gx, gy)) gy++;
              const t = W.get(gx, gy);
              if (t === M.DIRT || t === M.SOIL) W.set(gx, gy, M.GRASS);
              if ((t === M.WATER) && W.get(gx, gy - 1) === M.EMPTY) continue;
              if ([M.DIRT, M.SOIL, M.GRASS, M.SAND, M.MUD, M.SNOW, M.ASH].includes(t) && W.get(gx, gy - 1) === M.EMPTY && Math.random() < 0.4) {
                W.set(gx, gy - 1, M.PLANT);
                W.addGrower(gx, gy - 1, U.weighted(kinds));
              }
            }
            fx.add(x + U.rand(-r, r), y + U.rand(-r, r), 0, -0.2, '#9aff6a', 20, 0);
          }
          break;
        case 'feed':
          if (this.timer % 2 === 0) {
            for (let k = 0; k < 2; k++) {
              const px = Math.round(x + U.rand(-r, r)), py = Math.round(y + U.rand(-r, r));
              if (W.get(px, py) === M.EMPTY) W.set(px, py, Math.random() < 0.5 ? M.SEED : M.LITTER);
            }
          }
          break;
        case 'heat': app.tempOffset = 30; app.tempOffsetT = 60 * 90; break;
        case 'cold': app.tempOffset = -40; app.tempOffsetT = 60 * 90; break;
        case 'colony': {
          const col = DS.Ants.found(eco, Math.round(x), Math.round(y));
          if (col) fx.burst(col.ex, W.groundY(col.ex) - 2, ['#ffffff', '#fff6b0'], 10, 0.8, 0, 20);
          break;
        }
      }
    }

    drawOverlay(ctx, v) {
      document.getElementById('zoom-label').textContent = this.app.cam.z + '×';
      if (!this.pos || document.body.classList.contains('idle')) return;
      const t = this.tool;
      if (t.kind === 'hand') return;
      const showBrush = t.kind === 'paint' || t.kind === 'plant' || (t.kind === 'terrain' && !['mountain', 'lake', 'island'].includes(t.id)) || (t.kind === 'power' && ['smite', 'bless', 'grow', 'feed'].includes(t.id));
      const big = t.kind === 'terrain' && ['lake', 'island'].includes(t.id) ? Math.max(4, this.brush * 2) : 0;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const r = (big || (showBrush ? this.brush + 0.5 : 4)) * v.s;
      ctx.arc((this.pos[0] - v.x) * v.s, (this.pos[1] - v.y) * v.s, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  DS.God = God;
})();
