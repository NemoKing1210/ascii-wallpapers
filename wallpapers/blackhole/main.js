/* SPDX-License-Identifier: MIT */
'use strict';

/*
 * ASCII Black Hole — animated ASCII-art black hole for Wallpaper Engine.
 * Renders a shadow, a thin photon ring, a glowing accretion disk and a
 * lensed star field, all drawn with monospace glyphs on one canvas.
 */

(() => {
  /* ------------------------------------------------------------------ *
   *  Settings (overridable from Wallpaper Engine properties)
   * ------------------------------------------------------------------ */

  const BG = '#02040a';
  const BLACK = '#000000';
  const RAMP = ' .:-=+*#%@'; // dark to bright
  const RAMP_LAST = RAMP.length - 1;
  const TARGET_FPS = 30;
  const FRAME_MS = 1000 / TARGET_FPS;
  const TAU = Math.PI * 2;

  /* Geometry is expressed in units of the shadow radius. */
  const LAYOUT = {
    shadowScale: 0.2,
    discInner: 1.42,
    discOuter: 3.8,
    discCos: 0.25, // projected thickness of the tilted disk
    discTilt: -0.12, // screen-space roll of the disk
    haloOuter: 1.58,
    lensK: 3.4, // squared Einstein radius for the background starlight
  };

  /** Settings mirrored from Wallpaper Engine properties. */
  const SETTINGS = {
    diskHsl: { h: 28, s: 1, l: 0.64 },
    starDensity: 1,
    fontScale: 1,
    diskSpeed: 1,
    doppler: true,
    twinkle: true,
  };

  /* ------------------------------------------------------------------ *
   *  Utils
   * ------------------------------------------------------------------ */

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, k) => a + (b - a) * k;

  function setGlyphStyle(g) {
    g.font = S.font;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
  }

  function hash2(x, y) {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
    return n - Math.floor(n);
  }

  function vnoise(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = hash2(xi, yi);
    const b = hash2(xi + 1, yi);
    const c = hash2(xi, yi + 1);
    const d = hash2(xi + 1, yi + 1);
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  }

  function fbm(x, y, oct) {
    let sum = 0;
    let amp = 0.5;
    let f = 1;
    let norm = 0;
    for (let i = 0; i < oct; i++) {
      sum += amp * vnoise(x * f, y * f);
      norm += amp;
      f *= 2.03;
      amp *= 0.5;
    }
    return sum / norm;
  }

  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Wallpaper Engine colour value: "r g b" with 0..1 components. */
  function parseWeColor(value) {
    let parts;
    if (Array.isArray(value)) {
      parts = value.map(Number);
    } else if (typeof value === 'string') {
      parts = value.trim().split(/\s+/).map(Number);
    } else {
      return null;
    }
    if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) return null;

    const r = parts[0];
    const g = parts[1];
    const b = parts[2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    let h = 0;
    let s = 0;

    if (d > 1e-6) {
      s = d / (1 - Math.abs(2 * l - 1));
      if (max === r) h = ((g - b) / d + 6) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h, s: clamp(s, 0, 1), l };
  }

  /* ------------------------------------------------------------------ *
   *  State
   * ------------------------------------------------------------------ */

  const canvas = document.getElementById('scene');
  const ctx = canvas && canvas.getContext('2d', { alpha: false });
  if (!canvas || !ctx) return;

  const S = {
    w: 0,
    h: 0,
    dpr: 1,
    offX: 0,
    offY: 0,
    cx: 0,
    cy: 0,
    R: 100,
    fontPx: 16,
    cellW: 10,
    cellH: 18,
    cols: 0,
    rows: 0,
    font: '',
    pad: 64,
    bgLayer: null,
    bgLayerW: 0,
    bgLayerH: 0,
    stars: [],
    disk: null,
    overShadow: null,
    halo: null,
    diskPalette: [],
    haloPalette: [],
    ringPalette: [],
    starPalette: null,
    start: performance.now(),
    frozen: false,
    pointer: { x: 0, y: 0, tx: 0, ty: 0 },
  };

  /* ------------------------------------------------------------------ *
   *  Static background: faint interstellar dust (one-time render)
   * ------------------------------------------------------------------ */

  function buildBackground() {
    const pad = S.pad;
    const W = S.w + pad * 2;
    const H = S.h + pad * 2;
    const dpr = S.dpr;

    const layer = document.createElement('canvas');
    layer.width = Math.round(W * dpr);
    layer.height = Math.round(H * dpr);
    const g = layer.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = BG;
    g.fillRect(0, 0, W, H);

    const cw = S.cellW;
    const ch = S.cellH;
    const cols = Math.ceil(W / cw) + 1;
    const rows = Math.ceil(H / ch) + 1;

    setGlyphStyle(g);

    for (let row = 0; row < rows; row++) {
      const v = row / rows;
      for (let col = 0; col < cols; col++) {
        const u = col / cols;

        const warp = fbm(u * 2.2 + 4.7, v * 2.2 + 9.1, 3) - 0.5;
        const dust = fbm(u * 4.6 + 31 + warp * 1.6, v * 4.2 + 17 - warp * 1.6, 5);
        const band = Math.exp(-Math.pow((v - 0.7 - 0.1 * Math.sin(u * 4)) * 3.2, 2));
        const inten = Math.max(0, dust - 0.47) * 1.8 + band * 0.05;
        if (inten < 0.05) continue;

        const alpha = Math.min(0.15, 0.018 + inten * 0.11);
        const hue = 222 + 26 * fbm(u * 1.9 + 7, v * 1.9 + 3, 2);
        g.fillStyle = `hsla(${hue.toFixed(0)}, 60%, 58%, ${alpha.toFixed(3)})`;

        const jx = (hash2(col * 1.71 + 2.2, row * 3.13 + 8.8) - 0.5) * cw * 0.4;
        const jy = (hash2(col * 2.37 + 7.1, row * 1.13 + 3.4) - 0.5) * ch * 0.35;
        g.fillText(inten > 0.56 ? ':' : '.', col * cw + cw / 2 + jx, row * ch + ch / 2 + jy);
      }
    }

    S.bgLayer = layer;
    S.bgLayerW = W;
    S.bgLayerH = H;
  }

  /* ------------------------------------------------------------------ *
   *  Lensed star field
   * ------------------------------------------------------------------ */

  function buildStars() {
    const rng = mulberry32(0x5eeda11);
    const maxR = Math.hypot(S.w, S.h) / 2 / S.R + 2.5;
    const count = Math.round(S.cols * S.rows * 0.05 * SETTINGS.starDensity);
    const list = [];

    for (let i = 0; i < count; i++) {
      const rad = maxR * Math.sqrt(rng());
      const ang = rng() * TAU;
      list.push({
        x: Math.cos(ang) * rad,
        y: Math.sin(ang) * rad,
        a0: ang,
        phase: rng() * TAU,
        speed: 0.25 + rng() * 1.35,
        bright: 0.25 + rng() * 0.75,
        warm: rng() < 0.18,
        blue: rng() < 0.1,
      });
    }

    S.stars = list;
  }

  function drawStarImage(g, x, y, b, st) {
    let glyph;
    let alpha;
    if (b > 0.72) {
      glyph = '*';
      alpha = 0.42 + b * 0.5;
    } else if (b > 0.46) {
      glyph = '+';
      alpha = 0.28 + b * 0.5;
    } else if (b > 0.26) {
      glyph = '.';
      alpha = 0.15 + b * 0.45;
    } else {
      glyph = ',';
      alpha = 0.08 + b * 0.4;
    }
    if (alpha > 0.95) alpha = 0.95;

    const pal = S.starPalette;
    const ai = clamp(Math.round((alpha / 0.95) * 15), 0, 15);
    g.fillStyle = st.warm ? pal.warm[ai] : st.blue ? pal.blue[ai] : pal.cool[ai];
    g.fillText(glyph, x, y);
  }

  function drawStars(t, ox, oy) {
    const g = ctx;
    setGlyphStyle(g);

    const R = S.R;
    const cx = S.cx + ox;
    const cy = S.cy + oy;
    const lensK = LAYOUT.lensK;
    const ringR = Math.sqrt(lensK);
    const starPal = S.starPalette;

    for (let i = 0; i < S.stars.length; i++) {
      const st = S.stars[i];
      const beta = Math.hypot(st.x, st.y);
      const root = Math.sqrt(beta * beta + 4 * lensK);
      const th1 = (beta + root) / 2;
      const th2 = (beta - root) / 2;

      const ux = beta > 1e-4 ? st.x / beta : Math.cos(st.a0);
      const uy = beta > 1e-4 ? st.y / beta : Math.sin(st.a0);

      let tw = 0.5 + 0.5 * Math.sin(t * st.speed + st.phase);
      if (!SETTINGS.twinkle) tw = 0.7;
      const b = st.bright * (0.3 + 0.7 * tw);

      const px = cx + ux * th1 * R;
      const py = cy + uy * th1 * R;
      drawStarImage(g, px, py, b, st);
      if (-th2 > 1.02) {
        drawStarImage(g, cx + ux * th2 * R, cy + uy * th2 * R, b * 0.55, st);
      }

      /* Stars close to the line of sight are stretched along the Einstein
         ring; short tangential dashes suggest that arc. */
      if (st.bright > 0.55 && Math.abs(th1 - ringR) < 0.06) {
        const tx = -uy;
        const ty = ux;
        const off = S.cellW * 0.55;
        g.fillStyle = st.warm ? starPal.warm[3] : st.blue ? starPal.blue[3] : starPal.cool[3];
        g.fillText('.', px + tx * off, py + ty * off);
        g.fillText('.', px - tx * off, py - ty * off);
      }
    }
  }

  /* ------------------------------------------------------------------ *
   *  Accretion disk geometry (built once per resize)
   * ------------------------------------------------------------------ */

  function buildDisk() {
    const R = S.R;
    const cw = S.cellW;
    const ch = S.cellH;
    const A = LAYOUT.discOuter * R;
    const c = Math.cos(LAYOUT.discTilt);
    const s = Math.sin(LAYOUT.discTilt);

    const bx = A * Math.hypot(c, LAYOUT.discCos * s);
    const by = A * Math.hypot(s, LAYOUT.discCos * c);

    const c0 = Math.floor((S.cx - bx - S.offX) / cw);
    const c1 = Math.ceil((S.cx + bx - S.offX) / cw);
    const r0 = Math.floor((S.cy - by - S.offY) / ch);
    const r1 = Math.ceil((S.cy + by - S.offY) / ch);

    const xs = [];
    const ys = [];
    const rs = [];
    const pa = [];
    const oa = [];
    const pb = [];
    const ob = [];
    const pc = [];
    const oc = [];
    const radNs = [];
    const beamas = [];
    const profs = [];
    const edges = [];
    const dops = [];
    const over = [];

    const inner = LAYOUT.discInner;
    const invSpan = 1 / (LAYOUT.discOuter - inner);
    const shadow2 = R * 1.03 * (R * 1.03);

    for (let row = r0; row <= r1; row++) {
      const py = S.offY + row * ch;
      const dy = py - S.cy;
      for (let col = c0; col <= c1; col++) {
        const px = S.offX + col * cw;
        const dx = px - S.cx;

        const u = dx * c + dy * s;
        const v = -dx * s + dy * c;
        const yPx = v / LAYOUT.discCos;
        const rn = Math.hypot(u, yPx) / R;
        if (rn < inner || rn > LAYOUT.discOuter) continue;

        const idx = xs.length;
        const hypotUV = Math.hypot(u, yPx);
        const ang = Math.atan2(yPx, u);
        const omega = 0.36 * Math.pow(inner / rn, 1.5);
        /* A smooth phase keeps neighbouring cells correlated; per-cell
           randomness would alias into noise at glyph scale. */
        const phase = fbm((u / R) * 1.6 + 13.2, (yPx / R) * 1.6 + 7.4, 3) * TAU;

        xs.push(dx);
        ys.push(dy);
        rs.push(rn);
        /* Fold the static angle/phase terms once so the hot loop only has
           to advance them in time. */
        pa.push(rn * 6.5 + phase - ang * 1.6);
        oa.push(omega * 1.6);
        pb.push(rn * 12 - phase * 1.7 + ang * 2.4);
        ob.push(omega * 2.4);
        pc.push(rn * 3.1 + ang * 0.9 + 1.3);
        oc.push(omega * 0.9);
        radNs.push((rn - inner) * invSpan);
        beamas.push(u / hypotUV);
        profs.push(0.3 + 0.7 * Math.pow(inner / rn, 1.5));
        edges.push(0.2 + 0.8 * clamp((LAYOUT.discOuter - rn) / 0.8, 0, 1));
        dops.push(Math.sqrt(inner / rn));

        /* The near half has to be repainted over the shadow. */
        if (v > 0 && dx * dx + dy * dy < shadow2) over.push(idx);
      }
    }

    S.disk = {
      x: Float32Array.from(xs),
      y: Float32Array.from(ys),
      r: Float32Array.from(rs),
      pa: Float32Array.from(pa),
      oa: Float32Array.from(oa),
      pb: Float32Array.from(pb),
      ob: Float32Array.from(ob),
      pc: Float32Array.from(pc),
      oc: Float32Array.from(oc),
      radN: Float32Array.from(radNs),
      beama: Float32Array.from(beamas),
      prof: Float32Array.from(profs),
      edge: Float32Array.from(edges),
      dop: Float32Array.from(dops),
    };
    S.overShadow = Uint32Array.from(over);
  }

  /* ------------------------------------------------------------------ *
   *  Lensed halo just outside the shadow
   * ------------------------------------------------------------------ */

  function buildHalo() {
    const R = S.R;
    const cw = S.cellW;
    const ch = S.cellH;
    const B = LAYOUT.haloOuter * R;

    const c0 = Math.floor((S.cx - B - S.offX) / cw);
    const c1 = Math.ceil((S.cx + B - S.offX) / cw);
    const r0 = Math.floor((S.cy - B - S.offY) / ch);
    const r1 = Math.ceil((S.cy + B - S.offY) / ch);

    const xs = [];
    const ys = [];
    const rads = [];
    const angs = [];
    const beams = [];
    const pa = [];
    const pb = [];

    for (let row = r0; row <= r1; row++) {
      const py = S.offY + row * ch;
      const dy = py - S.cy;
      for (let col = c0; col <= c1; col++) {
        const px = S.offX + col * cw;
        const dx = px - S.cx;

        const theta = Math.hypot(dx, dy) / R;
        if (theta < 1 || theta > LAYOUT.haloOuter) continue;

        const phi = Math.atan2(dy, dx);
        const vert = Math.abs(Math.sin(phi));
        const top = Math.max(0, -Math.sin(phi - LAYOUT.discTilt));
        const bottom = Math.max(0, Math.sin(phi - LAYOUT.discTilt));
        const phase =
          fbm(Math.cos(phi) * 2.2 + theta * 0.8 + 9, Math.sin(phi) * 2.2 + theta * 0.8 + 3, 3) *
          TAU;

        xs.push(dx);
        ys.push(dy);
        rads.push(
          0.95 * Math.exp(-Math.pow((theta - 1.06) / 0.075, 2)) +
            0.45 * Math.exp(-Math.pow((theta - 1.27) / 0.17, 2)),
        );
        angs.push(
          0.45 +
            0.35 * Math.pow(vert, 1.2) +
            0.25 * Math.pow(top, 1.2) +
            0.15 * Math.pow(bottom, 1.2),
        );
        beams.push(0.82 + 0.3 * Math.cos(phi - LAYOUT.discTilt));
        pa.push(phi * 2 + theta * 17 + phase);
        pb.push(theta * 24 + phi * 3 + phase * 2);
      }
    }

    S.halo = {
      x: Float32Array.from(xs),
      y: Float32Array.from(ys),
      rad: Float32Array.from(rads),
      ang: Float32Array.from(angs),
      beam: Float32Array.from(beams),
      pa: Float32Array.from(pa),
      pb: Float32Array.from(pb),
    };
  }

  /* ------------------------------------------------------------------ *
   *  Palettes (cached, rebuilt only when the disk colour changes)
   * ------------------------------------------------------------------ */

  function buildPalettes() {
    const base = SETTINGS.diskHsl;
    const hue = base.h;
    const sat = clamp(base.s * 100, 55, 100);

    const disk = [];
    for (let ri = 0; ri < 8; ri++) {
      const k = ri / 7; // 0 = inner edge, 1 = outer edge
      for (let vi = 0; vi < 8; vi++) {
        const v = vi / 7;
        const h = hue + 16 * (1 - k) - 14 * k;
        const s = clamp(sat + 8 * (1 - k), 55, 100);
        const l = clamp(28 + 50 * v + 6 * (1 - k), 0, 84);
        const a = 0.4 + 0.58 * v;
        disk.push(
          `hsla(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%, ${a.toFixed(2)})`,
        );
      }
    }

    const halo = [];
    for (let i = 0; i < 16; i++) {
      const v = i / 15;
      const h = hue + 18 - 8 * v;
      const s = clamp(sat * 0.9, 55, 100);
      const l = 44 + 46 * v;
      const a = 0.3 + 0.68 * v;
      halo.push(
        `hsla(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%, ${a.toFixed(2)})`,
      );
    }

    const ring = [];
    for (let i = 0; i < 8; i++) {
      const v = i / 7;
      const h = hue + 22;
      const l = 78 + 20 * v;
      const a = 0.35 + 0.6 * v;
      ring.push(`hsla(${h.toFixed(1)}, 45%, ${l.toFixed(1)}%, ${a.toFixed(2)})`);
    }

    S.diskPalette = disk;
    S.haloPalette = halo;
    S.ringPalette = ring;
  }

  function buildStarPalette() {
    const cool = [];
    const warm = [];
    const blue = [];
    for (let i = 0; i < 16; i++) {
      const a = (0.05 + (i / 15) * 0.9).toFixed(2);
      cool.push(`rgba(214, 228, 255, ${a})`);
      warm.push(`rgba(255, 226, 188, ${a})`);
      blue.push(`rgba(176, 204, 255, ${a})`);
    }
    S.starPalette = { cool, warm, blue };
  }

  /* ------------------------------------------------------------------ *
   *  Drawing
   * ------------------------------------------------------------------ */

  function drawHalo(t, ox, oy) {
    const h = S.halo;
    if (!h) return;

    const g = ctx;
    setGlyphStyle(g);

    const cx = S.cx + ox;
    const cy = S.cy + oy;
    const pal = S.haloPalette;
    const doppler = SETTINGS.doppler;

    for (let i = 0; i < h.rad.length; i++) {
      const tex =
        0.6 +
        0.25 * Math.sin(h.pa[i] - t * 0.35) +
        0.1 * Math.sin(h.pb[i] - t * 0.55);

      let val = h.rad[i] * h.ang[i] * (doppler ? h.beam[i] : 1) * tex * 2;
      if (val < 0.04) continue;
      if (val > 1) val = 1;

      const vi = (val * 15.999) | 0;
      const gi = 1 + ((val * RAMP_LAST) | 0);
      g.fillStyle = pal[vi];
      g.fillText(RAMP.charAt(gi > RAMP_LAST ? RAMP_LAST : gi), cx + h.x[i], cy + h.y[i]);
    }
  }

  function drawDisk(t, ox, oy, overOnly) {
    const d = S.disk;
    if (!d) return;

    const g = ctx;
    setGlyphStyle(g);

    const cx = S.cx + ox;
    const cy = S.cy + oy;
    const pal = S.diskPalette;
    const over = S.overShadow;
    const count = overOnly ? over.length : d.r.length;
    const inner = LAYOUT.discInner;
    const speed = SETTINGS.diskSpeed;

    for (let k = 0; k < count; k++) {
      const i = overOnly ? over[k] : k;
      const r = d.r[i];

      const tex =
        0.5 +
        0.22 * Math.sin(d.pa[i] + t * d.oa[i] * speed) +
        0.12 * Math.sin(d.pb[i] - t * d.ob[i] * speed) +
        0.16 * Math.sin(d.pc[i] - t * d.oc[i] * speed);

      let beam = 1;
      if (SETTINGS.doppler) {
        beam = 1 + 0.42 * d.beama[i] * d.dop[i];
        beam = beam < 0.58 ? 0.58 : beam > 1.55 ? 1.55 : beam;
      }

      let val = tex * d.prof[i] * d.edge[i] * beam * 2.2;
      if (r < inner * 1.05) val += 0.25;
      if (val < 0.045) continue;
      if (val > 1) val = 1;

      const ri = (d.radN[i] * 7.999) | 0;
      const vi = (val * 7.999) | 0;
      const gi = 1 + ((val * RAMP_LAST) | 0);
      g.fillStyle = pal[ri * 8 + vi];
      g.fillText(RAMP.charAt(gi > RAMP_LAST ? RAMP_LAST : gi), cx + d.x[i], cy + d.y[i]);
    }
  }

  function drawShadow(ox, oy) {
    ctx.beginPath();
    ctx.arc(S.cx + ox, S.cy + oy, S.R * 0.996, 0, TAU);
    ctx.fillStyle = BLACK;
    ctx.fill();
  }

  function drawPhotonRing(t, ox, oy) {
    const g = ctx;
    setGlyphStyle(g);

    const cx = S.cx + ox;
    const cy = S.cy + oy;
    const R = S.R;
    const steps = Math.max(120, Math.round((TAU * R) / (S.cellW * 0.5)));
    const pal = S.ringPalette;

    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * TAU;
      const beam = SETTINGS.doppler ? 0.86 + 0.14 * Math.cos(a - LAYOUT.discTilt) : 1;
      const shimmer = 0.9 + 0.1 * Math.sin(a * 3 + t * 0.5);
      const b = clamp(beam * shimmer, 0, 1);
      const vi = (b * 7.999) | 0;
      const glyph = b > 0.92 ? '@' : b > 0.8 ? '#' : b > 0.6 ? '*' : '+';
      g.fillStyle = pal[vi];
      g.fillText(glyph, cx + Math.cos(a) * R * 1.012, cy + Math.sin(a) * R * 1.012);
    }
  }

  /* ------------------------------------------------------------------ *
   *  Layout / resize
   * ------------------------------------------------------------------ */

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.max(320, window.innerWidth);
    const h = Math.max(240, window.innerHeight);

    S.w = w;
    S.h = h;
    S.dpr = dpr;

    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const base = clamp(Math.round(h / 60), 11, 36);
    S.fontPx = Math.max(9, base * SETTINGS.fontScale);
    S.cellW = S.fontPx * 0.62;
    S.cellH = S.fontPx * 1.18;

    S.cols = Math.floor(w / S.cellW) + 1;
    S.rows = Math.floor(h / S.cellH) + 1;
    S.offX = (w - (S.cols - 1) * S.cellW) / 2;
    S.offY = (h - (S.rows - 1) * S.cellH) / 2;
    S.cx = w / 2;
    S.cy = h / 2;
    S.R = Math.max(48, Math.min(w, h) * LAYOUT.shadowScale);
    S.font =
      S.fontPx.toFixed(1) + 'px "Consolas", "Cascadia Mono", "Lucida Console", monospace';

    buildBackground();
    buildStars();
    buildDisk();
    buildHalo();
    buildPalettes();
    buildStarPalette();
  }

  /* ------------------------------------------------------------------ *
   *  Render loop
   * ------------------------------------------------------------------ */

  function render(t) {
    S.pointer.x += (S.pointer.tx - S.pointer.x) * 0.045;
    S.pointer.y += (S.pointer.ty - S.pointer.y) * 0.045;

    const ox = -S.pointer.x * 10 + Math.sin(t * 0.05) * 4;
    const oy = -S.pointer.y * 8 + Math.cos(t * 0.043) * 3;

    ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, S.w, S.h);

    if (S.bgLayer) {
      ctx.drawImage(S.bgLayer, -S.pad + ox, -S.pad + oy, S.bgLayerW, S.bgLayerH);
    }

    drawStars(t, ox, oy);
    drawHalo(t, ox, oy);
    drawDisk(t, ox, oy, false);
    drawShadow(ox, oy);
    drawDisk(t, ox, oy, true);
    drawPhotonRing(t, ox, oy);
  }

  let lastFrame = 0;
  function tick(now) {
    requestAnimationFrame(tick);
    if (now - lastFrame < FRAME_MS) return;
    lastFrame = now;
    render((now - S.start) / 1000);
  }

  /* ------------------------------------------------------------------ *
   *  Input, resize, Wallpaper Engine integration
   * ------------------------------------------------------------------ */

  window.addEventListener(
    'pointermove',
    (e) => {
      S.pointer.tx = (e.clientX / S.w) * 2 - 1;
      S.pointer.ty = (e.clientY / S.h) * 2 - 1;
    },
    { passive: true },
  );

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 180);
  });

  window.wallpaperPropertyListener = {
    applyUserProperties(properties) {
      if (!properties) return;
      let rebuild = false;
      let rebuildStars = false;
      let rebuildPalette = false;

      if (properties.diskcolor) {
        const c = parseWeColor(properties.diskcolor.value);
        if (c) {
          SETTINGS.diskHsl = c;
          rebuildPalette = true;
        }
      }
      if (properties.stardensity) {
        const v = Number(properties.stardensity.value);
        if (Number.isFinite(v)) {
          SETTINGS.starDensity = clamp(v, 0.2, 3);
          rebuildStars = true;
        }
      }
      if (properties.fontscale) {
        const v = Number(properties.fontscale.value);
        if (Number.isFinite(v)) {
          SETTINGS.fontScale = clamp(v, 0.7, 1.8);
          rebuild = true;
        }
      }
      if (properties.diskspeed) {
        const v = Number(properties.diskspeed.value);
        if (Number.isFinite(v)) SETTINGS.diskSpeed = clamp(v, 0, 2);
      }
      if (properties.doppler) {
        SETTINGS.doppler = properties.doppler.value !== false;
      }
      if (properties.twinkle) {
        SETTINGS.twinkle = properties.twinkle.value !== false;
      }

      if (rebuild) {
        resize();
      } else {
        if (rebuildStars) buildStars();
        if (rebuildPalette) buildPalettes();
      }
    },
  };

  resize();

  /* Dev helper: ?freeze=SECONDS renders one deterministic frame.
     Used for preview stills and visual regression checks. */
  const freezeParam = new URLSearchParams(location.search).get('freeze');
  if (freezeParam !== null && Number.isFinite(Number(freezeParam))) {
    S.frozen = true;
    render(Math.max(0, Number(freezeParam)));
    return;
  }

  requestAnimationFrame(tick);
})();
