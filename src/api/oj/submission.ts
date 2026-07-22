import request from '@/utils/request'
import type { ApiId } from '@/api/system/types'
import type { PageResult, SubmissionCreateReq, SubmissionQuery, SubmissionResp } from './types'

const BASE_URL = '/oj/submissions'

export function submitCode(data: SubmissionCreateReq) {
  return request.post<ApiId>(BASE_URL, data)
}

export function listMySubmissions(params: SubmissionQuery) {
  return request.get<PageResult<SubmissionResp>>(`${BASE_URL}/my`, { params })
}

export function listSubmissions(params: SubmissionQuery) {
  return request.get<PageResult<SubmissionResp>>(BASE_URL, { params })
}
