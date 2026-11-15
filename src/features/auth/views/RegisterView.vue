<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { fieldErrors, toProblem, type Problem } from '@/shared/api/problem'
import TextField from '@/shared/ui/TextField.vue'

import AuthCard from '../components/AuthCard.vue'
import { safeRedirect } from '../setup'
import { useSessionStore } from '../stores/session'

const session = useSessionStore()
const route = useRoute()
const router = useRouter()

const form = reactive({ name: '', email: '', password: '' })
const problem = ref<Problem | null>(null)
const submitting = ref(false)
const errors = computed(() => fieldErrors(problem.value))

async function submit() {
  submitting.value = true
  problem.value = null
  try {
    await session.register({ ...form })
    await router.replace(safeRedirect(route.query.redirect))
  } catch (error) {
    problem.value = toProblem(error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthCard title="Crear cuenta" subtitle="Empieza a organizar tu trabajo en equipo.">
    <form class="space-y-4" novalidate @submit.prevent="submit">
      <p
        v-if="problem && problem.code !== 'validation.failed'"
        role="alert"
        class="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        data-testid="form-error"
      >
        {{ problem.detail }}
      </p>
      <TextField
        v-model="form.name"
        label="Nombre"
        autocomplete="name"
        required
        :error="errors.name"
      />
      <TextField
        v-model="form.email"
        label="Correo electrónico"
        type="email"
        autocomplete="email"
        required
        :error="errors.email"
      />
      <TextField
        v-model="form.password"
        label="Contraseña"
        type="password"
        autocomplete="new-password"
        required
        hint="Entre 8 y 72 caracteres."
        :error="errors.password"
      />
      <button
        type="submit"
        class="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60"
        :disabled="submitting"
      >
        {{ submitting ? 'Creando cuenta…' : 'Crear cuenta' }}
      </button>
    </form>
    <template #footer>
      ¿Ya tienes cuenta?
      <RouterLink
        :to="{ name: 'login', query: route.query }"
        class="font-medium text-indigo-600 hover:underline"
      >
        Inicia sesión
      </RouterLink>
    </template>
  </AuthCard>
</template>
