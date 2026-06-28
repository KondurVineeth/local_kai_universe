import { describe, expect, it } from 'vitest';

import { Bytes } from '@shared/domain/primitives/Bytes';
import { Iso8601 } from '@shared/domain/primitives/Iso8601';

describe('Bytes', () => {
  it('rejects negative values', () => {
    expect(() => Bytes.of(-1)).toThrow(RangeError);
  });
  it('floors fractional values', () => {
    expect(Bytes.of(1.7)).toBe(1);
  });
  it('Bytes.zero is 0', () => {
    expect(Bytes.zero).toBe(0);
  });
});

describe('Iso8601', () => {
  it('rejects malformed strings', () => {
    expect(() => Iso8601.of('2026-13-99 nope')).toThrow(RangeError);
  });
  it('accepts valid ISO timestamps', () => {
    expect(Iso8601.of('2026-05-06T10:30:00Z')).toBe('2026-05-06T10:30:00Z');
  });
  it('Iso8601.now() returns a valid timestamp', () => {
    const now = Iso8601.now();
    expect(typeof now).toBe('string');
    expect(() => Iso8601.of(now)).not.toThrow();
  });
});
