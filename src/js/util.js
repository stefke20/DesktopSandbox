// Shared helpers: math, randomness, noise, colours.
(function () {
  'use strict';
  const DS = (window.DS = window.DS || {});

  const U = {};

  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.smooth = (t) => t * t * (3 - 2 * t);
  U.smoothstep = (a, b, v) => U.smooth(U.clamp((v - a) / (b - a), 0, 1));
  U.rand = (a = 0, b = 1) => a + Math.random() * (b - a);
  U.randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  U.chance = (p) => Math.random() < p;
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.dist2 = (ax, ay, bx, by) => (ax - bx) * (ax - bx) + (ay - by) * (ay - by);

  // Weighted pick from [[item, weight], ...]
  U.weighted = (list, rng = Math.random) => {
    let total = 0;
    for (const e of list) total += e[1];
    let r = rng() * total;
    for (const e of list) {
      r -= e[1];
      if (r <= 0) return e[0];
    }
    return list[list.length - 1][0];
  };

  // Seeded RNG (mulberry32)
  U.rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  // 1D fractal value noise, returns a function x -> [0,1]
  U.noise1D = (rng, scale = 40, octaves = 3) => {
    const n = 1024;
    const tab = new Float32Array(n);
    for (let i = 0; i < n; i++) tab[i] = rng();
    const base = (x) => {
      const i = Math.floor(x);
      const f = x - i;
      const a = tab[((i % n) + n) % n];
      const b = tab[(((i + 1) % n) + n) % n];
      return U.lerp(a, b, U.smooth(f));
    };
    return (x) => {
      let amp = 1, freq = 1 / scale, sum = 0, norm = 0;
      for (let o = 0; o < octaves; o++) {
        sum += base(x * freq + o * 97.3) * amp;
        norm += amp;
        amp *= 0.5;
        freq *= 2;
      }
      return sum / norm;
    };
  };

  // Colours ---------------------------------------------------------------
  U.hex = (h) => {
    const v = parseInt(h.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  };
  U.toHex = (c) =>
    '#' + c.map((v) => U.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  U.mix = (a, b, t) => [U.lerp(a[0], b[0], t), U.lerp(a[1], b[1], t), U.lerp(a[2], b[2], t)];
  U.mixHex = (a, b, t) => U.toHex(U.mix(U.hex(a), U.hex(b), t));
  U.css = (c, alpha = 1) =>
    `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${alpha})`;
  U.shade = (c, f) => [c[0] * f, c[1] * f, c[2] * f];
  // Pack to little-endian ABGR for Uint32 ImageData views
  U.pack = (r, g, b, a = 255) =>
    ((a << 24) | (U.clamp(b | 0, 0, 255) << 16) | (U.clamp(g | 0, 0, 255) << 8) | U.clamp(r | 0, 0, 255)) >>> 0;

  DS.U = U;
})();
