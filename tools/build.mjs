#!/usr/bin/env node
// No-registry build pipeline: standalone Tailwind CLI + standalone esbuild.
// Usage: node tools/build.mjs [local|demo]
//   local → apps/web/dist       (multi-file, local assets, for self-hosting/preview)
//   demo  → apps/web/dist-demo  (single self-contained index.html, published asset URLs)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const WEB = join(ROOT, 'apps/web');
const TW = join(ROOT, 'tools/bin/tailwindcss');
const ESBUILD = join(ROOT, 'tools/bin/esbuild');

const mode = process.argv[2] || 'local';
const OUT = join(WEB, mode === 'demo' ? 'dist-demo' : 'dist');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

console.log(`[1/3] tailwind css (${mode})…`);
execFileSync(TW, ['-c', 'tailwind.config.cjs', '-i', 'src/styles.css', '-o', join(OUT, 'app.css'), '--minify'], { cwd: WEB, stdio: 'inherit' });

console.log('[2/3] esbuild bundle…');
execFileSync(ESBUILD, [
  'src/main.jsx', '--bundle', '--minify', '--keep-names', '--target=es2018',
  '--jsx=automatic', '--loader:.jsx=jsx', '--loader:.css=empty',
  `--outfile=${join(OUT, 'app.js')}`,
  '--define:process.env.NODE_ENV="production"',
  `--define:import.meta.env.VITE_PUBLISHED=${mode === 'demo' ? '"1"' : '"0"'}`,
  // Pass VITE_API_URL through so the offline pipeline can build a server-connected frontend:
  //   VITE_API_URL=https://app.example.com node tools/build.mjs local
  `--define:import.meta.env.VITE_API_URL=${process.env.VITE_API_URL ? JSON.stringify(process.env.VITE_API_URL) : 'undefined'}`,
  '--log-level=warning',
], { cwd: WEB, stdio: 'inherit' });

console.log('[3/3] html…');
const FAVICON = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎓</text></svg>';
const HEAD = `<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"/>
<meta name="google" content="notranslate"/>
<title>AI English Teacher</title>
<link rel="icon" href="${FAVICON}"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400&display=swap" rel="stylesheet"/>
<link rel="manifest" href="manifest.webmanifest"/>
<meta name="theme-color" content="#7c3aed"/>
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-status-bar-style" content="default"/>
<meta name="apple-mobile-web-app-title" content="AI English Teacher"/>`;

if (mode === 'demo') {
  const css = readFileSync(join(OUT, 'app.css'), 'utf8');
  const js = readFileSync(join(OUT, 'app.js'), 'utf8').replace(/<\/script/gi, '<\\/script');
  const html = `<!doctype html>
<html lang="ru" translate="no" class="notranslate"><head>${HEAD}
<style>${css}</style>
</head><body><div id="root"></div>
<script type="module">${js}</script>
</body></html>`;
  writeFileSync(join(OUT, 'index.html'), html);
  rmSync(join(OUT, 'app.css')); rmSync(join(OUT, 'app.js'));
  console.log(`✔ dist-demo/index.html (${(html.length / 1e6).toFixed(2)} MB, self-contained)`);
} else {
  const html = `<!doctype html>
<html lang="ru" translate="no" class="notranslate"><head>${HEAD}
<link rel="stylesheet" href="./app.css"/>
</head><body><div id="root"></div>
<script type="module" src="./app.js"></script>
</body></html>`;
  writeFileSync(join(OUT, 'index.html'), html);
  cpSync(join(WEB, 'public/assets'), join(OUT, 'assets'), { recursive: true });
  console.log('✔ dist/ (index.html + app.css + app.js + assets/)');
}

// PWA: ship manifest + service worker + icons in both modes.
try {
  cpSync(join(WEB, 'public/icons'), join(OUT, 'icons'), { recursive: true });
  cpSync(join(WEB, 'public/manifest.webmanifest'), join(OUT, 'manifest.webmanifest'));
  cpSync(join(WEB, 'public/sw.js'), join(OUT, 'sw.js'));
  console.log('✔ PWA: manifest.webmanifest + sw.js + icons/');
} catch (err) {
  console.warn('PWA assets copy skipped:', err.message);
}
