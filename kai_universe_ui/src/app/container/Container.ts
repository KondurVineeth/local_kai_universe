// Re-export the canonical Container type so consumers within @app/* can
// `import type { Container } from '@app/container/Container'` symmetrically
// with feature code. The actual definition (and declaration-merging hook) lives
// in @shared/container.
export type { Container, SharedContainer, ContainerExtensions } from '@shared/container';
