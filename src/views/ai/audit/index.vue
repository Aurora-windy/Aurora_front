<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { listToolCallLogs } from '@/api/ai/audit'
import type { ToolCallLogQuery, ToolCallLogResp } from '@/api/ai/types'

const loading = ref(false)
const rows = ref<ToolCallLogResp[]>([])
const total = ref(0)

const query = reactive<ToolCallLogQuery>({
  pageNum: 1,
  pageSize: 10,
  sessionId: undefined,
  actionId: undefined,
  userId: undefined,
  providerId: undefined,
  toolName: '',
  permissionCode: '',
  success: undefined,
})

const columns = [
  { title: '工具名称', dataIndex: 'toolName', width: 220, ellipsis: true, tooltip: true },
  { title: '权限码', dataIndex: 'permissionCode', width: 180, ellipsis: true, tooltip: true },
  { title: '结果', slotName: 'success', width: 100 },
  { title: '会话 ID', dataIndex: 'sessionId', width: 120 },
  { title: '操作 ID', dataIndex: 'actionId', width: 120 },
  { title: '用户 ID', dataIndex: 'userId', width: 120 },
  { title: '模型配置 ID', dataIndex: 'providerId', width: 130 },
  { title: '开始时间', dataIndex: 'startedAt', width: 180 },
  { title: '结束时间', dataIndex: 'finishedAt', width: 180 },
  { title: '摘要', slotName: 'summary', width: 320 },
]

function successText(success?: number) {
  if (success === 1) return '成功'
  if (success === 0) return '失败'
  return '未知'
}

function successColor(success?: number) {
  if (success === 1) return 'green'
  if (success === 0) return 'red'
  return 'gray'
}

async function loadData() {
  loading.value = true
  try {
    const result = await listToolCallLogs(query)
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
  query.sessionId = undefined
  query.actionId = undefined
  query.userId = undefined
  query.providerId = undefined
  query.toolName = ''
  query.permissionCode = ''
  query.success = undefined
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

onMounted(loadData)
</script>

<template>
  <div class="ai-audit-page">
    <div class="page-toolbar">
      <a-space wrap>
        <a-input v-model="query.sessionId" allow-clear placeholder="会话 ID" />
        <a-input v-model="query.actionId" allow-clear placeholder="操作 ID" />
        <a-input v-model="query.userId" allow-clear placeholder="用户 ID" />
        <a-input v-model="query.providerId" allow-clear placeholder="模型配置 ID" />
        <a-input v-model="query.toolName" allow-clear placeholder="工具名称" />
        <a-input v-model="query.permissionCode" allow-clear placeholder="权限码" />
        <a-select v-model="query.success" allow-clear placeholder="结果" style="width: 120px">
          <a-option :value="1">成功</a-option>
          <a-option :value="0">失败</a-option>
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
      <template #success="{ record }">
        <a-tag :color="successColor(record.success)">{{ successText(record.success) }}</a-tag>
      </template>
      <template #summary="{ record }">
        <div class="summary-cell">
          <div v-if="record.resultSummary">{{ record.resultSummary }}</div>
          <div v-if="record.errorCode" class="error-text">{{ record.errorCode }}</div>
          <div v-if="record.errorMessage" class="error-text">{{ record.errorMessage }}</div>
          <a-typography-paragraph v-if="record.paramsSummary" class="params-summary" :ellipsis="{ rows: 2, expandable: true }">
            {{ record.paramsSummary }}
          </a-typography-paragraph>
        </div>
      </template>
    </a-table>
  </div>
</template>

<style scoped>
.ai-audit-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-toolbar {
  padding: 16px;
  background: var(--color-bg-2);
  border-radius: 8px;
}

.summary-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.error-text {
  color: rgb(var(--red-6));
}

.params-summary {
  margin-bottom: 0;
  color: var(--color-text-2);
}
</style>
