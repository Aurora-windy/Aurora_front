import request from '@/utils/request'

export interface GraphInfoResp {
  status: string
  databaseName: string
  entityCount: number
  relationshipCount: number
}

export interface GraphNode {
  id: string
  name: string
}

export interface GraphEdge {
  source: string
  target: string
  type: string
}

export interface GraphDataResp {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface GraphUploadResp {
  taskId: string
  docId: string
  fileName: string
  chars: number
}

/** 异步抽取任务状态：PROCESSING 进行中，SUCCESS/FAILED 为终态，UNKNOWN 表示任务已过期 */
export interface GraphTaskResp {
  status: 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'UNKNOWN'
  message: string
  triples: number
}

const BASE_URL = '/ai/graph'

export function getGraphInfo() {
  return request.get<GraphInfoResp>(BASE_URL)
}

export function sampleGraphNodes(num = 100) {
  return request.get<GraphDataResp>(`${BASE_URL}/nodes`, { params: { num } })
}

export function searchGraphEntity(entityName: string) {
  return request.get<GraphDataResp>(`${BASE_URL}/node`, { params: { entityName } })
}

export function deleteGraphEntity(entityName: string) {
  return request.delete<boolean>(`${BASE_URL}/node`, { params: { entityName } })
}

export function deleteAllGraph() {
  return request.delete<boolean>(`${BASE_URL}/all`)
}

export function uploadGraphDocument(file: File) {
  const form = new FormData()
  form.append('file', file)
  return request.post<GraphUploadResp>(`${BASE_URL}/documents/upload`, form)
}

export function getGraphTaskStatus(taskId: string) {
  return request.get<GraphTaskResp>(`${BASE_URL}/documents/${taskId}/status`)
}
