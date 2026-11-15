<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import { fieldErrors, toProblem, type Problem } from '@/shared/api/problem'
import ProblemAlert from '@/shared/ui/ProblemAlert.vue'
import TextAreaField from '@/shared/ui/TextAreaField.vue'
import TextField from '@/shared/ui/TextField.vue'

import { createProject, type Project } from '../api'
import { normalizeKey, suggestKey } from '../projectKey'

const emit = defineEmits<{ created: [project: Project]; cancel: [] }>()

const form = reactive({ name: '', key: '', description: '' })
const keyEdited = ref(false)
const problem = ref<Problem | null>(null)
const submitting = ref(false)
const errors = computed(() => fieldErrors(problem.value))

watch(
  () => form.name,
  (name) => {
    if (!keyEdited.value) form.key = suggestKey(name)
  },
)

function onKeyInput(value: string) {
  keyEdited.value = true
  form.key = normalizeKey(value)
}

async function submit() {
  submitting.value = true
  problem.value = null
  try {
    const project = await createProject({
      key: form.key,
      name: form.name,
      description: form.description.trim() || null,
    })
    emit('created', project)
  } catch (error) {
    problem.value = toProblem(error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form
    class="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    novalidate
    data-testid="create-project-form"
    @submit.prevent="submit"
  >
    <h2 class="text-lg font-semibold">Nuevo proyecto</h2>
    <ProblemAlert :problem="problem" />
    <div class="grid gap-4 sm:grid-cols-[1fr_10rem]">
      <TextField v-model="form.name" label="Nombre" required :error="errors.name" />
      <TextField
        :model-value="form.key"
        label="Clave"
        required
        hint="Prefijo de las tareas, p. ej. TN-42"
        :error="errors.key"
        @update:model-value="onKeyInput"
      />
    </div>
    <TextAreaField
      v-model="form.description"
      label="Descripción (opcional)"
      :maxlength="2000"
      :error="errors.description"
    />
    <div class="flex justify-end gap-2">
      <button
        type="button"
        class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100"
        @click="emit('cancel')"
      >
        Cancelar
      </button>
      <button
        type="submit"
        class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60"
        :disabled="submitting"
      >
        {{ submitting ? 'Creando…' : 'Crear proyecto' }}
      </button>
    </div>
  </form>
</template>
