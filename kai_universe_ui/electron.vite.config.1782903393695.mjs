// electron.vite.config.ts
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
var aliases = {
  "@shared/ds": resolve("src/shared/design-system"),
  "@app": resolve("src/app"),
  "@shared": resolve("src/shared"),
  "@features/shell": resolve("src/features/shell"),
  "@features/onboarding": resolve("src/features/onboarding"),
  "@features/chat": resolve("src/features/chat"),
  "@features/discover": resolve("src/features/discover"),
  "@features/my-models": resolve("src/features/my-models"),
  "@features/local-server": resolve("src/features/local-server"),
  "@features/developer-docs": resolve("src/features/developer-docs"),
  "@features/remote": resolve("src/features/remote"),
  "@features/settings": resolve("src/features/settings"),
  "@electron": resolve("electron")
};
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: aliases },
    build: {
      rollupOptions: {
        input: { index: resolve("electron/main/index.ts") }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: aliases },
    build: {
      rollupOptions: {
        input: { index: resolve("electron/preload/index.ts") }
      }
    }
  },
  renderer: {
    root: resolve("src"),
    resolve: { alias: aliases },
    plugins: [react()],
    build: {
      rollupOptions: {
        input: { index: resolve("src/index.html") }
      }
    }
  }
});
export {
  electron_vite_config_default as default
};
