<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { getAvailableProblem, listAvailableProblems } from '@/api/oj/problem'
import { submitCode } from '@/api/oj/submission'
import type { ProblemQuery, ProblemResp } from '@/api/oj/types'

const loading = ref(false)
const submitting = ref(false)
const rows = ref<ProblemResp[]>([])
const total = ref(0)
const selected = ref<ProblemResp | null>(null)
const query = reactive<ProblemQuery>({ pageNum: 1, pageSize: 8, title: '', difficulty: undefined })
const submitForm = reactive({ language: 'java', sourceCode: '// AC\n' })

function difficultyText(value?: number) {
  return value === 1 ? '简单' : value === 2 ? '中等' : '困难'
}

async function loadData() {
  loading.value = true
  try {
    const result = await listAvailableProblems(query)
    rows.value = result.list
    total.value = result.total
    const first = rows.value[0]
    if (!selected.value && first) {
      selected.value = await getAvailableProblem(first.id)
    }
  } finally {
    loading.value = false
  }
}

function search() {
  query.pageNum = 1
  selected.value = null
  loadData()
}

async function choose(row: ProblemResp) {
  selected.value = await getAvailableProblem(row.id)
}

async function submit() {
  if (!selected.value) return
  submitting.value = true
  try {
    await submitCode({ problemId: selected.value.id, language: submitForm.language, sourceCode: submitForm.sourceCode })
    Message.success('提交已记录，请到我的提交查看结果')
  } finally {
    submitting.value = false
  }
}

function pageChange(pageNum: number) {
  query.pageNum = pageNum
  selected.value = null
  loadData()
}

onMounted(loadData)
</script>

<template>
  <div class="practice-page">
    <aside class="problem-list">
      <div class="search-bar">
        <a-input-search v-model="query.title" allow-clear placeholder="搜索题目" @search="search" />
        <a-select v-model="query.difficulty" allow-clear placeholder="难度" @change="search">
          <a-option :value="1">简单</a-option>
          <a-option :value="2">中等</a-option>
          <a-option :value="3">困难</a-option>
        </a-select>
      </div>
      <a-spin :loading="loading">
        <button v-for="item in rows" :key="item.id" class="problem-item" :class="{ active: selected?.id === item.id }" @click="choose(item)">
          <span>{{ item.title }}</span>
          <a-tag :color="item.difficulty === 1 ? 'green' : item.difficulty === 2 ? 'orange' : 'red'">{{ difficultyText(item.difficulty) }}</a-tag>
        </button>
      </a-spin>
      <a-pagination simple :total="total" :current="query.pageNum" :page-size="query.pageSize" @change="pageChange" />
    </aside>

    <main class="solve-panel">
      <template v-if="selected">
        <section class="problem-detail">
          <div class="detail-title">
            <h2>{{ selected.title }}</h2>
            <a-space>
              <a-tag :color="selected.difficulty === 1 ? 'green' : selected.difficulty === 2 ? 'orange' : 'red'">{{ difficultyText(selected.difficulty) }}</a-tag>
              <a-tag>{{ selected.timeLimitMs }}ms</a-tag>
              <a-tag>{{ selected.memoryLimitMb }}MB</a-tag>
            </a-space>
          </div>
          <p class="description">{{ selected.description }}</p>
          <a-grid :cols="2" :col-gap="16">
            <div class="io-block"><strong>样例输入</strong><pre>{{ selected.sampleInput || '-' }}</pre></div>
            <div class="io-block"><strong>样例输出</strong><pre>{{ selected.sampleOutput || '-' }}</pre></div>
          </a-grid>
        </section>

        <section class="editor-panel">
          <div class="editor-toolbar">
            <a-select v-model="submitForm.language" style="width: 140px">
              <a-option value="java">Java 语言</a-option>
              <a-option value="python">Python 语言</a-option>
              <a-option value="go">Go 语言</a-option>
              <a-option value="cpp">C++ 语言</a-option>
            </a-select>
            <a-button type="primary" :loading="submitting" @click="submit">提交代码</a-button>
          </div>
          <a-textarea v-model="submitForm.sourceCode" class="code-editor" :auto-size="{ minRows: 14, maxRows: 24 }" />
        </section>
      </template>
      <a-empty v-else description="暂无可用题目" />
    </main>
  </div>
</template>

<style scoped>
.practice-page { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 16px; min-height: calc(100vh - 120px); }
.problem-list, .solve-panel { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 16px; }
.problem-list { display: flex; flex-direction: column; gap: 12px; }
.search-bar { display: grid; gap: 8px; }
.problem-item { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: transparent; color: var(--color-text-body); cursor: pointer; text-align: left; }
.problem-item.active, .problem-item:hover { border-color: var(--color-primary); background: var(--color-bg-hover); }
.solve-panel { display: flex; flex-direction: column; gap: 16px; }
.detail-title, .editor-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.detail-title h2 { margin: 0; font-size: 22px; }
.description { white-space: pre-wrap; line-height: 1.7; color: var(--color-text-body); }
.io-block { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 12px; }
.io-block pre { margin: 8px 0 0; white-space: pre-wrap; }
.code-editor :deep(textarea) { font-family: Consolas, 'Courier New', monospace; }
@media (max-width: 900px) { .practice-page { grid-template-columns: 1fr; } }
</style>
