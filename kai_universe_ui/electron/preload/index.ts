import { contextBridge, ipcRenderer } from 'electron';

// Hardware-detect IPC bridge. Renderer-side code (the
// ElectronSystemRepository) calls `window.universe.detectHardware()` which
// proxies to the main-process handler registered in electron/main/index.ts.
// We intentionally expose only the typed surface — no raw `ipcRenderer`
// access leaks across the contextBridge.
contextBridge.exposeInMainWorld('universe', {
  version: 1,
  platform: process.platform,
  detectHardware: async () => ipcRenderer.invoke('universe:hardware:detect'),
  // Route external http(s) URLs to the OS default browser instead of letting
  // them navigate the Electron renderer away from the SPA. Main process
  // validates the scheme before passing to `shell.openExternal`.
  openExternal: async (url: string) => ipcRenderer.invoke('universe:shell:openExternal', url),
});

declare global {
  interface Window {
    readonly universe: {
      readonly version: number;
      readonly platform: NodeJS.Platform;
      readonly detectHardware: () => Promise<unknown>;
      readonly openExternal: (url: string) => Promise<void>;
    };
  }
}

export {};
