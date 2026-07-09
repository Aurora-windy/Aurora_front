<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { PermCode } from '@/constants/perm-codes'
import { MenuType, getMenuTypeMeta } from '@/enums/system/menu-type'
import { Status, getStatusMeta } from '@/enums/common/status'
import { addMenu, deleteMenu, getMenu, listMenuTree, updateMenu } from '@/api/system/menu'
import type { MenuForm, MenuTreeResp } from '@/api/system/types'

const loading = ref(false)
const saving = ref(false)
const rows = ref<MenuTreeResp[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增菜单')

const form = reactive<MenuForm>({
  parentId: '0',
  title: '',
  type: MenuType.MENU,
  name: '',
  path: '',
  component: '',
  icon: '',
  permission: '',
  sort: 0,
  visible: 1,
  status: Status.ENABLED,
})

const columns = [
  { title: '菜单名称', dataIndex: 'title' },
  { title: '类型', slotName: 'type', width: 110 },
  { title: '路由路径', dataIndex: 'path' },
  { title: '组件', dataIndex: 'component' },
  { title: '权限码', dataIndex: 'permission' },
  { title: '排序', dataIndex: 'sort', width: 90 },
  { title: '状态', slotName: 'status', width: 100 },
  { title: '操作', slotName: 'actions', width: 220 },
]

function flattenMenus(list: MenuTreeResp[], result: MenuTreeResp[] = []) {
  for (const item of list) {
    result.push(item)
    flattenMenus(item.children ?? [], result)
  }
  return result
}

function resetForm(parentId = '0') {
  Object.assign(form, {
    id: undefined,
    parentId,
    title: '',
    type: MenuType.MENU,
    name: '',
    path: '',
    component: '',
    icon: '',
    permission: '',
    sort: 0,
    visible: 1,
    status: Status.ENABLED,
  })
}

async function loadData() {
  loading.value = true
  try {
    rows.value = await listMenuTree()
  } finally {
    loading.value = false
  }
}

function openAdd(parentId = '0') {
  resetForm(parentId)
  dialogTitle.value = '新增菜单'
  dialogVisible.value = true
}

async function openEdit(row: MenuTreeResp) {
  resetForm()
  const detail = await getMenu(row.id)
  Object.assign(form, detail)
  dialogTitle.value = '编辑菜单'
  dialogVisible.value = true
}

async function handleSave() {
  saving.value = true
  try {
    if (form.id) {
      await updateMenu(form)
      Message.success('菜单已更新')
    } else {
      await addMenu(form)
      Message.success('菜单已新增')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

function handleDelete(row: MenuTreeResp) {
  Modal.confirm({
    title: '删除菜单',
    content: `确认删除 ${row.title}？`,
    onOk: async () => {
      await deleteMenu(row.id)
      Message.success('菜单已删除')
      loadData()
    },
  })
}

onMounted(loadData)
</script>

<template>
  <div class="system-page">
    <div class="page-toolbar">
      <a-button type="primary" @click="loadData"><template #icon><icon-refresh /></template>刷新</a-button>
      <a-button v-permission="PermCode.System.Menu.ADD" type="primary" @click="openAdd()">
        <template #icon><icon-plus /></template>新增
      </a-button>
    </div>

    <a-table row-key="id" :loading="loading" :columns="columns" :data="rows" :pagination="false">
      <template #type="{ record }">
        <a-tag :color="getMenuTypeMeta(record.type).color">{{ getMenuTypeMeta(record.type).label }}</a-tag>
      </template>
      <template #status="{ record }">
        <a-tag :color="getStatusMeta(record.status ?? Status.DISABLED).color">
          {{ getStatusMeta(record.status ?? Status.DISABLED).label }}
        </a-tag>
      </template>
      <template #actions="{ record }">
        <a-space>
          <a-button v-permission="PermCode.System.Menu.ADD" size="small" @click="openAdd(record.id)">新增下级</a-button>
          <a-button v-permission="PermCode.System.Menu.EDIT" size="small" @click="openEdit(record)">编辑</a-button>
          <a-button v-permission="PermCode.System.Menu.REMOVE" size="small" status="danger" @click="handleDelete(record)">删除</a-button>
        </a-space>
      </template>
    </a-table>

    <a-modal v-model:visible="dialogVisible" :title="dialogTitle" :confirm-loading="saving" @ok="handleSave">
      <a-form :model="form" layout="vertical">
        <a-form-item field="parentId" label="上级菜单">
          <a-select v-model="form.parentId">
            <a-option value="0">根节点</a-option>
            <a-option v-for="menu in flattenMenus(rows)" :key="menu.id" :value="menu.id">{{ menu.title }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item field="title" label="菜单标题" required>
          <a-input v-model="form.title" />
        </a-form-item>
        <a-form-item field="type" label="类型" required>
          <a-radio-group v-model="form.type" type="button">
            <a-radio :value="MenuType.DIRECTORY">目录</a-radio>
            <a-radio :value="MenuType.MENU">菜单</a-radio>
            <a-radio :value="MenuType.BUTTON">按钮</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item field="name" label="路由名称">
          <a-input v-model="form.name" />
        </a-form-item>
        <a-form-item field="path" label="路由路径">
          <a-input v-model="form.path" placeholder="/system/users" />
        </a-form-item>
        <a-form-item field="component" label="组件路径">
          <a-input v-model="form.component" placeholder="system/user/index" />
        </a-form-item>
        <a-form-item field="icon" label="图标">
          <a-input v-model="form.icon" placeholder="IconUser" />
        </a-form-item>
        <a-form-item field="permission" label="权限码">
          <a-input v-model="form.permission" placeholder="system:user:list" />
        </a-form-item>
        <a-form-item field="sort" label="排序">
          <a-input-number v-model="form.sort" :min="0" />
        </a-form-item>
        <a-form-item field="visible" label="显示">
          <a-radio-group v-model="form.visible" type="button">
            <a-radio :value="1">显示</a-radio>
            <a-radio :value="0">隐藏</a-radio>
          </a-radio-group>
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
