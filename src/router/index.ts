import { createRouter, createWebHistory } from 'vue-router'
import { getToken } from '@/utils/auth'

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

// 全局守卫：无 token 跳 /login；已登录访问 /login 跳工作台
router.beforeEach((to) => {
  const loggedIn = !!getToken()
  if (to.meta.requiresAuth !== false && !loggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.path === '/login' && loggedIn) {
    return { path: '/workbench' }
  }
  return true
})

export default router
