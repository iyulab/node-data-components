import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  server: {
    open: "tests/index.html",
    port: 5174,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    lib: {
      name: 'DataComponents',
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: (format, entry) => {
        return format === 'es' ? `${entry}.js` : `${entry}.${format}.js`;
      }
    },
    rollupOptions: {
      external: [
        /^@iyulab.*/,
        /^lit.*/,
        /^@lit.*/,
        /^react.*/,
        /^devextreme.*/,
        'reflect-metadata',
      ],
      output: {
        preserveModulesRoot: 'src',
        preserveModules: true,
        assetFileNames: 'assets/[name]-[hash].[extname]',
        chunkFileNames: 'chunks/[name]-[hash].js',
      }
    }
  },
  plugins: [
    react(),
    dts({
      include: ["src/**/*"]
    })
  ]
});