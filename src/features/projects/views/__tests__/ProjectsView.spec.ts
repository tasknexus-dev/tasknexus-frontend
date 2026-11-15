import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import * as api from '../../api'
import type { Project, ProjectSummary } from '../../api'
import ProjectsView from '../ProjectsView.vue'

vi.mock('../../api', () => ({
  listProjects: vi.fn<typeof api.listProjects>(),
  createProject: vi.fn<typeof api.createProject>(),
}))

const mocked = vi.mocked(api)

const Stub = { template: '<div />' }

const summary: ProjectSummary = {
  id: 'p1',
  key: 'TN',
  name: 'TaskNexus',
  description: 'Gestor de tareas',
  archived: false,
  myRole: 'ADMIN',
  memberCount: 3,
  updatedAt: '2026-01-01T00:00:00Z',
}

async function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/projects', name: 'projects', component: ProjectsView },
      { path: '/projects/:id', name: 'project', component: Stub },
    ],
  })
  await router.push('/projects')
  const wrapper = mount(ProjectsView, { global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

describe('ProjectsView', () => {
  beforeEach(() => vi.resetAllMocks())

  it('lista mis proyectos con su clave, rol y número de miembros', async () => {
    mocked.listProjects.mockResolvedValue([summary])
    const { wrapper } = await mountView()

    expect(mocked.listProjects).toHaveBeenCalledWith(false)
    const card = wrapper.get('[data-testid="project-list"] a')
    expect(card.attributes('href')).toBe('/projects/p1')
    expect(card.text()).toContain('TN')
    expect(card.text()).toContain('Administrador')
    expect(card.text()).toContain('3 miembros')
  })

  it('cambia a los archivados y muestra el estado vacío', async () => {
    mocked.listProjects.mockResolvedValueOnce([summary]).mockResolvedValueOnce([])
    const { wrapper } = await mountView()

    await wrapper.findAll('[role="tab"]')[1]!.trigger('click')
    await flushPromises()

    expect(mocked.listProjects).toHaveBeenLastCalledWith(true)
    expect(wrapper.get('[data-testid="empty-projects"]').text()).toContain(
      'No hay proyectos archivados',
    )
  })

  it('crea un proyecto proponiendo la clave y abre su página', async () => {
    mocked.listProjects.mockResolvedValue([])
    mocked.createProject.mockResolvedValue({ id: 'new-id' } as Project)
    const { wrapper, router } = await mountView()

    await wrapper.get('[data-testid="new-project"]').trigger('click')
    const form = wrapper.get('[data-testid="create-project-form"]')
    const [name, key] = form.findAll('input')
    await name!.setValue('Portal web')
    expect((key!.element as HTMLInputElement).value).toBe('PW')
    await form.trigger('submit')
    await flushPromises()

    expect(mocked.createProject).toHaveBeenCalledWith({
      key: 'PW',
      name: 'Portal web',
      description: null,
    })
    expect(router.currentRoute.value.fullPath).toBe('/projects/new-id')
  })
})
