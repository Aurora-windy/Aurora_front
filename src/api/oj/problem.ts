import request from '@/utils/request'
import type { ApiId } from '@/api/system/types'
import type { PageResult, ProblemForm, ProblemQuery, ProblemResp } from './types'

const BASE_URL = '/oj/problems'

export function listProblems(params: ProblemQuery) {
  return request.get<PageResult<ProblemResp>>(BASE_URL, { params })
}

export function listAvailableProblems(params: ProblemQuery) {
  return request.get<PageResult<ProblemResp>>(`${BASE_URL}/available`, { params })
}

export function getProblem(id: ApiId) {
  return request.get<ProblemResp>(`${BASE_URL}/${id}`)
}

export function getAvailableProblem(id: ApiId) {
  return request.get<ProblemResp>(`${BASE_URL}/available/${id}`)
}

export function addProblem(data: ProblemForm) {
  return request.post<ApiId>(BASE_URL, data)
}

export function updateProblem(id: ApiId, data: ProblemForm) {
  return request.put<boolean>(`${BASE_URL}/${id}`, data)
}

export function deleteProblem(id: ApiId) {
  return request.delete<boolean>(`${BASE_URL}/${id}`)
}
