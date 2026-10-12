/** Lógica pura del modo "Silueta" (sin Vue, para poder probarla). */
import { PLAYABLE, getCountry, inRegion } from './countries'
import { pickForDay } from './daily'
import { bearingDeg, distanceKm } from './geo'
import type { Rng } from './rng'
import type { Country, RegionId } from './types'

import { SILHOUETTE_ATTEMPTS, type SilhouetteCount } from './silhouetteRules'

export { SILHOUETTE_ATTEMPTS, SILHOUETTE_COUNTS, type SilhouetteCount } from './silhouetteRules'

/** Países con silueta reconocible (sin microestados ni países sin forma), en orden alfabético. */
export const SILHOUETTE_POOL: readonly Country[] = PLAYABLE.filter((c) => c.silhouette)

export function silhouettePool(region: RegionId): Country[] {
  return SILHOUETTE_POOL.filter((c) => inRegion(c, region))
}

export interface SilhouetteConfig {
  region: RegionId
  count: SilhouetteCount
  seed: string
  /** Partida de repaso: solo estos países (si tienen silueta). */
  only?: string[]
}

/** Siluetas de la partida, barajadas y sin pasar de las disponibles. */
export function buildSilhouetteQueue(config: SilhouetteConfig, rng: Rng): string[] {
  const pool = config.only
    ? [...new Set(config.only)].filter((code) => getCountry(code)?.silhouette)
    : silhouettePool(config.region).map((c) => c.code)
  const shuffled = rng.shuffle(pool)
  return config.only ? shuffled : shuffled.slice(0, config.count)
}

export interface Guess {
  code: string
  correct: boolean
  /** Distancia entre centroides, en km (0 si acertó). */
  distanceKm: number
  /** Rumbo desde el país escrito hacia el correcto (0 = norte). */
  bearing: number
}

export function evaluateGuess(target: string, guess: string): Guess {
  const from = getCountry(guess)
  const to = getCountry(target)
  if (!from || !to) throw new Error(`País desconocido: ${guess} → ${target}`)
  if (guess === target) return { code: guess, correct: true, distanceKm: 0, bearing: 0 }
  return {
    code: guess,
    correct: false,
    distanceKm: Math.round(distanceKm(from.centroid, to.centroid)),
    bearing: Math.round(bearingDeg(from.centroid, to.centroid)),
  }
}

/** Estado de una silueta a partir de los intentos. */
export function roundState(guesses: readonly Guess[]) {
  const solved = guesses.some((g) => g.correct)
  return {
    solved,
    done: solved || guesses.length >= SILHOUETTE_ATTEMPTS,
    attemptsLeft: SILHOUETTE_ATTEMPTS - guesses.length,
  }
}

/** País de la silueta diaria para el reto número `day` (ver lib/daily.ts). */
export function dailySilhouetteCode(day: number): string {
  return pickForDay(
    SILHOUETTE_POOL.map((c) => c.code),
    day,
    'georetos|silueta-diaria',
  )
}
