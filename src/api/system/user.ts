import request from '@/utils/request'
import type {
  BatchIdsReq,
  PageResult,
  UserAssignRoleReq,
  UserForm,
  UserQuery,
  UserResetPasswordReq,
  UserResp,
  UserStatusReq,
  ApiId,
} from './types'

const BASE_URL = '/system/users'

export function listUsers(params: UserQuery) {
  return request.get<PageResult<UserResp>>(BASE_URL, { params })
}

export function getUser(id: ApiId) {
  return request.get<UserResp>(`${BASE_URL}/${id}`)
}

export function addUser(data: UserForm) {
  return request.post<ApiId>(BASE_URL, data)
}

export function updateUser(data: UserForm) {
  return request.put<boolean>(BASE_URL, data)
}

export function deleteUser(id: ApiId) {
  return request.delete<boolean>(`${BASE_URL}/${id}`)
}

export function deleteUsers(data: BatchIdsReq) {
  return request.delete<boolean>(`${BASE_URL}/batch`, { data })
}

export function updateUserStatus(data: UserStatusReq) {
  return request.post<boolean>(`${BASE_URL}/status`, data)
}

export function resetUserPassword(data: UserResetPasswordReq) {
  return request.post<boolean>(`${BASE_URL}/reset-password`, data)
}

export function assignUserRole(data: UserAssignRoleReq) {
  return request.post<boolean>(`${BASE_URL}/assign-role`, data)
}
