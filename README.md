# TaskNexus — Frontend

Interfaz web de TaskNexus, un gestor de proyectos y tareas con tablero Kanban.

**Repositorios:** [backend](https://github.com/tasknexus-dev/tasknexus-backend) · [frontend](https://github.com/tasknexus-dev/tasknexus-frontend) · [documentación](https://github.com/tasknexus-dev/tasknexus-docs) (plan, glosario, ADR)

## Tecnologías

Vue 3 · TypeScript · Vite · Pinia · Vue Router · Axios · Tailwind CSS v4 · vue-draggable-plus · Vitest

## Estructura

```
src/
├── app/        main.ts, App.vue, router.ts
├── shared/     api/http.ts (Axios), styles, componentes y utilidades comunes
└── features/   una carpeta por funcionalidad (auth, projects, tasks, board, activity):
                api.ts · stores/ · views/ · components/
```

## Arrancar en desarrollo

Necesita Node.js 24 o superior y el [backend](https://github.com/tasknexus-dev/tasknexus-backend) en marcha en http://localhost:8080.

```bash
npm install
npm run dev
```

App en http://localhost:5173. Vite reenvía `/api` y `/actuator` al backend (o a `BACKEND_URL` si está definida).

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run test:unit` | Pruebas con Vitest |
| `npm run lint` | oxlint + ESLint |
| `npm run format` | Prettier |
| `npm run build` | Type-check + build de producción |
