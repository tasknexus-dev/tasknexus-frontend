<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { toProblem, type Problem } from '@/shared/api/problem'
import ProblemAlert from '@/shared/ui/ProblemAlert.vue'

import { listProjects, type Project, type ProjectSummary } from '../api'
import CreateProjectForm from '../components/CreateProjectForm.vue'
import RoleBadge from '../components/RoleBadge.vue'

const router = useRouter()

const showArchived = ref(false)
const creating = ref(false)
const projects = ref<ProjectSummary[]>([])
const loading = ref(true)
const problem = ref<Problem | null>(null)

async function load() {
  loading.value = true
  problem.value = null
  try {
    projects.value = await listProjects(showArchived.value)
  } catch (error) {
    problem.value = toProblem(error)
  } finally {
    loading.value = false
  }
}

watch(showArchived, load, { immediate: true })

function onCreated(project: Project) {
  creating.value = false
  void router.push({ name: 'project', params: { id: project.id } })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Proyectos</h1>
        <p class="mt-1 text-sm text-slate-600">Los proyectos de los que formas parte.</p>
      </div>
      <button
        v-if="!creating"
        type="button"
        class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        data-testid="new-project"
        @click="creating = true"
      >
        Nuevo proyecto
      </button>
    </div>

    <CreateProjectForm v-if="creating" @created="onCreated" @cancel="creating = false" />

    <div
      class="flex gap-1 rounded-lg bg-slate-200/60 p-1 text-sm font-medium sm:w-fit"
      role="tablist"
    >
      <button
        v-for="option in [
          { archived: false, label: 'Activos' },
          { archived: true, label: 'Archivados' },
        ]"
        :key="option.label"
        type="button"
        role="tab"
        :aria-selected="showArchived === option.archived"
        class="flex-1 rounded-md px-4 py-1.5"
        :class="
          showArchived === option.archived
            ? 'bg-white shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        "
        @click="showArchived = option.archived"
      >
        {{ option.label }}
      </button>
    </div>

    <ProblemAlert :problem="problem" />

    <p v-if="loading" class="text-sm text-slate-500">Cargando proyectos…</p>
    <div
      v-else-if="!problem && projects.length === 0"
      class="rounded-xl border border-dashed border-slate-300 p-10 text-center"
      data-testid="empty-projects"
    >
      <p class="font-medium">
        {{ showArchived ? 'No hay proyectos archivados.' : 'Aún no tienes proyectos.' }}
      </p>
      <p v-if="!showArchived" class="mt-1 text-sm text-slate-600">
        Crea uno o pide que te añadan a un proyecto existente.
      </p>
    </div>
    <ul v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="project-list">
      <li v-for="project in projects" :key="project.id">
        <RouterLink
          :to="{ name: 'project', params: { id: project.id } }"
          class="flex h-full flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow"
        >
          <div class="flex items-start justify-between gap-2">
            <span
              class="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700"
            >
              {{ project.key }}
            </span>
            <RoleBadge :role="project.myRole" />
          </div>
          <div class="min-w-0 flex-1">
            <h2 class="truncate font-semibold">{{ project.name }}</h2>
            <p v-if="project.description" class="mt-1 line-clamp-2 text-sm text-slate-600">
              {{ project.description }}
            </p>
          </div>
          <p class="text-xs text-slate-500">
            {{ project.memberCount }} {{ project.memberCount === 1 ? 'miembro' : 'miembros' }}
          </p>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
