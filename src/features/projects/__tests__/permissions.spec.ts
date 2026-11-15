import { describe, expect, it } from 'vitest'

import type { ProjectRole } from '../api'
import { assignableRoles, canAssign, canManageMembers, canManageProject } from '../permissions'
import { normalizeKey, suggestKey } from '../projectKey'

describe('permisos (copia de ProjectRole.java)', () => {
  it.each<[ProjectRole, boolean, boolean]>([
    ['OWNER', true, true],
    ['ADMIN', true, false],
    ['MEMBER', false, false],
    ['VIEWER', false, false],
  ])('%s: gestiona miembros=%s, gestiona proyecto=%s', (role, members, project) => {
    expect(canManageMembers(role)).toBe(members)
    expect(canManageProject(role)).toBe(project)
  })

  it('nadie asigna el rol de propietario', () => {
    for (const actor of ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as const) {
      expect(canAssign(actor, 'OWNER')).toBe(false)
    }
  })

  it('el administrador solo gestiona miembros y observadores', () => {
    expect(assignableRoles('OWNER')).toEqual(['ADMIN', 'MEMBER', 'VIEWER'])
    expect(assignableRoles('ADMIN')).toEqual(['MEMBER', 'VIEWER'])
    expect(assignableRoles('MEMBER')).toEqual([])
    expect(canAssign('ADMIN', 'ADMIN')).toBe(false)
  })
})

describe('clave del proyecto', () => {
  it.each([
    ['Portal web', 'PW'],
    ['Gestión', 'GES'],
    ['  app   móvil  2026 ', 'AM2'],
    ['2026 plan', 'P'],
    ['', ''],
  ])('propone una clave para "%s"', (name, key) => {
    expect(suggestKey(name)).toBe(key)
  })

  it('normaliza lo que escribe el usuario', () => {
    expect(normalizeKey('tn-42 abc')).toBe('TN42ABC')
    expect(normalizeKey('abcdefghijklmn')).toBe('ABCDEFGHIJ')
  })
})
