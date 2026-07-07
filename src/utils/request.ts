/**
 * Axios 封装
 *
 * 设计目标：
 * 1. 业务代码直接拿 data，不用每次解包 Result
 *    - 拦截器把 { code, msg, data } 中的 data 提取出来
 *    - 调用方写 `const user = await getUser()` 直接拿到 UserVO
 *
 * 2. token 自动注入
 *    - 请求拦截器从 auth.ts 读 token，放进 Authorization 请求头
 *
 * 3. 统一错误处理
 *    - 业务失败（code != 200）弹 Arco 错误提示
 *    - 401 弹确认框跳登录
 *    - 网络错误 / 超时 / HTTP 5xx 弹错误提示
 *
 * 4. 类型安全
 *    - `request.get<UserVO>('/user')` 返回 Promise<UserVO>（不是 AxiosResponse<UserVO>）
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { Message, Modal } from '@arco-design/web-vue'
import { getToken, removeToken } from './auth'
import router from '@/router'

const SUCCESS_CODE = 200

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 30_000,
})

// 请求拦截：注入 token
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截：解包 Result、统一处理错误
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 二进制响应（文件下载等）：直接返回原始响应，业务代码自己处理 blob
    if (response.config.responseType === 'blob') {
      return response
    }

    const { code, msg, data } = response.data

    if (code === SUCCESS_CODE) {
      // 类型 trick：把 data 当作 AxiosResponse 直接 return
      // 业务代码 await request.get<User>() 拿到的就是 User
      return data as unknown as AxiosResponse
    }

    // 业务失败
    Message.error(msg || '操作失败')

    // 401：token 过期，弹确认框跳登录
    if (code === 401) {
      removeToken()
      Modal.confirm({
        title: '提示',
        content: '登录状态已过期，请重新登录',
        okText: '重新登录',
        cancelText: '取消',
        onOk: () => {
          router.push('/login')
        },
      })
    }

    return Promise.reject(new Error(msg || 'Error'))
  },
  (error) => {
    // HTTP 层错误（网络断、超时、4xx / 5xx 等）
    let message = error.message || '请求失败'

    if (message.includes('timeout')) {
      message = '请求超时，请稍后重试'
    } else if (message.includes('Network')) {
      message = '网络异常，请检查网络连接'
    } else if (error.response?.status === 404) {
      message = '接口不存在'
    } else if (error.response?.status && error.response.status >= 500) {
      message = '服务器开小差了，请稍后重试'
    }

    Message.error(message)
    return Promise.reject(error)
  },
)

/**
 * 主请求函数，业务代码不直接调，由下面的 get/post/put/delete 包装
 *
 * 类型 trick：返回 Promise<T> 而不是 Promise<AxiosResponse<T>>，
 * 因为响应拦截器已经把 data 解出来了。
 */
function request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  return service.request(config) as unknown as Promise<T>
}

request.get = <T = unknown>(url: string, config?: AxiosRequestConfig) =>
  request<T>({ ...config, method: 'GET', url })

request.post = <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  request<T>({ ...config, method: 'POST', url, data })

request.put = <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
  request<T>({ ...config, method: 'PUT', url, data })

request.delete = <T = unknown>(url: string, config?: AxiosRequestConfig) =>
  request<T>({ ...config, method: 'DELETE', url })

export default request
