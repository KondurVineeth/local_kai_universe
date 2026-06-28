// Unified id generator. Prefer crypto.randomUUID — Electron renderer (Chromium
// 32+) ships it; node tests run on Node 20+ where it's also available. Fall
// back to a Date.now/Math.random composite only if the runtime somehow lacks
// the WebCrypto interface (older sandbox envs, certain web-workers in tests).
//
// Centralized here so feature slices don't grow their own incompatible
// generators (id-width drift between thunks/slice was BUG-CHAT-SPLIT-015).
export function newId(prefix: string): string {
  const cryptoLike = (
    globalThis as unknown as { crypto?: { randomUUID?: () => string } }
  ).crypto;
  const uuid = cryptoLike?.randomUUID
    ? cryptoLike.randomUUID()
    : `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${uuid}`;
}
