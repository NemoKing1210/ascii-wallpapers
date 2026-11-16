# Security Policy

ASCII Wallpapers is a collection of static, offline web wallpapers. There is
no backend, no user data and no third-party JavaScript, but we still take
security reports seriously. The project is maintained by
[@NemoKing1210](https://github.com/NemoKing1210).

## Supported versions

Only the latest commit on the `main` branch is supported. Wallpapers copied
into Wallpaper Engine are supported as shipped in this repository.

## Reporting a vulnerability

Please **do not open a public issue** for a security problem.

1. Open the repository's **Security** tab and choose **Report a
   vulnerability** (GitHub private vulnerability reporting).
2. If private reporting is unavailable, open a minimal public issue and
   mention **@NemoKing1210** to ask for a private channel — without exploit
   details.

Please include:

- the affected wallpaper, file and commit;
- steps to reproduce, plus your browser and, if relevant, Wallpaper Engine
  version;
- the impact you expect and any suggested fix.

We aim to acknowledge reports within 7 days and will keep you updated while a
fix is prepared. Please allow reasonable time for a fix before public
disclosure.

## Scope

In scope:

- cross-site scripting or HTML injection through wallpaper code or
  `project.json` properties;
- path traversal or arbitrary file reads in `tools/serve.mjs`;
- unexpected network requests or remote code loading from a wallpaper;
- dependency or CI supply-chain issues.

Out of scope:

- vulnerabilities in Wallpaper Engine, browsers or operating systems;
- issues that require modifying local files or running untrusted code;
- high CPU load on your own machine while a wallpaper renders;
- social engineering and missing hardening headers on the local preview
  server.

## На русском

ASCII Wallpapers — статические офлайн-обои без сервера, пользовательских данных
и стороннего JavaScript, но сообщения о проблемах безопасности всё равно важны.
Проект поддерживает [@NemoKing1210](https://github.com/NemoKing1210).

**Не открывайте публичный issue** с деталями уязвимости. Используйте вкладку
**Security** → **Report a vulnerability** в репозитории (приватное оповещение
GitHub). Если приватный канал недоступен, создайте короткий issue и упомяните
**@NemoKing1210**, чтобы запросить приватную связь — без деталей эксплойта.

Укажите затронутые обои, файл и коммит, шаги воспроизведения, браузер и версию
Wallpaper Engine, ожидаемое влияние и возможное исправление. Мы постараемся
подтвердить получение в течение 7 дней и будем держать вас в курсе, пока
готовится исправление. Пожалуйста, дайте разумное время на выпуск исправления
до публичного раскрытия.

В области действия: XSS/HTML-инъекции через код обоев или свойства
`project.json`, выход за пределы каталога в `tools/serve.mjs`, неожиданные
сетевые запросы или загрузка удалённого кода, проблемы цепочки поставок и CI.

Вне области: уязвимости Wallpaper Engine, браузеров и ОС; проблемы, требующие
локального изменения файлов или запуска недоверенного кода; высокая нагрузка
на вашу машину при рендеринге обоев; социальная инженерия и отсутствие
заголовков безопасности у локального сервера предпросмотра.
