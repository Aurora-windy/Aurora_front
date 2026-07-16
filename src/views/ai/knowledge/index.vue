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
} from '@/api/ai/knowledge'
import type { KnowledgeCitation, KnowledgeDocForm, KnowledgeDocQuery, KnowledgeDocResp } from '@/api/ai/types'

const loading = ref(false)
const saving = ref(false)
const publishing = ref(false)
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

const form = reactive<KnowledgeDocForm & { id?: string | number }>({
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
  { title: '类型', dataIndex: 'type', width: 160 },
  { title: '状态', slotName: 'status', width: 130 },
  { title: '版本', dataIndex: 'version', width: 90 },
  { title: '发布时间', dataIndex: 'publishedAt', width: 180 },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  { title: '操作', slotName: 'actions', width: 360 },
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
        <a-button type="primary" @click="openAdd">新增文档</a-button>
      </a-space>
    </div>

    <a-card title="知识检索验证" :bordered="false">
      <a-space wrap>
        <a-input v-model="searchForm.query" allow-clear placeholder="检索已发布知识" style="width: 360px" />
        <a-input-number v-model="searchForm.topK" :min="1" :max="20" />
        <a-button @click="handleKnowledgeSearch">检索知识</a-button>
      </a-space>
      <div v-if="citations.length" class="citation-list">
        <a-alert v-for="item in citations" :key="item.chunkId" type="info" :title="`${item.docTitle} (${item.score ?? 0})`" :content="item.snippet" />
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

.page-toolbar,
.citation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-toolbar {
  padding: 16px;
  background: var(--color-bg-2);
  border-radius: 8px;
}
</style>
