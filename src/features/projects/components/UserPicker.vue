<script setup lang="ts">
import { onBeforeUnmount, ref, useId, watch } from 'vue'

import { searchUsers, type UserRef } from '../api'

/** Buscador de usuarios por nombre o correo. Emite el usuario elegido. */
const props = defineProps<{
  /** Usuarios que no se ofrecen (p. ej. los que ya son miembros). */
  excludeIds?: string[]
}>()

const emit = defineEmits<{ select: [user: UserRef] }>()

const MIN_LENGTH = 2
const DEBOUNCE_MS = 250

const id = useId()
const term = ref('')
const results = ref<UserRef[]>([])
const loading = ref(false)
const failed = ref(false)
const searched = ref(false)

let timer: ReturnType<typeof setTimeout> | undefined
/** Descarta respuestas de búsquedas anteriores que lleguen tarde. */
let latest = 0

watch(term, (value) => {
  clearTimeout(timer)
  const text = value.trim()
  if (text.length < MIN_LENGTH) {
    results.value = []
    searched.value = false
    return
  }
  timer = setTimeout(() => void run(text), DEBOUNCE_MS)
})

async function run(text: string) {
  const request = ++latest
  loading.value = true
  failed.value = false
  try {
    const users = await searchUsers(text)
    if (request !== latest) return
    const excluded = new Set(props.excludeIds ?? [])
    results.value = users.filter((user) => !excluded.has(user.id))
  } catch {
    if (request === latest) failed.value = true
  } finally {
    if (request === latest) {
      loading.value = false
      searched.value = true
    }
  }
}

function choose(user: UserRef) {
  emit('select', user)
  term.value = ''
  results.value = []
  searched.value = false
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div>
    <label :for="id" class="block text-sm font-medium text-slate-700">Buscar usuario</label>
    <input
      :id="id"
      v-model="term"
      type="search"
      autocomplete="off"
      placeholder="Nombre o correo"
      class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      data-testid="user-search"
    />
    <p v-if="loading" class="mt-2 text-xs text-slate-500">Buscando…</p>
    <p v-else-if="failed" class="mt-2 text-xs text-rose-600">
      No se pudo buscar. Inténtalo de nuevo.
    </p>
    <p v-else-if="searched && results.length === 0" class="mt-2 text-xs text-slate-500">
      No hay usuarios que coincidan (o ya son miembros).
    </p>
    <ul
      v-if="results.length > 0"
      class="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white"
      data-testid="user-results"
    >
      <li v-for="user in results" :key="user.id">
        <button
          type="button"
          class="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-slate-50"
          @click="choose(user)"
        >
          <span class="text-sm font-medium">{{ user.name }}</span>
          <span class="text-xs text-slate-500">{{ user.email }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>
