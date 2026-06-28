import { join } from 'node:path';

import { app, BrowserWindow, shell } from 'electron';

const DEFAULT_WIDTH = 1400;
const DEFAULT_HEIGHT = 900;
const MIN_WIDTH = 1024;
const MIN_HEIGHT = 700;

export function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    show: false,
    title: 'Universe',
    // backgroundColor + transparent: false are LOAD-BEARING — without them the
    // window itself ends up transparent in dev (verified 2026-05-06: with neither
    // set, the macOS desktop bled through wherever body bg didn't fully cover).
    // The matching `<style>` block + tokens in src/index.html assumes these are set.
    // See src/index.html top-of-file comment for the full token-loading rationale.
    backgroundColor: '#0D0D0D',
    transparent: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 14, y: 14 },
    webPreferences: {
      // electron-vite emits preload as `.mjs` (ESM). The `.js` extension
      // we used to reference here silently failed in packaged builds —
      // the preload never loaded, `window.universe` was undefined, and
      // the renderer fell through to the FixtureSystemRepository even
      // when real-detection was wired. Dev didn't show the bug because
      // electron-vite injects ELECTRON_RENDERER_URL + the dev preload
      // path through env, bypassing this string.
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.once('ready-to-show', () => {
    // Maximize on first paint so Universe fills the workspace by default.
    // DEFAULT_WIDTH/HEIGHT above remain load-bearing as the *restored* size —
    // what the window springs back to when the user un-maximizes. Calling
    // maximize before show avoids a brief flash of the contained window
    // before it expands.
    win.maximize();
    win.show();
    if (!app.isPackaged) {
      win.webContents.openDevTools({ mode: 'detach' });
    }
  });

  // Open external links in the user's browser, never inside the app.
  win.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Surface renderer-side load failures during development so a blank window
  // becomes a visible error instead of a silent one.
  if (!app.isPackaged) {
    win.webContents.on('did-fail-load', (_e, code, description, url) => {
      // eslint-disable-next-line no-console
      console.error(`[renderer] did-fail-load (${code}) ${description} — ${url}`);
    });
    win.webContents.on('render-process-gone', (_e, details) => {
      // eslint-disable-next-line no-console
      console.error('[renderer] render-process-gone', details);
    });
  }

  if (process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'));
  }

  return win;
}
