<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import { fieldErrors, toProblem, type Problem } from '@/shared/api/problem'
import ProblemAlert from '@/shared/ui/ProblemAlert.vue'
import TextAreaField from '@/shared/ui/TextAreaField.vue'
import TextField from '@/shared/ui/TextField.vue'

import {
  archiveProject,
  deleteProject,
  restoreProject,
  transferOwnership,
  updateProject,
  type Member,
  type Project,
} from '../api'

/** Ajustes que solo ve el propietario. */
const props = defineProps<{ project: Project; members: Member[] }>()

const emit = defineEmits<{ updated: [project: Project]; deleted: [] }>()

const form = reactive({ name: '', description: '' })
const problem = ref<Problem | null>(null)
const saved = ref(false)
const busy = ref(false)
const newOwnerId = ref('')
const deleteConfirmation = ref('')
const errors = computed(() => fieldErrors(problem.value))
const candidates = computed(() => props.members.filter((member) => member.role !== 'OWNER'))
const canDelete = computed(
  () => deleteConfirmation.value.trim().toUpperCase() === props.project.key,
)

watch(
  () => props.project,
  (project) => {
    form.name = project.name
    form.description = project.description ?? ''
  },
  { immediate: true },
)

async function run(action: () => Promise<Project | void>) {
  busy.value = true
  problem.value = null
  saved.value = false
  try {
    const result = await action()
    if (result) emit('updated', result)
    return true
  } catch (error) {
    problem.value = toProblem(error)
    return false
  } finally {
    busy.value = false
  }
}

async function save() {
  const ok = await run(() =>
    updateProject(props.project.id, {
      name: form.name,
      description: form.description.trim() || null,
      version: props.project.version,
    }),
  )
  saved.value = ok
}

function toggleArchived() {
  void run(() =>
    props.project.archived ? restoreProject(props.project.id) : archiveProject(props.project.id),
  )
}

async function transfer() {
  if (!newOwnerId.value) return
  if (await run(() => transferOwnership(props.project.id, newOwnerId.value))) {
    newOwnerId.value = ''
  }
}

async function remove() {
  if (!canDelete.value) return
  if (await run(() => deleteProject(props.project.id))) emit('deleted')
}
</script>

<template>
  <section class="space-y-6" aria-labelledby="settings-title">
    <h2 id="settings-title" class="text-lg font-semibold">Ajustes del proyecto</h2>
    <ProblemAlert :problem="problem" />

    <form
      class="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
      novalidate
      data-testid="project-details-form"
      @submit.prevent="save"
    >
      <TextField v-model="form.name" label="Nombre" required :error="errors.name" />
      <TextAreaField
        v-model="form.description"
        label="Descripción"
        :maxlength="2000"
        :error="errors.description"
      />
      <div class="flex items-center justify-end gap-3">
        <span v-if="saved" class="text-sm text-emerald-700" role="status">Cambios guardados</span>
        <button
          type="submit"
          class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60"
          :disabled="busy || project.archived"
        >
          Guardar
        </button>
      </div>
    </form>

    <div class="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
      <h3 class="font-medium">Transferir la propiedad</h3>
      <p class="text-sm text-slate-600">
        El nuevo propietario debe ser ya miembro. Tú pasarás a administrador.
      </p>
      <div class="flex flex-wrap gap-2">
        <select
          v-model="newOwnerId"
          aria-label="Nuevo propietario"
          class="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
          :disabled="project.archived || candidates.length === 0"
          data-testid="new-owner"
        >
          <option value="" disabled>
            {{ candidates.length === 0 ? 'Añade antes otro miembro' : 'Elige un miembro' }}
          </option>
          <option v-for="member in candidates" :key="member.user.id" :value="member.user.id">
            {{ member.user.name }} ({{ member.user.email }})
          </option>
        </select>
        <button
          type="button"
          class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
          :disabled="busy || !newOwnerId"
          @click="transfer"
        >
          Transferir
        </button>
      </div>
    </div>

    <div class="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
      <h3 class="font-medium">{{ project.archived ? 'Restaurar' : 'Archivar' }} el proyecto</h3>
      <p class="text-sm text-slate-600">
        {{
          project.archived
            ? 'Vuelve a permitir cambios en el proyecto y sus tareas.'
            : 'El proyecto queda en solo lectura: se puede consultar, pero no modificar.'
        }}
      </p>
      <button
        type="button"
        class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50"
        :disabled="busy"
        data-testid="toggle-archived"
        @click="toggleArchived"
      >
        {{ project.archived ? 'Restaurar' : 'Archivar' }}
      </button>
    </div>

    <div class="space-y-3 rounded-xl border border-rose-200 bg-rose-50/40 p-5">
      <h3 class="font-medium text-rose-700">Borrar el proyecto</h3>
      <p class="text-sm text-slate-600">
        Se borran también sus miembros, tareas y comentarios. No se puede deshacer. Escribe
        <strong class="font-mono">{{ project.key }}</strong> para confirmar.
      </p>
      <div class="flex flex-wrap gap-2">
        <input
          v-model="deleteConfirmation"
          type="text"
          autocomplete="off"
          :aria-label="`Escribe ${project.key} para confirmar`"
          class="w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm uppercase"
          data-testid="delete-confirmation"
        />
        <button
          type="button"
          class="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
          :disabled="busy || !canDelete"
          data-testid="delete-project"
          @click="remove"
        >
          Borrar proyecto
        </button>
      </div>
    </div>
  </section>
</template>
