import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  build: {
    lib: {
      name: 'DataComponents',
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: 'index'
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'devextreme', 'devextreme-react'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'devextreme': 'DevExtreme',
          'devextreme-react': 'DevExtremeReact'
        }
      }
    }
  },
  plugins: [
    react()
  ]
})
