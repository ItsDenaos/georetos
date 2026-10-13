import type { LocateCount } from './locate'
import type { SilhouetteCount } from './silhouetteRules'
import type { TypingMinutes } from './typing'
import type { Difficulty, RegionId } from './types'
import type { Variant } from './variants'

export type GameMode = 'locate' | 'trivia' | 'silhouette' | 'typing'

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

/** Cómo terminó una pregunta: acierto, acierto tardío o fallo. */
export type AnswerMark = 'ok' | 'meh' | 'fail'

/** Resultado de una pregunta de la partida, en orden. */
export interface Answer {
  /** País del que trataba. */
  code: string
  mark: AnswerMark
}

export interface GameResult {
  mode: GameMode
  /** Clásica (por defecto), Contrarreloj o Supervivencia. */
  variant?: Variant
  region: RegionId
  /** Ubica el país y Silueta: cantidad elegida. Escribe los países: minutos. */
  count?: LocateCount | SilhouetteCount | TypingMinutes
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
  /** Cada pregunta en orden (opcional: los resultados guardados antes de esta versión no lo traen). */
  answers?: Answer[]
  /** Supervivencia: nivel alcanzado (0 = fácil, 1 = media, 2 = difícil). */
  reachedLevel?: number
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

/**
 * Clave del récord: modo + región + dificultad (en Ubica el país y Silueta, la
 * cantidad hace de dificultad; en Escribe los países, los minutos) + variante. Las partidas clásicas conservan la
 * clave de siempre, así no se pierden los récords guardados.
 */
export function recordKey(
  result: Pick<GameResult, 'mode' | 'region' | 'count' | 'difficulty' | 'variant'>,
) {
  const variant = result.variant ?? 'clasica'
  if (variant === 'clasica') {
    const level = result.mode === 'trivia' ? result.difficulty : String(result.count)
    return `${result.mode}|${result.region}|${level}`
  }
  // Sin cantidad fija: solo la Trivia en Contrarreloj tiene dificultad elegida.
  const level = result.mode === 'trivia' && variant === 'contrarreloj' ? result.difficulty : '-'
  return `${result.mode}|${result.region}|${level}|${variant}`
}

export function parseRecordKey(key: string) {
  const [mode, region, level, variant] = key.split('|')
  return {
    mode: mode as GameMode,
    region: region as RegionId,
    level: level ?? '',
    variant: (variant ?? 'clasica') as Variant,
  }
}
