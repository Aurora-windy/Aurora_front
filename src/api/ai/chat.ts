import request from '@/utils/request'
import type { ApiId } from '@/api/system/types'
import type {
  ActionResultResp,
  ChatMessageResp,
  ChatSendResp,
  ChatSessionResp,
  CreateSessionReq,
  SendMessageReq,
} from './types'

const SESSION_URL = '/ai/sessions'
const ACTION_URL = '/ai/actions'

export function createSession(data: CreateSessionReq) {
  return request.post<ChatSessionResp>(SESSION_URL, data)
}

export function listSessions() {
  return request.get<ChatSessionResp[]>(SESSION_URL)
}

export function listMessages(sessionId: ApiId) {
  return request.get<ChatMessageResp[]>(`${SESSION_URL}/${sessionId}/messages`)
}

export function sendMessage(sessionId: ApiId, data: SendMessageReq) {
  return request.post<ChatSendResp>(`${SESSION_URL}/${sessionId}/messages`, data)
}

export function confirmAction(actionId: ApiId) {
  return request.post<ActionResultResp>(`${ACTION_URL}/${actionId}/confirm`)
}

export function rejectAction(actionId: ApiId) {
  return request.post<ActionResultResp>(`${ACTION_URL}/${actionId}/reject`)
}