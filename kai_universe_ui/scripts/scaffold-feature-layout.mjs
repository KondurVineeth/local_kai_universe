#!/usr/bin/env node
/**
 * One-shot scaffolder that creates a feature's contextual layout — a
 * SecondarySidebar + <Outlet /> grid — and updates the feature's routes.tsx
 * to nest under that layout.
 *
 * Usage:
 *   node scripts/scaffold-feature-layout.mjs <feature-name> <SecondaryTitle>
 *
 * Skips features that already have a `presentation/layouts/<Pascal>Layout/`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const [featureName, secondaryTitle] = process.argv.slice(2);
if (!featureName || !secondaryTitle) {
  console.error('Usage: node scripts/scaffold-feature-layout.mjs <feature-name> <SecondaryTitle>');
  process.exit(1);
}

const pascal = featureName
  .split('-')
  .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
  .join('');
const camel = pascal.charAt(0).toLowerCase() + pascal.slice(1);

const featureDir = join(ROOT, 'src/features', featureName);
const layoutDir = join(featureDir, `presentation/layouts/${pascal}Layout`);
const sidebarDir = join(featureDir, `presentation/components/${pascal}SecondarySidebar`);

mkdirSync(layoutDir, { recursive: true });
mkdirSync(sidebarDir, { recursive: true });

const layoutTsx = `import { Outlet } from 'react-router-dom';

import { useAppSelector } from '@shared/store/hooks';
import { selectSecondarySidebarHidden } from '@features/shell';

import { ${pascal}SecondarySidebar } from '../../components/${pascal}SecondarySidebar';

export function ${pascal}Layout() {
  const sidebarHidden = useAppSelector(selectSecondarySidebarHidden);
  return (
    <div
      className="grid h-full min-h-0"
      style={{
        gridTemplateColumns: sidebarHidden ? '1fr' : '260px 1fr',
      }}
    >
      {!sidebarHidden && <${pascal}SecondarySidebar />}
      <main className="min-w-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
`;

const layoutIndex = `export { ${pascal}Layout } from './${pascal}Layout';\n`;

const sidebarTsx = `import { SecondarySidebar } from '@shared/ds/layouts';

// Placeholder secondary sidebar for the ${pascal} feature. Real content lands
// when the ${pascal} L1 is built. The SecondarySidebar primitive provides the
// title / sub-header / scroll-body / footer structure.
export function ${pascal}SecondarySidebar() {
  return (
    <SecondarySidebar title="${secondaryTitle}">
      <div className="px-3 py-4 text-xs text-fg-subtle">
        ${secondaryTitle} content coming soon.
      </div>
    </SecondarySidebar>
  );
}
`;

const sidebarIndex = `export { ${pascal}SecondarySidebar } from './${pascal}SecondarySidebar';\n`;

function writeIfMissing(path, content) {
  if (existsSync(path)) {
    console.log('  skip', path);
    return;
  }
  writeFileSync(path, content);
  console.log('  write', path);
}

writeIfMissing(join(layoutDir, `${pascal}Layout.tsx`), layoutTsx);
writeIfMissing(join(layoutDir, 'index.ts'), layoutIndex);
writeIfMissing(join(sidebarDir, `${pascal}SecondarySidebar.tsx`), sidebarTsx);
writeIfMissing(join(sidebarDir, 'index.ts'), sidebarIndex);

// Update routes.tsx to nest under the layout.
const routesPath = join(featureDir, 'presentation/routes.tsx');
const existing = readFileSync(routesPath, 'utf8');
if (existing.includes(`${pascal}Layout`)) {
  console.log('  routes already wraps layout, skipping');
} else {
  const newRoutes = `import type { RouteObject } from 'react-router-dom';

import { Placeholder${pascal}Page } from './components/Placeholder${pascal}Page';
import { ${pascal}Layout } from './layouts/${pascal}Layout';

export const ${camel}Routes: RouteObject[] = [
  {
    path: '${featureName}',
    element: <${pascal}Layout />,
    children: [{ index: true, element: <Placeholder${pascal}Page /> }],
  },
];
`;
  writeFileSync(routesPath, newRoutes);
  console.log('  rewrote', routesPath);
}

console.log(`Done: ${featureName}`);
