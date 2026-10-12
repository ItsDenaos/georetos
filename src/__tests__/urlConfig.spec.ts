import { describe, expect, it } from 'vitest'

import {
  locateQuery,
  parseLocateQuery,
  parseSilhouetteQuery,
  parseTriviaQuery,
  silhouetteQuery,
  triviaQuery,
} from '@/lib/urlConfig'

describe('configuración en la URL', () => {
  it('lee /mapa?region=sudamerica&n=10', () => {
    expect(parseLocateQuery({ region: 'sudamerica', n: '10', seed: 'abc' })).toEqual({
      region: 'sudamerica',
      count: 10,
      seed: 'abc',
      only: undefined,
    })
  })

  it('rechaza valores inválidos', () => {
    expect(parseLocateQuery({ region: 'marte', n: '10' })).toBeNull()
    expect(parseLocateQuery({ region: 'europa', n: '7' })).toBeNull()
    expect(parseTriviaQuery({ dificultad: 'imposible' })).toBeNull()
  })

  it('ignora semillas raras y países que no se juegan', () => {
    const config = parseLocateQuery({
      region: 'mundo',
      n: 'todos',
      seed: '<x>',
      paises: 'co,zz,gl',
    })
    expect(config?.seed).toBe('')
    expect(config?.only).toEqual(['co'])
  })

  it('ida y vuelta sin perder datos', () => {
    const locate = {
      region: 'europa' as const,
      count: 20 as const,
      seed: 'k3x9',
      only: ['fr', 'es'],
    }
    expect(parseLocateQuery(locateQuery(locate) as Record<string, string>)).toEqual(locate)
    const trivia = {
      difficulty: 'dificil' as const,
      region: 'asia' as const,
      timer: true,
      seed: 'z9',
      only: undefined,
    }
    expect(parseTriviaQuery(triviaQuery(trivia) as Record<string, string>)).toEqual(trivia)
  })

  it('la región de trivia es opcional', () => {
    expect(parseTriviaQuery({ dificultad: 'facil' })?.region).toBe('mundo')
  })
})

describe('configuración de Silueta en la URL', () => {
  it('lee /silueta?region=europa&n=10 y la región es opcional', () => {
    expect(parseSilhouetteQuery({ region: 'europa', n: '10', seed: 'abc' })).toEqual({
      region: 'europa',
      count: 10,
      seed: 'abc',
      only: undefined,
    })
    expect(parseSilhouetteQuery({ n: '5' })?.region).toBe('mundo')
  })

  it('rechaza cantidades que no existen', () => {
    expect(parseSilhouetteQuery({ n: '7' })).toBeNull()
    expect(parseSilhouetteQuery({})).toBeNull()
  })

  it('ida y vuelta sin perder datos', () => {
    const config = { region: 'asia' as const, count: 5 as const, seed: 'z1', only: ['jp', 'kr'] }
    expect(parseSilhouetteQuery(silhouetteQuery(config) as Record<string, string>)).toEqual(config)
  })
})
