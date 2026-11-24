import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: { strictPort: true },
  build: {
    rollupOptions: {
      input: {
        gallery: fileURLToPath(new URL('./index.html', import.meta.url)),
        abalone: fileURLToPath(new URL('./abalone.html', import.meta.url)),
      },
    },
  },
});
