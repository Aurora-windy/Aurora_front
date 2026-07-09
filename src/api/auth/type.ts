import type { ApiId } from '@/api/system/types'

/** 账号登录请求 */
export interface LoginReq {
  username: string
  password: string
  /** 图形验证码 */
  captcha: string
  /** 验证码标识，来自 /auth/captcha 返回的 uuid */
  uuid: string
}

/** 登录响应 */
export interface LoginResp {
  token: string
  userId: ApiId
}

/** 验证码响应 */
export interface CaptchaResp {
  uuid: string
  /** data:image/png;base64,... */
  img: string
}

/** 当前登录用户信息 */
export interface UserInfo {
  id: ApiId
  username: string
  nickname: string
  avatar: string
  roles: string[]
  permissions: string[]
}
