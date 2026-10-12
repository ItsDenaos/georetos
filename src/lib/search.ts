/**
 * Búsqueda de países por nombre escrito: ignora tildes, mayúsculas, espacios y
 * signos, y acepta alias (Holanda, EE. UU., Birmania…).
 */
import { PLAYABLE } from './countries'
import { compact, normalize } from './normalize'

export interface Suggestion {
  code: string
  name: string
  /** Alias con el que coincidió, si no fue con el nombre. */
  alias?: string
}

interface Entry {
  code: string
  name: string
  keys: { text: string; key: string; words: string[]; isAlias: boolean }[]
}

const index: Entry[] = PLAYABLE.map((c) => ({
  code: c.code,
  name: c.name,
  keys: [c.name, ...c.aliases].map((text, i) => ({
    text,
    key: compact(text),
    words: normalize(text).split(' '),
    isAlias: i > 0,
  })),
}))

const byKey = new Map(index.flatMap((e) => e.keys.map((k) => [k.key, e.code] as const)))

/** País cuyo nombre o alias coincide exactamente con el texto (normalizado). */
export function resolveCountry(text: string): string | null {
  return byKey.get(compact(text)) ?? null
}

/**
 * Sugerencias ordenadas: primero los nombres que empiezan por el texto, luego los
 * que tienen una palabra que empieza así y al final los que lo contienen.
 */
export function searchCountries(
  query: string,
  exclude: ReadonlySet<string> = new Set(),
  limit = 6,
): Suggestion[] {
  const q = compact(query)
  if (!q) return []
  const firstWord = normalize(query).split(' ')[0] ?? q
  const results: (Suggestion & { rank: number })[] = []
  for (const entry of index) {
    if (exclude.has(entry.code)) continue
    let best: { rank: number; alias?: string } | null = null
    for (const k of entry.keys) {
      let rank: number
      if (k.key.startsWith(q)) rank = 0
      else if (k.words.some((w) => w.startsWith(firstWord)) && k.key.includes(q)) rank = 1
      else if (k.key.includes(q)) rank = 2
      else continue
      // A igual posición, gana el nombre sobre el alias.
      const score = rank * 2 + (k.isAlias ? 1 : 0)
      if (!best || score < best.rank) best = { rank: score, alias: k.isAlias ? k.text : undefined }
    }
    if (best)
      results.push({ code: entry.code, name: entry.name, alias: best.alias, rank: best.rank })
  }
  return results
    .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name, 'es'))
    .slice(0, limit)
    .map(({ code, name, alias }) => ({ code, name, alias }))
}
