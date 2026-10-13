/** Reglas de puntaje de los modos. */
import type { GameMode } from './results'
import { SILHOUETTE_ATTEMPTS } from './silhouetteRules'

export const MAX_ATTEMPTS = 3

/** Ubica el país: 3 puntos al primer intento, 2 al segundo, 1 al tercero. */
export function locatePoints(attempt: number): number {
  if (!Number.isInteger(attempt) || attempt < 1 || attempt > MAX_ATTEMPTS) return 0
  return MAX_ATTEMPTS + 1 - attempt
}

/** Trivia: 1 punto por acierto. */
export function triviaPoints(correct: boolean): number {
  return correct ? 1 : 0
}

/** Silueta: 6 puntos al primer intento, 5 al segundo… 1 al sexto; 0 si no la adivinas. */
export function silhouettePoints(attempt: number, solved: boolean): number {
  if (!solved || !Number.isInteger(attempt) || attempt < 1 || attempt > SILHOUETTE_ATTEMPTS)
    return 0
  return SILHOUETTE_ATTEMPTS + 1 - attempt
}

export function maxScore(mode: GameMode, questions: number): number {
  if (mode === 'locate') return questions * MAX_ATTEMPTS
  if (mode === 'silhouette') return questions * SILHOUETTE_ATTEMPTS
  return questions
}

export interface ScoreEntry {
  score: number
  maxScore: number
  timeMs: number
}

/**
 * Mejor puntaje; si empatan, gana la partida con menos preguntas respondidas
 * (en Contrarreloj y Supervivencia, la de menos fallos; en la clásica siempre
 * coinciden) y, después, la de menor tiempo.
 */
export function isBetter(candidate: ScoreEntry, current: ScoreEntry | undefined): boolean {
  if (!current) return true
  if (candidate.score !== current.score) return candidate.score > current.score
  if (candidate.maxScore !== current.maxScore) return candidate.maxScore < current.maxScore
  return candidate.timeMs < current.timeMs
}
