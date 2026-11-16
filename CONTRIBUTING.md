# Contributing

Thanks for helping make ASCII Wallpapers better! Wallpapers are plain
HTML/JS/CSS, so changes stay small and easy to review.

> If you are an AI coding agent, read [`AGENTS.md`](AGENTS.md) first.

## Adding a wallpaper

1. Copy `wallpapers/cosmos` to `wallpapers/<kebab-case-name>`.
2. Keep the folder self-contained: `index.html`, its assets, `project.json`
   and `preview.jpg`. Wallpaper Engine must be able to open it on its own.
3. Update `project.json` — `title`, `description`, `tags`, `preview` and
   `properties`.
4. Work offline: no external requests, webfonts, CDNs or remote audio.
5. Add a row for the wallpaper to the gallery table in every README
   (`README*.md`). If you cannot translate, update `README.md` and mention it
   in the pull request — translations can follow separately.
6. Document the settings and rendering approach in the wallpaper's own
   `README.md`; use `wallpapers/cosmos/README.md` as a template.
7. Optionally render an animated GIF into `previews/<name>.gif`.
8. Run `npm run check`, then test in Wallpaper Engine and in a browser.

## Requirements

- Canvas-based rendering with monospace glyphs; any ASCII style is welcome.
- 30–60 fps, under ~8 ms of script time per frame at 1080p.
- No flashing content faster than 3 Hz (photosensitivity).
- `preview.jpg`: 16:9, 1920×1080, under 1 MB.
- `project.json` stays loadable by Wallpaper Engine.
- Works in current Chrome, Edge, Firefox and Safari with the 2D canvas API;
  WebGL is not required.

## `project.json` skeleton

```json
{
  "contentrating": "Everyone",
  "description": "What the wallpaper shows.",
  "file": "index.html",
  "general": {
    "properties": {
      "schemecolor": {
        "order": 0,
        "text": "ui_browse_properties_scheme_color",
        "type": "color",
        "value": "0.05 0.08 0.18"
      }
    },
    "supportsaudioprocessing": false
  },
  "preview": "preview.jpg",
  "tags": ["Space"],
  "title": "Wallpaper name",
  "type": "web",
  "visibility": "private"
}
```

## README translations

| File | Language |
| --- | --- |
| `README.md` | English |
| `README.ru.md` | Русский |
| `README.es.md` | Español |
| `README.de.md` | Deutsch |
| `README.fr.md` | Français |
| `README.pt-BR.md` | Português (Brasil) |
| `README.zh-CN.md` | 简体中文 |
| `README.ja.md` | 日本語 |

Keep the language bar, the wallpaper tables and the footer aligned with
`README.md`. The check script verifies that every translation links to every
other translation and lists every wallpaper; prose can be updated separately.

## Automated checks

```bash
npm run check        # or: node tools/check.mjs
```

Requires Node.js 18 or newer; there are no dependencies to install. The script
validates:

- required files and `project.json` fields for every wallpaper;
- `preview.jpg` is a JPEG under 1 MB;
- no external URLs in wallpaper assets;
- every README links to every translation and lists every wallpaper;
- all local Markdown, image and HTML links resolve.

CI runs the same check on every push and pull request.

## Security

Please report vulnerabilities privately — see [SECURITY.md](SECURITY.md).
Never include exploit details in a public issue. The maintainer is
[@NemoKing1210](https://github.com/NemoKing1210).

## Local preview

```bash
npm run serve        # http://localhost:8123/wallpapers/cosmos/
```

Any static server works too, for example `python -m http.server 8123`.

## Testing checklist

- [ ] `npm run check` passes.
- [ ] Opens and applies in Wallpaper Engine.
- [ ] Looks right in 16:9, 21:9 and 4:3 windows.
- [ ] Every setting in the properties panel changes the scene.
- [ ] No console errors and no network requests.
- [ ] Frame time stays within budget.
- [ ] README tables updated in every translation.

By contributing you agree that your changes are released under the
[MIT license](LICENSE).

## По-русски

Спасибо, что помогаете проекту! Обои — это обычные HTML/JS/CSS, поэтому
изменения получаются небольшими и их легко проверять.

> Если вы AI-агент, начните с [`AGENTS.md`](AGENTS.md).

1. Скопируйте `wallpapers/cosmos` в `wallpapers/<имя-через-дефисы>`.
2. Папка должна быть самодостаточной: `index.html`, ресурсы, `project.json`,
   `preview.jpg`.
3. Обновите `project.json` (название, описание, теги, превью, свойства).
4. Никаких внешних запросов, шрифтов и аудио из сети.
5. Добавьте строку в таблицу обоев во всех README (`README*.md`). Если перевод
   сделать не получается, обновите `README.md` и укажите это в pull request.
6. Опишите настройки и принцип рендеринга в README самих обоев — за образец
   можно взять `wallpapers/cosmos/README.md`.
7. Запустите `npm run check`, проверьте в Wallpaper Engine и в браузере, затем
   создавайте pull request.

Требования: 30–60 fps, до ~8 мс на кадр при 1080p, превью 1920×1080 (16:9) до
1 МБ, без частого мигания (не чаще 3 Гц). Достаточно 2D canvas — WebGL не нужен.

Локальный просмотр: `npm run serve` (или любой статический сервер). Проверка
репозитория: `npm run check` — нужен Node.js 18 или новее, зависимостей
устанавливать не требуется. Та же проверка запускается в CI.

О проблемах безопасности сообщайте приватно — см. [SECURITY.md](SECURITY.md);
не публикуйте детали эксплойта в открытых issue. Проект поддерживает
[@NemoKing1210](https://github.com/NemoKing1210).
