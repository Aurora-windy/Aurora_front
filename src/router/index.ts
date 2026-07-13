import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { getToken } from '@/utils/auth'
import { usePermissionStore } from '@/stores/permission'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/login/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      name: 'admin-root',
      component: () => import('../layouts/AdminLayout.vue'),
      redirect: '/workbench',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'workbench',
          name: 'workbench',
          component: () => import('../views/workbench/WorkbenchView.vue'),
        },
      ],
    },
  ],
})

const registeredDynamicRouteNames = new Set<string | symbol>()

function ensureDynamicRoutesRegistered(routes: RouteRecordRaw[]): boolean {
  let routeAdded = false

  routes.forEach((route) => {
    const routeName = route.name
    if (routeName && router.hasRoute(routeName)) {
      registeredDynamicRouteNames.add(routeName)
      return
    }

    router.addRoute('admin-root', route)
    if (routeName) {
      registeredDynamicRouteNames.add(routeName)
    }
    routeAdded = true
  })

  return routeAdded
}

function removeDynamicRoutes() {
  registeredDynamicRouteNames.forEach((routeName) => {
    if (router.hasRoute(routeName)) {
      router.removeRoute(routeName)
    }
  })
  registeredDynamicRouteNames.clear()
}

// 全局守卫：无 token 跳 /login；登录后加载用户信息和动态菜单路由。
router.beforeEach(async (to) => {
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()
  const loggedIn = !!getToken()

  if (!loggedIn) {
    removeDynamicRoutes()
    permissionStore.reset()
    if (to.meta.requiresAuth !== false) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
    return true
  }

  try {
    if (!userStore.userInfo) {
      await userStore.fetchUserInfo()
    }
  } catch {
    userStore.clearAuth()
    removeDynamicRoutes()
    if (to.path !== '/login') {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
    return true
  }

  if (to.path === '/login') {
    return { path: '/workbench', replace: true }
  }

  try {
    const loadedNow = !permissionStore.routeLoaded
    if (loadedNow) {
      removeDynamicRoutes()
    }

    const routes = loadedNow
      ? await permissionStore.loadRoutes()
      : permissionStore.dynamicRoutes
    ensureDynamicRoutesRegistered(routes)

    const targetMatched = router.resolve(to.fullPath).matched.length > 0
    if (!targetMatched) {
      return { path: '/workbench', replace: true }
    }

    // 首次加载后重新解析当前地址，避免继续使用旧账号留下的路由匹配结果。
    if (loadedNow || to.matched.length === 0) {
      return { path: to.fullPath, replace: true }
    }
  } catch (error) {
    console.warn('[router] Failed to load dynamic routes, continuing with static routes.', error)
    if (router.resolve(to.fullPath).matched.length === 0) {
      return { path: '/workbench', replace: true }
    }
  }

  return true
})

export default router
