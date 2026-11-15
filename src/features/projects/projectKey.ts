/** Deja solo lo que admite una clave mientras se escribe: mayúsculas y dígitos, máximo 10. */
export function normalizeKey(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10)
}

/**
 * Propone una clave a partir del nombre: iniciales si hay varias palabras ("Portal web" → "PW"),
 * o las tres primeras letras si hay una sola ("Gestión" → "GES").
 */
export function suggestKey(name: string): string {
  const words = name
    .normalize('NFD')
    .replace(/[^A-Za-z0-9\s]/g, '')
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
  const initials = words.map((word) => word[0]).join('')
  const candidate = initials.length >= 2 ? initials : (words[0] ?? '').slice(0, 3)
  return candidate.replace(/^[0-9]+/, '').slice(0, 10)
}
