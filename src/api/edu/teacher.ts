import request from '@/utils/request'
import type { ApiId } from '@/api/system/types'
import type { PageResult, TeacherForm, TeacherQuery, TeacherResp } from './types'

const BASE_URL = '/edu/teachers'

export function listTeachers(params: TeacherQuery) {
  return request.get<PageResult<TeacherResp>>(BASE_URL, { params })
}

export function getTeacher(id: ApiId) {
  return request.get<TeacherResp>(`${BASE_URL}/${id}`)
}

export function addTeacher(data: TeacherForm) {
  return request.post<ApiId>(BASE_URL, data)
}

export function updateTeacher(data: TeacherForm) {
  return request.put<boolean>(BASE_URL, data)
}

export function deleteTeacher(id: ApiId) {
  return request.delete<boolean>(`${BASE_URL}/${id}`)
}
