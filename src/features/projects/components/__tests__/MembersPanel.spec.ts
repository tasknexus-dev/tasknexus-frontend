import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { AxiosError, AxiosHeaders } from 'axios'

import * as api from '../../api'
import type { Member, Project, ProjectRole } from '../../api'
import MembersPanel from '../MembersPanel.vue'

vi.mock('../../api', () => ({
  addMember: vi.fn<typeof api.addMember>(),
  changeMemberRole: vi.fn<typeof api.changeMemberRole>(),
  removeMember: vi.fn<typeof api.removeMember>(),
  searchUsers: vi.fn<typeof api.searchUsers>(),
}))

const mocked = vi.mocked(api)

function user(id: string, name: string) {
  return { id, name, email: `${id}@example.com`, avatarUrl: null }
}

const members: Member[] = [
  { user: user('owner', 'Olga'), role: 'OWNER', joinedAt: '2026-01-01T00:00:00Z' },
  { user: user('admin', 'Ada'), role: 'ADMIN', joinedAt: '2026-01-02T00:00:00Z' },
  { user: user('member', 'Mario'), role: 'MEMBER', joinedAt: '2026-01-03T00:00:00Z' },
]

function project(myRole: ProjectRole, archived = false): Project {
  return {
    id: 'p1',
    key: 'TN',
    name: 'TaskNexus',
    description: null,
    archived,
    owner: user('owner', 'Olga'),
    myRole,
    memberCount: members.length,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    version: 3,
  }
}

function mountAs(myRole: ProjectRole, currentUserId: string, archived = false) {
  return mount(MembersPanel, {
    props: { project: project(myRole, archived), members, currentUserId },
  })
}

describe('MembersPanel', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.useRealTimers()
  })

  it('un administrador puede gestionar miembros, pero no al propietario ni a otros administradores', () => {
    const wrapper = mountAs('ADMIN', 'admin')

    expect(wrapper.find('[data-testid="add-member"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="member-owner"] select').exists()).toBe(false)
    expect(wrapper.find('[data-testid="member-admin"] select').exists()).toBe(false)
    const memberRow = wrapper.get('[data-testid="member-member"]')
    const options = memberRow.findAll('option').map((option) => option.attributes('value'))
    expect(options).toEqual(['MEMBER', 'VIEWER'])
    expect(wrapper.get('[data-testid="member-admin"]').find('[data-testid="leave"]').exists()).toBe(
      true,
    )
  })

  it('un miembro solo ve los roles y puede salir del proyecto', () => {
    const wrapper = mountAs('MEMBER', 'member')

    expect(wrapper.find('[data-testid="add-member"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-testid="member-role"]')).toHaveLength(0)
    expect(wrapper.findAll('[data-testid="remove"]')).toHaveLength(0)
    expect(wrapper.find('[data-testid="leave"]').exists()).toBe(true)
  })

  it('en un proyecto archivado no se puede cambiar nada', () => {
    const wrapper = mountAs('OWNER', 'owner', true)

    expect(wrapper.find('[data-testid="add-member"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-testid="member-role"]')).toHaveLength(0)
    expect(wrapper.findAll('[data-testid="remove"]')).toHaveLength(0)
  })

  it('busca un usuario, lo añade con el rol elegido y avisa para recargar', async () => {
    vi.useFakeTimers()
    mocked.searchUsers.mockResolvedValue([user('member', 'Mario'), user('new', 'Nora')])
    mocked.addMember.mockResolvedValue({
      user: user('new', 'Nora'),
      role: 'VIEWER',
      joinedAt: '2026-02-01T00:00:00Z',
    })
    const wrapper = mountAs('OWNER', 'owner')

    await wrapper.get('[data-testid="user-search"]').setValue('no')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    const results = wrapper.get('[data-testid="user-results"]').findAll('button')
    expect(results.map((button) => button.text())).toEqual(['Noranew@example.com'])
    await results[0]!.trigger('click')
    await wrapper.get('[data-testid="candidate-role"]').setValue('VIEWER')
    await wrapper.get('[data-testid="confirm-add"]').trigger('click')
    await flushPromises()

    expect(mocked.searchUsers).toHaveBeenCalledWith('no')
    expect(mocked.addMember).toHaveBeenCalledWith('p1', 'new', 'VIEWER')
    expect(wrapper.emitted('changed')).toHaveLength(1)
  })

  it('pide confirmación antes de quitar a alguien y muestra el error del backend', async () => {
    const config = { headers: new AxiosHeaders() }
    mocked.removeMember.mockRejectedValue(
      new AxiosError('fail', 'ERR', config, null, {
        status: 403,
        statusText: '',
        headers: {},
        config,
        data: { code: 'project.forbidden', detail: 'Tu rol en el proyecto no permite esta acción' },
      }),
    )
    const wrapper = mountAs('OWNER', 'owner')

    await wrapper.get('[data-testid="member-member"] [data-testid="remove"]').trigger('click')
    expect(mocked.removeMember).not.toHaveBeenCalled()
    await wrapper.get('[data-testid="confirm-remove"]').trigger('click')
    await flushPromises()

    expect(mocked.removeMember).toHaveBeenCalledWith('p1', 'member')
    expect(wrapper.get('[data-testid="problem-alert"]').text()).toBe(
      'Tu rol en el proyecto no permite esta acción',
    )
    expect(wrapper.emitted('changed')).toBeUndefined()
  })

  it('al salir del proyecto emite "left"', async () => {
    mocked.removeMember.mockResolvedValue()
    const wrapper = mountAs('VIEWER', 'member')

    await wrapper.get('[data-testid="leave"]').trigger('click')
    await wrapper.get('[data-testid="confirm-remove"]').trigger('click')
    await flushPromises()

    expect(mocked.removeMember).toHaveBeenCalledWith('p1', 'member')
    expect(wrapper.emitted('left')).toHaveLength(1)
  })
})
