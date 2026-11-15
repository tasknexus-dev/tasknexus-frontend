import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

import { configureAuth, http, type AuthHooks } from '../http'

type Handler = (config: InternalAxiosRequestConfig) => { status: number; data?: unknown }

/** Adaptador falso: responde según `handler` y rechaza los 4xx/5xx como haría axios. */
function fakeAdapter(handler: Handler) {
  return vi.fn<AxiosAdapter>(async (config) => {
    const { status, data = {} } = handler(config)
    const response: AxiosResponse = { data, status, statusText: '', headers: {}, config }
    if (status >= 400) {
      throw new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, response)
    }
    return response
  })
}

function authHeader(config: InternalAxiosRequestConfig | undefined) {
  return config?.headers.get('Authorization')
}

describe('http', () => {
  const originalAdapter = http.defaults.adapter
  let hooks: AuthHooks & {
    refresh: ReturnType<typeof vi.fn<() => Promise<string | null>>>
    onSessionExpired: ReturnType<typeof vi.fn<() => void>>
  }
  let token: string | null

  beforeEach(() => {
    token = 'access-1'
    hooks = {
      getAccessToken: () => token,
      refresh: vi.fn<() => Promise<string | null>>(),
      onSessionExpired: vi.fn<() => void>(),
    }
    configureAuth(hooks)
  })

  afterEach(() => {
    configureAuth(null)
    http.defaults.adapter = originalAdapter
  })

  it('envía el access token en las peticiones a la API', async () => {
    const adapter = fakeAdapter(() => ({ status: 200 }))
    http.defaults.adapter = adapter

    await http.get('/api/v1/users/me')

    expect(authHeader(adapter.mock.calls[0]?.[0])).toBe('Bearer access-1')
  })

  it('no envía el access token a los endpoints de auth', async () => {
    const adapter = fakeAdapter(() => ({ status: 200 }))
    http.defaults.adapter = adapter

    await http.post('/api/v1/auth/refresh')

    expect(authHeader(adapter.mock.calls[0]?.[0])).toBeUndefined()
  })

  it('ante un 401 renueva la sesión y repite la petición con el token nuevo', async () => {
    const adapter = fakeAdapter((config) =>
      authHeader(config) === 'Bearer access-2' ? { status: 200, data: 'ok' } : { status: 401 },
    )
    http.defaults.adapter = adapter
    hooks.refresh.mockImplementation(async () => {
      token = 'access-2'
      return token
    })

    const response = await http.get('/api/v1/users/me')

    expect(response.data).toBe('ok')
    expect(hooks.refresh).toHaveBeenCalledOnce()
    expect(adapter).toHaveBeenCalledTimes(2)
  })

  it('si no puede renovar la sesión avisa y propaga el 401', async () => {
    http.defaults.adapter = fakeAdapter(() => ({ status: 401 }))
    hooks.refresh.mockResolvedValue(null)

    await expect(http.get('/api/v1/users/me')).rejects.toMatchObject({ response: { status: 401 } })
    expect(hooks.onSessionExpired).toHaveBeenCalledOnce()
  })

  it('reintenta una sola vez', async () => {
    const adapter = fakeAdapter(() => ({ status: 401 }))
    http.defaults.adapter = adapter
    hooks.refresh.mockResolvedValue('access-2')

    await expect(http.get('/api/v1/users/me')).rejects.toMatchObject({ response: { status: 401 } })
    expect(hooks.refresh).toHaveBeenCalledOnce()
    expect(adapter).toHaveBeenCalledTimes(2)
  })

  it('no intenta renovar cuando falla un endpoint de auth', async () => {
    http.defaults.adapter = fakeAdapter(() => ({ status: 401 }))

    await expect(http.post('/api/v1/auth/login', {})).rejects.toBeInstanceOf(AxiosError)
    expect(hooks.refresh).not.toHaveBeenCalled()
  })
})
