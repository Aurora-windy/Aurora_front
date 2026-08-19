<script setup lang='ts'>
import { onMounted, reactive, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { PermCode } from '@/constants/perm-codes'
import { Status } from '@/enums/common/status'
import { CourseCategory } from '@/enums/edu/course-category'
import { addCourse, deleteCourse, getCourse, listCourses, updateCourse } from '@/api/edu/course'
import { listTeachers } from '@/api/edu/teacher'
import type { CourseForm, CourseQuery, CourseResp, TeacherResp } from '@/api/edu/types'

const t = {
  code: '\u8bfe\u7a0b\u7f16\u7801', name: '\u8bfe\u7a0b\u540d\u79f0', teacher: '\u6388\u8bfe\u6559\u5e08', credit: '\u5b66\u5206', capacity: '\u5bb9\u91cf', selected: '\u5df2\u9009', remaining: '\u5269\u4f59\u540d\u989d', window: '\u9009\u8bfe\u65f6\u95f4', status: '\u72b6\u6001', actions: '\u64cd\u4f5c', category: '\u8bfe\u7a0b\u7c7b\u522b',
  search: '\u67e5\u8be2', reset: '\u91cd\u7f6e', add: '\u65b0\u589e', edit: '\u7f16\u8f91', remove: '\u5220\u9664', publish: '\u53d1\u5e03', publishBatch: '\u6279\u91cf\u53d1\u5e03', publishOk: '\u8bfe\u7a0b\u5df2\u53d1\u5e03', publishNone: '\u8bf7\u5148\u9009\u62e9\u8bfe\u7a0b', saveOk: '\u8bfe\u7a0b\u5df2\u4fdd\u5b58', removeOk: '\u8bfe\u7a0b\u5df2\u5220\u9664',
  addTitle: '\u65b0\u589e\u8bfe\u7a0b', editTitle: '\u7f16\u8f91\u8bfe\u7a0b', removeTitle: '\u5220\u9664\u8bfe\u7a0b', removeConfirm: '\u786e\u8ba4\u5220\u9664', enabled: '\u542f\u7528', disabled: '\u7981\u7528', start: '\u5f00\u59cb\u65f6\u95f4', end: '\u7ed3\u675f\u65f6\u95f4',
  required: '\u5fc5\u4fee', optional: '\u9009\u4fee', public: '\u516c\u9009', placeholderTime: '2026-07-08T08:00:00',
}

const loading = ref(false)
const saving = ref(false)
const rows = ref<CourseResp[]>([])
const selectedRowKeys = ref<string[]>([])
const teachers = ref<TeacherResp[]>([])
const total = ref(0)
const visible = ref(false)
const dialogTitle = ref(t.addTitle)
const query = reactive<CourseQuery>({ pageNum: 1, pageSize: 10, courseCode: '', name: '', status: undefined })
const form = reactive<CourseForm>({ courseCode: '', name: '', teacherId: undefined, category: CourseCategory.OPTIONAL, credit: 1, capacity: 30, selectionStartTime: '', selectionEndTime: '', status: Status.DISABLED })
const rowSelection = { type: 'checkbox', showCheckedAll: true } as const

const columns = [
  { title: t.code, dataIndex: 'courseCode', width: 130 },
  { title: t.name, dataIndex: 'name', width: 170 },
  { title: t.teacher, slotName: 'teacher', width: 150 },
  { title: t.credit, dataIndex: 'credit', width: 80 },
  { title: t.capacity, dataIndex: 'capacity', width: 90 },
  { title: t.selected, dataIndex: 'selectedCount', width: 90 },
  { title: t.remaining, slotName: 'remaining', width: 110 },
  { title: t.window, slotName: 'window', width: 260 },
  { title: t.status, slotName: 'status', width: 90 },
  { title: t.actions, slotName: 'actions', width: 230 },
]

const categoryOptions = [
  { value: CourseCategory.REQUIRED, label: t.required },
  { value: CourseCategory.OPTIONAL, label: t.optional },
  { value: CourseCategory.PUBLIC, label: t.public },
]

function teacherName(id?: string) { return teachers.value.find((item) => item.id === id)?.name ?? id ?? '-' }
function remainingColor(course: CourseResp) { return course.remainingCount > 0 ? 'green' : 'red' }
function statusText(status?: number) { return status === Status.ENABLED ? t.enabled : t.disabled }
function statusColor(status?: number) { return status === Status.ENABLED ? 'green' : 'red' }

function resetForm() {
  Object.assign(form, { id: undefined, courseCode: '', name: '', teacherId: teachers.value[0]?.id, category: CourseCategory.OPTIONAL, credit: 1, capacity: 30, selectionStartTime: '', selectionEndTime: '', status: Status.DISABLED })
}

async function loadTeachers() {
  const result = await listTeachers({ pageNum: 1, pageSize: 200, status: Status.ENABLED })
  teachers.value = result.list
}

async function loadData() {
  loading.value = true
  try {
    const result = await listCourses(query)
    rows.value = result.list
    total.value = result.total
  } finally {
    loading.value = false
  }
}

function search() { query.pageNum = 1; loadData() }
function reset() { query.courseCode = ''; query.name = ''; query.status = undefined; search() }
function openAdd() { resetForm(); dialogTitle.value = t.addTitle; visible.value = true }

async function openEdit(row: CourseResp) {
  resetForm()
  Object.assign(form, await getCourse(row.id))
  dialogTitle.value = t.editTitle
  visible.value = true
}

async function save() {
  saving.value = true
  try {
    const payload = { ...form, selectionStartTime: form.selectionStartTime || undefined, selectionEndTime: form.selectionEndTime || undefined }
    if (form.id) await updateCourse(payload)
    else await addCourse(payload)
    Message.success(t.saveOk)
    visible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

function remove(row: CourseResp) {
  Modal.confirm({
    title: t.removeTitle,
    content: `${t.removeConfirm} ${row.name}?`,
    onOk: async () => {
      await deleteCourse(row.id)
      Message.success(t.removeOk)
      loadData()
    },
  })
}

function toCourseForm(row: CourseResp, status: number): CourseForm {
  return {
    id: row.id,
    courseCode: row.courseCode,
    name: row.name,
    teacherId: row.teacherId,
    category: row.category,
    credit: row.credit,
    capacity: row.capacity,
    selectionStartTime: row.selectionStartTime,
    selectionEndTime: row.selectionEndTime,
    status,
  }
}

async function publishRows(targetRows: CourseResp[]) {
  if (targetRows.length === 0) {
    Message.warning(t.publishNone)
    return
  }
  saving.value = true
  try {
    await Promise.all(targetRows.map((row) => updateCourse(toCourseForm(row, Status.ENABLED))))
    Message.success(t.publishOk)
    selectedRowKeys.value = []
    loadData()
  } finally {
    saving.value = false
  }
}

function publish(row: CourseResp) { publishRows([row]) }
function publishSelected() { publishRows(rows.value.filter((row) => selectedRowKeys.value.includes(row.id))) }

function pageChange(pageNum: number) { query.pageNum = pageNum; loadData() }
function pageSizeChange(pageSize: number) { query.pageSize = pageSize; query.pageNum = 1; loadData() }

onMounted(async () => { await loadTeachers(); await loadData() })
</script>

<template>
  <div class='edu-page'>
    <div class='page-toolbar'>
      <a-space wrap>
        <a-input v-model='query.courseCode' allow-clear :placeholder='t.code' />
        <a-input v-model='query.name' allow-clear :placeholder='t.name' />
        <a-select v-model='query.status' allow-clear :placeholder='t.status' style='width: 120px'><a-option :value='Status.ENABLED'>{{ t.enabled }}</a-option><a-option :value='Status.DISABLED'>{{ t.disabled }}</a-option></a-select>
        <a-button type='primary' @click='search'><template #icon><icon-search /></template>{{ t.search }}</a-button>
        <a-button @click='reset'><template #icon><icon-refresh /></template>{{ t.reset }}</a-button>
      </a-space>
      <a-space>
        <a-button v-permission='PermCode.Edu.Course.EDIT' :loading='saving' @click='publishSelected'><template #icon><icon-upload /></template>{{ t.publishBatch }}</a-button>
        <a-button v-permission='PermCode.Edu.Course.ADD' type='primary' @click='openAdd'><template #icon><icon-plus /></template>{{ t.add }}</a-button>
      </a-space>
    </div>

    <a-table row-key='id' v-model:selected-keys='selectedRowKeys' :row-selection='rowSelection' :loading='loading' :columns='columns' :data='rows' :pagination='{ total, current: query.pageNum, pageSize: query.pageSize, showTotal: true, showPageSize: true }' @page-change='pageChange' @page-size-change='pageSizeChange'>
      <template #teacher='{ record }'>{{ teacherName(record.teacherId) }}</template>
      <template #remaining='{ record }'><a-tag :color='remainingColor(record)'>{{ record.remainingCount }}</a-tag></template>
      <template #window='{ record }'>{{ record.selectionStartTime || '-' }} / {{ record.selectionEndTime || '-' }}</template>
      <template #status='{ record }'><a-tag :color='statusColor(record.status)'>{{ statusText(record.status) }}</a-tag></template>
      <template #actions='{ record }'><a-space><a-button v-if='record.status !== Status.ENABLED' v-permission='PermCode.Edu.Course.EDIT' size='small' type='primary' @click='publish(record)'>{{ t.publish }}</a-button><a-button v-permission='PermCode.Edu.Course.EDIT' size='small' @click='openEdit(record)'>{{ t.edit }}</a-button><a-button v-permission='PermCode.Edu.Course.REMOVE' size='small' status='danger' @click='remove(record)'>{{ t.remove }}</a-button></a-space></template>
    </a-table>

    <a-modal v-model:visible='visible' :title='dialogTitle' :confirm-loading='saving' @ok='save'>
      <a-form :model='form' layout='vertical'>
        <a-form-item field='courseCode' :label='t.code' required><a-input v-model='form.courseCode' /></a-form-item>
        <a-form-item field='name' :label='t.name' required><a-input v-model='form.name' /></a-form-item>
        <a-form-item field='teacherId' :label='t.teacher' required><a-select v-model='form.teacherId'><a-option v-for='teacher in teachers' :key='teacher.id' :value='teacher.id'>{{ teacher.name }}</a-option></a-select></a-form-item>
        <a-form-item field='category' :label='t.category'><a-select v-model='form.category'><a-option v-for='item in categoryOptions' :key='item.value' :value='item.value'>{{ item.label }}</a-option></a-select></a-form-item>
        <a-form-item field='credit' :label='t.credit'><a-input-number v-model='form.credit' :min='0.5' :step='0.5' /></a-form-item>
        <a-form-item field='capacity' :label='t.capacity' required><a-input-number v-model='form.capacity' :min='1' /></a-form-item>
        <a-form-item field='selectionStartTime' :label='t.start'><a-input v-model='form.selectionStartTime' :placeholder='t.placeholderTime' /></a-form-item>
        <a-form-item field='selectionEndTime' :label='t.end'><a-input v-model='form.selectionEndTime' :placeholder='t.placeholderTime' /></a-form-item>
        <a-form-item field='status' :label='t.status'><a-radio-group v-model='form.status' type='button'><a-radio :value='Status.ENABLED'>{{ t.enabled }}</a-radio><a-radio :value='Status.DISABLED'>{{ t.disabled }}</a-radio></a-radio-group></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.edu-page { display: flex; flex-direction: column; gap: 16px; }
.page-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 8px; }
</style>
