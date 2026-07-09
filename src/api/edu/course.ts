import request from '@/utils/request'
import type { ApiId } from '@/api/system/types'
import type { CourseForm, CourseQuery, CourseResp, PageResult } from './types'

const BASE_URL = '/edu/courses'

export function listCourses(params: CourseQuery) {
  return request.get<PageResult<CourseResp>>(BASE_URL, { params })
}

export function listAvailableCourses(params: CourseQuery) {
  return request.get<PageResult<CourseResp>>(`${BASE_URL}/available`, { params })
}

export function getCourse(id: ApiId) {
  return request.get<CourseResp>(`${BASE_URL}/${id}`)
}

export function addCourse(data: CourseForm) {
  return request.post<ApiId>(BASE_URL, data)
}

export function updateCourse(data: CourseForm) {
  return request.put<boolean>(BASE_URL, data)
}

export function deleteCourse(id: ApiId) {
  return request.delete<boolean>(`${BASE_URL}/${id}`)
}
