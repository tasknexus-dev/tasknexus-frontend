import { http } from '@/shared/api/http'
import type { Page } from '@/features/tasks/api'

export type ActivityAction =
  | 'PROJECT_CREATED'
  | 'PROJECT_ARCHIVED'
  | 'PROJECT_RESTORED'
  | 'MEMBER_ADDED'
  | 'MEMBER_REMOVED'
  | 'MEMBER_ROLE_CHANGED'
  | 'OWNERSHIP_TRANSFERRED'
  | 'TASK_CREATED'
  | 'TASK_MOVED'
  | 'TASK_ASSIGNED'
  | 'TASK_DELETED'
  | 'COMMENT_ADDED'

export interface ActivityUser {
  id: string
  name: string
  avatarUrl: string | null
}

export interface ActivityEntry {
  id: string
  action: ActivityAction
  occurredAt: string
  actor: ActivityUser
  /** `key` y `title` son los que tenía la tarea al registrarse; faltan si ya estaba borrada. */
  task: { id: string; key: string | null; title: string | null } | null
  /** Miembro afectado o nuevo responsable (null al quitar el responsable). */
  subject: ActivityUser | null
  /** Estado de la tarea o rol, según la acción. */
  from: string | null
  to: string | null
}

export interface ActivityQuery {
  taskId?: string
  page?: number
  size?: number
}

/** Lo más reciente primero. */
export async function getActivity(
  projectId: string,
  query: ActivityQuery = {},
): Promise<Page<ActivityEntry>> {
  const { data } = await http.get<Page<ActivityEntry>>(`/api/v1/projects/${projectId}/activity`, {
    params: query,
  })
  return data
}
