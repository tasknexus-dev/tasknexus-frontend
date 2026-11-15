<script setup lang="ts">
import { useSessionStore } from '@/features/auth/stores/session'
import ApiStatus from '@/features/system/components/ApiStatus.vue'

const session = useSessionStore()
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight" data-testid="welcome">
        Hola, {{ session.user?.name }}
      </h1>
      <p class="mt-1 text-slate-600">
        Gestión de proyectos y tareas. Los proyectos llegan en la Etapa 4.
      </p>
    </div>
    <div class="max-w-sm">
      <ApiStatus />
    </div>
  </div>
</template>
