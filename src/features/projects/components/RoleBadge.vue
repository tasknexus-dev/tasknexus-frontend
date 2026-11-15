<script setup lang="ts">
import type { ProjectRole } from '../api'
import { ROLE_LABELS } from '../permissions'

defineProps<{ role: ProjectRole }>()

const styles: Record<ProjectRole, string> = {
  OWNER: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  ADMIN: 'bg-sky-50 text-sky-700 ring-sky-200',
  MEMBER: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  VIEWER: 'bg-slate-100 text-slate-600 ring-slate-200',
}
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset"
    :class="styles[role]"
  >
    {{ ROLE_LABELS[role] }}
  </span>
</template>
