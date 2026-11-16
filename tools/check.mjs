#!/usr/bin/env node
// SPDX-License-Identifier: MIT

/**
 * Repository checks for ASCII Wallpapers.
 *
 * Validates every wallpaper project, the README translations and all local
 * links. Dependency-free — run it with `npm run check` or `node tools/check.mjs`.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const fail = (message) => errors.push(message);

const isFile = (path) => existsSync(path) && statSync(path).isFile();
const isDir = (path) => existsSync(path) && statSync(path).isDirectory();

for (const file of ['LICENSE', 'SECURITY.md']) {
  if (!isFile(resolve(root, file))) fail(`missing ${file}`);
}

/* ------------------------------------------------------------------ *
 *  Wallpapers
 * ------------------------------------------------------------------ */

const wallpaperRoot = resolve(root, 'wallpapers');
const wallpapers = isDir(wallpaperRoot)
  ? readdirSync(wallpaperRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
  : [];

if (wallpapers.length === 0) fail('wallpapers/: no wallpaper folders found');

const REQUIRED_FILES = ['index.html', 'project.json', 'preview.jpg'];
const REQUIRED_PROJECT_KEYS = [
  'contentrating',
  'description',
  'file',
  'preview',
  'tags',
  'title',
  'type',
];

/* Every served file must stay offline: no remote styles, scripts or media. */
const EXTERNAL = [
  /\b(?:src|srcset|href|data-src|poster)\s*=\s*["']\s*(?:https?:)?\/\//i,
  /\b(?:fetch|importScripts)\s*\(\s*["'`]\s*(?:https?:)?\/\//i,
  /@import\s+(?:url\()?["']?\s*(?:https?:)?\/\//i,
  /url\(\s*["']?\s*(?:https?:)?\/\//i,
];

for (const name of wallpapers) {
  const dir = resolve(wallpaperRoot, name);

  for (const file of REQUIRED_FILES) {
    if (!isFile(resolve(dir, file))) fail(`wallpapers/${name}: missing ${file}`);
  }

  const projectPath = resolve(dir, 'project.json');
  if (isFile(projectPath)) {
    let project;
    try {
      project = JSON.parse(readFileSync(projectPath, 'utf8'));
    } catch (error) {
      fail(`wallpapers/${name}/project.json: invalid JSON (${error.message})`);
      continue;
    }

    for (const key of REQUIRED_PROJECT_KEYS) {
      if (!(key in project)) {
        fail(`wallpapers/${name}/project.json: missing "${key}"`);
      }
    }

    if (project.type && project.type !== 'web') {
      fail(`wallpapers/${name}/project.json: "type" must be "web"`);
    }
    if (Array.isArray(project.tags) && project.tags.length === 0) {
      fail(`wallpapers/${name}/project.json: "tags" is empty`);
    }
    for (const key of ['file', 'preview']) {
      const value = project[key];
      if (typeof value === 'string' && !isFile(resolve(dir, value))) {
        fail(`wallpapers/${name}/project.json: "${key}" points to missing ${value}`);
      }
    }
  }

  const preview = resolve(dir, 'preview.jpg');
  if (isFile(preview)) {
    const bytes = readFileSync(preview);
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    if (!isJpeg) fail(`wallpapers/${name}/preview.jpg: not a JPEG file`);
    if (bytes.length > 1024 * 1024) {
      fail(`wallpapers/${name}/preview.jpg: larger than 1 MB`);
    }
  }

  for (const file of readdirSync(dir)) {
    if (!['.html', '.css', '.js', '.mjs'].includes(extname(file).toLowerCase())) continue;
    const text = readFileSync(resolve(dir, file), 'utf8');
    if (EXTERNAL.some((pattern) => pattern.test(text))) {
      fail(`wallpapers/${name}/${file}: contains an external URL`);
    }
  }
}

/* ------------------------------------------------------------------ *
 *  Root gallery
 * ------------------------------------------------------------------ */

const galleryPath = resolve(root, 'index.html');
if (!isFile(galleryPath)) {
  fail('missing index.html gallery');
} else {
  const gallery = readFileSync(galleryPath, 'utf8');

  if (EXTERNAL.some((pattern) => pattern.test(gallery))) {
    fail('index.html: contains an external URL');
  }

  /* Every local src/href/data-src target must resolve from the root. */
  for (const match of gallery.matchAll(/\b(?:src|href|data-src)\s*=\s*"([^"]+)"/g)) {
    const link = match[1];
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(link)) continue;

    let path;
    try {
      path = decodeURIComponent(link.split('#')[0].split('?')[0]);
    } catch {
      fail(`index.html: invalid link ${link}`);
      continue;
    }
    if (path && !existsSync(resolve(root, path))) {
      fail(`index.html: broken link ${link}`);
    }
  }

  /* Every wallpaper needs a complete card; stale cards are rejected too. */
  for (const name of wallpapers) {
    for (const expected of [
      `data-wallpaper="${name}"`,
      `src="wallpapers/${name}/preview.jpg"`,
      `data-src="wallpapers/${name}/"`,
      `href="wallpapers/${name}/"`,
      `href="wallpapers/${name}/README.md"`,
    ]) {
      if (!gallery.includes(expected)) {
        fail(`index.html: missing ${expected} for wallpapers/${name}`);
      }
    }
  }

  const listed = new Set(
    [...gallery.matchAll(/data-wallpaper="([^"]+)"/g)].map((match) => match[1]),
  );
  for (const name of listed) {
    if (!wallpapers.includes(name)) {
      fail(`index.html: unknown wallpaper "${name}"`);
    }
  }
}

/* ------------------------------------------------------------------ *
 *  README translations
 * ------------------------------------------------------------------ */

const readmes = readdirSync(root)
  .filter((file) => /^README(\.[^.]+)?\.md$/.test(file))
  .sort();

if (readmes.length === 0) fail('no README files found');

for (const readme of readmes) {
  const text = readFileSync(resolve(root, readme), 'utf8');

  /* Every translation must link to every other translation. */
  for (const other of readmes) {
    if (other !== readme && !text.includes(`](${other})`)) {
      fail(`${readme}: missing language link to ${other}`);
    }
  }

  /* Every wallpaper must appear in the gallery table of every translation. */
  for (const name of wallpapers) {
    if (!text.includes(`](wallpapers/${name})`)) {
      fail(`${readme}: missing gallery link to wallpapers/${name}`);
    }
    if (!text.includes(`src="wallpapers/${name}/preview.jpg"`)) {
      fail(`${readme}: missing preview image for wallpapers/${name}`);
    }
  }
}

/* ------------------------------------------------------------------ *
 *  Local links in Markdown
 * ------------------------------------------------------------------ */

const LINK_PATTERNS = [/\]\(([^)\s]+)\)/g, /(?:src|href)="([^"]+)"/g];

function findMarkdown(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name.startsWith('.') ||
      entry.name === 'node_modules' ||
      entry.name === 'superpowers'
    ) {
      continue;
    }
    const path = join(dir, entry.name);
    if (entry.isDirectory()) findMarkdown(path, found);
    else if (entry.name.endsWith('.md')) found.push(path);
  }
  return found;
}

for (const file of findMarkdown(root)) {
  const text = readFileSync(file, 'utf8');
  for (const pattern of LINK_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const link = match[1];
      if (/^(?:[a-z]+:|\/\/|#)/i.test(link)) continue;

      const path = decodeURIComponent(link.split('#')[0].split('?')[0]);
      if (path && !existsSync(resolve(dirname(file), path))) {
        fail(`${relative(root, file)}: broken link ${link}`);
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 *  Report
 * ------------------------------------------------------------------ */

if (errors.length > 0) {
  console.error(`✗ ${errors.length} problem(s) found:\n`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

const assets = wallpapers.length === 1 ? 'wallpaper' : 'wallpapers';
const docs = readmes.length === 1 ? 'README' : 'READMEs';
console.log(
  `✓ ${wallpapers.length} ${assets}, ${readmes.length} ${docs}, all local links resolve.`,
);
