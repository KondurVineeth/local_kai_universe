// Renderer-scope type for the contextBridge surface exposed by the
// Electron preload (electron/preload/index.ts). The preload's own
// `declare global` is scoped to its tsconfig (tsconfig.node.json) and
// isn't visible in the renderer build, so we mirror the shape here.
//
// Keep both copies in sync — if you add a method to the preload bridge,
// add it here too.
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
