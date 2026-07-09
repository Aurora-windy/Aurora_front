import request from '@/utils/request'
import type { ApiId } from '@/api/system/types'
import type { PageResult, StudentForm, StudentQuery, StudentResp } from './types'

const BASE_URL = '/edu/students'

export function listStudents(params: StudentQuery) {
  return request.get<PageResult<StudentResp>>(BASE_URL, { params })
}

export function getStudent(id: ApiId) {
  return request.get<StudentResp>(`${BASE_URL}/${id}`)
}

export function addStudent(data: StudentForm) {
  return request.post<ApiId>(BASE_URL, data)
}

export function updateStudent(data: StudentForm) {
  return request.put<boolean>(BASE_URL, data)
}

export function deleteStudent(id: ApiId) {
  return request.delete<boolean>(`${BASE_URL}/${id}`)
}
