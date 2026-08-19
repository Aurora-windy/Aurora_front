<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Message, Modal } from '@arco-design/web-vue'
import { deleteSystemFile, listSystemFiles, uploadSystemFile } from '@/api/system/file'
import type { FileResp } from '@/api/system/file'

const IMAGE_TYPES = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico']

const loading = ref(false)
const uploading = ref(false)
const files = ref<FileResp[]>([])
const total = ref(0)
const mode = ref<'grid' | 'list'>('grid')
const previewVisible = ref(false)
const previewUrl = ref('')

const query = reactive({
  pageNum: 1,
  pageSize: 24,
  name: '',
})

const columns = [
  { title: '文件名', dataIndex: 'name', ellipsis: true, tooltip: true },
  { title: '类型', dataIndex: 'fileType', width: 90 },
  { title: '大小', slotName: 'size', width: 110 },
  { title: '上传时间', dataIndex: 'createTime', width: 180 },
  { title: '操作', slotName: 'actions', width: 160 },
]

function formatSize(size?: number) {
  if (!size) return '-'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function isImage(file: FileResp) {
  return IMAGE_TYPES.includes(file.fileType)
}

function fileIcon(file: FileResp) {
  const t = file.fileType
  if (isImage(file)) return 'icon-file-image'
  if (t === 'pdf') return 'icon-file-pdf'
  if (['doc', 'docx'].includes(t)) return 'icon-file-text'
  if (['xls', 'xlsx', 'csv'].includes(t)) return 'icon-file'
  if (['mp4', 'avi', 'mov', 'mkv'].includes(t)) return 'icon-file-video'
  if (['mp3', 'wav', 'ogg', 'flac'].includes(t)) return 'icon-file-audio'
  return 'icon-file'
}

async function loadData() {
  loading.value = true
  try {
    const result = await listSystemFiles(query)
    files.value = result.list
    total.value = result.total
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.pageNum = 1
  loadData()
}

function handlePageChange(pageNum: number) {
  query.pageNum = pageNum
  loadData()
}

/** 原生文件选择框（点按钮触发 input.click()，100% 弹出系统选择框） */
const fileInputRef = ref<HTMLInputElement>()

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // 允许重复选择同一文件
  if (!file) return
  if (file.size > 50 * 1024 * 1024) {
    Message.error('文件过大，请上传 50MB 以内的文件')
    return
  }
  uploading.value = true
  uploadSystemFile(file)
    .then((resp) => {
      Message.success(`上传成功：${resp.name}`)
      handleSearch()
    })
    .catch((err: Error) => {
      Message.error(err.message || '上传失败')
    })
    .finally(() => {
      uploading.value = false
    })
}

function handlePreview(file: FileResp) {
  if (isImage(file)) {
    previewUrl.value = file.url
    previewVisible.value = true
  } else {
    window.open(file.url, '_blank')
  }
}

function handleDownload(file: FileResp) {
  window.open(file.url, '_blank')
}

function handleDelete(file: FileResp) {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除文件「${file.name}」吗？此操作不可恢复。`,
    onOk: async () => {
      await deleteSystemFile(file.id)
      Message.success('删除成功')
      loadData()
    },
  })
}

onMounted(loadData)
</script>

<template>
  <div class="file-manage">
    <!-- 工具栏（continew 风格：上传文件按钮 + 搜索 + 视图切换） -->
    <div class="file-toolbar">
      <div class="toolbar-left">
        <!-- 原生文件选择：点击按钮 → 弹系统文件选择框（不依赖拖拽） -->
        <input ref="fileInputRef" type="file" class="file-input-hidden" @change="handleFileChange" />
        <a-button type="primary" shape="round" :loading="uploading" @click="fileInputRef?.click()">
          <template #icon><icon-upload /></template>
          上传文件
        </a-button>
        <a-input-group>
          <a-input v-model="query.name" placeholder="搜索文件名" allow-clear style="width: 220px" @press-enter="handleSearch" />
          <a-button type="primary" @click="handleSearch">
            <template #icon><icon-search /></template>
            查询
          </a-button>
        </a-input-group>
      </div>
      <div class="toolbar-right">
        <a-button-group>
          <a-tooltip content="宫格视图">
            <a-button :type="mode === 'grid' ? 'primary' : 'secondary'" @click="mode = 'grid'">
              <template #icon><icon-apps /></template>
            </a-button>
          </a-tooltip>
          <a-tooltip content="列表视图">
            <a-button :type="mode === 'list' ? 'primary' : 'secondary'" @click="mode = 'list'">
              <template #icon><icon-list /></template>
            </a-button>
          </a-tooltip>
        </a-button-group>
      </div>
    </div>

    <!-- 宫格模式（continew FileGrid 风格） -->
    <a-spin :loading="loading">
      <div v-if="files.length && mode === 'grid'" class="file-grid">
        <div v-for="file in files" :key="file.id" class="file-card" @dblclick="handlePreview(file)">
          <div class="file-thumb">
            <img v-if="isImage(file)" :src="file.url" class="thumb-img" alt="" />
            <component :is="fileIcon(file)" v-else class="thumb-icon" />
          </div>
          <p class="file-name">{{ file.name }}</p>
          <div class="file-meta">
            <span>{{ formatSize(file.size) }}</span>
            <span class="file-time">{{ file.createTime }}</span>
          </div>
          <div class="file-actions">
            <a-button size="mini" @click.stop="handlePreview(file)">预览</a-button>
            <a-button size="mini" @click.stop="handleDownload(file)">下载</a-button>
            <a-button size="mini" status="danger" @click.stop="handleDelete(file)">删除</a-button>
          </div>
        </div>
      </div>

      <!-- 列表模式 -->
      <a-table
        v-else-if="files.length && mode === 'list'"
        row-key="id"
        :columns="columns"
        :data="files"
        :pagination="false"
      >
        <template #size="{ record }">{{ formatSize(record.size) }}</template>
        <template #actions="{ record }">
          <a-space>
            <a-button size="small" @click="handlePreview(record)">预览</a-button>
            <a-button size="small" @click="handleDownload(record)">下载</a-button>
            <a-button size="small" status="danger" @click="handleDelete(record)">删除</a-button>
          </a-space>
        </template>
      </a-table>

      <a-empty v-if="!files.length" description="暂无文件，点击「上传文件」从本地上传" />
    </a-spin>

    <!-- 分页 -->
    <div class="file-pagination" v-if="total > query.pageSize">
      <a-pagination
        :current="query.pageNum"
        :page-size="query.pageSize"
        :total="total"
        show-total
        @change="handlePageChange"
      />
    </div>

    <!-- 图片预览 -->
    <a-modal v-model:visible="previewVisible" :footer="false" width="720px">
      <img :src="previewUrl" class="preview-img" alt="预览" />
    </a-modal>
  </div>
</template>

<style scoped>
.file-manage {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.file-input-hidden {
  display: none;
}

.file-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}

.file-card {
  position: relative;
  border: 1px solid var(--color-border-2);
  border-radius: 10px;
  padding: 12px;
  background: var(--color-bg-2);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.file-card:hover {
  border-color: rgb(var(--primary-6));
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

.file-thumb {
  height: 84px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-fill-1);
  border-radius: 8px;
  overflow: hidden;
}

.thumb-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.thumb-icon {
  font-size: 40px;
  color: rgb(var(--primary-6));
}

.file-name {
  margin: 0;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--color-text-4);
}

.file-time {
  max-width: 50%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-actions {
  display: none;
  gap: 6px;
}

.file-card:hover .file-actions {
  display: flex;
}

.file-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 6px;
}

.preview-img {
  width: 100%;
  border-radius: 8px;
}
</style>
