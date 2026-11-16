# ASCII Cosmos

[← All wallpapers](../../README.md)

An animated ASCII-art space wallpaper for
[Wallpaper Engine](https://www.wallpaperengine.io/) and the browser: a ringed
gas giant, an icy planet with a moon, wisps of nebula dust, twinkling stars and
the occasional shooting star — all drawn with monospace glyphs on a single
`<canvas>`.

![ASCII Cosmos](../../previews/cosmos.gif)

## Settings

| Property | Default | Description |
| --- | --- | --- |
| Gas giant color | `0.95 0.65 0.35` (`#F2A659`) | Base color of the ringed planet and its bands |
| Ice planet color | `0.35 0.78 0.80` (`#59C7CC`) | Base color of the smaller planet and its moon glow |
| Star density | `1.0` | Star count multiplier, 0.2–3.0 |
| Glyph size | `1.0` | Character scale, 0.7–1.8 |
| Twinkling stars | `true` | Animate star brightness |

Wallpaper Engine exposes these in the properties panel; changes apply live.

## Install

1. Open Wallpaper Engine → **Create Wallpaper**.
2. Click **Open** and pick this folder's `project.json`.
3. Apply the wallpaper from your library.

See the [main README](../../README.md#install-in-wallpaper-engine) for the
folder-copy method and other wallpapers.

## Preview in a browser

The folder is a plain static site, so any static server works. From the
repository root:

```bash
npm run serve
# or: python -m http.server 8123
```

Then open <http://localhost:8123/wallpapers/cosmos/>. Add `?freeze=1.5` to
render one deterministic frame (this is how the preview GIF is built).

## How it works

- **Background** — the nebula and distant stars are rendered once into an
  offscreen canvas, then blitted every frame with a parallax offset.
- **Planets** — each glyph cell is raycast against a sphere and shaded with a
  Lambert term. The gas giant gets latitude bands warped by fBm noise; the
  rocky planet gets maria, craters and polar caps. A thin halo marks the lit
  limb.
- **Rings** — four elliptical bands drawn in two passes, so the near half
  crosses in front of the planet.
- **Stars** — deterministic twinkle phases driven by sine waves; a shooting
  star spawns every 8–18 seconds.
- **Performance** — animation is capped at 30 fps and costs roughly 4 ms per
  frame at 1600×900.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page shell, canvas and screen overlays |
| `main.js` | Renderer and Wallpaper Engine integration |
| `project.json` | Wallpaper Engine metadata and user properties |
| `preview.jpg` | 1920×1080 preview shown in the Wallpaper Engine browser |

## License

MIT — see [LICENSE](../../LICENSE). Maintained by
[NemoKing1210](https://github.com/NemoKing1210).
