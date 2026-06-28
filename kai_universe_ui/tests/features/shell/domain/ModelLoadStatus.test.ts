import { describe, expect, it } from 'vitest';

import { ModelLoadStatus } from '../../../../src/features/shell/domain/value-objects/ModelLoadStatus';

describe('ModelLoadStatus', () => {
  it('has the five expected values', () => {
    expect(ModelLoadStatus.values).toEqual([
      'idle',
      'loading',
      'loaded',
      'unloading',
      'error',
    ]);
  });
  it('isLoadingOrLoaded returns true for loading and loaded', () => {
    expect(ModelLoadStatus.isLoadingOrLoaded('loading')).toBe(true);
    expect(ModelLoadStatus.isLoadingOrLoaded('loaded')).toBe(true);
  });
  it('isLoadingOrLoaded returns false for idle, error, and unloading', () => {
    expect(ModelLoadStatus.isLoadingOrLoaded('idle')).toBe(false);
    expect(ModelLoadStatus.isLoadingOrLoaded('error')).toBe(false);
    expect(ModelLoadStatus.isLoadingOrLoaded('unloading')).toBe(false);
  });
  it('isTransient returns true for loading and unloading only', () => {
    expect(ModelLoadStatus.isTransient('loading')).toBe(true);
    expect(ModelLoadStatus.isTransient('unloading')).toBe(true);
    expect(ModelLoadStatus.isTransient('idle')).toBe(false);
    expect(ModelLoadStatus.isTransient('loaded')).toBe(false);
    expect(ModelLoadStatus.isTransient('error')).toBe(false);
  });
});
