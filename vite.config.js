import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 5173,
    strictPort: true,
    sourcemap: true, // ← важная строка
    minify: false,
  },
  base: './', // важно для Electron!
  build: {
    rollupOptions: {
      external: ['electron']
    },
    outDir: 'dist/win-unpacked/resources/app/dist', // путь, куда будет собрана сборка
  },
  optimizeDeps: {
    exclude: ['electron']
  }
}); 