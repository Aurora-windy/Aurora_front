import { createRouter, createWebHistory } from 'vue-router'
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

// 全局守卫：无 token 跳 /login；登录后加载用户信息和动态菜单路由。
router.beforeEach(async (to) => {
  const loggedIn = !!getToken()
  if (to.meta.requiresAuth !== false && !loggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (loggedIn) {
    const userStore = useUserStore()
    const permissionStore = usePermissionStore()
    try {
      if (!userStore.userInfo) {
        await userStore.fetchUserInfo()
      }
    } catch {
      userStore.clearAuth()
      if (to.path !== '/login') {
        return { path: '/login', query: { redirect: to.fullPath } }
      }
    }

    if (to.path === '/login') {
      return { path: '/' }
    }

    if (!permissionStore.routeLoaded) {
      try {
        const routes = await permissionStore.loadRoutes()
        routes.forEach((route) => router.addRoute('admin-root', route))
        return { ...to, replace: true }
      } catch (error) {
        console.warn('[router] Failed to load dynamic routes, continuing with static routes.', error)
      }
    }
  }
  return true
})

export default router
