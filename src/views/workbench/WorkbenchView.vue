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
  { key: 'hr', title: 'HR 人事', desc: '员工/部门/考勤', icon: 'IconUserGroup', color: '#1677ff' },
  { key: 'edu', title: '教务选课', desc: '课程/选课/成绩', icon: 'IconBook', color: '#00b42a' },
  { key: 'oj', title: 'OJ 判题', desc: '题库/提交/排名', icon: 'IconCode', color: '#ff7d00' },
  { key: 'mall', title: '电商商城', desc: '商品/订单/秒杀', icon: 'IconShoppingCart', color: '#f53f3f' },
  { key: 'ai', title: 'AI 智能体', desc: 'RAG 文档问答', icon: 'IconRobot', color: '#722ed1' },
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
    <a-card class="welcome-card" :bordered="false">
      <div class="welcome-content">
        <div class="welcome-left">
          <h2>{{ greeting }}，{{ nickname }} 👋</h2>
          <p>欢迎使用 AURORA 一体化后台平台 · 当前角色：{{ roleLabel }}</p>
        </div>
        <div class="welcome-right">{{ today }}</div>
      </div>
    </a-card>

    <!-- 快捷入口 -->
    <a-card class="section-card" title="🚀 快捷入口" :bordered="false">
      <a-grid :cols="{ xs: 2, sm: 3, md: 5 }" :col-gap="14" :row-gap="14">
        <a-grid-item v-for="m in modules" :key="m.key">
          <div class="module-card" @click="handleModuleClick(m.key)">
            <div class="module-icon" :style="{ background: m.color }">
              <component :is="m.icon" />
            </div>
            <div class="module-title">{{ m.title }}</div>
            <div class="module-desc">{{ m.desc }}</div>
          </div>
        </a-grid-item>
      </a-grid>
    </a-card>

    <!-- 系统状态 + 公告 -->
    <a-row :gutter="14">
      <a-col :span="12">
        <a-card class="section-card" title="📊 系统状态" :bordered="false">
          <ul class="status-list">
            <li><span>后端服务</span><a-tag color="green" size="small">在线</a-tag></li>
            <li><span>数据库连接</span><a-tag color="green" size="small">在线</a-tag></li>
            <li><span>Redis 连接</span><a-tag color="green" size="small">在线</a-tag></li>
          </ul>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card class="section-card" title="📢 系统公告" :bordered="false">
          <ul class="notice-list">
            <li>AURORA v1.0 毕设版</li>
            <li>当前阶段：Phase 1 鉴权 + 用户管理</li>
            <li>暂无新公告</li>
          </ul>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<style scoped>
.workbench {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.welcome-card {
  background: linear-gradient(135deg, #1677ff 0%, #69b1ff 100%);
  color: #ffffff;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-left h2 {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 600;
  color: #ffffff;
}

.welcome-left p {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
}

.welcome-right {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}

.section-card {
  margin-top: 0;
}

.module-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px 10px;
  border-radius: 6px;
  border: 1px solid #e5e6eb;
  background: #fafbfc;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.module-card:hover {
  border-color: #1677ff;
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.15);
  transform: translateY(-2px);
}

.module-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #ffffff;
  margin-bottom: 8px;
}

.module-title {
  font-size: 14px;
  font-weight: 500;
  color: #1d2129;
}

.module-desc {
  margin-top: 2px;
  font-size: 12px;
  color: #86909c;
}

.status-list,
.notice-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.status-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
  color: #4e5969;
}

.notice-list li {
  padding: 6px 0;
  font-size: 13px;
  color: #4e5969;
  border-bottom: 1px dashed #e5e6eb;
}

.notice-list li:last-child {
  border-bottom: none;
}
</style>
