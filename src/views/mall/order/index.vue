<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { listOrders } from '@/api/mall/order'
import type { OrderQuery, OrderResp } from '@/api/mall/types'

const loading = ref(false)
const rows = ref<OrderResp[]>([])
const total = ref(0)
const query = reactive<OrderQuery>({ pageNum: 1, pageSize: 10, orderNo: '', status: undefined })

const columns = [
  { title: '订单号', dataIndex: 'orderNo', width: 220 },
  { title: '用户 ID', dataIndex: 'userId', width: 180 },
  { title: '金额', dataIndex: 'totalAmount', width: 120 },
  { title: '状态', slotName: 'status', width: 100 },
  { title: '商品', slotName: 'items' },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
]

function statusText(status?: number) { return status === 0 ? '待支付' : status === 4 ? '已取消' : String(status ?? '-') }
function itemSummary(record: OrderResp) {
  return record.items?.map((item) => `${item.productName} x${item.quantity}`).join(' / ') || '-'
}

async function loadData() {
  loading.value = true
  try {
    const result = await listOrders(query)
    rows.value = result.list
    total.value = result.total
  } finally {
    loading.value = false
  }
}

function search() { query.pageNum = 1; loadData() }
function reset() { query.orderNo = ''; query.status = undefined; search() }
function pageChange(pageNum: number) { query.pageNum = pageNum; loadData() }
function pageSizeChange(pageSize: number) { query.pageSize = pageSize; query.pageNum = 1; loadData() }

onMounted(loadData)
</script>

<template>
  <div class="order-page">
    <div class="page-toolbar">
      <a-space wrap>
        <a-input v-model="query.orderNo" allow-clear placeholder="订单号" />
        <a-select v-model="query.status" allow-clear placeholder="状态" style="width: 120px"><a-option :value="0">待支付</a-option><a-option :value="4">已取消</a-option></a-select>
        <a-button type="primary" @click="search"><template #icon><icon-search /></template>查询</a-button>
        <a-button @click="reset"><template #icon><icon-refresh /></template>重置</a-button>
      </a-space>
    </div>
    <a-table row-key="id" :loading="loading" :columns="columns" :data="rows" :pagination="{ total, current: query.pageNum, pageSize: query.pageSize, showTotal: true, showPageSize: true }" @page-change="pageChange" @page-size-change="pageSizeChange">
      <template #status="{ record }"><a-tag color="arcoblue">{{ statusText(record.status) }}</a-tag></template>
      <template #items="{ record }">{{ itemSummary(record) }}</template>
    </a-table>
  </div>
</template>

<style scoped>
.order-page { display: flex; flex-direction: column; gap: 16px; }
.page-toolbar { padding: 16px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
</style>
