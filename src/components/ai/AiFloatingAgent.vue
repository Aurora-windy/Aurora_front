<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { confirmAction, createSession, listMessages, listSessions, rejectAction, sendMessage } from '@/api/ai/chat'
import { listEnabledProviders } from '@/api/ai/provider'
import type { ActionResp, ChatMessageResp, ChatSessionResp, KnowledgeCitation, ProviderOptionResp, ToolResult } from '@/api/ai/types'

const visible = ref(false)
const loading = ref(false)
const sending = ref(false)
const acting = ref(false)
const providers = ref<ProviderOptionResp[]>([])
const sessions = ref<ChatSessionResp[]>([])
const messages = ref<ChatMessageResp[]>([])
const selectedProviderId = ref<string | number>()
const currentSessionId = ref<string | number>()
const input = ref('')
const citations = ref<KnowledgeCitation[]>([])
const pendingAction = ref<ActionResp>()
const toolResult = ref<ToolResult>()
const ballSize = 56
const ballMargin = 24
const tuckedVisibleSize = 22
const dragThreshold = 6
const ballPosition = reactive({ x: 0, y: 0 })
const isDragging = ref(false)
const isHoveringBall = ref(false)
const isTucked = ref(false)
const dockSide = ref<'left' | 'right'>('right')
const dragState = reactive({
  pointerId: 0,
  startClientX: 0,
  startClientY: 0,
  startX: 0,
  startY: 0,
  moved: false,
  suppressClick: false,
})

const sessionForm = reactive({
  title: 'AURORA Agent',
})

const currentSession = computed(() => sessions.value.find((item) => item.id === currentSessionId.value))
const currentProvider = computed(() => providers.value.find((item) => item.id === selectedProviderId.value || item.id === currentSession.value?.providerId))
const isBallExpanded = computed(() => visible.value || isDragging.value || isHoveringBall.value || !isTucked.value)
const ballStyle = computed(() => {
  const x = isDragging.value ? ballPosition.x : isBallExpanded.value ? expandedDockX() : tuckedDockX()

  return {
    left: `${x}px`,
    top: `${ballPosition.y}px`,
  }
})

function parseMetadata(message: ChatMessageResp) {
  if (!message.metadataJson) return undefined
  try {
    return JSON.parse(message.metadataJson)
  } catch {
    return undefined
  }
}

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

async function bootstrap() {
  await Promise.all([loadProviders(), loadSessions()])
}

async function loadProviders() {
  providers.value = await listEnabledProviders()
  if (!selectedProviderId.value && providers.value.length) selectedProviderId.value = providers.value[0].id
}

async function loadSessions() {
  sessions.value = await listSessions()
  if (!currentSessionId.value && sessions.value.length) {
    await selectSession(sessions.value[0].id)
  }
}

async function selectSession(sessionId: string | number) {
  currentSessionId.value = sessionId
  const session = sessions.value.find((item) => item.id === sessionId)
  if (session?.providerId) selectedProviderId.value = session.providerId
  await loadSessionMessages(sessionId)
}

async function loadSessionMessages(sessionId = currentSessionId.value) {
  if (!sessionId) return
  loading.value = true
  try {
    messages.value = await listMessages(sessionId)
    const metadata = parseMetadata([...messages.value].reverse().find((item) => item.role === 'assistant') as ChatMessageResp)
    citations.value = metadata?.citations ?? []
    toolResult.value = metadata?.toolResult && Object.keys(metadata.toolResult).length ? metadata.toolResult : undefined
  } finally {
    loading.value = false
  }
}

async function ensureSession() {
  if (currentSessionId.value) return currentSessionId.value
  const session = await createSession({ title: sessionForm.title, providerId: selectedProviderId.value })
  currentSessionId.value = session.id
  sessions.value.unshift(session)
  return session.id
}

async function handleSend() {
  if (!input.value.trim()) return
  const sessionId = await ensureSession()
  const content = input.value.trim()
  input.value = ''
  sending.value = true
  try {
    const result = await sendMessage(sessionId, { content })
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
    await loadSessionMessages()
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
    await loadSessionMessages()
  } finally {
    acting.value = false
  }
}

function openAgent() {
  visible.value = true
  isTucked.value = false
  if (!providers.value.length && !sessions.value.length) bootstrap()
}

function viewportWidth() {
  return window.innerWidth || document.documentElement.clientWidth
}

function viewportHeight() {
  return window.innerHeight || document.documentElement.clientHeight
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function maxBallY() {
  return Math.max(ballMargin, viewportHeight() - ballSize - ballMargin)
}

function expandedDockX() {
  return dockSide.value === 'left' ? 0 : viewportWidth() - ballSize
}

function tuckedDockX() {
  return dockSide.value === 'left' ? -(ballSize - tuckedVisibleSize) : viewportWidth() - tuckedVisibleSize
}

function normalizeBallPosition() {
  ballPosition.y = clamp(ballPosition.y || viewportHeight() - ballSize - ballMargin, ballMargin, maxBallY())
}

function dockBall() {
  dockSide.value = ballPosition.x + ballSize / 2 < viewportWidth() / 2 ? 'left' : 'right'
  ballPosition.x = expandedDockX()
  normalizeBallPosition()
  tuckBallLater()
}

function tuckBallLater() {
  window.setTimeout(() => {
    if (!visible.value && !isDragging.value && !isHoveringBall.value) {
      isTucked.value = true
    }
  }, 650)
}

function handleBallPointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  isDragging.value = true
  isTucked.value = false
  dragState.pointerId = event.pointerId
  dragState.startClientX = event.clientX
  dragState.startClientY = event.clientY
  dragState.startX = isBallExpanded.value ? expandedDockX() : tuckedDockX()
  dragState.startY = ballPosition.y
  dragState.moved = false
  dragState.suppressClick = false
  window.addEventListener('pointermove', handleBallPointerMove)
  window.addEventListener('pointerup', handleBallPointerUp)
  window.addEventListener('pointercancel', handleBallPointerUp)
}

function handleBallPointerMove(event: PointerEvent) {
  if (!isDragging.value || event.pointerId !== dragState.pointerId) return
  const deltaX = event.clientX - dragState.startClientX
  const deltaY = event.clientY - dragState.startClientY
  if (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold) {
    dragState.moved = true
    dragState.suppressClick = true
  }
  ballPosition.x = clamp(dragState.startX + deltaX, 0, viewportWidth() - ballSize)
  ballPosition.y = clamp(dragState.startY + deltaY, ballMargin, maxBallY())
}

function handleBallPointerUp(event: PointerEvent) {
  if (event.pointerId !== dragState.pointerId) return
  isDragging.value = false
  removeBallListeners()
  if (dragState.moved) {
    dockBall()
  }
}

function handleBallClick() {
  if (dragState.suppressClick) {
    dragState.suppressClick = false
    return
  }
  openAgent()
}

function handleWindowResize() {
  normalizeBallPosition()
  ballPosition.x = expandedDockX()
}

function removeBallListeners() {
  window.removeEventListener('pointermove', handleBallPointerMove)
  window.removeEventListener('pointerup', handleBallPointerUp)
  window.removeEventListener('pointercancel', handleBallPointerUp)
}

watch(visible, (value) => {
  if (value) {
    isTucked.value = false
  } else {
    tuckBallLater()
  }
})

onMounted(() => {
  ballPosition.x = expandedDockX()
  ballPosition.y = viewportHeight() - ballSize - ballMargin
  dockBall()
  window.addEventListener('resize', handleWindowResize)
  bootstrap().catch(() => undefined)
})

onBeforeUnmount(() => {
  removeBallListeners()
  window.removeEventListener('resize', handleWindowResize)
})
</script>

<template>
  <button
    class="ai-agent-ball"
    :class="[`dock-${dockSide}`, { dragging: isDragging, tucked: isTucked }]"
    :style="ballStyle"
    title="AURORA Agent"
    @click="handleBallClick"
    @pointerdown="handleBallPointerDown"
    @mouseenter="isHoveringBall = true"
    @mouseleave="isHoveringBall = false"
    @focus="isHoveringBall = true"
    @blur="isHoveringBall = false"
  >
    AI
  </button>

  <a-drawer v-model:visible="visible" width="520px" unmount-on-close :footer="false">
    <template #title>
      <div class="drawer-title">
        <span>AURORA Agent</span>
        <a-tag v-if="currentProvider" color="blue">{{ currentProvider.model }}</a-tag>
      </div>
    </template>

    <div class="agent-drawer">
      <div class="agent-controls">
        <a-select v-model="selectedProviderId" allow-clear placeholder="选择模型">
          <a-option v-for="provider in providers" :key="provider.id" :value="provider.id">
            {{ provider.name }} / {{ provider.model }}
          </a-option>
        </a-select>
        <a-select v-model="currentSessionId" allow-clear placeholder="选择会话" @change="value => value && selectSession(value as string | number)">
          <a-option v-for="session in sessions" :key="session.id" :value="session.id">
            {{ session.title }}
          </a-option>
        </a-select>
      </div>

      <a-spin :loading="loading">
        <div class="agent-messages">
          <a-empty v-if="!messages.length" description="输入问题开始对话" />
          <div v-for="message in messages" :key="message.id" class="agent-message" :class="message.role">
            <div class="agent-message-role">{{ roleText(message.role) }}</div>
            <div class="agent-message-content">{{ message.content }}</div>
          </div>
        </div>
      </a-spin>

      <div v-if="pendingAction" class="agent-card pending">
        <a-tag color="orange">{{ actionStatusText(pendingAction.status) }}</a-tag>
        <strong>{{ pendingAction.toolName }}</strong>
        <p>{{ pendingAction.planSummary }}</p>
        <small>{{ pendingAction.riskSummary }}</small>
        <a-space>
          <a-button size="small" type="primary" :loading="acting" @click="handleConfirm(pendingAction)">确认执行</a-button>
          <a-button size="small" status="danger" :loading="acting" @click="handleReject(pendingAction)">拒绝</a-button>
        </a-space>
      </div>

      <div v-if="toolResult" class="agent-card">
        <a-alert :type="toolResult.success ? 'success' : 'error'" :title="toolResult.summary || toolResult.errorCode || '工具执行结果'" :content="toolResult.errorMessage || JSON.stringify(toolResult.data || {})" />
      </div>

      <div v-if="citations.length" class="agent-card citations">
        <strong>知识库引用</strong>
        <a-list size="small" :data="citations">
          <template #item="{ item }">
            <a-list-item>{{ item.docTitle }} · {{ item.snippet }}</a-list-item>
          </template>
        </a-list>
      </div>

      <div class="agent-composer">
        <a-textarea v-model="input" placeholder="问问 AURORA Agent..." :auto-size="{ minRows: 3, maxRows: 5 }" @keydown.ctrl.enter="handleSend" />
        <a-button type="primary" long :loading="sending" @click="handleSend">发送</a-button>
      </div>
    </div>
  </a-drawer>
</template>

<style scoped>
.ai-agent-ball {
  position: fixed;
  z-index: 1000;
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 50%;
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.5px;
  touch-action: none;
  user-select: none;
  background: linear-gradient(135deg, rgb(var(--primary-5)), rgb(var(--primary-7)));
  box-shadow: 0 12px 30px rgba(var(--primary-6), 0.35);
  cursor: grab;
  transition:
    left 0.25s ease,
    top 0.2s ease,
    border-radius 0.25s ease,
    box-shadow 0.25s ease,
    opacity 0.25s ease;
}

.ai-agent-ball:hover,
.ai-agent-ball:focus-visible {
  box-shadow: 0 16px 36px rgba(var(--primary-6), 0.45);
  outline: none;
}

.ai-agent-ball.dragging {
  cursor: grabbing;
  transition: none;
}

.ai-agent-ball.tucked {
  opacity: 0.88;
}

.ai-agent-ball.dock-left.tucked {
  border-radius: 0 50% 50% 0;
}

.ai-agent-ball.dock-right.tucked {
  border-radius: 50% 0 0 50%;
}

.drawer-title,
.agent-controls,
.agent-drawer,
.agent-composer,
.agent-card {
  display: flex;
  gap: 12px;
}

.drawer-title {
  align-items: center;
  justify-content: space-between;
}

.agent-drawer {
  flex-direction: column;
  height: calc(100vh - 120px);
}

.agent-controls,
.agent-composer,
.agent-card {
  flex-direction: column;
}

.agent-messages {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: calc(100vh - 420px);
  min-height: 260px;
  overflow: auto;
  padding-right: 4px;
}

.agent-message {
  max-width: 88%;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--color-fill-2);
}

.agent-message.user {
  align-self: flex-end;
  background: rgb(var(--primary-1));
}

.agent-message-role {
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--color-text-3);
}

.agent-message-content {
  white-space: pre-wrap;
}

.agent-card {
  padding: 12px;
  border: 1px solid var(--color-border-2);
  border-radius: 10px;
  background: var(--color-bg-1);
}

.agent-card.pending small {
  color: rgb(var(--orange-6));
}
</style>
