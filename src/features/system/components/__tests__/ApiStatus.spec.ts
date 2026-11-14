import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { AxiosError, AxiosHeaders } from 'axios'

import ApiStatus from '../ApiStatus.vue'
import { fetchHealth } from '../../api'
import type { HealthResponse } from '../../api'

vi.mock('../../api', () => ({ fetchHealth: vi.fn<() => Promise<HealthResponse>>() }))

const mockedFetchHealth = vi.mocked(fetchHealth)

function axiosErrorWithStatus(status: number) {
  return new AxiosError('error', 'ERR', undefined, undefined, {
    status,
    statusText: '',
    data: { status: 'DOWN' },
    headers: {},
    config: { headers: new AxiosHeaders() },
  })
}

describe('ApiStatus', () => {
  beforeEach(() => {
    mockedFetchHealth.mockReset()
  })

  it('muestra "operativo" cuando el backend responde UP', async () => {
    mockedFetchHealth.mockResolvedValue({ status: 'UP' })
    const wrapper = mount(ApiStatus)
    await flushPromises()
    expect(wrapper.get('[data-testid="api-status"]').text()).toBe('Backend operativo')
  })

  it('muestra "con problemas" cuando actuator responde 503', async () => {
    mockedFetchHealth.mockRejectedValue(axiosErrorWithStatus(503))
    const wrapper = mount(ApiStatus)
    await flushPromises()
    expect(wrapper.get('[data-testid="api-status"]').text()).toBe('Backend con problemas')
  })

  it('muestra "no disponible" cuando no hay respuesta', async () => {
    mockedFetchHealth.mockRejectedValue(new Error('Network Error'))
    const wrapper = mount(ApiStatus)
    await flushPromises()
    expect(wrapper.get('[data-testid="api-status"]').text()).toBe('Backend no disponible')
  })
})
