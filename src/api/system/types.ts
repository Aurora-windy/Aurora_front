export type ApiId = string

export interface PageResult<T> {
  list: T[]
  total: number
}

export interface PageQuery {
  pageNum?: number
  pageSize?: number
}

export interface BatchIdsReq {
  ids: ApiId[]
}

export interface UserQuery extends PageQuery {
  username?: string
  nickname?: string
  status?: number
}

export interface UserResp {
  id: ApiId
  username: string
  nickname: string
  avatar?: string
  email?: string
  phone?: string
  gender?: number
  status?: number
  deptId?: ApiId
  lastLoginTime?: string
  roleIds?: ApiId[]
  roleCodes?: string[]
  createTime?: string
}

export interface UserForm {
  id?: ApiId
  username: string
  password?: string
  nickname: string
  avatar?: string
  email?: string
  phone?: string
  gender?: number
  status?: number
  deptId?: ApiId
  roleIds?: ApiId[]
}

export interface UserStatusReq {
  id: ApiId
  status: number
}

export interface UserResetPasswordReq {
  id: ApiId
  newPassword?: string
}

export interface UserAssignRoleReq {
  userId: ApiId
  roleIds: ApiId[]
}

export interface RoleQuery extends PageQuery {
  name?: string
  code?: string
  status?: number
}

export interface RoleResp {
  id: ApiId
  name: string
  code: string
  dataScope: number
  sort?: number
  status?: number
  remark?: string
  menuIds?: ApiId[]
  createTime?: string
}

export interface RoleForm {
  id?: ApiId
  name: string
  code: string
  dataScope: number
  sort?: number
  status?: number
  remark?: string
}

export interface RoleStatusReq {
  id: ApiId
  status: number
}

export interface RoleAssignMenuReq {
  roleId: ApiId
  menuIds: ApiId[]
}

export interface MenuResp {
  id: ApiId
  parentId: ApiId
  title: string
  type: number
  name?: string
  path?: string
  component?: string
  icon?: string
  permission?: string
  sort?: number
  visible?: number
  status?: number
  createTime?: string
}

export interface MenuTreeResp extends MenuResp {
  children?: MenuTreeResp[]
}

export interface UserRouteResp {
  id: ApiId
  parentId: ApiId
  title: string
  name?: string
  path?: string
  component?: string
  icon?: string
  type?: number
  sort?: number
  children?: UserRouteResp[]
}

export interface MenuForm {
  id?: ApiId
  parentId?: ApiId
  title: string
  type: number
  name?: string
  path?: string
  component?: string
  icon?: string
  permission?: string
  sort?: number
  visible?: number
  status?: number
}
