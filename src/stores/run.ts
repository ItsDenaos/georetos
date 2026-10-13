import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

import { es } from '@/i18n/es'
import { getCountry } from '@/lib/countries'
import type { Question } from '@/lib/questions'
import type { Answer, AnswerMark, GameResult } from '@/lib/results'
import {
  createMapStream,
  createTriviaStream,
  type MapStream,
  type TriviaStream,
} from '@/lib/streams'
import type { Difficulty } from '@/lib/types'
import {
  applyCorrect,
  applyMiss,
  createRun,
  difficultyOfLevel,
  endRun,
  levelOf,
  remainingMs,
  TIME_ATTACK_MS,
  type RunConfig,
  type RunState,
} from '@/lib/variants'

export type RunItem =
  { kind: 'map'; code: string } | { kind: 'trivia'; question: Question; difficulty: Difficulty }

/** Por qué terminó la partida. */
export type EndReason = 'time' | 'lives' | 'exhausted'

/**
 * Partida sin cantidad fija (Contrarreloj o Supervivencia) de "Ubica el país"
 * o de la Trivia. Las reglas viven en lib/variants.ts; las preguntas, en
 * lib/streams.ts; aquí solo se juntan.
 */
export const useRunStore = defineStore('run', () => {
  const config = ref<RunConfig | null>(null)
  const run = ref<RunState>(createRun('contrarreloj'))
  const item = shallowRef<RunItem | null>(null)
  const answers = ref<Answer[]>([])
  /** Trivia: respuesta a la pregunta actual (para mostrar el resultado). */
  const currentAnswer = ref<{ chosen: number; correct: boolean } | undefined>(undefined)
  /** ¿La pregunta actual ya terminó? */
  const resolved = ref(false)
  const finished = ref(false)
  const endReason = ref<EndReason | null>(null)
  const startedAt = ref(0)
  const now = ref(0)
  const endedAt = ref(0)
  /** Número de pregunta (1 = primera). */
  const position = ref(0)

  let mapStream: MapStream | null = null
  let triviaStream: TriviaStream | null = null

  const level = computed(() => levelOf(run.value.correct))
  const timeLeft = computed(() =>
    run.value.variant === 'contrarreloj'
      ? remainingMs(run.value, now.value - startedAt.value)
      : null,
  )

  /** Dificultad de la próxima pregunta: fija en Contrarreloj, según el nivel en Supervivencia. */
  function nextDifficulty(): Difficulty | undefined {
    const c = config.value
    if (!c) return undefined
    if (c.variant === 'supervivencia') return difficultyOfLevel(level.value)
    return c.mode === 'trivia' ? c.difficulty : undefined
  }

  function finish(reason: EndReason, at: number) {
    if (finished.value) return
    run.value = endRun(run.value)
    finished.value = true
    endReason.value = reason
    now.value = at
    // Una partida de Contrarreloj nunca dura más de sus 60 segundos.
    endedAt.value =
      run.value.variant === 'contrarreloj' ? Math.min(at, startedAt.value + TIME_ATTACK_MS) : at
  }

  function loadNext(at: number) {
    const c = config.value
    if (!c) return
    resolved.value = false
    currentAnswer.value = undefined
    const difficulty = nextDifficulty()
    if (c.mode === 'locate') {
      const code = mapStream?.next(difficulty) ?? null
      item.value = code ? { kind: 'map', code } : null
    } else {
      const question = triviaStream?.next(difficulty ?? 'media') ?? null
      item.value = question ? { kind: 'trivia', question, difficulty: difficulty ?? 'media' } : null
    }
    if (item.value) position.value += 1
    else finish('exhausted', at)
  }

  function start(c: RunConfig, at: number = Date.now()) {
    config.value = c
    run.value = createRun(c.variant)
    answers.value = []
    finished.value = false
    endReason.value = null
    position.value = 0
    startedAt.value = at
    now.value = at
    endedAt.value = 0
    mapStream = c.mode === 'locate' ? createMapStream(c.seed, c.region) : null
    triviaStream = c.mode === 'trivia' ? createTriviaStream(c.seed, c.region) : null
    loadNext(at)
  }

  function record(code: string, mark: AnswerMark) {
    answers.value = [...answers.value, { code, mark }]
    run.value = mark === 'fail' ? applyMiss(run.value) : applyCorrect(run.value)
    resolved.value = true
  }

  /** Mapa: un toque equivocado. En Contrarreloj cuesta tiempo; en Supervivencia, nada (la vida se pierde al fallar el país). */
  function mapAttempt() {
    if (finished.value || resolved.value) return
    if (run.value.variant === 'contrarreloj') run.value = applyMiss(run.value)
  }

  /** Mapa: el país terminó (intento 1–3, o null si se falló o se saltó). */
  function resolveMap(attempt: number | null) {
    const current = item.value
    if (finished.value || resolved.value || current?.kind !== 'map') return
    record(current.code, attempt === null ? 'fail' : attempt === 1 ? 'ok' : 'meh')
  }

  function answerTrivia(chosen: number) {
    const current = item.value
    if (finished.value || resolved.value || current?.kind !== 'trivia') return
    const correct = chosen === current.question.answer
    currentAnswer.value = { chosen, correct }
    record(current.question.subject, correct ? 'ok' : 'fail')
  }

  function advance(at: number = Date.now()) {
    if (finished.value || !resolved.value) return
    if (run.value.over) finish('lives', at)
    else loadNext(at)
  }

  /** Avanza el reloj; en Contrarreloj, al llegar a cero termina la partida. */
  function tick(at: number = Date.now()) {
    if (finished.value) return
    now.value = at
    if (timeLeft.value === 0) finish('time', at)
  }

  function buildResult(): Omit<GameResult, 'isRecord' | 'previousBest'> | null {
    const c = config.value
    if (!c || !finished.value) return null
    const failed = [...new Set(answers.value.filter((a) => a.mark === 'fail').map((a) => a.code))]
    return {
      mode: c.mode,
      variant: c.variant,
      region: c.region,
      difficulty: c.mode === 'trivia' && c.variant === 'contrarreloj' ? c.difficulty : undefined,
      seed: c.seed,
      review: false,
      score: run.value.correct,
      maxScore: answers.value.length,
      correct: run.value.correct,
      total: answers.value.length,
      timeMs: endedAt.value - startedAt.value,
      finishedAt: new Date(endedAt.value).toISOString(),
      answers: answers.value,
      reachedLevel: c.variant === 'supervivencia' ? level.value : undefined,
      misses: failed.map((code) => {
        const country = getCountry(code)
        const detail = country?.capital ? es.results.capitalHint(country.capital) : undefined
        return { code, label: country?.name ?? code, detail }
      }),
    }
  }

  return {
    config,
    run,
    item,
    answers,
    currentAnswer,
    resolved,
    finished,
    endReason,
    position,
    level,
    timeLeft,
    start,
    mapAttempt,
    resolveMap,
    answerTrivia,
    advance,
    tick,
    buildResult,
  }
})
