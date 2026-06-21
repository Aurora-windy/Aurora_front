import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCounterStore } from '../counter'

describe('useCounterStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始 count 为 0', () => {
    const store = useCounterStore()
    expect(store.count).toBe(0)
  })

  it('doubleCount 是 count 的两倍', () => {
    const store = useCounterStore()
    expect(store.doubleCount).toBe(0)
    store.increment()
    expect(store.doubleCount).toBe(2)
  })

  it('increment 后 count +1', () => {
    const store = useCounterStore()
    store.increment()
    store.increment()
    store.increment()
    expect(store.count).toBe(3)
  })
})
