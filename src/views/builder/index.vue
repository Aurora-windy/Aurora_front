<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { listBuilderModules, parseBuilderRequirement } from '@/api/builder'
import type { BuilderModuleResp, BuilderPlanResp } from '@/api/builder/types'

const defaultRequirement = '我需要做企业人事管理课设，包含部门、员工、考勤，不要选课系统'

const requirement = ref(defaultRequirement)
const modules = ref<BuilderModuleResp[]>([])
const plan = ref<BuilderPlanResp>()
const loadingModules = ref(false)
const parsing = ref(false)

const selectedModuleIds = computed(() => new Set(plan.value?.selectedModules.map((module) => module.id) ?? []))
const excludedModuleIds = computed(() => new Set(plan.value?.excludedModules ?? []))
const planJson = computed(() => (plan.value ? JSON.stringify(plan.value, null, 2) : ''))

function moduleTagColor(module: BuilderModuleResp) {
  if (module.required) return 'arcoblue'
  if (selectedModuleIds.value.has(module.id)) return 'green'
  if (excludedModuleIds.value.has(module.id)) return 'red'
  return 'gray'
}

function moduleStateText(module: BuilderModuleResp) {
  if (module.required) return '必选基座'
  if (selectedModuleIds.value.has(module.id)) return '已选中'
  if (excludedModuleIds.value.has(module.id)) return '已排除'
  return '未选择'
}

async function loadModules() {
  loadingModules.value = true
  try {
    modules.value = await listBuilderModules()
  } finally {
    loadingModules.value = false
  }
}

async function handleParse() {
  const text = requirement.value.trim()
  if (!text) {
    Message.warning('请先输入系统需求')
    return
  }
  parsing.value = true
  try {
    plan.value = await parseBuilderRequirement({ requirement: text })
    Message.success('模块方案已生成')
  } finally {
    parsing.value = false
  }
}

function useExample(type: 'hr' | 'edu' | 'mixed') {
  const examples = {
    hr: '我需要做企业人事管理课设，包含部门、岗位、员工、考勤，不要选课系统',
    edu: '我要学生选课教务系统，包含学生、教师、课程、选课、成绩和课表',
    mixed: '我要一个综合管理系统，同时包含企业员工考勤和学生课程管理',
  }
  requirement.value = examples[type]
}

onMounted(async () => {
  await loadModules()
})
</script>

<template>
  <div class="builder-page">
    <section class="hero-card">
      <div>
        <p class="eyebrow">AURORA Builder</p>
        <h2>自然语言生成模块组合方案</h2>
        <p class="subtitle">本批次只做受控解析和模块预览：AI/解析器不写业务代码，后续由成熟模板负责项目生成。</p>
      </div>
      <a-space>
        <a-tag color="arcoblue">无 Key 可用</a-tag>
        <a-tag color="green">后端解析</a-tag>
        <a-tag color="purple">JSON 标准输出</a-tag>
      </a-space>
    </section>

    <div class="builder-grid">
      <a-card title="需求输入" :bordered="false" class="panel-card">
        <a-textarea
          v-model="requirement"
          placeholder="描述你想生成的课设/系统需求，例如：我需要企业人事管理系统，包含部门、员工、考勤，不要选课系统"
          :auto-size="{ minRows: 7, maxRows: 12 }"
        />
        <div class="example-row">
          <span>示例：</span>
          <a-button size="mini" @click="useExample('hr')">人事系统</a-button>
          <a-button size="mini" @click="useExample('edu')">教务系统</a-button>
          <a-button size="mini" @click="useExample('mixed')">混合系统</a-button>
        </div>
        <a-button type="primary" long :loading="parsing" @click="handleParse">解析模块方案</a-button>
      </a-card>

      <a-card title="模块注册表" :bordered="false" class="panel-card">
        <a-spin :loading="loadingModules">
          <div class="module-list">
            <a-card v-for="module in modules" :key="module.id" size="small" class="module-card" :bordered="false">
              <template #title>
                <div class="module-title">
                  <span>{{ module.name }}</span>
                  <a-tag :color="moduleTagColor(module)">{{ moduleStateText(module) }}</a-tag>
                </div>
              </template>
              <p class="module-desc">{{ module.description }}</p>
              <a-space wrap>
                <a-tag v-for="feature in module.features" :key="feature" color="blue">{{ feature }}</a-tag>
              </a-space>
              <p class="dependency-line">依赖：{{ module.dependencies.length ? module.dependencies.join(' / ') : '无' }}</p>
            </a-card>
          </div>
        </a-spin>
      </a-card>
    </div>

    <div class="builder-grid result-grid">
      <a-card title="方案预览" :bordered="false" class="panel-card">
        <a-empty v-if="!plan" description="解析后展示模块方案" />
        <template v-else>
          <a-descriptions :column="1" bordered size="small">
            <a-descriptions-item label="请求 ID">{{ plan.requestId }}</a-descriptions-item>
            <a-descriptions-item label="下一步">{{ plan.nextStep }}</a-descriptions-item>
            <a-descriptions-item label="选中模块">{{ plan.selectedModules.map((module) => module.name).join(' + ') }}</a-descriptions-item>
            <a-descriptions-item label="排除模块">{{ plan.excludedModules.join(' / ') || '无' }}</a-descriptions-item>
            <a-descriptions-item label="缺失依赖">{{ plan.missingDependencies.join(' / ') || '无' }}</a-descriptions-item>
          </a-descriptions>
          <a-alert v-for="warning in plan.warnings" :key="warning" type="warning" class="warning-alert">{{ warning }}</a-alert>
        </template>
      </a-card>

      <a-card title="标准 JSON 输出" :bordered="false" class="panel-card">
        <a-empty v-if="!planJson" description="暂无 JSON" />
        <pre v-else class="json-preview">{{ planJson }}</pre>
      </a-card>
    </div>
  </div>
</template>

<style scoped>
.builder-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero-card,
.panel-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.hero-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-card h2 {
  margin: 0 0 8px;
  color: var(--color-text-title);
}

.subtitle,
.module-desc,
.dependency-line {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.builder-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 20px;
}

.example-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0 16px;
  color: var(--color-text-secondary);
}

.module-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.module-card {
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
}

.module-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.module-desc {
  margin-bottom: 12px;
}

.dependency-line {
  margin-top: 12px;
  font-size: 13px;
}

.warning-alert {
  margin-top: 12px;
}

.json-preview {
  max-height: 420px;
  overflow: auto;
  margin: 0;
  padding: 16px;
  color: var(--color-text-body);
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 1100px) {
  .hero-card,
  .builder-grid {
    grid-template-columns: 1fr;
  }

  .hero-card {
    flex-direction: column;
  }
}
</style>