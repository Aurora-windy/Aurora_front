<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { useUserStore } from '../stores/user'
import { Message } from '@arco-design/web-vue'

const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

const activeMenu = computed(() => route.path)

async function handleLogout() {
  await userStore.logout()
  Message.success('已退出登录')
  router.push('/login')
}
</script>

<template>
  <a-layout class="admin-layout">
    <a-layout-sider class="admin-aside" :width="appStore.sidebarCollapsed ? 72 : 220" :collapsed="appStore.sidebarCollapsed">
      <div class="brand">AURORA</div>
      <a-menu
        :selected-keys="[activeMenu]"
        :default-selected-keys="['/workbench']"
        :style="{ width: '100%' }"
        @menu-item-click="(key: string) => router.push(key)"
      >
        <a-menu-item key="/workbench">工作台</a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <a-layout-header class="admin-header">
        <div class="header-left">
          <a-button shape="circle" @click="appStore.toggleSidebar()">
            {{ appStore.sidebarCollapsed ? '>' : '<' }}
          </a-button>
        </div>
        <div class="header-right">
          <a-dropdown>
            <a-space style="cursor: pointer">
              <a-avatar :size="32">{{ userStore.userInfo?.nickname?.charAt(0) || 'A' }}</a-avatar>
              <span>{{ userStore.userInfo?.nickname || userStore.userInfo?.username || '未登录' }}</span>
            </a-space>
            <template #content>
              <a-doption @click="handleLogout">退出登录</a-doption>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <a-layout-content class="admin-main">
        <RouterView />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: #f3f6fa;
}

.admin-aside {
  background: #ffffff;
  border-right: 1px solid #e5eaf3;
  transition: width 0.25s ease;
}

.brand {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  letter-spacing: 1px;
  color: #1677ff;
  border-bottom: 1px solid #eef2f7;
}

.admin-header {
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid #e5eaf3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-main {
  padding: 16px;
}
</style>
