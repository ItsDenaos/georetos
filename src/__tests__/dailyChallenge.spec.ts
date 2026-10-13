/** Generación del Reto diario con la semilla de la fecha. */
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getCountry } from '@/lib/countries'
import { dailyChallenge } from '@/lib/daily'
import {
  DAILY_DIFFICULTY,
  DAILY_LENGTH,
  MAP_AREA,
  dailyKind,
  generateDailyChallenge,
  type DailyItem,
} from '@/lib/dailyChallenge'

const seedOf = (y: number, m: number, d: number) => dailyChallenge(new Date(y, m - 1, d, 12)).seed

/** País protagonista de cada pregunta. */
const subject = (item: DailyItem) => (item.kind === 'map' ? item.code : item.question.subject)

/** Un año entero de retos, desde el día 1. */
const year = Array.from({ length: 365 }, (_, i) =>
  generateDailyChallenge(dailyChallenge(new Date(2026, 9, 12 + i, 12)).seed),
)

afterEach(() => vi.restoreAllMocks())

describe('Reto diario: generación con semilla', () => {
  it('la misma fecha da exactamente el mismo reto', () => {
    expect(generateDailyChallenge(seedOf(2026, 10, 12))).toEqual(
      generateDailyChallenge(seedOf(2026, 10, 12)),
    )
  })

  it('cualquier hora del mismo día local da el mismo reto', () => {
    const morning = dailyChallenge(new Date(2026, 9, 12, 0, 1)).seed
    const night = dailyChallenge(new Date(2026, 9, 12, 23, 59)).seed
    expect(generateDailyChallenge(morning)).toEqual(generateDailyChallenge(night))
  })

  it('otra fecha da otro reto', () => {
    expect(generateDailyChallenge(seedOf(2026, 10, 13))).not.toEqual(
      generateDailyChallenge(seedOf(2026, 10, 12)),
    )
  })

  it('no depende de Math.random', () => {
    const spy = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('El reto diario no puede usar Math.random')
    })
    expect(() => generateDailyChallenge(seedOf(2027, 1, 1))).not.toThrow()
    expect(spy).not.toHaveBeenCalled()
  })

  it('siempre hay 10 preguntas: mapa y trivia alternadas, de fácil a difícil', () => {
    expect(DAILY_DIFFICULTY).toHaveLength(DAILY_LENGTH)
    for (const items of year) {
      expect(items.map((i) => i.kind)).toEqual(
        Array.from({ length: DAILY_LENGTH }, (_, n) => dailyKind(n)),
      )
      expect(items.map((i) => i.difficulty)).toEqual([...DAILY_DIFFICULTY])
    }
    expect(dailyKind(0)).toBe('map')
    expect(dailyKind(1)).toBe('trivia')
  })

  it('ningún país se repite en el mismo reto', () => {
    const repeated = year.filter((items) => new Set(items.map(subject)).size !== items.length)
    expect(repeated).toEqual([])
  })

  it('los países de mapa tienen la superficie de su dificultad', () => {
    const wrong = year.flatMap((items) =>
      items.flatMap((item) => {
        if (item.kind !== 'map') return []
        const country = getCountry(item.code)
        const [min, max] = MAP_AREA[item.difficulty]
        return country?.playable && country.area >= min && country.area < max ? [] : [item.code]
      }),
    )
    expect(wrong).toEqual([])
  })

  it('las 5 preguntas de trivia son de temas distintos', () => {
    const family = (type: string) => (type === 'pais-de-capital' ? 'capital-de' : type)
    const repeated = year.filter((items) => {
      const types = items.flatMap((i) => (i.kind === 'trivia' ? [family(i.question.type)] : []))
      return new Set(types).size !== types.length
    })
    expect(repeated).toEqual([])
  })

  it('la respuesta correcta siempre está entre las opciones', () => {
    const broken = year.flatMap((items) =>
      items.flatMap((item) =>
        item.kind === 'trivia' && !item.question.options[item.question.answer]
          ? [item.question.id]
          : [],
      ),
    )
    expect(broken).toEqual([])
  })
})
