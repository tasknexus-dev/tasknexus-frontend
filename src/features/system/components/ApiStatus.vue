<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { isAxiosError } from 'axios'

import { fetchHealth } from '../api'

type State = 'loading' | 'up' | 'down' | 'unreachable'

const state = ref<State>('loading')
const checkedAt = ref<Date | null>(null)

const labels: Record<State, string> = {
  loading: 'Comprobando…',
  up: 'Backend operativo',
  down: 'Backend con problemas',
  unreachable: 'Backend no disponible',
}

const dotClasses: Record<State, string> = {
  loading: 'bg-slate-400 animate-pulse',
  up: 'bg-emerald-500',
  down: 'bg-amber-500',
  unreachable: 'bg-rose-500',
}

async function check() {
  state.value = 'loading'
  try {
    const health = await fetchHealth()
    state.value = health.status === 'UP' ? 'up' : 'down'
  } catch (error) {
    // Actuator responde 503 cuando algún componente (p. ej. la BD) está caído.
    state.value = isAxiosError(error) && error.response?.status === 503 ? 'down' : 'unreachable'
  } finally {
    checkedAt.value = new Date()
  }
}

onMounted(check)
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <h2 class="text-sm font-medium text-slate-500">Estado de la API</h2>
    <div class="mt-3 flex items-center gap-3">
      <span class="size-3 rounded-full" :class="dotClasses[state]" aria-hidden="true" />
      <p class="text-lg font-semibold" data-testid="api-status">{{ labels[state] }}</p>
    </div>
    <p v-if="checkedAt" class="mt-1 text-xs text-slate-500">
      Última comprobación: {{ checkedAt.toLocaleTimeString('es') }}
    </p>
    <button
      type="button"
      class="mt-4 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
      :disabled="state === 'loading'"
      @click="check"
    >
      Comprobar de nuevo
    </button>
  </section>
</template>
