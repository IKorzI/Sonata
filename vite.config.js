import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 5173,
    strictPort: true,
    sourcemap: true,
    minify: false,
    watch: {
      ignored: ["**/test/**", "**/test-results/**", "**/manual_test/**"],
    },
  },
  base: "./",
  build: {
    rollupOptions: {
      external: ["electron"],
    },
    outDir: "dist-vite",
    emptyOutDir: true,
  },
  optimizeDeps: {
    exclude: ["electron"],
  },
});
