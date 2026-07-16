import request from '@/utils/request'
import type { PageResult, ToolCallLogQuery, ToolCallLogResp } from './types'

const BASE_URL = '/ai/admin/audit/tool-calls'

export function listToolCallLogs(params: ToolCallLogQuery) {
  return request.get<PageResult<ToolCallLogResp>>(BASE_URL, { params })
}
