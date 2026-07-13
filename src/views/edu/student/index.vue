<script setup lang='ts'>
import { onMounted, reactive, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { PermCode } from '@/constants/perm-codes'
import { StudentStatus } from '@/enums/edu/student-status'
import { addStudent, deleteStudent, getStudent, listBindableStudentUsers, listStudents, updateStudent } from '@/api/edu/student'
import type { StudentAccountOptionResp, StudentForm, StudentQuery, StudentResp } from '@/api/edu/types'

const t = {
  studentNo: '\u5b66\u53f7', name: '\u59d3\u540d', phone: '\u624b\u673a', major: '\u4e13\u4e1a', className: '\u73ed\u7ea7', status: '\u72b6\u6001', actions: '\u64cd\u4f5c',
  search: '\u67e5\u8be2', reset: '\u91cd\u7f6e', add: '\u65b0\u589e', edit: '\u7f16\u8f91', remove: '\u5220\u9664', saveOk: '\u5b66\u751f\u6863\u6848\u5df2\u4fdd\u5b58', removeOk: '\u5b66\u751f\u6863\u6848\u5df2\u5220\u9664',
  addTitle: '\u65b0\u589e\u5b66\u751f', editTitle: '\u7f16\u8f91\u5b66\u751f', removeTitle: '\u5220\u9664\u5b66\u751f', removeConfirm: '\u786e\u8ba4\u5220\u9664', userId: '\u7ed1\u5b9a\u5b66\u751f\u8d26\u53f7',
  inSchool: '\u5728\u8bfb', suspended: '\u4f11\u5b66', graduated: '\u6bd5\u4e1a', dropped: '\u9000\u5b66', unknown: '\u672a\u77e5', male: '\u7537', female: '\u5973', gender: '\u6027\u522b',
}

const loading = ref(false)
const saving = ref(false)
const rows = ref<StudentResp[]>([])
const total = ref(0)
const visible = ref(false)
const dialogTitle = ref(t.addTitle)
const accountLoading = ref(false)
const accountOptions = ref<StudentAccountOptionResp[]>([])
let accountSearchTimer: ReturnType<typeof setTimeout> | undefined
const query = reactive<StudentQuery>({ pageNum: 1, pageSize: 10, studentNo: '', name: '', status: undefined })
const form = reactive<StudentForm>({ studentNo: '', name: '', gender: 0, phone: '', major: '', className: '', status: StudentStatus.IN_SCHOOL })

const columns = [
  { title: t.studentNo, dataIndex: 'studentNo', width: 150 },
  { title: t.name, dataIndex: 'name', width: 120 },
  { title: t.phone, dataIndex: 'phone', width: 140 },
  { title: t.major, dataIndex: 'major' },
  { title: t.className, dataIndex: 'className' },
  { title: t.status, slotName: 'status', width: 90 },
  { title: t.actions, slotName: 'actions', width: 170 },
]

const statusOptions = [
  { value: StudentStatus.IN_SCHOOL, label: t.inSchool },
  { value: StudentStatus.SUSPENDED, label: t.suspended },
  { value: StudentStatus.GRADUATED, label: t.graduated },
  { value: StudentStatus.DROPPED, label: t.dropped },
]

function statusText(status?: number) { return statusOptions.find((item) => item.value === status)?.label ?? t.unknown }
function statusColor(status?: number) { if (status === StudentStatus.IN_SCHOOL) return 'green'; if (status === StudentStatus.SUSPENDED) return 'gold'; if (status === StudentStatus.GRADUATED) return 'blue'; return 'red' }

function resetForm() {
  Object.assign(form, { id: undefined, userId: undefined, studentNo: '', name: '', gender: 0, phone: '', major: '', className: '', status: StudentStatus.IN_SCHOOL })
}

async function loadData() {
  loading.value = true
  try {
    const result = await listStudents(query)
    rows.value = result.list
    total.value = result.total
  } finally {
    loading.value = false
  }
}

async function loadAccountOptions(keyword = '') {
  accountLoading.value = true
  try {
    accountOptions.value = await listBindableStudentUsers({
      keyword: keyword.trim() || undefined,
      currentStudentId: form.id,
      limit: 20,
    })
  } finally {
    accountLoading.value = false
  }
}

function searchAccountOptions(keyword: string) {
  if (accountSearchTimer) clearTimeout(accountSearchTimer)
  accountSearchTimer = setTimeout(() => loadAccountOptions(keyword), 300)
}

function accountLabel(account: StudentAccountOptionResp) {
  const nickname = account.nickname ? ` / ${account.nickname}` : ''
  return `${account.username}${nickname} / ID:${account.userId}`
}

function search() { query.pageNum = 1; loadData() }
function reset() { query.studentNo = ''; query.name = ''; query.status = undefined; search() }
function openAdd() {
  resetForm()
  dialogTitle.value = t.addTitle
  visible.value = true
  loadAccountOptions()
}

async function openEdit(row: StudentResp) {
  resetForm()
  Object.assign(form, await getStudent(row.id))
  dialogTitle.value = t.editTitle
  visible.value = true
  await loadAccountOptions()
}

async function save() {
  saving.value = true
  try {
    if (!form.userId) form.userId = undefined
    if (form.id) await updateStudent(form)
    else await addStudent(form)
    Message.success(t.saveOk)
    visible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

function remove(row: StudentResp) {
  Modal.confirm({
    title: t.removeTitle,
    content: `${t.removeConfirm} ${row.name}?`,
    onOk: async () => {
      await deleteStudent(row.id)
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
        <a-input v-model='query.studentNo' allow-clear :placeholder='t.studentNo' />
        <a-input v-model='query.name' allow-clear :placeholder='t.name' />
        <a-select v-model='query.status' allow-clear :placeholder='t.status' style='width: 130px'>
          <a-option v-for='item in statusOptions' :key='item.value' :value='item.value'>{{ item.label }}</a-option>
        </a-select>
        <a-button type='primary' @click='search'><template #icon><icon-search /></template>{{ t.search }}</a-button>
        <a-button @click='reset'><template #icon><icon-refresh /></template>{{ t.reset }}</a-button>
      </a-space>
      <a-button v-permission='PermCode.Edu.Student.ADD' type='primary' @click='openAdd'><template #icon><icon-plus /></template>{{ t.add }}</a-button>
    </div>

    <a-table row-key='id' :loading='loading' :columns='columns' :data='rows' :pagination='{ total, current: query.pageNum, pageSize: query.pageSize, showTotal: true, showPageSize: true }' @page-change='pageChange' @page-size-change='pageSizeChange'>
      <template #status='{ record }'><a-tag :color='statusColor(record.status)'>{{ statusText(record.status) }}</a-tag></template>
      <template #actions='{ record }'><a-space><a-button v-permission='PermCode.Edu.Student.EDIT' size='small' @click='openEdit(record)'>{{ t.edit }}</a-button><a-button v-permission='PermCode.Edu.Student.REMOVE' size='small' status='danger' @click='remove(record)'>{{ t.remove }}</a-button></a-space></template>
    </a-table>

    <a-modal v-model:visible='visible' :title='dialogTitle' :confirm-loading='saving' @ok='save'>
      <a-form :model='form' layout='vertical'>
        <a-form-item field='studentNo' :label='t.studentNo' required><a-input v-model='form.studentNo' /></a-form-item>
        <a-form-item field='name' :label='t.name' required><a-input v-model='form.name' /></a-form-item>
        <a-form-item field='userId' :label='t.userId'>
          <a-select
            v-model='form.userId'
            allow-clear
            allow-search
            :filter-option='false'
            :loading='accountLoading'
            placeholder='搜索 student 用户名或昵称'
            @search='searchAccountOptions'
          >
            <a-option v-for='item in accountOptions' :key='item.userId' :value='item.userId'>
              {{ accountLabel(item) }}
            </a-option>
          </a-select>
        </a-form-item>
        <a-form-item field='gender' :label='t.gender'><a-radio-group v-model='form.gender' type='button'><a-radio :value='0'>{{ t.unknown }}</a-radio><a-radio :value='1'>{{ t.male }}</a-radio><a-radio :value='2'>{{ t.female }}</a-radio></a-radio-group></a-form-item>
        <a-form-item field='phone' :label='t.phone'><a-input v-model='form.phone' /></a-form-item>
        <a-form-item field='major' :label='t.major'><a-input v-model='form.major' /></a-form-item>
        <a-form-item field='className' :label='t.className'><a-input v-model='form.className' /></a-form-item>
        <a-form-item field='status' :label='t.status'><a-select v-model='form.status'><a-option v-for='item in statusOptions' :key='item.value' :value='item.value'>{{ item.label }}</a-option></a-select></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped>
.edu-page { display: flex; flex-direction: column; gap: 16px; }
.page-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px; background: #fff; border: 1px solid #e5e6eb; border-radius: 8px; }
</style>
