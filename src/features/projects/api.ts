import { http } from '@/shared/api/http'

export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'

export interface UserRef {
  id: string
  name: string
  email: string | null
  avatarUrl: string | null
}

export interface ProjectSummary {
  id: string
  key: string
  name: string
  description: string | null
  archived: boolean
  myRole: ProjectRole
  memberCount: number
  updatedAt: string
}

export interface Project {
  id: string
  key: string
  name: string
  description: string | null
  archived: boolean
  owner: UserRef
  myRole: ProjectRole
  memberCount: number
  createdAt: string
  updatedAt: string
  /** Para detectar si otra persona guardó cambios antes (409 `concurrency.conflict`). */
  version: number
}

export interface Member {
  user: UserRef
  role: ProjectRole
  joinedAt: string
}

export interface CreateProjectInput {
  key: string
  name: string
  description: string | null
}

export interface UpdateProjectInput {
  name: string
  description: string | null
  version: number
}

const base = '/api/v1/projects'

export async function listProjects(archived = false): Promise<ProjectSummary[]> {
  const { data } = await http.get<ProjectSummary[]>(base, { params: { archived } })
  return data
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const { data } = await http.post<Project>(base, input)
  return data
}

export async function getProject(id: string): Promise<Project> {
  const { data } = await http.get<Project>(`${base}/${id}`)
  return data
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project> {
  const { data } = await http.put<Project>(`${base}/${id}`, input)
  return data
}

export async function archiveProject(id: string): Promise<Project> {
  const { data } = await http.patch<Project>(`${base}/${id}/archive`)
  return data
}

export async function restoreProject(id: string): Promise<Project> {
  const { data } = await http.patch<Project>(`${base}/${id}/restore`)
  return data
}

export async function transferOwnership(id: string, userId: string): Promise<Project> {
  const { data } = await http.post<Project>(`${base}/${id}/ownership`, { userId })
  return data
}

export async function deleteProject(id: string): Promise<void> {
  await http.delete(`${base}/${id}`)
}

export async function listMembers(projectId: string): Promise<Member[]> {
  const { data } = await http.get<Member[]>(`${base}/${projectId}/members`)
  return data
}

export async function addMember(
  projectId: string,
  userId: string,
  role: ProjectRole,
): Promise<Member> {
  const { data } = await http.post<Member>(`${base}/${projectId}/members`, { userId, role })
  return data
}

export async function changeMemberRole(
  projectId: string,
  userId: string,
  role: ProjectRole,
): Promise<Member> {
  const { data } = await http.patch<Member>(`${base}/${projectId}/members/${userId}`, { role })
  return data
}

/** También sirve para salir del proyecto (con el ID propio). */
export async function removeMember(projectId: string, userId: string): Promise<void> {
  await http.delete(`${base}/${projectId}/members/${userId}`)
}

/** Usuarios activos por nombre o inicio del correo (mínimo 2 caracteres, hasta 10 resultados). */
export async function searchUsers(search: string): Promise<UserRef[]> {
  const { data } = await http.get<UserRef[]>('/api/v1/users', { params: { search } })
  return data
}
