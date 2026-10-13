/**
 * Rachas de días seguidos. Trabaja con números de día (ver dayNumber en
 * lib/daily.ts), así no depende de husos horarios ni de cambios de hora.
 */
export interface Streak {
  /** Días seguidos hasta hoy; si hoy aún no se jugó, cuenta hasta ayer. */
  current: number
  /** La racha más larga del historial. */
  best: number
  /** ¿Ya se jugó hoy? */
  playedToday: boolean
}

export function computeStreak(playedDays: Iterable<number>, today: number): Streak {
  const days = new Set(playedDays)
  const playedToday = days.has(today)

  let current = 0
  for (let day = playedToday ? today : today - 1; days.has(day); day--) current++

  let best = 0
  for (const day of days) {
    // Solo se cuenta desde el inicio de cada racha.
    if (days.has(day - 1)) continue
    let length = 1
    while (days.has(day + length)) length++
    best = Math.max(best, length)
  }
  return { current, best, playedToday }
}
