/**
 * 全局 API 类型定义
 *
 * 这里的类型与后端 aurora-common 的 Result<T>、BaseDO 等一一对应，
 * 业务模块自己的类型放在各模块的 api 文件里。
 */

/**
 * 后端统一返回格式
 *
 * 对应后端：com.aurora.common.response.Result
 *
 * code 含义：
 *   200 成功
 *   400 参数错误
 *   401 未登录 / Token 过期
 *   403 权限不足
 *   500 业务失败 / 系统异常
 */
export interface ApiResult<T = unknown> {
  code: number
  msg: string
  data: T
}

/**
 * 分页查询参数（对应后端 PageQuery）
 */
export interface PageQuery {
  /** 当前页码，从 1 开始 */
  page: number
  /** 每页大小 */
  size: number
  /** 通用模糊搜索关键字（可选） */
  keyword?: string
}

/**
 * 分页返回结果（对应后端 PageResult<T>）
 */
export interface PageResult<T> {
  /** 当前页数据 */
  list: T[]
  /** 总条数（用于前端计算总页数） */
  total: number
}

/**
 * 审计字段（对应后端 BaseDO 的字段）
 *
 * 所有从数据库查出来的实体都会有这几个字段。
 */
export interface BaseEntity {
  id?: string
  createUser?: string
  createTime?: string
  updateUser?: string
  updateTime?: string
  deleted?: number
}
