// Simulated-latency helpers. All fixture adapters use these so the mock feels
// stateful and async (loading spinners, transitions) without a real backend.

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function jitter(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

// Convenience: sleep for a randomized duration in [min, max] ms.
export function delayJittered(min: number, max: number): Promise<void> {
  return delay(jitter(min, max));
}
