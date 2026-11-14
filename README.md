# TaskNexus — Frontend

Vue 3 + TypeScript + Vite + Pinia + Vue Router + Tailwind CSS v4.

## Estructura

```
src/
├── app/        main.ts, App.vue, router.ts
├── shared/     api/http.ts (Axios), styles, componentes y utilidades comunes
└── features/   una carpeta por funcionalidad: api.ts · store.ts · views/ · components/
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en http://localhost:5173 (proxy a `http://localhost:8080`, o a `BACKEND_URL`) |
| `npm run test:unit` | Pruebas con Vitest |
| `npm run lint` | oxlint + ESLint |
| `npm run format` | Prettier |
| `npm run build` | Type-check + build de producción |
