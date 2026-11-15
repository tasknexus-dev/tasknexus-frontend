import type { Pinia } from 'pinia'
import type { RouteLocationRaw, Router } from 'vue-router'

import { configureAuth } from '@/shared/api/http'

import { useSessionStore } from './stores/session'

/** Conecta la sesión con el cliente HTTP y con el router. Se llama una vez en `main.ts`. */
export function installAuth(pinia: Pinia, router: Router) {
  const session = useSessionStore(pinia)

  configureAuth({
    getAccessToken: () => session.accessToken,
    refresh: () => session.refresh(),
    onSessionExpired: () => {
      const current = router.currentRoute.value
      if (current.meta.requiresAuth) {
        void router.push(loginRoute(current.fullPath))
      }
    },
  })

  router.beforeEach(async (to) => {
    await session.restore()
    if (to.meta.requiresAuth && !session.isAuthenticated) {
      return loginRoute(to.fullPath)
    }
    if (to.meta.guestOnly && session.isAuthenticated) {
      return { name: 'home' }
    }
  })
}

export function loginRoute(redirect?: string): RouteLocationRaw {
  return redirect && redirect !== '/' ? { name: 'login', query: { redirect } } : { name: 'login' }
}

/** Solo rutas internas: evita redirecciones abiertas a otros sitios (`//evil.com`). */
export function safeRedirect(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}
