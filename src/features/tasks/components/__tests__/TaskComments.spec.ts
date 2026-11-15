import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { AxiosError, AxiosHeaders } from 'axios'

import * as api from '../../api'
import type { TaskComment } from '../../api'
import TaskComments from '../TaskComments.vue'

vi.mock('../../api', async (importOriginal) => ({
  ...(await importOriginal<typeof api>()),
  listComments: vi.fn<typeof api.listComments>(),
  addComment: vi.fn<typeof api.addComment>(),
  editComment: vi.fn<typeof api.editComment>(),
  deleteComment: vi.fn<typeof api.deleteComment>(),
}))

const mocked = vi.mocked(api)

function comment(id: string, changes: Partial<TaskComment> = {}): TaskComment {
  return {
    id,
    taskId: 't1',
    author: { id: 'ana', name: 'Ana', email: null, avatarUrl: null },
    content: `Comentario ${id}`,
    createdAt: '2026-11-15T10:00:00Z',
    updatedAt: '2026-11-15T10:00:00Z',
    edited: false,
    version: 0,
    canEdit: true,
    canDelete: true,
    ...changes,
  }
}

function conflict() {
  const config = { headers: new AxiosHeaders() }
  return new AxiosError('fail', 'ERR', config, null, {
    status: 409,
    statusText: '',
    headers: {},
    config,
    data: { code: 'concurrency.conflict', detail: 'Alguien cambió el comentario' },
  })
}

async function mountComments(canComment = true) {
  const wrapper = mount(TaskComments, { props: { taskId: 't1', canComment } })
  await flushPromises()
  return wrapper
}

describe('TaskComments', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocked.listComments.mockResolvedValue([
      comment('1'),
      comment('2', { canEdit: false, canDelete: false }),
    ])
  })

  it('lista los comentarios y solo ofrece las acciones permitidas', async () => {
    const wrapper = await mountComments()

    expect(wrapper.text()).toContain('Comentario 1')
    expect(
      wrapper.get('[data-testid="comment-1"]').find('[data-testid="edit-comment"]').exists(),
    ).toBe(true)
    expect(
      wrapper.get('[data-testid="comment-2"]').find('[data-testid="edit-comment"]').exists(),
    ).toBe(false)
    const counts = wrapper.emitted('count') ?? []
    expect(counts[counts.length - 1]).toEqual([2])
  })

  it('publica un comentario y lo añade al final', async () => {
    mocked.addComment.mockResolvedValue(comment('3', { content: 'Nuevo' }))
    const wrapper = await mountComments()

    await wrapper.get('[data-testid="new-comment-form"] textarea').setValue('  Nuevo  ')
    await wrapper.get('[data-testid="new-comment-form"]').trigger('submit')
    await flushPromises()

    expect(mocked.addComment).toHaveBeenCalledWith('t1', 'Nuevo')
    const items = wrapper.findAll('li')
    expect(items[items.length - 1]!.text()).toContain('Nuevo')
    expect(
      (wrapper.get('[data-testid="new-comment-form"] textarea').element as HTMLTextAreaElement)
        .value,
    ).toBe('')
  })

  it('los observadores no ven el formulario', async () => {
    const wrapper = await mountComments(false)

    expect(wrapper.find('[data-testid="new-comment-form"]').exists()).toBe(false)
  })

  it('edita con la versión del comentario y, si hubo conflicto, recarga y avisa', async () => {
    mocked.editComment.mockRejectedValue(conflict())
    const wrapper = await mountComments()

    await wrapper.get('[data-testid="edit-comment"]').trigger('click')
    await wrapper.get('[data-testid="edit-comment-form"] textarea').setValue('Cambiado')
    await wrapper.get('[data-testid="edit-comment-form"]').trigger('submit')
    await flushPromises()

    expect(mocked.editComment).toHaveBeenCalledWith('1', { content: 'Cambiado', version: 0 })
    expect(mocked.listComments).toHaveBeenCalledTimes(2)
    expect(wrapper.get('[data-testid="problem-alert"]').text()).toBe('Alguien cambió el comentario')
  })

  it('borra tras confirmar', async () => {
    mocked.deleteComment.mockResolvedValue()
    const wrapper = await mountComments()

    await wrapper.get('[data-testid="delete-comment"]').trigger('click')
    await wrapper.get('[data-testid="confirm-delete-comment"]').trigger('click')
    await flushPromises()

    expect(mocked.deleteComment).toHaveBeenCalledWith('1')
    expect(wrapper.find('[data-testid="comment-1"]').exists()).toBe(false)
  })
})
