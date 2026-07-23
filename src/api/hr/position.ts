import request from '@/utils/request'
import type { ApiId } from '@/api/system/types'
import type { PositionForm, PositionResp } from './types'

const BASE_URL = '/hr/positions'

export function listPositions(deptId?: ApiId) {
  return request.get<PositionResp[]>(BASE_URL, { params: { deptId } })
}

export function addPosition(data: PositionForm) {
  return request.post<ApiId>(BASE_URL, data)
}

export function updatePosition(id: ApiId, data: PositionForm) {
  return request.put<boolean>(`${BASE_URL}/${id}`, data)
}

export function deletePosition(id: ApiId) {
  return request.delete<boolean>(`${BASE_URL}/${id}`)
}
