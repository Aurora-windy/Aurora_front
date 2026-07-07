import request from '@/utils/request'
import type { MenuForm, MenuResp, MenuTreeResp, UserRouteResp } from './types'

const BASE_URL = '/system/menus'

export function listMenuTree() {
  return request.get<MenuTreeResp[]>(`${BASE_URL}/tree`)
}

export function getUserRoutes() {
  return request.get<UserRouteResp[]>(`${BASE_URL}/user-routes`)
}

export function getMenu(id: number) {
  return request.get<MenuResp>(`${BASE_URL}/${id}`)
}

export function addMenu(data: MenuForm) {
  return request.post<number>(BASE_URL, data)
}

export function updateMenu(data: MenuForm) {
  return request.put<boolean>(BASE_URL, data)
}

export function deleteMenu(id: number) {
  return request.delete<boolean>(`${BASE_URL}/${id}`)
}
