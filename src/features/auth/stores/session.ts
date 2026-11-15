import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import * as api from '../api'
import type { AuthResponse, LoginInput, RegisterInput, User } from '../api'

/**
 * Sesión del usuario. El access token vive solo en memoria (nunca en localStorage, para que un
 * XSS no pueda robarlo); al recargar la página se recupera con el refresh token de la cookie.
 */
export const useSessionStore = defineStore('session', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const isAuthenticated = computed(() => user.value !== null && accessToken.value !== null)

  let refreshing: Promise<string | null> | null = null
  let restoring: Promise<void> | null = null

  function apply(response: AuthResponse) {
    accessToken.value = response.accessToken
    user.value = response.user
  }

  function clear() {
    accessToken.value = null
    user.value = null
  }

  async function login(input: LoginInput) {
    apply(await api.login(input))
  }

  async function register(input: RegisterInput) {
    apply(await api.register(input))
  }

  /**
   * Renueva la sesión. Las llamadas simultáneas comparten una sola petición: el backend rota el
   * refresh token en cada uso y una segunda petición con el token antiguo cerraría la sesión.
   */
  function refresh(): Promise<string | null> {
    refreshing ??= api
      .refresh()
      .then((response) => {
        apply(response)
        return response.accessToken
      })
      .catch(() => {
        clear()
        return null
      })
      .finally(() => {
        refreshing = null
      })
    return refreshing
  }

  /** Intenta recuperar la sesión al cargar la aplicación (solo la primera vez). */
  function restore(): Promise<void> {
    restoring ??= refresh().then(() => undefined)
    return restoring
  }

  async function logout() {
    try {
      await api.logout()
    } finally {
      clear()
    }
  }

  return { user, accessToken, isAuthenticated, login, register, refresh, restore, logout }
})
