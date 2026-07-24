<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { availableActivities, joinSeckill } from '@/api/mall/seckill'
import type { SeckillActivityResp } from '@/api/mall/seckill'

const loading = ref(false)
const rows = ref<SeckillActivityResp[]>([])
const joining = ref<Record<string, boolean>>({})

async function loadData() {
  loading.value = true
  try { rows.value = await availableActivities() } finally { loading.value = false }
}

async function doJoin(row: SeckillActivityResp) {
  joining.value[row.id] = true
  try {
    await joinSeckill(row.id, crypto.randomUUID())
    Message.success('抢购成功，订单已创建')
    loadData()
  } finally { joining.value[row.id] = false }
}

onMounted(loadData)
</script>

<template>
  <div class="page">
    <a-spin :loading="loading">
      <a-empty v-if="rows.length === 0" description="暂无进行中的秒杀活动" />
      <div class="grid">
        <a-card v-for="item in rows" :key="item.id" class="card">
          <div class="name">{{ item.productName }}</div>
          <div class="price"><span class="seckill-price">{{ item.seckillPrice }}</span><span class="original-price">{{ item.originalPrice }}</span></div>
          <div class="stock">剩余 {{ item.availableStock }} 件</div>
          <div class="time">{{ item.startTime }} ~ {{ item.endTime }}</div>
          <a-button type="primary" long :loading="joining[item.id]" @click="doJoin(item)">立即抢购</a-button>
        </a-card>
      </div>
    </a-spin>
  </div>
</template>
<style scoped>
.page{padding:16px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.card{text-align:center}
.name{font-size:16px;font-weight:600;margin-bottom:8px}
.seckill-price{font-size:24px;font-weight:700;color:var(--color-danger-light-4)}
.original-price{font-size:13px;color:var(--color-text-3);text-decoration:line-through;margin-left:8px}
.stock{margin:8px 0;color:var(--color-text-2)}
.time{font-size:12px;color:var(--color-text-3);margin-bottom:12px}
</style>
