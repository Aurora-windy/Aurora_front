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
  ToolStatus,
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

export function setLocalFilesEnabled(sessionId: ApiId, enabled: boolean) {
  return request.patch<boolean>(`${SESSION_URL}/${sessionId}/capabilities/local-files`, { enabled })
}

export function sendMessage(sessionId: ApiId, data: SendMessageReq) {
  return request.post<ChatSendResp>(`${SESSION_URL}/${sessionId}/messages`, data)
}

export interface StreamHandlers {
  onToken: (delta: string) => void
  onDone: (payload: {
    messageId: ApiId
    citations?: KnowledgeCitation[]
    totalTokens?: number
    resumedFromActionId?: ApiId
  }) => void
  onError: (message: string) => void
  onPending?: (action: ActionResp) => void
  onToolResult?: (result: ToolResult) => void
  /** FC 循环期间的工具调用步骤提示（T5：页面工具状态指示） */
  onToolStatus?: (status: ToolStatus) => void
}

/** 逐行解析 SSE 响应流（event:/data:），data 可能跨多行，按换行合并后分发 */
async function parseSseStream(resp: Response, handlers: StreamHandlers): Promise<void> {
  const reader = resp.body!.getReader()
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
    } else if (eventName === 'toolStatus') {
      if (handlers.onToolStatus) {
        try {
          handlers.onToolStatus(JSON.parse(payload))
        } catch {
          // ignore malformed toolStatus payload
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

async function fetchSse(url: string, body: object, handlers: StreamHandlers): Promise<void> {
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
  })
  if (!resp.ok || !resp.body) {
    handlers.onError(`请求失败（${resp.status}）`)
    return
  }
  await parseSseStream(resp, handlers)
}

/**
 * 流式对话：直接 fetch 流式端点，逐行解析 SSE，
 * 把 token 增量回调给调用方用于逐字渲染。
 */
export async function streamMessage(
  sessionId: ApiId,
  data: SendMessageReq,
  handlers: StreamHandlers,
): Promise<void> {
  const base = (import.meta.env.VITE_APP_BASE_API as string) || ''
  await fetchSse(`${base}${SESSION_URL}/${sessionId}/messages/stream`, data, handlers)
}

/**
 * 确认/拒绝后续聊（T5）：confirm/reject 成功后自动调用，
 * 后端从 action 表重建上下文，流式产出汇报回复（token/toolStatus/done）。
 */
export async function resumeStream(
  sessionId: ApiId,
  actionId: ApiId,
  handlers: StreamHandlers,
): Promise<void> {
  const base = (import.meta.env.VITE_APP_BASE_API as string) || ''
  await fetchSse(`${base}${SESSION_URL}/${sessionId}/actions/${actionId}/resume`, {}, handlers)
}

export function confirmAction(actionId: ApiId) {
  return request.post<ActionResultResp>(`${ACTION_URL}/${actionId}/confirm`)
}

export function rejectAction(actionId: ApiId) {
  return request.post<ActionResultResp>(`${ACTION_URL}/${actionId}/reject`)
}
