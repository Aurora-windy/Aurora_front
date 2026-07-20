<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { confirmAction, createSession, listMessages, listSessions, rejectAction, sendMessage } from '@/api/ai/chat'
import { listEnabledProviders } from '@/api/ai/provider'
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
const citations = ref<KnowledgeCitation[]>([])
const pendingAction = ref<ActionResp>()
const toolResult = ref<ToolResult>()

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
  await loadMessages(sessionId)
}

async function loadMessages(sessionId = currentSessionId.value) {
  if (!sessionId) return
  loadingMessages.value = true
  try {
    messages.value = await listMessages(sessionId)
    const lastAssistant = [...messages.value].reverse().find((item) => item.role === 'assistant')
    const metadata = lastAssistant ? parseMetadata(lastAssistant) : null
    citations.value = metadata?.citations ?? []
    toolResult.value = metadata?.toolResult && Object.keys(metadata.toolResult).length ? metadata.toolResult : undefined
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

async function handleSend() {
  if (!currentSessionId.value) {
    await handleCreateSession()
  }
  if (!currentSessionId.value || !input.value.trim()) return
  const content = input.value.trim()
  input.value = ''
  sending.value = true
  try {
    const result = await sendMessage(currentSessionId.value, { content })
    messages.value.push(result.userMessage, result.assistantMessage)
    citations.value = result.citations ?? []
    pendingAction.value = result.pendingAction
    toolResult.value = result.toolResult
    await loadSessions()
  } finally {
    sending.value = false
  }
}

async function handleConfirm(action: ActionResp) {
  acting.value = true
  try {
    const result = await confirmAction(action.id)
    Message.success(`执行状态：${result.status}`)
    pendingAction.value = undefined
    await loadMessages()
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
    await loadMessages()
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
            <a-card :bordered="false" class="message-card">
              <template #title>{{ roleText(message.role) }}</template>
              <div class="message-content">{{ message.content }}</div>
            </a-card>
          </div>
        </div>
      </a-spin>
      <div class="composer">
        <a-textarea v-model="input" placeholder="问问 AURORA Agent..." :auto-size="{ minRows: 3, maxRows: 6 }" @keydown.ctrl.enter="handleSend" />
        <a-button type="primary" :loading="sending" @click="handleSend">发送</a-button>
      </div>
    </main>

    <aside class="context-panel">
      <div class="panel-title">上下文</div>
      <a-descriptions :column="1" size="small" bordered>
        <a-descriptions-item label="模型">{{ currentProvider?.model || currentSession?.model || '-' }}</a-descriptions-item>
        <a-descriptions-item label="服务商">{{ currentProvider?.name || '-' }}</a-descriptions-item>
      </a-descriptions>

      <a-card title="知识库引用" :bordered="false">
        <a-empty v-if="!citations.length" description="暂无引用" />
        <a-list v-else size="small" :data="citations">
          <template #item="{ item }">
            <a-list-item>
              <a-list-item-meta :title="item.docTitle" :description="item.snippet" />
            </a-list-item>
          </template>
        </a-list>
      </a-card>

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

      <a-card title="工具执行结果" :bordered="false">
        <a-empty v-if="!toolResult" description="暂无工具执行结果" />
        <a-alert v-else :type="toolResult.success ? 'success' : 'error'" :title="toolResult.summary || toolResult.errorCode || '工具执行结果'" :content="toolResult.errorMessage || JSON.stringify(toolResult.data || {})" />
      </a-card>
    </aside>
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

.message-card {
  max-width: 78%;
  white-space: pre-wrap;
}

.message-row.user .message-card {
  background: rgb(var(--primary-1));
}

.composer {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  margin-top: 12px;
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
</style>
