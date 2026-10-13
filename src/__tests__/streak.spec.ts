import { describe, expect, it } from 'vitest'

import { dayNumber } from '@/lib/daily'
import { computeStreak } from '@/lib/streak'

describe('rachas de días seguidos', () => {
  it('sin partidas no hay racha', () => {
    expect(computeStreak([], 10)).toEqual({ current: 0, best: 0, playedToday: false })
  })

  it('cuenta los días seguidos hasta hoy', () => {
    expect(computeStreak([8, 9, 10], 10)).toEqual({ current: 3, best: 3, playedToday: true })
  })

  it('si hoy aún no se jugó, la racha de ayer sigue viva', () => {
    expect(computeStreak([7, 8, 9], 10)).toEqual({ current: 3, best: 3, playedToday: false })
  })

  it('un día sin jugar corta la racha, pero la mejor se recuerda', () => {
    expect(computeStreak([1, 2, 3, 4, 7, 8], 10)).toEqual({
      current: 0,
      best: 4,
      playedToday: false,
    })
    expect(computeStreak([1, 2, 3, 4, 9, 10], 10)).toEqual({
      current: 2,
      best: 4,
      playedToday: true,
    })
  })

  it('ignora días repetidos y el orden', () => {
    expect(computeStreak([10, 9, 9, 8, 10], 10).current).toBe(3)
  })

  it('los números de día son consecutivos aunque cambie el mes o el año', () => {
    expect(dayNumber('2026-10-12')).toBe(1)
    expect(dayNumber('2026-10-31') + 1).toBe(dayNumber('2026-11-01'))
    expect(dayNumber('2026-12-31') + 1).toBe(dayNumber('2027-01-01'))
    // Cambio de hora en Europa (29 de marzo de 2026 / 28 de marzo de 2027): sin saltos.
    expect(dayNumber('2027-03-27') + 2).toBe(dayNumber('2027-03-29'))
  })
})
