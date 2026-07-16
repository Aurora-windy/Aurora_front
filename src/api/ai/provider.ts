import request from '@/utils/request'
import type { ApiId } from '@/api/system/types'
import type {
  EmbeddingConfigForm,
  EmbeddingConfigResp,
  PageResult,
  ProviderEnabledReq,
  ProviderForm,
  ProviderOptionResp,
  ProviderQuery,
  ProviderResp,
  ProviderTestResp,
} from './types'

const BASE_URL = '/ai'

export function listEnabledProviders() {
  return request.get<ProviderOptionResp[]>(`${BASE_URL}/providers/enabled`)
}

export function listAdminProviders(params: ProviderQuery) {
  return request.get<PageResult<ProviderResp>>(`${BASE_URL}/admin/providers`, { params })
}

export function createProvider(data: ProviderForm) {
  return request.post<ApiId>(`${BASE_URL}/admin/providers`, data)
}

export function updateProvider(id: ApiId, data: ProviderForm) {
  return request.put<boolean>(`${BASE_URL}/admin/providers/${id}`, data)
}

export function setProviderEnabled(id: ApiId, data: ProviderEnabledReq) {
  return request.patch<boolean>(`${BASE_URL}/admin/providers/${id}/enabled`, data)
}

export function testProvider(id: ApiId) {
  return request.post<ProviderTestResp>(`${BASE_URL}/admin/providers/${id}/test`)
}

export function getEmbeddingConfig() {
  return request.get<EmbeddingConfigResp | null>(`${BASE_URL}/admin/embedding-config`)
}

export function saveEmbeddingConfig(data: EmbeddingConfigForm) {
  return request.put<ApiId>(`${BASE_URL}/admin/embedding-config`, data)
}

export function testEmbeddingConfig(data: EmbeddingConfigForm) {
  return request.post<ProviderTestResp>(`${BASE_URL}/admin/embedding-config/test`, data)
}