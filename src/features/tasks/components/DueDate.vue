<script setup lang="ts">
import { computed } from 'vue'

import type { TaskStatus } from '../api'
import { formatDate, isOverdue } from '../labels'

const props = defineProps<{ dueDate: string; status: TaskStatus }>()

const overdue = computed(() => isOverdue(props))
</script>

<template>
  <span
    class="inline-flex items-center gap-1 text-xs"
    :class="overdue ? 'font-semibold text-rose-700' : 'text-slate-500'"
    :data-overdue="overdue || undefined"
  >
    <span aria-hidden="true">📅</span>
    <span>{{ formatDate(dueDate) }}</span>
    <span v-if="overdue">· vencida</span>
  </span>
</template>
