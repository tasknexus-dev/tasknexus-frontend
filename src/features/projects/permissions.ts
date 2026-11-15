import type { ProjectRole } from './api'

/**
 * Copia en el cliente de la matriz de permisos del backend (`ProjectRole.java`). Solo decide qué
 * botones se muestran: quien manda es siempre el backend, que responde 403 si no hay permiso.
 */
export const ROLE_LABELS: Record<ProjectRole, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  MEMBER: 'Miembro',
  VIEWER: 'Observador',
}

export const ROLE_DESCRIPTIONS: Record<ProjectRole, string> = {
  OWNER: 'Control total del proyecto',
  ADMIN: 'Gestiona miembros y tareas',
  MEMBER: 'Crea y edita tareas',
  VIEWER: 'Solo lectura',
}

export function canManageMembers(role: ProjectRole): boolean {
  return role === 'OWNER' || role === 'ADMIN'
}

export function canManageProject(role: ProjectRole): boolean {
  return role === 'OWNER'
}

/** Si `actor` puede dar, cambiar o quitar el rol `target` a otro miembro. */
export function canAssign(actor: ProjectRole, target: ProjectRole): boolean {
  switch (actor) {
    case 'OWNER':
      return target !== 'OWNER'
    case 'ADMIN':
      return target === 'MEMBER' || target === 'VIEWER'
    default:
      return false
  }
}

/** Roles que `actor` puede asignar, de más a menos permisos. */
export function assignableRoles(actor: ProjectRole): ProjectRole[] {
  return (['ADMIN', 'MEMBER', 'VIEWER'] as const).filter((role) => canAssign(actor, role))
}
