<div align="center">

# ASCII Wallpapers

**Animierte Wallpaper aus ASCII-Zeichen — für [Wallpaper Engine](https://www.wallpaperengine.io/) und jeden Browser.**

Jeder Planet, Stern und Nebel wird mit Monospace-Glyphen auf einem `<canvas>` gezeichnet.
Keine Bilder, keine Videos, keine Netzwerkanfragen: Jedes Wallpaper ist ein eigenständiges Webprojekt.

[![Lizenz: MIT](https://img.shields.io/badge/License-MIT-3da639.svg)](LICENSE)
[![Wallpaper Engine](https://img.shields.io/badge/Wallpaper%20Engine-web-1f425f.svg)](https://www.wallpaperengine.io/)
[![Keine externen Assets](https://img.shields.io/badge/assets-none-brightgreen.svg)](#funktionen)
[![PRs willkommen](https://img.shields.io/badge/PRs-welcome-ff69b4.svg)](CONTRIBUTING.md)
[![GitHub](https://img.shields.io/badge/GitHub-NemoKing1210-181717.svg)](https://github.com/NemoKing1210)

[English](README.md) · [Русский](README.ru.md) · [Español](README.es.md) · [**Deutsch**](README.de.md) · [Français](README.fr.md) · [Português (BR)](README.pt-BR.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md)

<img src="previews/cosmos.gif" width="800" alt="ASCII Cosmos — animierte Vorschau">

</div>

## Funktionen

- **Reines ASCII-Rendering** — Planeten, Ringe, Sterne und Nebelstaub entstehen
  aus Zeichen statt aus Texturen.
- **Offline und eigenständig** — alles liegt im Wallpaper-Ordner; zur Laufzeit
  wird nichts nachgeladen.
- **In Wallpaper Engine einstellbar** — Farben, Sterndichte, Glyphengöße und
  Funkeln über das Eigenschaften-Panel.
- **Genügsam** — die Animation ist auf 30 fps begrenzt und kostet bei 1600×900
  etwa 4 ms pro Frame.
- **Open Source** — MIT-Lizenz; ein neues Wallpaper ist ein einziger Ordner.

## Wallpaper

| Vorschau | Wallpaper | Szene |
| :---: | --- | --- |
| <img src="wallpapers/cosmos/preview.jpg" width="320" alt="ASCII-Cosmos-Vorschau"> | **[ASCII Cosmos](wallpapers/cosmos)** | Ein geringelter Gasriese, ein Eisplanet mit Mond, treibender Nebelstaub, funkelnde Sterne und gelegentlich eine Sternschnuppe |

## Installation in Wallpaper Engine

> Wallpaper Engine läuft unter Windows.

**Variante 1 — Import über den Editor**

1. Öffne Wallpaper Engine und klicke auf **Create Wallpaper**.
2. Klicke im Editor auf **Open** und wähle die `project.json` des Wallpapers,
   zum Beispiel `wallpapers/cosmos/project.json`.
3. Das Wallpaper erscheint in deiner Bibliothek — Rechtsklick und **Apply**
   wählen.

**Variante 2 — Ordner kopieren**

Kopiere den Wallpaper-Ordner nach
`steamapps/common/wallpaper_engine/projects/myprojects/` und starte
Wallpaper Engine neu.

## Vorschau im Browser

Wallpaper sind einfache statische Seiten, daher genügt jeder Static-Server. Im
Wurzelverzeichnis des Repositories:

```bash
npm run serve
# oder: python -m http.server 8123
```

Danach <http://localhost:8123/wallpapers/cosmos/> öffnen.

Du kannst `wallpapers/cosmos/index.html` auch direkt öffnen — ein Build-Schritt
ist nicht nötig. Mit `?freeze=1.5` wird ein einzelnes deterministisches Frame
gerendert.

## Einstellungen und Interna

Jedes Wallpaper dokumentiert seine Wallpaper-Engine-Eigenschaften und seine
Rendering-Technik in einer eigenen README — siehe
[ASCII Cosmos](wallpapers/cosmos/README.md).

## Repository-Struktur

```
wallpapers/<name>/   eigenständige Wallpaper-Engine-Projekte
previews/            animierte GIF-Vorschauen für die READMEs
tools/               Prüf- und lokale Vorschau-Skripte
```

## Eigenes Wallpaper hinzufügen

Siehe [CONTRIBUTING.md](CONTRIBUTING.md). Wallpaper sind reines HTML/JS — ein
Pull Request braucht nur einen Ordner, eine `project.json` und ein Vorschaubild.

## Lizenz

[MIT](LICENSE) © 2026 [NemoKing1210](https://github.com/NemoKing1210) und die ASCII-Wallpapers-Mitwirkenden · [Sicherheitsrichtlinie](SECURITY.md)

---

*Andere Sprachen: [English](README.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Português (BR)](README.pt-BR.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md)*
