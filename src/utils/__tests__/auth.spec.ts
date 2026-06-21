import { describe, it, expect, beforeEach } from 'vitest'
import { getToken, setToken, removeToken } from '../auth'

describe('auth token utils', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('无 token 时 getToken 返回 null', () => {
    expect(getToken()).toBeNull()
  })

  it('setToken 后 getToken 能取到', () => {
    setToken('fake-jwt-token')
    expect(getToken()).toBe('fake-jwt-token')
  })

  it('removeToken 后 getToken 返回 null', () => {
    setToken('fake-jwt-token')
    removeToken()
    expect(getToken()).toBeNull()
  })

  it('token 存在特定 key 下，与后端约定一致', () => {
    setToken('xxx')
    expect(localStorage.getItem('aurora:access_token')).toBe('xxx')
  })
})
