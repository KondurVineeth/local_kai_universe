// Value object for byte sizes. Constructed from a non-negative integer count.
declare const __bytesBrand: unique symbol;

export type Bytes = number & { readonly [__bytesBrand]: 'Bytes' };

export const Bytes = {
  of(n: number): Bytes {
    if (!Number.isFinite(n) || n < 0) {
      throw new RangeError(`Bytes must be a non-negative finite number, got ${n}`);
    }
    return Math.floor(n) as Bytes;
  },
  zero: 0 as Bytes,
} as const;
