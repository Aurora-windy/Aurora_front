import request from '@/utils/request'
import type { ApiId } from '@/api/system/types'
import type {
  McpServerEnabledReq,
  McpServerForm,
  McpServerQuery,
  McpServerResp,
  McpServerSyncResp,
  PageResult,
} from './types'

const BASE_URL = '/ai/admin/mcp-servers'

export function listMcpServers(params: McpServerQuery) {
  return request.get<PageResult<McpServerResp>>(BASE_URL, { params })
}

export function createMcpServer(data: McpServerForm) {
  return request.post<ApiId>(BASE_URL, data)
}

export function updateMcpServer(id: ApiId, data: McpServerForm) {
  return request.put<boolean>(`${BASE_URL}/${id}`, data)
}

export function setMcpServerEnabled(id: ApiId, data: McpServerEnabledReq) {
  return request.patch<boolean>(`${BASE_URL}/${id}/enabled`, data)
}

export function syncMcpServer(id: ApiId) {
  return request.post<McpServerSyncResp>(`${BASE_URL}/${id}/sync`)
}

export function deleteMcpServer(id: ApiId) {
  return request.delete<boolean>(`${BASE_URL}/${id}`)
}

export function getMcpDemoStatus() {
  return request.get<{ running: boolean; port: number }>('/ai/admin/mcp-demo/status')
}

export function startMcpDemo() {
  return request.post<{ running: boolean; port: number }>('/ai/admin/mcp-demo/start')
}

export function stopMcpDemo() {
  return request.post<{ running: boolean; port: number }>('/ai/admin/mcp-demo/stop')
}
