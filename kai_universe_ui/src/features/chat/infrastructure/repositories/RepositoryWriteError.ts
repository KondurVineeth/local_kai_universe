// Typed error so callers can distinguish a write failure (quota exceeded,
// security exception, disk full) from a generic Error and surface it to the
// user (toast / retry button) instead of crashing the thunk silently.
//
// Lives in its own file so the localStorage repository module stays
// single-class (project lint rule: max-classes-per-file: 1).
export class RepositoryWriteError extends Error {
  readonly key: string;
  override readonly cause?: unknown;
  constructor(message: string, key: string, cause?: unknown) {
    super(message);
    this.name = 'RepositoryWriteError';
    this.key = key;
    this.cause = cause;
  }
}
