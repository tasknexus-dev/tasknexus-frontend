<script setup lang="ts">
import { useId } from 'vue'

defineProps<{
  label: string
  type?: 'text' | 'email' | 'password'
  autocomplete?: string
  error?: string
  hint?: string
  required?: boolean
}>()

const model = defineModel<string>({ required: true })
const id = useId()
</script>

<template>
  <div>
    <label :for="id" class="block text-sm font-medium text-slate-700">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      :type="type ?? 'text'"
      :autocomplete="autocomplete"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error || hint ? `${id}-help` : undefined"
      class="mt-1 block w-full rounded-lg border bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2"
      :class="
        error
          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
          : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
      "
    />
    <p v-if="error" :id="`${id}-help`" class="mt-1 text-xs text-rose-600">{{ error }}</p>
    <p v-else-if="hint" :id="`${id}-help`" class="mt-1 text-xs text-slate-500">{{ hint }}</p>
  </div>
</template>
