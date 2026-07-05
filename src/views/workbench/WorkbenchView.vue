<script setup lang="ts">
import { computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const today = computed(() => {
  const d = new Date()
  const weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${weeks[d.getDay()]}`
})

const modules = [
  { key: 'hr', title: 'HR 人事', desc: '员工/部门/考勤', icon: 'IconUserGroup', color: '#1E3A8A' },
  { key: 'edu', title: '教务选课', desc: '课程/选课/成绩', icon: 'IconBook', color: '#00B42A' },
  { key: 'oj', title: 'OJ 判题', desc: '题库/提交/排名', icon: 'IconCode', color: '#FF7D00' },
  { key: 'mall', title: '电商商城', desc: '商品/订单/秒杀', icon: 'IconShoppingCart', color: '#F53F3F' },
  { key: 'ai', title: 'AI 智能体', desc: 'RAG 文档问答', icon: 'IconRobot', color: '#722ED1' },
] as const

function handleModuleClick(key: string) {
  Message.info(`模块 [${key}] 暂未实装，Phase 1 后续开放`)
}

const roleLabel = computed(() => userStore.userInfo?.roles?.[0] || '游客')
const nickname = computed(() => userStore.userInfo?.nickname || userStore.userInfo?.username || '用户')
</script>

<template>
  <div class="workbench">
    <!-- 欢迎卡 -->
    <div class="welcome-card">
      <div class="welcome-content">
        <div class="welcome-left">
          <h2>{{ greeting }}，{{ nickname }}</h2>
          <p>欢迎使用 AURORA 一体化后台平台 · 当前角色：{{ roleLabel }}</p>
        </div>
        <div class="welcome-right">
          <icon-calendar :size="16" style="color: rgba(255,255,255,0.7)" />
          <span>{{ today }}</span>
        </div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <a-card class="section-card" title="快捷入口">
      <div class="module-row">
        <div
          v-for="m in modules"
          :key="m.key"
          class="module-stat"
          @click="handleModuleClick(m.key)"
        >
          <div class="module-stat-icon" :style="{ background: m.color + '14', color: m.color }">
            <component :is="m.icon" :size="20" />
          </div>
          <div class="module-stat-title">{{ m.title }}</div>
          <div class="module-stat-desc">{{ m.desc }}</div>
        </div>
      </div>
    </a-card>

    <!-- 系统状态 + 公告 -->
    <a-row :gutter="24">
      <a-col :span="12">
        <a-card class="section-card" title="系统状态">
          <div class="status-list">
            <div class="status-item">
              <span class="status-label">后端服务</span>
              <a-tag color="green" size="small">在线</a-tag>
            </div>
            <div class="status-item">
              <span class="status-label">数据库连接</span>
              <a-tag color="green" size="small">在线</a-tag>
            </div>
            <div class="status-item">
              <span class="status-label">Redis 连接</span>
              <a-tag color="green" size="small">在线</a-tag>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card class="section-card" title="系统公告">
          <div class="notice-list">
            <div class="notice-item">
              <span class="notice-dot"></span>
              <span>AURORA v1.0 毕设版</span>
            </div>
            <div class="notice-item">
              <span class="notice-dot"></span>
              <span>当前阶段：Phase 1 鉴权 + 用户管理</span>
            </div>
            <div class="notice-item">
              <span class="notice-dot"></span>
              <span>暂无新公告</span>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<style scoped>
.workbench {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* === 欢迎卡 === */
.welcome-card {
  background: #1E3A8A;
  border-radius: 8px;
  padding: 24px 32px;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-left h2 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: #FFFFFF;
}

.welcome-left p {
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.7);
}

.welcome-right {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.8);
}

/* === 快捷入口统计卡片 === */
.module-row {
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.module-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 12px;
  border-radius: 8px;
  background: #F7F8FA;
  cursor: pointer;
  transition: all 0.15s ease;
}

.module-stat:hover {
  background: #F2F3F5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.module-stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.module-stat-title {
  font-size: 14px;
  font-weight: 600;
  color: #1F2329;
  text-align: center;
}

.module-stat-desc {
  font-size: 12px;
  color: #86909C;
  text-align: center;
}

/* === 系统状态 === */
.status-list {
  display: flex;
  flex-direction: column;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #F2F3F5;
}

.status-item:last-child {
  border-bottom: none;
}

.status-label {
  font-size: 14px;
  color: #4E5969;
}

/* === 系统公告 === */
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.notice-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  font-size: 14px;
  color: #4E5969;
  border-bottom: 1px solid #F2F3F5;
}

.notice-item:last-child {
  border-bottom: none;
}

.notice-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #1E3A8A;
  flex-shrink: 0;
}

/* === 卡片通用覆盖 === */
.section-card :deep(.arco-card-header) {
  padding: 16px 24px;
}

.section-card :deep(.arco-card-header-title) {
  font-size: 16px;
  font-weight: 500;
  color: #1F2329;
}

.section-card :deep(.arco-card-body) {
  padding: 16px 24px;
}
</style>
