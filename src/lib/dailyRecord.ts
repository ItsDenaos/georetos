/**
 * Registro de la silueta diaria en localStorage. Es ligero a propósito: la
 * portada lo usa para mostrar el estado del reto sin cargar los datos de países.
 */
import { SILHOUETTE_ATTEMPTS } from './silhouetteRules'
import { readJson, writeJson } from './storage'

const STORAGE_KEY = 'georetos:v1:silueta-diaria'
/** Días que se guardan (los más recientes). */
const KEEP_DAYS = 60

export interface DailyEntry {
  /** País del día: si los datos cambiaran, un registro viejo no se mezcla con el nuevo. */
  code: string
  /** Códigos escritos, en orden. */
  guesses: string[]
}

export function readDailyEntries(): Record<string, DailyEntry> {
  return readJson<Record<string, DailyEntry>>(STORAGE_KEY, {})
}

export function writeDailyEntries(entries: Record<string, DailyEntry>): Record<string, DailyEntry> {
  const kept = Object.fromEntries(
    Object.keys(entries)
      .sort()
      .slice(-KEEP_DAYS)
      .map((k) => [k, entries[k] as DailyEntry]),
  )
  writeJson(STORAGE_KEY, kept)
  return kept
}

export function dailySummary(entry: DailyEntry | undefined) {
  const guesses = entry?.guesses ?? []
  const solved = entry ? guesses.includes(entry.code) : false
  return { attempts: guesses.length, solved, done: solved || guesses.length >= SILHOUETTE_ATTEMPTS }
}
