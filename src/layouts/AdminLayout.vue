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
    <!-- 侧边栏 -->
    <a-layout-sider
      class="admin-aside"
      :width="appStore.sidebarCollapsed ? 64 : 220"
      :collapsed="appStore.sidebarCollapsed"
      collapsible
      :collapsed-width="64"
      trigger-type="none"
    >
      <!-- 品牌区 -->
      <div class="brand-area">
        <img src="/logo.jpg" alt="AURORA" class="brand-logo" />
      </div>

      <!-- 菜单 -->
      <a-menu
        :selected-keys="[activeMenu]"
        :default-selected-keys="['/workbench']"
        :collapsed="appStore.sidebarCollapsed"
        :style="{ width: '100%' }"
        @menu-item-click="(key: string) => router.push(key)"
      >
        <a-menu-item key="/workbench">
          <template #icon><icon-apps /></template>
          工作台
        </a-menu-item>
      </a-menu>

      <!-- 折叠按钮 -->
      <div class="collapse-trigger" @click="appStore.toggleSidebar()">
        <icon-left v-if="!appStore.sidebarCollapsed" />
        <icon-right v-else />
      </div>
    </a-layout-sider>

    <!-- 右侧区域 -->
    <a-layout>
      <!-- 顶栏 -->
      <header class="admin-header">
        <div class="header-left">
          <a-breadcrumb>
            <a-breadcrumb-item>
              <icon-home style="font-size: 14px; color: #86909C" />
            </a-breadcrumb-item>
            <a-breadcrumb-item v-if="route.meta.title">
              {{ route.meta.title }}
            </a-breadcrumb-item>
          </a-breadcrumb>
        </div>
        <div class="header-right">
          <a-dropdown trigger="click">
            <div class="user-info">
              <a-avatar :size="28" :style="{ background: '#1E3A8A', fontSize: '13px' }">
                {{ userStore.userInfo?.nickname?.charAt(0) || userStore.userInfo?.username?.charAt(0) || 'A' }}
              </a-avatar>
              <span class="user-name">{{ userStore.userInfo?.nickname || userStore.userInfo?.username || '未登录' }}</span>
              <icon-down :size="12" style="color: #86909C" />
            </div>
            <template #content>
              <a-doption @click="handleLogout">
                <template #icon><icon-export /></template>
                退出登录
              </a-doption>
            </template>
          </a-dropdown>
        </div>
      </header>

      <!-- 内容区 -->
      <a-layout-content class="admin-main">
        <RouterView />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
}

/* === 侧边栏 === */
.admin-aside {
  background: #F5F6F8 !important;
  border-right: 1px solid #E5E6EB;
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  overflow: hidden;
}

.brand-area {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border-bottom: 1px solid #E5E6EB;
  flex-shrink: 0;
}

.brand-logo {
  height: 32px;
  width: auto;
  object-fit: contain;
  flex-shrink: 0;
}

/* 菜单样式覆盖 */
.admin-aside :deep(.arco-menu) {
  padding: 8px;
}

.admin-aside :deep(.arco-menu-item) {
  font-size: 14px;
  font-weight: 400;
  color: #4E5969;
  border-radius: 6px;
  margin-bottom: 2px;
  transition: all 0.15s ease;
}

.admin-aside :deep(.arco-menu-item:hover) {
  background: #F7F8FA;
  color: #1F2329;
}

.admin-aside :deep(.arco-menu-item.arco-menu-selected) {
  background: #E8F0FF;
  color: #1E3A8A;
  font-weight: 500;
}

.admin-aside :deep(.arco-menu-item.arco-menu-selected)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: #1E3A8A;
  border-radius: 0 2px 2px 0;
}

/* 折叠按钮 */
.collapse-trigger {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #86909C;
  border-top: 1px solid #E5E6EB;
  margin-top: auto;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.collapse-trigger:hover {
  color: #1E3A8A;
  background: #F7F8FA;
}

/* === 顶栏 === */
.admin-header {
  height: 56px;
  background: #FFFFFF;
  border-bottom: 1px solid #E5E6EB;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.15s ease;
}

.user-info:hover {
  background: #F7F8FA;
}

.user-name {
  font-size: 14px;
  font-weight: 400;
  color: #4E5969;
}

/* === 内容区 === */
.admin-main {
  padding: 24px;
  background: #FAFAFA;
  overflow-y: auto;
}
</style>
