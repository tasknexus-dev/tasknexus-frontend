import axios from 'axios'

/**
 * Cliente HTTP único de la aplicación.
 * Las rutas son relativas: en desarrollo las atiende el proxy de Vite y en producción nginx.
 * En la Etapa 3 se añaden aquí los interceptores de JWT y refresh token.
 */
export const http = axios.create({
  baseURL: '/',
  timeout: 10_000,
  headers: { Accept: 'application/json' },
})
