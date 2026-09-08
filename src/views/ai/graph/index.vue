<template>
  <div class="graph-page">
    <!-- 未启用 / 不可达时的空状态 -->
    <div v-if="!graphReady" class="graph-empty">
      <a-empty>
        <template #description>
          <span>
            {{ graphInfo?.status !== 'open'
              ? (graphInfo?.databaseName || '基础设施未就绪，请检查 Neo4j 配置和容器状态。')
              : '图谱数据为空，请先上传文档。' }}
          </span>
        </template>
      </a-empty>
      <a-button type="primary" @click="fileInputRef?.click()">上传文档</a-button>
      <div class="empty-hint">
        启用方式：设置环境变量 <code>AURORA_NEO4J_ENABLED=true</code> 以及 Neo4j 连接信息后重启后端。
      </div>
    </div>

    <template v-else>
      <!-- 头部 -->
      <div class="graph-header">
        <div class="header-title">
          <h3>知识图谱</h3>
          <span class="header-desc">
            {{ graphInfo?.databaseName }} · 共 {{ graphInfo?.entityCount }} 个实体，{{ graphInfo?.relationshipCount }} 条关系
          </span>
          <span class="status-indicator" :class="graphStatusClass"></span>
          <span class="status-text">{{ graphStatusText }}</span>
        </div>
        <div class="header-actions">
          <a-button status="danger" @click="handleDeleteAll">清空图谱</a-button>
          <a-button type="primary" @click="fileInputRef?.click()">
            <template #icon><icon-upload /></template>
            上传文档
          </a-button>
        </div>
      </div>

      <!-- 操作栏 -->
      <div class="graph-actions">
        <div class="actions-left">
          <a-input
            v-model="searchInput"
            placeholder="输入要检索的实体名称，回车检索"
            style="width: 260px"
            allow-clear
            @press-enter="handleSearch"
          />
          <a-button type="primary" :loading="searching" @click="handleSearch">检索实体</a-button>
          <a-button status="danger" @click="handleDeleteEntity">删除实体</a-button>
        </div>
        <div class="actions-right">
          <a-input-number v-model="sampleCount" :min="1" :max="500" :style="{ width: '110px' }" />
          <a-button :loading="fetching" @click="loadSample">获取节点</a-button>
        </div>
      </div>

      <!-- 图谱画布 -->
      <div class="graph-main">
        <div v-show="graphData.nodes.length > 0" ref="containerRef" class="graph-canvas"></div>
        <a-empty v-show="graphData.nodes.length === 0" style="padding: 4rem 0" description="暂无图谱数据，可点击「获取节点」或「上传文档」" />
      </div>

      <!-- 右下角装饰图：AURORA 风格抽象节点连线，pointer-events: none 不影响交互 -->
      <svg class="graph-deco" viewBox="0 0 280 240" aria-hidden="true">
        <defs>
          <radialGradient id="deco-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#1E3A8A" stop-opacity="0.55" />
            <stop offset="100%" stop-color="#1E3A8A" stop-opacity="0" />
          </radialGradient>
        </defs>
        <!-- 关系连线（贝塞尔曲线） -->
        <g fill="none" stroke="#1E3A8A" stroke-width="1.4" stroke-linecap="round" opacity="0.7">
          <path d="M40,50 Q90,20 130,30" />
          <path d="M130,30 Q190,50 220,70" />
          <path d="M40,50 Q50,110 70,150" />
          <path d="M70,150 Q130,190 180,170" />
          <path d="M220,70 Q210,130 180,170" />
          <path d="M180,170 Q220,200 250,200" />
          <path d="M130,30 Q100,100 70,150" stroke-dasharray="3 4" />
        </g>
        <!-- 节点（圆 + 中心高光） -->
        <g>
          <circle cx="40"  cy="50"  r="10" fill="url(#deco-glow)" />
          <circle cx="40"  cy="50"  r="5"  fill="#1E3A8A" />
          <circle cx="130" cy="30"  r="8"  fill="url(#deco-glow)" />
          <circle cx="130" cy="30"  r="4"  fill="#5B8FF9" />
          <circle cx="220" cy="70"  r="12" fill="url(#deco-glow)" />
          <circle cx="220" cy="70"  r="6"  fill="#1E3A8A" />
          <circle cx="70"  cy="150" r="9"  fill="url(#deco-glow)" />
          <circle cx="70"  cy="150" r="4.5" fill="#5AD8A6" />
          <circle cx="180" cy="170" r="11" fill="url(#deco-glow)" />
          <circle cx="180" cy="170" r="5.5" fill="#1E3A8A" />
          <circle cx="250" cy="200" r="7"  fill="url(#deco-glow)" />
          <circle cx="250" cy="200" r="3.5" fill="#F6BD16" />
        </g>
      </svg>
    </template>

    <!-- 原生文件选择：点「上传文档」按钮 → 弹系统文件选择框（不依赖拖拽） -->
    <input
      ref="fileInputRef"
      type="file"
      class="file-input-hidden"
      accept=".txt,.md,.markdown"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import * as echarts from 'echarts'
import {
  deleteAllGraph,
  deleteGraphEntity,
  getGraphInfo,
  getGraphTaskStatus,
  sampleGraphNodes,
  searchGraphEntity,
  uploadGraphDocument,
} from '@/api/ai/graph'
import type { GraphDataResp, GraphInfoResp, GraphTaskResp } from '@/api/ai/graph'

const containerRef = ref<HTMLDivElement>()
const searchInput = ref('')
const sampleCount = ref(100)
const fetching = ref(false)
const searching = ref(false)
const uploading = ref(false)
const graphInfo = ref<GraphInfoResp | null>(null)
const graphData = reactive<GraphDataResp>({ nodes: [], edges: [] })

let chartInstance: echarts.ECharts | null = null

const graphReady = computed(() => graphInfo.value?.status === 'open')

const graphStatusClass = computed(() => (graphReady.value ? 'open' : 'closed'))

const graphStatusText = computed(() => {
  if (graphReady.value) return '已连接'
  if (graphInfo.value?.status === 'disabled') return '未启用'
  if (graphInfo.value?.status === 'not_ready') return '基础设施未就绪'
  return '不可达'
})

function loadInfo() {
  getGraphInfo()
    .then((resp) => {
      graphInfo.value = resp
    })
    .catch(() => {
      graphInfo.value = { status: 'not_ready', databaseName: '基础设施未就绪：Neo4j 不可达，请检查容器和连接配置', entityCount: 0, relationshipCount: 0 }
    })
}

function loadSample() {
  fetching.value = true
  sampleGraphNodes(sampleCount.value)
    .then((data) => {
      Object.assign(graphData, data)
      renderGraph()
    })
    .finally(() => {
      fetching.value = false
    })
}

function handleSearch() {
  const name = searchInput.value.trim()
  if (!name) {
    loadSample()
    return
  }
  searching.value = true
  searchGraphEntity(name)
    .then((data) => {
      Object.assign(graphData, data)
      if (data.nodes.length === 0) {
        Message.info('未找到相关实体')
      }
      renderGraph()
    })
    .finally(() => {
      searching.value = false
    })
}

function handleDeleteEntity() {
  const name = searchInput.value.trim()
  if (!name) {
    Message.warning('请输入要删除的实体名称')
    return
  }
  Modal.confirm({
    title: '确认删除实体',
    content: `确定删除实体「${name}」及其全部关联关系吗？此操作不可恢复。`,
    onOk: async () => {
      await deleteGraphEntity(name)
      searchInput.value = ''
      Message.success('删除成功')
      loadInfo()
      loadSample()
    },
  })
}

function handleDeleteAll() {
  Modal.confirm({
    title: '确认清空图谱',
    content: '确定要删除图谱中的全部实体与关系吗？此操作不可恢复。',
    onOk: async () => {
      await deleteAllGraph()
      Message.success('图谱已清空')
      Object.assign(graphData, { nodes: [], edges: [] })
      loadInfo()
      renderGraph()
    },
  })
}

/** 原生文件选择框（点按钮触发 input.click()，100% 弹出系统选择框） */
const fileInputRef = ref<HTMLInputElement>()

/**
 * 轮询异步抽取任务直到终态。
 *
 * 背景：图谱抽取要跑一次 LLM 生成，慢时可达分钟级，同步等待必然超过 30 秒请求超时。
 * 后端已改为提交后台任务后立即返回 taskId，这里靠轮询拿结果——每次轮询都是独立的短请求，
 * 不会撞超时上限。
 */
function waitForGraphTask(taskId: string, timeoutMs = 5 * 60 * 1000) {
  const deadline = Date.now() + timeoutMs
  return new Promise<GraphTaskResp>((resolve, reject) => {
    const tick = () => {
      getGraphTaskStatus(taskId)
        .then((resp) => {
          if (resp.status !== 'PROCESSING') {
            resolve(resp)
            return
          }
          if (Date.now() > deadline) {
            reject(new Error('抽取耗时过长，请稍后刷新图谱查看结果'))
            return
          }
          setTimeout(tick, 2000)
        })
        .catch((err: Error) => reject(err))
    }
    tick()
  })
}

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // 允许重复选择同一文件
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    Message.error('文件过大，请上传 2MB 以内的文本文件')
    return
  }
  uploading.value = true
  uploadGraphDocument(file)
    .then(async (resp) => {
      const result = await waitForGraphTask(resp.taskId)
      if (result.status !== 'SUCCESS') {
        Message.warning(result.message || '图谱抽取未成功完成，请重试')
        return
      }
      if (result.triples > 0) {
        Message.success(`上传成功，已抽取 ${result.triples} 条实体关系`)
      } else {
        // 后端把"为什么没抽到"塞进了 message——前端直接展示，用户不用翻日志
        Message.warning(result.message || '上传成功，但文档未抽取到实体关系')
      }
      loadInfo()
      loadSample()
    })
    .catch((err: Error) => {
      Message.error(err.message || '上传失败')
    })
    .finally(() => {
      uploading.value = false
    })
}

// tableau 风格调色板（参考 shanxi palette.field='label'/color='tableau'：按实体名分类多色）
const PALETTE = [
  '#5B8FF9', '#5AD8A6', '#5D7092', '#F6BD16', '#E86452',
  '#6DC8EC', '#945FB9', '#FF9845', '#1E9493', '#FF99C3',
]

function colorFor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

function renderGraph() {
  nextTick(() => {
    if (!containerRef.value) return
    if (chartInstance) {
      chartInstance.dispose()
      chartInstance = null
    }
    if (graphData.nodes.length === 0) return
    const dom = containerRef.value
    chartInstance = echarts.init(dom)

    // 计算每个节点的度数（入边+出边），用于节点大小与 hover 强度
    const degreeMap = new Map<string, number>()
    graphData.nodes.forEach((n) => degreeMap.set(n.id, 0))
    graphData.edges.forEach((e) => {
      degreeMap.set(e.source, (degreeMap.get(e.source) ?? 0) + 1)
      degreeMap.set(e.target, (degreeMap.get(e.target) ?? 0) + 1)
    })
    const maxDegree = Math.max(1, ...Array.from(degreeMap.values()))

    chartInstance.setOption({
      backgroundColor: 'transparent',
      tooltip: {
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#e5e7eb',
        textStyle: { color: '#1f2937', fontSize: 12 },
        formatter: (params: { dataType?: string; data?: { name?: string; label?: string; degree?: number } }) => {
          if (params.dataType === 'edge') {
            return `<b>关系</b><br/>${params.data?.label ?? ''}`
          }
          return `<b>实体</b><br/>${params.data?.name ?? ''}<br/><span style="color:#6b7280">关联度：${params.data?.degree ?? 0}</span>`
        },
      },
      series: [
        {
          type: 'graph',
          layout: 'force',
          roam: true,
          draggable: true,
          animationDurationUpdate: 800,
          animationEasingUpdate: 'cubicOut',
          data: graphData.nodes.map((n) => {
            const deg = degreeMap.get(n.id) ?? 0
            const color = colorFor(n.name)
            return {
              id: n.id,
              name: n.name,
              degree: deg,
              // 度数越大节点越大（20..56）
              symbolSize: 22 + Math.sqrt(deg / maxDegree) * 34,
              itemStyle: { color, borderColor: '#fff', borderWidth: 2 },
            }
          }),
          links: graphData.edges.map((e) => ({
            source: e.source,
            target: e.target,
            label: e.type,
            lineStyle: { color: '#9aa3b2', width: 1.4, curveness: 0.08, opacity: 0.85 },
          })),
          label: {
            show: true,
            position: 'bottom',
            fontSize: 12,
            color: '#1f2937',
            fontWeight: 500,
            distance: 6,
            backgroundColor: 'rgba(255,255,255,0.85)',
            padding: [2, 4],
            borderRadius: 3,
          },
          edgeLabel: {
            show: true,
            fontSize: 10,
            color: '#4b5563',
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: [2, 5],
            borderRadius: 3,
            formatter: (params: { data?: { label?: string } }) => params.data?.label ?? '',
          },
          force: {
            repulsion: 380,
            edgeLength: 110,
            gravity: 0.08,
            friction: 0.18,
          },
          emphasis: {
            focus: 'adjacency',
            scale: 1.25,
            label: { fontWeight: 700 },
            lineStyle: { width: 2.5, color: '#1E3A8A' },
          },
          lineStyle: { color: '#9aa3b2', curveness: 0.08, width: 1.4 },
          itemStyle: { color: '#5B8FF9' },
          categories: PALETTE.map((c, i) => ({ name: `分类${i + 1}`, itemStyle: { color: c } })),
        },
      ],
    })
  })
}

function handleResize() {
  chartInstance?.resize()
}

onMounted(() => {
  loadInfo()
  loadSample()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<style scoped>
.graph-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px 20px;
  box-sizing: border-box;
}

.graph-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  height: 100%;
  text-align: center;
}

.empty-hint {
  font-size: 12px;
  color: var(--color-text-3);
}

.empty-hint code {
  background: var(--color-fill-2);
  padding: 2px 6px;
  border-radius: 4px;
}

.graph-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-2);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title h3 {
  margin: 0;
  font-size: 18px;
}

.header-desc {
  font-size: 13px;
  color: var(--color-text-3);
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-left: 6px;
}

.status-indicator.open {
  background: #00b42a;
  box-shadow: 0 0 6px rgba(0, 180, 42, 0.6);
}

.status-indicator.closed {
  background: #f53f3f;
}

.status-text {
  font-size: 13px;
  color: var(--color-text-2);
}

.header-actions {
  display: flex;
  gap: 10px;
}

.graph-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
}

.actions-left,
.actions-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.graph-main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.graph-canvas {
  flex: 1;
  min-height: 420px;
  background: var(--color-fill-2);
  border-radius: 12px;
}

.file-input-hidden {
  display: none;
}

.graph-deco {
  position: absolute;
  right: 8px;
  bottom: 8px;
  width: 240px;
  height: 200px;
  opacity: 0.18;
  pointer-events: none;
  z-index: 0;
  user-select: none;
}

.graph-main {
  position: relative;
  z-index: 1;
}
</style>
