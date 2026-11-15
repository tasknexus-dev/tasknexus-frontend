<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { useSessionStore } from '@/features/auth/stores/session'
import { toProblem, type Problem } from '@/shared/api/problem'
import ProblemAlert from '@/shared/ui/ProblemAlert.vue'

import { getProject, listMembers, type Member, type Project } from '../api'
import MembersPanel from '../components/MembersPanel.vue'
import ProjectSettings from '../components/ProjectSettings.vue'
import RoleBadge from '../components/RoleBadge.vue'
import { canManageProject } from '../permissions'

const props = defineProps<{ id: string }>()

const router = useRouter()
const session = useSessionStore()

const project = ref<Project | null>(null)
const members = ref<Member[]>([])
const loading = ref(true)
const problem = ref<Problem | null>(null)
const tab = ref<'members' | 'settings'>('members')

const isOwner = computed(() => project.value !== null && canManageProject(project.value.myRole))

async function load() {
  problem.value = null
  try {
    const [loadedProject, loadedMembers] = await Promise.all([
      getProject(props.id),
      listMembers(props.id),
    ])
    project.value = loadedProject
    members.value = loadedMembers
    if (!canManageProject(loadedProject.myRole)) tab.value = 'members'
  } catch (error) {
    project.value = null
    problem.value = toProblem(error)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.id,
  () => {
    loading.value = true
    tab.value = 'members'
    void load()
  },
  { immediate: true },
)

function onUpdated(updated: Project) {
  project.value = updated
  // Transferir la propiedad cambia los roles: se recargan también los miembros.
  void load()
}

function goToList() {
  void router.push({ name: 'projects' })
}
</script>

<template>
  <div class="space-y-6">
    <RouterLink :to="{ name: 'projects' }" class="text-sm text-indigo-600 hover:underline">
      ← Proyectos
    </RouterLink>

    <p v-if="loading" class="text-sm text-slate-500">Cargando proyecto…</p>

    <div
      v-else-if="problem?.status === 404"
      class="rounded-xl border border-dashed border-slate-300 p-10 text-center"
      data-testid="project-not-found"
    >
      <p class="font-medium">Este proyecto no existe o no tienes acceso.</p>
    </div>
    <ProblemAlert v-else-if="!project" :problem="problem" />

    <template v-else>
      <header class="space-y-2">
        <div class="flex flex-wrap items-center gap-2">
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
        <p class="text-sm text-slate-500">Propietario: {{ project.owner.name }}</p>
      </header>

      <ProblemAlert :problem="problem" />

      <nav
        v-if="isOwner"
        class="flex gap-4 border-b border-slate-200 text-sm font-medium"
        role="tablist"
      >
        <button
          v-for="option in [
            { value: 'members', label: 'Miembros' },
            { value: 'settings', label: 'Ajustes' },
          ] as const"
          :key="option.value"
          type="button"
          role="tab"
          :aria-selected="tab === option.value"
          class="-mb-px border-b-2 px-1 pb-2"
          :class="
            tab === option.value
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          "
          @click="tab = option.value"
        >
          {{ option.label }}
        </button>
      </nav>

      <MembersPanel
        v-if="tab === 'members'"
        :project="project"
        :members="members"
        :current-user-id="session.user?.id ?? ''"
        @changed="load"
        @left="goToList"
      />
      <ProjectSettings
        v-else
        :project="project"
        :members="members"
        @updated="onUpdated"
        @deleted="goToList"
      />
    </template>
  </div>
</template>
