import { describe, expect, it } from 'vitest'

import { dailyChallenge, msUntilNextDay, pickForDay } from '@/lib/daily'
import { dailySummary } from '@/lib/dailyRecord'
import { SILHOUETTE_POOL, dailySilhouetteCode } from '@/lib/silhouette'

describe('reto diario', () => {
  it('el 12 de octubre de 2026 es el reto nº 1, con su semilla', () => {
    expect(dailyChallenge(new Date(2026, 9, 12, 10, 30))).toEqual({
      key: '2026-10-12',
      number: 1,
      seed: 'diario-2026-10-12',
    })
    expect(dailyChallenge(new Date(2026, 9, 13, 0, 1)).number).toBe(2)
    expect(dailyChallenge(new Date(2027, 0, 1, 12)).number).toBe(82)
  })

  it('usa la fecha local: las 23:59 siguen siendo el mismo día', () => {
    expect(dailyChallenge(new Date(2026, 9, 12, 23, 59)).key).toBe('2026-10-12')
    expect(dailyChallenge(new Date(2026, 9, 12, 0, 0)).key).toBe('2026-10-12')
  })

  it('cuenta lo que falta para la medianoche local', () => {
    expect(msUntilNextDay(new Date(2026, 9, 12, 23, 0, 0))).toBe(3_600_000)
  })

  it('no repite ningún elemento hasta agotar la lista', () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
    const firstCycle = Array.from({ length: 7 }, (_, i) => pickForDay(items, i + 1, 'prueba'))
    expect([...firstCycle].sort()).toEqual(items)
    const secondCycle = Array.from({ length: 7 }, (_, i) => pickForDay(items, i + 8, 'prueba'))
    expect([...secondCycle].sort()).toEqual(items)
    expect(pickForDay(items, 3, 'prueba')).toBe(firstCycle[2])
  })

  it('la silueta del día es determinista y no se repite en un ciclo', () => {
    const days = Array.from({ length: SILHOUETTE_POOL.length }, (_, i) =>
      dailySilhouetteCode(i + 1),
    )
    expect(new Set(days).size).toBe(SILHOUETTE_POOL.length)
    expect(dailySilhouetteCode(1)).toBe(days[0])
    const pool = new Set(SILHOUETTE_POOL.map((c) => c.code))
    expect(days.every((code) => pool.has(code))).toBe(true)
  })

  it('resume el registro guardado sin cargar los países', () => {
    expect(dailySummary(undefined)).toEqual({ attempts: 0, solved: false, done: false })
    expect(dailySummary({ code: 'ca', guesses: ['us', 'ca'] })).toEqual({
      attempts: 2,
      solved: true,
      done: true,
    })
    const six = { code: 'ca', guesses: ['us', 'mx', 'br', 'ar', 'cl', 'pe'] }
    expect(dailySummary(six)).toEqual({ attempts: 6, solved: false, done: true })
  })
})
