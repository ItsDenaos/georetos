/**
 * Reto diario: la fecha local del dispositivo define la semilla y el número del
 * reto. Lo comparten todos los modos que quieran tener versión diaria.
 */
import { createRng } from './rng'

/** Día del reto nº 1. */
export const DAILY_EPOCH = '2026-10-12'
const DAY_MS = 86_400_000

/** Fecha local como "AAAA-MM-DD". */
export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Días entre dos fechas "AAAA-MM-DD" (sin husos horarios de por medio). */
function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS)
}

export interface DailyChallenge {
  /** Fecha local "AAAA-MM-DD". */
  key: string
  /** Número del reto (el 12 de octubre de 2026 es el 1). */
  number: number
  /** Semilla del día, por ejemplo "diario-2026-10-12". */
  seed: string
}

export function dailyChallenge(date: Date = new Date()): DailyChallenge {
  const key = localDateKey(date)
  return { key, number: daysBetween(DAILY_EPOCH, key) + 1, seed: `diario-${key}` }
}

/**
 * Elemento del día dentro de una lista: se recorre una permutación fija por
 * ciclos, así no se repite ninguno hasta agotarlos todos. Cada ciclo se baraja
 * con su propia semilla.
 */
export function pickForDay<T>(items: readonly T[], day: number, salt: string): T {
  if (items.length === 0) throw new Error('pickForDay() con una lista vacía')
  const index = (((day - 1) % items.length) + items.length) % items.length
  const cycle = Math.floor((day - 1) / items.length)
  return createRng(`${salt}|ciclo-${cycle}`).shuffle(items)[index] as T
}

/** Milisegundos que faltan para la medianoche local. */
export function msUntilNextDay(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return next.getTime() - now.getTime()
}
