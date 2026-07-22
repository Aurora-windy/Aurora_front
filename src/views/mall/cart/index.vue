<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { deleteCart, listCart, updateCart } from '@/api/mall/cart'
import { createOrder } from '@/api/mall/order'
import type { CartResp } from '@/api/mall/types'

const loading = ref(false)
const submitting = ref(false)
const rows = ref<CartResp[]>([])
const selectedRowKeys = ref<string[]>([])
const rowSelection = { type: 'checkbox', showCheckedAll: true } as const
const totalAmount = computed(() => rows.value.filter((row) => selectedRowKeys.value.includes(row.id)).reduce((sum, row) => sum + Number(row.subtotalAmount), 0))

const columns = [
  { title: '商品', dataIndex: 'productName' },
  { title: '价格', dataIndex: 'price', width: 100 },
  { title: '数量', slotName: 'quantity', width: 150 },
  { title: '小计', dataIndex: 'subtotalAmount', width: 120 },
  { title: '操作', slotName: 'actions', width: 100 },
]

async function loadData() {
  loading.value = true
  try {
    rows.value = await listCart()
  } finally {
    loading.value = false
  }
}

async function changeQuantity(row: CartResp, quantity: number) {
  await updateCart(row.id, { quantity })
  loadData()
}

function remove(row: CartResp) {
  Modal.confirm({
    title: '移除购物车',
    content: `确认移除 ${row.productName}?`,
    onOk: async () => {
      await deleteCart(row.id)
      Message.success('已移除')
      loadData()
    },
  })
}

async function submitOrder() {
  if (!selectedRowKeys.value.length) {
    Message.warning('请先选择商品')
    return
  }
  submitting.value = true
  try {
    await createOrder({ cartIds: selectedRowKeys.value })
    Message.success('订单已创建')
    selectedRowKeys.value = []
    loadData()
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="cart-page">
    <a-table row-key="id" v-model:selected-keys="selectedRowKeys" :row-selection="rowSelection" :loading="loading" :columns="columns" :data="rows" :pagination="false">
      <template #quantity="{ record }"><a-input-number :model-value="record.quantity" :min="1" :max="record.stock" @change="(value) => changeQuantity(record, Number(value || 1))" /></template>
      <template #actions="{ record }"><a-button size="small" status="danger" @click="remove(record)">移除</a-button></template>
    </a-table>
    <div class="cart-footer">
      <span>已选 {{ selectedRowKeys.length }} 件，合计 ¥{{ totalAmount.toFixed(2) }}</span>
      <a-button type="primary" :loading="submitting" @click="submitOrder">提交订单</a-button>
    </div>
  </div>
</template>

<style scoped>
.cart-page { display: flex; flex-direction: column; gap: 16px; }
.cart-footer { display: flex; align-items: center; justify-content: flex-end; gap: 16px; padding: 16px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
</style>
