/* SPDX-License-Identifier: MIT */
'use strict';

/*
 * ASCII Cosmos — animated ASCII-art space wallpaper for Wallpaper Engine.
 * Renders a nebula, a ringed gas giant, an icy world, moons, twinkling
 * stars and an occasional shooting star, all drawn with monospace glyphs.
 */

(() => {
  /* ------------------------------------------------------------------ *
   *  Settings (overridable from Wallpaper Engine properties)
   * ------------------------------------------------------------------ */

  const BG = '#04060c';
  const RAMP = ' .:-=+*#%@'; // planet shading ramp, dark to bright
  const RAMP_LAST = RAMP.length - 1;
  const MOON_RAMP = ' .:+#';
  const LIGHT = Object.freeze({ x: -0.55, y: -0.48, z: 0.683 });
  const TARGET_FPS = 30;
  const FRAME_MS = 1000 / TARGET_FPS;

  /** Settings mirrored from Wallpaper Engine properties. */
  const SETTINGS = {
    accentHsl: { h: 30, s: 0.86, l: 0.65 }, // gas giant
    iceHsl: { h: 183, s: 0.53, l: 0.58 }, // icy planet
    starDensity: 1,
    twinkle: true,
    fontScale: 1,
  };

  /* ------------------------------------------------------------------ *
   *  Utils
   * ------------------------------------------------------------------ */

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, k) => a + (b - a) * k;

  /** Shared canvas text style for every glyph layer. */
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
      if (max === r) h = (((g - b) / d) + 6) % 6;
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
    planets: [],
    shooting: null, // { t0, dur, ... } with times in seconds
    nextShootAt: 5,
    start: performance.now(),
    frozen: false,
    pointer: { x: 0, y: 0, tx: 0, ty: 0 },
  };

  /* ------------------------------------------------------------------ *
   *  Static background: nebula + faint fixed stars (one-time render)
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

    /* --- nebula dust ------------------------------------------------ */
    const blobs = [
      { x: 0.14, y: 0.28, rx: 0.17, ry: 0.16, s: 0.9 },
      { x: 0.5, y: 0.62, rx: 0.2, ry: 0.15, s: 0.85 },
      { x: 0.88, y: 0.2, rx: 0.16, ry: 0.14, s: 0.85 },
      { x: 0.7, y: 0.85, rx: 0.18, ry: 0.12, s: 0.7 },
    ];

    for (let row = 0; row < rows; row++) {
      const v = row / rows;
      for (let col = 0; col < cols; col++) {
        const u = col / cols;

        const warp = fbm(u * 2.0 + 3.1, v * 2.0 + 7.7, 3) - 0.5;
        const detail = fbm(u * 8.5 + 33.1 + warp * 2.2, v * 6.5 + 17.9 + warp * 2.2, 5);

        let shape = 0;
        for (let bi = 0; bi < blobs.length; bi++) {
          const bl = blobs[bi];
          const ddx = (u - bl.x) / bl.rx;
          const ddy = (v - bl.y) / bl.ry;
          const gg = bl.s * Math.exp(-(ddx * ddx + ddy * ddy) * 1.2);
          if (gg > shape) shape = gg;
        }

        /* diagonal galactic haze */
        const bandCenter = 0.56 + 0.16 * Math.sin(u * 3.2 + 0.8);
        const band = Math.exp(-Math.pow((v - bandCenter + warp * 0.12) * 3.4, 2));
        if (band * 0.32 > shape) shape = band * 0.32;

        const clump = Math.max(0, detail - 0.44) * 3.6;
        let inten = Math.max(0, shape * clump - 0.06) * 1.6;
        if (inten < 0.05) continue;
        inten = Math.min(inten, 1.1);

        const pick = hash2(col * 0.731 + 4.1, row * 0.917 + 9.3);
        let glyph;
        let alpha;

        if (inten < 0.08) {
          glyph = '.';
          alpha = 0.05 + inten * 0.7;
        } else if (inten < 0.2) {
          glyph = pick < 0.6 ? '.' : ',';
          alpha = 0.07 + inten * 0.65;
        } else if (inten < 0.4) {
          glyph = pick < 0.65 ? ':' : '.';
          alpha = 0.1 + inten * 0.6;
        } else if (inten < 0.7) {
          glyph = pick < 0.55 ? ';' : ':';
          alpha = 0.14 + inten * 0.5;
        } else {
          glyph = pick < 0.5 ? ';' : ':';
          alpha = 0.18 + Math.min(inten, 1) * 0.45;
        }

        const hue = 218 + 62 * fbm(u * 2.1 + 60, v * 2.1 + 30, 3);
        const light = 32 + Math.min(inten, 1) * 40;
        g.fillStyle = `hsla(${hue.toFixed(0)}, 64%, ${light.toFixed(0)}%, ${alpha.toFixed(3)})`;

        /* break the perfect lattice a little so clouds feel organic */
        const jx = (hash2(col * 1.71 + 2.2, row * 3.13 + 8.8) - 0.5) * cw * 0.55;
        const jy = (hash2(col * 2.37 + 7.1, row * 1.13 + 3.4) - 0.5) * ch * 0.45;
        g.fillText(glyph, col * cw + cw / 2 + jx, row * ch + ch / 2 + jy);
      }
    }

    /* --- faint fixed stars ------------------------------------------ */
    const rng = mulberry32(20260716);
    const starCount = Math.round(cols * rows * 0.006 * SETTINGS.starDensity);
    for (let i = 0; i < starCount; i++) {
      const col = Math.floor(rng() * cols);
      const row = Math.floor(rng() * rows);
      const b = 0.1 + rng() * 0.55;
      const glyph = b > 0.5 ? '+' : b > 0.3 ? '.' : ',';
      const warm = rng() < 0.22;
      g.fillStyle = warm
        ? `rgba(255, 226, 186, ${b.toFixed(2)})`
        : `rgba(196, 214, 255, ${b.toFixed(2)})`;
      g.fillText(glyph, col * cw + cw / 2, row * ch + ch / 2);
    }

    S.bgLayer = layer;
    S.bgLayerW = W;
    S.bgLayerH = H;
  }

  /* ------------------------------------------------------------------ *
   *  Twinkling stars
   * ------------------------------------------------------------------ */

  function buildStars() {
    const rng = mulberry32(910237);
    const count = Math.round(S.cols * S.rows * 0.0042 * SETTINGS.starDensity);
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        x: rng() * S.w,
        y: rng() * S.h,
        phase: rng() * Math.PI * 2,
        speed: 0.3 + rng() * 1.6,
        size: rng(),
        warm: rng() < 0.2,
      });
    }
    S.stars = list;
  }

  function drawStars(t, ox, oy) {
    const g = ctx;
    setGlyphStyle(g);

    const px = ox * 0.55;
    const py = oy * 0.45;

    for (let i = 0; i < S.stars.length; i++) {
      const st = S.stars[i];
      const x = st.x + px;
      const y = st.y + py;
      if (x < -16 || y < -16 || x > S.w + 16 || y > S.h + 16) continue;

      let b = 0.5 + 0.5 * Math.sin(t * st.speed + st.phase);
      if (!SETTINGS.twinkle) b = 0.7;

      let glyph;
      let alpha;
      if (st.size > 0.94 && b > 0.55) {
        glyph = '*';
        alpha = 0.35 + b * 0.6;
      } else if (st.size > 0.7) {
        glyph = b > 0.45 ? '+' : '.';
        alpha = 0.2 + b * 0.5;
      } else {
        glyph = '.';
        alpha = 0.1 + b * 0.42;
      }

      g.fillStyle = st.warm
        ? `rgba(255, 228, 190, ${alpha.toFixed(2)})`
        : `rgba(214, 226, 255, ${alpha.toFixed(2)})`;
      g.fillText(glyph, x, y);
    }
  }

  /* ------------------------------------------------------------------ *
   *  Planets
   * ------------------------------------------------------------------ */

  function buildPlanets() {
    const m = Math.min(S.w, S.h);

    S.planets = [
      {
        kind: 'gas',
        x: S.w * 0.765,
        y: S.h * 0.395,
        r: m * 0.2,
        seed: 3.17,
        spin: 0.055,
        ax: S.w * 0.008,
        ay: S.h * 0.007,
        sx: 0.031,
        sy: 0.024,
        px: 0.4,
        py: 1.7,
        hue: () => SETTINGS.accentHsl.h,
        sat: () => SETTINGS.accentHsl.s * 100,
        ring: true,
        moon: { dist: 1.8, size: 0.085, speed: 0.1, phase: -2.35, squash: 0.42 },
      },
      {
        kind: 'rock',
        x: S.w * 0.25,
        y: S.h * 0.72,
        r: m * 0.107,
        seed: 9.41,
        spin: -0.09,
        ax: S.w * 0.006,
        ay: S.h * 0.008,
        sx: 0.023,
        sy: 0.029,
        px: 2.1,
        py: 0.6,
        hue: () => SETTINGS.iceHsl.h,
        sat: () => SETTINGS.iceHsl.s * 100,
        ring: false,
        moon: { dist: 2.15, size: 0.19, speed: -0.16, phase: 1.1, squash: 0.5 },
      },
    ];
  }

  /* Palettes depend only on hue/saturation, so cache them instead of
     rebuilding ten colour strings per planet on every frame. */
  const paletteCache = new Map();

  function makePalette(hue, sat, kind) {
    const key = `${kind}|${hue.toFixed(2)}|${sat.toFixed(2)}`;
    const cached = paletteCache.get(key);
    if (cached) return cached;

    const out = [];
    for (let i = 0; i <= RAMP_LAST; i++) {
      const k = i / RAMP_LAST;
      const h = kind === 'gas' ? hue + 10 * k : hue - 12 * k;
      const l = kind === 'gas' ? 6 + k * 62 : 8 + k * 60;
      const s = kind === 'gas' ? sat : sat * 0.85;
      const a = 0.2 + 0.8 * k;
      out.push(`hsla(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%, ${a.toFixed(2)})`);
    }

    /* A colour picker can generate many hues; keep the cache bounded. */
    if (paletteCache.size >= 32) paletteCache.clear();
    paletteCache.set(key, out);
    return out;
  }

  function drawSphere(g, pl, cx, cy, t, palette) {
    const R = pl.r;
    const cw = S.cellW;
    const ch = S.cellH;

    const extent = R * 1.07;
    const c0 = Math.floor((cx - extent - S.offX) / cw);
    const c1 = Math.ceil((cx + extent - S.offX) / cw);
    const r0 = Math.floor((cy - extent - S.offY) / ch);
    const r1 = Math.ceil((cy + extent - S.offY) / ch);

    const spin = t * pl.spin + pl.seed;
    const isGas = pl.kind === 'gas';

    for (let row = r0; row <= r1; row++) {
      const py = S.offY + row * ch;
      const dy = py - cy;
      for (let col = c0; col <= c1; col++) {
        const px = S.offX + col * cw;
        const dx = px - cx;

        const dist2 = dx * dx + dy * dy;
        if (dist2 > R * R) continue;

        const nx = dx / R;
        const ny = dy / R;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));

        const lam = nx * LIGHT.x + ny * LIGHT.y + nz * LIGHT.z;
        const light = Math.pow(clamp(lam, 0, 1), 0.88);

        const lon = Math.atan2(nx, nz) + spin;
        const lat = Math.asin(clamp(ny, -1, 1));

        let tex;
        if (isGas) {
          const turb = fbm(lon * 1.2 + pl.seed, lat * 2.6 - pl.seed, 4) - 0.5;
          const bands = 0.5 + 0.5 * Math.sin(lat * 7.6 + turb * 6.0);
          tex = 0.4 + 0.6 * bands + turb * 0.55;
        } else {
          const n = fbm(lon * 1.8 + pl.seed, lat * 1.8 + pl.seed * 1.7, 4);
          tex = 0.25 + n * 1.05;
          if (n < 0.38) tex *= 0.72;
          const crater = fbm(lon * 5.2 + 11.3 + pl.seed, lat * 5.2 + 5.1, 3);
          if (crater > 0.58) tex *= 0.52;
          const pole = Math.abs(lat) / (Math.PI / 2);
          if (pole > 0.7) tex += (pole - 0.7) * 2.0;
        }

        const lit = clamp((0.05 + 0.9 * light) * (0.52 + 0.62 * tex), 0, 1.06);
        const idx = clamp(Math.floor(lit * 9.4), 1, RAMP_LAST);

        g.fillStyle = palette[idx];
        g.fillText(RAMP[idx], px, py);
      }
    }

    /* thin atmospheric halo, lit side only */
    const halo = R * 1.075;
    const h0 = Math.floor((cx - halo - S.offX) / cw);
    const h1 = Math.ceil((cx + halo - S.offX) / cw);
    const hr0 = Math.floor((cy - halo - S.offY) / ch);
    const hr1 = Math.ceil((cy + halo - S.offY) / ch);
    for (let row = hr0; row <= hr1; row++) {
      const py = S.offY + row * ch;
      const dy = py - cy;
      for (let col = h0; col <= h1; col++) {
        const px = S.offX + col * cw;
        const dx = px - cx;
        const d2 = dx * dx + dy * dy;
        if (d2 <= R * R || d2 > halo * halo) continue;
        const nx = dx / R;
        const ny = dy / R;
        const lam = nx * LIGHT.x + ny * LIGHT.y;
        if (lam <= 0.18) continue;
        const a = 0.03 + lam * 0.06;
        g.fillStyle = `hsla(${pl.hue().toFixed(0)}, 70%, 72%, ${a.toFixed(3)})`;
        g.fillText('.', px, py);
      }
    }
  }

  const RING_BANDS = [
    { from: 1.2, to: 1.42, glyph: '=', style: 'hsla(205, 32%, 88%, 0.95)' },
    { from: 1.49, to: 1.58, glyph: '-', style: 'hsla(210, 28%, 80%, 0.78)' },
    { from: 1.66, to: 1.73, glyph: ':', style: 'hsla(220, 30%, 82%, 0.5)' },
    { from: 1.85, to: 1.92, glyph: '.', style: 'hsla(222, 30%, 84%, 0.3)' },
  ];

  function drawRing(g, pl, cx, cy, front) {
    const R = pl.r;
    const a = R * 1.9;
    const b = R * 0.62;
    const tilt = -0.52;
    const ca = Math.cos(tilt);
    const sa = Math.sin(tilt);

    const bx = Math.hypot(a * ca, b * sa);
    const by = Math.hypot(a * sa, b * ca);

    const cw = S.cellW;
    const ch = S.cellH;
    const c0 = Math.floor((cx - bx - S.offX) / cw);
    const c1 = Math.ceil((cx + bx - S.offX) / cw);
    const r0 = Math.floor((cy - by - S.offY) / ch);
    const r1 = Math.ceil((cy + by - S.offY) / ch);

    for (let row = r0; row <= r1; row++) {
      const py = S.offY + row * ch;
      const dy = py - cy;
      for (let col = c0; col <= c1; col++) {
        const px = S.offX + col * cw;
        const dx = px - cx;

        const xr = dx * ca + dy * sa;
        const yr = -dx * sa + dy * ca;
        if (front !== (yr >= 0)) continue; // near half vs. far half

        const rn = Math.hypot(xr / a, yr / b);
        if (rn < RING_BANDS[0].from || rn > RING_BANDS[RING_BANDS.length - 1].to) continue;

        let band = null;
        let bandIndex = -1;
        for (let i = 0; i < RING_BANDS.length; i++) {
          if (rn >= RING_BANDS[i].from && rn <= RING_BANDS[i].to) {
            band = RING_BANDS[i];
            bandIndex = i;
            break;
          }
        }
        if (!band) continue;

        /* only the main band crosses in front of the planet itself */
        if (front && bandIndex > 0 && dx * dx + dy * dy <= R * R) continue;

        /* occasional thin gaps so the bands feel made of dust */
        const ang = Math.atan2(yr / b, xr / a);
        if (Math.sin(ang * 31 + pl.seed * 5) < -0.965) continue;

        g.fillStyle = band.style;
        g.fillText(band.glyph, px, py);
      }
    }
  }

  function drawMiniSphere(g, cx, cy, R) {
    const cw = S.cellW;
    const ch = S.cellH;
    const c0 = Math.floor((cx - R - S.offX) / cw);
    const c1 = Math.ceil((cx + R - S.offX) / cw);
    const r0 = Math.floor((cy - R - S.offY) / ch);
    const r1 = Math.ceil((cy + R - S.offY) / ch);

    for (let row = r0; row <= r1; row++) {
      const py = S.offY + row * ch;
      const dy = py - cy;
      for (let col = c0; col <= c1; col++) {
        const px = S.offX + col * cw;
        const dx = px - cx;
        const d2 = dx * dx + dy * dy;
        if (d2 > R * R) continue;

        const nx = dx / R;
        const ny = dy / R;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        const lam = nx * LIGHT.x + ny * LIGHT.y + nz * LIGHT.z;
        const lit = clamp(0.16 + Math.pow(clamp(lam, 0, 1), 0.9), 0, 1);
        const idx = clamp(Math.floor(lit * 5), 1, MOON_RAMP.length - 1);
        const glyph = MOON_RAMP.charAt(idx);
        g.fillStyle = `hsla(215, 12%, ${(30 + lit * 52).toFixed(0)}%, ${(0.4 + lit * 0.55).toFixed(2)})`;
        g.fillText(glyph, px, py);
      }
    }
  }

  function drawMoon(g, pl, cx, cy, t) {
    const mn = pl.moon;
    const orbit = pl.r * mn.dist;
    const ang = t * mn.speed + mn.phase;
    const mx = cx + Math.cos(ang) * orbit;
    const my = cy + Math.sin(ang) * orbit * mn.squash;
    drawMiniSphere(g, mx, my, pl.r * mn.size);
  }

  function drawPlanets(t, ox, oy) {
    const g = ctx;
    setGlyphStyle(g);

    for (let i = 0; i < S.planets.length; i++) {
      const pl = S.planets[i];
      const cx = pl.x + Math.sin(t * pl.sx + pl.px) * pl.ax + ox * 0.28;
      const cy = pl.y + Math.cos(t * pl.sy + pl.py) * pl.ay + oy * 0.28;
      const palette = makePalette(pl.hue(), pl.sat(), pl.kind);

      if (pl.ring) drawRing(g, pl, cx, cy, false);
      drawSphere(g, pl, cx, cy, t, palette);
      if (pl.ring) drawRing(g, pl, cx, cy, true);
      if (pl.moon) drawMoon(g, pl, cx, cy, t);
    }
  }

  /* ------------------------------------------------------------------ *
   *  Shooting star
   * ------------------------------------------------------------------ */

  function spawnShooting(t) {
    const rng = Math.random;
    const dirX = rng() < 0.5 ? 1 : -1;
    const dist = S.w * (0.2 + rng() * 0.18);
    S.shooting = {
      t0: t,
      dur: 0.95 + rng() * 0.55, // seconds
      x: S.w * (0.18 + rng() * 0.64),
      y: S.h * (0.06 + rng() * 0.32),
      dirX,
      dirY: 0.58,
      dist,
      len: 12 + Math.floor(rng() * 8),
    };
    S.nextShootAt = t + 8 + rng() * 10;
  }

  function drawShooting(t) {
    /* Frozen frames stay deterministic, so previews never vary. */
    if (S.frozen) return;

    if (!S.shooting) {
      if (t > S.nextShootAt) spawnShooting(t);
      if (!S.shooting) return;
    }

    const sh = S.shooting;
    const p = (t - sh.t0) / sh.dur;
    if (p >= 1) {
      S.shooting = null;
      return;
    }

    const g = ctx;
    const head = sh.dist * (1 - Math.pow(1 - p, 2.2));
    const hx = sh.x + sh.dirX * head;
    const hy = sh.y + sh.dirY * head;

    const n = Math.hypot(sh.dirX, sh.dirY);
    const ux = sh.dirX / n;
    const uy = sh.dirY / n;

    const env = p < 0.12 ? p / 0.12 : 1 - (p - 0.12) / 0.88;

    for (let i = 0; i < sh.len; i++) {
      const k = i / sh.len;
      const px = hx - ux * i * S.cellW * 1.05;
      const py = hy - uy * i * S.cellW * 1.05;
      const a = env * (1 - k) * (1 - k) * 0.95;
      if (a < 0.03) continue;

      let glyph;
      if (i === 0) glyph = '*';
      else if (i < 3) glyph = '+';
      else if (i < 6) glyph = '-';
      else glyph = '.';

      g.fillStyle = `rgba(228, 240, 255, ${a.toFixed(2)})`;
      g.fillText(glyph, px, py);
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
    S.font =
      S.fontPx.toFixed(1) + 'px "Consolas", "Cascadia Mono", "Lucida Console", monospace';

    buildBackground();
    buildStars();
    buildPlanets();
  }

  /* ------------------------------------------------------------------ *
   *  Render loop
   * ------------------------------------------------------------------ */

  function render(t) {
    S.pointer.x += (S.pointer.tx - S.pointer.x) * 0.045;
    S.pointer.y += (S.pointer.ty - S.pointer.y) * 0.045;

    const ox = -S.pointer.x * 18 + Math.sin(t * 0.06) * 9;
    const oy = -S.pointer.y * 14 + Math.cos(t * 0.047) * 7;

    ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, S.w, S.h);

    if (S.bgLayer) {
      ctx.drawImage(S.bgLayer, -S.pad + ox, -S.pad + oy, S.bgLayerW, S.bgLayerH);
    }

    drawStars(t, ox, oy);
    drawPlanets(t, ox, oy);
    drawShooting(t);
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
      let rebuildStatic = false;

      if (properties.accent) {
        const c = parseWeColor(properties.accent.value);
        if (c) SETTINGS.accentHsl = c;
      }
      if (properties.ice) {
        const c = parseWeColor(properties.ice.value);
        if (c) SETTINGS.iceHsl = c;
      }
      if (properties.stardensity) {
        const v = Number(properties.stardensity.value);
        if (Number.isFinite(v)) {
          SETTINGS.starDensity = clamp(v, 0.2, 3);
          rebuildStatic = true;
        }
      }
      if (properties.fontscale) {
        const v = Number(properties.fontscale.value);
        if (Number.isFinite(v)) {
          SETTINGS.fontScale = clamp(v, 0.7, 1.8);
          rebuild = true;
        }
      }
      if (properties.twinkle) {
        SETTINGS.twinkle = properties.twinkle.value !== false;
      }

      if (rebuild) {
        resize();
      } else if (rebuildStatic) {
        buildBackground();
        buildStars();
      }
    },
  };

  resize();

  /* Dev helper: ?freeze=SECONDS renders a single deterministic frame
     (used to build the animated preview GIF without a screen recorder). */
  const freezeParam = new URLSearchParams(location.search).get('freeze');
  if (freezeParam !== null && Number.isFinite(Number(freezeParam))) {
    S.frozen = true;
    render(Math.max(0, Number(freezeParam)));
    return;
  }

  requestAnimationFrame(tick);
})();
