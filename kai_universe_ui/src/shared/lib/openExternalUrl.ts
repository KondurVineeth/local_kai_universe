// Open an external http(s) URL in the OS default browser via the Electron
// preload bridge. Falls back to `window.open` for non-Electron contexts
// (Vitest, Storybook). Internal/relative hrefs are returned to the caller
// untouched so they can route via react-router instead.
export function openExternalUrl(url: string): void {
  if (!url) return;
  let parsed: URL;
  try {
    parsed = new URL(url, window.location.href);
  } catch {
    return;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return;
  if (typeof window !== 'undefined' && window.universe?.openExternal) {
    void window.universe.openExternal(parsed.toString());
    return;
  }
  window.open(parsed.toString(), '_blank', 'noopener,noreferrer');
}
