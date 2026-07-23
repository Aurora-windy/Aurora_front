<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { PermCode } from '@/constants/perm-codes'
import { addPosition, deletePosition, listPositions, updatePosition } from '@/api/hr/position'
import { listDepts } from '@/api/hr/dept'
import type { ApiId } from '@/api/system/types'
import type { DeptResp, PositionForm, PositionResp } from '@/api/hr/types'

const loading = ref(false)
const saving = ref(false)
const visible = ref(false)
const rows = ref<PositionResp[]>([])
const depts = ref<DeptResp[]>([])
const queryDeptId = ref<ApiId | undefined>(undefined)
const form = reactive<PositionForm>({ positionName: '', positionCode: '', sort: 0, status: 1 })
const dialogTitle = ref('新增岗位')

const columns = [
  { title: '岗位名称', dataIndex: 'positionName' },
  { title: '编码', dataIndex: 'positionCode', width: 140 },
  { title: '所属部门', slotName: 'dept', width: 160 },
  { title: '排序', dataIndex: 'sort', width: 80 },
  { title: '状态', slotName: 'status', width: 90 },
  { title: '操作', slotName: 'actions', width: 200 },
]

function deptName(deptId?: ApiId) {
  return depts.value.find((d) => d.id === deptId)?.deptName ?? '-'
}

function statusText(status?: number) {
  return status === 1 ? '启用' : '禁用'
}

function resetForm() {
  Object.assign(form, { id: undefined, deptId: undefined, positionName: '', positionCode: '', sort: 0, status: 1 })
}

async function loadData() {
  loading.value = true
  try {
    rows.value = await listPositions(queryDeptId.value)
  } finally {
    loading.value = false
  }
}

function openAdd() {
  resetForm()
  dialogTitle.value = '新增岗位'
  visible.value = true
}

async function openEdit(row: PositionResp) {
  resetForm()
  Object.assign(form, row)
  dialogTitle.value = '编辑岗位'
  visible.value = true
}

async function save() {
  saving.value = true
  try {
    if (form.id) {
      await updatePosition(form.id, form)
    } else {
      await addPosition(form)
    }
    Message.success('岗位已保存')
    visible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

function remove(row: PositionResp) {
  Modal.confirm({
    title: '删除岗位',
    content: `确认删除 ${row.positionName}?`,
    onOk: async () => {
      await deletePosition(row.id)
      Message.success('岗位已删除')
      loadData()
    },
  })
}

onMounted(async () => {
  depts.value = await listDepts()
  loadData()
})
</script>

<template>
  <div class="hr-page">
    <div class="page-toolbar">
      <a-space wrap>
        <a-select v-model="queryDeptId" allow-clear placeholder="按部门筛选" style="width: 200px" @change="loadData">
          <a-option v-for="d in depts" :key="d.id" :value="d.id">{{ d.deptName }}</a-option>
        </a-select>
      </a-space>
      <a-button v-permission="PermCode.Hr.Position.ADD" type="primary" @click="openAdd">
        <template #icon><icon-plus /></template>新增
      </a-button>
    </div>

    <a-table row-key="id" :loading="loading" :columns="columns" :data="rows" :pagination="false">
      <template #dept="{ record }">{{ deptName(record.deptId) }}</template>
      <template #status="{ record }">
        <a-tag :color="record.status === 1 ? 'green' : 'red'">{{ statusText(record.status) }}</a-tag>
      </template>
      <template #actions="{ record }">
        <a-space>
          <a-button v-permission="PermCode.Hr.Position.EDIT" size="small" @click="openEdit(record)">编辑</a-button>
          <a-button v-permission="PermCode.Hr.Position.REMOVE" size="small" status="danger" @click="remove(record)">删除</a-button>
        </a-space>
      </template>
    </a-table>

    <a-modal v-model:visible="visible" :title="dialogTitle" :confirm-loading="saving" @ok="save">
      <a-form :model="form" layout="vertical">
        <a-form-item field="deptId" label="所属部门" required>
          <a-select v-model="form.deptId" placeholder="请选择部门">
            <a-option v-for="d in depts" :key="d.id" :value="d.id">{{ d.deptName }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item field="positionName" label="岗位名称" required><a-input v-model="form.positionName" /></a-form-item>
        <a-form-item field="positionCode" label="岗位编码"><a-input v-model="form.positionCode" /></a-form-item>
        <a-form-item field="sort" label="排序"><a-input-number v-model="form.sort" :min="0" /></a-form-item>
        <a-form-item field="status" label="状态">
          <a-radio-group v-model="form.status" type="button">
            <a-radio :value="1">启用</a-radio>
            <a-radio :value="0">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.hr-page { display: flex; flex-direction: column; gap: 16px; }
.page-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
</style>
