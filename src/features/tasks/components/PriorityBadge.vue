<script setup lang="ts">
import type { TaskPriority } from '../api'
import { PRIORITY_LABELS, PRIORITY_STYLES } from '../labels'

defineProps<{ priority: TaskPriority }>()
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset"
    :class="PRIORITY_STYLES[priority]"
  >
    {{ PRIORITY_LABELS[priority] }}
  </span>
</template>
