import { computed, inject, type ComputedRef, type InjectionKey, type Ref } from 'vue'

import type { Member, Project } from './api'

/**
 * Proyecto abierto, compartido por la página del proyecto con sus pestañas (tablero, lista, tarea,
 * miembros, ajustes) para no cargarlo en cada una.
 */
export interface ProjectContext {
  project: Ref<Project | null>
  members: Ref<Member[]>
  /** Vuelve a leer proyecto y miembros (p. ej. tras cambiar roles o la propiedad). */
  reload: () => Promise<void>
  /** Sustituye el proyecto por la respuesta de una operación (sin volver a pedirlo). */
  replaceProject: (project: Project) => void
}

export const projectContextKey: InjectionKey<ProjectContext> = Symbol('project-context')

export function useProjectContext(): ProjectContext {
  const context = inject(projectContextKey)
  if (!context) {
    throw new Error('useProjectContext solo funciona dentro de la página de un proyecto')
  }
  return context
}

/** Las pestañas solo se muestran con el proyecto ya cargado. */
export function useCurrentProject(): ComputedRef<Project> {
  const { project } = useProjectContext()
  return computed(() => {
    if (!project.value) throw new Error('El proyecto aún no se ha cargado')
    return project.value
  })
}
