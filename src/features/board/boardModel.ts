import type { Board, TaskStatus, TaskSummary } from '@/features/tasks/api'
import { STATUSES } from '@/features/tasks/labels'

/** Tarjetas de cada columna, en el orden en que se ven. */
export type Columns = Record<TaskStatus, TaskSummary[]>

export function toColumns(board: Board): Columns {
  const columns = emptyColumns()
  for (const column of board.columns) {
    columns[column.status] = [...column.tasks]
  }
  return columns
}

export function emptyColumns(): Columns {
  return Object.fromEntries(STATUSES.map((status) => [status, []])) as unknown as Columns
}

/** Copia para poder deshacer un movimiento optimista si el servidor lo rechaza. */
export function snapshot(columns: Columns): Columns {
  return Object.fromEntries(
    STATUSES.map((status) => [status, [...columns[status]]]),
  ) as unknown as Columns
}

/** Vecinas de la tarjeta que ha quedado en `index`: las que el backend usa para calcular su posición. */
export function neighboursAt(
  cards: TaskSummary[],
  index: number,
): { previousTaskId: string | null; nextTaskId: string | null } {
  return {
    previousTaskId: cards[index - 1]?.id ?? null,
    nextTaskId: cards[index + 1]?.id ?? null,
  }
}

/** Sustituye la tarjeta (misma id) por su versión actualizada, en la columna donde esté. */
export function replaceCard(columns: Columns, card: TaskSummary): void {
  for (const status of STATUSES) {
    const index = columns[status].findIndex((candidate) => candidate.id === card.id)
    if (index >= 0) {
      columns[status][index] = card
      return
    }
  }
}

/** Busca una tarjeta por id y devuelve su columna y posición. */
export function locate(columns: Columns, id: string): { status: TaskStatus; index: number } | null {
  for (const status of STATUSES) {
    const index = columns[status].findIndex((card) => card.id === id)
    if (index >= 0) return { status, index }
  }
  return null
}
