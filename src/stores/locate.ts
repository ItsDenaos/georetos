import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { es } from '@/i18n/es'
import { getCountry } from '@/lib/countries'
import {
  buildLocateQueue,
  evaluateGuess,
  type LocateConfig,
  type LocateOutcome,
} from '@/lib/locate'
import type { GameResult } from '@/lib/results'
import { createRng } from '@/lib/rng'
import { MAX_ATTEMPTS, maxScore } from '@/lib/scoring'

/** Cómo quedó cada país: primer intento, segundo/tercero o fallado. */
export type LocateMark = 'first' | 'later' | 'failed'

/**
 * playing: esperando un toque · correct: celebrando un acierto ·
 * revealing: mostrando el país tras fallar · finished: partida terminada.
 */
export type LocatePhase = 'playing' | 'correct' | 'revealing' | 'finished'

export const useLocateStore = defineStore('locate', () => {
  const config = ref<LocateConfig | null>(null)
  const queue = ref<string[]>([])
  const index = ref(0)
  const attemptsUsed = ref(0)
  const marks = ref<Record<string, LocateMark>>({})
  const score = ref(0)
  const phase = ref<LocatePhase>('playing')
  const startedAt = ref(0)
  const endedAt = ref(0)

  const target = computed(() => queue.value[index.value] ?? null)
  const total = computed(() => queue.value.length)
  const attemptsLeft = computed(() => MAX_ATTEMPTS - attemptsUsed.value)

  function start(c: LocateConfig) {
    config.value = c
    queue.value = buildLocateQueue(c, createRng(`locate|${c.seed}|${c.region}|${c.count}`))
    index.value = 0
    attemptsUsed.value = 0
    marks.value = {}
    score.value = 0
    phase.value = queue.value.length > 0 ? 'playing' : 'finished'
    startedAt.value = Date.now()
    endedAt.value = 0
  }

  function guess(code: string): LocateOutcome | null {
    const current = target.value
    if (phase.value !== 'playing' || !current) return null
    const outcome = evaluateGuess(current, code, attemptsUsed.value)
    if (outcome.kind === 'correct') {
      marks.value[current] = outcome.attempt === 1 ? 'first' : 'later'
      score.value += outcome.points
      phase.value = 'correct'
    } else if (outcome.kind === 'wrong') {
      attemptsUsed.value += 1
    } else {
      attemptsUsed.value = MAX_ATTEMPTS
      marks.value[current] = 'failed'
      phase.value = 'revealing'
    }
    return outcome
  }

  /** Saltar cuenta como fallo. */
  function skip(): LocateOutcome | null {
    const current = target.value
    if (phase.value !== 'playing' || !current) return null
    marks.value[current] = 'failed'
    attemptsUsed.value = MAX_ATTEMPTS
    phase.value = 'revealing'
    return { kind: 'failed', guessed: null }
  }

  function next() {
    if (phase.value === 'playing' || phase.value === 'finished') return
    index.value += 1
    attemptsUsed.value = 0
    if (index.value >= queue.value.length) {
      phase.value = 'finished'
      endedAt.value = Date.now()
    } else {
      phase.value = 'playing'
    }
  }

  function buildResult(): Omit<GameResult, 'isRecord' | 'previousBest'> | null {
    const c = config.value
    if (!c || phase.value !== 'finished') return null
    const failed = queue.value.filter((code) => marks.value[code] === 'failed')
    return {
      mode: 'locate',
      region: c.region,
      count: c.count,
      seed: c.seed,
      review: Boolean(c.only),
      only: c.only,
      score: score.value,
      maxScore: maxScore('locate', queue.value.length),
      correct: queue.value.length - failed.length,
      total: queue.value.length,
      timeMs: endedAt.value - startedAt.value,
      finishedAt: new Date(endedAt.value).toISOString(),
      misses: failed.map((code) => {
        const country = getCountry(code)
        const detail = country?.capital ? es.results.capitalHint(country.capital) : undefined
        return { code, label: country?.name ?? code, detail }
      }),
    }
  }

  return {
    config,
    queue,
    index,
    attemptsUsed,
    attemptsLeft,
    marks,
    score,
    phase,
    target,
    total,
    start,
    guess,
    skip,
    next,
    buildResult,
  }
})
