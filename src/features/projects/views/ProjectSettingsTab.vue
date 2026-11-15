<script setup lang="ts">
import { watch } from 'vue'
import { useRouter } from 'vue-router'

import type { Project } from '../api'
import ProjectSettings from '../components/ProjectSettings.vue'
import { useCurrentProject, useProjectContext } from '../context'
import { canManageProject } from '../permissions'

const router = useRouter()
const { members, reload, replaceProject } = useProjectContext()
const project = useCurrentProject()

// Si deja de ser propietario (p. ej. al transferir la propiedad), los ajustes ya no son para él.
watch(
  () => project.value.myRole,
  (role) => {
    if (!canManageProject(role)) {
      void router.replace({ name: 'members', params: { id: project.value.id } })
    }
  },
  { immediate: true },
)

function onUpdated(updated: Project) {
  replaceProject(updated)
  // La transferencia de propiedad cambia roles: se recargan también los miembros.
  void reload()
}
</script>

<template>
  <ProjectSettings
    :project="project"
    :members="members"
    @updated="onUpdated"
    @deleted="router.push({ name: 'projects' })"
  />
</template>
