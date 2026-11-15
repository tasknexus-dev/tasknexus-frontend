<script setup lang="ts">
import type { Problem } from '@/shared/api/problem'

/** Muestra el mensaje de un error de la API. Los de validación se ven junto a cada campo. */
defineProps<{ problem: Problem | null }>()
</script>

<template>
  <p
    v-if="problem && problem.code !== 'validation.failed'"
    role="alert"
    class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
    data-testid="problem-alert"
  >
    {{ problem.detail }}
  </p>
</template>
