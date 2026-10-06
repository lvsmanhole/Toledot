import { defineConfig } from "vite";

// The journey is the landing page of site/; Toledot lives beside it in site/timeline/.
export default defineConfig({
  base: "./",
  build: {
    outDir: "../site",
    emptyOutDir: false,
    assetsDir: "assets",
    chunkSizeWarningLimit: 900,
  },
});
