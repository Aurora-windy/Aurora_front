<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { listStockLogs } from '@/api/mall/seckill'
import type { StockLogResp } from '@/api/mall/seckill'

const loading = ref(false)
const rows = ref<StockLogResp[]>([])
const total = ref(0)
const pageNum = ref(1)
const bizTypeMap: Record<number, string> = { 1: '下单扣减', 2: '取消回补', 3: '退款回补', 4: '人工调整' }

async function loadData() {
  loading.value = true
  try { const r = await listStockLogs({ pageNum: pageNum.value, pageSize: 10 }); rows.value = r.list; total.value = r.total } finally { loading.value = false }
}
onMounted(loadData)
</script>

<template>
  <div class="page">
    <a-table row-key="id" :loading="loading" :data="rows" :pagination="{ total, current: pageNum, pageSize: 10, showTotal: true }" @page-change="(p: number) => { pageNum = p; loadData() }"
      :columns="[
        { title: '商品', dataIndex: 'productName', width: 150 },
        { title: '类型', slotName: 'bizType', width: 120 },
        { title: '数量', dataIndex: 'quantity', width: 80 },
        { title: '订单ID', dataIndex: 'orderId', width: 180 },
        { title: '备注', dataIndex: 'remark' },
        { title: '时间', dataIndex: 'createTime', width: 170 },
      ]">
      <template #bizType="{ record }">{{ bizTypeMap[record.bizType] || record.bizType }}</template>
    </a-table>
  </div>
</template>
<style scoped>.page{padding:16px}</style>
