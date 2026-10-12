/** Lógica pura del modo "Ubica el país" (sin Vue, para poder probarla). */
import { getCountry, playableIn } from './countries'
import type { Rng } from './rng'
import { MAX_ATTEMPTS, locatePoints } from './scoring'
import type { RegionId } from './types'

export type LocateCount = 10 | 20 | 'todos'

export interface LocateConfig {
  region: RegionId
  count: LocateCount
  seed: string
  /** Partida de repaso: solo estos países. */
  only?: string[]
}

/** Lista barajada de países a encontrar, sin pasar de los disponibles. */
export function buildLocateQueue(config: LocateConfig, rng: Rng): string[] {
  const pool = config.only
    ? config.only.filter((code) => getCountry(code)?.playable)
    : playableIn(config.region).map((c) => c.code)
  const unique = [...new Set(pool)]
  const shuffled = rng.shuffle(unique)
  const limit = config.only || config.count === 'todos' ? shuffled.length : config.count
  return shuffled.slice(0, Math.min(limit, shuffled.length))
}

export type LocateOutcome =
  | { kind: 'correct'; attempt: number; points: number }
  | { kind: 'wrong'; guessed: string; attemptsLeft: number }
  | { kind: 'failed'; guessed: string | null }

/** Resultado de tocar un país (attemptsUsed = intentos fallidos previos). */
export function evaluateGuess(
  target: string,
  guessed: string,
  attemptsUsed: number,
): LocateOutcome {
  const attempt = attemptsUsed + 1
  if (guessed === target) return { kind: 'correct', attempt, points: locatePoints(attempt) }
  if (attempt >= MAX_ATTEMPTS) return { kind: 'failed', guessed }
  return { kind: 'wrong', guessed, attemptsLeft: MAX_ATTEMPTS - attempt }
}
