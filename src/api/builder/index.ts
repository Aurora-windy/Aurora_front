import request from '@/utils/request'
import type { BuilderModuleResp, BuilderParseReq, BuilderPlanResp } from './types'

const BASE_URL = '/builder'

export function listBuilderModules() {
  return request.get<BuilderModuleResp[]>(`${BASE_URL}/modules`)
}

export function parseBuilderRequirement(data: BuilderParseReq) {
  return request.post<BuilderPlanResp>(`${BASE_URL}/parse`, data)
}