/**
 * Registro del Reto diario en localStorage. Es ligero a propósito: la portada lo
 * usa para mostrar el estado del reto y la racha sin cargar los datos de países.
 */
import type { AnswerMark } from './results'
import { readJson, writeJson } from './storage'
import { computeStreak, type Streak } from './streak'

export const STORAGE_KEY = 'georetos:v1:reto-diario'

export interface DailyChallengeAnswer {
  /** País de la pregunta. */
  code: string
  mark: AnswerMark
  points: number
  /** Trivia: opción elegida. */
  chosen?: number
}

export interface DailyChallengeDay {
  /** Número del reto (ver lib/daily.ts). */
  number: number
  answers: DailyChallengeAnswer[]
  /** Toques equivocados en la pregunta de mapa en curso (para que recargar no los reinicie). */
  attempts: number
  startedAt: string
  finishedAt?: string
}

export function readDailyChallengeDays(): Record<string, DailyChallengeDay> {
  return readJson<Record<string, DailyChallengeDay>>(STORAGE_KEY, {})
}

export function writeDailyChallengeDays(
  days: Record<string, DailyChallengeDay>,
): Record<string, DailyChallengeDay> {
  writeJson(STORAGE_KEY, days)
  return days
}

export function dailyChallengeSummary(day: DailyChallengeDay | undefined, length: number) {
  const answered = day?.answers.length ?? 0
  return {
    started: day !== undefined,
    answered,
    finished: answered >= length,
    score: day?.answers.reduce((sum, a) => sum + a.points, 0) ?? 0,
  }
}

/** Racha de días seguidos con el reto terminado. */
export function dailyChallengeStreak(
  days: Record<string, DailyChallengeDay>,
  today: number,
): Streak {
  const finished = Object.values(days).flatMap((d) => (d.finishedAt ? [d.number] : []))
  return computeStreak(finished, today)
}
