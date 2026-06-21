/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

interface ImportMetaEnv {
  /** 后端 API 基础路径（开发期通过 vite proxy 代理到 localhost:8080） */
  readonly VITE_APP_BASE_API: string
  /** 站点标题 */
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
