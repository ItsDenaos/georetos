/** Cada modo guarda en el resultado cómo terminó cada pregunta, en orden. */
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useLocateStore } from '@/stores/locate'
import { useSilhouetteStore } from '@/stores/silhouette'
import { useTriviaStore } from '@/stores/trivia'

beforeEach(() => setActivePinia(createPinia()))

describe('detalle por pregunta en los resultados', () => {
  it('Ubica el país: primer intento, intento tardío y fallo', () => {
    const store = useLocateStore()
    store.start({ region: 'sudamerica', count: 10, seed: 'detalle' })
    const plan = ['ok', 'meh', 'fail'] as const
    for (let i = 0; i < store.total; i++) {
      const kind = plan[i % 3]
      store.resolve(kind === 'ok' ? 1 : kind === 'meh' ? 3 : null)
      store.next()
    }
    const result = store.buildResult()
    expect(result?.answers).toHaveLength(10)
    expect(result?.answers?.map((a) => a.mark)).toEqual(
      Array.from({ length: 10 }, (_, i) => plan[i % 3]),
    )
    expect(result?.answers?.map((a) => a.code)).toEqual(store.queue)
    // 3 puntos al primer intento, 1 al tercero, 0 si se falló.
    expect(result?.score).toBe(4 * 3 + 3 * 1)
  })

  it('Trivia: acierto o fallo por pregunta', () => {
    const store = useTriviaStore()
    store.start({ difficulty: 'media', region: 'mundo', timer: false, seed: 'detalle' })
    const expected: string[] = []
    while (!store.finished) {
      const q = store.current
      if (!q) break
      const right = expected.length % 2 === 0
      store.answer(right ? q.answer : (q.answer + 1) % 4)
      expected.push(right ? 'ok' : 'fail')
      store.next()
    }
    const result = store.buildResult()
    expect(result?.answers?.map((a) => a.mark)).toEqual(expected)
    expect(result?.answers?.map((a) => a.code)).toEqual(store.questions.map((q) => q.subject))
  })

  it('Silueta: a la primera, más tarde o sin adivinar', () => {
    const store = useSilhouetteStore()
    store.start({ region: 'europa', count: 5, seed: 'detalle' })
    const wrong = ['br', 'jp', 'au', 'za', 'ar', 'in']
    const plan = ['ok', 'meh', 'fail', 'ok', 'meh'] as const
    for (const kind of plan) {
      const target = store.target as string
      if (kind === 'meh') store.guess(wrong[0] as string)
      if (kind === 'fail') for (const w of wrong) store.guess(w)
      else store.guess(target)
      store.next()
    }
    expect(store.buildResult()?.answers?.map((a) => a.mark)).toEqual([...plan])
  })
})
