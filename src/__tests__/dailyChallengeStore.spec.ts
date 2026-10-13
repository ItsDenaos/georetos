/** Reto diario: una sola vez al día, se reanuda al recargar y lleva la racha. */
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { dailyShareText, emojiRow } from '@/lib/dailyShare'
import { useDailyChallengeStore } from '@/stores/dailyChallenge'
import { useProgressStore } from '@/stores/progress'

/** Simula una recarga de la página: estado nuevo, mismo localStorage. */
function reload() {
  setActivePinia(createPinia())
  return useDailyChallengeStore()
}

/** Responde la pregunta actual: acierto (1.er intento), acierto tardío o fallo. */
function answer(store: ReturnType<typeof useDailyChallengeStore>, kind: 'ok' | 'meh' | 'fail') {
  const item = store.current
  if (!item) throw new Error('No hay pregunta')
  if (item.kind === 'map') {
    store.recordMap(item.code, kind === 'ok' ? 1 : kind === 'meh' ? 2 : null)
  } else {
    const right = item.question.answer
    store.recordTrivia(
      item.question.subject,
      kind === 'fail' ? (right + 1) % 4 : right,
      kind !== 'fail',
    )
  }
  store.advance()
}

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
})

describe('Reto diario: progreso', () => {
  it('suma 3/2/1 en el mapa y 3 por trivia acertada, sobre 30', () => {
    const store = useDailyChallengeStore()
    store.start()
    // Mapa: ok (3), trivia: ok (3), mapa: meh (2), trivia: fail (0), resto ok.
    const plan = ['ok', 'ok', 'meh', 'fail', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok'] as const
    for (const kind of plan) answer(store, kind)
    expect(store.finished).toBe(true)
    expect(store.showingResult).toBe(true)
    expect(store.score).toBe(3 + 3 + 2 + 0 + 6 * 3)
    expect(store.maxScore).toBe(30)
    expect(store.marks).toEqual([...plan])
  })

  it('se reanuda al recargar y no deja volver a responder', () => {
    let store = useDailyChallengeStore()
    store.start()
    answer(store, 'ok')
    answer(store, 'fail')
    store = reload()
    expect(store.cursor).toBe(2)
    expect(store.answers).toHaveLength(2)
    // Intentar responder otra vez una pregunta ya respondida no hace nada.
    store.cursor = 1
    store.recordTrivia('xx', 0, true)
    expect(store.answers).toHaveLength(2)
  })

  it('recuerda los toques equivocados de la pregunta de mapa en curso', () => {
    let store = useDailyChallengeStore()
    store.start()
    store.recordAttempt(2)
    store = reload()
    expect(store.today?.attempts).toBe(2)
  })

  it('se juega una sola vez: al volver, muestra el resultado', () => {
    let store = useDailyChallengeStore()
    store.start()
    for (let i = 0; i < 10; i++) answer(store, 'ok')
    store = reload()
    expect(store.showingResult).toBe(true)
    expect(store.score).toBe(30)
    store.start()
    expect(store.answers).toHaveLength(10)
  })

  it('terminar cuenta como viaje y empieza la racha', () => {
    const store = useDailyChallengeStore()
    const before = useProgressStore().gamesPlayed
    expect(store.streak.current).toBe(0)
    store.start()
    for (let i = 0; i < 10; i++) answer(store, 'ok')
    expect(useProgressStore().gamesPlayed).toBe(before + 1)
    expect(store.streak).toMatchObject({ current: 1, best: 1, playedToday: true })
  })
})

describe('Reto diario: compartir', () => {
  it('una fila de cuadritos por pregunta', () => {
    expect(emojiRow(['ok', 'meh', 'fail'])).toBe('🟩🟨🟥')
  })

  it('el texto lleva el número, el puntaje, la fila y el link', () => {
    const text = dailyShareText({
      number: 3,
      score: 24,
      max: 30,
      marks: ['ok', 'meh', 'ok', 'fail', 'ok', 'ok', 'meh', 'ok', 'ok', 'fail'],
      streak: 5,
      url: 'https://georetos.example/diario',
    })
    expect(text.split('\n')).toEqual([
      'GeoRetos · Reto diario Nº 3',
      '24/30 · racha de 5 🔥',
      '🟩🟨🟩🟥🟩🟩🟨🟩🟩🟥',
      'https://georetos.example/diario',
    ])
  })

  it('la racha solo se menciona desde 2 días', () => {
    const base = { number: 1, score: 30, max: 30, marks: [], url: 'u' }
    expect(dailyShareText({ ...base, streak: 1 })).not.toContain('racha')
    expect(dailyShareText({ ...base, streak: 2 })).toContain('racha de 2 🔥')
  })
})
