// ZL Universe's two supported on-disk formats.
export const ModelFormats = ['gguf', 'mlx'] as const;
export type ModelFormat = (typeof ModelFormats)[number];

export const ModelFormat = {
  values: ModelFormats,
  isValid(value: string): value is ModelFormat {
    return (ModelFormats as readonly string[]).includes(value);
  },
  of(value: string): ModelFormat {
    if (!ModelFormat.isValid(value)) {
      throw new RangeError(`Unknown model format: ${value}`);
    }
    return value;
  },
} as const;
