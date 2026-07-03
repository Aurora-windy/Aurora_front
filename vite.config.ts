import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      // 前端请求 /api/* 时原样转发到后端 1207（后端 context-path 也是 /api）
      // 例：前端 GET /api/system/user → 后端 GET http://localhost:1207/api/system/user
      '/api': {
        target: 'http://localhost:1207',
        changeOrigin: true,
      },
    },
  },
})
