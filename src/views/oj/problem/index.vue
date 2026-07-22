<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { PermCode } from '@/constants/perm-codes'
import { addProblem, deleteProblem, getProblem, listProblems, updateProblem } from '@/api/oj/problem'
import type { ProblemForm, ProblemQuery, ProblemResp } from '@/api/oj/types'

const loading = ref(false)
const saving = ref(false)
const visible = ref(false)
const rows = ref<ProblemResp[]>([])
const total = ref(0)
const query = reactive<ProblemQuery>({ pageNum: 1, pageSize: 10, title: '', difficulty: undefined, status: undefined })
const form = reactive<ProblemForm>({
  title: '',
  description: '',
  difficulty: 1,
  timeLimitMs: 1000,
  memoryLimitMb: 128,
  sampleInput: '',
  sampleOutput: '',
  testInput: '',
  expectedOutput: '',
  status: 1,
})
const dialogTitle = ref('新增题目')

const columns = [
  { title: '题目', dataIndex: 'title' },
  { title: '难度', slotName: 'difficulty', width: 100 },
  { title: '限制', slotName: 'limit', width: 150 },
  { title: '状态', slotName: 'status', width: 90 },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  { title: '操作', slotName: 'actions', width: 180 },
]

function difficultyText(value?: number) {
  return value === 1 ? '简单' : value === 2 ? '中等' : '困难'
}

function statusText(value?: number) {
  return value === 1 ? '启用' : '停用'
}

function resetForm() {
  Object.assign(form, {
    id: undefined,
    title: '',
    description: '',
    difficulty: 1,
    timeLimitMs: 1000,
    memoryLimitMb: 128,
    sampleInput: '',
    sampleOutput: '',
    testInput: '',
    expectedOutput: '',
    status: 1,
  })
}

async function loadData() {
  loading.value = true
  try {
    const result = await listProblems(query)
    rows.value = result.list
    total.value = result.total
  } finally {
    loading.value = false
  }
}

function search() {
  query.pageNum = 1
  loadData()
}

function reset() {
  query.title = ''
  query.difficulty = undefined
  query.status = undefined
  search()
}

function openAdd() {
  resetForm()
  dialogTitle.value = '新增题目'
  visible.value = true
}

async function openEdit(row: ProblemResp) {
  resetForm()
  Object.assign(form, await getProblem(row.id))
  dialogTitle.value = '编辑题目'
  visible.value = true
}

async function save() {
  saving.value = true
  try {
    if (form.id) await updateProblem(form.id, form)
    else await addProblem(form)
    Message.success('题目已保存')
    visible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

function remove(row: ProblemResp) {
  Modal.confirm({
    title: '删除题目',
    content: `确认删除 ${row.title}？`,
    onOk: async () => {
      await deleteProblem(row.id)
      Message.success('题目已删除')
      loadData()
    },
  })
}

function pageChange(pageNum: number) {
  query.pageNum = pageNum
  loadData()
}

function pageSizeChange(pageSize: number) {
  query.pageSize = pageSize
  query.pageNum = 1
  loadData()
}

onMounted(loadData)
</script>

<template>
  <div class="oj-page">
    <div class="page-toolbar">
      <a-space wrap>
        <a-input v-model="query.title" allow-clear placeholder="题目标题" />
        <a-select v-model="query.difficulty" allow-clear placeholder="难度" style="width: 120px">
          <a-option :value="1">简单</a-option>
          <a-option :value="2">中等</a-option>
          <a-option :value="3">困难</a-option>
        </a-select>
        <a-select v-model="query.status" allow-clear placeholder="状态" style="width: 120px">
          <a-option :value="1">启用</a-option>
          <a-option :value="0">停用</a-option>
        </a-select>
        <a-button type="primary" @click="search"><template #icon><icon-search /></template>查询</a-button>
        <a-button @click="reset"><template #icon><icon-refresh /></template>重置</a-button>
      </a-space>
      <a-button v-permission="PermCode.Oj.Problem.ADD" type="primary" @click="openAdd">
        <template #icon><icon-plus /></template>新增
      </a-button>
    </div>

    <a-table row-key="id" :loading="loading" :columns="columns" :data="rows" :pagination="{ total, current: query.pageNum, pageSize: query.pageSize, showTotal: true, showPageSize: true }" @page-change="pageChange" @page-size-change="pageSizeChange">
      <template #difficulty="{ record }">
        <a-tag :color="record.difficulty === 1 ? 'green' : record.difficulty === 2 ? 'orange' : 'red'">{{ difficultyText(record.difficulty) }}</a-tag>
      </template>
      <template #limit="{ record }">{{ record.timeLimitMs }}ms / {{ record.memoryLimitMb }}MB</template>
      <template #status="{ record }">
        <a-tag :color="record.status === 1 ? 'green' : 'red'">{{ statusText(record.status) }}</a-tag>
      </template>
      <template #actions="{ record }">
        <a-space>
          <a-button v-permission="PermCode.Oj.Problem.EDIT" size="small" @click="openEdit(record)">编辑</a-button>
          <a-button v-permission="PermCode.Oj.Problem.REMOVE" size="small" status="danger" @click="remove(record)">删除</a-button>
        </a-space>
      </template>
    </a-table>

    <a-modal v-model:visible="visible" :title="dialogTitle" :confirm-loading="saving" width="760px" @ok="save">
      <a-form :model="form" layout="vertical">
        <a-form-item field="title" label="题目标题" required><a-input v-model="form.title" /></a-form-item>
        <a-form-item field="description" label="题目描述" required><a-textarea v-model="form.description" :auto-size="{ minRows: 4, maxRows: 8 }" /></a-form-item>
        <a-grid :cols="2" :col-gap="16">
          <a-form-item field="difficulty" label="难度" required>
            <a-select v-model="form.difficulty">
              <a-option :value="1">简单</a-option>
              <a-option :value="2">中等</a-option>
              <a-option :value="3">困难</a-option>
            </a-select>
          </a-form-item>
          <a-form-item field="status" label="状态" required>
            <a-radio-group v-model="form.status" type="button">
              <a-radio :value="1">启用</a-radio>
              <a-radio :value="0">停用</a-radio>
            </a-radio-group>
          </a-form-item>
          <a-form-item field="timeLimitMs" label="时间限制(ms)" required><a-input-number v-model="form.timeLimitMs" :min="100" /></a-form-item>
          <a-form-item field="memoryLimitMb" label="内存限制(MB)" required><a-input-number v-model="form.memoryLimitMb" :min="16" /></a-form-item>
        </a-grid>
        <a-form-item field="sampleInput" label="样例输入"><a-textarea v-model="form.sampleInput" /></a-form-item>
        <a-form-item field="sampleOutput" label="样例输出"><a-textarea v-model="form.sampleOutput" /></a-form-item>
        <a-form-item field="testInput" label="测试输入"><a-textarea v-model="form.testInput" /></a-form-item>
        <a-form-item field="expectedOutput" label="期望输出"><a-textarea v-model="form.expectedOutput" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.oj-page { display: flex; flex-direction: column; gap: 16px; }
.page-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
</style>
