/**
 * "Escribe los países": reglas puras para reconocer lo que se escribe.
 *
 * - Ignora tildes, mayúsculas, espacios y signos, y acepta alias (EE. UU.,
 *   Holanda, Birmania…), igual que la Silueta.
 * - Un país se acepta sin Enter en cuanto lo escrito es su nombre.
 * - Si ese nombre es además el comienzo de otro aún pendiente (Guinea → Guinea
 *   Ecuatorial, Níger → Nigeria, Trinidad → Trinidad y Tobago), se espera a que
 *   se deje de escribir (PREFIX_WAIT_MS) o se pulse Enter.
 * - Lo que se sigue escribiendo justo después de un acierto se une a él: así
 *   "Sudán" + " del Sur" encuentra Sudán del Sur, y "Trinidad" + " y Tobago" no
 *   deja restos en el campo.
 */
import { PLAYABLE, playableIn } from './countries'
import { compact } from './normalize'
import type { RegionId } from './types'

export const TYPING_MINUTES = [5, 10, 15] as const
export type TypingMinutes = (typeof TYPING_MINUTES)[number]

export interface TypingConfig {
  region: RegionId
  minutes: TypingMinutes
}

/** Espera sin teclear antes de aceptar un nombre que es el comienzo de otro. */
export const PREFIX_WAIT_MS = 700

export function isTypingMinutes(value: number): value is TypingMinutes {
  return (TYPING_MINUTES as readonly number[]).includes(value)
}

/** Nombre y alias normalizados de cada país jugable. */
const KEYS = new Map(
  PLAYABLE.map((c) => [c.code, [...new Set([c.name, ...c.aliases].map(compact))]] as const),
)
const CODE_BY_KEY = new Map(
  [...KEYS].flatMap(([code, keys]) => keys.map((key) => [key, code] as const)),
)

export interface TypingIndex {
  region: RegionId
  /** Países de la región, en orden alfabético. */
  codes: readonly string[]
  /** Nombre o alias normalizado → país (solo los de la región). */
  byKey: ReadonlyMap<string, string>
}

export function createTypingIndex(region: RegionId): TypingIndex {
  const codes = playableIn(region).map((c) => c.code)
  const byKey = new Map(
    codes.flatMap((code) => (KEYS.get(code) ?? []).map((key) => [key, code] as const)),
  )
  return { region, codes, byKey }
}

/** El último país aceptado y el texto con que se aceptó. */
export interface Carry {
  code: string
  text: string
}

export type TypedResult =
  /** Aceptar ya (`match`) o cuando se deje de escribir (`wait`); `text` es lo que se aceptó. */
  | { kind: 'match' | 'wait'; code: string; text: string }
  /** Completó el nombre largo del país recién aceptado: vaciar el campo sin más. */
  | { kind: 'absorb'; text: string }
  /** Sigue escribiendo tras un acierto, camino de un nombre más largo. */
  | { kind: 'continuing' }
  /** Ya encontrado, o un país que no es de la región. */
  | { kind: 'repeat' | 'outside'; code: string }
  | { kind: 'none' }

const NONE: TypedResult = { kind: 'none' }

/** ¿Hay otro nombre de un país pendiente que empiece por `key`? */
function leadsOn(index: TypingIndex, key: string, found: ReadonlySet<string>): boolean {
  for (const [other, code] of index.byKey) {
    if (other !== key && other.startsWith(key) && !found.has(code)) return true
  }
  return false
}

function readAlone(index: TypingIndex, text: string, found: ReadonlySet<string>): TypedResult {
  const key = compact(text)
  if (!key) return NONE
  const code = index.byKey.get(key)
  const more = leadsOn(index, key, found)
  if (code && !found.has(code)) return { kind: more ? 'wait' : 'match', code, text }
  // Va camino de otro nombre: no hay nada que avisar todavía.
  if (more) return NONE
  if (code) return { kind: 'repeat', code }
  const other = CODE_BY_KEY.get(key)
  return other ? { kind: 'outside', code: other } : NONE
}

/**
 * Qué hacer con el texto del campo. `found` son los países ya encontrados y
 * `carry`, el último aceptado (si después se siguió escribiendo).
 */
export function readTyped(
  index: TypingIndex,
  text: string,
  found: ReadonlySet<string>,
  carry?: Carry | null,
): TypedResult {
  if (!carry) return readAlone(index, text, found)

  const joined = carry.text + text
  const together = readAlone(index, joined, found)
  if (together.kind === 'match' || together.kind === 'wait') return together
  const alone = readAlone(index, text, found)
  if (alone.kind === 'match' || alone.kind === 'wait') return alone

  const key = compact(joined)
  const own = KEYS.get(carry.code) ?? []
  const base = compact(carry.text)
  if (key !== base && own.includes(key)) return { kind: 'absorb', text: joined }
  if (key === base || own.some((k) => k.startsWith(key)) || leadsOn(index, key, found)) {
    return { kind: 'continuing' }
  }
  return alone
}
