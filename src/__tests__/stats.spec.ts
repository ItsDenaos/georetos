/** Estadísticas de "Mi progreso" y su registro al terminar cada partida. */
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { getCountry } from '@/lib/countries'
import type { GameResult } from '@/lib/results'
import {
  addGame,
  continentStats,
  emptyStats,
  featsOf,
  isMicrostate,
  knowledgeColor,
  knownCountries,
  parseStats,
  playedFromDailySilhouette,
  playedFromResult,
  seedStats,
  snapshotOf,
  streakOf,
  totals,
  weakestCountries,
  type PlayedGame,
} from '@/lib/stats'
import { useAchievementToasts } from '@/stores/achievementToasts'
import { useDailyChallengeStore } from '@/stores/dailyChallenge'
import { useDailySilhouetteStore } from '@/stores/dailySilhouette'
import { useProgressStore } from '@/stores/progress'
import {
  ACHIEVEMENTS_STORAGE_KEY,
  STATS_STORAGE_KEY,
  clearAllProgress,
  finishGame,
  useStatsStore,
} from '@/stores/stats'

type Partial_ = Omit<GameResult, 'isRecord' | 'previousBest'>

function result(over: Partial<Partial_>): Partial_ {
  return {
    mode: 'locate',
    region: 'mundo',
    count: 10,
    seed: 'prueba',
    review: false,
    score: 0,
    maxScore: 30,
    correct: 0,
    total: 10,
    timeMs: 60_000,
    misses: [],
    answers: [],
    ...over,
  }
}

function game(over: Partial<PlayedGame>): PlayedGame {
  return { day: '2026-10-12', region: 'mundo', timeMs: 0, answers: [], feats: [], ...over }
}

describe('suma de partidas', () => {
  it('cuenta aciertos, aciertos tardíos y fallos por país', () => {
    let data = emptyStats()
    data = addGame(
      data,
      game({
        answers: [
          { code: 'pe', mark: 'ok', kind: 'map' },
          { code: 'cl', mark: 'meh', kind: 'quiz' },
          { code: 'pe', mark: 'fail', kind: 'silhouette' },
        ],
        timeMs: 90_000,
      }),
    )
    expect(data.countries.pe).toEqual({ ok: 1, meh: 0, fail: 1 })
    expect(data.countries.cl).toEqual({ ok: 0, meh: 1, fail: 0 })
    expect(totals(data)).toEqual({ questions: 3, right: 2, accuracy: 2 / 3 })
    expect(data.timeMs).toBe(90_000)
    expect(data.days).toEqual(['2026-10-12'])
    expect(knownCountries(data)).toBe(2)
  })

  it('Escribe los países suma días, tiempo y regiones, pero no precisión por país', () => {
    const data = addGame(
      emptyStats(),
      game({
        region: 'europa',
        timeMs: 300_000,
        answers: [
          { code: 'fr', mark: 'ok', kind: 'typing' },
          { code: 'de', mark: 'fail', kind: 'typing' },
        ],
      }),
    )
    expect(data.countries).toEqual({})
    expect(data.regions).toEqual(['europa'])
    expect(data.timeMs).toBe(300_000)
  })

  it('los microestados cuentan solo en el mapa y al primer intento', () => {
    expect(isMicrostate('mc')).toBe(true)
    expect(isMicrostate('fr')).toBe(false)
    const data = addGame(
      emptyStats(),
      game({
        answers: [
          { code: 'mc', mark: 'ok', kind: 'map' },
          { code: 'va', mark: 'meh', kind: 'map' },
          { code: 'mt', mark: 'ok', kind: 'quiz' },
          { code: 'mc', mark: 'ok', kind: 'map' },
          { code: 'fr', mark: 'ok', kind: 'map' },
        ],
      }),
    )
    expect(data.microstates).toEqual(['mc'])
  })

  it('días y regiones sin repetir', () => {
    let data = emptyStats()
    data = addGame(data, game({ day: '2026-10-13', region: 'asia' }))
    data = addGame(data, game({ day: '2026-10-12', region: 'asia' }))
    data = addGame(data, game({ day: '2026-10-13', region: 'mundo' }))
    expect(data.days).toEqual(['2026-10-12', '2026-10-13'])
    expect(data.regions).toEqual(['asia', 'mundo'])
  })
})

describe('hazañas de una partida', () => {
  it('Sudamérica sin fallos: todos los países al primer intento, en la clásica', () => {
    const perfect = result({
      region: 'sudamerica',
      count: 'todos',
      score: 36,
      maxScore: 36,
      total: 12,
    })
    expect(featsOf(perfect)).toEqual(['sudamerica-perfecta'])
    expect(featsOf({ ...perfect, score: 35 })).toEqual([])
    expect(featsOf({ ...perfect, count: 10, score: 30, maxScore: 30, total: 10 })).toEqual([])
    expect(featsOf({ ...perfect, review: true })).toEqual([])
  })

  it('Mente enciclopédica: 10/10 en la Trivia difícil', () => {
    const quiz = result({
      mode: 'trivia',
      difficulty: 'dificil',
      score: 10,
      maxScore: 10,
      total: 10,
    })
    expect(featsOf(quiz)).toEqual(['trivia-dificil-perfecta'])
    expect(featsOf({ ...quiz, difficulty: 'media' })).toEqual([])
    expect(featsOf({ ...quiz, variant: 'contrarreloj' })).toEqual([])
  })

  it('A la primera: una silueta al primer intento (también la del día)', () => {
    const silhouette = result({
      mode: 'silhouette',
      answers: [
        { code: 'pe', mark: 'meh' },
        { code: 'cl', mark: 'ok' },
      ],
    })
    expect(featsOf(silhouette)).toEqual(['silueta-primera'])
    expect(playedFromDailySilhouette({ code: 'pe', guesses: ['pe'] }, '2026-10-12')?.feats).toEqual(
      ['silueta-primera'],
    )
    expect(
      playedFromDailySilhouette({ code: 'pe', guesses: ['cl', 'pe'] }, '2026-10-12'),
    ).toMatchObject({ feats: [], answers: [{ code: 'pe', mark: 'meh', kind: 'silhouette' }] })
    // A medias no cuenta todavía.
    expect(playedFromDailySilhouette({ code: 'pe', guesses: ['cl'] }, '2026-10-12')).toBeNull()
  })

  it('cada modo marca el tipo de sus respuestas', () => {
    const played = playedFromResult(
      result({ mode: 'trivia', answers: [{ code: 'pe', mark: 'ok' }] }),
      '2026-10-12',
    )
    expect(played.answers).toEqual([{ code: 'pe', mark: 'ok', kind: 'quiz' }])
  })
})

describe('lo que muestra Mi progreso', () => {
  it('colores del mapa de lo que sabes', () => {
    expect(knowledgeColor(undefined)).toBeNull()
    expect(knowledgeColor({ ok: 4, meh: 0, fail: 1 })).toBe('ok')
    expect(knowledgeColor({ ok: 1, meh: 0, fail: 1 })).toBe('meh')
    expect(knowledgeColor({ ok: 1, meh: 0, fail: 2 })).toBe('fail')
  })

  it('precisión por continente', () => {
    const data = addGame(
      emptyStats(),
      game({
        answers: [
          { code: 'pe', mark: 'ok', kind: 'map' },
          { code: 'cl', mark: 'fail', kind: 'map' },
          { code: 'fr', mark: 'ok', kind: 'map' },
        ],
      }),
    )
    const byContinent = Object.fromEntries(continentStats(data).map((c) => [c.continent, c]))
    expect(getCountry('pe')?.continent).toBe('america')
    expect(byContinent.america).toMatchObject({ questions: 2, right: 1, accuracy: 0.5 })
    expect(byContinent.europa).toMatchObject({ questions: 1, accuracy: 1 })
    expect(byContinent.asia).toMatchObject({ questions: 0, accuracy: 0 })
  })

  it('los países que más fallas: peor proporción primero y al menos dos preguntas', () => {
    const data = {
      ...emptyStats(),
      countries: {
        pe: { ok: 1, meh: 0, fail: 3 },
        cl: { ok: 0, meh: 0, fail: 2 },
        fr: { ok: 0, meh: 0, fail: 1 },
        de: { ok: 5, meh: 0, fail: 0 },
        it: { ok: 1, meh: 1, fail: 2 },
      },
    }
    expect(weakestCountries(data).map((c) => c.code)).toEqual(['cl', 'pe', 'it'])
    expect(weakestCountries(data, 1)).toEqual([{ code: 'cl', fails: 2, seen: 2, accuracy: 0 }])
  })

  it('la racha cuenta días seguidos con cualquier partida', () => {
    const data = {
      ...emptyStats(),
      days: ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-10', '2026-10-11'],
    }
    expect(streakOf(data, '2026-10-12')).toEqual({ current: 2, best: 3, playedToday: false })
    const snapshot = snapshotOf(
      { ...data, regions: ['mundo', 'asia', 'asia'], microstates: ['mc'] },
      { gamesPlayed: 4, stamps: 2 },
      '2026-10-12',
    )
    expect(snapshot).toMatchObject({ gamesPlayed: 4, stamps: 2, regions: 2, bestStreak: 3 })
  })

  it('lee lo guardado sin fiarse de su forma', () => {
    expect(parseStats(null)).toBeNull()
    const parsed = parseStats({ countries: { pe: { ok: 2, fail: -1 } }, days: ['2026-10-12', 3] })
    expect(parsed?.countries.pe).toEqual({ ok: 2, meh: 0, fail: 0 })
    expect(parsed?.days).toEqual(['2026-10-12'])
  })
})

describe('la primera vez, a partir de lo guardado antes', () => {
  it('los récords dan días, regiones y hazañas; los retos diarios, sus respuestas', () => {
    const data = seedStats(
      {
        records: {
          'locate|sudamerica|todos': {
            score: 36,
            maxScore: 36,
            timeMs: 1,
            date: '2026-10-10T12:00:00',
          },
          'trivia|asia|dificil': {
            score: 10,
            maxScore: 10,
            timeMs: 1,
            date: '2026-10-11T12:00:00',
          },
        },
        dailyChallenge: {
          '2026-10-12': {
            number: 1,
            attempts: 0,
            startedAt: '2026-10-12T10:00:00Z',
            finishedAt: '2026-10-12T10:03:00Z',
            answers: Array.from({ length: 10 }, (_, i) => ({
              code: i % 2 ? 'fr' : 'mc',
              mark: 'ok' as const,
              points: 3,
            })),
          },
        },
        dailySilhouette: { '2026-10-12': { code: 'pe', guesses: ['pe'] } },
      },
      new Date('2026-10-12T12:00:00'),
    )
    expect(data.days).toEqual(['2026-10-10', '2026-10-11', '2026-10-12'])
    expect(data.regions).toEqual(['sudamerica', 'asia', 'mundo'])
    expect(data.feats).toEqual([
      'sudamerica-perfecta',
      'trivia-dificil-perfecta',
      'silueta-primera',
    ])
    // En el reto diario las pares son de mapa: Mónaco al primer intento cuenta como microestado.
    expect(data.microstates).toEqual(['mc'])
    expect(data.countries.fr).toEqual({ ok: 5, meh: 0, fail: 0 })
    expect(data.countries.pe).toEqual({ ok: 1, meh: 0, fail: 0 })
    expect(data.timeMs).toBe(180_000)
  })
})

describe('registro al terminar una partida', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    setActivePinia(createPinia())
  })

  it('la primera partida desbloquea "Primer viaje" con aviso', () => {
    const played = finishGame(result({ answers: [{ code: 'pe', mark: 'ok' }], score: 3 }))
    expect(played.isRecord).toBe(true)
    expect(useProgressStore().gamesPlayed).toBe(1)
    const stats = useStatsStore()
    expect(stats.data.countries.pe).toEqual({ ok: 1, meh: 0, fail: 0 })
    expect(stats.unlocked['primer-viaje']).toBeTruthy()
    expect(useAchievementToasts().queue).toEqual(['primer-viaje'])
    expect(JSON.parse(localStorage.getItem(STATS_STORAGE_KEY) ?? '{}').countries.pe.ok).toBe(1)
  })

  it('al estrenar la versión, lo que ya se cumplía se desbloquea sin aviso', () => {
    localStorage.setItem('georetos:v1:progreso', JSON.stringify({ gamesPlayed: 12, records: {} }))
    setActivePinia(createPinia())
    const stats = useStatsStore()
    expect(stats.unlocked['primer-viaje']).toBeTruthy()
    expect(useAchievementToasts().queue).toEqual([])
    expect(localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY)).toContain('primer-viaje')
  })

  it('el reto diario terminado suma sus respuestas', () => {
    const daily = useDailyChallengeStore()
    daily.start()
    for (const item of daily.items) {
      if (item.kind === 'map') daily.recordMap(item.code, 1)
      else daily.recordTrivia(item.question.subject, item.question.answer, true)
      daily.advance()
    }
    expect(useProgressStore().gamesPlayed).toBe(1)
    expect(totals(useStatsStore().data)).toMatchObject({ questions: 10, right: 10 })
  })

  it('la silueta del día al primer intento cuenta una vez y desbloquea "A la primera"', () => {
    const daily = useDailySilhouetteStore()
    daily.guess(daily.code)
    const stats = useStatsStore()
    expect(stats.data.countries[daily.code]).toEqual({ ok: 1, meh: 0, fail: 0 })
    expect(useAchievementToasts().queue).toEqual(['primer-viaje', 'a-la-primera'])
  })

  it('borrar mi progreso deja todo vacío', () => {
    finishGame(result({ answers: [{ code: 'pe', mark: 'ok' }], score: 3 }))
    localStorage.setItem('georetos:v1:tema', 'dark')
    clearAllProgress()
    expect(Object.keys(localStorage)).toEqual(['georetos:v1:tema'])
  })
})
