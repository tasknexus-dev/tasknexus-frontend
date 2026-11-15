<script setup lang="ts">
import { computed } from 'vue'

/** Iniciales del usuario en un círculo (aún no hay subida de imágenes). */
const props = defineProps<{ name: string; size?: 'sm' | 'md' }>()

const initials = computed(() =>
  props.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join(''),
)
</script>

<template>
  <span
    class="grid shrink-0 place-items-center rounded-full bg-indigo-100 font-semibold text-indigo-800"
    :class="size === 'sm' ? 'size-6 text-[10px]' : 'size-8 text-xs'"
    :title="name"
    :aria-label="name"
    role="img"
  >
    {{ initials }}
  </span>
</template>
