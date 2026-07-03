import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { login as loginApi, logout as logoutApi, getUserInfo } from '@/api/auth'
import type { LoginReq, UserInfo } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(getToken())
  const userInfo = ref<UserInfo | null>(null)

  async function login(form: LoginReq) {
    const data = await loginApi(form)
    token.value = data.token
    setToken(data.token)
  }

  async function fetchUserInfo() {
    userInfo.value = await getUserInfo()
    return userInfo.value
  }

  async function logout() {
    try {
      await logoutApi()
    } finally {
      token.value = null
      userInfo.value = null
      removeToken()
    }
  }

  return { token, userInfo, login, fetchUserInfo, logout }
})
