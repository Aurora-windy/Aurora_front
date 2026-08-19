<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const navs = [
  { path: '/assistant/chat', label: '对话', icon: 'icon-message' },
  { path: '/assistant/knowledge', label: '知识', icon: 'icon-book' },
  { path: '/assistant/graph', label: '图谱', icon: 'icon-share-alt' },
  { path: '/assistant/settings', label: '设置', icon: 'icon-settings' },
]

function isActive(path: string) {
  return route.path === path || (path !== '/assistant/chat' && route.path.startsWith(path))
}
</script>

<template>
  <div class="ai-app-layout">
    <!-- 左侧竖导航（shanxi front-ai 风格） -->
    <aside class="ai-nav">
      <router-link to="/assistant/chat" class="brand">
        <img src="/logo.jpg" alt="AURORA" class="brand-logo" />
      </router-link>

      <nav class="nav-list">
        <button
          v-for="nav in navs"
          :key="nav.path"
          class="nav-item"
          :class="{ active: isActive(nav.path) }"
          :title="nav.label"
          @click="router.push(nav.path)"
        >
          <component :is="nav.icon" class="nav-icon" />
          <span class="nav-text">{{ nav.label }}</span>
        </button>
      </nav>

      <div class="nav-bottom">
        <button class="nav-item" title="管理后台" @click="router.push('/workbench')">
          <icon-home class="nav-icon" />
          <span class="nav-text">后台</span>
        </button>
      </div>
    </aside>

    <!-- 内容区 -->
    <main class="ai-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.ai-app-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--color-bg-2);
}

.ai-nav {
  flex: 0 0 74px;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  background: var(--color-fill-1);
  border-right: 1px solid var(--color-border-2);
  padding: 0 0 16px;
  box-sizing: border-box;
}

.brand {
  width: 40px;
  height: 40px;
  margin: 16px 0 14px;
  border-radius: 10px;
  overflow: hidden;
  display: block;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.brand-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nav-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 56px;
  padding: 8px 4px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--color-text-2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.85);
  color: rgb(var(--primary-6));
}

.nav-item.active {
  font-weight: 600;
  color: rgb(var(--primary-6));
  background: var(--color-bg-2);
  border-color: var(--color-border-2);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.nav-icon {
  font-size: 20px;
}

.nav-text {
  font-size: 11px;
  margin-top: 4px;
  text-align: center;
}

.nav-bottom {
  margin-top: auto;
}

.ai-content {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow: auto;
  background: var(--color-bg-1);
}
</style>
