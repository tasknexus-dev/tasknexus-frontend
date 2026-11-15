import axios, { isAxiosError, type InternalAxiosRequestConfig } from 'axios'

/**
 * Cliente HTTP único de la aplicación.
 * Las rutas son relativas: en desarrollo las atiende el proxy de Vite y en producción nginx.
 */
export const http = axios.create({
  baseURL: '/',
  timeout: 10_000,
  headers: { Accept: 'application/json' },
})

/**
 * Lo que el cliente HTTP necesita de la sesión. Lo registra el módulo de auth al arrancar
 * (`configureAuth`), así `shared` no depende de ninguna feature.
 */
export interface AuthHooks {
  getAccessToken(): string | null
  /** Renueva la sesión con el refresh token (cookie). Devuelve el nuevo access token o `null`. */
  refresh(): Promise<string | null>
  /** La sesión no se pudo renovar: hay que volver a iniciar sesión. */
  onSessionExpired(): void
}

let auth: AuthHooks | null = null

export function configureAuth(hooks: AuthHooks | null) {
  auth = hooks
}

/** Los endpoints de auth no llevan access token ni se reintentan tras un 401. */
const AUTH_ENDPOINTS = '/api/v1/auth/'

function isAuthEndpoint(url: string | undefined) {
  return url?.startsWith(AUTH_ENDPOINTS) ?? false
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

http.interceptors.request.use((config) => {
  const token = auth?.getAccessToken()
  if (token && !isAuthEndpoint(config.url)) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

// Ante un 401 (access token caducado) renueva la sesión una vez y repite la petición.
http.interceptors.response.use(undefined, async (error: unknown) => {
  if (!auth || !isAxiosError(error) || error.response?.status !== 401) {
    throw error
  }
  const config = error.config as RetriableConfig | undefined
  if (!config || config._retried || isAuthEndpoint(config.url)) {
    throw error
  }
  const token = await auth.refresh()
  if (!token) {
    auth.onSessionExpired()
    throw error
  }
  config._retried = true
  config.headers.set('Authorization', `Bearer ${token}`)
  return http.request(config)
})
