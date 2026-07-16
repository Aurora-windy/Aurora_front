import request from '@/utils/request'
import type { ApiId } from '@/api/system/types'
import type { ChatMessageResp, ChatSessionQuery, ChatSessionResp, PageResult } from './types'

const BASE_URL = '/ai/admin/sessions'

export function listAdminSessions(params: ChatSessionQuery) {
  return request.get<PageResult<ChatSessionResp>>(BASE_URL, { params })
}

export function listAdminSessionMessages(sessionId: ApiId) {
  return request.get<ChatMessageResp[]>(`${BASE_URL}/${sessionId}/messages`)
}
