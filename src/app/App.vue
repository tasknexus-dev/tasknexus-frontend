<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'

import { useSessionStore } from '@/features/auth/stores/session'

const session = useSessionStore()
const router = useRouter()
const loggingOut = ref(false)

async function logout() {
  loggingOut.value = true
  try {
    await session.logout()
  } catch {
    // Si el servidor no responde, la sesión local ya se ha cerrado igualmente.
  } finally {
    loggingOut.value = false
    await router.push({ name: 'login' })
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
        <RouterLink to="/" class="flex items-center gap-2">
          <span
            class="grid size-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white"
          >
            TN
          </span>
          <span class="text-lg font-semibold tracking-tight">TaskNexus</span>
        </RouterLink>
        <div v-if="session.user" class="ml-auto flex items-center gap-3">
          <span class="hidden text-sm text-slate-600 sm:inline" data-testid="current-user">
            {{ session.user.name }}
          </span>
          <button
            type="button"
            class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
            :disabled="loggingOut"
            @click="logout"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
    <main class="mx-auto max-w-5xl px-4 py-10">
      <RouterView />
    </main>
  </div>
</template>
