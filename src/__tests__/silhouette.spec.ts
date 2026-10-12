import { describe, expect, it } from 'vitest'

import { compassPoint } from '@/lib/geo'
import { createRng } from '@/lib/rng'
import { maxScore, silhouettePoints } from '@/lib/scoring'
import {
  SILHOUETTE_ATTEMPTS,
  SILHOUETTE_POOL,
  buildSilhouetteQueue,
  evaluateGuess,
  roundState,
  silhouettePool,
} from '@/lib/silhouette'

describe('modo Silueta', () => {
  it('da 6 puntos al primer intento y 1 al sexto; 0 si no se adivina', () => {
    expect([1, 2, 3, 4, 5, 6].map((n) => silhouettePoints(n, true))).toEqual([6, 5, 4, 3, 2, 1])
    expect(silhouettePoints(6, false)).toBe(0)
    expect(silhouettePoints(7, true)).toBe(0)
    expect(maxScore('silhouette', 5)).toBe(30)
  })

  it('un intento correcto tiene distancia 0', () => {
    expect(evaluateGuess('pe', 'pe')).toEqual({
      code: 'pe',
      correct: true,
      distanceKm: 0,
      bearing: 0,
    })
  })

  it('un intento fallido da distancia y rumbo hacia el país correcto', () => {
    const guess = evaluateGuess('sr', 'pe')
    expect(guess.correct).toBe(false)
    expect(guess.distanceKm).toBeGreaterThan(2000)
    expect(guess.distanceKm).toBeLessThan(3000)
    expect(compassPoint(guess.bearing)).toBe('ne')
    // Desde Canadá, Estados Unidos queda al sur.
    expect(compassPoint(evaluateGuess('us', 'ca').bearing)).toBe('s')
  })

  it('termina al acertar o tras 6 intentos', () => {
    const miss = evaluateGuess('pe', 'cl')
    expect(roundState([])).toEqual({ solved: false, done: false, attemptsLeft: 6 })
    expect(roundState([miss, evaluateGuess('pe', 'pe')])).toMatchObject({
      solved: true,
      done: true,
    })
    const six = Array.from({ length: SILHOUETTE_ATTEMPTS }, () => miss)
    expect(roundState(six)).toEqual({ solved: false, done: true, attemptsLeft: 0 })
  })

  it('el grupo de siluetas deja fuera microestados y países sin forma', () => {
    const codes = SILHOUETTE_POOL.map((c) => c.code)
    expect(codes).toHaveLength(173)
    for (const code of ['va', 'mc', 'sm', 'tv', 'nr']) expect(codes).not.toContain(code)
    for (const code of ['fr', 'us', 'ec', 'id', 'ca']) expect(codes).toContain(code)
  })

  it('arma la partida con la cantidad pedida, sin repetir y de la región', () => {
    const queue = buildSilhouetteQueue({ region: 'europa', count: 10, seed: 'x' }, createRng('x'))
    expect(queue).toHaveLength(10)
    expect(new Set(queue).size).toBe(10)
    const europe = new Set(silhouettePool('europa').map((c) => c.code))
    expect(queue.every((code) => europe.has(code))).toBe(true)
  })

  it('en un repaso usa solo países con silueta', () => {
    const queue = buildSilhouetteQueue(
      { region: 'mundo', count: 5, seed: 'x', only: ['co', 'va', 'pe', 'co'] },
      createRng('x'),
    )
    expect([...queue].sort()).toEqual(['co', 'pe'])
  })
})
