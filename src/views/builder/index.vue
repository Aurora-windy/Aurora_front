<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { generateBuilderPreview, listBuilderModules, parseBuilderRequirement } from '@/api/builder'
import type { BuilderGeneratePreviewResp, BuilderModuleResp, BuilderPlanResp } from '@/api/builder/types'

type ChatRole = 'assistant' | 'user'
type ExampleType = 'hr' | 'edu' | 'mixed'

interface ChatMessage {
  id: number
  role: ChatRole
  content: string
}

const examples: Record<ExampleType, string> = {
  hr: '我需要做企业人事管理课设，包含部门、岗位、员工、考勤，不要选课系统',
  edu: '我要学生选课教务系统，包含学生、教师、课程、选课、成绩和课表',
  mixed: '我要一个综合管理系统，同时包含企业员工考勤和学生课程管理',
}

const router = useRouter()
const requirement = ref('')
const modules = ref<BuilderModuleResp[]>([])
const plan = ref<BuilderPlanResp>()
const preview = ref<BuilderGeneratePreviewResp>()
const showDeveloper = ref(false)
const loadingModules = ref(false)
const parsing = ref(false)
const generating = ref(false)
const messages = ref<ChatMessage[]>([])

const selectedModuleIds = computed(() => new Set(plan.value?.selectedModules.map((module) => module.id) ?? []))
const excludedModuleIds = computed(() => new Set(plan.value?.excludedModules ?? []))
const planJson = computed(() => (plan.value ? JSON.stringify(plan.value, null, 2) : ''))
const previewJson = computed(() => (preview.value ? JSON.stringify(preview.value, null, 2) : ''))
const hasConversation = computed(() => messages.value.length > 0)
const canGeneratePreview = computed(() => !!plan.value && !plan.value.missingDependencies.length)

function pushMessage(role: ChatRole, content: string) {
  messages.value.push({
    id: Date.now() + messages.value.length,
    role,
    content,
  })
}

function moduleTagColor(module: BuilderModuleResp) {
  if (module.required) return 'arcoblue'
  if (selectedModuleIds.value.has(module.id)) return 'green'
  if (excludedModuleIds.value.has(module.id)) return 'red'
  return 'gray'
}

function moduleStateText(module: BuilderModuleResp) {
  if (module.required) return '必选'
  if (selectedModuleIds.value.has(module.id)) return '已选'
  if (excludedModuleIds.value.has(module.id)) return '排除'
  return '待选'
}

async function loadModules() {
  loadingModules.value = true
  try {
    modules.value = await listBuilderModules()
  } finally {
    loadingModules.value = false
  }
}

function useExample(type: ExampleType) {
  requirement.value = examples[type]
}

function resetBuilder() {
  requirement.value = ''
  plan.value = undefined
  preview.value = undefined
  messages.value = []
}

function backToWorkbench() {
  router.push('/workbench')
}

function summarizePlan(nextPlan: BuilderPlanResp) {
  const selected = nextPlan.selectedModules.map((module) => module.name).join(' + ')
  const excluded = nextPlan.excludedModules.length ? `\n已排除：${nextPlan.excludedModules.join(' / ')}` : ''
  const warnings = nextPlan.warnings.length ? `\n注意：${nextPlan.warnings.join('；')}` : ''
  return `我理解的模块方案是：${selected}。\n下一步：${nextPlan.nextStep}。${excluded}${warnings}`
}

function summarizePreview(nextPreview: BuilderGeneratePreviewResp) {
  const files = nextPreview.generatedFiles.map((file) => file.path).join('\n- ')
  const warnings = nextPreview.warnings.length ? `\n\n注意：${nextPreview.warnings.join('；')}` : ''
  return `生成预览已完成。\n构建 ID：${nextPreview.buildId}\n\n已生成：\n- ${files}${warnings}`
}

async function handleSend() {
  const text = requirement.value.trim()
  if (!text) {
    Message.warning('请先输入系统需求')
    return
  }
  parsing.value = true
  pushMessage('user', text)
  try {
    const nextPlan = await parseBuilderRequirement({ requirement: text })
    plan.value = nextPlan
    preview.value = undefined
    pushMessage('assistant', summarizePlan(nextPlan))
    requirement.value = ''
  } finally {
    parsing.value = false
  }
}

async function handleGeneratePreview() {
  if (!plan.value) {
    Message.warning('请先描述项目需求')
    return
  }
  generating.value = true
  try {
    const nextPreview = await generateBuilderPreview({
      requirement: plan.value.requirement,
      moduleIds: plan.value.selectedModules.map((module) => module.id),
    })
    preview.value = nextPreview
    pushMessage('assistant', summarizePreview(nextPreview))
  } finally {
    generating.value = false
  }
}

onMounted(async () => {
  await loadModules()
})
</script>

<template>
  <div class="codex-builder">
    <aside class="builder-sidebar">
      <div class="brand-row">
        <div class="brand-mark">A</div>
        <div>
          <strong>AURORA</strong>
          <span>Builder</span>
        </div>
      </div>

      <button class="side-action active" type="button" @click="showDeveloper = false">
        <span>+</span>
        新建项目
      </button>
      <button class="side-action" type="button" @click="backToWorkbench">
        <span>‹</span>
        返回工作台
      </button>
      <button class="side-action" type="button" @click="showDeveloper = !showDeveloper">
        <span>{ }</span>
        开发者视图
      </button>

      <div class="side-section">
        <p>项目模板</p>
        <button type="button" @click="useExample('hr')">企业人事管理系统</button>
        <button type="button" @click="useExample('edu')">学生选课教务系统</button>
        <button type="button" @click="useExample('mixed')">综合管理平台</button>
      </div>

      <div class="side-section muted">
        <p>当前状态</p>
        <span>{{ plan ? '方案已解析' : '等待需求' }}</span>
        <span>{{ preview ? '预览已生成' : '尚未生成预览' }}</span>
      </div>
    </aside>

    <main class="builder-main">
      <header class="main-topbar">
        <div class="crumb">
          <span>AURORA Builder</span>
          <span>本地</span>
          <span>main</span>
        </div>
        <a-space>
          <a-button size="small" @click="backToWorkbench">返回工作台</a-button>
          <a-button size="small" @click="resetBuilder">重置</a-button>
          <a-button size="small" @click="showDeveloper = !showDeveloper">
            {{ showDeveloper ? '隐藏开发者视图' : '开发者视图' }}
          </a-button>
        </a-space>
      </header>

      <section class="workspace" :class="{ 'with-chat': hasConversation }">
        <div v-if="!hasConversation" class="welcome">
          <div class="aurora-glyph">⌁</div>
          <h1>我们该构建什么？</h1>
          <div class="prompt-cards">
            <button type="button" @click="useExample('edu')">
              <span class="card-icon blue">⌁</span>
              <strong>生成教务选课系统</strong>
            </button>
            <button type="button" @click="useExample('hr')">
              <span class="card-icon purple">⌘</span>
              <strong>构建人事管理项目</strong>
            </button>
            <button type="button" @click="useExample('mixed')">
              <span class="card-icon green">↻</span>
              <strong>组合多个业务模块</strong>
            </button>
            <button type="button" @click="showDeveloper = true">
              <span class="card-icon orange">♨</span>
              <strong>查看模块和 JSON</strong>
            </button>
          </div>
        </div>

        <div v-else class="conversation">
          <div v-for="message in messages" :key="message.id" class="message-row" :class="message.role">
            <div class="message-avatar">{{ message.role === 'assistant' ? 'A' : '你' }}</div>
            <div class="message-content">
              <p>{{ message.content }}</p>
            </div>
          </div>
        </div>

        <section v-if="showDeveloper" class="developer-panel">
          <div class="developer-grid">
            <a-card title="模块注册表" :bordered="false">
              <a-spin :loading="loadingModules">
                <div class="module-list">
                  <div v-for="module in modules" :key="module.id" class="module-row">
                    <div>
                      <strong>{{ module.name }}</strong>
                      <p>{{ module.description }}</p>
                    </div>
                    <a-tag :color="moduleTagColor(module)">{{ moduleStateText(module) }}</a-tag>
                  </div>
                </div>
              </a-spin>
            </a-card>
            <a-card title="方案 JSON" :bordered="false">
              <a-empty v-if="!planJson" description="暂无方案" />
              <pre v-else class="json-preview">{{ planJson }}</pre>
            </a-card>
            <a-card title="生成文件" :bordered="false">
              <a-empty v-if="!preview" description="暂无文件" />
              <div v-else class="file-list">
                <div v-for="file in preview.generatedFiles" :key="file.path" class="file-row">
                  <strong>{{ file.path }}</strong>
                  <span>{{ file.description }}</span>
                </div>
              </div>
            </a-card>
            <a-card title="预览 JSON" :bordered="false">
              <a-empty v-if="!previewJson" description="暂无预览" />
              <pre v-else class="json-preview">{{ previewJson }}</pre>
            </a-card>
          </div>
        </section>
      </section>

      <footer class="composer-wrap">
        <div class="composer">
          <a-textarea
            v-model="requirement"
            placeholder="随心输入"
            :auto-size="{ minRows: 3, maxRows: 5 }"
            @keydown.ctrl.enter.prevent="handleSend"
          />
          <div class="composer-footer">
            <div class="composer-left">
              <button type="button" @click="useExample('edu')">+</button>
              <button type="button" @click="showDeveloper = true">模块</button>
              <button type="button" @click="handleGeneratePreview" :disabled="!canGeneratePreview || generating">
                生成预览
              </button>
            </div>
            <a-button shape="circle" type="primary" :loading="parsing" @click="handleSend">↑</a-button>
          </div>
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.codex-builder {
  display: grid;
  grid-template-columns: 292px minmax(0, 1fr);
  min-height: 100vh;
  margin: 0;
  background: var(--color-bg-page);
}

.builder-sidebar {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px 18px;
  background: var(--color-bg-sidebar);
  border-right: 1px solid var(--color-border);
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.brand-mark {
  display: grid;
  width: 30px;
  height: 30px;
  color: #fff;
  background: var(--color-primary);
  border-radius: 8px;
  place-items: center;
  font-weight: 700;
}

.brand-row strong,
.brand-row span {
  display: block;
}

.brand-row span {
  color: var(--color-text-secondary);
  font-size: 12px;
}

.side-action,
.side-section button {
  width: 100%;
  padding: 10px 12px;
  color: var(--color-text-body);
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
}

.side-action {
  display: flex;
  gap: 10px;
  align-items: center;
}

.side-action.active,
.side-action:hover,
.side-section button:hover {
  color: var(--color-primary);
  background: var(--color-menu-active-bg);
}

.side-section {
  margin-top: 10px;
}

.side-section p {
  margin: 0 0 8px;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.side-section.muted {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: auto;
  color: var(--color-text-secondary);
  font-size: 13px;
}

.builder-main {
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-width: 0;
  background: var(--color-bg-card);
}

.main-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 58px;
  padding: 0 26px;
}

.crumb {
  display: flex;
  gap: 20px;
  color: var(--color-text-body);
  font-size: 14px;
}

.workspace {
  overflow: auto;
  padding: 40px 32px 180px;
}

.workspace.with-chat {
  padding-top: 20px;
}

.welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 56vh;
}

.aurora-glyph {
  display: grid;
  width: 54px;
  height: 54px;
  margin-bottom: 22px;
  color: var(--color-primary);
  background: var(--color-primary-bg);
  border: 4px solid var(--color-primary-light);
  border-radius: 18px;
  place-items: center;
  font-size: 28px;
  font-weight: 700;
}

.welcome h1 {
  margin: 0 0 34px;
  color: var(--color-text-title);
  font-size: 30px;
  font-weight: 500;
  letter-spacing: 0;
}

.prompt-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 212px));
  gap: 14px;
}

.prompt-cards button {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 128px;
  padding: 20px;
  text-align: left;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(31, 35, 40, 0.04);
  cursor: pointer;
}

.prompt-cards button:hover {
  border-color: var(--color-primary-light);
  box-shadow: 0 8px 28px rgba(var(--color-primary-rgb), 0.10);
}

.card-icon {
  font-size: 22px;
  font-weight: 700;
}

.card-icon.blue {
  color: var(--color-primary);
}

.card-icon.purple {
  color: var(--color-primary-hover);
}

.card-icon.green {
  color: var(--color-success);
}

.card-icon.orange {
  color: var(--color-warning);
}

.conversation {
  width: min(860px, 100%);
  margin: 0 auto;
}

.message-row {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 14px;
  padding: 18px 0;
}

.message-avatar {
  display: grid;
  width: 34px;
  height: 34px;
  color: #fff;
  background: var(--color-primary);
  border-radius: 50%;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
}

.message-row.user .message-avatar {
  background: var(--color-primary-hover);
}

.message-content {
  padding-top: 5px;
  color: var(--color-text-body);
}

.message-content p {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.75;
}

.developer-panel {
  width: min(1120px, 100%);
  margin: 28px auto 0;
  padding: 18px;
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: 18px;
}

.developer-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.module-list,
.file-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.module-row,
.file-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.module-row p,
.file-row span {
  margin: 4px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.json-preview {
  max-height: 320px;
  overflow: auto;
  margin: 0;
  padding: 14px;
  color: var(--color-text-body);
  background: var(--color-bg-page);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.composer-wrap {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: center;
  padding: 18px 24px 26px;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), var(--color-bg-card) 26%);
}

.composer {
  width: min(900px, 100%);
  padding: 16px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  box-shadow: 0 18px 48px rgba(31, 35, 40, 0.14);
  pointer-events: auto;
}

.composer :deep(.arco-textarea-wrapper) {
  border: 0;
  background: transparent;
  box-shadow: none;
}

.composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.composer-left {
  display: flex;
  gap: 8px;
}

.composer-left button {
  height: 30px;
  padding: 0 10px;
  color: var(--color-text-secondary);
  background: transparent;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
}

.composer-left button:hover {
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.composer-left button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

@media (max-width: 1180px) {
  .codex-builder {
    grid-template-columns: 1fr;
  }

  .builder-sidebar {
    display: none;
  }

  .prompt-cards {
    grid-template-columns: repeat(2, minmax(150px, 1fr));
  }
}

@media (max-width: 720px) {
  .main-topbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 18px;
  }

  .workspace {
    padding: 24px 18px 170px;
  }

  .prompt-cards,
  .developer-grid {
    grid-template-columns: 1fr;
  }

  .welcome h1 {
    font-size: 26px;
  }
}
</style>
