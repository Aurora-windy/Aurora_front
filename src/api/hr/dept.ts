import request from '@/utils/request'
import type { ApiId } from '@/api/system/types'
import type { DeptForm, DeptResp } from './types'

const BASE_URL = '/hr/depts'

export function listDepts() {
  return request.get<DeptResp[]>(BASE_URL)
}

export function addDept(data: DeptForm) {
  return request.post<ApiId>(BASE_URL, data)
}

export function updateDept(id: ApiId, data: DeptForm) {
  return request.put<boolean>(`${BASE_URL}/${id}`, data)
}

export function deleteDept(id: ApiId) {
  return request.delete<boolean>(`${BASE_URL}/${id}`)
}
