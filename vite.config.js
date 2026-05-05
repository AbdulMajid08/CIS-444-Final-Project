import { defineConfig } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: ".",
  publicDir: false,
  build: {
    rollupOptions: {
      input: {
        login: resolve(__dirname, "login/index.html"),
        dashboard: resolve(__dirname, "dashboard/index.html"),
        journal: resolve(__dirname, "journal/index.html"),
      },
    },
  },
});
