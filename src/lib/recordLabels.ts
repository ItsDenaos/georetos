/**
 * Textos de un récord guardado (sellos del pasaporte y lista de "Mi progreso").
 * Ligero: no carga los datos de países.
 */
import { es } from '@/i18n/es'
import { parseRecordKey, type GameMode, type RecordEntry } from './results'
import type { Difficulty, RegionId } from './types'
import type { Variant } from './variants'

export interface RecordLabel {
  key: string
  mode: GameMode
  region: RegionId
  variant: Variant
  /** Partida clásica (con puntaje sobre un máximo). */
  classic: boolean
  /** Modo, con la dificultad en la Trivia contrarreloj. */
  title: string
  regionLabel: string
  /** Cantidad, dificultad, minutos o variante. */
  level: string
  /** "8/10" en la clásica; solo los aciertos en las variantes. */
  score: string
  /** El puntaje para leer en voz alta ("12 aciertos"). */
  scoreLabel: string
  perfect: boolean
  /** Fecha ISO del récord. */
  date: string
  dateLabel: string
}

export function describeRecord(key: string, entry: RecordEntry): RecordLabel {
  const { mode, region, level, variant } = parseRecordKey(key)
  const regionLabel = es.regions[region] ?? region
  const difficultyLabel = es.difficulties[level as Difficulty] ?? level
  const classic = variant === 'clasica'
  const modeLabel = es.records[mode] ?? mode
  // Contrarreloj y Supervivencia: la variante hace de nivel y el puntaje son aciertos.
  const levelLabel = !classic
    ? (es.variants.labels[variant] ?? variant)
    : mode === 'trivia'
      ? difficultyLabel
      : mode === 'silhouette'
        ? es.setup.silhouetteN(Number(level))
        : mode === 'typing'
          ? es.typing.minutes(Number(level))
          : level === 'todos'
            ? es.records.countAll
            : es.records.countN(Number(level))
  const score = classic ? `${entry.score}/${entry.maxScore}` : String(entry.score)
  return {
    key,
    mode,
    region,
    variant,
    classic,
    title: !classic && level !== '-' ? `${modeLabel} · ${difficultyLabel}` : modeLabel,
    regionLabel,
    level: levelLabel,
    score,
    scoreLabel: classic ? score : es.variants.correctCount(entry.score),
    perfect: classic && entry.score === entry.maxScore,
    date: entry.date,
    dateLabel: es.format.date(entry.date),
  }
}
