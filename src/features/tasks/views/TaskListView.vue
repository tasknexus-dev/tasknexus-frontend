<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter, type LocationQuery } from 'vue-router'

import { useCurrentProject, useProjectContext } from '@/features/projects/context'
import { toProblem, type Problem } from '@/shared/api/problem'
import ProblemAlert from '@/shared/ui/ProblemAlert.vue'
import UserAvatar from '@/shared/ui/UserAvatar.vue'

import {
  createTask,
  listTasks,
  type Page,
  type TaskInput,
  type TaskPriority,
  type TaskQuery,
  type TaskStatus,
  type TaskSummary,
} from '../api'
import DueDate from '../components/DueDate.vue'
import PriorityBadge from '../components/PriorityBadge.vue'
import TaskForm from '../components/TaskForm.vue'
import { PRIORITIES, PRIORITY_LABELS, STATUS_LABELS, STATUSES } from '../labels'

/** Listado con filtros, búsqueda, orden y paginación. Los filtros viven en la URL (se pueden compartir). */
const route = useRoute()
const router = useRouter()
const project = useCurrentProject()
const { members } = useProjectContext()

const PAGE_SIZE = 20
const SORTS = [
  { value: 'updatedAt,desc', label: 'Actualizadas recientemente' },
  { value: 'createdAt,desc', label: 'Más recientes' },
  { value: 'priority,desc', label: 'Prioridad' },
  { value: 'dueDate,asc', label: 'Fecha límite' },
  { value: 'number,asc', label: 'Número' },
  { value: 'title,asc', label: 'Título' },
]

const result = ref<Page<TaskSummary> | null>(null)
const loading = ref(true)
const problem = ref<Problem | null>(null)
const creating = ref(false)
const createProblem = ref<Problem | null>(null)
const submitting = ref(false)
const search = ref('')

const canEdit = computed(() => !project.value.archived && project.value.myRole !== 'VIEWER')

function text(query: LocationQuery, key: string): string {
  const value = query[key]
  return typeof value === 'string' ? value : ''
}

/** Filtros actuales leídos de la URL. */
const filters = computed(() => ({
  status: text(route.query, 'status') as TaskStatus | '',
  priority: text(route.query, 'priority') as TaskPriority | '',
  assignee: text(route.query, 'assignee'),
  q: text(route.query, 'q'),
  sort: text(route.query, 'sort') || 'updatedAt,desc',
  page: Math.max(Number(text(route.query, 'page')) || 1, 1),
}))

function update(changes: Record<string, string | number>) {
  const query: Record<string, string> = {}
  const merged = { ...filters.value, page: 1, ...changes }
  for (const [key, value] of Object.entries(merged)) {
    const isDefault =
      value === '' ||
      (key === 'page' && value === 1) ||
      (key === 'sort' && value === 'updatedAt,desc')
    if (!isDefault) query[key] = String(value)
  }
  void router.replace({ query })
}

async function load() {
  loading.value = true
  problem.value = null
  const current = filters.value
  const query: TaskQuery = {
    page: current.page - 1,
    size: PAGE_SIZE,
    sort: current.sort,
    status: current.status ? [current.status] : undefined,
    priority: current.priority ? [current.priority] : undefined,
    assignee: current.assignee || undefined,
    q: current.q || undefined,
  }
  try {
    result.value = await listTasks(project.value.id, query)
  } catch (error) {
    problem.value = toProblem(error)
  } finally {
    loading.value = false
  }
}

watch(
  () => [project.value.id, route.query] as const,
  () => {
    search.value = filters.value.q
    void load()
  },
  { immediate: true, deep: true },
)

let timer: ReturnType<typeof setTimeout> | undefined
function onSearch(value: string) {
  search.value = value
  clearTimeout(timer)
  timer = setTimeout(() => update({ q: value.trim() }), 300)
}
onBeforeUnmount(() => clearTimeout(timer))

async function create(input: TaskInput) {
  submitting.value = true
  createProblem.value = null
  try {
    const task = await createTask(project.value.id, input)
    creating.value = false
    await router.push({ name: 'task', params: { id: project.value.id, taskId: task.id } })
  } catch (error) {
    createProblem.value = toProblem(error)
  } finally {
    submitting.value = false
  }
}

const selectClass = 'rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm'
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-end gap-2" data-testid="task-filters">
      <input
        :value="search"
        type="search"
        placeholder="Buscar por título o código (TN-42)"
        aria-label="Buscar tareas"
        class="min-w-48 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
        data-testid="task-search"
        @input="onSearch(($event.target as HTMLInputElement).value)"
      />
      <select
        :value="filters.status"
        aria-label="Estado"
        :class="selectClass"
        data-testid="filter-status"
        @change="update({ status: ($event.target as HTMLSelectElement).value })"
      >
        <option value="">Todos los estados</option>
        <option v-for="status in STATUSES" :key="status" :value="status">
          {{ STATUS_LABELS[status] }}
        </option>
      </select>
      <select
        :value="filters.priority"
        aria-label="Prioridad"
        :class="selectClass"
        data-testid="filter-priority"
        @change="update({ priority: ($event.target as HTMLSelectElement).value })"
      >
        <option value="">Todas las prioridades</option>
        <option v-for="priority in [...PRIORITIES].reverse()" :key="priority" :value="priority">
          {{ PRIORITY_LABELS[priority] }}
        </option>
      </select>
      <select
        :value="filters.assignee"
        aria-label="Responsable"
        :class="selectClass"
        data-testid="filter-assignee"
        @change="update({ assignee: ($event.target as HTMLSelectElement).value })"
      >
        <option value="">Cualquier responsable</option>
        <option value="me">Asignadas a mí</option>
        <option value="none">Sin asignar</option>
        <option v-for="member in members" :key="member.user.id" :value="member.user.id">
          {{ member.user.name }}
        </option>
      </select>
      <select
        :value="filters.sort"
        aria-label="Ordenar"
        :class="selectClass"
        data-testid="sort"
        @change="update({ sort: ($event.target as HTMLSelectElement).value })"
      >
        <option v-for="sort in SORTS" :key="sort.value" :value="sort.value">
          {{ sort.label }}
        </option>
      </select>
      <button
        v-if="canEdit && !creating"
        type="button"
        class="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        data-testid="new-task"
        @click="creating = true"
      >
        Nueva tarea
      </button>
    </div>

    <div v-if="creating" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 class="mb-4 text-lg font-semibold">Nueva tarea</h2>
      <ProblemAlert :problem="createProblem" class="mb-4" />
      <TaskForm
        :members="members"
        :problem="createProblem"
        :submitting="submitting"
        submit-label="Crear tarea"
        @submit="create"
        @cancel="creating = false"
      />
    </div>

    <ProblemAlert :problem="problem" />

    <p v-if="loading && !result" class="text-sm text-slate-500">Cargando tareas…</p>
    <div
      v-else-if="result && result.items.length === 0"
      class="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-600"
      data-testid="empty-tasks"
    >
      No hay tareas que coincidan con los filtros.
    </div>
    <template v-else-if="result">
      <ul
        class="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white"
        :class="loading ? 'opacity-60' : ''"
        data-testid="task-list"
      >
        <li v-for="task in result.items" :key="task.id">
          <RouterLink
            :to="{ name: 'task', params: { id: project.id, taskId: task.id } }"
            class="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-slate-50"
          >
            <span class="w-20 shrink-0 font-mono text-xs text-slate-500">{{ task.key }}</span>
            <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ task.title }}</span>
            <span class="text-xs text-slate-600">{{ STATUS_LABELS[task.status] }}</span>
            <PriorityBadge :priority="task.priority" />
            <DueDate v-if="task.dueDate" :due-date="task.dueDate" :status="task.status" />
            <UserAvatar v-if="task.assignee" :name="task.assignee.name" size="sm" />
          </RouterLink>
        </li>
      </ul>
      <nav
        class="flex items-center justify-between text-sm text-slate-600"
        aria-label="Paginación"
        data-testid="pagination"
      >
        <span>
          {{ result.totalItems }} {{ result.totalItems === 1 ? 'tarea' : 'tareas' }} · página
          {{ result.page + 1 }} de {{ Math.max(result.totalPages, 1) }}
        </span>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-lg border border-slate-300 px-3 py-1 hover:bg-slate-100 disabled:opacity-40"
            :disabled="result.page === 0"
            @click="update({ page: result.page })"
          >
            Anterior
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-300 px-3 py-1 hover:bg-slate-100 disabled:opacity-40"
            :disabled="result.page + 1 >= result.totalPages"
            @click="update({ page: result.page + 2 })"
          >
            Siguiente
          </button>
        </div>
      </nav>
    </template>
  </div>
</template>
