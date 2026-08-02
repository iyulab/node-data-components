import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

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
        // exports['./init'] 이 선언하는 진입점이다. 여기 없으면 dist/init.js 가 생성되지
        // 않아 게시본을 설치한 소비자만 ERR_MODULE_NOT_FOUND 를 받는다(타입 선언은
        // 생성되므로 dist/init.d.ts 만 남아 더 눈에 안 띈다).
        resolve(__dirname, 'src/init.ts'),
        resolve(__dirname, 'src/react.ts'),
        resolve(__dirname, 'src/components/simple-sheet/USimpleSheet.ts'),
        resolve(__dirname, 'src/components/data-view/UDataView.ts'),
        resolve(__dirname, 'src/components/u-rich-table/URichTable.ts'),
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
        /^@lit\/react/,
        /^react(\/|$)/,
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      }
    }
  },
  plugins: [
    dts({
      include: ["src/**/*"]
    })
  ]
});
