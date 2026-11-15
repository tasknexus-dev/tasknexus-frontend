import { isAxiosError } from 'axios'

export interface FieldError {
  field: string
  message: string
}

/** Error de la API normalizado a partir de un ProblemDetail (RFC 9457) del backend. */
export interface Problem {
  /** Código HTTP, o 0 si no hubo respuesta. */
  status: number
  /** Código estable del backend (`auth.invalid-credentials`, `validation.failed`…). */
  code: string
  /** Mensaje legible para el usuario. */
  detail: string
  /** Errores por campo en las validaciones (400). */
  errors: FieldError[]
}

interface ProblemBody {
  code?: string
  detail?: string
  errors?: FieldError[]
}

export function toProblem(error: unknown): Problem {
  if (isAxiosError<ProblemBody>(error)) {
    if (!error.response) {
      return {
        status: 0,
        code: 'network',
        detail: 'No se pudo conectar con el servidor. Comprueba tu conexión.',
        errors: [],
      }
    }
    const body = error.response.data ?? {}
    return {
      status: error.response.status,
      code: body.code ?? `http.${error.response.status}`,
      detail: body.detail ?? 'Ha ocurrido un error inesperado. Inténtalo de nuevo.',
      errors: Array.isArray(body.errors) ? body.errors : [],
    }
  }
  return {
    status: 0,
    code: 'unknown',
    detail: 'Ha ocurrido un error inesperado. Inténtalo de nuevo.',
    errors: [],
  }
}

/** Errores por campo indexados por nombre (el primero de cada campo). */
export function fieldErrors(problem: Problem | null): Record<string, string> {
  const result: Record<string, string> = {}
  for (const { field, message } of problem?.errors ?? []) {
    result[field] ??= message
  }
  return result
}
