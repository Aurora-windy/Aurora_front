import type { ApiId, PageQuery } from '@/api/system/types'

export interface PageResult<T> {
  list: T[]
  total: number
}

export interface ProblemQuery extends PageQuery {
  title?: string
  difficulty?: number
  status?: number
}

export interface ProblemResp {
  id: ApiId
  title: string
  description: string
  difficulty: number
  timeLimitMs: number
  memoryLimitMb: number
  sampleInput?: string
  sampleOutput?: string
  testInput?: string
  expectedOutput?: string
  status: number
  createTime?: string
}

export interface ProblemForm {
  id?: ApiId
  title: string
  description: string
  difficulty: number
  timeLimitMs: number
  memoryLimitMb: number
  sampleInput?: string
  sampleOutput?: string
  testInput?: string
  expectedOutput?: string
  status: number
}

export interface SubmissionQuery extends PageQuery {
  problemId?: ApiId
  userId?: ApiId
  status?: number
  language?: string
}

export interface SubmissionCreateReq {
  problemId: ApiId
  language: string
  sourceCode: string
}

export interface SubmissionResp {
  id: ApiId
  problemId: ApiId
  problemTitle: string
  userId: ApiId
  language: string
  sourceCode: string
  status: number
  timeUsedMs?: number
  memoryUsedKb?: number
  errorMessage?: string
  createTime?: string
}
