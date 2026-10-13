/** Desafía a un amigo: el link, su validación y la comparación final. */
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import {
  CHALLENGE_PARAM,
  GENERATOR_VERSION,
  cleanName,
  decodeChallenge,
  describePlayed,
  duelOutcome,
  encodeChallenge,
  gameFromRoute,
  gameKey,
  resultKey,
  sameGameRoute,
} from '@/lib/challenge'
import type { GameResult } from '@/lib/results'
import { useChallengeStore } from '@/stores/challenge'

function result(over: Partial<GameResult> = {}): GameResult {
  return {
    mode: 'locate',
    region: 'europa',
    count: 10,
    seed: 'k3x9tq',
    review: false,
    score: 23,
    maxScore: 30,
    correct: 8,
    total: 10,
    timeMs: 61_234,
    misses: [],
    answers: [
      { code: 'fr', mark: 'ok' },
      { code: 'de', mark: 'meh' },
      { code: 'es', mark: 'fail' },
    ],
    isRecord: false,
    ...over,
  }
}

/** Codifica a mano, para probar links manipulados. */
function encode(payload: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

const valid = { v: 1, g: GENERATOR_VERSION, s: 23, m: 30, c: 8, t: 10, ms: 61_234 }

describe('el link del desafío', () => {
  it('ida y vuelta con nombre (con tildes) y la fila de resultados', () => {
    const raw = encodeChallenge(result(), 'Moisés')
    expect(raw).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(decodeChallenge(raw)).toEqual({
      name: 'Moisés',
      score: 23,
      maxScore: 30,
      correct: 8,
      total: 10,
      timeMs: 61_234,
      marks: ['ok', 'meh', 'fail'],
      sameVersion: true,
    })
  })

  it('sin nombre y, en Escribe los países, sin fila de resultados', () => {
    const typing = result({ mode: 'typing', count: 10, seed: '', score: 4, maxScore: 54 })
    const challenge = decodeChallenge(encodeChallenge(typing, '   '))
    expect(challenge?.name).toBe('')
    expect(challenge?.marks).toEqual([])
  })

  it('avisa si se creó con otra versión del generador', () => {
    expect(decodeChallenge(encode({ ...valid, g: GENERATOR_VERSION + 1 }))?.sameVersion).toBe(false)
  })

  it('rechaza links dañados o manipulados', () => {
    expect(decodeChallenge(undefined)).toBeNull()
    expect(decodeChallenge('')).toBeNull()
    expect(decodeChallenge('esto no es base64!')).toBeNull()
    expect(decodeChallenge(encode('texto'))).toBeNull()
    expect(decodeChallenge(encode([1, 2]))).toBeNull()
    expect(decodeChallenge(encode({ ...valid, v: 2 }))).toBeNull()
    expect(decodeChallenge(encode({ ...valid, s: 31 }))).toBeNull()
    expect(decodeChallenge(encode({ ...valid, s: -1 }))).toBeNull()
    expect(decodeChallenge(encode({ ...valid, s: 2.5 }))).toBeNull()
    expect(decodeChallenge(encode({ ...valid, c: 11 }))).toBeNull()
    expect(decodeChallenge(encode({ ...valid, ms: 'mucho' }))).toBeNull()
    expect(decodeChallenge(encode({ ...valid, ms: 1e12 }))).toBeNull()
    expect(decodeChallenge(encode({ ...valid, n: 42 }))).toBeNull()
    expect(decodeChallenge(encode({ ...valid, r: 'oo<script>' }))).toBeNull()
    expect(decodeChallenge('a'.repeat(2001))).toBeNull()
  })

  it('el nombre se limpia y se recorta', () => {
    expect(cleanName('  Ana   María  ')).toBe('Ana María')
    expect(cleanName('Ana‮odaipxe\u0000')).toBe('Anaodaipxe')
    expect(cleanName('Bartolomeo Fernández de la Vega')).toBe('Bartolomeo Fernández')
    expect([...cleanName('🌍'.repeat(30))]).toHaveLength(20)
    expect(
      decodeChallenge(encode({ ...valid, n: ' x'.repeat(40) }))?.name.length,
    ).toBeLessThanOrEqual(20)
  })
})

describe('la misma partida', () => {
  it('cada modo vuelve a su ruta con la misma semilla y opciones', () => {
    expect(sameGameRoute(result())).toEqual({
      name: 'locate',
      query: { region: 'europa', n: '10', seed: 'k3x9tq' },
    })
    expect(
      sameGameRoute(
        result({ mode: 'trivia', difficulty: 'dificil', timer: true, region: 'mundo' }),
      ),
    ).toEqual({ name: 'trivia', query: { dificultad: 'dificil', tiempo: '1', seed: 'k3x9tq' } })
    expect(sameGameRoute(result({ mode: 'silhouette', count: 5 }))).toEqual({
      name: 'silhouette',
      query: { region: 'europa', n: '5', seed: 'k3x9tq' },
    })
    expect(sameGameRoute(result({ variant: 'contrarreloj' }))).toEqual({
      name: 'locate',
      query: { variante: 'contrarreloj', region: 'europa', seed: 'k3x9tq' },
    })
    expect(sameGameRoute(result({ mode: 'typing', count: 5, seed: '' }))).toEqual({
      name: 'typing',
      query: { region: 'europa', min: '5' },
    })
  })

  it('las partidas de repaso no se comparten', () => {
    expect(sameGameRoute(result({ review: true, only: ['fr'] }))).toBeNull()
  })

  it('la clave de la partida ignora el desafío, el orden y los parámetros de otras apps', () => {
    const fromLink = {
      seed: 'k3x9tq',
      n: '10',
      region: 'europa',
      [CHALLENGE_PARAM]: 'abc',
      fbclid: 'x',
    }
    expect(gameKey('locate', fromLink)).toBe(resultKey(result()))
    expect(gameKey('locate', { ...fromLink, seed: 'otra' })).not.toBe(resultKey(result()))
  })

  it('reconoce la partida desde la ruta, para presentar el desafío', () => {
    const game = gameFromRoute('trivia', { variante: 'supervivencia', seed: 'k3x9tq' })
    expect(game).toMatchObject({ mode: 'trivia', variant: 'supervivencia', region: 'mundo' })
    expect(gameFromRoute('typing', { region: 'africa', min: '5' })).toEqual({
      mode: 'typing',
      region: 'africa',
      count: 5,
    })
    expect(gameFromRoute('home', {})).toBeNull()
    const label = describePlayed(result(), result())
    expect([label.title, label.regionLabel, label.level, label.score]).toEqual([
      'Ubica el país',
      'Europa',
      '10 países',
      '23/30',
    ])
  })
})

describe('quién gana', () => {
  const mine = { score: 23, maxScore: 30, correct: 8, total: 10, timeMs: 60_000 }

  it('más puntos; si empatan, menos tiempo (en segundos)', () => {
    expect(duelOutcome(mine, { ...mine, score: 20 })).toBe('win')
    expect(duelOutcome(mine, { ...mine, score: 25 })).toBe('lose')
    expect(duelOutcome(mine, { ...mine, timeMs: 70_000 })).toBe('win')
    expect(duelOutcome(mine, { ...mine, timeMs: 50_000 })).toBe('lose')
    expect(duelOutcome(mine, { ...mine, timeMs: 60_300 })).toBe('tie')
  })

  it('en Contrarreloj y Supervivencia, con los mismos aciertos gana quien falló menos', () => {
    const run = { score: 12, maxScore: 14, correct: 12, total: 14, timeMs: 60_000 }
    expect(duelOutcome(run, { ...run, maxScore: 18, timeMs: 48_000 }, true)).toBe('win')
    expect(duelOutcome(run, { ...run, maxScore: 12 }, true)).toBe('lose')
  })
})

describe('desafío aceptado', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('se une al resultado de la misma partida, aunque se recargue', () => {
    const challenge = decodeChallenge(encodeChallenge(result(), 'Ana'))!
    useChallengeStore().accept(
      gameKey('locate', { region: 'europa', n: '10', seed: 'k3x9tq' }),
      challenge,
    )
    setActivePinia(createPinia())
    const store = useChallengeStore()
    expect(store.forResult(result({ score: 20 }))?.name).toBe('Ana')
    expect(store.forResult(result({ seed: 'otra' }))).toBeNull()
  })

  it('recuerda el nombre, limpio', () => {
    useChallengeStore().setName('  Ana  ')
    setActivePinia(createPinia())
    expect(useChallengeStore().name).toBe('Ana')
  })
})
