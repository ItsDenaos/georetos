import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { es } from '@/i18n/es'
import { getCountry } from '@/lib/countries'
import type { AnswerMark, GameResult } from '@/lib/results'
import { createRng } from '@/lib/rng'
import { maxScore, silhouettePoints } from '@/lib/scoring'
import {
  buildSilhouetteQueue,
  evaluateGuess,
  roundState,
  type Guess,
  type SilhouetteConfig,
} from '@/lib/silhouette'

/** Partida de práctica del modo Silueta. */
export const useSilhouetteStore = defineStore('silhouette', () => {
  const config = ref<SilhouetteConfig | null>(null)
  const queue = ref<string[]>([])
  const index = ref(0)
  const guesses = ref<Record<string, Guess[]>>({})
  const finished = ref(false)
  const startedAt = ref(0)
  const endedAt = ref(0)

  const target = computed(() => queue.value[index.value] ?? null)
  const currentGuesses = computed(() => (target.value ? (guesses.value[target.value] ?? []) : []))
  const state = computed(() => roundState(currentGuesses.value))
  const isLast = computed(() => index.value >= queue.value.length - 1)

  function pointsFor(code: string): number {
    const list = guesses.value[code] ?? []
    return silhouettePoints(list.length, roundState(list).solved)
  }

  const score = computed(() => queue.value.reduce((sum, code) => sum + pointsFor(code), 0))

  function start(c: SilhouetteConfig) {
    config.value = c
    queue.value = buildSilhouetteQueue(c, createRng(`silueta|${c.seed}|${c.region}|${c.count}`))
    index.value = 0
    guesses.value = {}
    finished.value = queue.value.length === 0
    startedAt.value = Date.now()
    endedAt.value = 0
  }

  /** Registra un intento; null si la silueta ya terminó o el país ya se probó. */
  function guess(code: string): Guess | null {
    const current = target.value
    if (!current || state.value.done || !getCountry(code)?.playable) return null
    if (currentGuesses.value.some((g) => g.code === code)) return null
    const result = evaluateGuess(current, code)
    guesses.value[current] = [...currentGuesses.value, result]
    return result
  }

  function next() {
    if (!state.value.done) return
    if (isLast.value) {
      finished.value = true
      endedAt.value = Date.now()
    } else {
      index.value += 1
    }
  }

  function buildResult(): Omit<GameResult, 'isRecord' | 'previousBest'> | null {
    const c = config.value
    if (!c || !finished.value) return null
    const missed = queue.value.filter((code) => !roundState(guesses.value[code] ?? []).solved)
    return {
      mode: 'silhouette',
      region: c.region,
      count: c.count,
      seed: c.seed,
      review: Boolean(c.only),
      only: c.only,
      score: score.value,
      maxScore: maxScore('silhouette', queue.value.length),
      correct: queue.value.length - missed.length,
      total: queue.value.length,
      timeMs: endedAt.value - startedAt.value,
      finishedAt: new Date(endedAt.value).toISOString(),
      answers: queue.value.map((code) => {
        const list = guesses.value[code] ?? []
        const mark: AnswerMark = !roundState(list).solved
          ? 'fail'
          : list.length === 1
            ? 'ok'
            : 'meh'
        return { code, mark }
      }),
      misses: missed.map((code) => {
        const country = getCountry(code)
        return {
          code,
          label: country?.name ?? code,
          detail: country?.capital ? es.results.capitalHint(country.capital) : undefined,
        }
      }),
    }
  }

  return {
    config,
    queue,
    index,
    guesses,
    finished,
    target,
    currentGuesses,
    state,
    isLast,
    score,
    pointsFor,
    start,
    guess,
    next,
    buildResult,
  }
})
