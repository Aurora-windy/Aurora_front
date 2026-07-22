<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { addCart } from '@/api/mall/cart'
import { listAvailableProducts } from '@/api/mall/product'
import type { ProductQuery, ProductResp } from '@/api/mall/types'

const loading = ref(false)
const rows = ref<ProductResp[]>([])
const total = ref(0)
const query = reactive<ProductQuery>({ pageNum: 1, pageSize: 12, name: '' })

async function loadData() {
  loading.value = true
  try {
    const result = await listAvailableProducts(query)
    rows.value = result.list
    total.value = result.total
  } finally {
    loading.value = false
  }
}

function search() { query.pageNum = 1; loadData() }
async function addToCart(product: ProductResp) {
  await addCart({ productId: product.id, quantity: 1 })
  Message.success('已加入购物车')
}
function pageChange(pageNum: number) { query.pageNum = pageNum; loadData() }

onMounted(loadData)
</script>

<template>
  <div class="shop-page">
    <div class="page-toolbar">
      <a-input-search v-model="query.name" allow-clear placeholder="搜索商品" style="max-width: 320px" @search="search" />
    </div>
    <a-spin :loading="loading">
      <div class="product-grid">
        <a-card v-for="product in rows" :key="product.id" :title="product.name" :bordered="false" class="product-card">
          <p class="desc">{{ product.description || '暂无描述' }}</p>
          <div class="product-meta">
            <strong>¥{{ product.price }}</strong>
            <a-tag :color="product.stock > 0 ? 'green' : 'red'">库存 {{ product.stock }}</a-tag>
          </div>
          <a-button type="primary" long :disabled="product.stock < 1" @click="addToCart(product)">加入购物车</a-button>
        </a-card>
      </div>
    </a-spin>
    <a-pagination :total="total" :current="query.pageNum" :page-size="query.pageSize" show-total @change="pageChange" />
  </div>
</template>

<style scoped>
.shop-page { display: flex; flex-direction: column; gap: 16px; }
.page-toolbar { padding: 16px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
.product-card { min-height: 210px; }
.desc { min-height: 44px; color: var(--color-text-secondary); line-height: 1.6; }
.product-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.product-meta strong { color: var(--color-error); font-size: 20px; }
</style>
