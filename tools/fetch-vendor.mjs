#!/usr/bin/env node
// Offline-friendly dependency fetcher: downloads runtime packages from unpkg
// (file-by-file via the ?meta API) into apps/web/node_modules, plus the
// standalone esbuild binary. Used when the npm registry is unreachable.
import { mkdir, writeFile, chmod } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const NM = join(ROOT, 'apps/web/node_modules');
const BIN = join(ROOT, 'tools/bin');

const PKGS = [
  ['react', '18.3.1'],
  ['react-dom', '18.3.1'],
  ['scheduler', '0.23.2'],
  ['react-router-dom', '6.26.2'],
  ['react-router', '6.26.2'],
  ['@remix-run/router', '1.19.2'],
  ['zustand', '4.5.5'],
  ['use-sync-external-store', '1.2.2'],
];

async function fetchOk(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return r;
    } catch {}
    await new Promise((res) => setTimeout(res, 400 * (i + 1)));
  }
  throw new Error('fetch failed: ' + url);
}

async function dlPackage(name, version) {
  const base = `https://unpkg.com/${name}@${version}`;
  const meta = await (await fetchOk(`${base}/?meta`)).json();
  // unpkg returns a flat file list: [{path, size, type: <mime>, integrity}]
  const files = (meta.files || []).map((f) => f.path);
  let done = 0;
  const CONC = 12;
  await Promise.all(Array.from({ length: CONC }, async () => {
    while (files.length) {
      const p = files.pop();
      const dest = join(NM, name, p);
      await mkdir(dirname(dest), { recursive: true });
      const buf = Buffer.from(await (await fetchOk(base + p)).arrayBuffer());
      await writeFile(dest, buf);
      done++;
    }
  }));
  console.log(`✔ ${name}@${version} (${done} files)`);
}

async function dlEsbuild() {
  const v = '0.24.0';
  await mkdir(BIN, { recursive: true });
  const dest = join(BIN, 'esbuild');
  const buf = Buffer.from(await (await fetchOk(`https://unpkg.com/@esbuild/linux-x64@${v}/bin/esbuild`)).arrayBuffer());
  await writeFile(dest, buf);
  await chmod(dest, 0o755);
  console.log(`✔ esbuild ${v} binary (${(buf.length / 1e6).toFixed(1)} MB)`);
}

for (const [n, v] of PKGS) await dlPackage(n, v);
await dlEsbuild();
console.log('DONE');
