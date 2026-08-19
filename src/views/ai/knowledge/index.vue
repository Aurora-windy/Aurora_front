<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import {
  createKnowledgeDoc,
  deleteKnowledgeDoc,
  getKnowledgeDoc,
  listKnowledgeDocs,
  offlineKnowledgeDoc,
  publishKnowledgeDoc,
  rebuildKnowledgeEmbedding,
  searchKnowledge,
  updateKnowledgeDoc,
  uploadKnowledgeDoc,
} from '@/api/ai/knowledge'
import type { KnowledgeCitation, KnowledgeDocForm, KnowledgeDocQuery, KnowledgeDocResp } from '@/api/ai/types'

const loading = ref(false)
const saving = ref(false)
const publishing = ref(false)
const uploading = ref(false)
const rows = ref<KnowledgeDocResp[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref('知识文档')
const citations = ref<KnowledgeCitation[]>([])

const query = reactive<KnowledgeDocQuery>({
  pageNum: 1,
  pageSize: 10,
  title: '',
  type: '',
  status: '',
})

const form = reactive<KnowledgeDocForm & { id?: string }>({
  title: '',
  type: 'USAGE_GUIDE',
  content: '',
  summary: '',
})

const searchForm = reactive({
  query: '',
  topK: 5,
})

const columns = [
  { title: '标题', dataIndex: 'title', ellipsis: true, tooltip: true },
  { title: '类型', dataIndex: 'type', width: 130 },
  { title: '原文件', slotName: 'fileUrl', width: 110 },
  { title: '状态', slotName: 'status', width: 110 },
  { title: '版本', dataIndex: 'version', width: 80 },
  { title: '发布时间', dataIndex: 'publishedAt', width: 170 },
  { title: '创建时间', dataIndex: 'createTime', width: 170 },
  { title: '操作', slotName: 'actions', width: 340 },
]

function statusColor(status?: string) {
  if (status === 'PUBLISHED') return 'green'
  if (status === 'OFFLINE') return 'orange'
  return 'gray'
}

function statusText(status?: string) {
  if (status === 'PUBLISHED') return '已发布'
  if (status === 'OFFLINE') return '已下线'
  if (status === 'DRAFT') return '草稿'
  return status || '-'
}

function scorePercent(score?: number) {
  return Math.round((score ?? 0) * 100)
}

function resetForm() {
  Object.assign(form, {
    id: undefined,
    title: '',
    type: 'USAGE_GUIDE',
    content: '',
    summary: '',
  })
}

async function loadData() {
  loading.value = true
  try {
    const result = await listKnowledgeDocs(query)
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
  query.title = ''
  query.type = ''
  query.status = ''
  handleSearch()
}

function openAdd() {
  resetForm()
  dialogTitle.value = '新增知识文档'
  dialogVisible.value = true
}

async function openEdit(row: KnowledgeDocResp) {
  resetForm()
  const detail = await getKnowledgeDoc(row.id)
  Object.assign(form, detail)
  dialogTitle.value = '编辑知识文档'
  dialogVisible.value = true
}

async function handleSave() {
  saving.value = true
  try {
    const payload: KnowledgeDocForm = {
      title: form.title,
      type: form.type,
      content: form.content,
      summary: form.summary,
    }
    if (form.id) {
      await updateKnowledgeDoc(form.id, payload)
      Message.success('知识文档已更新')
    } else {
      await createKnowledgeDoc(payload)
      Message.success('知识文档已创建')
    }
    dialogVisible.value = false
    await loadData()
  } finally {
    saving.value = false
  }
}

function handleDelete(row: KnowledgeDocResp) {
  Modal.confirm({
    title: '删除知识文档',
    content: `确认删除或下线 ${row.title}？`,
    onOk: async () => {
      await deleteKnowledgeDoc(row.id)
      Message.success('知识文档已删除或下线')
      await loadData()
    },
  })
}

async function handlePublish(row: KnowledgeDocResp) {
  publishing.value = true
  try {
    const result = await publishKnowledgeDoc(row.id)
    Message.success(`发布完成：分片 ${result.chunkCount}，向量 ${result.embeddedCount}`)
    await loadData()
  } finally {
    publishing.value = false
  }
}

async function handleRebuild(row: KnowledgeDocResp) {
  publishing.value = true
  try {
    const result = await rebuildKnowledgeEmbedding(row.id)
    Message.success(`重建完成：分片 ${result.chunkCount}，向量 ${result.embeddedCount}`)
    await loadData()
  } finally {
    publishing.value = false
  }
}

async function handleOffline(row: KnowledgeDocResp) {
  await offlineKnowledgeDoc(row.id)
  Message.success('知识文档已下线')
  await loadData()
}

async function handleKnowledgeSearch() {
  if (!searchForm.query) {
    Message.warning('请输入检索内容')
    return
  }
  citations.value = await searchKnowledge({ query: searchForm.query, topK: searchForm.topK })
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

/** 原生文件选择框（点「从本地上传」按钮直接触发 input.click()，一步弹出系统选择框） */
const fileInputRef = ref<HTMLInputElement>()

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // 允许重复选择同一文件
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    Message.error('文件过大，请上传 5MB 以内的文件')
    return
  }
  uploading.value = true
  uploadKnowledgeDoc(file)
    .then((resp) => {
      Message.success(resp.message)
      if (resp.fileUrl) {
        Message.info(`原文件已保存，可访问：${resp.fileUrl}`)
      }
      loadData()
    })
    .catch((err: Error) => {
      Message.error(err.message || '上传失败')
    })
    .finally(() => {
      uploading.value = false
    })
}

onMounted(loadData)
</script>

<template>
  <div class="ai-knowledge-page">
    <div class="page-toolbar">
      <a-space wrap>
        <a-input v-model="query.title" allow-clear placeholder="标题" />
        <a-input v-model="query.type" allow-clear placeholder="类型" />
        <a-select v-model="query.status" allow-clear placeholder="状态" style="width: 150px">
          <a-option value="DRAFT">草稿</a-option>
          <a-option value="PUBLISHED">已发布</a-option>
          <a-option value="OFFLINE">已下线</a-option>
        </a-select>
        <a-button type="primary" @click="handleSearch">查询</a-button>
        <a-button @click="handleReset">重置</a-button>
        <!-- 点「从本地上传」直接弹系统文件选择框（不依赖拖拽，无中间弹窗） -->
        <input
          ref="fileInputRef"
          type="file"
          class="file-input-hidden"
          accept=".txt,.md,.markdown,.csv,.docx,.xlsx"
          @change="handleFileChange"
        />
        <a-button type="primary" :loading="uploading" @click="fileInputRef?.click()">
          <template #icon><icon-upload /></template>
          从本地上传
        </a-button>
        <a-button @click="openAdd">新增文档</a-button>
      </a-space>
    </div>

    <a-card title="知识检索验证" :bordered="false">
      <a-space wrap>
        <a-input v-model="searchForm.query" allow-clear placeholder="检索已发布知识" style="width: 360px" />
        <a-input-number v-model="searchForm.topK" :min="1" :max="20" />
        <a-button @click="handleKnowledgeSearch">检索知识</a-button>
      </a-space>
      <div v-if="citations.length" class="search-result-grid">
        <div v-for="(item, i) in citations" :key="item.chunkId ?? i" class="search-result-card">
          <div class="result-head">
            <span class="result-title">{{ item.docTitle }}</span>
            <a-tag size="small" color="arcoblue">{{ item.docType }}</a-tag>
          </div>
          <div class="result-score">
            <span class="result-score-label">相似度</span>
            <a-progress class="result-bar" :percent="scorePercent(item.score)" size="mini" :show-text="false" />
            <span class="result-score-num">{{ scorePercent(item.score) }}%</span>
          </div>
          <div class="result-snippet">{{ item.snippet }}</div>
        </div>
      </div>
    </a-card>

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
      <template #fileUrl="{ record }">
        <a-link v-if="record.fileUrl" :href="record.fileUrl" target="_blank">
          <icon-file />
          查看
        </a-link>
        <span v-else class="no-file">-</span>
      </template>
      <template #actions="{ record }">
        <a-space>
          <a-button size="small" @click="openEdit(record)">编辑</a-button>
          <a-button size="small" :loading="publishing" @click="handlePublish(record)">发布</a-button>
          <a-button size="small" :loading="publishing" @click="handleRebuild(record)">重建</a-button>
          <a-button size="small" @click="handleOffline(record)">下线</a-button>
          <a-button size="small" status="danger" @click="handleDelete(record)">删除</a-button>
        </a-space>
      </template>
    </a-table>

    <a-modal v-model:visible="dialogVisible" :title="dialogTitle" :confirm-loading="saving" width="900px" @ok="handleSave">
      <a-form :model="form" layout="vertical">
        <a-form-item field="title" label="标题"><a-input v-model="form.title" /></a-form-item>
        <a-form-item field="type" label="类型"><a-input v-model="form.type" /></a-form-item>
        <a-form-item field="summary" label="摘要"><a-textarea v-model="form.summary" :auto-size="{ minRows: 2, maxRows: 4 }" /></a-form-item>
        <a-form-item field="content" label="正文"><a-textarea v-model="form.content" :auto-size="{ minRows: 12, maxRows: 20 }" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.ai-knowledge-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.search-result-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-card);
}

.result-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.result-title {
  font-weight: 600;
  color: var(--color-text-title);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-score {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.result-score-label {
  white-space: nowrap;
}

.result-bar {
  flex: 1;
  min-width: 60px;
}

.result-score-num {
  color: rgb(var(--primary-6));
  font-weight: 600;
  white-space: nowrap;
}

.result-snippet {
  color: var(--color-text-body);
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.page-toolbar {
  padding: 16px;
  background: var(--color-bg-2);
  border-radius: 8px;
}

.file-input-hidden {
  display: none;
}

.no-file {
  color: var(--color-text-4);
}
</style>
