import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';

import { detectHardware } from './hardware';
import { createMainWindow } from './window';

const APP_NAME = 'Universe';

// Real hardware detection IPC channel. The renderer's
// ElectronSystemRepository invokes this; main delegates to detectHardware()
// which wraps Node's `os` module + platform-specific shell probes. Returns
// a plain JSON-safe object — no Node handles cross the IPC boundary.
ipcMain.handle('universe:hardware:detect', async () => {
  return detectHardware();
});

// Open an external http(s) URL in the OS default browser. The renderer
// invokes this for README links / "Show on Web" affordances so they don't
// navigate the Electron renderer away from the SPA. We validate the scheme
// here — `shell.openExternal` will happily open `file://` or custom schemes
// otherwise.
ipcMain.handle('universe:shell:openExternal', async (_event, url: unknown) => {
  if (typeof url !== 'string') return;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return;
  await shell.openExternal(url);
});

// In dev (unpackaged), the macOS menu bar uses the Electron binary's name.
// Setting it here makes "Electron" become "Universe" in dev too.
// In packaged builds the bundle's CFBundleName (electron-builder `productName`)
// already provides the correct name, but calling this is harmless.
app.setName(APP_NAME);

const isDev = !app.isPackaged;

void app.whenReady().then(() => {
  // Rebuild the default macOS menu so the App menu uses our name (it captures
  // the name at construction time, before our setName takes effect by default).
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'viewMenu' }, { role: 'windowMenu' }, { role: 'help', submenu: [] }]));
  }

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

if (isDev) {
  // Surface any uncaught main-side issues during development.
  process.on('unhandledRejection', (reason) => {
    // eslint-disable-next-line no-console
    console.error('[main] unhandledRejection', reason);
  });
}
