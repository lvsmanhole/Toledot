import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// The journey is the landing page of site/; Toledot lives beside it in site/timeline/, so the output
// directory is not emptied. Only the journey's own folders (hashed chunks, copied assets) are cleared.
const cleanAssets = {
  name: "clean-journey-assets",
  apply: "build",
  buildStart() {
    // site/lib is copied fresh from public/lib, so replaced assets (old 2k HDRs, JPEGs) don't linger
    for (const dir of ["../site/assets", "../site/lib"]) rmSync(fileURLToPath(new URL(dir, import.meta.url)), { recursive: true, force: true });
  },
};

export default defineConfig({
  base: "./",
  plugins: [cleanAssets],
  build: {
    outDir: "../site",
    emptyOutDir: false,
    assetsDir: "assets",
    chunkSizeWarningLimit: 900,
  },
});
