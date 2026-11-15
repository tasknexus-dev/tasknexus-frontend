import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** Solo para usuarios autenticados; si no, redirige al login. */
    requiresAuth?: boolean
    /** Solo para visitantes (login, registro); si ya hay sesión, redirige al inicio. */
    guestOnly?: boolean
    title?: string
  }
}

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', redirect: { name: 'projects' } },
  {
    path: '/projects',
    name: 'projects',
    component: () => import('@/features/projects/views/ProjectsView.vue'),
    meta: { requiresAuth: true, title: 'Proyectos' },
  },
  {
    path: '/projects/:id',
    component: () => import('@/features/projects/views/ProjectView.vue'),
    props: true,
    meta: { requiresAuth: true, title: 'Proyecto' },
    children: [
      { path: '', name: 'project', redirect: (to) => ({ name: 'board', params: to.params }) },
      {
        path: 'board',
        name: 'board',
        component: () => import('@/features/board/views/BoardView.vue'),
        meta: { title: 'Tablero' },
      },
      {
        path: 'tasks',
        name: 'tasks',
        component: () => import('@/features/tasks/views/TaskListView.vue'),
        meta: { title: 'Tareas' },
      },
      {
        path: 'tasks/:taskId',
        name: 'task',
        component: () => import('@/features/tasks/views/TaskView.vue'),
        props: true,
        meta: { title: 'Tarea' },
      },
      {
        path: 'activity',
        name: 'activity',
        component: () => import('@/features/activity/views/ProjectActivityTab.vue'),
        meta: { title: 'Actividad' },
      },
      {
        path: 'members',
        name: 'members',
        component: () => import('@/features/projects/views/ProjectMembersTab.vue'),
        meta: { title: 'Miembros' },
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/features/projects/views/ProjectSettingsTab.vue'),
        meta: { title: 'Ajustes' },
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/features/auth/views/LoginView.vue'),
    meta: { guestOnly: true, title: 'Iniciar sesión' },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/features/auth/views/RegisterView.vue'),
    meta: { guestOnly: true, title: 'Crear cuenta' },
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · TaskNexus` : 'TaskNexus'
})

export default router
