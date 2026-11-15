<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { fieldErrors, toProblem, type Problem } from '@/shared/api/problem'
import ProblemAlert from '@/shared/ui/ProblemAlert.vue'
import TextAreaField from '@/shared/ui/TextAreaField.vue'
import UserAvatar from '@/shared/ui/UserAvatar.vue'

import {
  addComment,
  COMMENT_MAX,
  deleteComment,
  editComment,
  listComments,
  type TaskComment,
} from '../api'
import { formatDateTime } from '../labels'

/** Comentarios de una tarea: leer, publicar, editar los propios y borrar (autor u OWNER/ADMIN). */
const props = defineProps<{ taskId: string; canComment: boolean }>()
const emit = defineEmits<{ count: [value: number] }>()

const comments = ref<TaskComment[]>([])
const loading = ref(true)
const problem = ref<Problem | null>(null)
const busy = ref(false)

const draft = ref('')
const draftProblem = ref<Problem | null>(null)

const editingId = ref<string | null>(null)
const editDraft = ref('')
const editProblem = ref<Problem | null>(null)
const deletingId = ref<string | null>(null)

const draftError = computed(() => fieldErrors(draftProblem.value).content)
const editError = computed(() => fieldErrors(editProblem.value).content)

// Se emite al terminar la carga (también con 0) y en cada alta o borrado.
watch(
  () => (loading.value ? null : comments.value.length),
  (count) => {
    if (count !== null) emit('count', count)
  },
)

async function load() {
  loading.value = true
  problem.value = null
  try {
    comments.value = await listComments(props.taskId)
  } catch (error) {
    problem.value = toProblem(error)
  } finally {
    loading.value = false
  }
}

watch(() => props.taskId, load, { immediate: true })

async function publish() {
  const content = draft.value.trim()
  if (!content) return
  busy.value = true
  draftProblem.value = null
  try {
    comments.value = [...comments.value, await addComment(props.taskId, content)]
    draft.value = ''
  } catch (error) {
    draftProblem.value = toProblem(error)
  } finally {
    busy.value = false
  }
}

function startEdit(comment: TaskComment) {
  editingId.value = comment.id
  editDraft.value = comment.content
  editProblem.value = null
  deletingId.value = null
}

async function saveEdit(comment: TaskComment) {
  busy.value = true
  editProblem.value = null
  try {
    const updated = await editComment(comment.id, {
      content: editDraft.value,
      version: comment.version,
    })
    comments.value = comments.value.map((item) => (item.id === updated.id ? updated : item))
    editingId.value = null
  } catch (error) {
    editProblem.value = toProblem(error)
    // Otra pestaña lo cambió o lo borró: se recarga la lista para ver la versión actual.
    if (editProblem.value.status === 409 || editProblem.value.status === 404) {
      const kept = editProblem.value
      await load()
      editProblem.value = kept
    }
  } finally {
    busy.value = false
  }
}

async function remove(comment: TaskComment) {
  busy.value = true
  problem.value = null
  try {
    await deleteComment(comment.id)
    comments.value = comments.value.filter((item) => item.id !== comment.id)
  } catch (error) {
    problem.value = toProblem(error)
  } finally {
    busy.value = false
    deletingId.value = null
  }
}
</script>

<template>
  <section class="space-y-4" data-testid="task-comments">
    <ProblemAlert :problem="problem" />
    <p v-if="loading" class="text-sm text-slate-500">Cargando comentarios…</p>
    <p
      v-else-if="comments.length === 0 && !problem"
      class="text-sm text-slate-400 italic"
      data-testid="no-comments"
    >
      Todavía no hay comentarios.
    </p>

    <ol v-else class="space-y-4">
      <li
        v-for="comment in comments"
        :key="comment.id"
        class="flex gap-3"
        :data-testid="`comment-${comment.id}`"
      >
        <UserAvatar :name="comment.author.name" />
        <div class="min-w-0 flex-1 space-y-1">
          <p class="flex flex-wrap items-baseline gap-x-2 text-sm">
            <span class="font-semibold">{{ comment.author.name }}</span>
            <time :datetime="comment.createdAt" class="text-xs text-slate-500">
              {{ formatDateTime(comment.createdAt) }}
            </time>
            <span
              v-if="comment.edited"
              class="text-xs text-slate-400"
              :title="`Editado: ${formatDateTime(comment.updatedAt)}`"
            >
              (editado)
            </span>
          </p>

          <form
            v-if="editingId === comment.id"
            class="space-y-2"
            data-testid="edit-comment-form"
            @submit.prevent="saveEdit(comment)"
          >
            <ProblemAlert v-if="!editError" :problem="editProblem" />
            <TextAreaField
              v-model="editDraft"
              label="Editar comentario"
              :maxlength="COMMENT_MAX"
              :error="editError"
            />
            <div class="flex gap-2 text-sm">
              <button
                type="submit"
                class="rounded-lg bg-indigo-600 px-3 py-1.5 font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                :disabled="busy || !editDraft.trim()"
              >
                Guardar
              </button>
              <button
                type="button"
                class="rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-100"
                @click="editingId = null"
              >
                Cancelar
              </button>
            </div>
          </form>
          <p v-else class="text-sm break-words whitespace-pre-line text-slate-800">
            {{ comment.content }}
          </p>

          <div
            v-if="editingId !== comment.id && (comment.canEdit || comment.canDelete)"
            class="flex gap-3 text-xs"
          >
            <template v-if="deletingId === comment.id">
              <span class="text-slate-600">¿Borrar el comentario?</span>
              <button
                type="button"
                class="font-semibold text-rose-600 hover:underline"
                :disabled="busy"
                data-testid="confirm-delete-comment"
                @click="remove(comment)"
              >
                Sí, borrar
              </button>
              <button
                type="button"
                class="text-slate-600 hover:underline"
                @click="deletingId = null"
              >
                No
              </button>
            </template>
            <template v-else>
              <button
                v-if="comment.canEdit"
                type="button"
                class="font-medium text-slate-600 hover:underline"
                data-testid="edit-comment"
                @click="startEdit(comment)"
              >
                Editar
              </button>
              <button
                v-if="comment.canDelete"
                type="button"
                class="font-medium text-rose-600 hover:underline"
                data-testid="delete-comment"
                @click="deletingId = comment.id"
              >
                Borrar
              </button>
            </template>
          </div>
        </div>
      </li>
    </ol>

    <form
      v-if="canComment"
      class="space-y-2 border-t border-slate-100 pt-4"
      data-testid="new-comment-form"
      @submit.prevent="publish"
    >
      <ProblemAlert v-if="!draftError" :problem="draftProblem" />
      <TextAreaField
        v-model="draft"
        label="Nuevo comentario"
        :maxlength="COMMENT_MAX"
        :error="draftError"
        hint="Visible para todos los miembros del proyecto."
      />
      <button
        type="submit"
        class="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60"
        :disabled="busy || !draft.trim()"
        data-testid="publish-comment"
      >
        Comentar
      </button>
    </form>
  </section>
</template>
