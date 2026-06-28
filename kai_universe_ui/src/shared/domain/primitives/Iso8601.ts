// ISO 8601 timestamp string. Branded so a raw string can't accidentally be
// passed where a timestamp is expected.
declare const __iso8601Brand: unique symbol;

export type Iso8601 = string & { readonly [__iso8601Brand]: 'Iso8601' };

const ISO_8601_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

export const Iso8601 = {
  of(value: string): Iso8601 {
    if (!ISO_8601_RE.test(value)) {
      throw new RangeError(`Invalid ISO 8601 timestamp: ${value}`);
    }
    return value as Iso8601;
  },
  now(): Iso8601 {
    return new Date().toISOString() as Iso8601;
  },
} as const;
