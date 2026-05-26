<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import * as echarts from 'echarts'

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

const option: echarts.EChartsOption = {
  color: ['#1677ff'],
  tooltip: {
    trigger: 'axis',
  },
  grid: {
    left: 20,
    right: 20,
    top: 30,
    bottom: 20,
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: '访问量',
      type: 'line',
      smooth: true,
      areaStyle: {
        opacity: 0.12,
      },
      data: [120, 180, 150, 220, 260, 210, 300],
    },
  ],
}

onMounted(() => {
  if (!chartRef.value) {
    return
  }

  chart = echarts.init(chartRef.value)
  chart.setOption(option)

  window.addEventListener('resize', resizeChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  chart?.dispose()
  chart = null
})

function resizeChart() {
  chart?.resize()
}
</script>

<template>
  <el-card shadow="never" class="dashboard-card">
    <template #header>
      <div class="card-title">首页看板</div>
    </template>

    <div class="chart-box" ref="chartRef"></div>
  </el-card>
</template>

<style scoped>
.dashboard-card {
  border-radius: 10px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.chart-box {
  width: 100%;
  height: 380px;
}
</style>
