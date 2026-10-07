// Ant colonies: queens, foraging workers, tunnel digging, fungus gardens.
(function () {
  'use strict';
  const DS = window.DS;
  const { U, M, MP } = DS;

  const FOOD = new Set([M.LEAF, M.NEEDLE, M.LITTER, M.PLANT, M.FLOWER, M.SEED, M.VINE, M.LILY, M.TALLGRASS, M.AUTUMN, M.BERRY]);

  class Colony {
    constructor(x, y, ex) {
      this.x = x; // royal chamber
      this.y = y;
      this.ex = ex; // entrance column
      this.food = 6;
      this.queen = null;
      this.dead = false;
      this.workers = 0;
      this.dug = 0;
      this.max = 70;
      this.t = 0;
      this.chambers = [[x, y]];
    }

    update(eco) {
      this.t++;
      let n = 0;
      for (const c of eco.list) if (c.colony === this && !c.sp.queen) n++;
      this.workers = n;
      const queenAlive = this.queen && !this.queen.dead;
      if (!queenAlive && n === 0) { this.dead = true; return; }
      if (!queenAlive) return;
      if (this.t % 70 === 0 && this.food >= 2 && n < this.max && eco.list.length < eco.cap) {
        this.food -= 2;
        const q = this.queen;
        const a = eco.spawn(this.workerId, q.x, q.y, { colony: this, newborn: true });
        if (a) eco.fx.add(q.x, q.y - 1, 0, -0.05, '#f4f0e0', 30, 0);
      }
      // the colony slowly eats its fungus garden when hungry
      if (this.t % 600 === 0) {
        this.food = Math.max(0, this.food - n * 0.03);
        if (this.food < 2) this.eatFungus(eco.world);
      }
    }

    eatFungus(W) {
      for (let k = 0; k < 80; k++) {
        const x = this.x + U.randInt(-10, 10), y = this.y + U.randInt(-4, 4);
        if (W.get(x, y) === M.FUNGUS) { W.set(x, y, M.EMPTY); this.food += 2; return; }
      }
    }

    storeFood(W) {
      this.food += 1;
      // grow the fungus garden near a chamber floor
      const [cx, cy] = U.pick(this.chambers);
      for (let k = 0; k < 20; k++) {
        const x = cx + U.randInt(-6, 6), y = cy + U.randInt(-2, 3);
        if (W.get(x, y) === M.EMPTY && MP.solid[W.get(x, y + 1)] && W.get(x, y + 1) !== M.FUNGUS) {
          W.set(x, y, M.FUNGUS);
          return;
        }
        if (W.get(x, y) === M.EMPTY && W.get(x, y + 1) === M.FUNGUS && Math.random() < 0.4) {
          W.set(x, y, M.FUNGUS);
          return;
        }
      }
    }
  }

  function carve(W, x, y, rx, ry) {
    for (let dy = -ry; dy <= ry; dy++)
      for (let dx = -rx; dx <= rx; dx++)
        if ((dx * dx) / (rx * rx + 0.5) + (dy * dy) / (ry * ry + 0.5) <= 1) {
          const t = W.get(x + dx, y + dy);
          if (t !== M.BEDROCK && t !== M.WATER && W.inb(x + dx, y + dy)) W.set(x + dx, y + dy, M.EMPTY);
        }
  }

  function tunnel(W, x0, y0, x1, y1) {
    let x = x0, y = y0;
    let guard = 0;
    while ((x !== x1 || y !== y1) && guard++ < 500) {
      const t = W.get(x, y);
      if (t !== M.BEDROCK && W.inb(x, y)) W.set(x, y, M.EMPTY);
      if (Math.random() < 0.5 && x !== x1) x += Math.sign(x1 - x);
      else if (y !== y1) y += Math.sign(y1 - y);
      else x += Math.sign(x1 - x);
    }
  }

  const Ants = {
    Colony,
    carve,
    tunnel,

    // Found a colony at the surface near x (queen digs a nest)
    found(eco, x, y, opts = {}) {
      const W = eco.world;
      x = U.clamp(x, 4, W.w - 5);
      const gy = W.groundY(x);
      if (gy >= W.h - 6 || W.isLiquid(x, gy)) return null;
      const depth = Math.min(opts.depth || U.randInt(10, 16), Math.floor((W.h - gy) * 0.6));
      if (depth < 4) return null;
      const cx = U.clamp(x + U.randInt(-6, 6), 4, W.w - 5), cy = gy + depth;
      if (!opts.noCarve) {
        tunnel(W, x, gy, cx, cy);
        carve(W, cx, cy, 4, 2);
      }
      const col = new Colony(cx, cy, x);
      eco.colonies.push(col);
      col.queenId = opts.queen || 'antqueen';
      col.workerId = opts.worker || 'ant';
      col.queen = eco.spawn(col.queenId, cx, cy + 1, { colony: col });
      const workers = opts.workers == null ? 6 : opts.workers;
      for (let i = 0; i < workers; i++) eco.spawn(col.workerId, cx + U.randInt(-3, 3), cy, { colony: col });
      return col;
    },

    mayDig(a) {
      const col = a.colony;
      if (!col || col.dead) return true;
      return a.job === 'dig' || a.job === 'return' || a.stuckT > 30 || col.dug < 250 + col.workers * 6;
    },

    decide(a, eco) {
      const W = eco.world, col = a.colony;
      if (!col || col.dead) {
        // lost ant: wander the surface
        if (a.arrived || Math.random() < 0.05) { a.tx = U.clamp(a.x + U.randInt(-30, 30), 1, W.w - 2); a.ty = W.groundY(a.tx) - 1; a.arrived = false; }
        a.goal = 'wander';
        return;
      }
      a.goal = 'wander';
      if (a.sp.queen) {
        a.tx = col.x + U.randInt(-3, 3);
        a.ty = col.y + 1;
        a.arrived = false;
        return;
      }
      if (a.carry) {
        if (a.carry === M.DIRT || a.carry === M.SOIL || a.carry === M.SAND || a.carry === M.MUD || a.carry === M.SNOW) {
          a.job = 'mound';
          a.tx = col.ex + U.randInt(-7, 7);
          a.ty = W.groundY(U.clamp(a.tx, 0, W.w - 1)) - 1;
        } else {
          a.job = 'return';
          const ch = U.pick(col.chambers);
          a.tx = ch[0] + U.randInt(-3, 3);
          a.ty = ch[1];
        }
        a.arrived = false;
        return;
      }
      if (a.job && !a.arrived && a.goalT < 1500 && Math.random() > 0.01) return;
      a.goalT = 0;
      a.arrived = false;
      const r = Math.random();
      const night = eco.daylight < 0.2;
      if (r < (night ? 0.3 : 0.62)) {
        a.job = 'forage';
        a.tx = U.clamp(col.ex + U.randInt(-70, 70), 1, W.w - 2);
        a.ty = W.groundY(a.tx) - 1;
      } else if (r < 0.82 && col.dug < 250 + col.workers * 6) {
        a.job = 'dig';
        const base = U.pick(col.chambers);
        a.tx = U.clamp(base[0] + U.randInt(-20, 20), 2, W.w - 3);
        const gy = W.groundY(a.tx);
        a.ty = U.clamp(base[1] + U.randInt(-6, 10), gy + 3, W.h - 3);
      } else {
        a.job = 'nest';
        const ch = U.pick(col.chambers);
        a.tx = ch[0] + U.randInt(-4, 4);
        a.ty = ch[1];
      }
    },

    // after each step: look for food to cut
    step(a, eco) {
      if (a.sp.queen || a.carry || a.job !== 'forage') return;
      const W = eco.world;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const t = W.get(a.x + dx, a.y + dy);
          if (FOOD.has(t) || (t === M.GRASS && Math.random() < 0.05)) {
            W.set(a.x + dx, a.y + dy, t === M.GRASS ? M.DIRT : M.EMPTY);
            a.carry = t === M.GRASS ? M.PLANT : t;
            a.thinkT = 0;
            return;
          }
        }
      }
    },

    dug(a, eco, t) {
      const col = a.colony;
      if (col) col.dug++;
      if (!a.carry && !a.sp.queen) {
        a.carry = t === M.GRASS ? M.DIRT : t;
        a.thinkT = 0;
      }
    },

    arrive(a, eco) {
      const W = eco.world, col = a.colony;
      if (!col) return;
      if (a.carry) {
        if (a.job === 'mound') {
          // drop the soil on the surface to build the mound
          const spots = [[0, -1], [-1, 0], [1, 0], [-1, -1], [1, -1]];
          for (const [dx, dy] of spots) {
            const x = a.x + dx, y = a.y + dy;
            if (W.get(x, y) === M.EMPTY && Math.abs(x - col.ex) > 1) { W.set(x, y, a.carry === M.GRASS || a.carry === M.SOIL ? M.DIRT : a.carry); break; }
          }
          a.carry = 0;
        } else if (a.job === 'return') {
          col.storeFood(W);
          a.carry = 0;
        }
        a.job = null;
        a.thinkT = 0;
        return;
      }
      if (a.job === 'forage') { a.tx = U.clamp(a.x + U.randInt(-25, 25), 1, W.w - 2); a.ty = W.groundY(a.tx) - 1; a.arrived = false; if (Math.random() < 0.3) a.job = null; return; }
      if (a.job === 'dig' && Math.random() < 0.06 && col.chambers.length < 8 && a.y > W.groundY(a.x) + 5) {
        carve(W, a.x, a.y, 3, 1);
        col.chambers.push([a.x, a.y]);
      }
      a.job = null;
    },
  };

  DS.Ants = Ants;
})();
