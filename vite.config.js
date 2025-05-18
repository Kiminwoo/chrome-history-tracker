import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
// @ts-ignore
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
    base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'), // 기존 팝업 UI
      },
      output: {
        entryFileNames: '[name].js' // [name] 부분이 input 키와 매칭됨
      }
    }
  },
    plugins: [
        react(),
        viteStaticCopy({
            targets: [
                { src: 'public/manifest.json', dest: '.' },
                { src: 'public/icons/*', dest: 'icons' }
            ]
            })
    ], 
    server: {
    watch: {
      usePolling: true // WSL, Docker 등 가상 환경에서 필수
    },
    hmr: true // HMR 활성화 (기본값 true)
  }
});
