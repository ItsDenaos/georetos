import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

import { es } from '@/i18n/es'
import { getCountry } from '@/lib/countries'
import type { GameResult } from '@/lib/results'
import {
  createTypingIndex,
  readTyped,
  type Carry,
  type TypingConfig,
  type TypingIndex,
} from '@/lib/typing'

/** Por qué terminó la partida. */
export type TypingEnd = 'time' | 'complete' | 'gaveUp'

/**
 * Partida de "Escribe los países": los países encontrados y el reloj. Cómo se
 * reconoce lo escrito vive en lib/typing.ts.
 */
export const useTypingStore = defineStore('typing', () => {
  const config = ref<TypingConfig | null>(null)
  const index = shallowRef<TypingIndex | null>(null)
  /** Países encontrados, en el orden en que se escribieron. */
  const found = ref<string[]>([])
  const finished = ref(false)
  const endReason = ref<TypingEnd | null>(null)
  const startedAt = ref(0)
  const now = ref(0)
  const endedAt = ref(0)

  const foundSet = computed(() => new Set(found.value))
  const total = computed(() => index.value?.codes.length ?? 0)
  /** Los que faltan, en orden alfabético. */
  const missing = computed(() => index.value?.codes.filter((c) => !foundSet.value.has(c)) ?? [])
  const durationMs = computed(() => (config.value?.minutes ?? 0) * 60_000)
  const timeLeft = computed(() =>
    Math.max(
      0,
      durationMs.value - ((finished.value ? endedAt.value : now.value) - startedAt.value),
    ),
  )

  function finish(reason: TypingEnd, at: number) {
    if (finished.value) return
    finished.value = true
    endReason.value = reason
    now.value = at
    endedAt.value = Math.min(at, startedAt.value + durationMs.value)
  }

  function start(c: TypingConfig, at: number = Date.now()) {
    config.value = c
    index.value = createTypingIndex(c.region)
    found.value = []
    finished.value = false
    endReason.value = null
    startedAt.value = at
    now.value = at
    endedAt.value = 0
  }

  /** Qué hacer con el texto del campo (ver readTyped). */
  function read(text: string, carry?: Carry | null) {
    return index.value ? readTyped(index.value, text, foundSet.value, carry) : null
  }

  /** Marca un país como encontrado. Devuelve false si no vale (repetido, de otra región o fuera de tiempo). */
  function accept(code: string, at: number = Date.now()): boolean {
    if (finished.value || !index.value?.codes.includes(code) || foundSet.value.has(code)) {
      return false
    }
    found.value = [...found.value, code]
    if (found.value.length === total.value) finish('complete', at)
    return true
  }

  /** Avanza el reloj; al llegar a cero termina la partida. */
  function tick(at: number = Date.now()) {
    if (finished.value) return
    now.value = at
    if (timeLeft.value === 0) finish('time', at)
  }

  function giveUp(at: number = Date.now()) {
    finish('gaveUp', at)
  }

  function buildResult(): Omit<GameResult, 'isRecord' | 'previousBest'> | null {
    const c = config.value
    if (!c || !finished.value) return null
    return {
      mode: 'typing',
      region: c.region,
      count: c.minutes,
      seed: '',
      review: false,
      score: found.value.length,
      maxScore: total.value,
      correct: found.value.length,
      total: total.value,
      timeMs: endedAt.value - startedAt.value,
      finishedAt: new Date(endedAt.value).toISOString(),
      answers: [
        ...found.value.map((code) => ({ code, mark: 'ok' as const })),
        ...missing.value.map((code) => ({ code, mark: 'fail' as const })),
      ],
      misses: missing.value.map((code) => {
        const country = getCountry(code)
        const detail = country?.capital ? es.results.capitalHint(country.capital) : undefined
        return { code, label: country?.name ?? code, detail }
      }),
    }
  }

  return {
    config,
    found,
    foundSet,
    total,
    missing,
    finished,
    endReason,
    timeLeft,
    start,
    read,
    accept,
    tick,
    giveUp,
    buildResult,
  }
})
