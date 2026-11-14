<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
        <span
          class="grid size-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white"
        >
          TN
        </span>
        <span class="text-lg font-semibold tracking-tight">TaskNexus</span>
      </div>
    </header>
    <main class="mx-auto max-w-5xl px-4 py-10">
      <RouterView />
    </main>
  </div>
</template>
