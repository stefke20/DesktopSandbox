// Creatures and the ecosystem that runs them.
(function () {
  'use strict';
  const DS = window.DS;
  const { U, M, MP } = DS;
  const S = DS.Species;

  let NEXT_ID = 1;

  class Creature {
    constructor(sp, x, y, opts = {}) {
      this.sp = sp;
      this.id = NEXT_ID++;
      this.x = x;
      this.y = y;
      this.vx = 0;
      this.vy = 0;
      this.dir = Math.random() < 0.5 ? -1 : 1;
      this.age = opts.newborn ? 0 : U.rand(0, Math.min(sp.life * 0.5, sp.mature * 2));
      this.hunger = opts.newborn ? 0.2 : U.rand(0, 0.3);
      this.goal = 'wander';
      this.tx = x;
      this.ty = y;
      this.target = null;
      this.thinkT = U.randInt(0, 15);
      this.anim = U.randInt(0, 50);
      this.sleep = false;
      this.dead = false;
      this.perched = false;
      this.perchT = 0;
      this.mv = 0;
      this.dry = 0;
      this.drown = 0;
      this.goalT = 0;
      this.bumps = 0;
      this.moving = false;
      this.inWater = false;
      this.onGround = false;
      this.thrown = false;
      this.held = false;
      this.carry = 0;
      this.colony = opts.colony || null;
      this.job = null;
      this.vkey = '';
      this.vpal = null;
      if (sp.variants) {
        this.vpal = {};
        for (const k in sp.variants) this.vpal[k] = U.pick(sp.variants[k]);
        this.vkey = Object.values(this.vpal).join(',');
      }
    }

    get cy() { return this.y - (this.sp.h >> 1); }

    die(eco, cause, quiet) {
      if (this.dead) return;
      this.dead = true;
      if (quiet) return;
      const fx = eco.fx;
      const cx = this.x, cy = this.cy;
      if (cause === 'eaten') fx.burst(cx, cy, ['#b0201a', '#d8302a', '#801010'], 6 + this.sp.w, 0.9);
      else if (cause === 'burn' || cause === 'zap') fx.burst(cx, cy, ['#3a3a3a', '#5a5a5a', '#ff8a1a'], 10, 0.8, -0.02, 40);
      else if (cause === 'infect') fx.burst(cx, cy, ['#8aa868', '#5a7a3a'], 10, 0.8);
      else fx.burst(cx, cy, ['#d8d8d8', '#b8b8b8', '#ffffff'], 6, 0.5, -0.01, 30);
    }

    // ----------------------------------------------------------- main update
    update(eco) {
      const sp = this.sp, W = eco.world;
      this.age++;
      this.anim++;
      if (sp.metab) this.hunger += sp.metab;
      if (this.hunger >= 1) return this.die(eco, 'starve');
      if (this.age > sp.life) return this.die(eco, 'old');
      if (sp.onlyNight && eco.daylight > 0.55 && Math.random() < 0.004) return this.die(eco, 'fade', true);
      if (this.held) return;

      // hazards
      const fx = Math.round(this.x), fcy = Math.round(this.cy);
      const here = W.get(fx, fcy), feet = W.get(fx, Math.round(this.y));
      if (here === M.FIRE || here === M.LAVA || feet === M.LAVA || (feet === M.FIRE && Math.random() < 0.3)) return this.die(eco, 'burn');
      if ((here === M.TOXIC || feet === M.TOXIC) && !sp.toxicOk && Math.random() < 0.02) return this.die(eco, 'toxic');
      if (this.y > W.h + 4 || this.x < -10 || this.x > W.w + 10) return this.die(eco, 'lost', true);

      if (this.thrown) return this.ballistic(eco);

      if (--this.thinkT <= 0) {
        this.thinkT = 10 + ((Math.random() * 14) | 0);
        if (sp.ant) DS.Ants.decide(this, eco);
        else this.decide(eco);
      }
      this.goalT++;

      // follow moving targets
      if ((this.goal === 'hunt' || this.goal === 'chase') && this.target) {
        const t = this.target;
        if (t.dead || t.held || this.goalT > 900 || this.bumps > 40) { this.goal = 'wander'; this.target = null; this.bumps = 0; }
        else { this.tx = t.x; this.ty = sp.hab === 'ground' ? this.y : t.y; }
      } else if (this.goal === 'flee' && this.threat && (this.threat.dead || this.goalT > 240)) {
        this.goal = 'wander';
      }

      let mul = 1;
      switch (this.goal) {
        case 'flee': mul = 1.5; break;
        case 'hunt': mul = 1.25; break;
        case 'chase': mul = 1.3; break;
        case 'graze': mul = 0.8; break;
        case 'idle': case 'sleep': mul = 0; break;
      }

      const px = this.x, py = this.y;
      switch (sp.hab) {
        case 'ground': case 'vehicle': case 'roller': this.moveGround(eco, mul); break;
        case 'amph': {
          if (sp.floats && W.isLiquid(Math.round(this.x), Math.round(this.y))) this.moveFloat(eco, mul);
          else if (W.isLiquid(Math.round(this.x), Math.round(this.cy))) this.moveSwim(eco, mul);
          else this.moveGround(eco, mul);
          break;
        }
        case 'water': this.moveSwim(eco, mul); break;
        case 'air': this.moveAir(eco, mul); break;
        case 'climb': case 'burrow': this.moveClimb(eco, mul); break;
      }
      this.moving = Math.abs(this.x - px) + Math.abs(this.y - py) > 0.01;
      if (this.dead) return;

      // interactions
      if (this.goal === 'hunt' || this.goal === 'chase') this.tryCatch(eco);
      else if (this.goal === 'graze') this.tryGraze(eco);

      if (this.sleep && (this.anim % 90) === 0) eco.fx.glyph(this.x + 1, this.y - sp.h - 2, 'z', '#ffffff');
    }

    // ----------------------------------------------------------- decisions
    decide(eco) {
      const sp = this.sp, W = eco.world;
      if (sp.sleeps) {
        const tired = sp.nocturnal ? eco.daylight > 0.65 : eco.daylight < 0.2;
        if (tired && !this.sleep && this.goal !== 'flee' && Math.random() < 0.06) this.sleep = true;
        else if (!tired && this.sleep && Math.random() < 0.12) this.sleep = false;
      }
      if (sp.fears.size) {
        const p = eco.nearest(this, sp.sense * 0.6, (o) => sp.fears.has(o.sp.id) && !o.sleep);
        if (p) {
          this.sleep = false;
          this.setGoal('flee');
          this.threat = p;
          this.perched = false;
          const away = Math.sign(this.x - p.x) || this.dir;
          this.tx = U.clamp(this.x + away * 40, 2, W.w - 3);
          this.ty = sp.hab === 'air' ? Math.max(3, this.y - 20) : sp.hab === 'water' ? this.y + U.rand(-8, 8) : this.y;
          return;
        }
      }
      if (this.sleep) { this.setGoal('sleep'); return; }

      if (this.hunger > 0.35 || sp.infects) {
        if (sp.preySet) {
          if (this.goal === 'hunt' && this.target && !this.target.dead) return;
          const p = eco.nearest(this, sp.sense, (o) => sp.preySet.has(o.sp.id) && eco.canReach(this, o));
          if (p) { this.setGoal('hunt'); this.target = p; return; }
        }
        if (sp.eatSet && this.hunger > 0.35) {
          if (this.goal === 'graze' && this.goalT < 400) return;
          const f = this.findFood(W);
          if (f) { this.setGoal('graze'); this.tx = f[0]; this.ty = f[1]; return; }
        }
      }
      if (this.goal === 'chase' && this.target && !this.target.dead && this.goalT < 300) return;
      if (sp.chaseSet && Math.random() < 0.08) {
        const p = eco.nearest(this, sp.sense, (o) => sp.chaseSet.has(o.sp.id) && eco.canReach(this, o));
        if (p) { this.setGoal('chase'); this.target = p; return; }
      }
      if (sp.breed && this.hunger < 0.5 && this.age > sp.mature && Math.random() < sp.breed && eco.canBreed(sp)) eco.birth(this);

      if (this.goal === 'wander' && !this.arrived && this.goalT < 600 && Math.random() > 0.03) return;
      if (this.goal === 'perch' && this.goalT < 500) return;
      if (this.goal === 'idle' && Math.random() > 0.12) return;
      if (this.perched && Math.random() > 0.05) return;
      this.arrived = false;
      if (sp.hab !== 'air' && sp.hab !== 'water' && Math.random() < sp.idle) { this.setGoal('idle'); return; }
      this.setGoal('wander');
      this.pickWander(eco);
    }

    setGoal(g) {
      if (this.goal !== g) { this.goalT = 0; this.bumps = 0; }
      this.goal = g;
      if (g !== 'hunt' && g !== 'chase') this.target = null;
    }

    pickWander(eco) {
      const sp = this.sp, W = eco.world;
      const x = this.x;
      switch (sp.hab) {
        case 'air': {
          if (sp.perches > 0 && Math.random() < sp.perches) {
            const px = U.clamp(Math.round(x + U.rand(-60, 60)), 2, W.w - 3);
            const ty = eco.topY(px);
            const t = W.get(px, ty);
            if (ty < W.h - 1 && MP.kind[t] !== DS.KIND.liquid && t !== M.FIRE) {
              this.setGoal('perch');
              this.tx = px;
              this.ty = ty - 1;
              return;
            }
          }
          this.tx = U.clamp(x + U.rand(-70, 70), 3, W.w - 4);
          const gy = W.groundY(Math.round(this.tx));
          if (sp.flutter) this.ty = U.clamp(gy - U.rand(2, 18), 2, gy - 2);
          else if (sp.high) this.ty = U.rand(3, Math.max(4, gy * 0.5));
          else this.ty = U.rand(Math.max(3, gy * 0.25), Math.max(4, gy - 5));
          return;
        }
        case 'water': {
          if (sp.school && Math.random() < 0.7) {
            const c = eco.schoolCenter(this, 30);
            if (c) { this.tx = c[0] + U.rand(-8, 8); this.ty = c[1] + U.rand(-4, 4); return; }
          }
          for (let k = 0; k < 20; k++) {
            const tx = Math.round(x + U.rand(-50, 50)), ty = Math.round(this.cy + U.rand(-18, 18));
            if (W.get(tx, ty) === M.WATER && W.get(tx, ty - 1) === M.WATER) { this.tx = tx; this.ty = ty; return; }
          }
          this.tx = x - this.dir * 10;
          this.ty = this.cy;
          return;
        }
        case 'climb': case 'burrow': {
          this.tx = U.clamp(Math.round(x + U.rand(-30, 30)), 1, W.w - 2);
          if (sp.hab === 'burrow') {
            const gy = W.groundY(this.tx);
            this.ty = U.clamp(Math.round(this.y + U.rand(-10, 10)), gy + 2, W.h - 3);
            if (eco.weather && eco.weather.raining && Math.random() < 0.5) this.ty = gy;
          } else if (sp.climbVeg && Math.random() < 0.6) {
            this.ty = eco.topY(this.tx) + U.randInt(0, 4);
          } else {
            this.ty = W.groundY(this.tx) - 1 + U.randInt(-4, 2);
          }
          return;
        }
        case 'amph': {
          if (Math.random() < 0.4) {
            const w = eco.findWaterNear(this.x, 60);
            if (w) { this.tx = w[0]; this.ty = w[1] + 2; return; }
          }
          this.tx = U.clamp(x + U.rand(-50, 50), 2, W.w - 3);
          this.ty = W.groundY(Math.round(this.tx)) - 1;
          return;
        }
        default:
          this.tx = U.clamp(x + U.rand(-60, 60), 2, W.w - 3);
          this.ty = this.y;
      }
    }

    findFood(W) {
      const sp = this.sp;
      const fx = Math.round(this.x), fy = Math.round(this.y), fcy = Math.round(this.cy);
      for (let k = 0; k < 40; k++) {
        const r = k < 20 ? 6 : 18;
        const cx = fx + U.randInt(-r, r);
        let cy;
        if (sp.hab === 'ground' || (sp.hab === 'amph' && !this.inWater)) cy = fy + U.randInt(-sp.reach, 1);
        else cy = fcy + U.randInt(-r, r);
        if (sp.eatSet.has(W.get(cx, cy))) return [cx, cy];
      }
      return null;
    }

    tryGraze(eco) {
      const sp = this.sp, W = eco.world;
      const dx = Math.abs(this.tx - this.x);
      const dy = this.ty - this.y;
      let near;
      if (sp.hab === 'ground' || (sp.hab === 'amph' && !this.inWater)) near = dx <= sp.w / 2 + 1 && dy <= 2 && dy >= -sp.reach;
      else near = dx <= sp.w / 2 + 1.5 && Math.abs(this.ty - this.cy) <= sp.h / 2 + 1.5;
      if (!near) {
        if (this.goalT > 400) this.setGoal('wander');
        return;
      }
      const t = W.get(this.tx, this.ty);
      if (sp.eatSet.has(t)) {
        if (!sp.sip) W.set(this.tx, this.ty, t === M.GRASS ? M.DIRT : t === M.SNOW ? M.EMPTY : M.EMPTY);
        this.hunger = Math.max(0, this.hunger - sp.food);
        if (!sp.sip) eco.fx.burst(this.tx, this.ty, MP.colorsHex[t][0], 3, 0.4);
      }
      const f = this.hunger > 0.1 ? this.findFood(W) : null;
      if (f) { this.tx = f[0]; this.ty = f[1]; this.goalT = 0; }
      else this.setGoal('idle');
    }

    tryCatch(eco) {
      const t = this.target;
      if (!t || t.dead) return;
      const sp = this.sp;
      const rx = (sp.w + t.sp.w) / 4 + 1.5;
      const ry = (sp.h + t.sp.h) / 3 + 1.5;
      if (Math.abs(t.x - this.x) < rx && Math.abs(t.cy - this.cy) < ry) {
        if (this.goal === 'chase') {
          eco.fx.glyph(this.x, this.y - sp.h - 4, 'bang', '#ffffff');
          this.setGoal('idle');
          t.goal = 'flee';
          return;
        }
        eco.kill(t, this);
        this.setGoal('idle');
      }
    }

    bump() {
      this.dir = -this.dir;
      this.bumps++;
      if (this.goal === 'wander' || this.goal === 'graze') {
        this.tx = this.x + this.dir * U.rand(8, 30);
        if (this.goal === 'graze' && this.bumps > 4) this.setGoal('wander');
      } else if (this.goal === 'flee') {
        this.tx = this.x + this.dir * 30;
      }
    }

    // ----------------------------------------------------------- movement
    ballistic(eco) {
      const W = eco.world, sp = this.sp;
      this.vy = Math.min(this.vy + 0.15, 4);
      const nx = this.x + this.vx, ny = this.y + this.vy;
      const rx = Math.round(nx), ry = Math.round(ny);
      if (nx < 1 || nx > W.w - 2) { this.vx = -this.vx * 0.5; return; }
      if (W.isSolid(rx, ry)) {
        if (W.isSolid(rx, Math.round(this.y))) this.vx = 0;
        this.thrown = false;
        this.vx = 0;
        this.vy = 0;
        return;
      }
      this.x = nx;
      this.y = ny;
      this.throwT = (this.throwT || 0) + 1;
      if (W.isLiquid(rx, Math.round(this.cy)) && (sp.hab === 'water' || sp.hab === 'amph')) this.thrown = false;
      if (sp.hab === 'air' && this.throwT > 15) this.thrown = false;
      if (this.y < 1) { this.y = 1; this.vy = 0; }
    }

    moveGround(eco, mul) {
      const W = eco.world, sp = this.sp;
      const fx = Math.round(this.x), fy = Math.round(this.y);
      if (sp.hab === 'vehicle' && eco.roadY) return this.moveVehicle(eco, mul);
      // buried by falling material: dig out or get crushed
      if (W.isSolid(fx, fy)) {
        let depth = 0;
        while (depth < 14 && W.isSolid(fx, fy - depth)) depth++;
        if (depth >= 14) return this.die(eco, 'crushed');
        this.y -= 1;
        return;
      }
      const inLiq = W.isLiquid(fx, fy);
      this.inWater = inLiq;
      if (inLiq && !sp.waterOk && sp.hab !== 'amph') return this.paddle(eco, mul);

      if (!W.isSolid(fx, fy + 1)) {
        // airborne / falling
        this.onGround = false;
        this.vy = Math.min(this.vy + 0.15, inLiq ? 0.4 : 3);
        if (this.vx) {
          const nx = this.x + this.vx;
          if (nx > 1 && nx < W.w - 2 && !W.isSolid(Math.round(nx), fy)) this.x = nx;
          else this.vx = 0;
        }
        const ny = this.y + this.vy;
        if (this.vy < 0) {
          if (W.isSolid(fx, Math.round(ny))) this.vy = 0;
          else this.y = ny;
          return;
        }
        const ry = Math.round(ny);
        for (let yy = fy; yy <= ry; yy++) {
          if (W.isSolid(fx, yy + 1)) { this.y = yy; this.vy = 0; this.vx = 0; return; }
        }
        this.y = ny;
        if (sp.hab === 'roller' && W.isLiquid(fx, ry)) this.die(eco, 'lost', true);
        return;
      }
      this.onGround = true;
      this.vy = 0;
      this.vx = 0;

      let desired = 0;
      if (sp.hab === 'vehicle') {
        desired = this.dir * sp.speed * 0.6;
      } else if (sp.hab === 'roller') {
        desired = U.clamp((eco.world.wind || 0) * 0.6 + this.dir * 0.08, -1, 1);
        if (Math.abs(desired) < 0.05) desired = this.dir * 0.05;
        if (Math.random() < 0.06 * Math.min(1, Math.abs(desired) * 3)) { this.vy = -0.9; this.vx = desired; this.y -= 1; return; }
      } else {
        if (mul === 0) return;
        const dx = this.tx - this.x;
        if (Math.abs(dx) <= 0.8) { this.arrived = true; return; }
        desired = Math.sign(dx) * sp.speed * mul;
      }
      this.dir = Math.sign(desired) || this.dir;
      if (sp.jumpy && Math.random() < 0.035 && !W.isSolid(fx, fy - sp.h - 1)) {
        this.vy = -1.2;
        this.vx = desired * 1.6;
        this.y -= 1;
        return;
      }
      const nx = this.x + desired, nfx = Math.round(nx);
      if (nfx === fx) { this.x = nx; return; }
      if (nfx < 1 || nfx > W.w - 2) {
        if (sp.hab === 'roller') return this.die(eco, 'lost', true);
        return this.bump();
      }
      if (W.isSolid(nfx, fy)) {
        for (let s = 1; s <= sp.step; s++) {
          if (W.isSolid(fx, fy - s)) break;
          if (!W.isSolid(nfx, fy - s)) { this.x = nx; this.y = fy - s; return; }
        }
        if (sp.hab === 'vehicle') {
        desired = this.dir * sp.speed * 0.6;
      } else if (sp.hab === 'roller') { this.vy = -1.2; this.y -= 1; this.vx = desired; return; }
        return this.bump();
      }
      if (!sp.waterOk && sp.hab !== 'amph' && (W.isLiquid(nfx, fy) || W.isLiquid(nfx, fy + 1)) && sp.hab !== 'roller') return this.bump();
      let drop = 0;
      const maxDrop = Math.max(5, sp.h + 2);
      while (drop <= maxDrop && !W.isSolid(nfx, fy + 1 + drop) && !W.isLiquid(nfx, fy + 1 + drop)) drop++;
      if (drop > maxDrop && this.goal !== 'flee' && sp.hab !== 'roller') return this.bump();
      this.x = nx;
    }

    moveVehicle(eco) {
      const W = eco.world, sp = this.sp;
      this.x += this.dir * sp.speed;
      if (this.x < -7) this.x = W.w + 6;
      else if (this.x > W.w + 7) this.x = -6;
      this.y = eco.roadY;
    }

    // non-swimmer that fell in water
    paddle(eco, mul) {
      const W = eco.world, sp = this.sp;
      const fx = Math.round(this.x), fy = Math.round(this.y);
      if (W.isLiquid(fx, fy - 1)) this.y -= 0.25;
      let dir = Math.sign(this.tx - this.x) || this.dir;
      if (this.goal === 'idle' || this.goal === 'sleep') {
        // swim toward nearest shore
        const l = eco.shoreDist(fx, fy, -1), r = eco.shoreDist(fx, fy, 1);
        dir = l < r ? -1 : 1;
      }
      this.dir = dir;
      const nx = this.x + dir * sp.speed * 0.5, nfx = Math.round(nx);
      if (W.isSolid(nfx, fy)) {
        let ok = false;
        for (let s = 1; s <= sp.step + 3; s++) {
          if (!W.isSolid(nfx, fy - s) && !W.isLiquid(nfx, fy - s)) { this.x = nx; this.y = fy - s; ok = true; break; }
        }
        if (!ok) this.bump();
      } else if (nfx > 0 && nfx < W.w - 1) this.x = nx;
      else this.bump();
      if (W.isLiquid(fx, Math.round(this.y) - sp.h + 1)) {
        if (++this.drown > 600) this.die(eco, 'drown');
      } else this.drown = 0;
    }

    moveFloat(eco, mul) {
      const W = eco.world, sp = this.sp;
      const fx = Math.round(this.x);
      let sy = Math.round(this.y);
      while (sy > 0 && W.isLiquid(fx, sy - 1)) sy--;
      this.y = sy;
      this.inWater = true;
      if (mul === 0) return;
      const dx = this.tx - this.x;
      if (Math.abs(dx) < 1) { this.arrived = true; return; }
      const dir = Math.sign(dx);
      this.dir = dir;
      const nx = this.x + dir * sp.speed * mul * 0.7, nfx = Math.round(nx);
      if (nfx === fx) { this.x = nx; return; }
      if (W.isLiquid(nfx, sy)) { this.x = nx; return; }
      if (W.isSolid(nfx, sy) && !W.isSolid(nfx, sy - 1)) { this.x = nx; this.y = sy - 1; return; }
      if (!W.isSolid(nfx, sy) && W.isSolid(nfx, sy + 1)) { this.x = nx; return; }
      this.bump();
    }

    moveSwim(eco, mul) {
      const W = eco.world, sp = this.sp;
      const fx = Math.round(this.x), fcy = Math.round(this.cy);
      const inW = W.isLiquid(fx, fcy);
      this.inWater = inW;
      if (!inW) {
        // out of water: fall / flop
        this.vy = Math.min(this.vy + 0.15, 3);
        const nx = this.x + this.vx, ny = this.y + this.vy;
        if (W.isSolid(Math.round(nx), Math.round(ny))) {
          this.vx *= 0.5;
          if (this.vy > 0) {
            this.vy = 0;
            if (Math.random() < 0.05) { this.vy = -0.9; this.vx = U.rand(-0.6, 0.6); this.y -= 1; }
          }
        } else {
          this.x = U.clamp(nx, 1, W.w - 2);
          this.y = ny;
        }
        if (++this.dry > 360) this.die(eco, 'suffocate');
        return;
      }
      this.dry = 0;
      const speed = sp.speed * (mul || 0.25);
      let dvx = 0, dvy = 0;
      const dx = this.tx - this.x, dy = this.ty - this.cy;
      const d = Math.hypot(dx, dy);
      if (d > 1.5) { dvx = (dx / d) * speed; dvy = (dy / d) * speed; }
      else this.arrived = true;
      if (sp.flutter) {
        // jellyfish pulse
        if ((this.anim % 60) < 10) dvy -= 0.25;
        dvx += U.rand(-0.05, 0.05);
      }
      const k = this.goal === 'flee' || this.goal === 'hunt' ? 0.12 : 0.05;
      this.vx += (dvx - this.vx) * k;
      this.vy += (dvy - this.vy) * k;
      if (sp.breach && this.goal === 'wander' && Math.random() < 0.0015 && !W.isLiquid(fx, fcy - 4)) {
        this.vy = -1.7;
        this.vx = this.dir * 0.8;
        this.y += this.vy;
        this.x += this.vx;
        return;
      }
      const nx = this.x + this.vx, ny = this.y + this.vy;
      const ncy = Math.round(ny - (sp.h >> 1));
      const nose = Math.round(nx + Math.sign(this.vx || this.dir) * (sp.w / 2 - 0.5));
      const ahead = W.get(nose, ncy);
      if (ahead !== M.WATER && MP.kind[ahead] !== DS.KIND.liquid) {
        if (sp.hab === 'amph' && MP.solid[ahead]) {
          for (let s = 1; s <= 3; s++) {
            if (!W.isSolid(nose, ncy - s) && !W.isLiquid(nose, ncy - s)) {
              this.x = nx;
              this.y = ncy - s;
              return;
            }
          }
        }
        if (!MP.solid[ahead] && this.vy < 0) this.vy = Math.abs(this.vy) * 0.3 + 0.05;
        else {
          this.vx = -this.vx * 0.5;
          this.vy = -this.vy * 0.5;
          if (!W.isLiquid(nose, fcy)) { this.dir = -this.dir; if (this.goal === 'wander') this.pickWander(eco); }
        }
        return;
      }
      if (!W.isLiquid(Math.round(nx), ncy)) { this.vy = Math.abs(this.vy) * 0.3; return; }
      this.x = nx;
      this.y = ny;
      if (Math.abs(this.vx) > 0.03) this.dir = Math.sign(this.vx);
    }

    moveAir(eco, mul) {
      const W = eco.world, sp = this.sp;
      const fx = Math.round(this.x), fy = Math.round(this.y);
      if (this.perched) {
        this.vx = this.vy = 0;
        const below = W.get(fx, fy + 1);
        const leave = this.goal === 'flee' || this.goal === 'hunt' || (!this.sleep && --this.perchT <= 0);
        if (!(MP.solid[below] || MP.veg[below]) || W.isSolid(fx, fy) || W.isLiquid(fx, fy)) this.perched = false;
        else if (!leave) return;
        this.perched = false;
        this.vy = -0.8;
        if (this.goal === 'perch' || this.goal === 'idle' || this.goal === 'sleep') { this.setGoal('wander'); this.pickWander(eco); }
      }
      if (this.sleep && this.goal !== 'perch') {
        this.setGoal('perch');
        this.tx = fx;
        this.ty = eco.topY(fx) - 1;
      }
      const speed = sp.speed * (mul || 0.4);
      const dx = this.tx - this.x, dy = this.ty - this.y;
      const d = Math.hypot(dx, dy);
      let dvx = d > 0.5 ? (dx / d) * speed : 0, dvy = d > 0.5 ? (dy / d) * speed : 0;
      if (sp.flutter) { dvx += U.rand(-0.35, 0.35); dvy += U.rand(-0.35, 0.35); }
      const k = sp.flutter ? 0.25 : this.goal === 'hunt' ? 0.12 : 0.06;
      this.vx += (dvx - this.vx) * k;
      this.vy += (dvy - this.vy) * k;
      if (this.goal === 'perch' && d < 2) {
        const below = W.get(fx, fy + 1);
        if ((MP.solid[below] || MP.veg[below]) && !W.isSolid(fx, fy) && !W.isLiquid(fx, fy + 1)) {
          this.perched = true;
          this.perchT = U.randInt(240, 1200);
          this.x = fx;
          this.y = fy;
          this.vx = this.vy = 0;
          return;
        }
        if (d < 0.8) { this.ty += 1; if (this.goalT > 200) this.setGoal('wander'); }
      }
      if (d < 1.5 && this.goal !== 'perch') this.arrived = true;
      const nx = this.x + this.vx, ny = this.y + this.vy;
      const t = W.get(Math.round(nx), Math.round(ny));
      const liquid = MP.kind[t] === DS.KIND.liquid;
      if (MP.solid[t] || (liquid && !(sp.dives && this.goal === 'hunt'))) {
        this.vy = -Math.abs(this.vy) - 0.25;
        this.vx *= 0.7;
        if (W.isSolid(fx, fy) || W.isLiquid(fx, fy)) this.y -= 1;
        return;
      }
      this.x = nx;
      this.y = ny;
      if (this.y < 2) { this.y = 2; this.vy = Math.abs(this.vy); }
      if (this.x < 1) { this.x = 1; this.vx = Math.abs(this.vx); }
      if (this.x > W.w - 2) { this.x = W.w - 2; this.vx = -Math.abs(this.vx); }
      if (Math.abs(this.vx) > 0.05) this.dir = Math.sign(this.vx);
      if (liquid) {
        if (++this.drown > 400) this.die(eco, 'drown');
      } else this.drown = 0;
    }

    // cling movement: ants, spiders, monkeys, worms
    grip(W, x, y) {
      const veg = this.sp.climbVeg;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const t = W.get(x + dx, y + dy);
          if (MP.solid[t] || (veg && MP.veg[t] && t !== M.SIDING && t !== M.FACADE)) return true;
        }
      }
      return false;
    }

    passable(W, x, y) {
      if (!W.inb(x, y)) return false;
      const t = W.get(x, y);
      if (this.sp.hab === 'burrow') return MP.dig[t] === 1 || (t === M.EMPTY && this.grip(W, x, y));
      return t === M.EMPTY || MP.veg[t] === 1 || MP.kind[t] === DS.KIND.gas;
    }

    moveClimb(eco, mul) {
      const W = eco.world, sp = this.sp;
      let fx = Math.round(this.x), fy = Math.round(this.y);
      this.x = fx;
      this.y = fy;
      if (W.isLiquid(fx, fy)) {
        this.inWater = true;
        if (W.isLiquid(fx, fy - 1)) this.y -= 0.5;
        if (++this.drown > 500) return this.die(eco, 'drown');
      } else { this.inWater = false; this.drown = 0; }
      if (sp.hab === 'burrow' ? !this.passable(W, fx, fy) && !W.isSolid(fx, fy) : !this.grip(W, fx, fy)) {
        // fall
        if (this.passable(W, fx, fy + 1) || W.get(fx, fy + 1) === M.EMPTY || W.isLiquid(fx, fy + 1)) { this.y += 1; return; }
      }
      if (W.isSolid(fx, fy) && sp.hab !== 'burrow') {
        // buried: dig out upward
        if (sp.digs && MP.dig[W.get(fx, fy)]) W.set(fx, fy, M.EMPTY);
        else this.y -= 1;
        return;
      }
      if (mul === 0) return;
      this.mv += sp.speed * mul;
      while (this.mv >= 1) {
        this.mv -= 1;
        this.stepCling(eco);
        if (this.dead) return;
      }
    }

    stepCling(eco) {
      const W = eco.world, sp = this.sp;
      const fx = this.x, fy = this.y;
      const dTarget = Math.hypot(this.tx - fx, this.ty - fy);
      if (dTarget <= 1.01) { this.arrived = true; if (sp.ant) DS.Ants.arrive(this, eco); return; }
      let best = null, bestScore = Infinity, bestDig = false;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = fx + dx, ny = fy + dy;
          if (!W.inb(nx, ny)) continue;
          let score = Math.hypot(this.tx - nx, this.ty - ny) + Math.random() * 1.3;
          let dig = false;
          if (this.passable(W, nx, ny) && (sp.hab === 'burrow' || this.grip(W, nx, ny))) {
            // ok
          } else if (sp.digs && MP.dig[W.get(nx, ny)] && (!sp.ant || DS.Ants.mayDig(this))) {
            score += 2.5;
            dig = true;
          } else continue;
          if (score < bestScore) { bestScore = score; best = [nx, ny]; bestDig = dig; }
        }
      }
      if (!best) { this.bump(); return; }
      if (bestDig) {
        const t = W.get(best[0], best[1]);
        W.set(best[0], best[1], M.EMPTY);
        if (sp.ant) DS.Ants.dug(this, eco, t);
      }
      if (best[0] !== fx) this.dir = Math.sign(best[0] - fx);
      this.x = best[0];
      this.y = best[1];
      if (sp.ant) DS.Ants.step(this, eco);
    }
  }

  // ===================================================================== Eco
  class Ecosystem {
    constructor(world, fx) {
      this.world = world;
      this.fx = fx;
      this.list = [];
      this.count = {};
      this.colonies = [];
      this.daylight = 1;
      this.cap = 450;
      this.roadY = 0;
      this.natives = [];
      this.immT = 0;
      this.weather = null;
    }

    spawn(id, x, y, opts = {}) {
      const sp = S[id];
      if (!sp) return null;
      if (sp.queen && !opts.colony) {
        const col = DS.Ants.found(this, Math.round(x), Math.round(y));
        return col ? col.queen : null;
      }
      const c = new Creature(sp, x, y, opts);
      if (sp.hab === 'vehicle' && this.roadY) c.y = this.roadY;
      if (sp.hab === 'climb' || sp.hab === 'burrow') { c.x = Math.round(x); c.y = Math.round(y); }
      this.list.push(c);
      this.count[id] = (this.count[id] || 0) + 1;
      return c;
    }

    // Find a valid random location for a species
    place(id, edge = false) {
      const sp = S[id], W = this.world;
      const randX = () => (edge ? (Math.random() < 0.5 ? U.randInt(2, 6) : U.randInt(W.w - 7, W.w - 3)) : U.randInt(3, W.w - 4));
      for (let k = 0; k < 60; k++) {
        const x = randX();
        const gy = W.groundY(x);
        switch (sp.hab) {
          case 'air': {
            const y = U.rand(3, Math.max(4, gy - 6));
            return [x, sp.flutter ? Math.max(3, gy - U.rand(3, 15)) : y];
          }
          case 'water': {
            const y = U.randInt(2, W.h - 2);
            if (W.get(x, y) === M.WATER && W.get(x, y - sp.h) === M.WATER && W.get(x + sp.w, y) === M.WATER && W.get(x - sp.w, y) === M.WATER) return [x, y];
            continue;
          }
          case 'amph': {
            if (sp.floats || Math.random() < 0.5) {
              if (W.isLiquid(x, gy)) return [x, sp.floats ? gy : gy + sp.h + 1];
              if (sp.floats && k < 50) continue;
            }
            if (!W.isLiquid(x, gy) && gy < W.h - 1) return [x, gy - 1];
            continue;
          }
          case 'burrow': {
            const y = gy + U.randInt(3, 15);
            if (MP.dig[W.get(x, y)]) return [x, y];
            continue;
          }
          case 'vehicle':
            if (this.roadY) return [x, this.roadY];
            if (!W.isLiquid(x, gy) && gy < W.h - 1) return [x, gy - 1];
            continue;
          case 'climb': {
            if (sp.climbVeg && Math.random() < 0.6) {
              const ty = this.topY(x);
              if (MP.veg[W.get(x, ty)] && W.get(x, ty) !== M.SIDING) return [x, ty - 1];
            }
            if (!W.isLiquid(x, gy) && gy < W.h - 1) return [x, gy - 1];
            continue;
          }
          default:
            if (sp.waterOk) {
              const fy = W.floorY(x);
              if (fy < W.h - 1) return [x, fy - 1];
            }
            if (!W.isLiquid(x, gy) && gy < W.h - 1 && gy > 1) return [x, gy - 1];
        }
      }
      return null;
    }

    populate(fauna) {
      this.natives = fauna;
      for (const [id, n] of fauna) {
        if (S[id].ant) continue;
        if (S[id].onlyNight && this.daylight > 0.4) continue;
        for (let i = 0; i < n; i++) {
          const p = this.place(id);
          if (p) this.spawn(id, p[0], p[1]);
        }
      }
    }

    topY(x) {
      const W = this.world;
      let y = 0;
      while (y < W.h) {
        const t = W.get(x, y);
        if (t !== M.EMPTY && MP.kind[t] !== DS.KIND.gas && t !== M.FIRE) break;
        y++;
      }
      return y;
    }

    findWaterNear(x, r) {
      const W = this.world;
      for (let k = 0; k < 25; k++) {
        const cx = U.clamp(Math.round(x + U.rand(-r, r)), 1, W.w - 2);
        const gy = W.groundY(cx);
        if (W.get(cx, gy) === M.WATER) return [cx, gy];
      }
      return null;
    }

    shoreDist(x, y, dir) {
      const W = this.world;
      for (let d = 1; d < 80; d++) {
        const nx = x + dir * d;
        if (nx < 0 || nx >= W.w) return 999;
        if (W.isSolid(nx, y) || W.isSolid(nx, y + 1)) return d;
      }
      return 999;
    }

    nearest(c, r, filter) {
      let best = null, bd = r * r;
      for (const o of this.list) {
        if (o === c || o.dead || o.held) continue;
        const d = U.dist2(c.x, c.cy, o.x, o.cy);
        if (d < bd && filter(o)) { bd = d; best = o; }
      }
      return best;
    }

    schoolCenter(c, r) {
      let sx = 0, sy = 0, n = 0;
      for (const o of this.list) {
        if (o === c || o.sp !== c.sp || o.dead) continue;
        if (U.dist2(c.x, c.cy, o.x, o.cy) < r * r) { sx += o.x; sy += o.cy; n++; }
      }
      return n ? [sx / n, sy / n] : null;
    }

    canReach(pred, prey) {
      const ph = pred.sp.hab, W = this.world;
      const wet = W.isLiquid(Math.round(prey.x), Math.round(prey.cy));
      if (ph === 'air') {
        if (wet) return pred.sp.dives && prey.cy - W.groundY(Math.round(prey.x)) < 7;
        return true;
      }
      if (ph === 'water') return wet;
      if (ph === 'amph') return true;
      if (ph === 'climb') return !wet;
      if (wet) return false;
      if (prey.sp.hab === 'air') return prey.perched && Math.abs(prey.y - pred.y) < pred.sp.h + 3;
      if (prey.sp.hab === 'climb') return Math.abs(prey.y - pred.y) < pred.sp.h + 3;
      return true;
    }

    canBreed(sp) {
      const n = this.count[sp.id] || 0;
      return n >= 2 && n < sp.max && this.list.length < this.cap;
    }

    birth(parent) {
      const sp = parent.sp;
      let x = parent.x - parent.dir * Math.max(2, sp.w * 0.6), y = parent.y;
      if (!this.world.inb(Math.round(x), Math.round(y)) || this.world.isSolid(Math.round(x), Math.round(y))) x = parent.x;
      const c = this.spawn(sp.id, x, y, { newborn: true, colony: parent.colony });
      if (c) {
        parent.hunger = Math.min(0.9, parent.hunger + 0.2);
        if (sp.w > 2) this.fx.glyph(x - 1, y - sp.h - 4, 'heart', '#ff5a8a');
      }
      return c;
    }

    kill(prey, pred) {
      if (pred && pred.sp.infects && (prey.sp.id === 'person' || prey.sp.id === 'survivor')) {
        prey.die(this, 'infect');
        const z = this.spawn('zombie', prey.x, prey.y, { newborn: true });
        if (z) z.age = 0;
        return;
      }
      prey.die(this, 'eaten');
      if (pred) pred.hunger = Math.max(0, pred.hunger - 0.8);
    }

    killNear(x, y, r, cause = 'zap', filter = null) {
      let n = 0;
      for (const c of this.list) {
        if (c.dead) continue;
        if (U.dist2(c.x, c.cy, x, y) <= r * r && (!filter || filter(c))) { c.die(this, cause); n++; }
      }
      return n;
    }

    at(x, y, r = 4) {
      let best = null, bd = r * r;
      for (const c of this.list) {
        if (c.dead) continue;
        const d = U.dist2(c.x, c.cy, x, y);
        if (d < bd) { bd = d; best = c; }
      }
      return best;
    }

    update() {
      const list = this.list;
      for (let i = 0; i < list.length; i++) {
        const c = list[i];
        if (!c.dead) c.update(this);
      }
      let j = 0;
      const count = {};
      for (let i = 0; i < list.length; i++) {
        const c = list[i];
        if (c.dead) continue;
        list[j++] = c;
        count[c.sp.id] = (count[c.sp.id] || 0) + 1;
      }
      list.length = j;
      this.count = count;
      for (let i = this.colonies.length - 1; i >= 0; i--) {
        const col = this.colonies[i];
        col.update(this);
        if (col.dead) this.colonies.splice(i, 1);
      }
      if (++this.immT >= 240) { this.immT = 0; this.immigrate(); }
    }

    // Keep native wildlife going: animals wander in from the edges
    immigrate() {
      if (!this.natives.length || this.list.length >= this.cap) return;
      const night = this.daylight < 0.3;
      for (const [id, n] of this.natives) {
        const sp = S[id];
        const have = this.count[id] || 0;
        if (sp.ant) {
          if (sp.queen && !this.colonies.length && Math.random() < 0.15) {
            const x = U.randInt(10, this.world.w - 10);
            const col = DS.Ants.found(this, x, this.world.groundY(x) - 1);
            if (col) this.fx.glyph(x, col.queen.y - 6, 'heart', '#ffd040');
          }
          continue;
        }
        if (sp.onlyNight) {
          if (night && have < n && Math.random() < 0.5) {
            const p = this.place(id);
            if (p) this.spawn(id, p[0], p[1]);
          }
          continue;
        }
        const want = Math.max(1, Math.ceil(n * 0.5));
        if (have < want && Math.random() < 0.35) {
          const p = this.place(id, sp.hab === 'ground' || sp.hab === 'roller' || sp.hab === 'air');
          if (p) {
            const c = this.spawn(id, p[0], p[1]);
            if (c && p[0] < this.world.w / 2) c.dir = 1; else if (c) c.dir = -1;
            if (c) { c.tx = c.x + c.dir * 40; }
          }
        }
      }
    }

    draw(ctx, lights, darkness) {
      for (const c of this.list) {
        const sp = c.sp;
        const e = DS.Sprites.get(sp, c.vkey, c.vpal);
        const n = e.frames.length;
        let f = 0;
        if (sp.hab === 'air') f = c.perched ? (n > 2 ? 2 : 1) : (c.anim >> (sp.flutter ? 2 : 3)) & 1;
        else if (sp.hab === 'roller') f = (Math.round(c.x / 2) & 1);
        else if (c.moving || sp.hab === 'water') f = (c.anim >> 3) % n;
        if (c.sleep && sp.hab !== 'air') f = 0;
        const img = c.dir < 0 && !sp.noFlip ? e.frames[f].l : e.frames[f].r;
        const dx = Math.round(c.x - e.w / 2), dy = Math.round(c.y - e.h + 1);
        if (sp.hab === 'water' && c.inWater) ctx.globalAlpha = 0.9;
        ctx.drawImage(img, dx, dy);
        ctx.globalAlpha = 1;
        if (c.carry) {
          ctx.fillStyle = MP.colorsHex[c.carry][1] || MP.colorsHex[c.carry][0];
          ctx.fillRect(Math.round(c.x) + (c.dir > 0 ? 1 : -1), dy - 1, 2, 1);
        }
        if (sp.glow && darkness > 0.25 && lights.length < 900) {
          if (sp.hab === 'vehicle') lights.push(dx + (c.dir > 0 ? e.w + 3 : -4), Math.round(c.y) - 2, 6);
          else if ((c.anim >> 4) % 3 !== 0) lights.push(Math.round(c.x), Math.round(c.cy), sp.id === 'jellyfish' ? 7 : 8);
        }
      }
    }
  }

  DS.Creature = Creature;
  DS.Ecosystem = Ecosystem;
})();
