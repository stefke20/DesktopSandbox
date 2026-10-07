// Particles: blood, sparks, debris that turns into cells, hearts, zzz.
(function () {
  'use strict';
  const DS = window.DS;
  const { U, M, MP } = DS;

  const GLYPHS = {
    heart: ['r.r', 'rrr', '.r.'],
    z: ['zzz', '..z', '.z.', 'z..', 'zzz'],
    bang: ['w', 'w', '.', 'w'],
    note: ['.w', '.w', 'ww'],
  };

  class FX {
    constructor(world) {
      this.world = world;
      this.p = [];
      this.glyphs = [];
    }

    add(x, y, vx, vy, color, life = 30, grav = 0.08, mat = 0) {
      if (this.p.length > 3000) return;
      this.p.push({ x, y, vx, vy, color, life, grav, mat });
    }

    burst(x, y, color, n = 8, speed = 1, grav = 0.08, life = 25) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = Math.random() * speed;
        this.add(x, y, Math.cos(a) * s, Math.sin(a) * s - speed * 0.4, Array.isArray(color) ? U.pick(color) : color, life + U.randInt(-8, 8), grav);
      }
    }

    debris(x, y, vx, vy, mat) {
      const cols = MP.colorsHex[mat];
      this.add(x, y, vx, vy, cols[0], 300, 0.12, mat);
    }

    glyph(x, y, kind, color) {
      if (this.glyphs.length > 80) return;
      this.glyphs.push({ x, y, kind, color, life: 50 });
    }

    update() {
      const W = this.world;
      const p = this.p;
      for (let i = p.length - 1; i >= 0; i--) {
        const q = p[i];
        q.life--;
        q.vy += q.grav;
        const nx = q.x + q.vx, ny = q.y + q.vy;
        if (q.mat) {
          const t = W.get(Math.round(nx), Math.round(ny));
          if (t !== M.EMPTY && MP.kind[t] !== DS.KIND.gas) {
            const px = Math.round(q.x), py = Math.round(q.y);
            if (W.get(px, py) === M.EMPTY && W.inb(px, py)) W.set(px, py, q.mat);
            p[i] = p[p.length - 1];
            p.pop();
            continue;
          }
        }
        q.x = nx;
        q.y = ny;
        if (q.life <= 0 || q.y > W.h + 5 || q.x < -5 || q.x > W.w + 5) {
          if (q.mat && q.life <= 0) {
            const px = Math.round(q.x), py = Math.round(q.y);
            if (W.get(px, py) === M.EMPTY && W.inb(px, py)) W.set(px, py, q.mat);
          }
          p[i] = p[p.length - 1];
          p.pop();
        }
      }
      for (let i = this.glyphs.length - 1; i >= 0; i--) {
        const g = this.glyphs[i];
        g.life--;
        g.y -= 0.15;
        if (g.life <= 0) this.glyphs.splice(i, 1);
      }
    }

    draw(ctx) {
      for (const q of this.p) {
        ctx.fillStyle = q.color;
        ctx.fillRect(Math.round(q.x), Math.round(q.y), 1, 1);
      }
      for (const g of this.glyphs) {
        const rows = GLYPHS[g.kind];
        ctx.globalAlpha = Math.min(1, g.life / 20);
        ctx.fillStyle = g.color;
        for (let y = 0; y < rows.length; y++)
          for (let x = 0; x < rows[y].length; x++)
            if (rows[y][x] !== '.') ctx.fillRect(Math.round(g.x) + x, Math.round(g.y) + y, 1, 1);
      }
      ctx.globalAlpha = 1;
    }
  }

  DS.FX = FX;
})();
