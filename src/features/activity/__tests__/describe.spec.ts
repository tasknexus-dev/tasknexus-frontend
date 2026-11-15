import { describe as suite, expect, it } from 'vitest'

import type { ActivityEntry } from '../api'
import { describe, relativeTime, taskLabel } from '../describe'

const ana = { id: 'ana', name: 'Ana', avatarUrl: null }
const bruno = { id: 'bruno', name: 'Bruno', avatarUrl: null }
const task = { id: 't1', key: 'TN-3', title: 'Login' }

function entry(changes: Partial<ActivityEntry>): ActivityEntry {
  return {
    id: '1',
    action: 'PROJECT_CREATED',
    occurredAt: '2026-11-15T10:00:00Z',
    actor: ana,
    task: null,
    subject: null,
    from: null,
    to: null,
    ...changes,
  }
}

suite('frases del historial', () => {
  it('describe los cambios de miembros con el rol en minúsculas', () => {
    expect(describe(entry({ action: 'MEMBER_ADDED', subject: bruno, to: 'VIEWER' })).before).toBe(
      'añadió a Bruno como observador',
    )
    expect(
      describe(
        entry({ action: 'MEMBER_ROLE_CHANGED', subject: bruno, from: 'MEMBER', to: 'ADMIN' }),
      ).before,
    ).toBe('cambió el rol de Bruno de miembro a administrador')
    expect(describe(entry({ action: 'MEMBER_REMOVED', subject: ana })).before).toBe(
      'salió del proyecto',
    )
    expect(describe(entry({ action: 'MEMBER_REMOVED', subject: bruno })).before).toBe(
      'quitó a Bruno del proyecto',
    )
  })

  it('parte la frase alrededor de la tarea', () => {
    expect(describe(entry({ action: 'TASK_MOVED', task, from: 'TODO', to: 'DONE' }))).toEqual({
      before: 'movió',
      after: 'de «Pendiente» a «Finalizado»',
    })
    expect(describe(entry({ action: 'TASK_ASSIGNED', task, subject: bruno }))).toEqual({
      before: 'asignó',
      after: 'a Bruno',
    })
    expect(describe(entry({ action: 'TASK_ASSIGNED', task, subject: ana })).before).toBe(
      'se asignó',
    )
    expect(describe(entry({ action: 'TASK_ASSIGNED', task, subject: null })).before).toBe(
      'quitó el responsable de',
    )
  })

  it('muestra la tarea con su código o como borrada', () => {
    expect(taskLabel(task)).toBe('TN-3 «Login»')
    expect(taskLabel({ id: 't2', key: null, title: null })).toBe('una tarea borrada')
  })

  it('expresa el tiempo de forma relativa durante la primera semana', () => {
    const now = new Date('2026-11-15T12:00:00Z')
    expect(relativeTime('2026-11-15T11:59:30Z', now)).toBe('hace un momento')
    expect(relativeTime('2026-11-15T11:55:00Z', now)).toBe('hace 5 minutos')
    expect(relativeTime('2026-11-15T09:00:00Z', now)).toBe('hace 3 horas')
    expect(relativeTime('2026-11-14T12:00:00Z', now)).toBe('ayer')
    expect(relativeTime('2026-10-01T12:00:00Z', now)).toContain('2026')
  })
})
