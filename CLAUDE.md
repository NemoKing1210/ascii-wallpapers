# CLAUDE.md

Project instructions for Claude Code. The shared agent guide is imported below
and is the source of truth for architecture, invariants, documentation and
verification. Read it before making changes.

@AGENTS.md

## Operating rules

- Inspect the relevant files before editing; do not guess at code you have not
  read.
- For rendering, timing, Wallpaper Engine properties or changes spanning
  multiple files, outline a short plan first, then implement.
- Preserve the hard invariants: no build step, no runtime dependencies, no
  external requests, self-contained wallpaper folders, stable property keys.
- Prefer targeted edits over rewrites. Do not reformat unrelated code.
- Do not commit, push or open pull requests unless the user asks.
- Never add packages. Node tooling must stay dependency-free.
- Do not add generated screenshots, test pages or caches to the repository;
  write them under the OS temp directory and clean up.
- Report what you actually ran, including failures. Never claim a check passed
  without seeing its output.

## Fast reference

| Task | Command |
| --- | --- |
| Serve wallpapers locally | `npm run serve` → <http://localhost:8123/wallpapers/cosmos/> |
| Validate repo, docs and links | `npm run check` |
| Syntax-check the renderer | `node --check wallpapers/cosmos/main.js` |
| Deterministic frame | `.../index.html?freeze=1.5` |
| CI equivalent | `npm run check` on Node 20 |

There is nothing to install; Node.js 18+ is enough.

## Where to change what

- **Colors, star density, glyph size, twinkle** — `SETTINGS` defaults in
  `wallpapers/cosmos/main.js`, matching `value` entries in `project.json`, and
  the settings table in `wallpapers/cosmos/README.md`.
- **New Wallpaper Engine property** — `general.properties` in `project.json`,
  `applyUserProperties` in `main.js` (handle partial updates and clamp), the
  wallpaper README, then verify through the DevTools smoke test.
- **New scene element** — add it to the correct place in the render order in
  `main.js`, keep per-frame allocation out of the cell loops, and measure the
  effect on frame time.
- **Layout or font metrics** — `resize()` in `main.js`; DPR is capped at 1.5,
  cell sizes derive from `fontPx`, and window resize is debounced.
- **Timing** — work in seconds; keep `S.frozen` suppressing `Math.random`
  events so `?freeze=` stays deterministic.
- **Page metadata, overlays, fallback** — `wallpapers/cosmos/index.html`; keep
  CSS inline and the canvas decorative (`aria-hidden`).
- **Validation rules** — `tools/check.mjs`; keep it dependency-free, fast and
  free of false positives.
- **Preview server** — `tools/serve.mjs`; keep path traversal protection and
  the no-store/nosniff headers.

## Documentation workflow

- `README.md` is canonical. A factual change (commands, layout, install,
  license, links) must be mirrored in all eight `README*.md` files,
  including the language bar and footer.
- Every README must keep a gallery row for every wallpaper: preview image plus
  a link to the wallpaper folder.
- Keep `CONTRIBUTING.md` and `SECURITY.md` accurate; they have English and
  Russian sections.
- Code, comments and the canonical docs are written in English. Russian prose
  lives in `README.ru.md` and the Russian sections of `CONTRIBUTING.md` and
  `SECURITY.md`.
- Run `npm run check` after any documentation edit. It catches broken local
  links, missing translations and stale wallpaper rows, but not prose quality.

## Verification protocol

1. Run `npm run check` and keep the output.
2. Run `node --check` on every JavaScript file you changed.
3. If rendering behavior changed, capture a `?freeze=1.5` frame before and
   after **on the same machine** and compare SHA-256 hashes. Identical hashes
   are required for pure refactors; intentional visual changes need visual
   review and must be described.
4. If a property, layout or scene path changed, run the DevTools property smoke
   test described in [`AGENTS.md`](AGENTS.md#verification) and check the
   browser console for errors.
5. Test the served page at 16:9; check 21:9 and 4:3 when layout is touched.
6. Wallpaper Engine itself may not be available. If you cannot run it, say so
   explicitly and list what a human should verify.

## Guardrails

- Do not rename `project.json` property keys: it resets users' saved settings.
- Do not remove or bypass `S.frozen`, the FPS cap, the DPR cap or palette
  caching without a measured reason.
- Do not add CDN links, webfonts, remote images/audio, analytics or storage.
- Do not introduce `innerHTML`, `eval`, `new Function` or HTML assembled from
  property values.
- Do not edit `preview.jpg` or `previews/*.gif` unless the task explicitly asks
  for new preview assets; they are reviewed artifacts.
- Do not duplicate license text inside wallpaper folders; the root
  [`LICENSE`](LICENSE) covers the repository.
- Do not commit `superpowers` folders, `.claude/`, screenshots or temporary
  harness files.

## Definition of done

- [ ] `npm run check` passes.
- [ ] `node --check` passes for changed JavaScript.
- [ ] Freeze-frame comparison or visual review is recorded.
- [ ] Property/layout changes were smoke-tested; console is clean.
- [ ] Every factual doc change exists in all eight READMEs.
- [ ] No dependencies, build step or remote requests were added.
- [ ] Temporary files were removed and no commit was made unless requested.
