import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import * as api from '../../api'
import type { AuthResponse } from '../../api'
import { useSessionStore } from '../session'

vi.mock('../../api', () => ({
  login: vi.fn<typeof api.login>(),
  register: vi.fn<typeof api.register>(),
  refresh: vi.fn<typeof api.refresh>(),
  logout: vi.fn<typeof api.logout>(),
  fetchMe: vi.fn<typeof api.fetchMe>(),
}))

const mocked = vi.mocked(api)

function authResponse(token: string): AuthResponse {
  return {
    accessToken: token,
    tokenType: 'Bearer',
    expiresIn: 900,
    user: {
      id: '1',
      name: 'Ana',
      email: 'ana@example.com',
      avatarUrl: null,
      createdAt: '2026-11-14T10:00:00Z',
    },
  }
}

describe('session store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  it('guarda el usuario y el token al iniciar sesión', async () => {
    mocked.login.mockResolvedValue(authResponse('t1'))
    const session = useSessionStore()

    await session.login({ email: 'ana@example.com', password: 'secreto-123' })

    expect(session.isAuthenticated).toBe(true)
    expect(session.accessToken).toBe('t1')
    expect(session.user?.name).toBe('Ana')
  })

  it('agrupa las renovaciones simultáneas en una sola petición', async () => {
    mocked.refresh.mockResolvedValue(authResponse('t2'))
    const session = useSessionStore()

    const tokens = await Promise.all([session.refresh(), session.refresh(), session.refresh()])

    expect(tokens).toEqual(['t2', 't2', 't2'])
    expect(mocked.refresh).toHaveBeenCalledOnce()
  })

  it('cierra la sesión local si no se puede renovar', async () => {
    mocked.login.mockResolvedValue(authResponse('t1'))
    mocked.refresh.mockRejectedValue(new Error('401'))
    const session = useSessionStore()
    await session.login({ email: 'ana@example.com', password: 'secreto-123' })

    expect(await session.refresh()).toBeNull()
    expect(session.isAuthenticated).toBe(false)
  })

  it('solo intenta recuperar la sesión una vez al arrancar', async () => {
    mocked.refresh.mockRejectedValue(new Error('401'))
    const session = useSessionStore()

    await session.restore()
    await session.restore()

    expect(mocked.refresh).toHaveBeenCalledOnce()
  })

  it('limpia la sesión aunque falle el logout en el servidor', async () => {
    mocked.login.mockResolvedValue(authResponse('t1'))
    mocked.logout.mockRejectedValue(new Error('Network Error'))
    const session = useSessionStore()
    await session.login({ email: 'ana@example.com', password: 'secreto-123' })

    await expect(session.logout()).rejects.toThrow('Network Error')
    expect(session.isAuthenticated).toBe(false)
  })
})
