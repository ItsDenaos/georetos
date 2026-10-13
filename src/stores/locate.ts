import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { es } from '@/i18n/es'
import { getCountry } from '@/lib/countries'
import { buildLocateQueue, type LocateConfig } from '@/lib/locate'
import type { AnswerMark, GameResult } from '@/lib/results'
import { createRng } from '@/lib/rng'
import { locatePoints, maxScore } from '@/lib/scoring'

/**
 * Partida de "Ubica el país". Los intentos de cada país los lleva MapQuestion;
 * aquí solo se registra cómo terminó cada uno.
 */
export const useLocateStore = defineStore('locate', () => {
  const config = ref<LocateConfig | null>(null)
  const queue = ref<string[]>([])
  const index = ref(0)
  const marks = ref<Record<string, AnswerMark>>({})
  const score = ref(0)
  const finished = ref(false)
  const startedAt = ref(0)
  const endedAt = ref(0)

  const target = computed(() => queue.value[index.value] ?? null)
  const total = computed(() => queue.value.length)
  /** ¿El país actual ya terminó (acertado, fallado o saltado)? */
  const resolved = computed(() => target.value !== null && target.value in marks.value)

  function start(c: LocateConfig) {
    config.value = c
    queue.value = buildLocateQueue(c, createRng(`locate|${c.seed}|${c.region}|${c.count}`))
    index.value = 0
    marks.value = {}
    score.value = 0
    finished.value = queue.value.length === 0
    startedAt.value = Date.now()
    endedAt.value = 0
  }

  /** Cómo terminó el país actual: intento en que se acertó (1–3), o null si se falló o se saltó. */
  function resolve(attempt: number | null) {
    const current = target.value
    if (!current || resolved.value || finished.value) return
    marks.value[current] = attempt === null ? 'fail' : attempt === 1 ? 'ok' : 'meh'
    score.value += attempt === null ? 0 : locatePoints(attempt)
  }

  function next() {
    if (!resolved.value || finished.value) return
    index.value += 1
    if (index.value >= queue.value.length) {
      finished.value = true
      endedAt.value = Date.now()
    }
  }

  function buildResult(): Omit<GameResult, 'isRecord' | 'previousBest'> | null {
    const c = config.value
    if (!c || !finished.value) return null
    const failed = queue.value.filter(
      (code) => marks.value[code] !== 'ok' && marks.value[code] !== 'meh',
    )
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
      answers: queue.value.map((code) => ({ code, mark: marks.value[code] ?? 'fail' })),
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
    marks,
    score,
    finished,
    target,
    total,
    resolved,
    start,
    resolve,
    next,
    buildResult,
  }
})
