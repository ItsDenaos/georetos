/** Texto para compartir el resultado del Reto diario. */
import { es } from '@/i18n/es'
import type { AnswerMark } from './results'

export const MARK_EMOJI: Record<AnswerMark, string> = { ok: '🟩', meh: '🟨', fail: '🟥' }

export function emojiRow(marks: readonly AnswerMark[]): string {
  return marks.map((m) => MARK_EMOJI[m]).join('')
}

export interface DailyShareData {
  number: number
  score: number
  max: number
  marks: readonly AnswerMark[]
  /** Racha actual (solo se menciona desde 2 días). */
  streak: number
  url: string
}

export function dailyShareText(data: DailyShareData): string {
  return es.daily.shareText(
    data.number,
    data.score,
    data.max,
    data.streak,
    emojiRow(data.marks),
    data.url,
  )
}
