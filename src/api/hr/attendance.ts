import request from '@/utils/request'
import type { ApiId } from '@/api/system/types'

export interface AttendanceQuery {
  pageNum?: number
  pageSize?: number
  deptId?: ApiId
  empId?: ApiId
  status?: number
  dateFrom?: string
  dateTo?: string
}

export interface AttendanceResp {
  id: ApiId
  empId: ApiId
  empName?: string
  empNo?: string
  deptName?: string
  attendanceDate: string
  clockInTime?: string
  clockOutTime?: string
  status: number
  remark?: string
  createTime?: string
}

export interface AppealResp {
  id: ApiId
  attendanceId: ApiId
  empId: ApiId
  empName?: string
  empNo?: string
  attendanceDate?: string
  attendanceStatus?: number
  reason: string
  status: number
  auditUserId?: ApiId
  auditRemark?: string
  auditTime?: string
  createTime?: string
}

export interface AppealSubmitForm {
  attendanceId: ApiId
  reason: string
}

export interface AppealAuditForm {
  status: number
  auditRemark?: string
}

export interface AppealQuery {
  pageNum?: number
  pageSize?: number
  status?: number
}

export interface PageResult<T> {
  list: T[]
  total: number
}

// ===== 员工自助 =====

export function clockIn() {
  return request.post<AttendanceResp>('/hr/attendance/clock-in')
}

export function myRecords(year?: number, month?: number, pageNum = 1, pageSize = 31) {
  return request.get<PageResult<AttendanceResp>>('/hr/attendance/my', {
    params: { year, month, pageNum, pageSize },
  })
}

export function myAppeals() {
  return request.get<AppealResp[]>('/hr/attendance/appeals/my')
}

export function submitAppeal(data: AppealSubmitForm) {
  return request.post<ApiId>('/hr/attendance/appeals', data)
}

// ===== 管理员 =====

export function listRecords(params: AttendanceQuery) {
  return request.get<PageResult<AttendanceResp>>('/hr/attendance/records', { params })
}

export function listAppeals(params: AppealQuery) {
  return request.get<PageResult<AppealResp>>('/hr/attendance/appeals', { params })
}

export function auditAppeal(id: ApiId, data: AppealAuditForm) {
  return request.put<boolean>(`/hr/attendance/appeals/${id}/audit`, data)
}
