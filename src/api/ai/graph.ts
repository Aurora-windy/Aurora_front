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
  docId: string
  fileName: string
  chars: number
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
