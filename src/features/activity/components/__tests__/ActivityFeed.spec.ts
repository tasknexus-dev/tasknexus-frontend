import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import * as api from '../../api'
import type { ActivityEntry } from '../../api'
import ActivityFeed from '../ActivityFeed.vue'

vi.mock('../../api', () => ({ getActivity: vi.fn<typeof api.getActivity>() }))

const mocked = vi.mocked(api)

function entry(id: string, changes: Partial<ActivityEntry> = {}): ActivityEntry {
  return {
    id,
    action: 'TASK_CREATED',
    occurredAt: new Date().toISOString(),
    actor: { id: 'ana', name: 'Ana', avatarUrl: null },
    task: { id: `t${id}`, key: `TN-${id}`, title: `Tarea ${id}` },
    subject: null,
    from: null,
    to: null,
    ...changes,
  }
}

async function mountFeed(props: { taskId?: string } = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/projects/:id/tasks/:taskId', name: 'task', component: { template: '<div />' } },
    ],
  })
  const wrapper = mount(ActivityFeed, {
    props: { projectId: 'p1', ...props },
    global: { plugins: [router] },
  })
  await flushPromises()
  return wrapper
}

describe('ActivityFeed', () => {
  beforeEach(() => vi.resetAllMocks())

  it('muestra cada entrada con enlace a la tarea, salvo si se borró', async () => {
    mocked.getActivity.mockResolvedValue({
      items: [entry('2', { action: 'TASK_DELETED' }), entry('1')],
      page: 0,
      size: 30,
      totalItems: 2,
      totalPages: 1,
    })
    const wrapper = await mountFeed()

    const items = wrapper.findAll('[data-testid="activity-entry"]')
    // El navegador colapsa los espacios repetidos; aquí se normalizan igual.
    const text = (index: number) => items[index]!.text().replace(/\s+/g, ' ')
    expect(text(0)).toContain('Ana borró TN-2 «Tarea 2» · hace un momento')
    expect(items[0]!.find('a').exists()).toBe(false)
    expect(text(1)).toContain('Ana creó TN-1 «Tarea 1»')
    expect(items[1]!.get('a').attributes('href')).toBe('/projects/p1/tasks/t1')
    expect(wrapper.find('[data-testid="activity-more"]').exists()).toBe(false)
  })

  it('pide la siguiente página con «Ver más» y la añade al final', async () => {
    mocked.getActivity
      .mockResolvedValueOnce({
        items: [entry('3')],
        page: 0,
        size: 30,
        totalItems: 2,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        items: [entry('1')],
        page: 1,
        size: 30,
        totalItems: 2,
        totalPages: 2,
      })
    const wrapper = await mountFeed({ taskId: 't1' })

    await wrapper.get('[data-testid="activity-more"]').trigger('click')
    await flushPromises()

    expect(mocked.getActivity).toHaveBeenLastCalledWith('p1', { taskId: 't1', page: 1, size: 30 })
    expect(wrapper.findAll('[data-testid="activity-entry"]')).toHaveLength(2)
    expect(wrapper.find('[data-testid="activity-more"]').exists()).toBe(false)
  })

  it('avisa cuando aún no hay actividad', async () => {
    mocked.getActivity.mockResolvedValue({
      items: [],
      page: 0,
      size: 30,
      totalItems: 0,
      totalPages: 0,
    })
    const wrapper = await mountFeed()

    expect(wrapper.get('[data-testid="no-activity"]').text()).toContain('Todavía no hay actividad')
  })
})
