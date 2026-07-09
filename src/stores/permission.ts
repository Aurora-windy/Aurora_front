import type { Component } from 'vue'
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { RouteRecordRaw } from 'vue-router'
import { getUserRoutes } from '@/api/system/menu'
import type { UserRouteResp } from '@/api/system/types'

export interface AppMenuItem {
  key: string
  title: string
  icon?: string
  children: AppMenuItem[]
}

const MENU_TYPE_BUTTON = 3

const componentMap: Record<string, Component> = {
  'system/user/index': () => import('@/views/system/user/index.vue'),
  'system/role/index': () => import('@/views/system/role/index.vue'),
  'system/menu/index': () => import('@/views/system/menu/index.vue'),
  'edu/student/index': () => import('@/views/edu/student/index.vue'),
  'edu/teacher/index': () => import('@/views/edu/teacher/index.vue'),
  'edu/course/index': () => import('@/views/edu/course/index.vue'),
  'edu/selection/index': () => import('@/views/edu/selection/index.vue'),
}

function normalizePath(path?: string): string {
  if (!path) {
    return ''
  }
  return path.startsWith('/') ? path : `/${path}`
}

function sortRoutes(routes: UserRouteResp[]): UserRouteResp[] {
  return [...routes].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || String(a.id).localeCompare(String(b.id)))
}

function toMenuItem(route: UserRouteResp): AppMenuItem | null {
  if (route.type === MENU_TYPE_BUTTON) {
    return null
  }
  const children = sortRoutes(route.children ?? [])
    .map(toMenuItem)
    .filter((item): item is AppMenuItem => Boolean(item))
  const key = normalizePath(route.path) || String(route.id)
  return {
    key,
    title: route.title,
    icon: route.icon,
    children,
  }
}

function toRouteRecords(routes: UserRouteResp[]): RouteRecordRaw[] {
  const records: RouteRecordRaw[] = []
  for (const route of routes) {
    if (route.type === MENU_TYPE_BUTTON) {
      continue
    }
    const path = normalizePath(route.path)
    const componentKey = route.component ?? ''
    if (path && componentKey && componentMap[componentKey] && path !== '/workbench') {
      records.push({
        path: path.replace(/^\//, ''),
        name: route.name || path,
        component: componentMap[componentKey],
        meta: { title: route.title, requiresAuth: true },
      })
    }
    records.push(...toRouteRecords(route.children ?? []))
  }
  return records
}

export const usePermissionStore = defineStore('permission', () => {
  const routes = ref<UserRouteResp[]>([])
  const routeLoaded = ref(false)
  const dynamicRoutes = ref<RouteRecordRaw[]>([])

  const menus = computed(() =>
    sortRoutes(routes.value)
      .map(toMenuItem)
      .filter((item): item is AppMenuItem => Boolean(item)),
  )

  async function loadRoutes() {
    routes.value = await getUserRoutes()
    dynamicRoutes.value = toRouteRecords(routes.value)
    routeLoaded.value = true
    return dynamicRoutes.value
  }

  function reset() {
    routes.value = []
    dynamicRoutes.value = []
    routeLoaded.value = false
  }

  return { routes, menus, routeLoaded, dynamicRoutes, loadRoutes, reset }
})
