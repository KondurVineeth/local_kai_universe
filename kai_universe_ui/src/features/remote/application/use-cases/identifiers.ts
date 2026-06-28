// Generates the 32-hex device identifier rendered in This Device. It's
// purely cosmetic in the mock (no real handshake happens) — but it has to
// look real, so we use crypto.getRandomValues when available and fall back
// to Math.random for non-browser test environments.
export function generateDeviceIdentifier(): string {
  const bytes = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

// Default display name for the local device. The IPC bridge can swap this
// for the real hostname later; for now we surface a friendly platform-
// inferred label so a fresh install isn't "untitled".
export function defaultLocalDeviceName(): string {
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || '';
    if (/Macintosh|Mac OS X/i.test(ua)) return 'This Mac';
    if (/Windows/i.test(ua)) return 'This PC';
    if (/Linux/i.test(ua)) return 'This Linux box';
  }
  return 'This device';
}
