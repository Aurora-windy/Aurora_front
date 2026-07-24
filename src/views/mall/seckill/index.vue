<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { listActivities, createActivity, updateActivity, toggleActivityStatus } from '@/api/mall/seckill'
import type { SeckillActivityResp, SeckillActivityForm } from '@/api/mall/seckill'
import type { ApiId } from '@/api/system/types'

const loading = ref(false)
const rows = ref<SeckillActivityResp[]>([])
const total = ref(0)
const pageNum = ref(1)
const visible = ref(false)
const saving = ref(false)
const dialogTitle = ref('新增秒杀活动')
const form = reactive<SeckillActivityForm & { id?: ApiId }>({ productId: '', seckillPrice: 0, seckillStock: 1, limitPerUser: 1, startTime: '', endTime: '' })

async function loadData() {
  loading.value = true
  try { const r = await listActivities(pageNum.value); rows.value = r.list; total.value = r.total } finally { loading.value = false }
}
function openAdd() { Object.assign(form, { id: undefined, productId: '', seckillPrice: 0, seckillStock: 1, limitPerUser: 1, startTime: '', endTime: '' }); dialogTitle.value = '新增秒杀活动'; visible.value = true }
function openEdit(row: SeckillActivityResp) { Object.assign(form, { id: row.id, productId: row.productId, seckillPrice: row.seckillPrice, seckillStock: row.seckillStock, limitPerUser: row.limitPerUser, startTime: row.startTime, endTime: row.endTime }); dialogTitle.value = '编辑秒杀活动'; visible.value = true }
async function save() {
  saving.value = true
  try {
    if (form.id) await updateActivity(form.id, form)
    else await createActivity(form)
    Message.success('已保存'); visible.value = false; loadData()
  } finally { saving.value = false }
}
async function toggle(row: SeckillActivityResp) { await toggleActivityStatus(row.id, row.status === 1 ? 0 : 1); Message.success('已更新'); loadData() }
onMounted(loadData)
</script>

<template>
  <div class="page">
    <div class="toolbar"><a-button type="primary" @click="openAdd">新增活动</a-button></div>
    <a-table row-key="id" :loading="loading" :data="rows" :pagination="{ total, current: pageNum, pageSize: 10, showTotal: true }" @page-change="(p: number) => { pageNum = p; loadData() }"
      :columns="[
        { title: '商品', dataIndex: 'productName', width: 150 },
        { title: '秒杀价', dataIndex: 'seckillPrice', width: 100 },
        { title: '原价', dataIndex: 'originalPrice', width: 100 },
        { title: '总库存', dataIndex: 'seckillStock', width: 80 },
        { title: '剩余', dataIndex: 'availableStock', width: 80 },
        { title: '限购', dataIndex: 'limitPerUser', width: 70 },
        { title: '开始时间', dataIndex: 'startTime', width: 170 },
        { title: '结束时间', dataIndex: 'endTime', width: 170 },
        { title: '状态', slotName: 'status', width: 90 },
        { title: '操作', slotName: 'actions', width: 150 },
      ]">
      <template #status="{ record }"><a-tag :color="record.status === 1 ? 'green' : 'red'">{{ record.status === 1 ? '启用' : '禁用' }}</a-tag></template>
      <template #actions="{ record }">
        <a-space>
          <a-button size="small" @click="openEdit(record)">编辑</a-button>
          <a-button size="small" :status="record.status === 1 ? 'danger' : 'success'" @click="toggle(record)">{{ record.status === 1 ? '禁用' : '启用' }}</a-button>
        </a-space>
      </template>
    </a-table>
    <a-modal v-model:visible="visible" :title="dialogTitle" :confirm-loading="saving" @ok="save">
      <a-form :model="form" layout="vertical">
        <a-form-item label="商品ID" required><a-input v-model="form.productId" /></a-form-item>
        <a-form-item label="秒杀价" required><a-input-number v-model="form.seckillPrice" :min="0.01" :precision="2" style="width:100%" /></a-form-item>
        <a-form-item label="秒杀库存" required><a-input-number v-model="form.seckillStock" :min="1" style="width:100%" /></a-form-item>
        <a-form-item label="每人限购"><a-input-number v-model="form.limitPerUser" :min="1" style="width:100%" /></a-form-item>
        <a-form-item label="开始时间" required><a-date-picker v-model="form.startTime" show-time style="width:100%" /></a-form-item>
        <a-form-item label="结束时间" required><a-date-picker v-model="form.endTime" show-time style="width:100%" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
<style scoped>.page{display:flex;flex-direction:column;gap:16px}.toolbar{display:flex;justify-content:flex-end}</style>
