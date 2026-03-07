import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/node-data-components/',
  root: 'tests',
  build: {
    target: 'esnext',
    outDir: '../demo-dist',
    emptyOutDir: true,
  },
  plugins: [
    react(),
  ],
});
