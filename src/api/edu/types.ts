import type { ApiId, PageQuery } from '@/api/system/types'

export interface PageResult<T> {
  list: T[]
  total: number
}

export interface StudentQuery extends PageQuery {
  studentNo?: string
  name?: string
  status?: number
}

export interface StudentAccountOptionQuery {
  keyword?: string
  currentStudentId?: ApiId
  limit?: number
}

export interface StudentAccountOptionResp {
  userId: ApiId
  username: string
  nickname?: string
}

export interface StudentProfileStatusResp {
  bound: boolean
  enabled: boolean
  studentId?: ApiId
  message?: string
}

export interface StudentResp {
  id: ApiId
  userId?: ApiId
  studentNo: string
  name: string
  gender?: number
  phone?: string
  major?: string
  className?: string
  status?: number
  createTime?: string
}

export interface StudentForm {
  id?: ApiId
  userId?: ApiId
  studentNo: string
  name: string
  gender?: number
  phone?: string
  major?: string
  className?: string
  status?: number
}

export interface TeacherQuery extends PageQuery {
  teacherNo?: string
  name?: string
  status?: number
}

export interface TeacherResp {
  id: ApiId
  userId?: ApiId
  teacherNo: string
  name: string
  title?: number
  phone?: string
  college?: string
  status?: number
  createTime?: string
}

export interface TeacherForm {
  id?: ApiId
  userId?: ApiId
  teacherNo: string
  name: string
  title?: number
  phone?: string
  college?: string
  status?: number
}

export interface CourseQuery extends PageQuery {
  courseCode?: string
  name?: string
  teacherId?: ApiId
  category?: number
  status?: number
}

export interface CourseResp {
  id: ApiId
  courseCode: string
  name: string
  teacherId: ApiId
  category?: number
  credit?: number
  capacity: number
  selectedCount: number
  remainingCount: number
  selectionStartTime?: string
  selectionEndTime?: string
  status?: number
  createTime?: string
}

export interface CourseForm {
  id?: ApiId
  courseCode: string
  name: string
  teacherId?: ApiId
  category?: number
  credit?: number
  capacity?: number
  selectionStartTime?: string
  selectionEndTime?: string
  status?: number
}

export interface SelectionReq {
  courseId: ApiId
}

export interface SelectionResp {
  id: ApiId
  studentId: ApiId
  courseId: ApiId
  courseName?: string
  status?: number
  selectedTime?: string
  droppedTime?: string
}
