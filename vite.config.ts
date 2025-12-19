import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  server: {
    open: "tests/index.html",
    port: 5176,
  },

  build: {
    target: 'esnext',
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: false,
    minify: false,
    lib: {
      entry: [
        resolve(__dirname, 'src/index.ts'),
      ],
      formats: ['es'],
      fileName: (format, entry) => {
        return format === 'es' ? `${entry}.js` : `${entry}.${format}.js`;
      }
    },
    rollupOptions: {
      external: [
        /^@iyulab.*/,
        /^lit.*/,
        /^react.*/,
        /^devextreme.*/,
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
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