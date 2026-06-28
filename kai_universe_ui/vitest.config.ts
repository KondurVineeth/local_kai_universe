import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@app': resolve('src/app'),
      '@shared': resolve('src/shared'),
      '@shared/ds': resolve('src/shared/design-system'),
      '@features/shell': resolve('src/features/shell'),
      '@features/onboarding': resolve('src/features/onboarding'),
      '@features/chat': resolve('src/features/chat'),
      '@features/discover': resolve('src/features/discover'),
      '@features/my-models': resolve('src/features/my-models'),
      '@features/developer': resolve('src/features/developer'),
      '@features/remote': resolve('src/features/remote'),
      '@features/settings': resolve('src/features/settings'),
    },
  },
});
