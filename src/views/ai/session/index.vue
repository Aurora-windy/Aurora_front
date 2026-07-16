<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { listAdminSessionMessages, listAdminSessions } from '@/api/ai/session'
import type { ChatMessageResp, ChatSessionQuery, ChatSessionResp } from '@/api/ai/types'

const loading = ref(false)
const messageLoading = ref(false)
const rows = ref<ChatSessionResp[]>([])
const messages = ref<ChatMessageResp[]>([])
const total = ref(0)
const messageDialogVisible = ref(false)
const currentSession = ref<ChatSessionResp>()

const query = reactive<ChatSessionQuery>({
  pageNum: 1,
  pageSize: 10,
  userId: undefined,
  providerId: undefined,
  title: '',
  model: '',
  status: '',
})

const columns = [
  { title: '会话标题', dataIndex: 'title', ellipsis: true, tooltip: true },
  { title: '用户 ID', dataIndex: 'userId', width: 130 },
  { title: '模型配置 ID', dataIndex: 'providerId', width: 130 },
  { title: '模型', dataIndex: 'model', width: 180, ellipsis: true, tooltip: true },
  { title: '状态', slotName: 'status', width: 110 },
  { title: '最后消息时间', dataIndex: 'lastMessageAt', width: 180 },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  { title: '操作', slotName: 'actions', width: 120 },
]

function roleText(role: string) {
  if (role === 'user') return '用户'
  if (role === 'assistant') return '助手'
  if (role === 'system') return '系统'
  return role
}

function statusText(status?: string) {
  if (status === 'ACTIVE') return '活跃'
  if (status === 'ARCHIVED') return '已归档'
  return status || '-'
}

function statusColor(status?: string) {
  if (status === 'ACTIVE') return 'green'
  if (status === 'ARCHIVED') return 'gray'
  return 'blue'
}

async function loadData() {
  loading.value = true
  try {
    const result = await listAdminSessions(query)
    rows.value = result.list
    total.value = result.total
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.pageNum = 1
  loadData()
}

function handleReset() {
  query.userId = undefined
  query.providerId = undefined
  query.title = ''
  query.model = ''
  query.status = ''
  handleSearch()
}

function handlePageChange(pageNum: number) {
  query.pageNum = pageNum
  loadData()
}

function handlePageSizeChange(pageSize: number) {
  query.pageSize = pageSize
  query.pageNum = 1
  loadData()
}

async function openMessages(row: ChatSessionResp) {
  currentSession.value = row
  messageDialogVisible.value = true
  messageLoading.value = true
  try {
    messages.value = await listAdminSessionMessages(row.id)
  } finally {
    messageLoading.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="ai-session-page">
    <div class="page-toolbar">
      <a-space wrap>
        <a-input v-model="query.userId" allow-clear placeholder="用户 ID" />
        <a-input v-model="query.providerId" allow-clear placeholder="模型配置 ID" />
        <a-input v-model="query.title" allow-clear placeholder="会话标题" />
        <a-input v-model="query.model" allow-clear placeholder="模型" />
        <a-select v-model="query.status" allow-clear placeholder="状态" style="width: 130px">
          <a-option value="ACTIVE">活跃</a-option>
          <a-option value="ARCHIVED">已归档</a-option>
        </a-select>
        <a-button type="primary" @click="handleSearch">查询</a-button>
        <a-button @click="handleReset">重置</a-button>
      </a-space>
    </div>

    <a-table
      row-key="id"
      :columns="columns"
      :data="rows"
      :loading="loading"
      :pagination="{ current: query.pageNum, pageSize: query.pageSize, total, showTotal: true, showPageSize: true }"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    >
      <template #status="{ record }">
        <a-tag :color="statusColor(record.status)">{{ statusText(record.status) }}</a-tag>
      </template>
      <template #actions="{ record }">
        <a-button size="small" @click="openMessages(record)">查看消息</a-button>
      </template>
    </a-table>

    <a-modal v-model:visible="messageDialogVisible" :title="`会话消息：${currentSession?.title || '-'}`" width="760px" :footer="false">
      <a-spin :loading="messageLoading">
        <div class="message-list">
          <a-empty v-if="!messages.length" description="暂无消息" />
          <div v-for="message in messages" :key="message.id" class="message-item" :class="message.role">
            <div class="message-meta">
              <a-tag size="small" :color="message.role === 'user' ? 'blue' : 'green'">{{ roleText(message.role) }}</a-tag>
              <span>{{ message.createdAt || '-' }}</span>
            </div>
            <div class="message-content">{{ message.content }}</div>
          </div>
        </div>
      </a-spin>
    </a-modal>
  </div>
</template>

<style scoped>
.ai-session-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-toolbar {
  padding: 16px;
  background: var(--color-bg-2);
  border-radius: 8px;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 60vh;
  overflow: auto;
}

.message-item {
  padding: 12px;
  border: 1px solid var(--color-border-2);
  border-radius: 10px;
  background: var(--color-bg-1);
}

.message-item.user {
  background: rgb(var(--primary-1));
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--color-text-3);
  font-size: 12px;
}

.message-content {
  white-space: pre-wrap;
  line-height: 1.7;
}
</style>
