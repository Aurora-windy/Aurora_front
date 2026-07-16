<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import {
  createProvider,
  getEmbeddingConfig,
  listAdminProviders,
  saveEmbeddingConfig,
  setProviderEnabled,
  testEmbeddingConfig,
  testProvider,
  updateProvider,
} from '@/api/ai/provider'
import type { EmbeddingConfigForm, ProviderForm, ProviderQuery, ProviderResp } from '@/api/ai/types'

const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const rows = ref<ProviderResp[]>([])
const total = ref(0)
const providerDialogVisible = ref(false)
const embeddingDialogVisible = ref(false)
const providerDialogTitle = ref('模型配置')

const query = reactive<ProviderQuery>({
  pageNum: 1,
  pageSize: 10,
  code: '',
  name: '',
  model: '',
  enabled: undefined,
})

const providerForm = reactive<ProviderForm & { id?: string | number }>({
  code: '',
  name: '',
  baseUrl: '',
  apiKey: '',
  model: '',
  temperature: 0.7,
  maxTokens: undefined,
  timeoutSeconds: 60,
  enabled: true,
  sortOrder: 0,
})

const embeddingForm = reactive<EmbeddingConfigForm>({
  baseUrl: '',
  apiKey: '',
  model: '',
  dimension: undefined,
  timeoutSeconds: 60,
  enabled: false,
})

const columns = [
  { title: '名称', dataIndex: 'name', width: 160 },
  { title: '编码', dataIndex: 'code', width: 140 },
  { title: '模型', dataIndex: 'model', width: 180 },
  { title: '接口地址', dataIndex: 'baseUrl', ellipsis: true, tooltip: true },
  { title: '密钥', slotName: 'key', width: 110 },
  { title: '状态', slotName: 'enabled', width: 110 },
  { title: '排序', dataIndex: 'sortOrder', width: 80 },
  { title: '操作', slotName: 'actions', width: 300 },
]

function resetProviderForm() {
  Object.assign(providerForm, {
    id: undefined,
    code: '',
    name: '',
    baseUrl: '',
    apiKey: '',
    model: '',
    temperature: 0.7,
    maxTokens: undefined,
    timeoutSeconds: 60,
    enabled: true,
    sortOrder: 0,
  })
}

async function loadData() {
  loading.value = true
  try {
    const result = await listAdminProviders(query)
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
  query.code = ''
  query.name = ''
  query.model = ''
  query.enabled = undefined
  handleSearch()
}

function openAdd() {
  resetProviderForm()
  providerDialogTitle.value = '新增模型配置'
  providerDialogVisible.value = true
}

function openEdit(row: ProviderResp) {
  resetProviderForm()
  Object.assign(providerForm, {
    id: row.id,
    code: row.code,
    name: row.name,
    baseUrl: row.baseUrl,
    apiKey: '',
    model: row.model,
    temperature: row.temperature ?? 0.7,
    maxTokens: row.maxTokens,
    timeoutSeconds: row.timeoutSeconds ?? 60,
    enabled: row.enabled,
    sortOrder: row.sortOrder ?? 0,
  })
  providerDialogTitle.value = '编辑模型配置'
  providerDialogVisible.value = true
}

async function handleSaveProvider() {
  saving.value = true
  try {
    const payload: ProviderForm = { ...providerForm }
    if (!payload.apiKey) {
      delete payload.apiKey
    }
    if (providerForm.id) {
      await updateProvider(providerForm.id, payload)
      Message.success('模型配置已更新')
    } else {
      await createProvider(payload)
      Message.success('模型配置已创建')
    }
    providerDialogVisible.value = false
    await loadData()
  } finally {
    saving.value = false
  }
}

function handleToggle(row: ProviderResp) {
  Modal.confirm({
    title: row.enabled ? '停用模型配置' : '启用模型配置',
    content: `确认${row.enabled ? '停用' : '启用'} ${row.name}？`,
    onOk: async () => {
      await setProviderEnabled(row.id, { enabled: !row.enabled })
      Message.success('模型配置状态已更新')
      await loadData()
    },
  })
}

async function handleTest(row: ProviderResp) {
  testing.value = true
  try {
    const result = await testProvider(row.id)
    if (result.success) Message.success(result.message || '模型连通性测试成功')
    else Message.error(result.message || '模型连通性测试失败')
  } finally {
    testing.value = false
  }
}

async function openEmbedding() {
  const config = await getEmbeddingConfig()
  Object.assign(embeddingForm, {
    baseUrl: config?.baseUrl ?? '',
    apiKey: '',
    model: config?.model ?? '',
    dimension: config?.dimension,
    timeoutSeconds: config?.timeoutSeconds ?? 60,
    enabled: config?.enabled ?? false,
  })
  embeddingDialogVisible.value = true
}

async function handleSaveEmbedding() {
  saving.value = true
  try {
    const payload: EmbeddingConfigForm = { ...embeddingForm }
    if (!payload.apiKey) delete payload.apiKey
    await saveEmbeddingConfig(payload)
    Message.success('向量配置已保存')
    embeddingDialogVisible.value = false
  } finally {
    saving.value = false
  }
}

async function handleTestEmbedding() {
  testing.value = true
  try {
    const result = await testEmbeddingConfig(embeddingForm)
    if (result.success) Message.success(result.message || '向量配置测试成功')
    else Message.error(result.message || '向量配置测试失败')
  } finally {
    testing.value = false
  }
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
  <div class="ai-provider-page">
    <div class="page-toolbar">
      <a-space wrap>
        <a-input v-model="query.code" allow-clear placeholder="编码" />
        <a-input v-model="query.name" allow-clear placeholder="名称" />
        <a-input v-model="query.model" allow-clear placeholder="模型" />
        <a-select v-model="query.enabled" allow-clear placeholder="状态" style="width: 130px">
          <a-option :value="1">已启用</a-option>
          <a-option :value="0">已停用</a-option>
        </a-select>
        <a-button type="primary" @click="handleSearch">查询</a-button>
        <a-button @click="handleReset">重置</a-button>
        <a-button type="primary" @click="openAdd">新增模型配置</a-button>
        <a-button @click="openEmbedding">向量配置</a-button>
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
      <template #key="{ record }">
        <a-tag :color="record.hasApiKey ? 'green' : 'gray'">{{ record.hasApiKey ? '已设置' : '未设置' }}</a-tag>
      </template>
      <template #enabled="{ record }">
        <a-tag :color="record.enabled ? 'green' : 'red'">{{ record.enabled ? '已启用' : '已停用' }}</a-tag>
      </template>
      <template #actions="{ record }">
        <a-space>
          <a-button size="small" @click="openEdit(record)">编辑</a-button>
          <a-button size="small" :loading="testing" @click="handleTest(record)">测试</a-button>
          <a-button size="small" @click="handleToggle(record)">{{ record.enabled ? '停用' : '启用' }}</a-button>
        </a-space>
      </template>
    </a-table>

    <a-modal v-model:visible="providerDialogVisible" :title="providerDialogTitle" :confirm-loading="saving" @ok="handleSaveProvider">
      <a-form :model="providerForm" layout="vertical">
        <a-form-item field="code" label="编码"><a-input v-model="providerForm.code" /></a-form-item>
        <a-form-item field="name" label="名称"><a-input v-model="providerForm.name" /></a-form-item>
        <a-form-item field="baseUrl" label="接口地址"><a-input v-model="providerForm.baseUrl" /></a-form-item>
        <a-form-item field="apiKey" label="访问密钥"><a-input-password v-model="providerForm.apiKey" placeholder="留空则保留原密钥" /></a-form-item>
        <a-form-item field="model" label="模型"><a-input v-model="providerForm.model" /></a-form-item>
        <a-form-item field="temperature" label="温度"><a-input-number v-model="providerForm.temperature" :min="0" :max="2" :step="0.1" /></a-form-item>
        <a-form-item field="maxTokens" label="最大 Token 数"><a-input-number v-model="providerForm.maxTokens" :min="1" /></a-form-item>
        <a-form-item field="timeoutSeconds" label="超时时间（秒）"><a-input-number v-model="providerForm.timeoutSeconds" :min="1" /></a-form-item>
        <a-form-item field="sortOrder" label="排序"><a-input-number v-model="providerForm.sortOrder" /></a-form-item>
        <a-form-item field="enabled" label="启用"><a-switch v-model="providerForm.enabled" /></a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:visible="embeddingDialogVisible" title="向量配置" :confirm-loading="saving" @ok="handleSaveEmbedding">
      <a-form :model="embeddingForm" layout="vertical">
        <a-form-item field="baseUrl" label="接口地址"><a-input v-model="embeddingForm.baseUrl" /></a-form-item>
        <a-form-item field="apiKey" label="访问密钥"><a-input-password v-model="embeddingForm.apiKey" placeholder="留空则保留原密钥" /></a-form-item>
        <a-form-item field="model" label="模型"><a-input v-model="embeddingForm.model" /></a-form-item>
        <a-form-item field="dimension" label="向量维度"><a-input-number v-model="embeddingForm.dimension" :min="1" /></a-form-item>
        <a-form-item field="timeoutSeconds" label="超时时间（秒）"><a-input-number v-model="embeddingForm.timeoutSeconds" :min="1" /></a-form-item>
        <a-form-item field="enabled" label="启用"><a-switch v-model="embeddingForm.enabled" /></a-form-item>
        <a-button :loading="testing" @click="handleTestEmbedding">测试向量配置</a-button>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.ai-provider-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-toolbar {
  padding: 16px;
  background: var(--color-bg-2);
  border-radius: 8px;
}
</style>
