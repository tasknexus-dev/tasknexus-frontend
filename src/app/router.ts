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
  {
    path: '/',
    name: 'home',
    component: () => import('@/features/home/views/HomeView.vue'),
    meta: { requiresAuth: true, title: 'Inicio' },
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
