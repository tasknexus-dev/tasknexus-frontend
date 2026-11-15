import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { VueDraggable } from 'vue-draggable-plus'
import { AxiosError, AxiosHeaders } from 'axios'

import type { Project, ProjectRole } from '@/features/projects/api'
import { projectContextKey } from '@/features/projects/context'
import * as api from '@/features/tasks/api'
import type { Board, TaskSummary } from '@/features/tasks/api'

import BoardView from '../BoardView.vue'

vi.mock('@/features/tasks/api', () => ({
  getBoard: vi.fn<typeof api.getBoard>(),
  moveTask: vi.fn<typeof api.moveTask>(),
  createTask: vi.fn<typeof api.createTask>(),
}))

const mocked = vi.mocked(api)

function card(id: string, status: TaskSummary['status'], version = 0): TaskSummary {
  return {
    id,
    projectId: 'p1',
    key: `TN-${id}`,
    number: 1,
    title: `Tarea ${id}`,
    status,
    priority: 'MEDIUM',
    position: '1024',
    assignee: null,
    dueDate: null,
    createdAt: '',
    updatedAt: '',
    version,
  }
}

function board(): Board {
  return {
    projectId: 'p1',
    projectKey: 'TN',
    columns: [
      { status: 'TODO', tasks: [card('a', 'TODO', 3), card('b', 'TODO')] },
      { status: 'IN_PROGRESS', tasks: [card('c', 'IN_PROGRESS')] },
      { status: 'IN_REVIEW', tasks: [] },
      { status: 'DONE', tasks: [] },
    ],
  }
}

function project(myRole: ProjectRole = 'MEMBER', archived = false): Project {
  return {
    id: 'p1',
    key: 'TN',
    name: 'TaskNexus',
    description: null,
    archived,
    owner: { id: 'o', name: 'Olga', email: null, avatarUrl: null },
    myRole,
    memberCount: 1,
    createdAt: '',
    updatedAt: '',
    version: 0,
  }
}

async function mountBoard(myRole?: ProjectRole, archived?: boolean) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/projects/:id/tasks/:taskId', name: 'task', component: { template: '<div />' } },
    ],
  })
  const wrapper = mount(BoardView, {
    global: {
      plugins: [router],
      provide: {
        [projectContextKey as symbol]: {
          project: ref(project(myRole, archived)),
          members: ref([]),
          reload: vi.fn<() => Promise<void>>(),
          replaceProject: vi.fn<(project: Project) => void>(),
        },
      },
    },
  })
  await flushPromises()
  return wrapper
}

function ids(wrapper: Awaited<ReturnType<typeof mountBoard>>, status: string) {
  return wrapper
    .get(`[data-testid="column-${status}"]`)
    .findAll('[data-id]')
    .map((element) => element.attributes('data-id'))
}

/** Simula lo que hace vue-draggable-plus al soltar «a» al final de «En proceso». */
async function dragAToInProgress(wrapper: Awaited<ReturnType<typeof mountBoard>>) {
  const lists = wrapper.findAllComponents(VueDraggable)
  const [todo, inProgress] = [lists[0]!, lists[1]!]
  const a = (todo.props('modelValue') as TaskSummary[])[0]!
  const item = wrapper.get('[data-id="a"]').element as HTMLElement
  todo.vm.$emit('start', {})
  todo.vm.$emit('update:modelValue', (todo.props('modelValue') as TaskSummary[]).slice(1))
  inProgress.vm.$emit('update:modelValue', [
    ...(inProgress.props('modelValue') as TaskSummary[]),
    a,
  ])
  todo.vm.$emit('end', { item })
  await flushPromises()
}

describe('BoardView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocked.getBoard.mockResolvedValue(board())
  })

  it('muestra las cuatro columnas con sus tarjetas', async () => {
    const wrapper = await mountBoard()

    expect(ids(wrapper, 'TODO')).toEqual(['a', 'b'])
    expect(ids(wrapper, 'IN_PROGRESS')).toEqual(['c'])
    expect(wrapper.get('[data-testid="column-DONE"]').text()).toContain('Finalizado')
    expect(wrapper.find('[data-testid="quick-add"]').exists()).toBe(true)
  })

  it('mueve la tarjeta enviando sus nuevas vecinas y la versión', async () => {
    mocked.moveTask.mockResolvedValue(card('a', 'IN_PROGRESS', 4))
    const wrapper = await mountBoard()

    await dragAToInProgress(wrapper)

    expect(mocked.moveTask).toHaveBeenCalledWith('a', {
      status: 'IN_PROGRESS',
      previousTaskId: 'c',
      nextTaskId: null,
      version: 3,
    })
    expect(ids(wrapper, 'IN_PROGRESS')).toEqual(['c', 'a'])
    expect(ids(wrapper, 'TODO')).toEqual(['b'])
  })

  it('si el servidor rechaza el movimiento, la tarjeta vuelve a su sitio y se recarga', async () => {
    const config = { headers: new AxiosHeaders() }
    mocked.moveTask.mockRejectedValue(
      new AxiosError('fail', 'ERR', config, null, {
        status: 409,
        statusText: '',
        headers: {},
        config,
        data: { code: 'concurrency.conflict', detail: 'Otra persona movió la tarjeta' },
      }),
    )
    const wrapper = await mountBoard()

    await dragAToInProgress(wrapper)

    expect(ids(wrapper, 'TODO')).toEqual(['a', 'b'])
    expect(ids(wrapper, 'IN_PROGRESS')).toEqual(['c'])
    expect(wrapper.get('[data-testid="problem-alert"]').text()).toBe(
      'Otra persona movió la tarjeta',
    )
    expect(mocked.getBoard).toHaveBeenCalledTimes(2)
  })

  it('los observadores ven el tablero en solo lectura', async () => {
    const wrapper = await mountBoard('VIEWER')

    expect(wrapper.find('[data-testid="read-only-board"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="quick-add"]').exists()).toBe(false)
    expect(wrapper.findAllComponents(VueDraggable).every((list) => list.props('disabled'))).toBe(
      true,
    )
  })

  it('crea una tarea rápida en «Pendiente» y recarga el tablero', async () => {
    mocked.createTask.mockResolvedValue({} as api.TaskDetails)
    const wrapper = await mountBoard()

    await wrapper.get('[data-testid="quick-add"] input').setValue('  Nueva  ')
    await wrapper.get('[data-testid="quick-add"]').trigger('submit')
    await flushPromises()

    expect(mocked.createTask).toHaveBeenCalledWith('p1', {
      title: 'Nueva',
      description: null,
      priority: 'MEDIUM',
      dueDate: null,
      assigneeId: null,
    })
    expect(mocked.getBoard).toHaveBeenCalledTimes(2)
  })
})
