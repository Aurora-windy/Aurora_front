import request from '@/utils/request'
import type { ApiId } from '@/api/system/types'
import type {
  KnowledgeCitation,
  KnowledgeDocForm,
  KnowledgeDocQuery,
  KnowledgeDocResp,
  KnowledgePublishResp,
  KnowledgeSearchReq,
  PageResult,
} from './types'

const BASE_URL = '/ai/admin/knowledge-docs'

export function listKnowledgeDocs(params: KnowledgeDocQuery) {
  return request.get<PageResult<KnowledgeDocResp>>(BASE_URL, { params })
}

export function getKnowledgeDoc(id: ApiId) {
  return request.get<KnowledgeDocResp>(`${BASE_URL}/${id}`)
}

export function createKnowledgeDoc(data: KnowledgeDocForm) {
  return request.post<ApiId>(BASE_URL, data)
}

export function updateKnowledgeDoc(id: ApiId, data: KnowledgeDocForm) {
  return request.put<boolean>(`${BASE_URL}/${id}`, data)
}

export function deleteKnowledgeDoc(id: ApiId) {
  return request.delete<boolean>(`${BASE_URL}/${id}`)
}

export function publishKnowledgeDoc(id: ApiId) {
  return request.post<KnowledgePublishResp>(`${BASE_URL}/${id}/publish`)
}

export function rebuildKnowledgeEmbedding(id: ApiId) {
  return request.post<KnowledgePublishResp>(`${BASE_URL}/${id}/rebuild-embedding`)
}

export function offlineKnowledgeDoc(id: ApiId) {
  return request.post<boolean>(`${BASE_URL}/${id}/offline`)
}

export function searchKnowledge(data: KnowledgeSearchReq) {
  return request.post<KnowledgeCitation[]>(`${BASE_URL}/search`, data)
}