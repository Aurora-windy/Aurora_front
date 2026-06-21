import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// Vitest 配置（独立于 vite.config.ts，避免污染生产构建）
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // 测试环境：jsdom 模拟浏览器 DOM
    environment: 'jsdom',
    // 全局 API：可以直接用 describe / it / expect 不用 import
    globals: true,
    // 测试文件匹配规则
    include: ['src/**/__tests__/**/*.spec.ts'],
    // 覆盖率
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
})
