<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { confirmAction, createSession, listMessages, listSessions, rejectAction, resumeStream, streamMessage } from '@/api/ai/chat'
import type { StreamHandlers } from '@/api/ai/chat'
import { listEnabledProviders } from '@/api/ai/provider'
import { renderMarkdown } from '@/utils/markdown'
import type { ActionResp, ChatMessageResp, ChatSessionResp, KnowledgeCitation, ProviderOptionResp, ToolResult } from '@/api/ai/types'

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
const pendingAction = ref<ActionResp>()
const toolResult = ref<ToolResult>()
const citationDrawerVisible = ref(false)
const activeCitations = ref<KnowledgeCitation[]>([])
const messageListRef = ref<HTMLDivElement>()
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

/** 示例问题（空会话时展示，点击填入） */
const examples = ['帮我介绍一下 AURORA 平台', '这个系统有哪些 AI 能力？', '什么是知识图谱？', '把下面的内容整理成要点']

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

function scrollToBottom() {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
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
  await loadMessages(sessionId)
}

async function loadMessages(sessionId = currentSessionId.value) {
  if (!sessionId) return
  loadingMessages.value = true
  try {
    messages.value = await listMessages(sessionId)
    const lastAssistant = [...messages.value].reverse().find((item) => item.role === 'assistant')
    const metadata = lastAssistant ? parseMetadata(lastAssistant) : null
    toolResult.value = metadata?.toolResult && Object.keys(metadata.toolResult).length ? metadata.toolResult : undefined
    scrollToBottom()
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

function fillExample(text: string) {
  input.value = text
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
  scrollToBottom()
  let pending = ''
  let renderTimer: number | null = null
  const flushBuffer = () => {
    if (pending) {
      assistantMsg.content += pending
      pending = ''
      scrollToBottom()
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
    onToolResult: (result) => {
      toolResult.value = result
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
      scrollToBottom()
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
  <div class="ai-chat">
    <!-- 左侧会话面板 -->
    <aside class="session-panel">
      <div class="panel-head">
        <span class="panel-title">AI 会话</span>
      </div>
      <a-select v-model="selectedProviderId" placeholder="选择模型" allow-clear size="small">
        <a-option v-for="provider in providers" :key="provider.id" :value="provider.id">
          {{ provider.name }} / {{ provider.model }}
        </a-option>
      </a-select>
      <div class="new-session">
        <a-input v-model="newSessionForm.title" allow-clear size="small" placeholder="新会话标题" />
        <a-button type="primary" size="small" @click="handleCreateSession">新建</a-button>
      </div>
      <a-spin :loading="loadingSessions" class="session-spin">
        <div class="session-list">
          <button
            v-for="session in sessions"
            :key="session.id"
            class="session-item"
            :class="{ active: session.id === currentSessionId }"
            @click="selectSession(session.id)"
          >
            <span class="session-title">{{ session.title }}</span>
            <small class="session-model">{{ session.model || '未选择模型' }}</small>
          </button>
        </div>
      </a-spin>
    </aside>

    <!-- 右侧聊天区 -->
    <main class="chat-main">
      <div class="chat-header">
        <div class="chat-header-info">
          <h3>{{ currentSession?.title || 'AI 对话' }}</h3>
          <p>{{ currentProvider ? `${currentProvider.name} / ${currentProvider.model}` : '选择模型后开始对话' }}</p>
        </div>
        <div class="chat-header-actions">
          <a-button size="small" @click="handleCreateSession">
            <template #icon><icon-plus /></template>
            新对话
          </a-button>
        </div>
      </div>

      <a-spin :loading="loadingMessages" class="messages-spin">
        <div ref="messageListRef" class="message-list">
          <div v-if="!messages.length" class="welcome">
            <h2>AURORA Agent</h2>
            <p>我是你的 AI 助手，可以回答问题、检索知识库、操作知识图谱。</p>
            <div class="example-chips">
              <button v-for="(exp, i) in examples" :key="i" class="example-chip" @click="fillExample(exp)">{{ exp }}</button>
            </div>
          </div>

          <div v-for="message in messages" :key="message.id" class="message-row" :class="message.role">
            <div class="message-bubble">
              <div class="message-role">{{ roleText(message.role) }}</div>
              <div class="message-body">
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
              </div>
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

          <!-- 待确认操作 / 工具结果（聊天流内卡片） -->
          <div v-if="pendingAction" class="inline-card">
            <a-tag color="orange">{{ actionStatusText(pendingAction.status) }}</a-tag>
            <strong>{{ pendingAction.toolName }}</strong>
            <p>{{ pendingAction.planSummary }}</p>
            <p class="risk">{{ pendingAction.riskSummary }}</p>
            <a-space>
              <a-button size="small" type="primary" :loading="acting" @click="handleConfirm(pendingAction)">确认执行</a-button>
              <a-button size="small" status="danger" :loading="acting" @click="handleReject(pendingAction)">拒绝</a-button>
            </a-space>
          </div>
          <div v-if="toolResult" class="inline-card">
            <a-alert :type="toolResult.success ? 'success' : 'error'" :title="toolResult.summary || toolResult.errorCode || '工具执行结果'" :content="toolResult.errorMessage || JSON.stringify(toolResult.data || {})" />
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
        </div>
        <div class="composer-input">
          <a-textarea v-model="input" placeholder="输入问题，Enter 发送，Shift+Enter 换行" :auto-size="{ minRows: 3, maxRows: 6 }" @keydown="handleComposerKeydown" />
          <a-button type="primary" :loading="sending" @click="handleSend">发送</a-button>
        </div>
        <p class="composer-note">内容由大模型生成，仅供学习交流参考，其准确性无法保证</p>
      </div>
    </main>

    <!-- 引用详情 -->
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
.ai-chat {
  display: flex;
  width: 100%;
  height: 100vh;
  box-sizing: border-box;
  background: var(--color-bg-1);
}

/* ===== 左侧会话面板 ===== */
.session-panel {
  flex: 0 0 250px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 14px;
  border-right: 1px solid var(--color-border-2);
  background: var(--color-bg-2);
  box-sizing: border-box;
  overflow: hidden;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
}

.new-session {
  display: flex;
  gap: 8px;
}

.session-spin {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: 100%;
  overflow: auto;
  padding-right: 2px;
}

.session-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 9px 10px;
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  text-align: left;
  background: var(--color-bg-1);
  cursor: pointer;
  transition: all 0.2s ease;
}

.session-item:hover {
  border-color: rgb(var(--primary-6));
}

.session-item.active {
  border-color: rgb(var(--primary-6));
  background: rgb(var(--primary-1));
}

.session-title {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.session-model {
  color: var(--color-text-3);
  font-size: 11px;
}

/* ===== 右侧聊天区 ===== */
.chat-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  box-sizing: border-box;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px;
  border-bottom: 1px solid var(--color-border-2);
  background: var(--color-bg-2);
}

.chat-header h3 {
  margin: 0;
  font-size: 16px;
}

.chat-header p {
  margin: 4px 0 0;
  color: var(--color-text-3);
  font-size: 12px;
}

.messages-spin {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.message-list {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px 24px;
}

.welcome {
  margin: auto;
  text-align: center;
  max-width: 520px;
}

.welcome h2 {
  margin: 0 0 8px;
  font-size: 26px;
  color: rgb(var(--primary-6));
}

.welcome p {
  margin: 0 0 18px;
  color: var(--color-text-3);
}

.example-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.example-chip {
  padding: 8px 16px;
  border: 1px solid var(--color-border-2);
  border-radius: 16px;
  font-size: 13px;
  color: var(--color-text-2);
  background: var(--color-bg-2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.example-chip:hover {
  border-color: rgb(var(--primary-6));
  color: rgb(var(--primary-6));
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

.message-role {
  font-size: 11px;
  color: var(--color-text-4);
}

.message-body {
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--color-fill-2);
}

.message-row.user .message-body {
  background: rgb(var(--primary-1));
}

.message-content {
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.7;
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
  transition: border-color 0.2s, color 0.2s;
}

.citation-capsule:hover {
  border-color: rgb(var(--primary-6));
  color: rgb(var(--primary-6));
}

.cite-score {
  color: rgb(var(--primary-6));
  font-weight: 600;
}

.inline-card {
  align-self: center;
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid var(--color-border-2);
  border-radius: 10px;
  background: var(--color-bg-2);
}

.inline-card p {
  margin: 0;
}

.risk {
  color: rgb(var(--orange-6));
}

/* ===== 输入区 ===== */
.composer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 24px 14px;
  border-top: 1px solid var(--color-border-2);
  background: var(--color-bg-2);
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

.composer-note {
  margin: 0;
  font-size: 11px;
  color: var(--color-text-4);
  text-align: center;
}

/* ===== 引用详情 ===== */
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
}

.cite-detail-score {
  color: rgb(var(--primary-6));
  font-weight: 600;
  font-size: 12px;
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
