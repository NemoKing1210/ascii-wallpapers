<div align="center">

# ASCII Wallpapers

**Fonds d'écran animés dessinés avec des caractères ASCII — pour [Wallpaper Engine](https://www.wallpaperengine.io/) et n'importe quel navigateur.**

Chaque planète, étoile et nébuleuse est dessinée avec des glyphes monospace sur un `<canvas>`.
Aucune image, aucune vidéo, aucune requête réseau : chaque fond d'écran est un projet web autonome.

[![Licence : MIT](https://img.shields.io/badge/License-MIT-3da639.svg)](LICENSE)
[![Wallpaper Engine](https://img.shields.io/badge/Wallpaper%20Engine-web-1f425f.svg)](https://www.wallpaperengine.io/)
[![Aucune ressource externe](https://img.shields.io/badge/assets-none-brightgreen.svg)](#fonctionnalités)
[![PR bienvenues](https://img.shields.io/badge/PRs-welcome-ff69b4.svg)](CONTRIBUTING.md)
[![GitHub](https://img.shields.io/badge/GitHub-NemoKing1210-181717.svg)](https://github.com/NemoKing1210)

[English](README.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Deutsch](README.de.md) · [**Français**](README.fr.md) · [Português (BR)](README.pt-BR.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md)

<img src="previews/cosmos.gif" width="800" alt="ASCII Cosmos — aperçu animé">

</div>

## Fonctionnalités

- **Rendu ASCII pur** — planètes, anneaux, étoiles et poussière de nébuleuse sont
  construits à partir de caractères, pas de textures.
- **Hors ligne et autonome** — tout tient dans le dossier du fond d'écran ; rien
  n'est téléchargé à l'exécution.
- **Réglable dans Wallpaper Engine** — couleurs, densité d'étoiles, taille des
  glyphes et scintillement depuis le panneau de propriétés.
- **Léger** — l'animation est plafonnée à 30 fps et coûte environ 4 ms par image
  en 1600×900.
- **Open source** — licence MIT ; ajouter un fond d'écran se résume à un dossier.

## Fonds d'écran

| Aperçu | Fond d'écran | Scène |
| :---: | --- | --- |
| <img src="wallpapers/cosmos/preview.jpg" width="320" alt="Aperçu d'ASCII Cosmos"> | **[ASCII Cosmos](wallpapers/cosmos)** | Une géante gazeuse entourée d'anneaux, une planète glacée et sa lune, de la poussière de nébuleuse en dérive, des étoiles scintillantes et une étoile filante de temps en temps |

## Installation dans Wallpaper Engine

> Wallpaper Engine fonctionne sous Windows.

**Option 1 — importer depuis l'éditeur**

1. Ouvrez Wallpaper Engine et cliquez sur **Create Wallpaper**.
2. Dans l'éditeur, cliquez sur **Open** et choisissez le `project.json` du fond
   d'écran, par exemple `wallpapers/cosmos/project.json`.
3. Le fond d'écran apparaît dans votre bibliothèque : clic droit puis **Apply**.

**Option 2 — copier le dossier**

Copiez le dossier du fond d'écran dans
`steamapps/common/wallpaper_engine/projects/myprojects/` puis redémarrez
Wallpaper Engine.

## Aperçu dans le navigateur

Les fonds d'écran sont de simples sites statiques : n'importe quel serveur
statique fait l'affaire. Depuis la racine du dépôt :

```bash
npm run serve
# ou : python -m http.server 8123
```

Ouvrez ensuite <http://localhost:8123/wallpapers/cosmos/>.

Vous pouvez aussi ouvrir `wallpapers/cosmos/index.html` directement : aucune
étape de build n'est nécessaire. Ajoutez `?freeze=1.5` pour rendre une seule
image déterministe.

## Réglages et détails internes

Chaque fond d'écran documente ses propriétés Wallpaper Engine et sa technique de
rendu dans son propre README — voir [ASCII Cosmos](wallpapers/cosmos/README.md).

## Structure du dépôt

```
wallpapers/<nom>/   projets Wallpaper Engine autonomes
previews/           aperçus GIF animés utilisés dans les README
tools/              scripts de validation et d'aperçu local
```

## Ajouter votre propre fond d'écran

Voir [CONTRIBUTING.md](CONTRIBUTING.md). Les fonds d'écran sont du HTML/JS
simple : une pull request n'a besoin que d'un dossier, d'un `project.json` et
d'une image d'aperçu.

## Licence

[MIT](LICENSE) © 2026 [NemoKing1210](https://github.com/NemoKing1210) et les contributeurs d'ASCII Wallpapers · [Politique de sécurité](SECURITY.md)

---

*Autres langues : [English](README.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [Português (BR)](README.pt-BR.md) · [简体中文](README.zh-CN.md) · [日本語](README.ja.md)*
