import request from '@/utils/request'
import type { ApiId } from '@/api/system/types'
import type { SelectionReq, SelectionResp } from './types'

const BASE_URL = '/edu/selections'

export function listMySelections() {
  return request.get<SelectionResp[]>(`${BASE_URL}/my`)
}

export function selectCourse(data: SelectionReq) {
  return request.post<ApiId>(BASE_URL, data)
}

export function dropCourse(courseId: ApiId) {
  return request.delete<boolean>(`${BASE_URL}/${courseId}`)
}
