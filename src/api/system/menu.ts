import request from '@/utils/request'
import type { ApiId, MenuForm, MenuResp, MenuTreeResp, UserRouteResp } from './types'

const BASE_URL = '/system/menus'

export function listMenuTree() {
  return request.get<MenuTreeResp[]>(`${BASE_URL}/tree`)
}

export function getUserRoutes() {
  return request.get<UserRouteResp[]>(`${BASE_URL}/user-routes`)
}

export function getMenu(id: ApiId) {
  return request.get<MenuResp>(`${BASE_URL}/${id}`)
}

export function addMenu(data: MenuForm) {
  return request.post<ApiId>(BASE_URL, data)
}

export function updateMenu(data: MenuForm) {
  return request.put<boolean>(BASE_URL, data)
}

export function deleteMenu(id: ApiId) {
  return request.delete<boolean>(`${BASE_URL}/${id}`)
}
