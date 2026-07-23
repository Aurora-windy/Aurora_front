import request from '@/utils/request'
import type { ApiId } from '@/api/system/types'
import type { EmployeeForm, EmployeeQuery, EmployeeResp, PageResult } from './types'

const BASE_URL = '/hr/employees'

export function listEmployees(params: EmployeeQuery) {
  return request.get<PageResult<EmployeeResp>>(BASE_URL, { params })
}

export function getEmployee(id: ApiId) {
  return request.get<EmployeeResp>(`${BASE_URL}/${id}`)
}

export function addEmployee(data: EmployeeForm) {
  return request.post<ApiId>(BASE_URL, data)
}

export function updateEmployee(id: ApiId, data: EmployeeForm) {
  return request.put<boolean>(`${BASE_URL}/${id}`, data)
}

export function deleteEmployee(id: ApiId) {
  return request.delete<boolean>(`${BASE_URL}/${id}`)
}
