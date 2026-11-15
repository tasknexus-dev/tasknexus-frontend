<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue'
import { RouterLink, RouterView } from 'vue-router'

import { toProblem, type Problem } from '@/shared/api/problem'
import ProblemAlert from '@/shared/ui/ProblemAlert.vue'

import { getProject, listMembers, type Member, type Project } from '../api'
import RoleBadge from '../components/RoleBadge.vue'
import { projectContextKey } from '../context'
import { canManageProject } from '../permissions'

/** Página de un proyecto: cabecera y pestañas (tablero, lista, actividad, miembros, ajustes). */
const props = defineProps<{ id: string }>()

const project = ref<Project | null>(null)
const members = ref<Member[]>([])
const loading = ref(true)
const problem = ref<Problem | null>(null)

const tabs = computed(() => [
  { name: 'board', label: 'Tablero' },
  { name: 'tasks', label: 'Lista' },
  { name: 'activity', label: 'Actividad' },
  { name: 'members', label: 'Miembros' },
  ...(project.value && canManageProject(project.value.myRole)
    ? [{ name: 'settings', label: 'Ajustes' }]
    : []),
])

async function reload() {
  problem.value = null
  try {
    const [loadedProject, loadedMembers] = await Promise.all([
      getProject(props.id),
      listMembers(props.id),
    ])
    project.value = loadedProject
    members.value = loadedMembers
  } catch (error) {
    project.value = null
    problem.value = toProblem(error)
  } finally {
    loading.value = false
  }
}

provide(projectContextKey, {
  project,
  members,
  reload,
  replaceProject: (updated) => {
    project.value = updated
  },
})

watch(
  () => props.id,
  () => {
    loading.value = true
    project.value = null
    void reload()
  },
  { immediate: true },
)
</script>

<template>
  <div class="space-y-6">
    <p v-if="loading" class="text-sm text-slate-500">Cargando proyecto…</p>

    <div
      v-else-if="problem?.status === 404"
      class="rounded-xl border border-dashed border-slate-300 p-10 text-center"
      data-testid="project-not-found"
    >
      <p class="font-medium">Este proyecto no existe o no tienes acceso.</p>
      <RouterLink :to="{ name: 'projects' }" class="mt-2 inline-block text-sm text-indigo-600">
        Volver a mis proyectos
      </RouterLink>
    </div>
    <ProblemAlert v-else-if="!project" :problem="problem" />

    <template v-else>
      <header class="space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <RouterLink :to="{ name: 'projects' }" class="text-sm text-indigo-600 hover:underline">
            Proyectos
          </RouterLink>
          <span class="text-slate-400" aria-hidden="true">/</span>
          <span
            class="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700"
          >
            {{ project.key }}
          </span>
          <RoleBadge :role="project.myRole" />
          <span
            v-if="project.archived"
            class="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200 ring-inset"
            data-testid="archived-badge"
          >
            Archivado · solo lectura
          </span>
        </div>
        <h1 class="text-2xl font-bold tracking-tight" data-testid="project-name">
          {{ project.name }}
        </h1>
        <p v-if="project.description" class="max-w-3xl whitespace-pre-line text-slate-600">
          {{ project.description }}
        </p>
      </header>

      <nav class="flex gap-5 overflow-x-auto border-b border-slate-200 text-sm font-medium">
        <RouterLink
          v-for="tab in tabs"
          :key="tab.name"
          :to="{ name: tab.name, params: { id: project.id } }"
          class="-mb-px border-b-2 border-transparent px-1 pb-2 whitespace-nowrap text-slate-600 hover:text-slate-900"
          active-class="!border-indigo-600 !text-indigo-700"
        >
          {{ tab.label }}
        </RouterLink>
      </nav>

      <RouterView />
    </template>
  </div>
</template>
