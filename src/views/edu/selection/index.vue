<script setup lang='ts'>
import { computed, onMounted, reactive, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { PermCode } from '@/constants/perm-codes'
import { listAvailableCourses } from '@/api/edu/course'
import { dropCourse, listMySelections, selectCourse } from '@/api/edu/selection'
import type { ApiId } from '@/api/system/types'
import type { CourseQuery, CourseResp, SelectionResp } from '@/api/edu/types'

const loading = ref(false)
const actionLoading = ref<ApiId>('')
const courses = ref<CourseResp[]>([])
const selections = ref<SelectionResp[]>([])
const total = ref(0)
const query = reactive<CourseQuery>({ pageNum: 1, pageSize: 10, courseCode: '', name: '' })

const activeCourseIds = computed(() => new Set(selections.value.filter((item) => item.status === 1).map((item) => item.courseId)))

const courseColumns = [
  { title: '课程编码', dataIndex: 'courseCode', width: 130 },
  { title: '课程名称', dataIndex: 'name', width: 180 },
  { title: '学分', dataIndex: 'credit', width: 90 },
  { title: '容量', dataIndex: 'capacity', width: 100 },
  { title: '已选', dataIndex: 'selectedCount', width: 100 },
  { title: '剩余名额', slotName: 'remaining', width: 110 },
  { title: '操作', slotName: 'actions', width: 120 },
]

const selectionColumns = [
  { title: '课程名称', dataIndex: 'courseName' },
  { title: '状态', slotName: 'status', width: 100 },
  { title: '选课时间', dataIndex: 'selectedTime', width: 180 },
  { title: '退课时间', dataIndex: 'droppedTime', width: 180 },
  { title: '操作', slotName: 'actions', width: 120 },
]

async function loadData() {
  loading.value = true
  try {
    const [courseResult, selectionResult] = await Promise.all([listAvailableCourses(query), listMySelections()])
    courses.value = courseResult.list
    total.value = courseResult.total
    selections.value = selectionResult
  } finally {
    loading.value = false
  }
}

function search() {
  query.pageNum = 1
  loadData()
}

function reset() {
  query.courseCode = ''
  query.name = ''
  search()
}

async function handleSelect(row: CourseResp) {
  actionLoading.value = row.id
  try {
    await selectCourse({ courseId: row.id })
    Message.success('选课成功')
    await loadData()
  } finally {
    actionLoading.value = ''
  }
}

function handleDrop(row: SelectionResp) {
  Modal.confirm({
    title: '退课确认',
    content: `确认退选 ${row.courseName || row.courseId}？`,
    onOk: async () => {
      actionLoading.value = row.courseId
      try {
        await dropCourse(row.courseId)
        Message.success('退课成功')
        await loadData()
      } finally {
        actionLoading.value = ''
      }
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

function remainingColor(course: CourseResp) {
  return course.remainingCount > 0 ? 'green' : 'red'
}

function isActiveSelection(selection: SelectionResp) {
  return selection.status === 1
}

function selectionStatusColor(selection: SelectionResp) {
  return isActiveSelection(selection) ? 'green' : 'gray'
}

onMounted(loadData)
</script>

<template>
  <div class='edu-page'>
    <div class='page-toolbar'>
      <a-space wrap>
        <a-input v-model='query.courseCode' allow-clear placeholder='课程编码' />
        <a-input v-model='query.name' allow-clear placeholder='课程名称' />
        <a-button type='primary' @click='search'><template #icon><icon-search /></template>查询</a-button>
        <a-button @click='reset'><template #icon><icon-refresh /></template>重置</a-button>
      </a-space>
    </div>

    <a-table row-key='id' :loading='loading' :columns='courseColumns' :data='courses' :pagination='{ total, current: query.pageNum, pageSize: query.pageSize, showTotal: true, showPageSize: true }' @page-change='pageChange' @page-size-change='pageSizeChange'>
      <template #remaining='{ record }'>
        <a-tag :color='remainingColor(record)'>{{ record.remainingCount }}</a-tag>
      </template>
      <template #actions='{ record }'>
        <a-button v-permission='PermCode.Edu.SELECTION_SELECT' size='small' type='primary' :loading='actionLoading === record.id' :disabled='record.remainingCount <= 0 || activeCourseIds.has(record.id)' @click='handleSelect(record)'>选课</a-button>
      </template>
    </a-table>

    <a-table row-key='id' :loading='loading' :columns='selectionColumns' :data='selections' :pagination='false'>
      <template #status='{ record }'>
        <a-tag :color='selectionStatusColor(record)'>{{ isActiveSelection(record) ? '已选' : '已退' }}</a-tag>
      </template>
      <template #actions='{ record }'>
        <a-button v-if='isActiveSelection(record)' v-permission='PermCode.Edu.SELECTION_DROP' size='small' status='danger' :loading='actionLoading === record.courseId' @click='handleDrop(record)'>退课</a-button>
      </template>
    </a-table>
  </div>
</template>

<style scoped>
.edu-page { display: flex; flex-direction: column; gap: 16px; }
.page-toolbar { display: flex; align-items: center; gap: 16px; padding: 16px; background: #fff; border: 1px solid #e5e6eb; border-radius: 8px; }
</style>
