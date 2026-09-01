<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import {
  createMcpServer,
  deleteMcpServer,
  getMcpDemoStatus,
  listMcpServers,
  setMcpServerEnabled,
  startMcpDemo,
  stopMcpDemo,
  syncMcpServer,
  updateMcpServer,
} from '@/api/ai/mcp'
import type { McpServerForm, McpServerQuery, McpServerResp } from '@/api/ai/types'

const loading = ref(false)
const saving = ref(false)
const rows = ref<McpServerResp[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref('新建 MCP Server')
const syncingId = ref<string>()
const demoRunning = ref(false)
const demoBusy = ref(false)

const query = reactive<McpServerQuery>({
  pageNum: 1,
  pageSize: 10,
  code: '',
  name: '',
  enabled: undefined,
})

const form = reactive<McpServerForm & { id?: string }>({
  code: '',
  name: '',
  description: '',
  baseUrl: '',
  bearerToken: '',
  timeoutSeconds: 10,
})

const columns = [
  { title: '名称', dataIndex: 'name', width: 160 },
  { title: '标识码', dataIndex: 'code', width: 140 },
  { title: '服务地址', dataIndex: 'baseUrl', ellipsis: true, tooltip: true, width: 260 },
  { title: '工具数', dataIndex: 'toolCount', width: 90 },
  { title: '状态', slotName: 'enabled', width: 90 },
  { title: '最近同步', dataIndex: 'lastSyncAt', width: 170 },
  { title: '操作', slotName: 'actions', width: 280 },
]

function resetForm() {
  Object.assign(form, {
    id: undefined,
    code: '',
    name: '',
    description: '',
    baseUrl: '',
    bearerToken: '',
    timeoutSeconds: 10,
  })
}

async function loadData() {
  loading.value = true
  try {
    const result = await listMcpServers(query)
    rows.value = result.list
    total.value = result.total
  } finally {
    loading.value = false
  }
}

async function loadDemoStatus() {
  const result = await getMcpDemoStatus()
  demoRunning.value = result.running
}

async function toggleDemo() {
  demoBusy.value = true
  try {
    if (demoRunning.value) {
      await stopMcpDemo()
      Message.success('MCP 演示服务已停止')
    } else {
      await startMcpDemo()
      Message.success('MCP 演示服务已启动并同步工具')
    }
    await Promise.all([loadData(), loadDemoStatus()])
  } finally {
    demoBusy.value = false
  }
}

function handleSearch() {
  query.pageNum = 1
  loadData()
}

function handleReset() {
  query.code = ''
  query.name = ''
  query.enabled = undefined
  handleSearch()
}

function openAdd() {
  resetForm()
  dialogTitle.value = '新建 MCP Server'
  dialogVisible.value = true
}

function openEdit(row: McpServerResp) {
  Object.assign(form, {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description ?? '',
    baseUrl: row.baseUrl,
    bearerToken: '',
    timeoutSeconds: row.timeoutSeconds ?? 10,
  })
  dialogTitle.value = '编辑 MCP Server'
  dialogVisible.value = true
}

async function handleSave() {
  saving.value = true
  try {
    const payload: McpServerForm = { ...form }
    if (form.id && !payload.bearerToken) {
      delete payload.bearerToken
    }
    if (form.id) {
      await updateMcpServer(form.id, payload)
      Message.success('MCP Server 已更新')
    } else {
      await createMcpServer(payload)
      Message.success('MCP Server 已创建')
    }
    dialogVisible.value = false
    await loadData()
  } finally {
    saving.value = false
  }
}

function handleToggle(row: McpServerResp) {
  const enabled = row.enabled === 1
  Modal.confirm({
    title: enabled ? '停用 MCP Server' : '启用 MCP Server',
    content: `确认${enabled ? '停用' : '启用'} ${row.name}？`,
    onOk: async () => {
      await setMcpServerEnabled(row.id, { enabled: enabled ? 0 : 1 })
      Message.success('MCP Server 状态已更新')
      await loadData()
    },
  })
}

async function handleSync(row: McpServerResp) {
  syncingId.value = row.id
  try {
    const result = await syncMcpServer(row.id)
    if (result.success) {
      Message.success(`同步成功，共 ${result.toolCount ?? 0} 个工具`)
    } else {
      Message.error(result.errorMessage || '同步失败')
    }
    await loadData()
  } finally {
    syncingId.value = undefined
  }
}

async function handleDelete(row: McpServerResp) {
  await deleteMcpServer(row.id)
  Message.success('MCP Server 已删除')
  await loadData()
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

onMounted(() => Promise.all([loadData(), loadDemoStatus()]))
</script>

<template>
  <div class="mcp-page">
    <div class="page-toolbar">
      <a-space wrap>
        <a-input v-model="query.code" allow-clear placeholder="标识码" />
        <a-input v-model="query.name" allow-clear placeholder="名称" />
        <a-select v-model="query.enabled" allow-clear placeholder="状态" style="width: 120px">
          <a-option :value="1">启用</a-option>
          <a-option :value="0">停用</a-option>
        </a-select>
        <a-button type="primary" @click="handleSearch">搜索</a-button>
        <a-button @click="handleReset">重置</a-button>
        <a-button type="primary" @click="openAdd">新建 MCP Server</a-button>
        <a-button :loading="demoBusy" :status="demoRunning ? 'danger' : 'success'" @click="toggleDemo">
          {{ demoRunning ? '停止 MCP 演示服务' : '启动 MCP 演示服务' }}
        </a-button>
        <a-tag :color="demoRunning ? 'green' : 'gray'">{{ demoRunning ? '1208 已运行' : '默认关闭' }}</a-tag>
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
      <template #enabled="{ record }">
        <a-tag :color="record.enabled === 1 ? 'green' : 'red'">{{ record.enabled === 1 ? '启用' : '停用' }}</a-tag>
      </template>
      <template #actions="{ record }">
        <a-space>
          <a-button size="small" @click="openEdit(record)">编辑</a-button>
          <a-button size="small" :loading="syncingId === record.id" @click="handleSync(record)">同步工具</a-button>
          <a-button size="small" @click="handleToggle(record)">{{ record.enabled === 1 ? '停用' : '启用' }}</a-button>
          <a-popconfirm content="确认删除该 MCP Server？" @ok="handleDelete(record)">
            <a-button size="small" status="danger">删除</a-button>
          </a-popconfirm>
        </a-space>
      </template>
    </a-table>

    <a-modal v-model:visible="dialogVisible" :title="dialogTitle" :confirm-loading="saving" @ok="handleSave">
      <a-form :model="form" layout="vertical">
        <a-form-item field="code" label="标识码" required><a-input v-model="form.code" placeholder="例如 weather" /></a-form-item>
        <a-form-item field="name" label="名称" required><a-input v-model="form.name" /></a-form-item>
        <a-form-item field="baseUrl" label="HTTP SSE 地址" required><a-input v-model="form.baseUrl" placeholder="例如 http://localhost:1208/api/mcp/sse" /></a-form-item>
        <a-form-item field="bearerToken" label="Bearer Token"><a-input-password v-model="form.bearerToken" :placeholder="form.id && rows.find((row) => row.id === form.id)?.hasBearerToken ? '留空则沿用已保存 Token' : '无 Token 可留空'" /></a-form-item>
        <a-form-item field="description" label="描述"><a-textarea v-model="form.description" :max-length="500" show-word-limit /></a-form-item>
        <a-form-item field="timeoutSeconds" label="调用超时（秒）"><a-input-number v-model="form.timeoutSeconds" :min="1" :max="120" style="width: 100%" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.mcp-page {
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
