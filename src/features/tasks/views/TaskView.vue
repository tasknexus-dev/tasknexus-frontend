<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { useCurrentProject, useProjectContext } from '@/features/projects/context'
import { toProblem, type Problem } from '@/shared/api/problem'
import ProblemAlert from '@/shared/ui/ProblemAlert.vue'
import UserAvatar from '@/shared/ui/UserAvatar.vue'

import {
  deleteTask,
  getTask,
  moveTask,
  updateTask,
  type TaskDetails,
  type TaskInput,
  type TaskStatus,
} from '../api'
import DueDate from '../components/DueDate.vue'
import PriorityBadge from '../components/PriorityBadge.vue'
import TaskForm from '../components/TaskForm.vue'
import { formatDateTime, STATUS_LABELS, STATUSES } from '../labels'

/** Detalle de una tarea: ver, editar, cambiar de estado y borrar. */
const props = defineProps<{ taskId: string }>()

const router = useRouter()
const project = useCurrentProject()
const { members } = useProjectContext()

const task = ref<TaskDetails | null>(null)
const loading = ref(true)
const problem = ref<Problem | null>(null)
const editing = ref(false)
const busy = ref(false)
const confirmingDelete = ref(false)

const initial = computed<Partial<TaskInput> | undefined>(() =>
  task.value
    ? {
        title: task.value.title,
        description: task.value.description,
        priority: task.value.priority,
        dueDate: task.value.dueDate,
        assigneeId: task.value.assignee?.id ?? null,
      }
    : undefined,
)

async function load() {
  loading.value = true
  problem.value = null
  try {
    task.value = await getTask(props.taskId)
  } catch (error) {
    task.value = null
    problem.value = toProblem(error)
  } finally {
    loading.value = false
  }
}

watch(() => props.taskId, load, { immediate: true })

async function run(action: () => Promise<void>) {
  busy.value = true
  problem.value = null
  try {
    await action()
  } catch (error) {
    problem.value = toProblem(error)
  } finally {
    busy.value = false
  }
}

function save(input: TaskInput) {
  const current = task.value
  if (!current) return
  void run(async () => {
    task.value = await updateTask(current.id, { ...input, version: current.version })
    editing.value = false
  })
}

/** Cambiar de estado aquí la deja al final de la nueva columna. */
function changeStatus(status: TaskStatus) {
  const current = task.value
  if (!current || status === current.status) return
  void run(async () => {
    await moveTask(current.id, {
      status,
      previousTaskId: null,
      nextTaskId: null,
      version: current.version,
    })
    task.value = await getTask(current.id)
  })
}

function remove() {
  const current = task.value
  if (!current) return
  void run(async () => {
    await deleteTask(current.id)
    await router.push({ name: 'board', params: { id: project.value.id } })
  })
}
</script>

<template>
  <div class="space-y-4">
    <RouterLink
      :to="{ name: 'board', params: { id: project.id } }"
      class="text-sm text-indigo-600 hover:underline"
    >
      ← Volver al tablero
    </RouterLink>

    <p v-if="loading" class="text-sm text-slate-500">Cargando tarea…</p>
    <div
      v-else-if="problem?.status === 404 && !task"
      class="rounded-xl border border-dashed border-slate-300 p-10 text-center"
      data-testid="task-not-found"
    >
      Esta tarea no existe o se ha borrado.
    </div>
    <ProblemAlert v-else-if="!task" :problem="problem" />

    <div v-else class="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <article class="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <ProblemAlert :problem="problem" />
        <div v-if="!editing" class="space-y-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="font-mono text-sm text-slate-500">{{ task.key }}</p>
              <h2 class="text-xl font-semibold" data-testid="task-title">{{ task.title }}</h2>
            </div>
            <button
              v-if="task.canEdit"
              type="button"
              class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
              data-testid="edit-task"
              @click="editing = true"
            >
              Editar
            </button>
          </div>
          <p
            v-if="task.description"
            class="whitespace-pre-line text-sm text-slate-700"
            data-testid="task-description"
          >
            {{ task.description }}
          </p>
          <p v-else class="text-sm text-slate-400 italic">Sin descripción.</p>
        </div>
        <TaskForm
          v-else
          :initial="initial"
          :members="members"
          :problem="problem"
          :submitting="busy"
          submit-label="Guardar cambios"
          @submit="save"
          @cancel="editing = false"
        />
      </article>

      <aside class="space-y-4 rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
        <div>
          <p class="text-xs font-medium tracking-wide text-slate-500 uppercase">Estado</p>
          <select
            v-if="task.canEdit"
            :value="task.status"
            aria-label="Estado"
            class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5"
            :disabled="busy"
            data-testid="task-status"
            @change="changeStatus(($event.target as HTMLSelectElement).value as TaskStatus)"
          >
            <option v-for="status in STATUSES" :key="status" :value="status">
              {{ STATUS_LABELS[status] }}
            </option>
          </select>
          <p v-else class="mt-1">{{ STATUS_LABELS[task.status] }}</p>
        </div>
        <div>
          <p class="text-xs font-medium tracking-wide text-slate-500 uppercase">Prioridad</p>
          <p class="mt-1"><PriorityBadge :priority="task.priority" /></p>
        </div>
        <div>
          <p class="text-xs font-medium tracking-wide text-slate-500 uppercase">Responsable</p>
          <p v-if="task.assignee" class="mt-1 flex items-center gap-2">
            <UserAvatar :name="task.assignee.name" size="sm" /> {{ task.assignee.name }}
          </p>
          <p v-else class="mt-1 text-slate-400">Sin asignar</p>
        </div>
        <div>
          <p class="text-xs font-medium tracking-wide text-slate-500 uppercase">Fecha límite</p>
          <p class="mt-1">
            <DueDate v-if="task.dueDate" :due-date="task.dueDate" :status="task.status" />
            <span v-else class="text-slate-400">Sin fecha</span>
          </p>
        </div>
        <dl class="space-y-1 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <div>
            <dt class="mr-1 inline">Creada por</dt>
            <dd class="inline">{{ task.reporter.name }} · {{ formatDateTime(task.createdAt) }}</dd>
          </div>
          <div>
            <dt class="mr-1 inline">Actualizada</dt>
            <dd class="inline">{{ formatDateTime(task.updatedAt) }}</dd>
          </div>
          <div v-if="task.completedAt">
            <dt class="mr-1 inline">Finalizada</dt>
            <dd class="inline">{{ formatDateTime(task.completedAt) }}</dd>
          </div>
        </dl>
        <div v-if="task.canDelete" class="border-t border-slate-100 pt-4">
          <div v-if="confirmingDelete" class="space-y-2">
            <p>¿Borrar esta tarea? No se puede deshacer.</p>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
                :disabled="busy"
                data-testid="confirm-delete-task"
                @click="remove"
              >
                Sí, borrar
              </button>
              <button
                type="button"
                class="rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-100"
                @click="confirmingDelete = false"
              >
                No
              </button>
            </div>
          </div>
          <button
            v-else
            type="button"
            class="font-medium text-rose-600 hover:underline"
            data-testid="delete-task"
            @click="confirmingDelete = true"
          >
            Borrar tarea
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>
