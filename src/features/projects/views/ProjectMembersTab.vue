<script setup lang="ts">
import { useRouter } from 'vue-router'

import { useSessionStore } from '@/features/auth/stores/session'

import MembersPanel from '../components/MembersPanel.vue'
import { useCurrentProject, useProjectContext } from '../context'

const router = useRouter()
const session = useSessionStore()
const { members, reload } = useProjectContext()
const project = useCurrentProject()
</script>

<template>
  <MembersPanel
    :project="project"
    :members="members"
    :current-user-id="session.user?.id ?? ''"
    @changed="reload"
    @left="router.push({ name: 'projects' })"
  />
</template>
