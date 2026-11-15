<script setup lang="ts">
import { computed, ref } from 'vue'

import { toProblem, type Problem } from '@/shared/api/problem'
import ProblemAlert from '@/shared/ui/ProblemAlert.vue'

import {
  addMember,
  changeMemberRole,
  removeMember,
  type Member,
  type Project,
  type ProjectRole,
  type UserRef,
} from '../api'
import {
  assignableRoles,
  canAssign,
  canManageMembers,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
} from '../permissions'
import RoleBadge from './RoleBadge.vue'
import UserPicker from './UserPicker.vue'

const props = defineProps<{
  project: Project
  members: Member[]
  currentUserId: string
}>()

/** `changed`: hay que recargar miembros y proyecto. `left`: el usuario ha salido del proyecto. */
const emit = defineEmits<{ changed: []; left: [] }>()

const problem = ref<Problem | null>(null)
const busy = ref(false)
const candidate = ref<UserRef | null>(null)
const candidateRole = ref<ProjectRole>('MEMBER')
/** Miembro cuya expulsión (o salida, si es uno mismo) espera confirmación. */
const confirming = ref<string | null>(null)

const editable = computed(() => !props.project.archived)
const canAdd = computed(() => editable.value && canManageMembers(props.project.myRole))
const roles = computed(() => assignableRoles(props.project.myRole))
const memberIds = computed(() => props.members.map((member) => member.user.id))

function isMe(member: Member) {
  return member.user.id === props.currentUserId
}

/** Si puedo cambiar el rol o expulsar a este miembro. */
function canManage(member: Member) {
  return editable.value && !isMe(member) && canAssign(props.project.myRole, member.role)
}

function canLeave(member: Member) {
  return editable.value && isMe(member) && member.role !== 'OWNER'
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}

async function run(action: () => Promise<unknown>, after: () => void = () => emit('changed')) {
  busy.value = true
  problem.value = null
  try {
    await action()
    after()
  } catch (error) {
    problem.value = toProblem(error)
  } finally {
    busy.value = false
  }
}

function choose(user: UserRef) {
  candidate.value = user
  candidateRole.value = roles.value.includes('MEMBER') ? 'MEMBER' : (roles.value[0] ?? 'VIEWER')
}

function add() {
  const user = candidate.value
  if (!user) return
  void run(
    () => addMember(props.project.id, user.id, candidateRole.value),
    () => {
      candidate.value = null
      emit('changed')
    },
  )
}

function changeRole(member: Member, role: ProjectRole) {
  void run(() => changeMemberRole(props.project.id, member.user.id, role))
}

function remove(member: Member) {
  confirming.value = null
  const leaving = isMe(member)
  void run(
    () => removeMember(props.project.id, member.user.id),
    () => (leaving ? emit('left') : emit('changed')),
  )
}
</script>

<template>
  <section class="space-y-4" aria-labelledby="members-title">
    <div class="flex items-baseline justify-between">
      <h2 id="members-title" class="text-lg font-semibold">Miembros</h2>
      <span class="text-sm text-slate-500">{{ members.length }}</span>
    </div>

    <ProblemAlert :problem="problem" />

    <div
      v-if="canAdd"
      class="space-y-3 rounded-xl border border-slate-200 bg-white p-4"
      data-testid="add-member"
    >
      <UserPicker v-if="!candidate" :exclude-ids="memberIds" @select="choose" />
      <div v-else class="flex flex-wrap items-end gap-3">
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium">{{ candidate.name }}</p>
          <p class="truncate text-xs text-slate-500">{{ candidate.email }}</p>
        </div>
        <label class="text-sm">
          <span class="sr-only">Rol</span>
          <select
            v-model="candidateRole"
            class="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            data-testid="candidate-role"
          >
            <option v-for="role in roles" :key="role" :value="role">{{ ROLE_LABELS[role] }}</option>
          </select>
        </label>
        <button
          type="button"
          class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
          @click="candidate = null"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          :disabled="busy"
          data-testid="confirm-add"
          @click="add"
        >
          Añadir
        </button>
      </div>
    </div>

    <ul
      class="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white"
      data-testid="member-list"
    >
      <li
        v-for="member in members"
        :key="member.user.id"
        class="flex flex-wrap items-center gap-3 px-4 py-3"
        :data-testid="`member-${member.user.id}`"
      >
        <span
          class="grid size-9 shrink-0 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700"
          aria-hidden="true"
        >
          {{ initials(member.user.name) }}
        </span>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium">
            {{ member.user.name }}
            <span v-if="isMe(member)" class="font-normal text-slate-500">(tú)</span>
          </p>
          <p class="truncate text-xs text-slate-500">{{ member.user.email }}</p>
        </div>

        <template v-if="confirming === member.user.id">
          <span class="text-sm text-slate-700">
            {{ isMe(member) ? '¿Salir del proyecto?' : `¿Quitar a ${member.user.name}?` }}
          </span>
          <button
            type="button"
            class="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
            :disabled="busy"
            data-testid="confirm-remove"
            @click="remove(member)"
          >
            Sí
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
            @click="confirming = null"
          >
            No
          </button>
        </template>
        <template v-else>
          <select
            v-if="canManage(member)"
            :value="member.role"
            :aria-label="`Rol de ${member.user.name}`"
            :title="ROLE_DESCRIPTIONS[member.role]"
            class="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            :disabled="busy"
            data-testid="member-role"
            @change="changeRole(member, ($event.target as HTMLSelectElement).value as ProjectRole)"
          >
            <option v-for="role in roles" :key="role" :value="role">{{ ROLE_LABELS[role] }}</option>
          </select>
          <RoleBadge v-else :role="member.role" :title="ROLE_DESCRIPTIONS[member.role]" />
          <button
            v-if="canManage(member) || canLeave(member)"
            type="button"
            class="rounded-lg px-2 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50"
            :data-testid="isMe(member) ? 'leave' : 'remove'"
            @click="confirming = member.user.id"
          >
            {{ isMe(member) ? 'Salir' : 'Quitar' }}
          </button>
        </template>
      </li>
    </ul>
  </section>
</template>
