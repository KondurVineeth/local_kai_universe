// Quantization tag (e.g. "Q4_K_M", "Q8_0", "F16"). Free-form string in ZL Universe,
// but we validate it's non-empty.
declare const __quantBrand: unique symbol;

export type Quantization = string & { readonly [__quantBrand]: 'Quantization' };

export const Quantization = {
  of(value: string): Quantization {
    if (!value || value.trim() !== value) {
      throw new RangeError('Quantization must be a non-empty trimmed string');
    }
    return value as Quantization;
  },
} as const;
