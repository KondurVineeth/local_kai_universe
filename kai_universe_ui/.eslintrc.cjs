/* eslint-env node */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'import', 'boundaries', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:boundaries/recommended',
  ],
  settings: {
    react: { version: 'detect' },
    'import/resolver': {
      typescript: { project: './tsconfig.json' },
      node: true,
    },
    'boundaries/elements': [
      // Order matters: more specific patterns first.
      { type: 'feature-public', pattern: 'src/features/*/index.ts', capture: ['feature'], mode: 'file' },
      { type: 'feature-domain', pattern: 'src/features/*/domain/**', capture: ['feature'] },
      { type: 'feature-app', pattern: 'src/features/*/application/**', capture: ['feature'] },
      { type: 'feature-infra', pattern: 'src/features/*/infrastructure/**', capture: ['feature'] },
      { type: 'feature-ui', pattern: 'src/features/*/presentation/**', capture: ['feature'] },
      // Split shared by sub-layer so feature-ui can use the safe parts but
      // can't reach into the infra-only adapters (those flow via DI container).
      { type: 'shared-domain', pattern: 'src/shared/domain/**' },
      { type: 'shared-infra', pattern: 'src/shared/infrastructure/**' },
      { type: 'shared-misc', pattern: 'src/shared/**' },
      { type: 'app', pattern: 'src/app/**' },
      { type: 'electron', pattern: 'electron/**' },
      { type: 'tests', pattern: 'tests/**' },
      { type: 'scripts', pattern: 'scripts/**' },
    ],
    'boundaries/include': ['src/**/*', 'electron/**/*', 'tests/**/*', 'scripts/**/*'],
  },
  rules: {
    // ─── Layer boundary rules (the heart of clean arch enforcement) ───
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [
          // shared/domain: pure types, only intra-shared
          { from: ['shared-domain'], allow: ['shared-domain', 'shared-misc'] },

          // shared/infrastructure: implements shared-domain ports
          { from: ['shared-infra'], allow: ['shared-domain', 'shared-misc'] },

          // shared/misc (lib, hooks, persistence, ds, store, container, types, icons)
          { from: ['shared-misc'], allow: ['shared-misc', 'shared-domain'] },

          // feature-domain: pure, only shared-domain
          { from: ['feature-domain'], allow: ['shared-domain', 'shared-misc'] },

          // feature-app (use cases): own domain + shared (no infra)
          {
            from: [['feature-app', { feature: '${from.feature}' }]],
            allow: [
              'shared-domain',
              'shared-misc',
              ['feature-domain', { feature: '${from.feature}' }],
            ],
          },

          // feature-infra (adapters): own domain + all of shared (concrete adapters
          // can lean on shared-infra helpers like simulators)
          {
            from: [['feature-infra', { feature: '${from.feature}' }]],
            allow: [
              'shared-domain',
              'shared-infra',
              'shared-misc',
              ['feature-domain', { feature: '${from.feature}' }],
            ],
          },

          // feature-ui (presentation): own domain + own app + safe shared + any
          // feature's public barrel. NEVER shared-infra directly — infra flows
          // through the DI container.
          {
            from: [['feature-ui', { feature: '${from.feature}' }]],
            allow: [
              'shared-domain',
              'shared-misc',
              ['feature-domain', { feature: '${from.feature}' }],
              ['feature-app', { feature: '${from.feature}' }],
              'feature-public',
            ],
          },

          // feature-public barrel: may re-export from any layer of OWN feature
          {
            from: [['feature-public', { feature: '${from.feature}' }]],
            allow: [
              'shared-domain',
              'shared-misc',
              'shared-infra',
              ['feature-domain', { feature: '${from.feature}' }],
              ['feature-app', { feature: '${from.feature}' }],
              ['feature-infra', { feature: '${from.feature}' }],
              ['feature-ui', { feature: '${from.feature}' }],
            ],
          },

          // app (composition root): shared + every feature's barrel
          {
            from: ['app'],
            allow: ['shared-domain', 'shared-misc', 'shared-infra', 'feature-public'],
          },

          // electron: separate process, no src/ imports
          { from: ['electron'], allow: [] },

          // tests: can reach anywhere for test setup
          {
            from: ['tests'],
            allow: [
              'shared-domain',
              'shared-misc',
              'shared-infra',
              'feature-domain',
              'feature-app',
              'feature-infra',
              'feature-ui',
              'feature-public',
              'app',
            ],
          },

          // scripts: build/scaffold scripts, no src/ imports
          { from: ['scripts'], allow: [] },
        ],
      },
    ],

    // No file should be left unmatched by the elements config.
    'boundaries/no-unknown': 'error',
    'boundaries/no-unknown-files': 'off',

    // ─── SOLID-leaning rules ───
    'max-classes-per-file': ['error', 1],
    'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true, skipComments: true, IIFEs: true }],

    // ─── TypeScript ───
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
    '@typescript-eslint/no-explicit-any': 'warn',

    // ─── React ───
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    'react/prop-types': 'off',

    // ─── Import hygiene ───
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      },
    ],
    'import/no-default-export': 'off',
    'import/no-unresolved': 'error',
  },
  overrides: [
    {
      files: ['*.config.ts', '*.config.cjs', 'electron.vite.config.ts', 'tailwind.config.ts', 'vitest.config.ts', 'scripts/**/*'],
      rules: {
        'boundaries/element-types': 'off',
        'boundaries/no-unknown': 'off',
        'import/no-default-export': 'off',
      },
    },
    {
      files: ['tests/**/*'],
      rules: {
        'max-lines-per-function': 'off',
      },
    },
  ],
  ignorePatterns: ['node_modules', 'out', 'dist', '*.cjs', '*.mjs', 'docs', '.eslintrc.cjs'],
};
