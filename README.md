<div align="center">

# ASCII Wallpapers

**Animated wallpapers drawn with ASCII characters — for [Wallpaper Engine](https://www.wallpaperengine.io/) and any browser.**

Every planet, star and nebula is rendered with monospace glyphs on a `<canvas>`.
No images, no video, no network requests: each wallpaper is a self-contained web project.

[![License: MIT](https://img.shields.io/badge/License-MIT-3da639.svg)](LICENSE)
[![Wallpaper Engine](https://img.shields.io/badge/Wallpaper%20Engine-web-1f425f.svg)](https://www.wallpaperengine.io/)
[![No external assets](https://img.shields.io/badge/assets-none-brightgreen.svg)](#features)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-ff69b4.svg)](CONTRIBUTING.md)
[![GitHub](https://img.shields.io/badge/GitHub-NemoKing1210-181717.svg)](https://github.com/NemoKing1210)

[**English**](README.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Português (BR)](README.pt-BR.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md)

<img src="previews/cosmos.gif" width="800" alt="ASCII Cosmos — animated preview">

</div>

## Features

- **Pure ASCII rendering** — planets, rings, stars and nebula dust are built from
  characters, not textures.
- **Offline and self-contained** — everything lives in the wallpaper folder;
  nothing is downloaded at runtime.
- **Tweakable in Wallpaper Engine** — colors, star density, glyph size and
  twinkling via the properties panel.
- **Cheap to run** — animation is capped at 30 fps and costs roughly 4 ms per
  frame at 1600×900.
- **Open source** — MIT licensed; adding a wallpaper takes a single folder.

## Wallpapers

| Preview | Wallpaper | Scene |
| :---: | --- | --- |
| <img src="wallpapers/cosmos/preview.jpg" width="320" alt="ASCII Cosmos preview"> | **[ASCII Cosmos](wallpapers/cosmos)** | A ringed gas giant, an icy planet with a moon, drifting nebula dust, twinkling stars and the occasional shooting star |

## Install in Wallpaper Engine

> Wallpaper Engine runs on Windows.

**Option 1 — import through the editor**

1. Open Wallpaper Engine and click **Create Wallpaper**.
2. In the editor click **Open** and select the wallpaper's `project.json`,
   for example `wallpapers/cosmos/project.json`.
3. The wallpaper appears in your library — right-click it and choose **Apply**.

**Option 2 — copy the folder**

Copy the wallpaper folder into
`steamapps/common/wallpaper_engine/projects/myprojects/` and restart
Wallpaper Engine.

## Preview in a browser

Wallpapers are plain static sites, so any static server works. From the
repository root:

```bash
npm run serve
# or: python -m http.server 8123
```

Then open <http://localhost:8123/wallpapers/cosmos/>.

You can also open `wallpapers/cosmos/index.html` directly — there is no build
step. Add `?freeze=1.5` to render a single deterministic frame.

## Settings and internals

Each wallpaper documents its Wallpaper Engine properties and rendering
technique in its own README — see [ASCII Cosmos](wallpapers/cosmos/README.md).

## Repository layout

```
wallpapers/<name>/   self-contained Wallpaper Engine projects
previews/            animated GIF previews used in the READMEs
tools/               validation and local preview scripts
```

## Add your own wallpaper

See [CONTRIBUTING.md](CONTRIBUTING.md). Wallpapers are plain HTML/JS, so a pull
request only needs a folder, a `project.json` and a preview image.

## License

[MIT](LICENSE) © 2026 [NemoKing1210](https://github.com/NemoKing1210) and the ASCII Wallpapers contributors · [Security policy](SECURITY.md)

---

*Other languages: [English](README.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Português (BR)](README.pt-BR.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md)*
