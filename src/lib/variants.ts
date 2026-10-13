/**
 * Variantes de partida para "Ubica el país" y la Trivia, como reglas puras:
 * - Contrarreloj: 60 segundos; cada fallo resta 3 segundos.
 * - Supervivencia: preguntas sin fin y 3 vidas; la dificultad sube cada 5 aciertos.
 * La partida clásica (cantidad fija de preguntas) no usa este módulo.
 */
import type { Difficulty, RegionId } from './types'

export const VARIANTS = ['clasica', 'contrarreloj', 'supervivencia'] as const
export type Variant = (typeof VARIANTS)[number]
export type RunVariant = Exclude<Variant, 'clasica'>

export const TIME_ATTACK_MS = 60_000
export const TIME_PENALTY_MS = 3_000
export const SURVIVAL_LIVES = 3
/** Aciertos para subir de nivel en Supervivencia. */
export const LEVEL_EVERY = 5
const LEVELS: readonly Difficulty[] = ['facil', 'media', 'dificil']

export type RunMode = 'locate' | 'trivia'

/** Configuración de una partida sin cantidad fija. */
export interface RunConfig {
  mode: RunMode
  variant: RunVariant
  region: RegionId
  /** Trivia en Contrarreloj: dificultad elegida (en Supervivencia sube sola). */
  difficulty: Difficulty
  seed: string
}

export function isVariant(value: unknown): value is Variant {
  return typeof value === 'string' && (VARIANTS as readonly string[]).includes(value)
}

export interface RunState {
  variant: RunVariant
  correct: number
  misses: number
  /** Supervivencia: vidas que quedan. */
  lives: number
  /** Contrarreloj: tiempo restado por los fallos. */
  penaltyMs: number
  over: boolean
}

export function createRun(variant: RunVariant): RunState {
  return { variant, correct: 0, misses: 0, lives: SURVIVAL_LIVES, penaltyMs: 0, over: false }
}

export function applyCorrect(state: RunState): RunState {
  if (state.over) return state
  return { ...state, correct: state.correct + 1 }
}

/** Un fallo: en Contrarreloj resta tiempo; en Supervivencia, una vida. */
export function applyMiss(state: RunState): RunState {
  if (state.over) return state
  const misses = state.misses + 1
  if (state.variant === 'contrarreloj') {
    return { ...state, misses, penaltyMs: state.penaltyMs + TIME_PENALTY_MS }
  }
  const lives = state.lives - 1
  return { ...state, misses, lives, over: lives <= 0 }
}

/** Contrarreloj: milisegundos que quedan tras `elapsedMs` de partida. */
export function remainingMs(state: RunState, elapsedMs: number): number {
  return Math.max(0, TIME_ATTACK_MS - elapsedMs - state.penaltyMs)
}

/** Termina la partida (por ejemplo, al acabarse el tiempo o las preguntas). */
export function endRun(state: RunState): RunState {
  return state.over ? state : { ...state, over: true }
}

/** Nivel de Supervivencia: 0, 1 o 2 (sube cada 5 aciertos y se queda en el último). */
export function levelOf(correct: number): number {
  return Math.min(LEVELS.length - 1, Math.floor(correct / LEVEL_EVERY))
}

export function difficultyOfLevel(level: number): Difficulty {
  return LEVELS[Math.max(0, Math.min(level, LEVELS.length - 1))] as Difficulty
}
