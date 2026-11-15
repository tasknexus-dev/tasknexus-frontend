<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import { formatDateTime } from '@/features/tasks/labels'
import { toProblem, type Problem } from '@/shared/api/problem'
import ProblemAlert from '@/shared/ui/ProblemAlert.vue'
import UserAvatar from '@/shared/ui/UserAvatar.vue'

import { getActivity, type ActivityEntry } from '../api'
import { describe, relativeTime, taskLabel } from '../describe'

/**
 * Historial de un proyecto o, con `taskId`, de una tarea. Carga páginas de 30 entradas con
 * «Ver más». Los cambios se registran en segundo plano, así que lo más reciente puede tardar un
 * instante en aparecer.
 */
const props = defineProps<{ projectId: string; taskId?: string; compact?: boolean }>()

const PAGE_SIZE = 30

const entries = ref<ActivityEntry[]>([])
const page = ref(0)
const hasMore = ref(false)
const loading = ref(true)
const problem = ref<Problem | null>(null)

async function load(reset: boolean) {
  loading.value = true
  problem.value = null
  const next = reset ? 0 : page.value + 1
  try {
    const result = await getActivity(props.projectId, {
      taskId: props.taskId,
      page: next,
      size: PAGE_SIZE,
    })
    entries.value = reset ? result.items : [...entries.value, ...result.items]
    page.value = next
    hasMore.value = next + 1 < result.totalPages
  } catch (error) {
    problem.value = toProblem(error)
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.projectId, props.taskId],
  () => load(true),
  { immediate: true },
)

defineExpose({ reload: () => load(true) })
</script>

<template>
  <section class="space-y-3" data-testid="activity-feed">
    <ProblemAlert :problem="problem" />
    <p v-if="loading && entries.length === 0" class="text-sm text-slate-500">Cargando actividad…</p>
    <p
      v-else-if="entries.length === 0 && !problem"
      class="text-sm text-slate-400 italic"
      data-testid="no-activity"
    >
      Todavía no hay actividad.
    </p>

    <ol v-else :class="compact ? 'space-y-2' : 'space-y-3'">
      <li
        v-for="entry in entries"
        :key="entry.id"
        class="flex items-start gap-3 text-sm"
        data-testid="activity-entry"
      >
        <UserAvatar :name="entry.actor.name" :size="compact ? 'sm' : 'md'" />
        <p class="min-w-0 flex-1 text-slate-700">
          <span class="font-semibold text-slate-900">{{ entry.actor.name }}</span>
          {{ ' ' + describe(entry).before }}
          <template v-if="entry.task && !compact">
            {{ ' ' }}
            <RouterLink
              v-if="entry.task.key && entry.action !== 'TASK_DELETED'"
              :to="{ name: 'task', params: { id: projectId, taskId: entry.task.id } }"
              class="font-medium text-indigo-700 hover:underline"
              >{{ taskLabel(entry.task) }}</RouterLink
            >
            <span v-else class="font-medium">{{ taskLabel(entry.task) }}</span>
          </template>
          <template v-else-if="entry.task && compact"> esta tarea</template>
          {{ describe(entry).after ? ' ' + describe(entry).after : '' }}
          <time
            :datetime="entry.occurredAt"
            :title="formatDateTime(entry.occurredAt)"
            class="ml-1 text-xs whitespace-nowrap text-slate-500"
          >
            · {{ relativeTime(entry.occurredAt) }}
          </time>
        </p>
      </li>
    </ol>

    <button
      v-if="hasMore"
      type="button"
      class="rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 disabled:opacity-60"
      :disabled="loading"
      data-testid="activity-more"
      @click="load(false)"
    >
      Ver más
    </button>
  </section>
</template>
