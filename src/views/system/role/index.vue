<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { PermCode } from '@/constants/perm-codes'
import { Status, getStatusMeta } from '@/enums/common/status'
import { addRole, assignRoleMenu, deleteRole, getRole, listRoles, updateRole, updateRoleStatus } from '@/api/system/role'
import { listMenuTree } from '@/api/system/menu'
import type { MenuTreeResp, RoleForm, RoleQuery, RoleResp } from '@/api/system/types'

interface MenuTreeNode {
  id: number
  title: string
  children?: MenuTreeNode[]
}

const loading = ref(false)
const saving = ref(false)
const rows = ref<RoleResp[]>([])
const total = ref(0)
const menuTree = ref<MenuTreeResp[]>([])
const dialogVisible = ref(false)
const menuDialogVisible = ref(false)
const dialogTitle = ref('新增角色')
const currentRole = ref<RoleResp | null>(null)
const checkedMenuIds = ref<number[]>([])

const query = reactive<RoleQuery>({ pageNum: 1, pageSize: 10, name: '', code: '', status: undefined })
const form = reactive<RoleForm>({ name: '', code: '', dataScope: 1, sort: 0, status: Status.ENABLED, remark: '' })

const columns = [
  { title: '角色名称', dataIndex: 'name' },
  { title: '角色编码', dataIndex: 'code' },
  { title: '数据范围', slotName: 'dataScope', width: 140 },
  { title: '排序', dataIndex: 'sort', width: 90 },
  { title: '状态', slotName: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  { title: '操作', slotName: 'actions', width: 260 },
]

const treeData = computed<MenuTreeNode[]>(() => mapMenuTree(menuTree.value))

function mapMenuTree(list: MenuTreeResp[]): MenuTreeNode[] {
  return list.map((item) => ({
    id: item.id,
    title: item.title,
    children: mapMenuTree(item.children ?? []),
  }))
}

function dataScopeLabel(scope: number) {
  if (scope === 1) return '全部数据'
  if (scope === 2) return '本部门及下级'
  return '本人数据'
}

function resetForm() {
  Object.assign(form, { id: undefined, name: '', code: '', dataScope: 1, sort: 0, status: Status.ENABLED, remark: '' })
}

async function loadMenus() {
  menuTree.value = await listMenuTree()
}

async function loadData() {
  loading.value = true
  try {
    const result = await listRoles(query)
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
  query.name = ''
  query.code = ''
  query.status = undefined
  handleSearch()
}

function openAdd() {
  resetForm()
  dialogTitle.value = '新增角色'
  dialogVisible.value = true
}

async function openEdit(row: RoleResp) {
  resetForm()
  const detail = await getRole(row.id)
  Object.assign(form, detail)
  dialogTitle.value = '编辑角色'
  dialogVisible.value = true
}

async function handleSave() {
  saving.value = true
  try {
    if (form.id) {
      await updateRole(form)
      Message.success('角色已更新')
    } else {
      await addRole(form)
      Message.success('角色已新增')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

function handleStatus(row: RoleResp) {
  const nextStatus = row.status === Status.ENABLED ? Status.DISABLED : Status.ENABLED
  Modal.confirm({
    title: nextStatus === Status.ENABLED ? '启用角色' : '禁用角色',
    content: `确认${nextStatus === Status.ENABLED ? '启用' : '禁用'} ${row.name}？`,
    onOk: async () => {
      await updateRoleStatus({ id: row.id, status: nextStatus })
      Message.success('状态已更新')
      loadData()
    },
  })
}

function handleDelete(row: RoleResp) {
  Modal.confirm({
    title: '删除角色',
    content: `确认删除 ${row.name}？`,
    onOk: async () => {
      await deleteRole(row.id)
      Message.success('角色已删除')
      loadData()
    },
  })
}

async function openAssignMenu(row: RoleResp) {
  const detail = await getRole(row.id)
  currentRole.value = detail
  checkedMenuIds.value = detail.menuIds ?? []
  menuDialogVisible.value = true
}

async function handleAssignMenu() {
  if (!currentRole.value) return
  await assignRoleMenu({ roleId: currentRole.value.id, menuIds: checkedMenuIds.value })
  Message.success('菜单权限已保存')
  menuDialogVisible.value = false
  loadData()
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
  await Promise.all([loadMenus(), loadData()])
})
</script>

<template>
  <div class="system-page">
    <div class="page-toolbar">
      <a-space wrap>
        <a-input v-model="query.name" allow-clear placeholder="角色名称" />
        <a-input v-model="query.code" allow-clear placeholder="角色编码" />
        <a-select v-model="query.status" allow-clear placeholder="状态" style="width: 120px">
          <a-option :value="Status.ENABLED">启用</a-option>
          <a-option :value="Status.DISABLED">禁用</a-option>
        </a-select>
        <a-button type="primary" @click="handleSearch"><template #icon><icon-search /></template>查询</a-button>
        <a-button @click="handleReset"><template #icon><icon-refresh /></template>重置</a-button>
      </a-space>
      <a-button v-permission="PermCode.System.Role.ADD" type="primary" @click="openAdd">
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
      <template #dataScope="{ record }">{{ dataScopeLabel(record.dataScope) }}</template>
      <template #status="{ record }">
        <a-tag :color="getStatusMeta(record.status ?? Status.DISABLED).color">
          {{ getStatusMeta(record.status ?? Status.DISABLED).label }}
        </a-tag>
      </template>
      <template #actions="{ record }">
        <a-space>
          <a-button v-permission="PermCode.System.Role.EDIT" size="small" @click="openEdit(record)">编辑</a-button>
          <a-button v-permission="PermCode.System.Role.EDIT" size="small" @click="handleStatus(record)">
            {{ record.status === Status.ENABLED ? '禁用' : '启用' }}
          </a-button>
          <a-button v-permission="PermCode.System.Role.ASSIGN_MENU" size="small" @click="openAssignMenu(record)">分配菜单</a-button>
          <a-button v-permission="PermCode.System.Role.REMOVE" size="small" status="danger" @click="handleDelete(record)">删除</a-button>
        </a-space>
      </template>
    </a-table>

    <a-modal v-model:visible="dialogVisible" :title="dialogTitle" :confirm-loading="saving" @ok="handleSave">
      <a-form :model="form" layout="vertical">
        <a-form-item field="name" label="角色名称" required>
          <a-input v-model="form.name" />
        </a-form-item>
        <a-form-item field="code" label="角色编码" required>
          <a-input v-model="form.code" :disabled="Boolean(form.id)" />
        </a-form-item>
        <a-form-item field="dataScope" label="数据范围" required>
          <a-select v-model="form.dataScope">
            <a-option :value="1">全部数据</a-option>
            <a-option :value="2">本部门及下级</a-option>
            <a-option :value="3">本人数据</a-option>
          </a-select>
        </a-form-item>
        <a-form-item field="sort" label="排序">
          <a-input-number v-model="form.sort" :min="0" />
        </a-form-item>
        <a-form-item field="status" label="状态">
          <a-radio-group v-model="form.status" type="button">
            <a-radio :value="Status.ENABLED">启用</a-radio>
            <a-radio :value="Status.DISABLED">禁用</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item field="remark" label="备注">
          <a-textarea v-model="form.remark" :auto-size="{ minRows: 3, maxRows: 4 }" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:visible="menuDialogVisible" title="分配菜单" @ok="handleAssignMenu">
      <a-tree
        v-model:checked-keys="checkedMenuIds"
        :data="treeData"
        checkable
        block-node
        :field-names="{ key: 'id', title: 'title', children: 'children' }"
      />
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
