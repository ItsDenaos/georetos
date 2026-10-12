import type { LocateCount } from './locate'
import type { SilhouetteCount } from './silhouetteRules'
import type { Difficulty, RegionId } from './types'

export type GameMode = 'locate' | 'trivia' | 'silhouette'

export interface Miss {
  /** País para repasar. */
  code: string
  /** Texto principal del fallo (nombre o pregunta). */
  label: string
  /** Respuesta correcta o dato extra. */
  detail?: string
  /** Bandera que acompaña al fallo (preguntas de bandera). */
  flag?: string
}

export interface GameResult {
  mode: GameMode
  region: RegionId
  /** Ubica el país y Silueta: cantidad elegida. */
  count?: LocateCount | SilhouetteCount
  /** Trivia: dificultad y temporizador. */
  difficulty?: Difficulty
  timer?: boolean
  seed: string
  /** Partida de "Repasar fallos": no cuenta para los récords. */
  review: boolean
  /** Países de la partida de repaso. */
  only?: string[]
  score: number
  maxScore: number
  correct: number
  total: number
  timeMs: number
  /** Fecha ISO en que terminó la partida. */
  finishedAt?: string
  misses: Miss[]
  isRecord: boolean
  previousBest?: number
}

export interface RecordEntry {
  score: number
  maxScore: number
  timeMs: number
  /** Fecha ISO. */
  date: string
}

/** Clave del récord: modo + región + dificultad (en Ubica el país y Silueta, la cantidad hace de dificultad). */
export function recordKey(result: Pick<GameResult, 'mode' | 'region' | 'count' | 'difficulty'>) {
  const level = result.mode === 'trivia' ? result.difficulty : String(result.count)
  return `${result.mode}|${result.region}|${level}`
}

export function parseRecordKey(key: string) {
  const [mode, region, level] = key.split('|')
  return { mode: mode as GameMode, region: region as RegionId, level: level ?? '' }
}
