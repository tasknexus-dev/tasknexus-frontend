import { describe, expect, it } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'

import { fieldErrors, toProblem } from '../problem'

function errorWith(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() }
  return new AxiosError('fail', 'ERR', config, null, {
    status,
    statusText: '',
    data,
    headers: {},
    config,
  })
}

describe('toProblem', () => {
  it('lee el ProblemDetail del backend', () => {
    const problem = toProblem(
      errorWith(400, {
        code: 'validation.failed',
        detail: 'Datos no válidos',
        errors: [
          { field: 'email', message: 'El correo no es válido' },
          { field: 'email', message: 'Otro mensaje' },
        ],
      }),
    )

    expect(problem).toMatchObject({ status: 400, code: 'validation.failed' })
    expect(fieldErrors(problem)).toEqual({ email: 'El correo no es válido' })
  })

  it('distingue la falta de conexión', () => {
    const problem = toProblem(new AxiosError('Network Error', 'ERR_NETWORK'))

    expect(problem.code).toBe('network')
    expect(problem.status).toBe(0)
  })

  it('da un mensaje genérico si la respuesta no es un ProblemDetail', () => {
    expect(toProblem(errorWith(502, '<html>'))).toMatchObject({ status: 502, code: 'http.502' })
    expect(toProblem(new Error('boom')).code).toBe('unknown')
  })
})
