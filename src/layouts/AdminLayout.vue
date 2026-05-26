<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../stores/app'

const appStore = useAppStore()
const route = useRoute()

const activeMenu = computed(() => {
  return route.path
})
</script>

<template>
  <el-container class="admin-layout">
    <el-aside class="admin-aside" :width="appStore.sidebarCollapsed ? '72px' : '220px'">
      <div class="brand">AURORA</div>
      <el-menu
        :default-active="activeMenu"
        :collapse="appStore.sidebarCollapsed"
        background-color="#ffffff"
        text-color="#1f2937"
        active-text-color="#1677ff"
        router
      >
        <el-menu-item index="/dashboard">首页看板</el-menu-item>
        <el-menu-item index="/users">用户管理</el-menu-item>
        <el-menu-item index="/settings">系统设置</el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="admin-header">
        <div class="header-left">
          <el-button text @click="appStore.toggleSidebar()">
            {{ appStore.sidebarCollapsed ? '展开菜单' : '收起菜单' }}
          </el-button>
        </div>
        <!-- <div class="header-right">
          <el-tag type="primary" effect="light">企业管理后台</el-tag>
          <el-avatar :size="32">A</el-avatar>
        </div> -->
      </el-header>

      <el-main class="admin-main">
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: #f3f6fa;
}

.admin-aside {
  border-right: 1px solid #e5eaf3;
  background: #ffffff;
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
  border-bottom: 1px solid #e5eaf3;
  background: #ffffff;
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
