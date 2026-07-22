<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { listSubmissions } from '@/api/oj/submission'
import type { SubmissionQuery, SubmissionResp } from '@/api/oj/types'

const loading = ref(false)
const detailVisible = ref(false)
const current = ref<SubmissionResp | null>(null)
const rows = ref<SubmissionResp[]>([])
const total = ref(0)
const query = reactive<SubmissionQuery>({ pageNum: 1, pageSize: 10, problemId: undefined, userId: undefined, status: undefined, language: undefined })

const columns = [
  { title: '题目', dataIndex: 'problemTitle' },
  { title: '用户编号', dataIndex: 'userId', width: 180 },
  { title: '语言', slotName: 'language', width: 100 },
  { title: '状态', slotName: 'status', width: 140 },
  { title: '耗时/内存', slotName: 'usage', width: 150 },
  { title: '提交时间', dataIndex: 'createTime', width: 180 },
  { title: '操作', slotName: 'actions', width: 100 },
]

function statusText(status?: number) {
  const map: Record<number, string> = { 0: '排队中', 1: '答案正确', 2: '答案错误', 3: '时间超限', 4: '内存超限', 5: '运行错误', 6: '编译错误', 7: '系统错误' }
  return status == null ? '-' : map[status] ?? String(status)
}

function languageText(language?: string) {
  const map: Record<string, string> = { java: 'Java 语言', python: 'Python 语言', go: 'Go 语言', cpp: 'C++ 语言' }
  return language ? map[language] ?? language : '-'
}

function statusColor(status?: number) {
  return status === 1 ? 'green' : status === 0 ? 'blue' : 'red'
}

async function loadData() {
  loading.value = true
  try {
    const result = await listSubmissions(query)
    rows.value = result.list
    total.value = result.total
  } finally {
    loading.value = false
  }
}

function search() {
  query.pageNum = 1
  loadData()
}

function reset() {
  query.problemId = undefined
  query.userId = undefined
  query.status = undefined
  query.language = undefined
  search()
}

function view(row: SubmissionResp) {
  current.value = row
  detailVisible.value = true
}

function pageChange(pageNum: number) {
  query.pageNum = pageNum
  loadData()
}

function pageSizeChange(pageSize: number) {
  query.pageSize = pageSize
  query.pageNum = 1
  loadData()
}

onMounted(loadData)
</script>

<template>
  <div class="submission-page">
    <div class="page-toolbar">
      <a-space wrap>
        <a-input v-model="query.problemId" allow-clear placeholder="题目编号" />
        <a-input v-model="query.userId" allow-clear placeholder="用户编号" />
        <a-select v-model="query.language" allow-clear placeholder="语言" style="width: 120px">
          <a-option value="java">Java 语言</a-option>
          <a-option value="python">Python 语言</a-option>
          <a-option value="go">Go 语言</a-option>
          <a-option value="cpp">C++ 语言</a-option>
        </a-select>
        <a-select v-model="query.status" allow-clear placeholder="状态" style="width: 150px">
          <a-option :value="1">答案正确</a-option>
          <a-option :value="2">答案错误</a-option>
          <a-option :value="7">系统错误</a-option>
        </a-select>
        <a-button type="primary" @click="search"><template #icon><icon-search /></template>查询</a-button>
        <a-button @click="reset"><template #icon><icon-refresh /></template>重置</a-button>
      </a-space>
    </div>

    <a-table row-key="id" :loading="loading" :columns="columns" :data="rows" :pagination="{ total, current: query.pageNum, pageSize: query.pageSize, showTotal: true, showPageSize: true }" @page-change="pageChange" @page-size-change="pageSizeChange">
      <template #language="{ record }">{{ languageText(record.language) }}</template>
      <template #status="{ record }"><a-tag :color="statusColor(record.status)">{{ statusText(record.status) }}</a-tag></template>
      <template #usage="{ record }">{{ record.timeUsedMs ?? '-' }}ms / {{ record.memoryUsedKb ?? '-' }}KB</template>
      <template #actions="{ record }"><a-button size="small" @click="view(record)">查看</a-button></template>
    </a-table>

    <a-modal v-model:visible="detailVisible" title="提交详情" width="760px" :footer="false">
      <template v-if="current">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="题目">{{ current.problemTitle }}</a-descriptions-item>
          <a-descriptions-item label="用户编号">{{ current.userId }}</a-descriptions-item>
          <a-descriptions-item label="语言">{{ languageText(current.language) }}</a-descriptions-item>
          <a-descriptions-item label="状态">{{ statusText(current.status) }}</a-descriptions-item>
          <a-descriptions-item label="错误信息" :span="2">{{ current.errorMessage || '-' }}</a-descriptions-item>
        </a-descriptions>
        <pre class="code-block">{{ current.sourceCode }}</pre>
      </template>
    </a-modal>
  </div>
</template>

<style scoped>
.submission-page { display: flex; flex-direction: column; gap: 16px; }
.page-toolbar { padding: 16px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
.code-block { margin-top: 16px; padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-bg-page); white-space: pre-wrap; font-family: Consolas, 'Courier New', monospace; }
</style>
