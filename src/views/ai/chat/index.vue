<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { confirmAction, createSession, listMessages, listSessions, rejectAction, resumeStream, setLocalFilesEnabled, streamMessage } from '@/api/ai/chat'
import type { StreamHandlers } from '@/api/ai/chat'
import { listEnabledProviders } from '@/api/ai/provider'
import { renderMarkdown } from '@/utils/markdown'
import type { ActionResp, ChatMessageResp, ChatSessionResp, KnowledgeCitation, ProviderOptionResp } from '@/api/ai/types'

const loadingSessions = ref(false)
const loadingMessages = ref(false)
const sending = ref(false)
const acting = ref(false)
const providers = ref<ProviderOptionResp[]>([])
const sessions = ref<ChatSessionResp[]>([])
const messages = ref<ChatMessageResp[]>([])
const currentSessionId = ref<string>()
const selectedProviderId = ref<string>()
const input = ref('')
const useKnowledgeBase = ref(true)
const localFilesEnabled = ref(false)
const pendingAction = ref<ActionResp>()
const citationDrawerVisible = ref(false)
const activeCitations = ref<KnowledgeCitation[]>([])
/** 正在等待模型首 token 的助手消息（显示"思考中..."） */
const thinkingIds = ref<Set<string>>(new Set())

/** 工具调用步骤（T5）：流式期间按消息 id 收集 toolStatus 事件；刷新后从 metadata.toolTrace 读取 */
interface ToolStep {
  round: number
  toolName: string
  status: string
}
const liveSteps = reactive(new Map<string, ToolStep[]>())

function toolStepsOf(message: ChatMessageResp): ToolStep[] {
  const live = liveSteps.get(message.id)
  if (live?.length) return live
  const metadata = parseMetadata(message)
  return (metadata?.toolTrace ?? []) as ToolStep[]
}

function toolStepText(step: ToolStep) {
  const phase = step.status === 'start'
    ? '调用中…'
    : step.status === 'success'
      ? '调用成功'
      : step.status === 'failed'
        ? '调用失败'
        : step.status === 'pending'
          ? '等待确认'
          : step.status
  return `第 ${step.round} 轮 · ${step.toolName} · ${phase}`
}

function messageCitations(message: ChatMessageResp): KnowledgeCitation[] {
  if (message.role !== 'assistant') return []
  const metadata = parseMetadata(message)
  return metadata?.citations ?? []
}

function scorePercent(score?: number) {
  return Math.round((score ?? 0) * 100)
}

function openCitationDrawer(message: ChatMessageResp) {
  activeCitations.value = messageCitations(message)
  citationDrawerVisible.value = true
}

const newSessionForm = reactive({
  title: '',
})

const currentSession = computed(() => sessions.value.find((item) => item.id === currentSessionId.value))
const currentProvider = computed(() => providers.value.find((item) => item.id === selectedProviderId.value || item.id === currentSession.value?.providerId))

function roleText(role: string) {
  if (role === 'user') return '用户'
  if (role === 'assistant') return '助手'
  if (role === 'system') return '系统'
  return role
}

function actionStatusText(status?: string) {
  if (status === 'PENDING_CONFIRM') return '待确认'
  if (status === 'CONFIRMED') return '已确认'
  if (status === 'REJECTED') return '已拒绝'
  if (status === 'EXECUTED') return '已执行'
  if (status === 'FAILED') return '执行失败'
  return status || '-'
}

function parseMetadata(message: ChatMessageResp) {
  if (!message.metadataJson) return null
  try {
    return JSON.parse(message.metadataJson)
  } catch {
    return null
  }
}

async function loadProviders() {
  providers.value = await listEnabledProviders()
  if (!selectedProviderId.value && providers.value.length) {
    selectedProviderId.value = providers.value[0]!.id
  }
}

async function loadSessions() {
  loadingSessions.value = true
  try {
    sessions.value = await listSessions()
    if (!currentSessionId.value && sessions.value.length) {
      await selectSession(sessions.value[0]!.id)
    }
  } finally {
    loadingSessions.value = false
  }
}

async function selectSession(sessionId: string) {
  currentSessionId.value = sessionId
  const session = sessions.value.find((item) => item.id === sessionId)
  if (session?.providerId) selectedProviderId.value = session.providerId
  localFilesEnabled.value = session?.localFilesEnabled === true
  await loadMessages(sessionId)
}

async function handleToggleLocalFiles() {
  if (!currentSessionId.value) return
  const next = !localFilesEnabled.value
  localFilesEnabled.value = next
  try {
    await setLocalFilesEnabled(currentSessionId.value, next)
    Message.success(next ? '已开启本地工作区读取' : '已关闭本地工作区读取')
  } catch {
    localFilesEnabled.value = !next
  }
}

async function loadMessages(sessionId = currentSessionId.value) {
  if (!sessionId) return
  loadingMessages.value = true
  try {
    messages.value = await listMessages(sessionId)
  } finally {
    loadingMessages.value = false
  }
}

async function handleCreateSession() {
  const session = await createSession({ title: newSessionForm.title || '新对话', providerId: selectedProviderId.value })
  Message.success('会话已创建')
  newSessionForm.title = ''
  await loadSessions()
  await selectSession(session.id)
}

function handleComposerKeydown(e: KeyboardEvent) {
  // Enter 发送，Shift+Enter 换行（与 shanxi 大模型系统一致）
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

/**
 * 占位助手消息 + 流式机械（T5 抽取，发送与续聊共用）：
 * 40ms 合并一次 token 更新，避免长消息逐字触发 Vue 全量重渲染 + Markdown 重解析导致卡顿。
 */
function beginAssistantStream(): { handlers: StreamHandlers; finish: () => void } {
  const sessionId = currentSessionId.value!
  const assistantMsg = reactive<ChatMessageResp>({
    id: `temp-${Date.now()}-a`,
    sessionId,
    role: 'assistant',
    content: '',
  })
  messages.value.push(assistantMsg)
  thinkingIds.value.add(assistantMsg.id)
  let pending = ''
  let renderTimer: number | null = null
  const flushBuffer = () => {
    if (pending) {
      assistantMsg.content += pending
      pending = ''
    } else if (renderTimer !== null) {
      window.clearInterval(renderTimer)
      renderTimer = null
    }
  }
  const clearTimer = () => {
    if (renderTimer !== null) {
      window.clearInterval(renderTimer)
      renderTimer = null
    }
  }
  const handlers: StreamHandlers = {
    onToken: (delta) => {
      pending += delta
      thinkingIds.value.delete(assistantMsg.id)
      if (renderTimer === null) {
        renderTimer = window.setInterval(flushBuffer, 40)
      }
    },
    onDone: (payload) => {
      // 工具步骤跟随真实 messageId（刷新后由服务端 metadata.toolTrace 提供）
      const steps = liveSteps.get(assistantMsg.id)
      if (steps?.length && payload.messageId) {
        liveSteps.set(String(payload.messageId), steps)
        liveSteps.delete(assistantMsg.id)
      }
      assistantMsg.id = payload.messageId
      if (payload.citations && payload.citations.length) {
        assistantMsg.metadataJson = JSON.stringify({ citations: payload.citations })
      }
    },
    onPending: (action) => {
      pendingAction.value = action
    },
    onToolStatus: (status) => {
      const steps = liveSteps.get(assistantMsg.id) ?? []
      // start 行在收到 success/failed 时原位更新；pending（mutation 挂起）独立成行
      const idx = status.phase === 'start'
        ? -1
        : steps.findIndex((s) => s.round === status.round && s.toolName === status.toolName && s.status === 'start')
      if (idx >= 0) {
        steps[idx] = { round: status.round, toolName: status.toolName, status: status.phase }
      } else {
        steps.push({ round: status.round, toolName: status.toolName, status: status.phase })
      }
      liveSteps.set(assistantMsg.id, steps)
    },
    onError: (message) => {
      clearTimer()
      flushBuffer()
      assistantMsg.content += `\n\n（出错：${message}）`
      Message.error(message)
    },
  }
  return {
    handlers,
    finish: () => {
      clearTimer()
      flushBuffer()
      thinkingIds.value.delete(assistantMsg.id)
    },
  }
}

async function handleSend() {
  if (!currentSessionId.value) {
    await handleCreateSession()
  }
  if (!currentSessionId.value || !input.value.trim()) return
  const content = input.value.trim()
  const sessionId = currentSessionId.value
  input.value = ''
  sending.value = true
  // 乐观插入用户消息（后端在流式链路内落库，此处仅用于即时渲染）
  messages.value.push({
    id: `temp-${Date.now()}`,
    sessionId,
    role: 'user',
    content,
  })
  const stream = beginAssistantStream()
  try {
    await streamMessage(sessionId, { content, useKnowledgeBase: useKnowledgeBase.value }, stream.handlers)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    stream.handlers.onError(`请求失败：${msg}`)
  } finally {
    stream.finish()
    sending.value = false
  }
  await loadSessions()
}

/** 确认/拒绝后自动续聊（T5）：后端从 action 表重建上下文，流式汇报执行结果 */
async function startResumeStream(action: ActionResp) {
  if (!currentSessionId.value) return
  const sessionId = currentSessionId.value
  const stream = beginAssistantStream()
  try {
    await resumeStream(sessionId, action.id, stream.handlers)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    stream.handlers.onError(`续聊请求失败：${msg}`)
  } finally {
    stream.finish()
  }
  await loadSessions()
}

async function handleConfirm(action: ActionResp) {
  acting.value = true
  try {
    const result = await confirmAction(action.id)
    Message.success(`执行状态：${result.status}`)
    pendingAction.value = undefined
    await startResumeStream(action)
  } finally {
    acting.value = false
  }
}

async function handleReject(action: ActionResp) {
  acting.value = true
  try {
    const result = await rejectAction(action.id)
    Message.success(`执行状态：${result.status}`)
    pendingAction.value = undefined
    await startResumeStream(action)
  } finally {
    acting.value = false
  }
}

onMounted(async () => {
  await loadProviders()
  await loadSessions()
})
</script>

<template>
  <div class="ai-chat-page">
    <aside class="session-panel">
      <div class="panel-title">AI 会话</div>
      <a-select v-model="selectedProviderId" placeholder="选择模型" allow-clear>
        <a-option v-for="provider in providers" :key="provider.id" :value="provider.id">
          {{ provider.name }} / {{ provider.model }}
        </a-option>
      </a-select>
      <a-input v-model="newSessionForm.title" allow-clear placeholder="新会话标题" />
      <a-button type="primary" long @click="handleCreateSession">新建会话</a-button>
      <a-spin :loading="loadingSessions">
        <div class="session-list">
          <button
            v-for="session in sessions"
            :key="session.id"
            class="session-item"
            :class="{ active: session.id === currentSessionId }"
            @click="selectSession(session.id)"
          >
            <span>{{ session.title }}</span>
            <small>{{ session.model || '未选择模型' }}</small>
          </button>
        </div>
      </a-spin>
    </aside>

    <main class="chat-main">
      <div class="chat-header">
        <div>
          <h3>{{ currentSession?.title || 'AI 对话' }}</h3>
          <p>{{ currentProvider ? `${currentProvider.name} / ${currentProvider.model}` : '选择模型后开始对话' }}</p>
        </div>
      </div>
      <a-spin :loading="loadingMessages">
        <div class="message-list">
          <a-empty v-if="!messages.length" description="暂无消息" />
          <div v-for="message in messages" :key="message.id" class="message-row" :class="message.role">
            <div class="message-bubble">
              <a-card :bordered="false" class="message-card">
                <template #title>{{ roleText(message.role) }}</template>
                <!-- 工具调用步骤（T5）：流式期间实时显示，刷新后从 metadata.toolTrace 还原 -->
                <div v-if="toolStepsOf(message).length" class="tool-steps">
                  <div
                    v-for="(step, i) in toolStepsOf(message)"
                    :key="i"
                    class="tool-step"
                    :data-phase="step.status"
                  >
                    <span class="tool-step-icon">⚙</span>
                    <span>{{ toolStepText(step) }}</span>
                  </div>
                </div>
                <div v-if="message.role === 'user'" class="message-content">{{ message.content }}</div>
                <div v-else-if="!message.content && thinkingIds.has(message.id)" class="thinking">
                  <span class="thinking-dots"><i></i><i></i><i></i></span>
                  思考中...
                </div>
                <div v-else-if="!message.content" class="thinking-failed">（未收到回复）</div>
                <div v-else class="message-content markdown-body" v-html="renderMarkdown(message.content)"></div>
              </a-card>
              <div v-if="messageCitations(message).length" class="citation-capsules">
                <button
                  v-for="(cite, i) in messageCitations(message)"
                  :key="cite.chunkId ?? i"
                  class="citation-capsule"
                  @click="openCitationDrawer(message)"
                >
                  <icon-file />
                  <span class="cite-title">{{ cite.docTitle }}</span>
                  <span class="cite-score">{{ scorePercent(cite.score) }}%</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </a-spin>
      <div class="composer">
        <div class="composer-toolbar">
          <a-button
            size="mini"
            :type="useKnowledgeBase ? 'primary' : 'secondary'"
            :status="useKnowledgeBase ? 'normal' : 'warning'"
            @click="useKnowledgeBase = !useKnowledgeBase"
          >
            {{ useKnowledgeBase ? '调用知识库' : '未调用知识库' }}
          </a-button>
          <a-button
            size="mini"
            :type="localFilesEnabled ? 'primary' : 'secondary'"
            :status="localFilesEnabled ? 'normal' : 'warning'"
            @click="handleToggleLocalFiles"
          >
            {{ localFilesEnabled ? '本地工作区已开启' : '本地工作区已关闭' }}
          </a-button>
        </div>
        <div class="composer-input">
          <a-textarea v-model="input" placeholder="输入问题，Enter 发送，Shift+Enter 换行" :auto-size="{ minRows: 3, maxRows: 6 }" @keydown="handleComposerKeydown" />
          <a-button type="primary" :loading="sending" @click="handleSend">发送</a-button>
        </div>
      </div>
    </main>

    <aside class="context-panel">
      <div class="panel-title">上下文</div>
      <a-descriptions :column="1" size="small" bordered>
        <a-descriptions-item label="模型">{{ currentProvider?.model || currentSession?.model || '-' }}</a-descriptions-item>
        <a-descriptions-item label="服务商">{{ currentProvider?.name || '-' }}</a-descriptions-item>
      </a-descriptions>

      <a-card title="待确认操作" :bordered="false">
        <a-empty v-if="!pendingAction" description="暂无待确认操作" />
        <div v-else class="action-card">
          <a-tag color="orange">{{ actionStatusText(pendingAction.status) }}</a-tag>
          <h4>{{ pendingAction.toolName }}</h4>
          <p>{{ pendingAction.planSummary }}</p>
          <p class="risk">{{ pendingAction.riskSummary }}</p>
          <a-space>
            <a-button type="primary" :loading="acting" @click="handleConfirm(pendingAction)">确认执行</a-button>
            <a-button status="danger" :loading="acting" @click="handleReject(pendingAction)">拒绝</a-button>
          </a-space>
        </div>
      </a-card>

    </aside>

    <a-drawer
      :visible="citationDrawerVisible"
      :width="440"
      title="知识库引用详情"
      :footer="false"
      @cancel="citationDrawerVisible = false"
    >
      <a-empty v-if="!activeCitations.length" description="暂无引用" />
      <div v-else class="cite-detail-list">
        <div v-for="(cite, i) in activeCitations" :key="cite.chunkId ?? i" class="cite-detail">
          <div class="cite-detail-head">
            <span class="cite-detail-title">{{ cite.docTitle }}</span>
            <span class="cite-detail-score">{{ scorePercent(cite.score) }}%</span>
          </div>
          <a-progress class="cite-detail-bar" :percent="scorePercent(cite.score)" size="mini" :show-text="false" />
          <div class="cite-detail-snippet">{{ cite.snippet }}</div>
          <div class="cite-detail-chunk">chunk #{{ cite.chunkId }}</div>
        </div>
      </div>
    </a-drawer>
  </div>
</template>

<style scoped>
.ai-chat-page {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr) 360px;
  gap: 16px;
  min-height: calc(100vh - 140px);
}

.session-panel,
.chat-main,
.context-panel {
  background: var(--color-bg-2);
  border-radius: 10px;
  padding: 16px;
}

.session-panel,
.context-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.session-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  padding: 10px;
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  text-align: left;
  background: var(--color-bg-1);
  cursor: pointer;
}

.session-item.active {
  border-color: rgb(var(--primary-6));
  background: rgb(var(--primary-1));
}

.chat-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border-2);
  margin-bottom: 12px;
}

.chat-header h3 {
  margin: 0;
}

.chat-header p {
  margin: 6px 0 12px;
  color: var(--color-text-3);
}

.message-list {
  flex: 1;
  min-height: 420px;
  max-height: calc(100vh - 310px);
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 4px;
}

.message-row {
  display: flex;
}

.message-row.user {
  justify-content: flex-end;
}

.message-bubble {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 78%;
}

.message-row.user .message-bubble {
  align-items: flex-end;
}

.message-card {
  white-space: pre-wrap;
}

/* 思考中提示 */
.thinking {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
  color: var(--color-text-3);
}

.thinking-dots {
  display: inline-flex;
  gap: 4px;
}

.thinking-dots i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--color-text-3);
  animation: thinking-blink 1.2s infinite ease-in-out;
}

.thinking-dots i:nth-child(2) {
  animation-delay: 0.2s;
}

.thinking-dots i:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes thinking-blink {
  0%,
  80%,
  100% {
    opacity: 0.25;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}

.thinking-failed {
  padding: 4px 0;
  font-size: 13px;
  color: var(--color-text-4);
}

/* 工具调用步骤指示（T5） */
.tool-steps {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.tool-step {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding: 3px 10px;
  border-radius: 6px;
  background: var(--color-fill-1);
  font-size: 12px;
  color: var(--color-text-3);
  line-height: 1.6;
}

.tool-step-icon {
  display: inline-block;
  font-style: normal;
}

.tool-step[data-phase='start'] .tool-step-icon {
  animation: tool-spin 1.2s linear infinite;
}

.tool-step[data-phase='success'] {
  color: rgb(var(--green-6));
}

.tool-step[data-phase='failed'] {
  color: rgb(var(--red-6));
}

.tool-step[data-phase='pending'] {
  color: rgb(var(--orange-6));
}

@keyframes tool-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.message-row.user .message-card {
  background: rgb(var(--primary-1));
}

.composer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.composer-toolbar {
  display: flex;
  gap: 8px;
}

.composer-input {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.action-card,
.citation-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.risk {
  color: rgb(var(--orange-6));
}

.citation-capsules {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.message-row.user .citation-capsules {
  justify-content: flex-end;
}

.citation-capsule {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-bg-selected);
  color: var(--color-text-body);
  font-size: 12px;
  line-height: 1.6;
  cursor: pointer;
  transition: border-color .2s, color .2s;
}

.citation-capsule:hover {
  border-color: rgb(var(--primary-6));
  color: rgb(var(--primary-6));
}

.cite-score {
  color: rgb(var(--primary-6));
  font-weight: 600;
}

.cite-detail-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cite-detail {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-hover);
}

.cite-detail-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.cite-detail-title {
  font-weight: 600;
  color: var(--color-text-title);
}

.cite-detail-score {
  color: rgb(var(--primary-6));
  font-weight: 600;
  font-size: 12px;
  white-space: nowrap;
}

.cite-detail-bar {
  width: 100%;
}

.cite-detail-snippet {
  color: var(--color-text-body);
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.cite-detail-chunk {
  color: var(--color-text-secondary);
  font-size: 11px;
}
</style>
