<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { PermCode } from '@/constants/perm-codes'
import { addEmployee, deleteEmployee, getEmployee, listEmployees, updateEmployee } from '@/api/hr/employee'
import { listDepts } from '@/api/hr/dept'
import { listPositions } from '@/api/hr/position'
import { EmpStatus, EmpStatusMeta } from '@/enums/hr/emp-status'
import type { ApiId } from '@/api/system/types'
import type { DeptResp, EmployeeForm, EmployeeQuery, EmployeeResp, PositionResp } from '@/api/hr/types'

const loading = ref(false)
const saving = ref(false)
const visible = ref(false)
const rows = ref<EmployeeResp[]>([])
const total = ref(0)
const depts = ref<DeptResp[]>([])
const positions = ref<PositionResp[]>([])
const query = reactive<EmployeeQuery>({ pageNum: 1, pageSize: 10, deptId: undefined, status: undefined, keyword: '' })
const form = reactive<EmployeeForm>({ empNo: '', name: '', gender: 0, phone: '', entryDate: '', status: EmpStatus.ACTIVE })
const dialogTitle = ref('新增员工')

const empStatusList: EmpStatus[] = [EmpStatus.QUIT, EmpStatus.ACTIVE, EmpStatus.PROBATION, EmpStatus.LEAVE]

const columns = [
  { title: '工号', dataIndex: 'empNo', width: 120 },
  { title: '姓名', dataIndex: 'name', width: 100 },
  { title: '部门', slotName: 'dept', width: 130 },
  { title: '岗位', slotName: 'position', width: 130 },
  { title: '性别', slotName: 'gender', width: 80 },
  { title: '电话', dataIndex: 'phone', width: 140 },
  { title: '入职日期', dataIndex: 'entryDate', width: 130 },
  { title: '状态', slotName: 'status', width: 100 },
  { title: '操作', slotName: 'actions', width: 180 },
]

function deptName(id?: ApiId) {
  return depts.value.find((d) => d.id === id)?.deptName ?? '-'
}

function posName(id?: ApiId) {
  return positions.value.find((p) => p.id === id)?.positionName ?? '-'
}

function genderText(g?: number) {
  return g === 1 ? '男' : g === 2 ? '女' : '未知'
}

function empStatusMeta(status?: number) {
  return status != null ? EmpStatusMeta[status as EmpStatus] : undefined
}

function resetForm() {
  Object.assign(form, { id: undefined, empNo: '', userId: undefined, deptId: undefined, positionId: undefined, name: '', gender: 0, phone: '', entryDate: '', status: EmpStatus.ACTIVE })
  positions.value = []
}

async function loadPositions(deptId?: ApiId) {
  positions.value = deptId ? await listPositions(deptId) : []
}

async function loadData() {
  loading.value = true
  try {
    const result = await listEmployees(query)
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

function resetQuery() {
  query.deptId = undefined
  query.status = undefined
  query.keyword = ''
  search()
}

function openAdd() {
  resetForm()
  dialogTitle.value = '新增员工'
  visible.value = true
}

async function openEdit(row: EmployeeResp) {
  resetForm()
  Object.assign(form, await getEmployee(row.id))
  await loadPositions(form.deptId)
  dialogTitle.value = '编辑员工'
  visible.value = true
}

type SelectValue = ApiId | number | boolean | Record<string, unknown> | Array<ApiId | number | boolean | Record<string, unknown>>

async function onDeptChange(value?: SelectValue) {
  const deptId = typeof value === 'string' ? value : undefined
  form.positionId = undefined
  await loadPositions(deptId)
}

async function save() {
  saving.value = true
  try {
    if (form.id) {
      await updateEmployee(form.id, form)
    } else {
      await addEmployee(form)
    }
    Message.success('员工已保存')
    visible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

function remove(row: EmployeeResp) {
  Modal.confirm({
    title: '删除员工',
    content: `确认删除 ${row.name}（${row.empNo}）?`,
    onOk: async () => {
      await deleteEmployee(row.id)
      Message.success('员工已删除')
      loadData()
    },
  })
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

onMounted(async () => {
  depts.value = await listDepts()
  loadData()
})
</script>

<template>
  <div class="hr-page">
    <div class="page-toolbar">
      <a-space wrap>
        <a-select v-model="query.deptId" allow-clear placeholder="部门" style="width: 180px">
          <a-option v-for="d in depts" :key="d.id" :value="d.id">{{ d.deptName }}</a-option>
        </a-select>
        <a-select v-model="query.status" allow-clear placeholder="状态" style="width: 120px">
          <a-option v-for="s in empStatusList" :key="s" :value="s">{{ EmpStatusMeta[s].label }}</a-option>
        </a-select>
        <a-input v-model="query.keyword" allow-clear placeholder="员工姓名" />
        <a-button type="primary" @click="search"><template #icon><icon-search /></template>查询</a-button>
        <a-button @click="resetQuery"><template #icon><icon-refresh /></template>重置</a-button>
      </a-space>
      <a-button v-permission="PermCode.Hr.Employee.ADD" type="primary" @click="openAdd">
        <template #icon><icon-plus /></template>新增
      </a-button>
    </div>

    <a-table
      row-key="id"
      :loading="loading"
      :columns="columns"
      :data="rows"
      :pagination="{ total, current: query.pageNum, pageSize: query.pageSize, showTotal: true, showPageSize: true }"
      @page-change="pageChange"
      @page-size-change="pageSizeChange"
    >
      <template #dept="{ record }">{{ deptName(record.deptId) }}</template>
      <template #position="{ record }">{{ posName(record.positionId) }}</template>
      <template #gender="{ record }">{{ genderText(record.gender) }}</template>
      <template #status="{ record }">
        <a-tag :color="empStatusMeta(record.status)?.color">{{ empStatusMeta(record.status)?.label }}</a-tag>
      </template>
      <template #actions="{ record }">
        <a-space>
          <a-button v-permission="PermCode.Hr.Employee.EDIT" size="small" @click="openEdit(record)">编辑</a-button>
          <a-button v-permission="PermCode.Hr.Employee.REMOVE" size="small" status="danger" @click="remove(record)">删除</a-button>
        </a-space>
      </template>
    </a-table>

    <a-modal v-model:visible="visible" :title="dialogTitle" :confirm-loading="saving" @ok="save">
      <a-form :model="form" layout="vertical">
        <a-form-item field="empNo" label="工号" required><a-input v-model="form.empNo" /></a-form-item>
        <a-form-item field="name" label="姓名" required><a-input v-model="form.name" /></a-form-item>
        <a-form-item field="deptId" label="部门" required>
          <a-select v-model="form.deptId" placeholder="请选择部门" @change="onDeptChange">
            <a-option v-for="d in depts" :key="d.id" :value="d.id">{{ d.deptName }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item field="positionId" label="岗位" required>
          <a-select v-model="form.positionId" placeholder="请选择岗位">
            <a-option v-for="p in positions" :key="p.id" :value="p.id">{{ p.positionName }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item field="gender" label="性别">
          <a-radio-group v-model="form.gender" type="button">
            <a-radio :value="1">男</a-radio>
            <a-radio :value="2">女</a-radio>
            <a-radio :value="0">未知</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item field="phone" label="电话"><a-input v-model="form.phone" /></a-form-item>
        <a-form-item field="entryDate" label="入职日期"><a-date-picker v-model="form.entryDate" value-format="YYYY-MM-DD" style="width: 100%" /></a-form-item>
        <a-form-item field="status" label="状态">
          <a-radio-group v-model="form.status" type="button">
            <a-radio v-for="s in empStatusList" :key="s" :value="s">{{ EmpStatusMeta[s].label }}</a-radio>
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
