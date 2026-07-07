import request from '@/utils/request'
import type {
  PageResult,
  RoleAssignMenuReq,
  RoleForm,
  RoleQuery,
  RoleResp,
  RoleStatusReq,
} from './types'

const BASE_URL = '/system/roles'

export function listRoles(params: RoleQuery) {
  return request.get<PageResult<RoleResp>>(BASE_URL, { params })
}

export function getRole(id: number) {
  return request.get<RoleResp>(`${BASE_URL}/${id}`)
}

export function addRole(data: RoleForm) {
  return request.post<number>(BASE_URL, data)
}

export function updateRole(data: RoleForm) {
  return request.put<boolean>(BASE_URL, data)
}

export function deleteRole(id: number) {
  return request.delete<boolean>(`${BASE_URL}/${id}`)
}

export function updateRoleStatus(data: RoleStatusReq) {
  return request.post<boolean>(`${BASE_URL}/status`, data)
}

export function assignRoleMenu(data: RoleAssignMenuReq) {
  return request.post<boolean>(`${BASE_URL}/assign-menu`, data)
}
