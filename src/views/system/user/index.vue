<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { PermCode } from '@/constants/perm-codes'
import { Status, getStatusMeta } from '@/enums/common/status'
import { addUser, deleteUser, getUser, listUsers, resetUserPassword, updateUser, updateUserStatus } from '@/api/system/user'
import { listRoles } from '@/api/system/role'
import type { RoleResp, UserForm, UserQuery, UserResp } from '@/api/system/types'

const loading = ref(false)
const saving = ref(false)
const rows = ref<UserResp[]>([])
const roles = ref<RoleResp[]>([])
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref('新增用户')

const query = reactive<UserQuery>({
  pageNum: 1,
  pageSize: 10,
  username: '',
  nickname: '',
  status: undefined,
})

const form = reactive<UserForm>({
  username: '',
  nickname: '',
  password: '',
  email: '',
  phone: '',
  gender: 0,
  status: Status.ENABLED,
  roleIds: [],
})

const columns = [
  { title: '用户名', dataIndex: 'username' },
  { title: '昵称', dataIndex: 'nickname' },
  { title: '手机号', dataIndex: 'phone' },
  { title: '角色', slotName: 'roles' },
  { title: '状态', slotName: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  { title: '操作', slotName: 'actions', width: 260 },
]

function resetForm() {
  Object.assign(form, {
    id: undefined,
    username: '',
    nickname: '',
    password: '',
    email: '',
    phone: '',
    gender: 0,
    status: Status.ENABLED,
    roleIds: [],
  })
}

async function loadRoles() {
  const result = await listRoles({ pageNum: 1, pageSize: 100 })
  roles.value = result.list
}

async function loadData() {
  loading.value = true
  try {
    const result = await listUsers(query)
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
  query.username = ''
  query.nickname = ''
  query.status = undefined
  handleSearch()
}

function openAdd() {
  resetForm()
  dialogTitle.value = '新增用户'
  dialogVisible.value = true
}

async function openEdit(row: UserResp) {
  resetForm()
  const detail = await getUser(row.id)
  Object.assign(form, { ...detail, password: '', roleIds: detail.roleIds ?? [] })
  dialogTitle.value = '编辑用户'
  dialogVisible.value = true
}

async function handleSave() {
  saving.value = true
  try {
    if (form.id) {
      await updateUser(form)
      Message.success('用户已更新')
    } else {
      await addUser(form)
      Message.success('用户已新增')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

function handleDelete(row: UserResp) {
  Modal.confirm({
    title: '删除用户',
    content: `确认删除 ${row.username}？`,
    onOk: async () => {
      await deleteUser(row.id)
      Message.success('用户已删除')
      loadData()
    },
  })
}

function handleStatus(row: UserResp) {
  const nextStatus = row.status === Status.ENABLED ? Status.DISABLED : Status.ENABLED
  Modal.confirm({
    title: nextStatus === Status.ENABLED ? '启用用户' : '禁用用户',
    content: `确认${nextStatus === Status.ENABLED ? '启用' : '禁用'} ${row.username}？`,
    onOk: async () => {
      await updateUserStatus({ id: row.id, status: nextStatus })
      Message.success('状态已更新')
      loadData()
    },
  })
}

function handleResetPassword(row: UserResp) {
  Modal.confirm({
    title: '重置密码',
    content: `确认重置 ${row.username} 的密码？`,
    onOk: async () => {
      await resetUserPassword({ id: row.id })
      Message.success('密码已重置')
    },
  })
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

onMounted(async () => {
  await loadRoles()
  await loadData()
})
</script>

<template>
  <div class="system-page">
    <div class="page-toolbar">
      <a-space wrap>
        <a-input v-model="query.username" allow-clear placeholder="用户名" />
        <a-input v-model="query.nickname" allow-clear placeholder="昵称" />
        <a-select v-model="query.status" allow-clear placeholder="状态" style="width: 120px">
          <a-option :value="Status.ENABLED">启用</a-option>
          <a-option :value="Status.DISABLED">禁用</a-option>
        </a-select>
        <a-button type="primary" @click="handleSearch"><template #icon><icon-search /></template>查询</a-button>
        <a-button @click="handleReset"><template #icon><icon-refresh /></template>重置</a-button>
      </a-space>
      <a-button v-permission="PermCode.System.User.ADD" type="primary" @click="openAdd">
        <template #icon><icon-plus /></template>新增
      </a-button>
    </div>

    <a-table
      row-key="id"
      :loading="loading"
      :columns="columns"
      :data="rows"
      :pagination="{ total, current: query.pageNum, pageSize: query.pageSize, showTotal: true, showPageSize: true }"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    >
      <template #roles="{ record }">
        <a-space wrap>
          <a-tag v-for="code in record.roleCodes || []" :key="code" color="blue">{{ code }}</a-tag>
        </a-space>
      </template>
      <template #status="{ record }">
        <a-tag :color="getStatusMeta(record.status ?? Status.DISABLED).color">
          {{ getStatusMeta(record.status ?? Status.DISABLED).label }}
        </a-tag>
      </template>
      <template #actions="{ record }">
        <a-space>
          <a-button v-permission="PermCode.System.User.EDIT" size="small" @click="openEdit(record)">编辑</a-button>
          <a-button v-permission="PermCode.System.User.STATUS" size="small" @click="handleStatus(record)">
            {{ record.status === Status.ENABLED ? '禁用' : '启用' }}
          </a-button>
          <a-button v-permission="PermCode.System.User.RESET_PASSWORD" size="small" @click="handleResetPassword(record)">重置密码</a-button>
          <a-button v-permission="PermCode.System.User.REMOVE" size="small" status="danger" @click="handleDelete(record)">删除</a-button>
        </a-space>
      </template>
    </a-table>

    <a-modal v-model:visible="dialogVisible" :title="dialogTitle" :confirm-loading="saving" @ok="handleSave">
      <a-form :model="form" layout="vertical">
        <a-form-item field="username" label="用户名" required>
          <a-input v-model="form.username" :disabled="Boolean(form.id)" />
        </a-form-item>
        <a-form-item v-if="!form.id" field="password" label="密码">
          <a-input-password v-model="form.password" placeholder="留空使用默认密码" />
        </a-form-item>
        <a-form-item field="nickname" label="昵称" required>
          <a-input v-model="form.nickname" />
        </a-form-item>
        <a-form-item field="phone" label="手机号">
          <a-input v-model="form.phone" />
        </a-form-item>
        <a-form-item field="email" label="邮箱">
          <a-input v-model="form.email" />
        </a-form-item>
        <a-form-item field="roleIds" label="角色">
          <a-select v-model="form.roleIds" multiple allow-clear>
            <a-option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }} / {{ role.code }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item field="status" label="状态">
          <a-radio-group v-model="form.status" type="button">
            <a-radio :value="Status.ENABLED">启用</a-radio>
            <a-radio :value="Status.DISABLED">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.system-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
}
</style>
