import type * as T from './type'
import request from '@/utils/request'

export type * from './type'

const BASE_URL = '/auth'

/** 获取图形验证码 */
export function getCaptcha() {
  return request.get<T.CaptchaResp>(`${BASE_URL}/captcha`)
}

/** 账号登录 */
export function login(req: T.LoginReq) {
  return request.post<T.LoginResp>(`${BASE_URL}/login`, req)
}

/** 登出 */
export function logout() {
  return request.post(`${BASE_URL}/logout`)
}

/** 获取当前登录用户信息 */
export function getUserInfo() {
  return request.get<T.UserInfo>(`${BASE_URL}/user/info`)
}
