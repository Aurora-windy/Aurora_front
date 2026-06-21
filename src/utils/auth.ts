/**
 * Token 管理（基于 localStorage）
 *
 * SRS 要求 token 持久化（刷新页面不丢登录态），所以放 localStorage。
 *
 * Phase 1 接入登录接口后，登录成功调用 setToken(token)，
 * 登出调用 removeToken()。axios 请求拦截器自动调用 getToken() 注入。
 */

const ACCESS_TOKEN_KEY = 'aurora:access_token'

export function getToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function removeToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}
