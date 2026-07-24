<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { clockIn, myRecords, myAppeals, submitAppeal } from '@/api/hr/attendance'
import type { AttendanceResp, AppealResp } from '@/api/hr/attendance'
import { AttendanceStatus, AttendanceStatusMeta } from '@/enums/hr/attendance-status'
import { AppealStatus, AppealStatusMeta } from '@/enums/hr/appeal-status'
import type { ApiId } from '@/api/system/types'

const loading = ref(false)
const clocking = ref(false)
const rows = ref<AttendanceResp[]>([])
const total = ref(0)
const appeals = ref<AppealResp[]>([])
const now = ref(new Date())
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)
const appealVisible = ref(false)
const appealForm = reactive<{ attendanceId?: ApiId; reason: string }>({ attendanceId: undefined, reason: '' })
const submitting = ref(false)

const statusList: AttendanceStatus[] = [
  AttendanceStatus.MISSING,
  AttendanceStatus.NORMAL,
  AttendanceStatus.LATE,
  AttendanceStatus.EARLY_LEAVE,
  AttendanceStatus.APPROVED,
]

function statusMeta(s?: number) {
  return s != null ? AttendanceStatusMeta[s as AttendanceStatus] : undefined
}

function appealStatusMeta(s?: number) {
  return s != null ? AppealStatusMeta[s as AppealStatus] : undefined
}

function formatTime(t?: string) {
  if (!t) return '-'
  return t.substring(11, 19)
}

async function loadData() {
  loading.value = true
  try {
    const result = await myRecords(currentYear.value, currentMonth.value)
    rows.value = result.list
    total.value = result.total
  } finally {
    loading.value = false
  }
}

async function loadAppeals() {
  appeals.value = await myAppeals()
}

async function doClockIn() {
  clocking.value = true
  try {
    await clockIn()
    Message.success('打卡成功')
    now.value = new Date()
    loadData()
  } finally {
    clocking.value = false
  }
}

function openAppeal(row: AttendanceResp) {
  appealForm.attendanceId = row.id
  appealForm.reason = ''
  appealVisible.value = true
}

async function doSubmitAppeal() {
  if (!appealForm.attendanceId || !appealForm.reason) {
    Message.warning('请填写申诉理由')
    return
  }
  submitting.value = true
  try {
    await submitAppeal({ attendanceId: appealForm.attendanceId, reason: appealForm.reason })
    Message.success('申诉已提交')
    appealVisible.value = false
    loadData()
    loadAppeals()
  } finally {
    submitting.value = false
  }
}

function canAppeal(row: AttendanceResp) {
  return row.status !== AttendanceStatus.NORMAL && row.status !== AttendanceStatus.APPROVED
}

function changeMonth(delta: number) {
  let m = currentMonth.value + delta
  let y = currentYear.value
  if (m < 1) { m = 12; y-- }
  if (m > 12) { m = 1; y++ }
  currentMonth.value = m
  currentYear.value = y
  loadData()
}

setInterval(() => { now.value = new Date() }, 1000)

onMounted(() => {
  loadData()
  loadAppeals()
})
</script>

<template>
  <div class="hr-page">
    <!-- 打卡区 -->
    <div class="clock-card">
      <div class="clock-time">{{ now.toLocaleTimeString('zh-CN') }}</div>
      <div class="clock-date">{{ now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) }}</div>
      <a-button type="primary" size="large" :loading="clocking" @click="doClockIn" style="margin-top: 12px; min-width: 160px;">
        打 卡
      </a-button>
    </div>

    <!-- 本月考勤 -->
    <div class="section">
      <div class="section-header">
        <a-space>
          <a-button size="small" @click="changeMonth(-1)"><template #icon><icon-left /></template></a-button>
          <span class="month-label">{{ currentYear }}年{{ currentMonth }}月</span>
          <a-button size="small" @click="changeMonth(1)"><template #icon><icon-right /></template></a-button>
        </a-space>
      </div>
      <a-table
        row-key="id"
        :loading="loading"
        :data="rows"
        :pagination="false"
        :columns="[
          { title: '日期', dataIndex: 'attendanceDate', width: 130 },
          { title: '上班打卡', slotName: 'clockIn', width: 120 },
          { title: '下班打卡', slotName: 'clockOut', width: 120 },
          { title: '状态', slotName: 'status', width: 140 },
          { title: '备注', dataIndex: 'remark', ellipsis: true },
          { title: '操作', slotName: 'actions', width: 100 },
        ]"
      >
        <template #clockIn="{ record }">{{ formatTime(record.clockInTime) }}</template>
        <template #clockOut="{ record }">{{ formatTime(record.clockOutTime) }}</template>
        <template #status="{ record }">
          <a-tag :color="statusMeta(record.status)?.color">{{ statusMeta(record.status)?.label }}</a-tag>
        </template>
        <template #actions="{ record }">
          <a-button v-if="canAppeal(record)" size="mini" type="text" @click="openAppeal(record)">申诉</a-button>
          <span v-else class="text-muted">-</span>
        </template>
      </a-table>
    </div>

    <!-- 我的申诉 -->
    <div class="section">
      <div class="section-header"><span>我的申诉</span></div>
      <a-table
        row-key="id"
        :data="appeals"
        :pagination="false"
        :columns="[
          { title: '日期', dataIndex: 'attendanceDate', width: 130 },
          { title: '申诉理由', dataIndex: 'reason', ellipsis: true },
          { title: '状态', slotName: 'appealStatus', width: 120 },
          { title: '审核意见', dataIndex: 'auditRemark', ellipsis: true },
          { title: '审核时间', dataIndex: 'auditTime', width: 170 },
        ]"
      >
        <template #appealStatus="{ record }">
          <a-tag :color="appealStatusMeta(record.status)?.color">{{ appealStatusMeta(record.status)?.label }}</a-tag>
        </template>
      </a-table>
    </div>

    <!-- 申诉弹窗 -->
    <a-modal v-model:visible="appealVisible" title="提交申诉" :confirm-loading="submitting" @ok="doSubmitAppeal">
      <a-form :model="appealForm" layout="vertical">
        <a-form-item field="reason" label="申诉理由" required>
          <a-textarea v-model="appealForm.reason" :max-length="500" show-word-limit :auto-size="{ minRows: 3 }" placeholder="请说明缺卡/迟到/早退的原因" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.hr-page { display: flex; flex-direction: column; gap: 16px; }
.clock-card { display: flex; flex-direction: column; align-items: center; padding: 32px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
.clock-time { font-size: 48px; font-weight: 600; color: var(--color-text-1); font-variant-numeric: tabular-nums; }
.clock-date { font-size: 14px; color: var(--color-text-3); margin-top: 4px; }
.section { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 16px; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; font-weight: 600; font-size: 15px; }
.month-label { font-size: 14px; font-weight: 500; min-width: 100px; text-align: center; }
.text-muted { color: var(--color-text-4); }
</style>
