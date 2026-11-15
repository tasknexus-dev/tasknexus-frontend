import { describe, expect, it } from 'vitest'

import { formatDate, isOverdue, today } from '../labels'

describe('fechas de las tareas', () => {
  const now = new Date(2026, 10, 15, 23, 30) // 15 nov 2026, 23:30 hora local

  it('usa la fecha local del usuario', () => {
    expect(today(now)).toBe('2026-11-15')
  })

  it('una tarea está vencida si su fecha ya pasó y no está finalizada', () => {
    expect(isOverdue({ dueDate: '2026-11-14', status: 'TODO' }, now)).toBe(true)
    expect(isOverdue({ dueDate: '2026-11-15', status: 'TODO' }, now)).toBe(false)
    expect(isOverdue({ dueDate: '2026-11-14', status: 'DONE' }, now)).toBe(false)
    expect(isOverdue({ dueDate: null, status: 'IN_PROGRESS' }, now)).toBe(false)
  })

  it('formatea la fecha sin desplazarla por la zona horaria', () => {
    expect(formatDate('2026-12-01')).toContain('2026')
    expect(formatDate('2026-12-01')).toMatch(/^1\b/)
  })
})
