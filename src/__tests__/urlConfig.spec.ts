import { describe, expect, it } from 'vitest'

import {
  locateQuery,
  parseLocateQuery,
  parseRunQuery,
  parseSilhouetteQuery,
  parseTriviaQuery,
  parseTypingQuery,
  runQuery,
  silhouetteQuery,
  triviaQuery,
  typingQuery,
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

describe('Contrarreloj y Supervivencia en la URL', () => {
  it('lee /mapa?variante=contrarreloj&region=europa', () => {
    const query = { variante: 'contrarreloj', region: 'europa', seed: 'a1' }
    expect(parseRunQuery('locate', query)).toEqual({
      mode: 'locate',
      variant: 'contrarreloj',
      region: 'europa',
      difficulty: 'media',
      seed: 'a1',
    })
  })

  it('sin variante válida es una partida clásica', () => {
    expect(parseRunQuery('locate', { region: 'europa', n: '10' })).toBeNull()
    expect(parseRunQuery('trivia', { dificultad: 'media' })).toBeNull()
    expect(parseRunQuery('trivia', { variante: 'clasica' })).toBeNull()
    expect(parseRunQuery('locate', { variante: 'contrarreloj', region: 'marte' })).toBeNull()
  })

  it('Supervivencia se juega siempre con el mundo', () => {
    const query = { variante: 'supervivencia', region: 'asia' }
    expect(parseRunQuery('locate', query)?.region).toBe('mundo')
  })

  it('ida y vuelta sin perder datos', () => {
    const config = {
      mode: 'trivia' as const,
      variant: 'contrarreloj' as const,
      region: 'africa' as const,
      difficulty: 'dificil' as const,
      seed: 'k9',
    }
    expect(parseRunQuery('trivia', runQuery(config) as Record<string, string>)).toEqual(config)
    // Solo se escribe lo que la variante usa.
    const survival = { ...config, mode: 'locate' as const, variant: 'supervivencia' as const }
    expect(runQuery(survival)).toEqual({ variante: 'supervivencia', seed: 'k9' })
  })
})

describe('Escribe los países en la URL', () => {
  it('lee /escribe?region=europa&min=10 y la región es opcional', () => {
    expect(parseTypingQuery({ region: 'europa', min: '10' })).toEqual({
      region: 'europa',
      minutes: 10,
    })
    expect(parseTypingQuery({ min: '15' })).toEqual({ region: 'mundo', minutes: 15 })
  })

  it('sin tiempo válido muestra la configuración', () => {
    expect(parseTypingQuery({})).toBeNull()
    expect(parseTypingQuery({ min: '7' })).toBeNull()
    expect(parseTypingQuery({ region: 'marte', min: '5' })).toBeNull()
  })

  it('ida y vuelta sin perder datos', () => {
    const config = { region: 'caribe' as const, minutes: 5 as const }
    expect(parseTypingQuery(typingQuery(config) as Record<string, string>)).toEqual(config)
  })
})
