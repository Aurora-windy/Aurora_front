export interface PageResult<T> {
  list: T[]
  total: number
}

export interface PageQuery {
  pageNum?: number
  pageSize?: number
}

export interface BatchIdsReq {
  ids: number[]
}

export interface UserQuery extends PageQuery {
  username?: string
  nickname?: string
  status?: number
}

export interface UserResp {
  id: number
  username: string
  nickname: string
  avatar?: string
  email?: string
  phone?: string
  gender?: number
  status?: number
  deptId?: number
  lastLoginTime?: string
  roleIds?: number[]
  roleCodes?: string[]
  createTime?: string
}

export interface UserForm {
  id?: number
  username: string
  password?: string
  nickname: string
  avatar?: string
  email?: string
  phone?: string
  gender?: number
  status?: number
  deptId?: number
  roleIds?: number[]
}

export interface UserStatusReq {
  id: number
  status: number
}

export interface UserResetPasswordReq {
  id: number
  newPassword?: string
}

export interface UserAssignRoleReq {
  userId: number
  roleIds: number[]
}

export interface RoleQuery extends PageQuery {
  name?: string
  code?: string
  status?: number
}

export interface RoleResp {
  id: number
  name: string
  code: string
  dataScope: number
  sort?: number
  status?: number
  remark?: string
  menuIds?: number[]
  createTime?: string
}

export interface RoleForm {
  id?: number
  name: string
  code: string
  dataScope: number
  sort?: number
  status?: number
  remark?: string
}

export interface RoleStatusReq {
  id: number
  status: number
}

export interface RoleAssignMenuReq {
  roleId: number
  menuIds: number[]
}

export interface MenuResp {
  id: number
  parentId: number
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
  id: number
  parentId: number
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
  id?: number
  parentId?: number
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
