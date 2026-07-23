<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { PermCode } from '@/constants/perm-codes'
import { addDept, deleteDept, listDepts, updateDept } from '@/api/hr/dept'
import type { ApiId } from '@/api/system/types'
import type { DeptForm, DeptResp } from '@/api/hr/types'

interface DeptNode extends DeptResp {
  children: DeptNode[]
}

const loading = ref(false)
const saving = ref(false)
const visible = ref(false)
const depts = ref<DeptResp[]>([])
const form = reactive<DeptForm>({ deptName: '', deptCode: '', sort: 0, status: 1 })
const dialogTitle = ref('新增部门')
const editingId = ref<ApiId | undefined>(undefined)

const treeData = computed<DeptNode[]>(() => buildTree(depts.value))
const expandedKeys = computed<ApiId[]>(() => depts.value.map((d) => d.id))
const parentOptions = computed(() => depts.value.filter((d) => d.id !== editingId.value))

const columns = [
  { title: '部门名称', dataIndex: 'deptName' },
  { title: '编码', dataIndex: 'deptCode', width: 140 },
  { title: '排序', dataIndex: 'sort', width: 80 },
  { title: '状态', slotName: 'status', width: 90 },
  { title: '操作', slotName: 'actions', width: 240 },
]

function buildTree(list: DeptResp[]): DeptNode[] {
  const map = new Map<ApiId, DeptNode>()
  const roots: DeptNode[] = []
  list.forEach((d) => map.set(d.id, { ...d, children: [] }))
  list.forEach((d) => {
    const node = map.get(d.id)!
    if (d.parentId && map.has(d.parentId)) {
      map.get(d.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

function statusText(status?: number) {
  return status === 1 ? '启用' : '禁用'
}

function resetForm() {
  Object.assign(form, { id: undefined, parentId: undefined, deptName: '', deptCode: '', sort: 0, status: 1 })
}

async function loadData() {
  loading.value = true
  try {
    depts.value = await listDepts()
  } finally {
    loading.value = false
  }
}

function openAdd(parent?: DeptResp) {
  resetForm()
  if (parent) {
    form.parentId = parent.id
  }
  editingId.value = undefined
  dialogTitle.value = '新增部门'
  visible.value = true
}

function openEdit(row: DeptResp) {
  resetForm()
  Object.assign(form, row)
  editingId.value = row.id
  dialogTitle.value = '编辑部门'
  visible.value = true
}

async function save() {
  saving.value = true
  try {
    if (editingId.value) {
      await updateDept(editingId.value, form)
    } else {
      await addDept(form)
    }
    Message.success('部门已保存')
    visible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

function remove(row: DeptResp) {
  Modal.confirm({
    title: '删除部门',
    content: `确认删除 ${row.deptName}?（若存在子部门 / 岗位 / 员工将被拒绝）`,
    onOk: async () => {
      await deleteDept(row.id)
      Message.success('部门已删除')
      loadData()
    },
  })
}

onMounted(loadData)
</script>

<template>
  <div class="hr-page">
    <div class="page-toolbar">
      <span class="toolbar-title">部门管理</span>
      <a-button v-permission="PermCode.Hr.Dept.ADD" type="primary" @click="openAdd()">
        <template #icon><icon-plus /></template>新增顶级部门
      </a-button>
    </div>

    <a-table
      row-key="id"
      :loading="loading"
      :columns="columns"
      :data="treeData"
      :default-expanded-keys="expandedKeys"
      :pagination="false"
    >
      <template #status="{ record }">
        <a-tag :color="record.status === 1 ? 'green' : 'red'">{{ statusText(record.status) }}</a-tag>
      </template>
      <template #actions="{ record }">
        <a-space>
          <a-button v-permission="PermCode.Hr.Dept.ADD" size="small" @click="openAdd(record)">新增子部门</a-button>
          <a-button v-permission="PermCode.Hr.Dept.EDIT" size="small" @click="openEdit(record)">编辑</a-button>
          <a-button v-permission="PermCode.Hr.Dept.REMOVE" size="small" status="danger" @click="remove(record)">删除</a-button>
        </a-space>
      </template>
    </a-table>

    <a-modal v-model:visible="visible" :title="dialogTitle" :confirm-loading="saving" @ok="save">
      <a-form :model="form" layout="vertical">
        <a-form-item field="parentId" label="上级部门">
          <a-select v-model="form.parentId" allow-clear placeholder="不选则为顶级部门">
            <a-option v-for="d in parentOptions" :key="d.id" :value="d.id">{{ d.deptName }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item field="deptName" label="部门名称" required><a-input v-model="form.deptName" /></a-form-item>
        <a-form-item field="deptCode" label="部门编码"><a-input v-model="form.deptCode" /></a-form-item>
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
.toolbar-title { font-weight: 600; }
</style>
