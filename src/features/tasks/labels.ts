import type { TaskPriority, TaskStatus } from './api'

export const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'Pendiente',
  IN_PROGRESS: 'En proceso',
  IN_REVIEW: 'En revisión',
  DONE: 'Finalizado',
}

/** De menos a más importante. */
export const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

export const PRIORITY_STYLES: Record<TaskPriority, string> = {
  LOW: 'bg-slate-100 text-slate-600 ring-slate-200',
  MEDIUM: 'bg-sky-50 text-sky-700 ring-sky-200',
  HIGH: 'bg-amber-50 text-amber-800 ring-amber-200',
  CRITICAL: 'bg-rose-50 text-rose-700 ring-rose-200',
}

/** Fecha de hoy en la zona horaria del navegador, `AAAA-MM-DD`. */
export function today(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/** Vencida: no finalizada y con fecha límite anterior a hoy (hora local del usuario). */
export function isOverdue(
  task: { dueDate: string | null; status: TaskStatus },
  now: Date = new Date(),
): boolean {
  return task.dueDate !== null && task.status !== 'DONE' && task.dueDate < today(now)
}

/** `2026-12-01` → `1 dic 2026`, sin desplazamientos por zona horaria. */
export function formatDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year!, month! - 1, day!).toLocaleDateString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })
}
