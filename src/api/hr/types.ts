import type { ApiId, PageQuery } from '@/api/system/types'

export interface PageResult<T> {
  list: T[]
  total: number
}

export interface DeptResp {
  id: ApiId
  parentId?: ApiId
  deptName: string
  deptCode?: string
  sort: number
  status: number
  createTime?: string
}

export interface DeptForm {
  id?: ApiId
  parentId?: ApiId
  deptName: string
  deptCode?: string
  sort?: number
  status?: number
}

export interface PositionResp {
  id: ApiId
  deptId: ApiId
  positionName: string
  positionCode?: string
  sort: number
  status: number
  createTime?: string
}

export interface PositionForm {
  id?: ApiId
  deptId?: ApiId
  positionName: string
  positionCode?: string
  sort?: number
  status?: number
}

export interface EmployeeQuery extends PageQuery {
  deptId?: ApiId
  status?: number
  keyword?: string
}

export interface EmployeeResp {
  id: ApiId
  empNo: string
  userId?: ApiId
  deptId: ApiId
  positionId: ApiId
  name: string
  gender?: number
  phone?: string
  entryDate?: string
  status: number
  createTime?: string
}

export interface EmployeeForm {
  id?: ApiId
  empNo: string
  userId?: ApiId
  deptId?: ApiId
  positionId?: ApiId
  name: string
  gender?: number
  phone?: string
  entryDate?: string
  status?: number
}
