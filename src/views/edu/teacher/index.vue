<script setup lang='ts'>
import { onMounted, reactive, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { PermCode } from '@/constants/perm-codes'
import { Status } from '@/enums/common/status'
import { TeacherTitle } from '@/enums/edu/teacher-title'
import { addTeacher, deleteTeacher, getTeacher, listTeachers, updateTeacher } from '@/api/edu/teacher'
import type { TeacherForm, TeacherQuery, TeacherResp } from '@/api/edu/types'

const t = {
  teacherNo: '\u5de5\u53f7', name: '\u59d3\u540d', title: '\u804c\u79f0', phone: '\u624b\u673a', college: '\u5b66\u9662', status: '\u72b6\u6001', actions: '\u64cd\u4f5c', userId: '\u7ed1\u5b9a\u7528\u6237ID',
  search: '\u67e5\u8be2', reset: '\u91cd\u7f6e', add: '\u65b0\u589e', edit: '\u7f16\u8f91', remove: '\u5220\u9664', saveOk: '\u6559\u5e08\u6863\u6848\u5df2\u4fdd\u5b58', removeOk: '\u6559\u5e08\u6863\u6848\u5df2\u5220\u9664',
  addTitle: '\u65b0\u589e\u6559\u5e08', editTitle: '\u7f16\u8f91\u6559\u5e08', removeTitle: '\u5220\u9664\u6559\u5e08', removeConfirm: '\u786e\u8ba4\u5220\u9664',
  professor: '\u6559\u6388', associate: '\u526f\u6559\u6388', lecturer: '\u8bb2\u5e08', assistant: '\u52a9\u6559', enabled: '\u542f\u7528', disabled: '\u7981\u7528', unknown: '\u672a\u77e5',
}

const loading = ref(false)
const saving = ref(false)
const rows = ref<TeacherResp[]>([])
const total = ref(0)
const visible = ref(false)
const dialogTitle = ref(t.addTitle)
const query = reactive<TeacherQuery>({ pageNum: 1, pageSize: 10, teacherNo: '', name: '', status: undefined })
const form = reactive<TeacherForm>({ teacherNo: '', name: '', title: TeacherTitle.LECTURER, phone: '', college: '', status: Status.ENABLED })

const columns = [
  { title: t.teacherNo, dataIndex: 'teacherNo', width: 150 },
  { title: t.name, dataIndex: 'name', width: 120 },
  { title: t.title, slotName: 'title', width: 100 },
  { title: t.phone, dataIndex: 'phone', width: 140 },
  { title: t.college, dataIndex: 'college' },
  { title: t.status, slotName: 'status', width: 90 },
  { title: t.actions, slotName: 'actions', width: 170 },
]

const titleOptions = [
  { value: TeacherTitle.PROFESSOR, label: t.professor },
  { value: TeacherTitle.ASSOCIATE_PROF, label: t.associate },
  { value: TeacherTitle.LECTURER, label: t.lecturer },
  { value: TeacherTitle.ASSISTANT, label: t.assistant },
]

function titleText(title?: number) { return titleOptions.find((item) => item.value === title)?.label ?? t.unknown }
function statusText(status?: number) { return status === Status.ENABLED ? t.enabled : t.disabled }
function statusColor(status?: number) { return status === Status.ENABLED ? 'green' : 'red' }

function resetForm() {
  Object.assign(form, { id: undefined, userId: undefined, teacherNo: '', name: '', title: TeacherTitle.LECTURER, phone: '', college: '', status: Status.ENABLED })
}

async function loadData() {
  loading.value = true
  try {
    const result = await listTeachers(query)
    rows.value = result.list
    total.value = result.total
  } finally {
    loading.value = false
  }
}

function search() { query.pageNum = 1; loadData() }
function reset() { query.teacherNo = ''; query.name = ''; query.status = undefined; search() }
function openAdd() { resetForm(); dialogTitle.value = t.addTitle; visible.value = true }

async function openEdit(row: TeacherResp) {
  resetForm()
  Object.assign(form, await getTeacher(row.id))
  dialogTitle.value = t.editTitle
  visible.value = true
}

async function save() {
  saving.value = true
  try {
    if (form.id) await updateTeacher(form)
    else await addTeacher(form)
    Message.success(t.saveOk)
    visible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

function remove(row: TeacherResp) {
  Modal.confirm({
    title: t.removeTitle,
    content: `${t.removeConfirm} ${row.name}?`,
    onOk: async () => {
      await deleteTeacher(row.id)
      Message.success(t.removeOk)
      loadData()
    },
  })
}

function pageChange(pageNum: number) { query.pageNum = pageNum; loadData() }
function pageSizeChange(pageSize: number) { query.pageSize = pageSize; query.pageNum = 1; loadData() }

onMounted(loadData)
</script>

<template>
  <div class='edu-page'>
    <div class='page-toolbar'>
      <a-space wrap>
        <a-input v-model='query.teacherNo' allow-clear :placeholder='t.teacherNo' />
        <a-input v-model='query.name' allow-clear :placeholder='t.name' />
        <a-select v-model='query.status' allow-clear :placeholder='t.status' style='width: 120px'><a-option :value='Status.ENABLED'>{{ t.enabled }}</a-option><a-option :value='Status.DISABLED'>{{ t.disabled }}</a-option></a-select>
        <a-button type='primary' @click='search'><template #icon><icon-search /></template>{{ t.search }}</a-button>
        <a-button @click='reset'><template #icon><icon-refresh /></template>{{ t.reset }}</a-button>
      </a-space>
      <a-button v-permission='PermCode.Edu.Teacher.ADD' type='primary' @click='openAdd'><template #icon><icon-plus /></template>{{ t.add }}</a-button>
    </div>

    <a-table row-key='id' :loading='loading' :columns='columns' :data='rows' :pagination='{ total, current: query.pageNum, pageSize: query.pageSize, showTotal: true, showPageSize: true }' @page-change='pageChange' @page-size-change='pageSizeChange'>
      <template #title='{ record }'><a-tag color='blue'>{{ titleText(record.title) }}</a-tag></template>
      <template #status='{ record }'><a-tag :color='statusColor(record.status)'>{{ statusText(record.status) }}</a-tag></template>
      <template #actions='{ record }'><a-space><a-button v-permission='PermCode.Edu.Teacher.EDIT' size='small' @click='openEdit(record)'>{{ t.edit }}</a-button><a-button v-permission='PermCode.Edu.Teacher.REMOVE' size='small' status='danger' @click='remove(record)'>{{ t.remove }}</a-button></a-space></template>
    </a-table>

    <a-modal v-model:visible='visible' :title='dialogTitle' :confirm-loading='saving' @ok='save'>
      <a-form :model='form' layout='vertical'>
        <a-form-item field='teacherNo' :label='t.teacherNo' required><a-input v-model='form.teacherNo' /></a-form-item>
        <a-form-item field='name' :label='t.name' required><a-input v-model='form.name' /></a-form-item>
        <a-form-item field='userId' :label='t.userId'><a-input v-model='form.userId' allow-clear /></a-form-item>
        <a-form-item field='title' :label='t.title'><a-select v-model='form.title'><a-option v-for='item in titleOptions' :key='item.value' :value='item.value'>{{ item.label }}</a-option></a-select></a-form-item>
        <a-form-item field='phone' :label='t.phone'><a-input v-model='form.phone' /></a-form-item>
        <a-form-item field='college' :label='t.college'><a-input v-model='form.college' /></a-form-item>
        <a-form-item field='status' :label='t.status'><a-radio-group v-model='form.status' type='button'><a-radio :value='Status.ENABLED'>{{ t.enabled }}</a-radio><a-radio :value='Status.DISABLED'>{{ t.disabled }}</a-radio></a-radio-group></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.edu-page { display: flex; flex-direction: column; gap: 16px; }
.page-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px; background: #fff; border: 1px solid #e5e6eb; border-radius: 8px; }
</style>
