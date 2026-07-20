<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '../stores/app'
import { useUserStore } from '../stores/user'
import { usePermissionStore } from '../stores/permission'
import { Message } from '@arco-design/web-vue'
import type { AppMenuItem } from '../stores/permission'
import AiFloatingAgent from '../components/ai/AiFloatingAgent.vue'

const appStore = useAppStore()
const userStore = useUserStore()
const permissionStore = usePermissionStore()
const route = useRoute()
const router = useRouter()

const openMenuKeys = ref<string[]>([])
const selectedMenuKeys = computed(() => [route.path])

const iconMap: Record<string, string> = {
  IconDashboard: 'icon-apps',
  IconSettings: 'icon-settings',
  IconUser: 'icon-user',
  IconUserGroup: 'icon-user-group',
  IconMenu: 'icon-menu',
  IconRobot: 'icon-robot',
  IconCloud: 'icon-cloud',
  IconBook: 'icon-book',
  IconMessage: 'icon-message',
  IconHistory: 'icon-history',
  IconCode: 'icon-code',
}

function iconName(icon?: string) {
  return icon ? iconMap[icon] : undefined
}

function findParentKeys(items: AppMenuItem[], key: string, parents: string[] = []): string[] {
  for (const item of items) {
    if (item.key === key) {
      return parents
    }

    const childParents = findParentKeys(item.children, key, [...parents, item.key])
    if (childParents.length) {
      return childParents
    }
  }

  return []
}

function handleMenuClick(key: string) {
  router.push(key)
}

function handleOpenKeysChange(keys: string[]) {
  openMenuKeys.value = keys
}

watch(
  [() => route.path, () => permissionStore.menus],
  ([path]) => {
    openMenuKeys.value = findParentKeys(permissionStore.menus, path)
  },
  { immediate: true },
)

async function handleLogout() {
  await userStore.logout()
  Message.success('已退出登录')
  await router.replace('/login')
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
        :selected-keys="selectedMenuKeys"
        :open-keys="openMenuKeys"
        :collapsed="appStore.sidebarCollapsed"
        :style="{ width: '100%' }"
        @menu-item-click="handleMenuClick"
        @update:open-keys="handleOpenKeysChange"
      >
        <template v-for="item in permissionStore.menus" :key="item.key">
          <a-sub-menu v-if="item.children.length" :key="item.key" :class="{ 'menu-open': openMenuKeys.includes(item.key) }">
            <template #icon>
              <component :is="iconName(item.icon)" v-if="iconName(item.icon)" />
            </template>
            <template #title>{{ item.title }}</template>
            <a-menu-item
              v-for="child in item.children"
              :key="child.key"
              :class="{ 'menu-active': route.path === child.key }"
            >
              <template #icon>
                <component :is="iconName(child.icon)" v-if="iconName(child.icon)" />
              </template>
              {{ child.title }}
            </a-menu-item>
          </a-sub-menu>
          <a-menu-item v-else :key="item.key" :class="{ 'menu-active': route.path === item.key }">
            <template #icon>
              <component :is="iconName(item.icon)" v-if="iconName(item.icon)" />
            </template>
            {{ item.title }}
          </a-menu-item>
        </template>
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
              <icon-home class="breadcrumb-home-icon" />
            </a-breadcrumb-item>
            <a-breadcrumb-item v-if="route.meta.title">
              {{ route.meta.title }}
            </a-breadcrumb-item>
          </a-breadcrumb>
        </div>
        <div class="header-right">
          <a-dropdown trigger="click">
            <div class="user-info">
              <a-avatar :size="28" class="user-avatar">
                {{ userStore.userInfo?.nickname?.charAt(0) || userStore.userInfo?.username?.charAt(0) || 'A' }}
              </a-avatar>
              <span class="user-name">{{ userStore.userInfo?.nickname || userStore.userInfo?.username || '未登录' }}</span>
              <icon-down :size="12" class="user-dropdown-icon" />
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
    <AiFloatingAgent />
  </a-layout>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
}

/* === 侧边栏 === */
.admin-aside {
  background: var(--color-bg-sidebar) !important;
  border-right: 1px solid var(--color-border);
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
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--color-border);
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
  padding: var(--space-2);
}

.admin-aside :deep(.arco-menu-item) {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-text-body);
  border-radius: var(--radius-md);
  margin-bottom: 2px;
  transition: all 0.15s ease;
}

.admin-aside :deep(.arco-menu-item:hover) {
  background: var(--color-bg-hover);
  color: var(--color-text-title);
}

.admin-aside :deep(.arco-menu-item.arco-menu-selected),
.admin-aside :deep(.arco-menu-item.menu-active) {
  background: var(--color-menu-active-bg);
  color: var(--color-menu-active-text);
  font-weight: 500;
}

.admin-aside :deep(.arco-sub-menu.menu-open > .arco-menu-inline > .arco-menu-inline-header),
.admin-aside :deep(.menu-open .arco-menu-inline-header) {
  color: var(--color-menu-open-text);
  font-weight: 500;
}

.admin-aside :deep(.arco-sub-menu.menu-open .arco-menu-icon-suffix) {
  color: var(--color-menu-open-text);
}

.admin-aside :deep(.arco-menu-item.arco-menu-selected)::before,
.admin-aside :deep(.arco-menu-item.menu-active)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--color-menu-active-text);
  border-radius: 0 2px 2px 0;
}

/* 折叠按钮 */
.collapse-trigger {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-text-secondary);
  border-top: 1px solid var(--color-border);
  margin-top: auto;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.collapse-trigger:hover {
  color: var(--color-primary);
  background: var(--color-bg-hover);
}

/* === 顶栏 === */
.admin-header {
  height: 56px;
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
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

.breadcrumb-home-icon {
  color: var(--color-text-secondary);
  font-size: 14px;
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
  background: var(--color-bg-hover);
}

.user-avatar {
  background: var(--color-primary);
  font-size: 13px;
}

.user-dropdown-icon {
  color: var(--color-text-secondary);
}

.user-name {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-text-body);
}

/* === 内容区 === */
.admin-main {
  padding: var(--space-6);
  background: var(--color-bg-page);
  overflow-y: auto;
}
</style>
