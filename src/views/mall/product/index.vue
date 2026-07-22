<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { PermCode } from '@/constants/perm-codes'
import { addProduct, deleteProduct, getProduct, listProducts, updateProduct, updateProductStatus } from '@/api/mall/product'
import type { ProductForm, ProductQuery, ProductResp } from '@/api/mall/types'

const loading = ref(false)
const saving = ref(false)
const visible = ref(false)
const rows = ref<ProductResp[]>([])
const total = ref(0)
const query = reactive<ProductQuery>({ pageNum: 1, pageSize: 10, name: '', status: undefined })
const form = reactive<ProductForm>({ name: '', description: '', price: 1, stock: 10, status: 0 })
const dialogTitle = ref('新增商品')

const columns = [
  { title: '商品名称', dataIndex: 'name' },
  { title: '价格', dataIndex: 'price', width: 110 },
  { title: '库存', dataIndex: 'stock', width: 100 },
  { title: '状态', slotName: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  { title: '操作', slotName: 'actions', width: 260 },
]

function statusText(status?: number) { return status === 1 ? '上架' : '下架' }
function resetForm() { Object.assign(form, { id: undefined, name: '', description: '', price: 1, stock: 10, status: 0 }) }

async function loadData() {
  loading.value = true
  try {
    const result = await listProducts(query)
    rows.value = result.list
    total.value = result.total
  } finally {
    loading.value = false
  }
}

function search() { query.pageNum = 1; loadData() }
function reset() { query.name = ''; query.status = undefined; search() }
function openAdd() { resetForm(); dialogTitle.value = '新增商品'; visible.value = true }

async function openEdit(row: ProductResp) {
  resetForm()
  Object.assign(form, await getProduct(row.id))
  dialogTitle.value = '编辑商品'
  visible.value = true
}

async function save() {
  saving.value = true
  try {
    if (form.id) await updateProduct(form.id, form)
    else await addProduct(form)
    Message.success('商品已保存')
    visible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

async function toggleStatus(row: ProductResp) {
  await updateProductStatus(row.id, row.status === 1 ? 0 : 1)
  Message.success('状态已更新')
  loadData()
}

function remove(row: ProductResp) {
  Modal.confirm({
    title: '删除商品',
    content: `确认删除 ${row.name}?`,
    onOk: async () => {
      await deleteProduct(row.id)
      Message.success('商品已删除')
      loadData()
    },
  })
}

function pageChange(pageNum: number) { query.pageNum = pageNum; loadData() }
function pageSizeChange(pageSize: number) { query.pageSize = pageSize; query.pageNum = 1; loadData() }

onMounted(loadData)
</script>

<template>
  <div class="mall-page">
    <div class="page-toolbar">
      <a-space wrap>
        <a-input v-model="query.name" allow-clear placeholder="商品名称" />
        <a-select v-model="query.status" allow-clear placeholder="状态" style="width: 120px">
          <a-option :value="1">上架</a-option>
          <a-option :value="0">下架</a-option>
        </a-select>
        <a-button type="primary" @click="search"><template #icon><icon-search /></template>查询</a-button>
        <a-button @click="reset"><template #icon><icon-refresh /></template>重置</a-button>
      </a-space>
      <a-button v-permission="PermCode.Mall.Product.ADD" type="primary" @click="openAdd"><template #icon><icon-plus /></template>新增</a-button>
    </div>

    <a-table row-key="id" :loading="loading" :columns="columns" :data="rows" :pagination="{ total, current: query.pageNum, pageSize: query.pageSize, showTotal: true, showPageSize: true }" @page-change="pageChange" @page-size-change="pageSizeChange">
      <template #status="{ record }"><a-tag :color="record.status === 1 ? 'green' : 'red'">{{ statusText(record.status) }}</a-tag></template>
      <template #actions="{ record }">
        <a-space>
          <a-button v-permission="PermCode.Mall.Product.STATUS" size="small" @click="toggleStatus(record)">{{ record.status === 1 ? '下架' : '上架' }}</a-button>
          <a-button v-permission="PermCode.Mall.Product.EDIT" size="small" @click="openEdit(record)">编辑</a-button>
          <a-button v-permission="PermCode.Mall.Product.REMOVE" size="small" status="danger" @click="remove(record)">删除</a-button>
        </a-space>
      </template>
    </a-table>

    <a-modal v-model:visible="visible" :title="dialogTitle" :confirm-loading="saving" @ok="save">
      <a-form :model="form" layout="vertical">
        <a-form-item field="name" label="商品名称" required><a-input v-model="form.name" /></a-form-item>
        <a-form-item field="description" label="描述"><a-textarea v-model="form.description" /></a-form-item>
        <a-form-item field="price" label="价格" required><a-input-number v-model="form.price" :min="0.01" :precision="2" /></a-form-item>
        <a-form-item field="stock" label="库存" required><a-input-number v-model="form.stock" :min="0" /></a-form-item>
        <a-form-item field="status" label="状态"><a-radio-group v-model="form.status" type="button"><a-radio :value="1">上架</a-radio><a-radio :value="0">下架</a-radio></a-radio-group></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.mall-page { display: flex; flex-direction: column; gap: 16px; }
.page-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
</style>
