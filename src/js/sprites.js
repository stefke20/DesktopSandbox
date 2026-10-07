// Renders species pixel art to cached canvases (normal + mirrored).
(function () {
  'use strict';
  const DS = window.DS;
  const cache = new Map();

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  function render(rows, pal, w, flip) {
    const h = rows.length;
    const c = makeCanvas(w, h);
    const ctx = c.getContext('2d');
    for (let y = 0; y < h; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ') continue;
        const col = pal[ch];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(flip ? w - 1 - x : x, y, 1, 1);
      }
    }
    return c;
  }

  // Derive a second animation frame when only one is drawn
  function autoFrame(sp, rows) {
    const out = rows.slice();
    if (sp.hab === 'water') {
      // tail flick: shift the two leftmost columns vertically
      for (let r = 0; r < rows.length; r++) {
        const src = rows[(r + 1) % rows.length];
        out[r] = src.slice(0, 2) + rows[r].slice(2);
      }
      return out;
    }
    if (rows.length >= 3) {
      const last = rows[rows.length - 1];
      out[out.length - 1] = '.' + last.slice(0, last.length - 1);
    }
    return out;
  }

  DS.Sprites = {
    // Returns { frames: [{r, l}], w, h } for a creature (variant-aware)
    get(sp, variantKey, variantPal) {
      const key = sp.id + '|' + (variantKey || '');
      let e = cache.get(key);
      if (e) return e;
      const pal = Object.assign({}, sp.pal, variantPal || {});
      let frames = sp.art.slice();
      if (frames.length === 1 && sp.hab !== 'roller') frames.push(autoFrame(sp, frames[0]));
      const w = sp.w;
      e = {
        w, h: sp.h,
        frames: frames.map((rows) => ({ r: render(rows, pal, w, false), l: render(rows, pal, w, true) })),
      };
      cache.set(key, e);
      return e;
    },
    // Small icon for menus (data URL)
    icon(sp, scale = 3) {
      const e = this.get(sp);
      const src = e.frames[0].r;
      const c = makeCanvas(src.width * scale, src.height * scale);
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(src, 0, 0, c.width, c.height);
      return c.toDataURL();
    },
  };
})();
