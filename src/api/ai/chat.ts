import request from '@/utils/request'
import { getToken } from '@/utils/auth'
import type { ApiId } from '@/api/system/types'
import type {
  ActionResp,
  ActionResultResp,
  ChatMessageResp,
  ChatSendResp,
  ChatSessionResp,
  CreateSessionReq,
  KnowledgeCitation,
  SendMessageReq,
  ToolResult,
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

export interface StreamHandlers {
  onToken: (delta: string) => void
  onDone: (payload: { messageId: ApiId; citations?: KnowledgeCitation[]; totalTokens?: number }) => void
  onError: (message: string) => void
  onPending?: (action: ActionResp) => void
  onToolResult?: (result: ToolResult) => void
}

/**
 * 流式对话：直接 fetch 流式端点，逐行解析 SSE（event:/data:），
 * 把 token 增量回调给调用方用于逐字渲染；data 可能跨多行，按换行合并。
 */
export async function streamMessage(
  sessionId: ApiId,
  data: SendMessageReq,
  handlers: StreamHandlers,
): Promise<void> {
  const base = (import.meta.env.VITE_APP_BASE_API as string) || ''
  const url = `${base}${SESSION_URL}/${sessionId}/messages/stream`
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  })
  if (!resp.ok || !resp.body) {
    handlers.onError(`请求失败（${resp.status}）`)
    return
  }
  const reader = resp.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let eventName = ''
  let dataBuf = ''
  const dispatch = () => {
    if (!eventName) return
    const payload = dataBuf
    if (eventName === 'token') {
      handlers.onToken(payload)
    } else if (eventName === 'done') {
      try {
        handlers.onDone(JSON.parse(payload))
      } catch {
        handlers.onDone({ messageId: '' })
      }
    } else if (eventName === 'pending') {
      if (handlers.onPending) {
        try {
          handlers.onPending(JSON.parse(payload))
        } catch {
          // ignore malformed pending payload
        }
      }
    } else if (eventName === 'toolResult') {
      if (handlers.onToolResult) {
        try {
          handlers.onToolResult(JSON.parse(payload))
        } catch {
          // ignore malformed toolResult payload
        }
      }
    } else if (eventName === 'error') {
      handlers.onError(payload)
    }
    eventName = ''
    dataBuf = ''
  }
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let nl: number
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nl).replace(/\r$/, '')
      buffer = buffer.slice(nl + 1)
      if (line === '') {
        dispatch()
        continue
      }
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim()
        continue
      }
      if (line.startsWith('data:')) {
        let d = line.slice(5)
        if (d.startsWith(' ')) d = d.slice(1)
        dataBuf += (dataBuf ? '\n' : '') + d
      }
    }
  }
  dispatch()
}

export function confirmAction(actionId: ApiId) {
  return request.post<ActionResultResp>(`${ACTION_URL}/${actionId}/confirm`)
}

export function rejectAction(actionId: ApiId) {
  return request.post<ActionResultResp>(`${ACTION_URL}/${actionId}/reject`)
}