<script setup lang="ts">
import ApiStatus from '@/features/system/components/ApiStatus.vue'
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Bienvenido a TaskNexus</h1>
      <p class="mt-1 text-slate-600">
        Gestión de proyectos y tareas. Etapa 1: esqueleto de la aplicación.
      </p>
    </div>
    <div class="max-w-sm">
      <ApiStatus />
    </div>
  </div>
</template>
