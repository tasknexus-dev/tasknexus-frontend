import type { ProjectRole } from '@/features/projects/api'
import { ROLE_LABELS } from '@/features/projects/permissions'
import type { TaskStatus } from '@/features/tasks/api'
import { STATUS_LABELS } from '@/features/tasks/labels'

import type { ActivityEntry } from './api'

/**
 * Frase de una entrada del historial, sin el nombre de quien la hizo (va delante, en negrita).
 * Si la entrada es de una tarea, la frase se parte en `before` + tarea + `after` para que la
 * tarea se pueda mostrar como enlace.
 */
export interface Sentence {
  before: string
  after: string
}

function role(value: string | null): string {
  return value ? (ROLE_LABELS[value as ProjectRole] ?? value).toLowerCase() : ''
}

function status(value: string | null): string {
  return value ? `«${STATUS_LABELS[value as TaskStatus] ?? value}»` : ''
}

export function describe(entry: ActivityEntry): Sentence {
  const subject = entry.subject?.name ?? 'alguien'
  const self = entry.subject?.id === entry.actor.id
  switch (entry.action) {
    case 'PROJECT_CREATED':
      return { before: 'creó el proyecto', after: '' }
    case 'PROJECT_ARCHIVED':
      return { before: 'archivó el proyecto', after: '' }
    case 'PROJECT_RESTORED':
      return { before: 'restauró el proyecto', after: '' }
    case 'MEMBER_ADDED':
      return { before: `añadió a ${subject} como ${role(entry.to)}`, after: '' }
    case 'MEMBER_REMOVED':
      return { before: self ? 'salió del proyecto' : `quitó a ${subject} del proyecto`, after: '' }
    case 'MEMBER_ROLE_CHANGED':
      return {
        before: `cambió el rol de ${subject} de ${role(entry.from)} a ${role(entry.to)}`,
        after: '',
      }
    case 'OWNERSHIP_TRANSFERRED':
      return { before: `transfirió la propiedad del proyecto a ${subject}`, after: '' }
    case 'TASK_CREATED':
      return { before: 'creó', after: '' }
    case 'TASK_MOVED':
      return { before: 'movió', after: `de ${status(entry.from)} a ${status(entry.to)}` }
    case 'TASK_ASSIGNED':
      if (!entry.subject) return { before: 'quitó el responsable de', after: '' }
      return self ? { before: 'se asignó', after: '' } : { before: 'asignó', after: `a ${subject}` }
    case 'TASK_DELETED':
      return { before: 'borró', after: '' }
    case 'COMMENT_ADDED':
      return { before: 'comentó en', after: '' }
  }
}

/** Texto de la tarea de una entrada: `TN-42 «Título»`, o «una tarea borrada» si no se conoce. */
export function taskLabel(task: ActivityEntry['task']): string {
  if (!task?.key) return 'una tarea borrada'
  return `${task.key} «${task.title}»`
}

/** «hace 5 min», «hace 3 h», «ayer»… y la fecha completa a partir de una semana. */
export function relativeTime(value: string, now: Date = new Date()): string {
  const seconds = Math.round((now.getTime() - new Date(value).getTime()) / 1000)
  const format = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
  if (seconds < 60) return 'hace un momento'
  if (seconds < 3600) return format.format(-Math.floor(seconds / 60), 'minute')
  if (seconds < 86_400) return format.format(-Math.floor(seconds / 3600), 'hour')
  if (seconds < 7 * 86_400) return format.format(-Math.floor(seconds / 86_400), 'day')
  return new Date(value).toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
