import { describe, expect, it } from 'vitest'

import type { TaskSummary } from '@/features/tasks/api'

import { locate, neighboursAt, replaceCard, snapshot, toColumns } from '../boardModel'

function card(id: string, status: TaskSummary['status'] = 'TODO'): TaskSummary {
  return {
    id,
    projectId: 'p1',
    key: `TN-${id}`,
    number: 1,
    title: id,
    status,
    priority: 'MEDIUM',
    position: '1024',
    assignee: null,
    dueDate: null,
    createdAt: '',
    updatedAt: '',
    version: 0,
  }
}

describe('boardModel', () => {
  const board = {
    projectId: 'p1',
    projectKey: 'TN',
    columns: [
      { status: 'TODO' as const, tasks: [card('a'), card('b')] },
      { status: 'DONE' as const, tasks: [card('c', 'DONE')] },
    ],
  }

  it('crea las cuatro columnas aunque falte alguna en la respuesta', () => {
    const columns = toColumns(board)

    expect(Object.keys(columns)).toEqual(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'])
    expect(columns.IN_PROGRESS).toEqual([])
    expect(columns.TODO.map((task) => task.id)).toEqual(['a', 'b'])
  })

  it('calcula las vecinas de la tarjeta soltada', () => {
    const cards = [card('a'), card('b'), card('c')]

    expect(neighboursAt(cards, 0)).toEqual({ previousTaskId: null, nextTaskId: 'b' })
    expect(neighboursAt(cards, 1)).toEqual({ previousTaskId: 'a', nextTaskId: 'c' })
    expect(neighboursAt(cards, 2)).toEqual({ previousTaskId: 'b', nextTaskId: null })
    expect(neighboursAt([card('a')], 0)).toEqual({ previousTaskId: null, nextTaskId: null })
  })

  it('la copia no cambia al modificar el tablero', () => {
    const columns = toColumns(board)
    const copy = snapshot(columns)

    columns.TODO.splice(0, 1)

    expect(copy.TODO.map((task) => task.id)).toEqual(['a', 'b'])
  })

  it('localiza y sustituye tarjetas', () => {
    const columns = toColumns(board)

    expect(locate(columns, 'c')).toEqual({ status: 'DONE', index: 0 })
    expect(locate(columns, 'x')).toBeNull()

    replaceCard(columns, { ...card('b'), version: 7 })
    expect(columns.TODO[1]!.version).toBe(7)
  })
})
