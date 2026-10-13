/** Preguntas a demanda de Contrarreloj y Supervivencia. */
import { describe, expect, it } from 'vitest'

import { getCountry, playableIn } from '@/lib/countries'
import { MAP_AREA } from '@/lib/dailyChallenge'
import { createMapStream, createTriviaStream } from '@/lib/streams'
import type { Difficulty } from '@/lib/types'

function take<T>(next: () => T | null, n: number): T[] {
  const out: T[] = []
  for (let i = 0; i < n; i++) {
    const value = next()
    if (value === null) break
    out.push(value)
  }
  return out
}

describe('países del mapa', () => {
  it('misma semilla, mismos países', () => {
    const a = createMapStream('s1', 'mundo')
    const b = createMapStream('s1', 'mundo')
    const first = take(() => a.next(), 20)
    expect(take(() => b.next(), 20)).toEqual(first)
    const c = createMapStream('s2', 'mundo')
    expect(take(() => c.next(), 20)).not.toEqual(first)
  })

  it('recorre la región sin repetir y luego se agota', () => {
    const stream = createMapStream('s1', 'oceania')
    const codes = take(() => stream.next(), 100)
    expect(codes).toHaveLength(playableIn('oceania').length)
    expect(new Set(codes).size).toBe(codes.length)
    expect(stream.next()).toBeNull()
  })

  it('con dificultad, elige países del tamaño que toca', () => {
    for (const difficulty of ['facil', 'media', 'dificil'] as Difficulty[]) {
      const stream = createMapStream('niveles', 'mundo')
      const [min, max] = MAP_AREA[difficulty]
      for (const code of take(() => stream.next(difficulty), 10)) {
        const area = getCountry(code)?.area ?? -1
        expect(area).toBeGreaterThanOrEqual(min)
        expect(area).toBeLessThan(max)
      }
    }
  })

  it('si se acaban los de un tamaño, sigue con los demás', () => {
    const stream = createMapStream('s1', 'oceania')
    const codes = take(() => stream.next('facil'), 100)
    expect(codes).toHaveLength(playableIn('oceania').length)
  })
})

describe('preguntas de Trivia', () => {
  it('misma semilla y dificultades, mismas preguntas', () => {
    const levels: Difficulty[] = ['facil', 'facil', 'media', 'dificil', 'media', 'facil']
    const a = createTriviaStream('t1', 'mundo')
    const b = createTriviaStream('t1', 'mundo')
    expect(levels.map((d) => a.next(d))).toEqual(levels.map((d) => b.next(d)))
  })

  it('no repite país ni dos tipos seguidos', () => {
    const stream = createTriviaStream('t2', 'mundo')
    const questions = take(() => stream.next('media'), 40)
    expect(questions).toHaveLength(40)
    const subjects = questions.map((q) => q.subject)
    expect(new Set(subjects).size).toBe(subjects.length)
    for (let i = 1; i < questions.length; i++) {
      expect(questions[i]?.type).not.toBe(questions[i - 1]?.type)
    }
  })

  it('en una región pequeña se agota sin repetir', () => {
    const stream = createTriviaStream('t3', 'oceania')
    const questions = take(() => stream.next('facil'), 200)
    expect(questions.length).toBeGreaterThan(0)
    expect(questions.length).toBeLessThanOrEqual(playableIn('oceania').length)
    expect(new Set(questions.map((q) => q.subject)).size).toBe(questions.length)
    expect(stream.next('facil')).toBeNull()
  })
})
