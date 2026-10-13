/** Partidas de Contrarreloj y Supervivencia con el store. */
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { getCountry, playableIn } from '@/lib/countries'
import { MAP_AREA } from '@/lib/dailyChallenge'
import type { RunConfig } from '@/lib/variants'
import { useRunStore } from '@/stores/run'

type Store = ReturnType<typeof useRunStore>

function config(over: Partial<RunConfig> & Pick<RunConfig, 'mode' | 'variant'>): RunConfig {
  return { region: 'mundo', difficulty: 'media', seed: 'prueba', ...over }
}

/** Responde la pregunta actual y pasa a la siguiente. */
function answer(store: Store, right: boolean) {
  const item = store.item
  if (!item) throw new Error('No hay pregunta')
  if (item.kind === 'map') store.resolveMap(right ? 1 : null)
  else store.answerTrivia(right ? item.question.answer : (item.question.answer + 1) % 4)
  store.advance()
}

function itemDifficulty(store: Store) {
  return store.item?.kind === 'trivia' ? store.item.difficulty : null
}

function itemArea(store: Store) {
  return store.item?.kind === 'map' ? (getCountry(store.item.code)?.area ?? -1) : -1
}

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})

describe('Contrarreloj', () => {
  it('termina al acabarse los 60 segundos', () => {
    const store = useRunStore()
    store.start(config({ mode: 'locate', variant: 'contrarreloj', region: 'europa' }), 0)
    expect(store.timeLeft).toBe(60_000)
    answer(store, true)
    store.tick(59_900)
    expect(store.finished).toBe(false)
    store.tick(60_000)
    expect(store.finished).toBe(true)
    expect(store.endReason).toBe('time')
    // Tras terminar no se puede seguir respondiendo.
    store.resolveMap(1)
    expect(store.answers).toHaveLength(1)
  })

  it('en el mapa, cada toque equivocado resta 3 segundos', () => {
    const store = useRunStore()
    store.start(config({ mode: 'locate', variant: 'contrarreloj' }), 0)
    store.mapAttempt()
    store.mapAttempt()
    store.tick(10_000)
    expect(store.timeLeft).toBe(44_000)
    // Acertar al tercer intento no resta más tiempo.
    store.resolveMap(3)
    store.advance()
    expect(store.timeLeft).toBe(44_000)
    // Fallar el país (tras 3 toques o al saltar) resta 3 segundos más.
    store.resolveMap(null)
    expect(store.timeLeft).toBe(41_000)
  })

  it('en la Trivia, cada fallo resta 3 segundos y la dificultad es la elegida', () => {
    const store = useRunStore()
    store.start(config({ mode: 'trivia', variant: 'contrarreloj', difficulty: 'dificil' }), 0)
    answer(store, false)
    answer(store, true)
    store.tick(1_000)
    expect(store.timeLeft).toBe(56_000)
    expect(itemDifficulty(store)).toBe('dificil')
    store.tick(56_999)
    expect(store.finished).toBe(false)
    store.tick(57_000)
    const result = store.buildResult()
    expect(result).toMatchObject({
      mode: 'trivia',
      variant: 'contrarreloj',
      difficulty: 'dificil',
      score: 1,
      maxScore: 2,
      timeMs: 57_000,
    })
    expect(result?.misses).toHaveLength(1)
  })

  it('al completar todos los países de la región, termina', () => {
    const store = useRunStore()
    store.start(config({ mode: 'locate', variant: 'contrarreloj', region: 'oceania' }), 0)
    const total = playableIn('oceania').length
    for (let i = 0; i < total; i++) answer(store, true)
    expect(store.finished).toBe(true)
    expect(store.endReason).toBe('exhausted')
    expect(store.buildResult()?.score).toBe(total)
  })
})

describe('Supervivencia', () => {
  it('en el mapa, los toques equivocados no quitan vidas; fallar el país sí', () => {
    const store = useRunStore()
    store.start(config({ mode: 'locate', variant: 'supervivencia' }), 0)
    store.mapAttempt()
    store.mapAttempt()
    expect(store.run.lives).toBe(3)
    store.resolveMap(null)
    expect(store.run.lives).toBe(2)
    // Sin reloj.
    expect(store.timeLeft).toBeNull()
    store.tick(10 * 60_000)
    expect(store.finished).toBe(false)
  })

  it('el tercer fallo termina la partida al pasar a la siguiente', () => {
    const store = useRunStore()
    store.start(config({ mode: 'trivia', variant: 'supervivencia' }), 0)
    answer(store, true)
    answer(store, false)
    answer(store, false)
    expect(store.finished).toBe(false)
    store.answerTrivia(-1)
    expect(store.run.over).toBe(true)
    // Primero se ve la respuesta; la partida termina al pasar.
    expect(store.finished).toBe(false)
    store.advance(95_000)
    expect(store.finished).toBe(true)
    expect(store.endReason).toBe('lives')
    expect(store.buildResult()).toMatchObject({
      variant: 'supervivencia',
      score: 1,
      maxScore: 4,
      timeMs: 95_000,
      reachedLevel: 0,
      difficulty: undefined,
    })
  })

  it('cada 5 aciertos sube la dificultad', () => {
    const store = useRunStore()
    store.start(config({ mode: 'locate', variant: 'supervivencia' }), 0)
    for (let i = 0; i < 5; i++) {
      expect(itemArea(store)).toBeGreaterThanOrEqual(MAP_AREA.facil[0])
      answer(store, true)
    }
    expect(store.level).toBe(1)
    expect(itemArea(store)).toBeGreaterThanOrEqual(MAP_AREA.media[0])
    expect(itemArea(store)).toBeLessThan(MAP_AREA.media[1])
    for (let i = 0; i < 5; i++) answer(store, true)
    expect(store.level).toBe(2)
    expect(itemArea(store)).toBeLessThan(MAP_AREA.dificil[1])
  })

  it('en la Trivia, la dificultad también sube sola', () => {
    const store = useRunStore()
    store.start(config({ mode: 'trivia', variant: 'supervivencia', difficulty: 'dificil' }), 0)
    expect(itemDifficulty(store)).toBe('facil')
    for (let i = 0; i < 5; i++) answer(store, true)
    expect(itemDifficulty(store)).toBe('media')
  })
})

describe('determinismo', () => {
  it('misma semilla, mismos países', () => {
    const codes = () => {
      setActivePinia(createPinia())
      const store = useRunStore()
      store.start(config({ mode: 'locate', variant: 'supervivencia', seed: 'igual' }), 0)
      const out: string[] = []
      for (let i = 0; i < 12; i++) {
        if (store.item?.kind === 'map') out.push(store.item.code)
        answer(store, true)
      }
      return out
    }
    expect(codes()).toEqual(codes())
  })
})
