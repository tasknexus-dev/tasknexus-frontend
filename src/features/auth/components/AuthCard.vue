<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <section
    class="mx-auto w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
  >
    <h1 class="text-xl font-bold tracking-tight">{{ title }}</h1>
    <p v-if="subtitle" class="mt-1 text-sm text-slate-600">{{ subtitle }}</p>
    <div class="mt-6">
      <slot />
    </div>
    <div v-if="$slots.footer" class="mt-6 border-t border-slate-100 pt-4 text-center text-sm">
      <slot name="footer" />
    </div>
  </section>
</template>
