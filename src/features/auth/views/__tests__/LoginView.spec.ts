import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { AxiosError, AxiosHeaders } from 'axios'

import * as api from '../../api'
import LoginView from '../LoginView.vue'

vi.mock('../../api', () => ({
  login: vi.fn<typeof api.login>(),
  register: vi.fn<typeof api.register>(),
  refresh: vi.fn<typeof api.refresh>(),
  logout: vi.fn<typeof api.logout>(),
  fetchMe: vi.fn<typeof api.fetchMe>(),
}))

const mocked = vi.mocked(api)

const Stub = { template: '<div />' }

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: Stub },
      { path: '/login', name: 'login', component: LoginView },
      { path: '/register', name: 'register', component: Stub },
      { path: '/projects', name: 'projects', component: Stub },
    ],
  })
  await router.push(path)
  const wrapper = mount(LoginView, { global: { plugins: [router] } })
  return { wrapper, router }
}

async function fillAndSubmit(wrapper: Awaited<ReturnType<typeof mountAt>>['wrapper']) {
  await wrapper.get('input[type="email"]').setValue('ana@example.com')
  await wrapper.get('input[type="password"]').setValue('secreto-123')
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

describe('LoginView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  it('muestra el error del backend si las credenciales no son válidas', async () => {
    const config = { headers: new AxiosHeaders() }
    mocked.login.mockRejectedValue(
      new AxiosError('fail', 'ERR', config, null, {
        status: 401,
        statusText: '',
        headers: {},
        config,
        data: {
          code: 'auth.invalid-credentials',
          detail: 'El correo o la contraseña no son correctos',
        },
      }),
    )
    const { wrapper, router } = await mountAt('/login')

    await fillAndSubmit(wrapper)

    expect(wrapper.get('[data-testid="form-error"]').text()).toBe(
      'El correo o la contraseña no son correctos',
    )
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('tras iniciar sesión vuelve a la página que se pidió', async () => {
    mocked.login.mockResolvedValue({
      accessToken: 't1',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: { id: '1', name: 'Ana', email: 'ana@example.com', avatarUrl: null, createdAt: '' },
    })
    const { wrapper, router } = await mountAt('/login?redirect=/projects')

    await fillAndSubmit(wrapper)

    expect(mocked.login).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'secreto-123',
    })
    expect(router.currentRoute.value.fullPath).toBe('/projects')
  })

  it('ignora redirecciones a otros sitios', async () => {
    mocked.login.mockResolvedValue({
      accessToken: 't1',
      tokenType: 'Bearer',
      expiresIn: 900,
      user: { id: '1', name: 'Ana', email: 'ana@example.com', avatarUrl: null, createdAt: '' },
    })
    const { wrapper, router } = await mountAt('/login?redirect=//evil.example.com')

    await fillAndSubmit(wrapper)

    expect(router.currentRoute.value.fullPath).toBe('/')
  })
})
