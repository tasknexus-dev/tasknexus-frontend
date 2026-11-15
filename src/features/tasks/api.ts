import { http } from '@/shared/api/http'
import type { UserRef } from '@/features/projects/api'

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

/** Tarjeta del tablero o fila del listado. */
export interface TaskSummary {
  id: string
  projectId: string
  key: string
  number: number
  title: string
  status: TaskStatus
  priority: TaskPriority
  /** Decimal en texto; solo sirve para ordenar dentro de la columna. */
  position: string
  assignee: UserRef | null
  /** Fecha `AAAA-MM-DD` sin hora. */
  dueDate: string | null
  createdAt: string
  updatedAt: string
  version: number
}

export interface TaskDetails extends Omit<TaskSummary, 'position'> {
  description: string | null
  reporter: UserRef
  completedAt: string | null
  canEdit: boolean
  canDelete: boolean
}

export interface BoardColumn {
  status: TaskStatus
  tasks: TaskSummary[]
}

export interface Board {
  projectId: string
  projectKey: string
  columns: BoardColumn[]
}

export interface Page<T> {
  items: T[]
  page: number
  size: number
  totalItems: number
  totalPages: number
}

export interface TaskInput {
  title: string
  description: string | null
  priority: TaskPriority
  dueDate: string | null
  assigneeId: string | null
}

export interface TaskQuery {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  /** ID de usuario, `me` o `none`. */
  assignee?: string
  q?: string
  page?: number
  size?: number
  /** `campo,asc|desc`: createdAt, updatedAt, dueDate, priority, number, title. */
  sort?: string
}

export interface MoveInput {
  status: TaskStatus
  /** Tarjeta que queda encima (null si va la primera). */
  previousTaskId: string | null
  /** Tarjeta que queda debajo (null si va la última). */
  nextTaskId: string | null
  version: number
}

export async function getBoard(projectId: string): Promise<Board> {
  const { data } = await http.get<Board>(`/api/v1/projects/${projectId}/board`)
  return data
}

export async function listTasks(
  projectId: string,
  query: TaskQuery = {},
): Promise<Page<TaskSummary>> {
  const { data } = await http.get<Page<TaskSummary>>(`/api/v1/projects/${projectId}/tasks`, {
    params: query,
    // status=TODO&status=DONE en lugar de status[]=…
    paramsSerializer: { indexes: null },
  })
  return data
}

export async function createTask(projectId: string, input: TaskInput): Promise<TaskDetails> {
  const { data } = await http.post<TaskDetails>(`/api/v1/projects/${projectId}/tasks`, input)
  return data
}

export async function getTask(taskId: string): Promise<TaskDetails> {
  const { data } = await http.get<TaskDetails>(`/api/v1/tasks/${taskId}`)
  return data
}

export async function updateTask(
  taskId: string,
  input: TaskInput & { version: number },
): Promise<TaskDetails> {
  const { data } = await http.put<TaskDetails>(`/api/v1/tasks/${taskId}`, input)
  return data
}

export async function moveTask(taskId: string, input: MoveInput): Promise<TaskSummary> {
  const { data } = await http.patch<TaskSummary>(`/api/v1/tasks/${taskId}/move`, input)
  return data
}

export async function deleteTask(taskId: string): Promise<void> {
  await http.delete(`/api/v1/tasks/${taskId}`)
}
