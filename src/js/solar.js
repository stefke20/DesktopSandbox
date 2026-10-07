// Solar system overview (Colony mode): pick a world to visit, colonise or conquer.
(function () {
  'use strict';
  const DS = window.DS;

  const el = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    for (const c of kids) if (c != null) e.append(c);
    return e;
  };

  const STATUS = {
    home: ['🏠 Home world', '#7ad0ff'],
    outpost: ['🏗️ Your outpost', '#5ad070'],
    contested: ['⚔️ Contested', '#ff6a5a'],
    travelling: ['🚀 Ship on its way', '#ffd04a'],
    open: ['🔓 Within reach', '#ffd04a'],
    locked: ['🔒 Out of reach', '#7a7a8a'],
    none: ['', '#7a7a8a'],
  };

  class Solar {
    constructor(app) {
      this.app = app;
      this.root = el('div', { id: 'solar', class: 'hidden' });
      this.canvas = el('canvas');
      this.card = el('div', { class: 'solar-card' });
      this.top = el('div', { class: 'solar-top' });
      this.root.append(this.canvas, this.top, this.card, el('button', { class: 'solar-close', title: 'Close (Esc)', onclick: () => this.close() }, '✕'));
      document.body.append(this.root);
      this.ctx = this.canvas.getContext('2d');
      this.sel = null;
      this.t = 0;
      this.canvas.addEventListener('pointerdown', (e) => this.click(e));
      this.canvas.addEventListener('pointermove', (e) => { this.hover = this.hit(e.clientX, e.clientY); this.canvas.style.cursor = this.hover ? 'pointer' : 'default'; });
      // the button that opens it
      this.btn = el('button', { id: 'solar-btn', title: 'Solar system', onclick: () => this.open() }, '🪐 Solar system');
      document.body.append(this.btn);
    }

    get isOpen() { return !this.root.classList.contains('hidden'); }

    open() {
      if (!this.app.civ) return;
      this.root.classList.remove('hidden');
      document.body.classList.add('solar-open');
      this.sel = this.sel || this.app.planet || 'earth';
      this.renderCard();
      this.renderTop();
      const loop = () => { if (!this.isOpen) return; this.draw(); requestAnimationFrame(loop); };
      loop();
    }

    close() {
      this.root.classList.add('hidden');
      document.body.classList.remove('solar-open');
    }

    // ------------------------------------------------------------ layout
    layout() {
      const w = this.canvas.width = window.innerWidth, h = this.canvas.height = window.innerHeight;
      const cx = Math.round(Math.min(w * 0.42, w - 340)), cy = Math.round(h * 0.54);
      const sc = Math.min(cx - 30, (h * 0.42) / 0.6) / 240;
      return { w, h, cx, cy, sc };
    }

    // orbits are drawn on a compressed scale so the inner planets get some room
    od(d) { return 236 * Math.pow(d / 236, 0.62); }

    pos(b, L) {
      if (!b.dist) return [L.cx, L.cy];
      const ph = b.phase != null ? b.phase : ([...b.id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 997, 7) / 997);
      const a = ph * Math.PI * 2 + (this.t / (b.period * 60)) * Math.PI * 2;
      if (b.parent) {
        const [px, py] = this.pos(DS.Space.BY[b.parent], L);
        const d = b.dist * 0.9 * Math.max(1, L.sc) + 8;
        return [px + Math.cos(a) * d, py + Math.sin(a) * d * 0.55];
      }
      const d = this.od(b.dist) * L.sc;
      return [L.cx + Math.cos(a) * d, L.cy + Math.sin(a) * d * 0.6];
    }

    radius(b, L) { return Math.max(3, Math.round(b.r * L.sc * (b.kind === 'star' ? 0.75 : 1.1))); }

    hit(mx, my) {
      const L = this.layout();
      let best = null, bd = 1e9;
      for (const b of DS.Space.BODIES) {
        const [x, y] = this.pos(b, L);
        const d = Math.hypot(mx - x, my - y) - this.radius(b, L);
        if (d < 8 && d < bd) { bd = d; best = b.id; }
      }
      return best;
    }

    click(e) {
      const id = this.hit(e.clientX, e.clientY);
      if (!id) return;
      this.sel = id;
      this.renderCard();
    }

    // ------------------------------------------------------------ drawing
    disc(ctx, x, y, r, col) {
      ctx.fillStyle = col;
      for (let dy = -r; dy <= r; dy++) { const hw = Math.round(Math.sqrt(r * r - dy * dy)); ctx.fillRect(Math.round(x) - hw, Math.round(y) + dy, hw * 2 + 1, 1); }
    }

    draw() {
      this.t++;
      const L = this.layout(), ctx = this.ctx, civ = this.app.civ;
      ctx.fillStyle = '#04050c';
      ctx.fillRect(0, 0, L.w, L.h);
      // stars
      if (!this.stars) { this.stars = []; for (let i = 0; i < 400; i++) this.stars.push([Math.random(), Math.random(), Math.random()]); }
      for (const [x, y, b] of this.stars) { ctx.fillStyle = `rgba(255,255,240,${0.2 + b * 0.6 * (0.7 + 0.3 * Math.sin(this.t * 0.02 + b * 40))})`; ctx.fillRect(Math.round(x * L.w), Math.round(y * L.h), 1, 1); }
      // orbits
      ctx.strokeStyle = 'rgba(140,160,220,0.16)';
      ctx.lineWidth = 1;
      const seen = new Set();
      for (const b of DS.Space.BODIES) {
        if (!b.dist || b.parent || seen.has(b.dist)) continue;
        seen.add(b.dist);
        ctx.beginPath(); ctx.ellipse(L.cx, L.cy, this.od(b.dist) * L.sc, this.od(b.dist) * L.sc * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
      }
      // asteroid belt
      for (let i = 0; i < 260; i++) {
        const a = i * 2.39996 + this.t * 0.0004 * (1 + (i % 7) * 0.05), d = this.od(98 + (i * 37 % 16)) * L.sc;
        ctx.fillStyle = 'rgba(170,160,140,0.5)';
        ctx.fillRect(Math.round(L.cx + Math.cos(a) * d), Math.round(L.cy + Math.sin(a) * d * 0.6), 1, 1);
      }
      // sun glow
      const g = ctx.createRadialGradient(L.cx, L.cy, 0, L.cx, L.cy, 60 * L.sc);
      g.addColorStop(0, 'rgba(255,220,120,0.5)'); g.addColorStop(1, 'rgba(255,200,80,0)');
      ctx.fillStyle = g; ctx.fillRect(L.cx - 60 * L.sc, L.cy - 60 * L.sc, 120 * L.sc, 120 * L.sc);
      // bodies
      ctx.font = '600 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      for (const b of DS.Space.BODIES) {
        const [x, y] = this.pos(b, L);
        const r = this.radius(b, L);
        const st = civ ? civ.status(b.id) : 'none';
        if (b.ring) { ctx.fillStyle = '#c8b890'; ctx.fillRect(Math.round(x - r * 2), Math.round(y), r * 4 + 1, 1); }
        this.disc(ctx, x, y, r, b.color);
        if (b.kind !== 'star') { ctx.fillStyle = 'rgba(0,0,12,0.4)'; for (let dy = -r; dy <= r; dy++) { const hw = Math.round(Math.sqrt(r * r - dy * dy)); ctx.fillRect(Math.round(x) + Math.round(hw * 0.2), Math.round(y) + dy, hw - Math.round(hw * 0.2) + 1, 1); } }
        if (b.ring) { ctx.fillStyle = '#c8b890'; ctx.fillRect(Math.round(x - r * 2), Math.round(y + 1), r * 4 + 1, 1); }
        // status ring
        if (b.tier != null || b.id === this.sel) {
          const col = b.id === this.sel ? '#ffffff' : STATUS[st] ? STATUS[st][1] : '#7a7a8a';
          if (st === 'outpost' || st === 'contested' || st === 'home' || b.id === this.sel || (st === 'travelling' && (this.t >> 4) % 2)) {
            ctx.strokeStyle = col; ctx.lineWidth = b.id === this.sel ? 2 : 1;
            ctx.beginPath(); ctx.arc(x, y, r + 4, 0, Math.PI * 2); ctx.stroke();
          }
        }
        if (this.app.planet === b.id) { ctx.fillStyle = '#ffffff'; ctx.fillText('▼', x, y - r - 8); }
        if (b.id === this.hover || b.id === this.sel || b.kind === 'planet' || b.kind === 'giant' || b.kind === 'star') {
          ctx.fillStyle = st === 'locked' ? 'rgba(200,200,220,0.55)' : 'rgba(240,240,255,0.9)';
          ctx.fillText((st === 'locked' ? '🔒 ' : '') + b.name, x, y + r + 14);
        }
      }
      // ships in flight
      if (civ) for (const m of civ.missions) {
        const [ax, ay] = this.pos(DS.Space.BY.earth, L), [bx, by] = this.pos(DS.Space.BY[m.body], L);
        const p = 1 - m.t / m.total;
        ctx.strokeStyle = 'rgba(255,208,74,0.35)'; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#ffd04a';
        ctx.fillRect(Math.round(ax + (bx - ax) * p) - 1, Math.round(ay + (by - ay) * p) - 1, 3, 3);
      }
      if (this.t % 30 === 0) { this.renderTop(); if (this.sel) this.renderCard(true); }
    }

    // ------------------------------------------------------------ panels
    renderTop() {
      const civ = this.app.civ, col = civ && civ.player;
      const T = DS.Civ.TIERS, TE = DS.Civ.TECHS;
      this.top.innerHTML = '';
      if (!col) return;
      const era = DS.Civ.ERAS[col.era];
      this.top.append(el('div', { class: 'solar-title' }, `${era.icon} ${col.name} · ${era.name}`));
      const row = el('div', { class: 'tier-row' });
      for (const k in T) {
        const ok = civ.tierOpen(+k, col);
        const missing = T[k].techs.filter((t) => !col.has(t)).map((t) => TE[t].name);
        row.append(el('span', { class: 'tier' + (ok ? ' ok' : ''), title: ok ? 'Unlocked' : 'Needs ' + missing.join(' + ') }, `${ok ? '✓' : '🔒'} Tier ${k}`));
      }
      this.top.append(row);
      if (col.era < 5) this.top.append(el('div', { class: 'hint' }, 'Reach the Space Age (Rocketry) to send ships. You can still visit any world as a god.'));
    }

    renderCard(soft) {
      const id = this.sel, civ = this.app.civ, app = this.app;
      const B = DS.Space.BY[id];
      if (!B) return;
      if (soft && this.card.matches(':hover')) return;
      const P = DS.Space.PLANETS[id];
      const st = civ.status(id);
      const c = this.card;
      c.innerHTML = '';
      c.append(el('h3', {}, `${B.icon} ${B.name}`));
      if (B.tier) c.append(el('div', { class: 'sub' }, `Exploration tier ${B.tier}${B.fantasy ? ' · legendary world' : ''}`));
      if (STATUS[st] && STATUS[st][0]) c.append(el('div', { class: 'status', style: `color:${STATUS[st][1]}` }, STATUS[st][0]));
      c.append(el('p', {}, B.desc || ''));
      if (P) {
        const res = P.res.map((r) => (DS.Civ.RES.find((q) => q[0] === r) || [r, '•'])[1] + ' ' + r).join('  ');
        c.append(el('div', { class: 'kv' }, el('b', {}, 'Resources '), res));
        const life = P.fauna.map(([sid]) => DS.Species[sid] && DS.Species[sid].name).filter(Boolean).slice(0, 6).join(', ');
        c.append(el('div', { class: 'kv' }, el('b', {}, 'Life '), life));
        if (P.natives) c.append(el('div', { class: 'kv' }, el('b', {}, 'Natives '), DS.Species[DS.AlienCiv[P.natives].worker].name + 's'));
        c.append(el('div', { class: 'kv' }, el('b', {}, 'Temperature '), `${P.temp}°C`));
      }
      const btns = el('div', { class: 'grid' });
      const out = civ.colonies.find((q) => q.isPlayer && q.alive && q.planet === id);
      if (id === 'earth' || P) {
        btns.append(el('button', { class: 'chip start', onclick: () => { this.close(); app.goPlanet(id); } }, app.planet === id ? '👁 Back to the surface' : id === 'earth' ? '🌍 Return to Earth' : '🔭 Visit'));
      }
      if (P && B.tier) {
        const T = DS.Civ.TIERS[B.tier];
        const cost = Object.entries(T.cost).map(([k, v]) => `${(DS.Civ.RES.find((q) => q[0] === k) || [k, k])[1]}${v}`).join(' ');
        if (st !== 'travelling') btns.append(el('button', { class: 'chip', onclick: () => this.act(() => civ.launch(id, 'colony')) }, `🚀 ${out ? 'Send more colonists' : 'Send colony ship'} (${cost})`));
        if (out) btns.append(el('button', { class: 'chip', onclick: () => this.act(() => civ.launch(id, 'troops')) }, '🪖 Send troops (🛢️40 ⚙️30)'));
        const nat = civ.colonies.find((q) => q.species && q.alive && q.planet === id);
        if (out && nat) btns.append(el('button', { class: 'chip', onclick: () => { out.raid = nat; app.toast(`⚔️ Attacking the ${nat.name}!`); } }, '⚔️ Attack the natives'));
        if (!civ.tierOpen(B.tier)) c.append(el('div', { class: 'hint' }, 'Needs ' + T.techs.map((t) => DS.Civ.TECHS[t].name).join(' + ') + '.'));
        else if (!civ.pad()) c.append(el('div', { class: 'hint' }, 'Build a 🚀 launch pad on Earth first (Colony panel → Build).'));
      }
      c.append(btns);
    }

    act(fn) {
      const err = fn();
      if (err) this.app.toast(err);
      this.renderCard();
    }
  }

  DS.Solar = Solar;
})();
