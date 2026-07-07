import type { App, DirectiveBinding } from 'vue'
import { useUserStore } from '@/stores/user'

type PermissionValue = string | string[]

function hasPermission(value: PermissionValue): boolean {
  const userStore = useUserStore()
  const permissions = userStore.userInfo?.permissions ?? []
  const required = Array.isArray(value) ? value : [value]
  if (required.length === 0) {
    return true
  }
  return required.some((permission) => permissions.includes(permission))
}

function applyPermission(el: HTMLElement, binding: DirectiveBinding<PermissionValue>) {
  if (!binding.value) {
    return
  }
  if (!hasPermission(binding.value)) {
    el.parentNode?.removeChild(el)
  }
}

export function setupPermissionDirective(app: App) {
  app.directive('permission', {
    mounted: applyPermission,
  })
}
