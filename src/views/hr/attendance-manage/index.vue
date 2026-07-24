<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Message } from '@arco-design/web-vue'
import { listRecords, listAppeals, auditAppeal } from '@/api/hr/attendance'
import type { AttendanceResp, AppealResp } from '@/api/hr/attendance'
import { AttendanceStatus, AttendanceStatusMeta } from '@/enums/hr/attendance-status'
import { AppealStatus, AppealStatusMeta } from '@/enums/hr/appeal-status'
import type { ApiId } from '@/api/system/types'

const activeTab = ref('records')
const loading = ref(false)
const rows = ref<AttendanceResp[]>([])
const total = ref(0)
const appealRows = ref<AppealResp[]>([])
const appealTotal = ref(0)

const query = reactive({ pageNum: 1, pageSize: 10, deptId: undefined as ApiId | undefined, status: undefined as number | undefined, dateFrom: undefined as string | undefined, dateTo: undefined as string | undefined })
const appealQuery = reactive({ pageNum: 1, pageSize: 10, status: undefined as number | undefined })

const auditVisible = ref(false)
const auditForm = reactive<{ id?: ApiId; status?: number; auditRemark: string }>({ id: undefined, status: undefined, auditRemark: '' })
const auditing = ref(false)

const statusList: AttendanceStatus[] = [AttendanceStatus.MISSING, AttendanceStatus.NORMAL, AttendanceStatus.LATE, AttendanceStatus.EARLY_LEAVE, AttendanceStatus.APPROVED]
const appealStatusList: AppealStatus[] = [AppealStatus.PENDING, AppealStatus.APPROVED, AppealStatus.REJECTED]

function statusMeta(s?: number) { return s != null ? AttendanceStatusMeta[s as AttendanceStatus] : undefined }
function appealStatusMeta(s?: number) { return s != null ? AppealStatusMeta[s as AppealStatus] : undefined }
function formatTime(t?: string) { return t ? t.substring(11, 19) : '-' }

async function loadRecords() {
  loading.value = true
  try {
    const result = await listRecords(query)
    rows.value = result.list
    total.value = result.total
  } finally {
    loading.value = false
  }
}

async function loadAppeals() {
  loading.value = true
  try {
    const result = await listAppeals(appealQuery)
    appealRows.value = result.list
    appealTotal.value = result.total
  } finally {
    loading.value = false
  }
}

function search() {
  query.pageNum = 1
  loadRecords()
}

function searchAppeals() {
  appealQuery.pageNum = 1
  loadAppeals()
}

function openAudit(row: AppealResp) {
  auditForm.id = row.id
  auditForm.status = undefined
  auditForm.auditRemark = ''
  auditVisible.value = true
}

async function doAudit() {
  if (auditForm.status == null) {
    Message.warning('请选择审核结果')
    return
  }
  auditing.value = true
  try {
    await auditAppeal(auditForm.id!, { status: auditForm.status, auditRemark: auditForm.auditRemark })
    Message.success('审核完成')
    auditVisible.value = false
    loadAppeals()
  } finally {
    auditing.value = false
  }
}

function pageChange(pageNum: number) { query.pageNum = pageNum; loadRecords() }
function pageSizeChange(pageSize: number) { query.pageSize = pageSize; query.pageNum = 1; loadRecords() }
function appealPageChange(pageNum: number) { appealQuery.pageNum = pageNum; loadAppeals() }
function appealPageSizeChange(pageSize: number) { appealQuery.pageSize = pageSize; appealQuery.pageNum = 1; loadAppeals() }

function onTabChange(tab: string | number) {
  if (String(tab) === 'records') loadRecords()
  else loadAppeals()
}

onMounted(() => loadRecords())
</script>

<template>
  <div class="hr-page">
    <a-tabs v-model:active-key="activeTab" @change="onTabChange">
      <a-tab-pane key="records" title="考勤记录">
        <div class="page-toolbar">
          <a-space wrap>
            <a-select v-model="query.status" allow-clear placeholder="状态" style="width: 140px">
              <a-option v-for="s in statusList" :key="s" :value="s">{{ AttendanceStatusMeta[s].label }}</a-option>
            </a-select>
            <a-date-picker v-model="query.dateFrom" placeholder="开始日期" style="width: 140px" /><a-date-picker v-model="query.dateTo" placeholder="结束日期" style="width: 140px" />
            <a-button type="primary" @click="search">查询</a-button>
          </a-space>
        </div>
        <a-table
          row-key="id"
          :loading="loading"
          :data="rows"
          :pagination="{ total, current: query.pageNum, pageSize: query.pageSize, showTotal: true, showPageSize: true }"
          @page-change="pageChange"
          @page-size-change="pageSizeChange"
          :columns="[
            { title: '工号', dataIndex: 'empNo', width: 120 },
            { title: '姓名', dataIndex: 'empName', width: 100 },
            { title: '日期', dataIndex: 'attendanceDate', width: 130 },
            { title: '上班打卡', slotName: 'clockIn', width: 120 },
            { title: '下班打卡', slotName: 'clockOut', width: 120 },
            { title: '状态', slotName: 'status', width: 140 },
            { title: '备注', dataIndex: 'remark', ellipsis: true },
          ]"
        >
          <template #clockIn="{ record }">{{ formatTime(record.clockInTime) }}</template>
          <template #clockOut="{ record }">{{ formatTime(record.clockOutTime) }}</template>
          <template #status="{ record }">
            <a-tag :color="statusMeta(record.status)?.color">{{ statusMeta(record.status)?.label }}</a-tag>
          </template>
        </a-table>
      </a-tab-pane>

      <a-tab-pane key="appeals" title="申诉审核">
        <div class="page-toolbar">
          <a-space wrap>
            <a-select v-model="appealQuery.status" allow-clear placeholder="状态" style="width: 140px">
              <a-option v-for="s in appealStatusList" :key="s" :value="s">{{ AppealStatusMeta[s].label }}</a-option>
            </a-select>
            <a-button type="primary" @click="searchAppeals">查询</a-button>
          </a-space>
        </div>
        <a-table
          row-key="id"
          :loading="loading"
          :data="appealRows"
          :pagination="{ total: appealTotal, current: appealQuery.pageNum, pageSize: appealQuery.pageSize, showTotal: true, showPageSize: true }"
          @page-change="appealPageChange"
          @page-size-change="appealPageSizeChange"
          :columns="[
            { title: '工号', dataIndex: 'empNo', width: 120 },
            { title: '姓名', dataIndex: 'empName', width: 100 },
            { title: '日期', dataIndex: 'attendanceDate', width: 130 },
            { title: '申诉理由', dataIndex: 'reason', ellipsis: true },
            { title: '状态', slotName: 'appealStatus', width: 120 },
            { title: '审核意见', dataIndex: 'auditRemark', ellipsis: true },
            { title: '操作', slotName: 'actions', width: 100 },
          ]"
        >
          <template #appealStatus="{ record }">
            <a-tag :color="appealStatusMeta(record.status)?.color">{{ appealStatusMeta(record.status)?.label }}</a-tag>
          </template>
          <template #actions="{ record }">
            <a-button v-if="record.status === 0" size="small" type="primary" @click="openAudit(record)">审核</a-button>
            <span v-else class="text-muted">已处理</span>
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>

    <!-- 审核弹窗 -->
    <a-modal v-model:visible="auditVisible" title="审核申诉" :confirm-loading="auditing" @ok="doAudit">
      <a-form :model="auditForm" layout="vertical">
        <a-form-item field="status" label="审核结果" required>
          <a-radio-group v-model="auditForm.status" type="button">
            <a-radio :value="1">通过</a-radio>
            <a-radio :value="2">驳回</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item field="auditRemark" label="审核意见">
          <a-textarea v-model="auditForm.auditRemark" :max-length="255" show-word-limit :auto-size="{ minRows: 2 }" placeholder="可选，填写审核意见" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.hr-page { display: flex; flex-direction: column; gap: 16px; }
.page-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.text-muted { color: var(--color-text-4); font-size: 12px; }
</style>
