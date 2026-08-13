<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import {
  createProvider,
  getEmbeddingConfig,
  listAdminProviders,
  listEmbeddingModels,
  saveEmbeddingConfig,
  setProviderEnabled,
  testEmbeddingConfig,
  testProvider,
  updateProvider,
  deleteProvider,
} from '@/api/ai/provider'
import type { EmbeddingConfigForm, EmbeddingModelOption, ProviderForm, ProviderQuery, ProviderResp } from '@/api/ai/types'

const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const rows = ref<ProviderResp[]>([])
const total = ref(0)
const embeddingModelOptions = ref<EmbeddingModelOption[]>([])
const providerDialogVisible = ref(false)
const embeddingDialogVisible = ref(false)
const providerDialogTitle = ref('Provider Config')

const query = reactive<ProviderQuery>({
  pageNum: 1,
  pageSize: 10,
  code: '',
  name: '',
  model: '',
  enabled: undefined,
})

const providerForm = reactive<ProviderForm & { id?: string }>({
  code: '',
  name: '',
  baseUrl: '',
  apiKey: '',
  model: '',
  embeddingModel: '',
  usageType: 'CHAT',
  embeddingDimension: undefined,
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
  { title: 'Name', dataIndex: 'name', width: 160 },
  { title: 'Code', dataIndex: 'code', width: 140 },
  { title: 'Model', dataIndex: 'model', width: 180 },
  { title: 'Key', slotName: 'key', width: 110 },
  { title: 'Status', slotName: 'enabled', width: 110 },
  { title: 'Sort', dataIndex: 'sortOrder', width: 80 },
  { title: 'Actions', slotName: 'actions', width: 300 },
]

function resetProviderForm() {
  Object.assign(providerForm, {
    id: undefined,
    code: '',
    name: '',
    baseUrl: '',
    apiKey: '',
    model: '',
    embeddingModel: '',
    usageType: 'CHAT',
    embeddingDimension: undefined,
    temperature: 0.7,
    maxTokens: undefined,
    timeoutSeconds: 60,
    enabled: true,
    sortOrder: 0,
  })
}

function loadEmbeddingModels() {
  listEmbeddingModels().then((list) => {
    embeddingModelOptions.value = list
  })
}

function onEmbeddingModelChange(model: any) {
  const opt = embeddingModelOptions.value.find((o) => o.model === model)
  providerForm.embeddingDimension = opt ? opt.dimension : undefined
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
  providerDialogTitle.value = 'Create Provider'
  providerDialogVisible.value = true
}

function openEdit(row: ProviderResp) {
  resetProviderForm()
  Object.assign(providerForm, {
    id: row.id,
    code: row.code,
    name: row.name,
    baseUrl: '',
    apiKey: '',
    model: row.model,
    embeddingModel: row.embeddingModel ?? '',
    usageType: row.usageType ?? 'CHAT',
    embeddingDimension: row.embeddingDimension,
    temperature: row.temperature ?? 0.7,
    maxTokens: row.maxTokens,
    timeoutSeconds: row.timeoutSeconds ?? 60,
    enabled: row.enabled,
    sortOrder: row.sortOrder ?? 0,
  })
  providerDialogTitle.value = 'Edit Provider'
  providerDialogVisible.value = true
}

async function handleSaveProvider() {
  saving.value = true
  try {
    const payload: ProviderForm = { ...providerForm }
    if (!payload.apiKey) {
      delete payload.apiKey
    }
    if (providerForm.id && !payload.baseUrl) {
      delete payload.baseUrl
    }
    if (payload.usageType === 'CHAT') {
      delete payload.embeddingDimension
      delete payload.embeddingModel
    }
    if (providerForm.id) {
      await updateProvider(providerForm.id, payload)
      Message.success('Provider updated')
    } else {
      await createProvider(payload)
      Message.success('Provider created')
    }
    providerDialogVisible.value = false
    await loadData()
  } finally {
    saving.value = false
  }
}

function handleToggle(row: ProviderResp) {
  Modal.confirm({
    title: row.enabled ? 'Disable Provider' : 'Enable Provider',
    content: `Confirm ${row.enabled ? 'disable' : 'enable'} ${row.name}?`,
    onOk: async () => {
      await setProviderEnabled(row.id, { enabled: !row.enabled })
      Message.success('Provider status updated')
      await loadData()
    },
  })
}

async function handleDelete(row: ProviderResp) {
  await deleteProvider(row.id)
  Message.success('Provider deleted')
  await loadData()
}

async function handleTest(row: ProviderResp) {
  testing.value = true
  try {
    const result = await testProvider(row.id)
    if (result.success) Message.success(result.message || 'Provider connectivity test success')
    else Message.error(result.message || 'Provider connectivity test failed')
  } finally {
    testing.value = false
  }
}

async function openEmbedding() {
  const config = await getEmbeddingConfig()
  Object.assign(embeddingForm, {
    baseUrl: '',
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
    if (!payload.baseUrl) delete payload.baseUrl
    await saveEmbeddingConfig(payload)
    Message.success('Embedding config saved')
    embeddingDialogVisible.value = false
  } finally {
    saving.value = false
  }
}

async function handleTestEmbedding() {
  testing.value = true
  try {
    const result = await testEmbeddingConfig(embeddingForm)
    if (result.success) Message.success(result.message || 'Embedding connectivity test success')
    else Message.error(result.message || 'Embedding connectivity test failed')
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

onMounted(() => {
  loadData()
  loadEmbeddingModels()
})
</script>
<template>
  <div class="ai-provider-page">
    <div class="page-toolbar">
      <a-space wrap>
        <a-input v-model="query.code" allow-clear placeholder="Code" />
        <a-input v-model="query.name" allow-clear placeholder="Name" />
        <a-input v-model="query.model" allow-clear placeholder="Model" />
        <a-select v-model="query.enabled" allow-clear placeholder="Status" style="width: 130px">
          <a-option :value="1">Enabled</a-option>
          <a-option :value="0">Disabled</a-option>
        </a-select>
        <a-button type="primary" @click="handleSearch">Search</a-button>
        <a-button @click="handleReset">Reset</a-button>
        <a-button type="primary" @click="openAdd">Create Provider</a-button>
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
        <a-tag :color="record.hasApiKey ? 'green' : 'gray'">{{ record.hasApiKey ? 'Set' : 'Unset' }}</a-tag>
      </template>
      <template #enabled="{ record }">
        <a-tag :color="record.enabled ? 'green' : 'red'">{{ record.enabled ? 'Enabled' : 'Disabled' }}</a-tag>
      </template>
      <template #actions="{ record }">
        <a-space>
          <a-button size="small" @click="openEdit(record)">Edit</a-button>
          <a-button size="small" :loading="testing" @click="handleTest(record)">Test</a-button>
          <a-button size="small" @click="handleToggle(record)">{{ record.enabled ? 'Disable' : 'Enable' }}</a-button>
          <a-popconfirm content="Confirm delete this provider?" @ok="handleDelete(record)">
            <a-button size="small" status="danger">Delete</a-button>
          </a-popconfirm>
        </a-space>
      </template>
    </a-table>

    <a-modal v-model:visible="providerDialogVisible" :title="providerDialogTitle" :confirm-loading="saving" @ok="handleSaveProvider">
      <a-form :model="providerForm" layout="vertical">
        <a-form-item field="code" label="Code"><a-input v-model="providerForm.code" /></a-form-item>
        <a-form-item field="name" label="Name"><a-input v-model="providerForm.name" /></a-form-item>
        <a-form-item field="baseUrl" label="Base URL"><a-input v-model="providerForm.baseUrl" placeholder="Leave blank to keep existing Base URL" /></a-form-item>
        <a-form-item field="apiKey" label="API Key"><a-input-password v-model="providerForm.apiKey" placeholder="Leave blank to keep existing API Key" /></a-form-item>
        <a-form-item field="model" label="Model"><a-input v-model="providerForm.model" /></a-form-item>
        <a-form-item field="usageType" label="Usage Type">
          <a-select v-model="providerForm.usageType">
            <a-option value="CHAT">Chat</a-option>
            <a-option value="BOTH">Chat + Embedding</a-option>
            <a-option value="EMBEDDING">Embedding only</a-option>
          </a-select>
        </a-form-item>
        <template v-if="providerForm.usageType !== 'CHAT'">
          <a-form-item field="embeddingModel" label="Embedding Model">
            <a-select v-model="providerForm.embeddingModel" placeholder="选择 embedding 模型" @change="onEmbeddingModelChange">
              <a-option v-for="opt in embeddingModelOptions" :key="opt.model" :value="opt.model">
                {{ opt.model }} · {{ opt.dimension }}维（{{ opt.source === 'LOCAL' ? '本地' : '云' }}）
              </a-option>
            </a-select>
          </a-form-item>
          <a-form-item field="embeddingDimension" label="Embedding Dimension">
            <a-input-number v-model="providerForm.embeddingDimension" :min="1" disabled style="width: 100%" />
          </a-form-item>
        </template>
        <a-form-item field="temperature" label="Temperature"><a-input-number v-model="providerForm.temperature" :min="0" :max="2" :step="0.1" /></a-form-item>
        <a-form-item field="maxTokens" label="Max Tokens"><a-input-number v-model="providerForm.maxTokens" :min="1" :max="100000" /></a-form-item>
        <a-form-item field="timeoutSeconds" label="Timeout Seconds"><a-input-number v-model="providerForm.timeoutSeconds" :min="1" :max="600" /></a-form-item>
        <a-form-item field="sortOrder" label="Sort"><a-input-number v-model="providerForm.sortOrder" :max="999" /></a-form-item>
        <a-form-item field="enabled" label="Enabled"><a-switch v-model="providerForm.enabled" /></a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:visible="embeddingDialogVisible" title="Embedding Config" :confirm-loading="saving" @ok="handleSaveEmbedding">
      <a-form :model="embeddingForm" layout="vertical">
        <a-form-item field="baseUrl" label="Base URL"><a-input v-model="embeddingForm.baseUrl" placeholder="Leave blank to keep existing Base URL" /></a-form-item>
        <a-form-item field="apiKey" label="API Key"><a-input-password v-model="embeddingForm.apiKey" placeholder="Leave blank to keep existing API Key" /></a-form-item>
        <a-form-item field="model" label="Model"><a-input v-model="embeddingForm.model" /></a-form-item>
        <a-form-item field="dimension" label="Dimension"><a-input-number v-model="embeddingForm.dimension" :min="1" /></a-form-item>
        <a-form-item field="timeoutSeconds" label="Timeout Seconds"><a-input-number v-model="embeddingForm.timeoutSeconds" :min="1" /></a-form-item>
        <a-form-item field="enabled" label="Enabled"><a-switch v-model="embeddingForm.enabled" /></a-form-item>
        <a-button :loading="testing" @click="handleTestEmbedding">Test Embedding</a-button>
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


