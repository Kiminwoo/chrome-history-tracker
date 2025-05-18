import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
// @ts-ignore
import viteCopy from 'vite-plugin-copy'

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  plugins: [
    react(),
    viteCopy({
      targets: [
        { src: 'public/manifest.json', dest: 'dist' },
        { src: 'public/icons/*', dest: 'dist/icons' }
      ]
    })
  ]
})