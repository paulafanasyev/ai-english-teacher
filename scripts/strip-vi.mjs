#!/usr/bin/env node
// One-off cleanup: removes every "vi" key from the generated content packs.
// Run from the repository root:  node scripts/strip-vi.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const FILES = [
  'apps/web/src/data/generated/vocabulary.json',
  'apps/web/src/data/generated/grammar.json',
  'apps/web/src/data/generated/listening.json',
  'apps/web/src/data/generated/story/quest.json',
  'apps/web/src/data/generated/story/scenarios.json',
  'apps/web/src/data/generated/story/phrases.json',
];

function strip(value) {
  if (Array.isArray(value)) return value.map(strip);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) if (key !== 'vi') out[key] = strip(item);
    return out;
  }
  return value;
}

for (const file of FILES) {
  const before = readFileSync(file, 'utf8');
  const after = `${JSON.stringify(strip(JSON.parse(before)), null, 2)}\n`;
  writeFileSync(file, after);
  console.log(`${file}: ${before.length} -> ${after.length} bytes`);
}
