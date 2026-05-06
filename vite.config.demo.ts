import { defineConfig } from 'vite';

export default defineConfig({
  base: '/node-data-components/',
  root: 'tests',
  build: {
    target: 'esnext',
    outDir: '../demo-dist',
    emptyOutDir: true,
    rollupOptions: {
      treeshake: false,
    },
  },
});
