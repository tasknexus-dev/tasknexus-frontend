<script setup lang="ts">
import { useTemplateRef } from 'vue'

import { useCurrentProject } from '@/features/projects/context'

import ActivityFeed from '../components/ActivityFeed.vue'

/** Pestaña «Actividad»: qué ha pasado en el proyecto, lo más reciente primero. */
const project = useCurrentProject()
const feed = useTemplateRef<InstanceType<typeof ActivityFeed>>('feed')
</script>

<template>
  <div class="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div class="flex items-center justify-between gap-4">
      <h2 class="text-lg font-semibold">Actividad del proyecto</h2>
      <button
        type="button"
        class="rounded-lg border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100"
        data-testid="activity-refresh"
        @click="feed?.reload()"
      >
        Actualizar
      </button>
    </div>
    <ActivityFeed ref="feed" :project-id="project.id" />
  </div>
</template>
