import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import type { Project } from '@/features/projects/api'
import { projectContextKey } from '@/features/projects/context'

import * as api from '../../api'
import TaskListView from '../TaskListView.vue'

vi.mock('../../api', () => ({
  listTasks: vi.fn<typeof api.listTasks>(),
  createTask: vi.fn<typeof api.createTask>(),
}))

const mocked = vi.mocked(api)

const project = {
  id: 'p1',
  key: 'TN',
  name: 'TaskNexus',
  archived: false,
  myRole: 'MEMBER',
} as Project

async function mountAt(path: string) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/projects/:id/tasks', name: 'tasks', component: TaskListView },
      { path: '/projects/:id/tasks/:taskId', name: 'task', component: { template: '<div />' } },
    ],
  })
  await router.push(path)
  const wrapper = mount(TaskListView, {
    global: {
      plugins: [router],
      provide: {
        [projectContextKey as symbol]: {
          project: ref(project),
          members: ref([]),
          reload: vi.fn<() => Promise<void>>(),
          replaceProject: vi.fn<(project: Project) => void>(),
        },
      },
    },
  })
  await flushPromises()
  return { wrapper, router }
}

describe('TaskListView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocked.listTasks.mockResolvedValue({
      items: [],
      page: 0,
      size: 20,
      totalItems: 0,
      totalPages: 0,
    })
  })

  it('lee los filtros de la URL', async () => {
    await mountAt('/projects/p1/tasks?status=DONE&assignee=me&q=login&page=2&sort=priority,desc')

    expect(mocked.listTasks).toHaveBeenCalledWith('p1', {
      page: 1,
      size: 20,
      sort: 'priority,desc',
      status: ['DONE'],
      priority: undefined,
      assignee: 'me',
      q: 'login',
    })
  })

  it('al cambiar un filtro lo guarda en la URL y vuelve a la primera página', async () => {
    const { wrapper, router } = await mountAt('/projects/p1/tasks?page=3')

    await wrapper.get('[data-testid="filter-priority"]').setValue('CRITICAL')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({ priority: 'CRITICAL' })
    expect(mocked.listTasks).toHaveBeenLastCalledWith(
      'p1',
      expect.objectContaining({ page: 0, priority: ['CRITICAL'] }),
    )
    expect(wrapper.get('[data-testid="empty-tasks"]').text()).toContain('No hay tareas')
  })
})
