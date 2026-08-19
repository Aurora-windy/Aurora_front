import request from '@/utils/request'
import type { ApiId } from '@/api/system/types'
import type { PageResult } from '@/api/ai/types'

export interface FileResp {
  id: ApiId
  name: string
  url: string
  fileType: string
  size: number
  createTime?: string
}

export interface FilePageQuery {
  pageNum: number
  pageSize: number
  name?: string
}

const BASE_URL = '/system/file'

export function uploadSystemFile(file: File) {
  const form = new FormData()
  form.append('file', file)
  return request.post<FileResp>(`${BASE_URL}/upload`, form)
}

export function listSystemFiles(params: FilePageQuery) {
  return request.get<PageResult<FileResp>>(BASE_URL, { params })
}

export function deleteSystemFile(id: ApiId) {
  return request.delete<boolean>(`${BASE_URL}/${id}`)
}
