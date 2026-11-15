<script setup lang="ts">
import { computed, reactive, useId, watch } from 'vue'

import type { Member } from '@/features/projects/api'
import { fieldErrors, type Problem } from '@/shared/api/problem'
import TextAreaField from '@/shared/ui/TextAreaField.vue'
import TextField from '@/shared/ui/TextField.vue'

import type { TaskInput, TaskPriority } from '../api'
import { PRIORITIES, PRIORITY_LABELS } from '../labels'

/** Campos editables de una tarea. Se usa para crear y para editar. */
const props = defineProps<{
  initial?: Partial<TaskInput>
  members: Member[]
  problem: Problem | null
  submitting: boolean
  submitLabel: string
  disabled?: boolean
}>()

const emit = defineEmits<{ submit: [input: TaskInput]; cancel: [] }>()

const ids = { priority: useId(), dueDate: useId(), assignee: useId() }
const form = reactive({
  title: '',
  description: '',
  priority: 'MEDIUM' as TaskPriority,
  dueDate: '',
  assigneeId: '',
})
const errors = computed(() => fieldErrors(props.problem))

watch(
  () => props.initial,
  (initial) => {
    form.title = initial?.title ?? ''
    form.description = initial?.description ?? ''
    form.priority = initial?.priority ?? 'MEDIUM'
    form.dueDate = initial?.dueDate ?? ''
    form.assigneeId = initial?.assigneeId ?? ''
  },
  { immediate: true },
)

function submit() {
  emit('submit', {
    title: form.title,
    description: form.description.trim() || null,
    priority: form.priority,
    dueDate: form.dueDate || null,
    assigneeId: form.assigneeId || null,
  })
}
</script>

<template>
  <form class="space-y-4" novalidate data-testid="task-form" @submit.prevent="submit">
    <fieldset :disabled="disabled" class="space-y-4">
      <TextField v-model="form.title" label="Título" required :error="errors.title" />
      <TextAreaField
        v-model="form.description"
        label="Descripción"
        :rows="5"
        :maxlength="10000"
        :error="errors.description"
      />
      <div class="grid gap-4 sm:grid-cols-3">
        <div>
          <label :for="ids.priority" class="block text-sm font-medium text-slate-700">
            Prioridad
          </label>
          <select
            :id="ids.priority"
            v-model="form.priority"
            class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
            data-testid="task-priority"
          >
            <option v-for="priority in PRIORITIES" :key="priority" :value="priority">
              {{ PRIORITY_LABELS[priority] }}
            </option>
          </select>
        </div>
        <div>
          <label :for="ids.dueDate" class="block text-sm font-medium text-slate-700">
            Fecha límite
          </label>
          <input
            :id="ids.dueDate"
            v-model="form.dueDate"
            type="date"
            class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            data-testid="task-due-date"
          />
        </div>
        <div>
          <label :for="ids.assignee" class="block text-sm font-medium text-slate-700">
            Responsable
          </label>
          <select
            :id="ids.assignee"
            v-model="form.assigneeId"
            class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm"
            data-testid="task-assignee"
          >
            <option value="">Sin asignar</option>
            <option v-for="member in members" :key="member.user.id" :value="member.user.id">
              {{ member.user.name }}
            </option>
          </select>
          <p v-if="errors.assigneeId" class="mt-1 text-xs text-rose-600">
            {{ errors.assigneeId }}
          </p>
        </div>
      </div>
    </fieldset>
    <div v-if="!disabled" class="flex justify-end gap-2">
      <slot name="actions" />
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
        {{ submitLabel }}
      </button>
    </div>
  </form>
</template>
