<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'

import { useCurrentProject } from '@/features/projects/context'
import { createTask, getBoard, moveTask, type TaskStatus } from '@/features/tasks/api'
import { STATUS_LABELS, STATUSES } from '@/features/tasks/labels'
import { toProblem, type Problem } from '@/shared/api/problem'
import ProblemAlert from '@/shared/ui/ProblemAlert.vue'

import {
  emptyColumns,
  locate,
  neighboursAt,
  replaceCard,
  snapshot,
  toColumns,
  type Columns,
} from '../boardModel'
import TaskCard from '../components/TaskCard.vue'

/**
 * Tablero Kanban. Al soltar una tarjeta se mueve al instante (actualización optimista) y se avisa
 * al servidor; si lo rechaza (p. ej. 409 porque otra persona la movió antes), vuelve a su sitio.
 */
const project = useCurrentProject()

const columns = ref<Columns>(emptyColumns())
const loading = ref(true)
const problem = ref<Problem | null>(null)
const saving = ref(false)
const newTitle = ref('')
const creating = ref(false)

let before: Columns | null = null

const canEdit = computed(() => !project.value.archived && project.value.myRole !== 'VIEWER')

async function load() {
  try {
    columns.value = toColumns(await getBoard(project.value.id))
  } catch (error) {
    problem.value = toProblem(error)
  } finally {
    loading.value = false
  }
}

watch(() => project.value.id, load, { immediate: true })

function onStart() {
  before = snapshot(columns.value)
}

async function onEnd(event: { item: HTMLElement }) {
  const id = event.item.dataset.id
  const previous = before
  before = null
  // vue-draggable-plus actualiza las listas al soltar: se espera a que estén al día.
  await nextTick()
  if (!id || !previous) return
  const from = locate(previous, id)
  const to = locate(columns.value, id)
  if (!from || !to || (from.status === to.status && from.index === to.index)) return

  const task = previous[from.status][from.index]!
  problem.value = null
  saving.value = true
  try {
    const moved = await moveTask(id, {
      status: to.status,
      ...neighboursAt(columns.value[to.status], to.index),
      version: task.version,
    })
    replaceCard(columns.value, moved)
  } catch (error) {
    columns.value = previous
    problem.value = toProblem(error)
    if (problem.value.status === 409) await load()
  } finally {
    saving.value = false
  }
}

async function addTask() {
  const title = newTitle.value.trim()
  if (!title) return
  creating.value = true
  problem.value = null
  try {
    await createTask(project.value.id, {
      title,
      description: null,
      priority: 'MEDIUM',
      dueDate: null,
      assigneeId: null,
    })
    newTitle.value = ''
    await load()
  } catch (error) {
    problem.value = toProblem(error)
  } finally {
    creating.value = false
  }
}

const columnStyles: Record<TaskStatus, string> = {
  TODO: 'bg-slate-400',
  IN_PROGRESS: 'bg-sky-500',
  IN_REVIEW: 'bg-amber-500',
  DONE: 'bg-emerald-500',
}
</script>

<template>
  <div class="space-y-4">
    <ProblemAlert :problem="problem" />
    <p v-if="!canEdit && !loading" class="text-sm text-slate-500" data-testid="read-only-board">
      {{
        project.archived
          ? 'El proyecto está archivado: el tablero es de solo lectura.'
          : 'Como observador puedes ver el tablero, pero no mover tarjetas.'
      }}
    </p>
    <p v-if="loading" class="text-sm text-slate-500">Cargando tablero…</p>

    <div
      v-else
      class="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 lg:grid lg:grid-cols-4 lg:overflow-visible"
      :aria-busy="saving"
      data-testid="board"
    >
      <section
        v-for="status in STATUSES"
        :key="status"
        class="flex w-72 shrink-0 snap-start flex-col rounded-xl bg-slate-100 p-3 lg:w-auto"
        :aria-label="STATUS_LABELS[status]"
        :data-testid="`column-${status}`"
      >
        <h2 class="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          <span class="size-2 rounded-full" :class="columnStyles[status]" aria-hidden="true" />
          {{ STATUS_LABELS[status] }}
          <span class="ml-auto rounded-full bg-white px-2 text-xs font-medium text-slate-500">
            {{ columns[status].length }}
          </span>
        </h2>

        <VueDraggable
          v-model="columns[status]"
          group="tasks"
          :animation="150"
          :disabled="!canEdit || saving"
          ghost-class="opacity-40"
          class="flex min-h-24 flex-1 flex-col gap-2"
          :data-status="status"
          @start="onStart"
          @end="onEnd"
        >
          <div v-for="task in columns[status]" :key="task.id" :data-id="task.id">
            <TaskCard :task="task" :draggable="canEdit" />
          </div>
        </VueDraggable>

        <form
          v-if="status === 'TODO' && canEdit"
          class="mt-3 flex gap-2"
          data-testid="quick-add"
          @submit.prevent="addTask"
        >
          <input
            v-model="newTitle"
            type="text"
            maxlength="200"
            placeholder="Nueva tarea…"
            aria-label="Título de la nueva tarea"
            class="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <button
            type="submit"
            class="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            :disabled="creating || !newTitle.trim()"
          >
            Añadir
          </button>
        </form>
      </section>
    </div>
  </div>
</template>
