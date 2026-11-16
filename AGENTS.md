# AGENTS.md

This file is the source of truth for AI coding agents working on ASCII
Wallpapers. [`CLAUDE.md`](CLAUDE.md) imports it and adds Claude Code-specific
workflow notes. Human contributors should also read
[`CONTRIBUTING.md`](CONTRIBUTING.md).

## Project at a glance

ASCII Wallpapers is a collection of animated wallpapers drawn with monospace
glyphs on an HTML `<canvas>`. Each wallpaper is a self-contained static website
that runs in [Wallpaper Engine](https://www.wallpaperengine.io/) and in any
modern browser.

Hard invariants:

- **No build step.** Files are served and opened exactly as they are; there is
  no bundler, transpiler or generated runtime code.
- **No external assets or requests.** No CDNs, webfonts, remote images, audio
  or analytics. The check script rejects remote `src`, `href`, `fetch` and
  `@import`.
- **No runtime dependencies.** The wallpaper is vanilla HTML/CSS/JS with the
  2D canvas API. Node.js is used only for local tooling and has no packages.
- **Self-contained wallpaper folders.** Copying `wallpapers/<name>/` into
  Wallpaper Engine must be enough to run it.
- **Stable Wallpaper Engine property keys.** Renaming a property resets users'
  saved settings; treat keys in `project.json` as a public API.
- **30–60 fps and under ~8 ms of script time per frame at 1080p.** Do not add
  per-frame allocations or expensive work without measuring.

License: MIT — see [`LICENSE`](LICENSE). Maintainer:
[NemoKing1210](https://github.com/NemoKing1210).

## Repository map

| Path | Purpose |
| --- | --- |
| `wallpapers/<name>/index.html` | Page shell: canvas, overlays, metadata, noscript fallback |
| `wallpapers/<name>/main.js` | Renderer, layout, input and Wallpaper Engine integration |
| `wallpapers/<name>/project.json` | Wallpaper Engine metadata and user properties |
| `wallpapers/<name>/preview.jpg` | 1920×1080 preview shown by Wallpaper Engine |
| `wallpapers/<name>/README.md` | Settings, install steps and rendering notes for that wallpaper |
| `previews/<name>.gif` | Animated preview used by the root READMEs |
| `tools/check.mjs` | Dependency-free repository validation |
| `tools/serve.mjs` | Dependency-free static preview server |
| `.github/workflows/check.yml` | CI: runs `npm run check` on push and pull request |
| `README*.md` | Gallery and install guide in 8 languages |
| `index.html` | Root gallery: static previews and on-demand live iframes |
| `CONTRIBUTING.md` | Contribution rules, checks, translation matrix |
| `SECURITY.md` | Private vulnerability reporting and scope |
| `package.json` | Tooling scripts and Node engine requirement (no dependencies) |

Wallpapers today: `wallpapers/cosmos/` and `wallpapers/blackhole/`. Read a
wallpaper's README before touching its renderer.

## Quick start

Requires Node.js 18+ for tooling; nothing to install.

```bash
npm run serve   # http://localhost:8123/ (gallery)
npm run check   # validate wallpapers, translations and local links
```

The root gallery lists every wallpaper with a static preview and can run one
live preview at a time.

Any static server works, for example `python -m http.server 8123`. A wallpaper
can also be opened directly via `wallpapers/cosmos/index.html`, because it has
no fetch or build step.

## Wallpaper architecture

### `index.html`

A minimal shell: a full-viewport `<canvas id="scene">`, two decorative overlay
layers (`.vignette`, `.scanlines`), dark theme metadata and a `<noscript>`
message. The canvas is `aria-hidden` because the scene is decorative. Styles
are inline and the script is loaded from `main.js`; do not introduce a build
step or remote styles.

### `main.js`

One IIFE, no imports. The structure below describes Cosmos; Black Hole shares
the same invariants (offscreen background, capped FPS/DPR, freeze hook) with
its own disk and halo pipeline, documented in its
[README](wallpapers/blackhole/README.md). Structure, top to bottom:

1. **Constants** — background color, glyph ramps, light direction, target FPS.
2. **`SETTINGS`** — user-facing values mirrored from Wallpaper Engine:
   accent/ice HSL, star density, twinkle, font scale.
3. **Utilities** — `clamp`, `lerp`, value noise, fBm, seeded `mulberry32`,
   Wallpaper Engine color parsing (`"r g b"`, each component 0..1).
4. **`S` state** — canvas geometry, font metrics, offscreen background layer,
   stars, planets, shooting star, start time, pointer, `frozen` flag.
5. **Static background** — nebula and fixed stars rendered once into an
   offscreen canvas, padded by `S.pad` so parallax never reveals an edge.
6. **Twinkling stars** — lightweight per-frame glyphs driven by sine phases.
7. **Planets** — sphere raycast per glyph cell with Lambert shading, fBm
   texture, cached palettes, rings in two passes, moons.
8. **Shooting star** — timer-based event, disabled while `S.frozen` is set.
9. **Layout** — `resize()` recomputes DPR (capped at 1.5), font size, cell
   metrics, offsets and rebuilds all scene data; window resizes are debounced.
10. **Render loop** — `requestAnimationFrame` capped at 30 fps via `FRAME_MS`.
11. **Wallpaper Engine bridge** — `window.wallpaperPropertyListener`.
12. **Freeze hook** — `?freeze=SECONDS` renders one deterministic frame and
    returns before starting the animation loop. This is how preview assets and
    visual regression checks are produced.

### Render order

For each frame: fill background → blit the offscreen nebula with a parallax
offset → draw twinkling stars → draw planets (far ring half, sphere, near ring
half, moon) → draw the shooting star. Keep this order unless the change is
intentional; overlapping layers depend on it.

Black Hole uses a different order: background → lensed stars → halo → disk →
shadow → near half of the disk → photon ring.

### Time and determinism

- Animation time is seconds since `S.start`.
- The shooting star stores `t0` and `dur` in **seconds**, not milliseconds.
- `?freeze=` sets `S.frozen = true` and suppresses the shooting star, because
  it uses `Math.random`. Do not remove this guard or freeze frames stop being
  reproducible.
- Never mix `performance.now()` and scene seconds in animation math.

### Performance model

- 30 fps cap: `FRAME_MS = 1000 / TARGET_FPS` in `tick()`.
- The nebula is rendered once offscreen; only the parallax blit happens per
  frame.
- Planet palettes are cached because `makePalette` builds ten color strings;
  keep it cached and bounded.
- Avoid allocations inside the per-cell loops (`drawSphere`, `drawRing`,
  `drawStars`).
- DPR is clamped to 1.5 to keep 4K fill-rate reasonable.

## Wallpaper Engine integration

`project.json` must stay loadable by Wallpaper Engine. Required/meaningful
fields: `contentrating`, `description`, `file`, `general`,
`general.properties`, `general.supportsaudioprocessing`, `preview`, `tags`,
`title`, `type` (`"web"`), `visibility`.

Properties are declared in `general.properties` and read in
`applyUserProperties`:

| Key | Type | Behavior |
| --- | --- | --- |
| `schemecolor` | color | Wallpaper Engine UI hint; not read by `main.js` |
| `accent` | color | Gas giant base color; applies on the next frame |
| `ice` | color | Ice planet base color; applies on the next frame |
| `stardensity` | slider | Clamps to 0.2–3; rebuilds background and stars |
| `fontscale` | slider | Clamps to 0.7–1.8; calls `resize()` |
| `twinkle` | bool | Freezes star brightness at a fixed value when false |

Wallpaper Engine color values are strings like `"0.95 0.65 0.35"` with
components in 0..1. `parseWeColor` also tolerates arrays. When changing a
default, update **all three**: the `SETTINGS` default in `main.js`, the
`value` in `project.json`, and the settings table in the wallpaper README.
When adding a property, add it to `project.json`, handle it in
`applyUserProperties` (including partial updates), document it, and only then
consider it released.

## Adding a wallpaper

1. Copy `wallpapers/cosmos` to `wallpapers/<kebab-case-name>`.
2. Keep `index.html`, `main.js` (or equivalent assets), `project.json` and
   `preview.jpg` inside the folder. No shared runtime files, no imports from
   outside the folder.
3. Update `project.json`: `title`, `description`, `tags`, `preview`,
   `properties`. Keep `"file": "index.html"` unless the entry point differs.
4. Keep it offline. The check script fails on remote `src`/`href`/`fetch`/
   `@import`.
5. Add a row to the wallpaper table in **every** root `README*.md` and a
   card to the root `index.html` gallery: a preview image and a link to the
   wallpaper folder. The check script fails if the gallery does not mention
   the folder.
6. Write `wallpapers/<name>/README.md` using the Cosmos README as a template:
   settings table, install, browser preview, how it works, files, license.
7. Optionally produce `previews/<name>.gif` (current GIFs are 960×540).
8. Run `npm run check`; then test in Wallpaper Engine and in browsers.
9. Follow the performance and photosensitivity limits below.

## Documentation and translations

The gallery exists in eight files:

| File | Language |
| --- | --- |
| `README.md` | English (canonical) |
| `README.ru.md` | Русский |
| `README.es.md` | Español |
| `README.de.md` | Deutsch |
| `README.fr.md` | Français |
| `README.pt-BR.md` | Português (Brasil) |
| `README.zh-CN.md` | 简体中文 |
| `README.ja.md` | 日本語 |

Rules:

- Every factual change (commands, layout, install steps, license, links) must
  land in **all eight** files. Prose translations may lag, but structure and
  facts may not.
- Every README must link to every other translation in the language bar and
  in the footer.
- Every README must list every wallpaper with its preview image and folder
  link.
- Keep badges, the hero GIF, the security link and the copyright line
  consistent across languages.
- `tools/check.mjs` enforces the language links, wallpaper rows, image paths,
  `LICENSE` and `SECURITY.md` presence, and all local links. It does not
  proofread prose.
- The wallpaper's own `README.md` is English-only; there is no translation
  matrix for it.

## Verification

Always report what you actually ran and what you did not.

### Repository checks

```bash
npm run check
node --check wallpapers/cosmos/main.js
node --check wallpapers/blackhole/main.js
node --check tools/check.mjs
node --check tools/serve.mjs
```

`npm run check` should end with:

```
✓ 2 wallpapers, 8 READMEs, all local links resolve.
```

The count changes when a wallpaper or translation is added.

### Browser smoke test

```bash
npm run serve
```

Open `http://localhost:8123/wallpapers/cosmos/` and confirm there are no
console errors and no network requests other than local files.

Open `http://localhost:8123/`, confirm both cards render, click **Live
preview** on one card, then on the other, and press Escape. At most one
iframe may exist at any time and the console must stay clean.

### Visual regression with the freeze hook

For refactors that must not change pixels, compare a deterministic frame
before and after the change **on the same machine** (font availability affects
glyph rendering).

```bash
# macOS/Linux: adjust the browser path as needed
chrome --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1600,900 --virtual-time-budget=3000 \
  --screenshot=/tmp/ascii-before.png \
  "http://localhost:8123/wallpapers/cosmos/index.html?freeze=1.5"

shasum -a 256 /tmp/ascii-before.png
```

```powershell
# Windows PowerShell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new `
  --disable-gpu --hide-scrollbars --window-size=1600,900 `
  --virtual-time-budget=3000 --screenshot="$env:TEMP\ascii-before.png" `
  "http://localhost:8123/wallpapers/cosmos/index.html?freeze=1.5"

certutil -hashfile "$env:TEMP\ascii-before.png" SHA256
```

Identical hashes are expected for pure refactors. Intentional visual changes
need human/visual review instead of hash equality. Do not commit screenshots.

### Wallpaper Engine property smoke test

With the page open, run this in DevTools:

```js
window.wallpaperPropertyListener.applyUserProperties({
  accent: { value: '0 1 0' },
  ice: { value: '1 0 1' },
  stardensity: { value: 2 },
  fontscale: { value: 1.2 },
  twinkle: { value: false },
});
```

No exception should be thrown; the scene should recolor and rebuild. Then test
the same settings through the Wallpaper Engine properties panel. Do not leave
temporary test HTML files in the repository.

### Size and format limits

- `preview.jpg`: 16:9, 1920×1080, JPEG, under 1 MB.
- `previews/<name>.gif`: optional; current example is 960×540.
- Wallpaper must look correct at 16:9, 21:9 and 4:3 window sizes.
- No flashing faster than 3 Hz (photosensitivity).

## Coding conventions

- UTF-8, LF, two-space indentation; see `.editorconfig` and `.gitattributes`.
- Vanilla JavaScript only: `const`/`let`, single quotes, semicolons, trailing
  commas in multiline literals.
- Keep `main.js` a single dependency-free file per wallpaper. Shared code may
  be copied when a second wallpaper exists; do not add a build system for it
  without discussing the trade-off first.
- Comments explain **why** (ordering, determinism, performance), not what the
  next line obviously does.
- Prefer small pure helpers (`clamp`, `fbm`, `parseWeColor`) and explicit
  constants over magic numbers.
- Validate and clamp every value coming from Wallpaper Engine; never trust
  property types.
- Avoid `innerHTML`, `eval`, `new Function` and string-built HTML.
- Keep the canvas accessible: decorative content is `aria-hidden`, meaningful
  fallbacks go in `<noscript>`.
- Do not add analytics, telemetry, cookies, storage or network calls.

## Git and workspace hygiene

- Do not commit unless the user asks.
- Keep changes scoped to the request; do not reformat unrelated files.
- Never commit `superpowers` working directories; they are already ignored.
- Do not commit screenshots, `_gifframes/`, `.claude/`, editor folders or
  temporary test pages; see `.gitignore`.
- Do not regenerate `preview.jpg` or `previews/*.gif` unless the change is
  intended and the assets are verified.

## Common pitfalls

- Regenerating palettes per frame — use `makePalette`'s cache.
- Removing the `S.frozen` guard — freeze frames become non-deterministic.
- Mixing milliseconds and seconds in shooting-star timing.
- Changing Wallpaper Engine property keys or defaults without updating
  `project.json` and the wallpaper README.
- Editing only `README.md` — the check script requires all eight translations
  to stay in sync.
- Adding a remote font/CDN "just for testing" — the check script rejects it.
- Screenshot comparisons across different machines — font rasterization
  differs; compare on one machine.
- Forgetting `--virtual-time-budget` in headless Chrome — the page may be
  captured before the first frame.

## Security

Wallpapers are static and offline, but treat them as untrusted input surfaces:
clamp property values, never build HTML from them, never fetch remote code.
For vulnerability reports follow [`SECURITY.md`](SECURITY.md) and report
privately — never include exploit details in a public issue.
