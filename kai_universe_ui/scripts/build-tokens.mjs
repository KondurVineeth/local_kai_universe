#!/usr/bin/env node
/*
 * Codegen: Infinity DTCG token files → two outputs:
 *   1. src/shared/design-system/tokens/generated.ts — typed token module
 *      that tailwind.config.ts (and any other consumer) imports from.
 *   2. <style id="design-tokens"> block in src/index.html — every token also
 *      emitted as a CSS custom property between the GENERATED-TOKENS-START/END
 *      markers, so any non-Tailwind CSS can use them via var().
 *
 * Source of truth: src/shared/design-system/tokens/source/<Set>/Mode 1.tokens.json
 *
 * Why both outputs:
 *   - generated.ts: Tailwind uses it directly. Hardcoded values, so theme
 *     classes compile to literal hex/px without runtime resolution. Avoids
 *     the :root-resolution issues from the 2026-05-06 rabbit hole.
 *   - inline <style>: any raw CSS / @layer base / future custom CSS can still
 *     reference `var(--color-primary-surface-high)` etc. as a fallback path.
 *
 * Re-run via `npm run tokens:build` whenever the DTCG source files change.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src/shared/design-system/tokens/source');
const HTML_PATH = join(ROOT, 'src/index.html');
const TS_PATH = join(ROOT, 'src/shared/design-system/tokens/generated.ts');
const JSON_PATH = join(ROOT, 'src/shared/design-system/tokens/generated.json');
const START_MARKER = '/* GENERATED-TOKENS-START';
const END_MARKER = '/* GENERATED-TOKENS-END */';

// ─── helpers ─────────────────────────────────────────────────────────────────

const slug = (s) =>
  String(s)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_,]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase();

// camelCase a single segment: "Static Black" → "staticBlack", "2xl" → "2xl"
const camel = (s) => {
  const cleaned = String(s).replace(/[,]/g, '').trim();
  const parts = cleaned.split(/[\s_]+/).filter(Boolean);
  if (parts.length === 0) return '';
  return parts
    .map((p, i) => {
      if (i === 0) return p[0].toLowerCase() + p.slice(1);
      return p[0].toUpperCase() + p.slice(1);
    })
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

function loadSets() {
  const sets = {};
  for (const name of readdirSync(SRC)) {
    const setDir = join(SRC, name);
    if (!statSync(setDir).isDirectory()) continue;
    const file = join(setDir, 'Mode 1.tokens.json');
    sets[name] = JSON.parse(readFileSync(file, 'utf8'));
  }
  return sets;
}

function colorValueToCss(leaf) {
  const v = leaf.$value;
  if (typeof v === 'string') return v.toUpperCase();
  const a = v.alpha ?? 1;
  if (a < 1 && Array.isArray(v.components)) {
    const [r, g, b] = v.components.map((c) => Math.round(c * 255));
    return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(3))})`;
  }
  return (v.hex || '#000000').toUpperCase();
}

// ─── extract structured data from each set ───────────────────────────────────

function buildPrimitives(tree) {
  // { Blue: { '50': '#022554', ... }, Neutral: { '0': '#0A0A0A', ... }, ... }
  const result = {};
  for (const [path, leaf] of walk(tree)) {
    if (leaf.$type !== 'color') continue;
    const [group, key] = path.length === 2 ? path : [path.slice(0, -1).join(' '), path.at(-1)];
    if (!result[group]) result[group] = {};
    result[group][key] = colorValueToCss(leaf);
  }
  return result;
}

function buildSemantics(tree) {
  // Hierarchy is Role → Layer → Variant. Flatten to nested object:
  //   { primary: { surface: { high: '#1D6CD7', ... }, textIcon: { heading: ... } } }
  const result = {};
  for (const [path, leaf] of walk(tree)) {
    if (leaf.$type !== 'color') continue;
    if (path.length < 3) continue;
    const role = camel(path[0]);
    const layer = camel(path[1]);
    const variant = camel(path[2]);
    if (!result[role]) result[role] = {};
    if (!result[role][layer]) result[role][layer] = {};
    result[role][layer][variant] = colorValueToCss(leaf);
  }
  return result;
}

function buildNumbers(tree) {
  // Spacing/Radius/Icon-Sizes — flat key→pixel map.
  const result = {};
  for (const [path, leaf] of walk(tree)) {
    if (leaf.$type !== 'number') continue;
    result[path.join('-').toLowerCase()] = leaf.$value;
  }
  return result;
}

function buildTypographyPrimitives(tree) {
  // { family: { title: 'Geist', body: 'Urbanist' },
  //   weight: { regular: 'Regular', medium: 'Medium', semiBold: 'SemiBold', bold: 'Bold' },
  //   size:   { '1': 10, '2': 12, ..., '11': 42 } }
  const result = { family: {}, weight: {}, size: {} };
  for (const [path, leaf] of walk(tree)) {
    if (path[0] === 'Family') result.family[camel(path[1])] = leaf.$value;
    else if (path[0] === 'Font Weight') result.weight[camel(path[1])] = leaf.$value;
    else if (path[0] === 'Font Size') result.size[path[1]] = leaf.$value;
  }
  return result;
}

// Typography composites — verified against Infinity UI Typography.svg reference
// (Figma "Text styles" panel + Typography poster export). Naming pattern:
//   Heading 01–08: Geist family, 120% line-height, sizes from FontSize/11 → /4
//   Body 01–05:    Urbanist, 140% line-height, sizes from FontSize/5 → /1
//   Caption:       Urbanist, 140% line-height, FontSize/1 (10px)
// Each gets weight variants Regular/Medium/SemiBold/Bold from Typography primitives.
function buildTypographyComposites(typo) {
  const numericWeight = (name) => ({ Regular: 400, Medium: 500, SemiBold: 600, Bold: 700 })[name] || 400;
  const result = {};

  const emit = (kindName, idx, sizeKey, family, lineHeight) => {
    const px = typo.size[sizeKey];
    if (px == null) return;
    for (const [weightName, fontStyle] of Object.entries(typo.weight)) {
      const weight = numericWeight(fontStyle);
      const key = `${kindName}${idx}${weightName[0].toUpperCase()}${weightName.slice(1)}`;
      result[key] = { family, size: px, weight, lineHeight, letterSpacing: 0 };
    }
  };

  // Heading 01–08 — Geist, 120% line-height, sizes 42/38/32/28/24/20/18/16
  const headingSizes = ['11', '10', '9', '8', '7', '6', '5', '4'];
  headingSizes.forEach((sizeKey, i) => {
    emit('heading', String(i + 1).padStart(2, '0'), sizeKey, typo.family.title, 1.2);
  });

  // Body 01–05 — Urbanist, 140% line-height, sizes 20/18/16/14/12.
  // Body NN ← FontSize/(7-N).
  const bodySizes = ['6', '5', '4', '3', '2'];
  bodySizes.forEach((sizeKey, i) => {
    emit('body', String(i + 1).padStart(2, '0'), sizeKey, typo.family.body, 1.4);
  });

  // Caption — Urbanist, 140%, FontSize/1 (10px). Used for tooltips, metadata,
  // secondary inline labels.
  for (const [weightName, fontStyle] of Object.entries(typo.weight)) {
    const weight = numericWeight(fontStyle);
    const key = `caption${weightName[0].toUpperCase()}${weightName.slice(1)}`;
    result[key] = {
      family: typo.family.body,
      size: typo.size['1'],
      weight,
      lineHeight: 1.4,
      letterSpacing: 0,
    };
  }

  return result;
}

// ─── CSS variable emission for inline <style> block ──────────────────────────

function emitCssVars(primitives, semantics, spacing, radius, iconSize, typo, composites) {
  const lines = [];

  lines.push('  /* ── Color Primitives ── */');
  for (const [group, kvs] of Object.entries(primitives)) {
    const g = slug(group);
    for (const [k, v] of Object.entries(kvs)) {
      lines.push(`  --color-${g}-${slug(k)}: ${v};`);
    }
  }

  lines.push('');
  lines.push('  /* ── Color Semantics (Role/Layer/Variant) ── */');
  for (const [role, layers] of Object.entries(semantics)) {
    for (const [layer, variants] of Object.entries(layers)) {
      for (const [variant, value] of Object.entries(variants)) {
        lines.push(`  --color-${slug(role)}-${slug(layer)}-${slug(variant)}: ${value};`);
      }
    }
  }

  lines.push('');
  lines.push('  /* ── Spacing ── */');
  for (const [k, v] of Object.entries(spacing)) lines.push(`  --space-${k}: ${v}px;`);

  lines.push('');
  lines.push('  /* ── Corner Radius ── */');
  for (const [k, v] of Object.entries(radius)) lines.push(`  --radius-${k}: ${v}px;`);

  lines.push('');
  lines.push('  /* ── Icon Sizes ── */');
  for (const [k, v] of Object.entries(iconSize)) lines.push(`  --icon-size-${k}: ${v}px;`);

  lines.push('');
  lines.push('  /* ── Typography primitives ── */');
  for (const [k, v] of Object.entries(typo.family)) lines.push(`  --type-family-${slug(k)}: "${v}";`);
  for (const [k, v] of Object.entries(typo.weight)) {
    const numeric = ({ Regular: 400, Medium: 500, SemiBold: 600, Bold: 700 })[v] || 400;
    lines.push(`  --type-weight-${slug(k)}: ${numeric};`);
  }
  for (const [k, v] of Object.entries(typo.size)) lines.push(`  --type-size-${k}: ${v}px;`);

  lines.push('');
  lines.push('  /* ── Body bg + reset (kept inline for <body> safety floor) ── */');
  lines.push('  --color-bg-page: #0D0D0D;');
  lines.push('  --color-fg-on-page: #FFFFFF;');

  return lines.join('\n');
}

const RESET = `
/* ── Base reset / surface ────────────────────────────────────────────── */
html, body, #root { height: 100%; }
body { margin: 0; }
*, *::before, *::after { box-sizing: border-box; }
button { font: inherit; color: inherit; }
`;

// ─── TS module emission ──────────────────────────────────────────────────────

function emitTsModule({ primitives, semantics, spacing, radius, iconSize, typo, composites }) {
  // Strip quotes around plain identifier keys (letter/_ first). Keys starting
  // with a digit (`2xl`, `3xs`) and keys containing spaces (`Base Colours`)
  // stay quoted — TS would reject them otherwise.
  const j = (obj) => JSON.stringify(obj, null, 2).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g, '$1:');

  return [
    '// GENERATED — do not edit by hand. Regenerate: npm run tokens:build',
    '// Source: src/shared/design-system/tokens/source/**/Mode 1.tokens.json',
    '//',
    '// This module is the bridge between the Infinity DTCG export and our Tailwind',
    '// config / any other code that needs token values at compile time.',
    '// `npm run tokens:verify` enforces that every value here matches the DTCG source.',
    '',
    '/* eslint-disable */',
    '',
    '// Color primitives — raw color ramps (Blue, Neutral, Error, Warning, Success, etc.)',
    `export const primitives = ${j(primitives)} as const;`,
    '',
    '// Color semantics — role-based mapping (Primary/Surface/High = brand action color, etc.)',
    `export const semantics = ${j(semantics)} as const;`,
    '',
    '// Spacing scale (Infinity t-shirt sizes; values in pixels)',
    `export const spacing = ${j(spacing)} as const;`,
    '',
    '// Corner radius scale (px)',
    `export const radius = ${j(radius)} as const;`,
    '',
    '// Icon size scale (px)',
    `export const iconSize = ${j(iconSize)} as const;`,
    '',
    '// Typography primitives (font families, weight names, font sizes)',
    `export const typography = ${j(typo)} as const;`,
    '',
    '// Typography composites — named text styles like Body 03/Bold = 16px Bold Urbanist.',
    '// Composite key format: <kind><NN><Weight> where NN is 01 (largest) to 06 (smallest)',
    '// for body, 01 (largest) to 05 (smallest) for title. Weight is Regular|Medium|SemiBold|Bold.',
    `export const typographyComposites = ${j(composites)} as const;`,
    '',
  ].join('\n');
}

// ─── main ────────────────────────────────────────────────────────────────────

function build() {
  const sets = loadSets();
  const primitives = buildPrimitives(sets['Color Primitives'] || {});
  const semantics = buildSemantics(sets['Color Semantics'] || {});
  const spacing = buildNumbers(sets['Spacing'] || {});
  const radius = buildNumbers(sets['Corner Radius'] || {});
  const iconSize = buildNumbers(sets['Icon Sizes'] || {});
  const typo = buildTypographyPrimitives(sets['Typography'] || {});
  const composites = buildTypographyComposites(typo);

  // 1) Write TS module (consumed by tailwind.config.ts)
  writeFileSync(TS_PATH, emitTsModule({ primitives, semantics, spacing, radius, iconSize, typo, composites }), 'utf8');

  // 1b) Write JSON dump (consumed by verify-tokens.mjs — avoids parsing .ts at verify time)
  writeFileSync(
    JSON_PATH,
    JSON.stringify({ primitives, semantics, spacing, radius, iconSize, typography: typo, typographyComposites: composites }, null, 2),
    'utf8',
  );

  // 2) Write CSS vars into index.html between markers
  const cssVars = emitCssVars(primitives, semantics, spacing, radius, iconSize, typo, composites);
  const cssBlock =
    '/*\n * GENERATED — do not edit by hand. Regenerate: npm run tokens:build\n */\n\n:root {\n' +
    cssVars +
    '\n}\n' +
    RESET;

  const html = readFileSync(HTML_PATH, 'utf8');
  const startIdx = html.indexOf(START_MARKER);
  const endIdx = html.indexOf(END_MARKER);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`[build-tokens] could not find markers in ${HTML_PATH}`);
  }
  const indented = cssBlock.split('\n').map((l) => (l.length ? '      ' + l : l)).join('\n');
  const before = html.slice(0, startIdx) + START_MARKER + ' — populated by `npm run tokens:build`. Do not edit by hand. */\n';
  const after = '      ' + END_MARKER + html.slice(endIdx + END_MARKER.length);
  writeFileSync(HTML_PATH, before + indented + '\n' + after, 'utf8');

  // Counts.
  const primCount = Object.values(primitives).reduce((n, g) => n + Object.keys(g).length, 0);
  const semCount = Object.values(semantics).reduce(
    (n, layers) => n + Object.values(layers).reduce((m, v) => m + Object.keys(v).length, 0),
    0,
  );
  console.log(`[build-tokens] wrote ${TS_PATH}`);
  console.log(`[build-tokens]   ${primCount} primitives, ${semCount} semantics, ${Object.keys(spacing).length} spacing, ${Object.keys(radius).length} radius, ${Object.keys(iconSize).length} icon-size, ${Object.keys(composites).length} typography composites`);
  console.log(`[build-tokens] inlined CSS variables into ${HTML_PATH}`);
}

build();
