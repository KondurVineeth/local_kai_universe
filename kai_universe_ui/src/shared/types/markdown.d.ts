/// <reference types="vite/client" />

// Vite supports importing file contents as raw strings via `?raw` and
// `import.meta.glob(..., { query: '?raw', import: 'default' })`. Declare the
// module shape so TypeScript accepts `import md from './x.md?raw'`. The
// triple-slash reference above pulls in `ImportMeta.glob`'s type.
declare module '*.md?raw' {
  const src: string;
  export default src;
}
