#!/usr/bin/env node
/**
 * Scaffolds a feature module per the project's feature-split clean architecture contract.
 *
 *   node scripts/scaffold-feature.mjs <feature-name> [--shell-extras]
 *
 * The scaffold creates:
 *   src/features/<feature>/{domain,application,infrastructure,presentation}/...
 *   src/features/<feature>/index.ts        (public barrel)
 *   src/features/<feature>/README.md       (1-paragraph ownership note)
 *
 * Existing files are not overwritten.
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const featureName = args[0];
const opts = new Set(args.slice(1));

if (!featureName || featureName.startsWith('-')) {
  console.error('Usage: node scripts/scaffold-feature.mjs <feature-name>');
  process.exit(1);
}

// kebab-case → PascalCase  (e.g. "my-models" → "MyModels", "lm-link" → "LmLink")
const pascal = featureName
  .split('-')
  .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
  .join('');
// kebab-case → camelCase   (e.g. "my-models" → "myModels")
const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1);

const FEATURE_DIR = join(ROOT, 'src/features', featureName);

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(p) {
  await mkdir(p, { recursive: true });
}

async function writeIfMissing(relPath, content) {
  const abs = join(FEATURE_DIR, relPath);
  await ensureDir(dirname(abs));
  if (await exists(abs)) {
    console.log(`   skip   ${relPath}  (exists)`);
    return;
  }
  await writeFile(abs, content);
  console.log(`   write  ${relPath}`);
}

const PLACEHOLDER = (note) => `// ${note}\nexport {};\n`;

const SLICE_STUB = `import { createSlice } from '@reduxjs/toolkit';

export interface ${pascal}State {
  // feature-local UI state goes here
  _initialized: boolean;
}

const initialState: ${pascal}State = {
  _initialized: false,
};

export const ${camel}Slice = createSlice({
  name: '${camel}',
  initialState,
  reducers: {
    initialized(state) {
      state._initialized = true;
    },
  },
});

export const { initialized } = ${camel}Slice.actions;
export const ${camel}Reducer = ${camel}Slice.reducer;
`;

const SELECTORS_STUB = `import type { RootState } from '@shared/store/hooks';

export const select${pascal}Initialized = (state: RootState): boolean =>
  state.${camel}._initialized;
`;

const ROUTES_STUB = `import type { RouteObject } from 'react-router-dom';

import { Placeholder${pascal}Page } from './components/Placeholder${pascal}Page';

export const ${camel}Routes: RouteObject[] = [
  { path: '${featureName}', element: <Placeholder${pascal}Page /> },
];
`;

const PLACEHOLDER_COMPONENT = `export function Placeholder${pascal}Page() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-fg-default">${pascal}</h1>
      <p className="text-fg-muted">${pascal} coming soon.</p>
    </div>
  );
}
`;

const PLACEHOLDER_COMPONENT_INDEX = `export { Placeholder${pascal}Page } from './Placeholder${pascal}Page';\n`;

const BARREL = `import type { SharedContainer } from '@shared/container';
import type { ${pascal}State } from './presentation/store/slice';

import { ${camel}Reducer, ${camel}Slice } from './presentation/store/slice';
import { ${camel}Routes } from './presentation/routes';

export interface ${pascal}Container {
  // populated as feature wires its repositories, simulators, and use cases
  readonly _${camel}Marker?: undefined;
}

export function wire${pascal}Container(_shared: SharedContainer): ${pascal}Container {
  return {};
}

// Augment the global Container type with this feature's slice.
declare module '@shared/container' {
  interface ContainerExtensions {
    readonly ${camel}: ${pascal}Container;
  }
}

// Register this feature's slice on the global RootStateShape.
declare module '@shared/store/hooks' {
  interface RootStateShape {
    readonly ${camel}: ${pascal}State;
  }
}

// Public surface — only barrel-level exports
export { ${camel}Reducer, ${camel}Slice };
export { ${camel}Routes };
export { select${pascal}Initialized } from './presentation/store/selectors';
export type { ${pascal}State };
`;

const README = `# ${pascal} feature

Owns the ${pascal === 'Shell' ? 'App Shell & Global' : pascal} L1 surface.

## Public API (barrel exports)

- \`${camel}Reducer\`, \`${camel}Slice\` — wired into the root store
- \`${camel}Routes\` — composed into the app router
- \`wire${pascal}Container(shared)\` — contributes this feature's services to the DI container
- selectors prefixed \`select${pascal}*\` — typed Redux selectors
- public hooks (added as the feature is built)

## Internal layers (NEVER import these from another feature)

- \`domain/\` — entities, value objects, port interfaces
- \`application/\` — use cases (orchestration, no I/O)
- \`infrastructure/\` — fixture repositories, simulators, persistence adapters
- \`presentation/\` — React components, hooks, Redux slice + RTK Query API
`;

const DIRS = [
  'domain/entities',
  'domain/value-objects',
  'domain/ports',
  'application/use-cases',
  'infrastructure/fixtures',
  'infrastructure/repositories',
  'infrastructure/simulators',
  'infrastructure/persistence',
  'presentation/components',
  'presentation/hooks',
  'presentation/store',
  'presentation/layouts',
];

console.log(`\nScaffolding feature: ${featureName}\n`);

await ensureDir(FEATURE_DIR);
for (const d of DIRS) {
  await ensureDir(join(FEATURE_DIR, d));
  await writeIfMissing(join(d, '.gitkeep'), '');
}

await writeIfMissing('presentation/store/slice.ts', SLICE_STUB);
await writeIfMissing('presentation/store/selectors.ts', SELECTORS_STUB);
await writeIfMissing('presentation/routes.tsx', ROUTES_STUB);
await writeIfMissing(
  `presentation/components/Placeholder${pascal}Page/Placeholder${pascal}Page.tsx`,
  PLACEHOLDER_COMPONENT,
);
await writeIfMissing(
  `presentation/components/Placeholder${pascal}Page/index.ts`,
  PLACEHOLDER_COMPONENT_INDEX,
);
await writeIfMissing('domain/.gitkeep', '');
await writeIfMissing('application/.gitkeep', '');
await writeIfMissing('infrastructure/.gitkeep', '');
await writeIfMissing('index.ts', BARREL);
await writeIfMissing('README.md', README);

console.log(`\nDone. Feature '${featureName}' scaffolded at src/features/${featureName}/\n`);
