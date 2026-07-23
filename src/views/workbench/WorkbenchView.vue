<script setup lang="ts">
import { computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const router = useRouter()

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
  {
    key: 'hr',
    title: 'HR 人事',
    desc: '部门 / 岗位 / 员工',
    status: '一期完成',
    route: '/hr/depts',
    icon: 'IconUserGroup',
    color: '#3370FF',
  },
  {
    key: 'edu',
    title: '教务选课',
    desc: '学生 / 课程 / 选课',
    status: '并发验收通过',
    route: '/edu/courses',
    icon: 'IconBook',
    color: '#00B42A',
  },
  {
    key: 'oj',
    title: 'OJ 判题',
    desc: '题库 / 提交 / 简化判题',
    status: '一期完成',
    route: '/oj/problems',
    icon: 'IconCode',
    color: '#FF7D00',
  },
  {
    key: 'mall',
    title: '电商商城',
    desc: '商品 / 购物车 / 订单',
    status: '一期完成',
    route: '/mall/products',
    icon: 'IconShoppingCart',
    color: '#F53F3F',
  },
  {
    key: 'builder',
    title: 'AURORA Builder',
    desc: '对话式项目生成预览',
    status: 'MVP 完成',
    route: '/builder',
    icon: 'IconCode',
    color: '#14C9C9',
  },
  {
    key: 'ai',
    title: 'AI 智能体',
    desc: '工具调用 / RAG / 审计',
    status: '待 Provider',
    route: '/ai/provider',
    icon: 'IconRobot',
    color: '#722ED1',
  },
] as const

function handleModuleClick(route: string) {
  router.push(route).catch(() => {
    Message.info('当前账号暂无该入口权限')
  })
}

const roleLabel = computed(() => userStore.userInfo?.roles?.[0] || '游客')
const nickname = computed(() => userStore.userInfo?.nickname || userStore.userInfo?.username || '用户')

const stageItems = [
  { label: 'RBAC 基座', value: '已验收', color: 'green' },
  { label: '4 个业务一期', value: '已完成', color: 'green' },
  { label: 'AI Agent V1', value: '批次 1 已验收', color: 'blue' },
  { label: '后续重点', value: '补验证 / Phase 2', color: 'orange' },
] as const
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

    <div class="stage-strip">
      <div v-for="item in stageItems" :key="item.label" class="stage-item">
        <span class="stage-label">{{ item.label }}</span>
        <a-tag :color="item.color" size="small">{{ item.value }}</a-tag>
      </div>
    </div>

    <!-- 核心模块 -->
    <a-card class="section-card" title="一期模块">
      <div class="module-row">
        <div
          v-for="m in modules"
          :key="m.key"
          class="module-stat"
          @click="handleModuleClick(m.route)"
        >
          <div class="module-top">
            <div class="module-stat-icon" :style="{ background: m.color + '14', color: m.color }">
              <component :is="m.icon" :size="20" />
            </div>
            <a-tag size="small" :color="m.key === 'ai' ? 'orange' : 'green'">{{ m.status }}</a-tag>
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
              <span>当前阶段：1 基座 + 4 业务一期已完成</span>
            </div>
            <div class="notice-item">
              <span class="notice-dot"></span>
              <span>AI Agent V1 批次 2 待配置 Provider 后验收</span>
            </div>
            <div class="notice-item">
              <span class="notice-dot"></span>
              <span>下一步：补齐命令验证后进入 Phase 2</span>
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
  background: #23439A;
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

/* === 阶段状态 === */
.stage-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.stage-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  padding: 0 18px;
  border: 1px solid #E5E6EB;
  border-radius: 8px;
  background: #FFFFFF;
}

.stage-label {
  font-size: 14px;
  color: #4E5969;
}

/* === 核心模块 === */
.module-row {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 16px;
}

.module-stat {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 142px;
  padding: 16px;
  border-radius: 8px;
  background: #F7F8FA;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.module-stat:hover {
  background: #FFFFFF;
  border-color: #BEDAFF;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.module-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
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
}

.module-stat-desc {
  font-size: 12px;
  line-height: 20px;
  color: #86909C;
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
  background: #3370FF;
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

@media (max-width: 1440px) {
  .module-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .stage-strip,
  .module-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .welcome-content {
    align-items: flex-start;
    flex-direction: column;
    gap: 16px;
  }
}

@media (max-width: 640px) {
  .stage-strip,
  .module-row {
    grid-template-columns: 1fr;
  }
}
</style>
