import { describe, expect, it } from 'vitest'

import { playableIn } from '@/lib/countries'
import { buildLocateQueue, evaluateGuess } from '@/lib/locate'
import { createRng } from '@/lib/rng'
import { isBetter, locatePoints, maxScore, triviaPoints } from '@/lib/scoring'

describe('puntaje de Ubica el país', () => {
  it('da 3, 2 y 1 puntos según el intento', () => {
    expect(locatePoints(1)).toBe(3)
    expect(locatePoints(2)).toBe(2)
    expect(locatePoints(3)).toBe(1)
  })

  it('no da puntos fuera de los 3 intentos', () => {
    expect(locatePoints(0)).toBe(0)
    expect(locatePoints(4)).toBe(0)
    expect(locatePoints(1.5)).toBe(0)
  })

  it('evalúa la secuencia de intentos', () => {
    expect(evaluateGuess('co', 'co', 0)).toEqual({ kind: 'correct', attempt: 1, points: 3 })
    expect(evaluateGuess('co', 'ec', 0)).toEqual({ kind: 'wrong', guessed: 'ec', attemptsLeft: 2 })
    expect(evaluateGuess('co', 'pe', 1)).toEqual({ kind: 'wrong', guessed: 'pe', attemptsLeft: 1 })
    expect(evaluateGuess('co', 'co', 2)).toEqual({ kind: 'correct', attempt: 3, points: 1 })
    expect(evaluateGuess('co', 've', 2)).toEqual({ kind: 'failed', guessed: 've' })
  })

  it('el máximo es 3 puntos por país', () => {
    expect(maxScore('locate', 10)).toBe(30)
  })
})

describe('puntaje de Trivia', () => {
  it('da 1 punto por acierto', () => {
    expect(triviaPoints(true)).toBe(1)
    expect(triviaPoints(false)).toBe(0)
    expect(maxScore('trivia', 10)).toBe(10)
  })
})

describe('récords', () => {
  const entry = (score: number, timeMs: number, maxScore = 10) => ({ score, maxScore, timeMs })

  it('gana el mayor puntaje y, si empatan, el menor tiempo', () => {
    expect(isBetter(entry(5, 1000), undefined)).toBe(true)
    expect(isBetter(entry(6, 9000), entry(5, 1000))).toBe(true)
    expect(isBetter(entry(4, 10), entry(5, 1000))).toBe(false)
    expect(isBetter(entry(5, 900), entry(5, 1000))).toBe(true)
    expect(isBetter(entry(5, 1000), entry(5, 1000))).toBe(false)
  })

  it('en las variantes, con los mismos aciertos gana la de menos fallos antes que la más corta', () => {
    // 12 aciertos en 14 respuestas frente a 12 en 18: la segunda acabó antes por las penalizaciones.
    expect(isBetter(entry(12, 60_000, 14), entry(12, 48_000, 18))).toBe(true)
    expect(isBetter(entry(12, 48_000, 18), entry(12, 60_000, 14))).toBe(false)
  })
})

describe('cola de países de Ubica el país', () => {
  it('respeta la cantidad y no pasa de los disponibles', () => {
    const rng = () => createRng('cola')
    expect(buildLocateQueue({ region: 'europa', count: 10, seed: 'x' }, rng())).toHaveLength(10)
    expect(buildLocateQueue({ region: 'europa', count: 20, seed: 'x' }, rng())).toHaveLength(20)
    const all = buildLocateQueue({ region: 'sudamerica', count: 'todos', seed: 'x' }, rng())
    expect(all).toHaveLength(playableIn('sudamerica').length)
    // Norte y Centroamérica tiene 10 países: pedir 20 da 10.
    const small = buildLocateQueue({ region: 'norte-centroamerica', count: 20, seed: 'x' }, rng())
    expect(small).toHaveLength(playableIn('norte-centroamerica').length)
  })

  it('no repite países y es determinista', () => {
    const config = { region: 'mundo' as const, count: 'todos' as const, seed: 's' }
    const a = buildLocateQueue(config, createRng('s'))
    expect(new Set(a).size).toBe(a.length)
    expect(buildLocateQueue(config, createRng('s'))).toEqual(a)
  })

  it('en un repaso usa solo los países indicados (y descarta los no jugables)', () => {
    const queue = buildLocateQueue(
      { region: 'sudamerica', count: 10, seed: 'x', only: ['co', 'pe', 'gl', 'co'] },
      createRng('x'),
    )
    expect([...queue].sort()).toEqual(['co', 'pe'])
  })
})
