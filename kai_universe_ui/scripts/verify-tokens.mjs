#!/usr/bin/env node
/*
 * Verifier: every value in src/shared/design-system/tokens/generated.json must
 * match the canonical Infinity DTCG source. Run via `npm run tokens:verify`.
 *
 * generated.json is the JSON twin of generated.ts (both written by
 * scripts/build-tokens.mjs). Reading JSON here keeps this script trivial — no
 * parsing of TypeScript needed. If the codegen has a bug, this verifier catches
 * it because both outputs come from the same data.
 *
 * Coverage:
 *   - Color primitives (every group/key leaf)
 *   - Color semantics (every Role/Layer/Variant leaf)
 *   - Spacing, Corner Radius, Icon Sizes (numeric values)
 *
 * If a mismatch is reported:
 *   - DTCG source (src/shared/design-system/tokens/source/) is authoritative.
 *   - Re-run `npm run tokens:build`. Mismatch persists → codegen bug.
 *   - Never hand-edit DTCG JSONs; they come from Figma.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src/shared/design-system/tokens/source');
const GENERATED = join(ROOT, 'src/shared/design-system/tokens/generated.json');

const camel = (s) => {
  const cleaned = String(s).replace(/[,]/g, '').trim();
  const parts = cleaned.split(/[\s_]+/).filter(Boolean);
  if (parts.length === 0) return '';
  return parts
    .map((p, i) => (i === 0 ? p[0].toLowerCase() + p.slice(1) : p[0].toUpperCase() + p.slice(1)))
    .join('');
};

function* walk(obj, path = []) {
  if (!obj || typeof obj !== 'object') return;
  if ('$type' in obj && '$value' in obj) {
    yield [path, obj];
    return;
  }
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;
    yield* walk(val, [...path, key]);
  }
}

function loadDtcg(name) {
  return JSON.parse(readFileSync(join(SRC, name, 'Mode 1.tokens.json'), 'utf8'));
}

function normalize(s) {
  // Hex codes uppercased, rgba() lowercased — matches what build-tokens emits.
  if (s == null) return null;
  const t = String(s).trim();
  if (t.startsWith('#')) return t.toUpperCase();
  return t.toLowerCase();
}

function colorValueToString(leaf) {
  const v = leaf.$value;
  if (typeof v === 'string') return normalize(v);
  const a = v.alpha ?? 1;
  if (a < 1 && Array.isArray(v.components)) {
    const [r, g, b] = v.components.map((c) => Math.round(c * 255));
    return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(3))})`;
  }
  return normalize(v.hex || '#000000');
}

function pad(s, n) { return String(s).padEnd(n); }

function comparePrimitives(dtcg, gen) {
  const rows = [];
  for (const [path, leaf] of walk(dtcg)) {
    if (leaf.$type !== 'color') continue;
    const [group, key] = path.length === 2 ? path : [path.slice(0, -1).join(' '), path.at(-1)];
    const expected = colorValueToString(leaf);
    const actual = gen[group]?.[key];
    rows.push({
      label: 'Primitives',
      path: `${group}/${key}`,
      expected,
      actual: actual ? normalize(actual) : '—',
      ok: actual != null && normalize(actual) === expected,
    });
  }
  return rows;
}

function compareSemantics(dtcg, gen) {
  const rows = [];
  for (const [path, leaf] of walk(dtcg)) {
    if (leaf.$type !== 'color') continue;
    if (path.length < 3) continue;
    const role = camel(path[0]);
    const layer = camel(path[1]);
    const variant = camel(path[2]);
    const expected = colorValueToString(leaf);
    const actual = gen?.[role]?.[layer]?.[variant];
    rows.push({
      label: 'Semantics',
      path: `${path[0]}/${path[1]}/${path[2]}`,
      expected,
      actual: actual ? normalize(actual) : '—',
      ok: actual != null && normalize(actual) === expected,
    });
  }
  return rows;
}

function compareNumbers(label, dtcg, gen) {
  const rows = [];
  for (const [path, leaf] of walk(dtcg)) {
    if (leaf.$type !== 'number') continue;
    const key = path.join('-').toLowerCase();
    const actual = gen?.[key];
    rows.push({
      label,
      path: path.join('/'),
      expected: String(leaf.$value),
      actual: actual != null ? String(actual) : '—',
      ok: actual === leaf.$value,
    });
  }
  return rows;
}

function main() {
  const generated = JSON.parse(readFileSync(GENERATED, 'utf8'));
  const allRows = [
    ...comparePrimitives(loadDtcg('Color Primitives'), generated.primitives),
    ...compareSemantics(loadDtcg('Color Semantics'), generated.semantics),
    ...compareNumbers('Spacing', loadDtcg('Spacing'), generated.spacing),
    ...compareNumbers('Corner Radius', loadDtcg('Corner Radius'), generated.radius),
    ...compareNumbers('Icon Sizes', loadDtcg('Icon Sizes'), generated.iconSize),
  ];

  const byLabel = {};
  for (const r of allRows) {
    if (!byLabel[r.label]) byLabel[r.label] = { ok: 0, fail: 0, fails: [] };
    if (r.ok) byLabel[r.label].ok++;
    else { byLabel[r.label].fail++; byLabel[r.label].fails.push(r); }
  }

  console.log('\nCATEGORY                 OK     FAIL');
  console.log('─'.repeat(45));
  let totalFail = 0;
  for (const [label, { ok, fail }] of Object.entries(byLabel)) {
    console.log(`${pad(label, 25)} ${pad(ok, 6)} ${fail}`);
    totalFail += fail;
  }
  console.log('─'.repeat(45));

  if (totalFail > 0) {
    console.error(`\n[verify-tokens] ${totalFail} mismatch(es). Failing rows:\n`);
    for (const { fails } of Object.values(byLabel)) {
      for (const r of fails.slice(0, 25)) {
        console.error(`  ${pad(r.label, 12)} ${pad(r.path, 50)} expected=${pad(r.expected, 14)} actual=${r.actual}`);
      }
    }
    console.error('\nFix: re-run `npm run tokens:build`. If still failing, the codegen has a bug.');
    process.exit(1);
  }
  console.log(`\n[verify-tokens] ${allRows.length}/${allRows.length} tokens match Infinity DTCG source. ✓`);
}

main();
