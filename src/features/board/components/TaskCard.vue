<script setup lang="ts">
import { RouterLink } from 'vue-router'

import DueDate from '@/features/tasks/components/DueDate.vue'
import PriorityBadge from '@/features/tasks/components/PriorityBadge.vue'
import type { TaskSummary } from '@/features/tasks/api'
import UserAvatar from '@/shared/ui/UserAvatar.vue'

defineProps<{ task: TaskSummary; draggable: boolean }>()
</script>

<template>
  <article
    class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-indigo-300"
    :class="draggable ? 'cursor-grab active:cursor-grabbing' : ''"
  >
    <div class="flex items-start justify-between gap-2">
      <RouterLink
        :to="{ name: 'task', params: { id: task.projectId, taskId: task.id } }"
        class="min-w-0 text-sm font-medium text-slate-900 hover:text-indigo-700 hover:underline"
        :data-testid="`card-link-${task.id}`"
      >
        {{ task.title }}
      </RouterLink>
      <UserAvatar v-if="task.assignee" :name="task.assignee.name" size="sm" />
    </div>
    <div class="mt-2 flex flex-wrap items-center gap-2">
      <span class="font-mono text-xs text-slate-500">{{ task.key }}</span>
      <PriorityBadge :priority="task.priority" />
      <DueDate v-if="task.dueDate" :due-date="task.dueDate" :status="task.status" />
    </div>
  </article>
</template>
