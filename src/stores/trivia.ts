import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { es } from '@/i18n/es'
import { generateTrivia, type Question } from '@/lib/questions'
import type { GameResult } from '@/lib/results'
import { maxScore, triviaPoints } from '@/lib/scoring'
import type { TriviaUrlConfig } from '@/lib/urlConfig'

export interface TriviaAnswer {
  questionId: string
  /** Índice elegido; null si se acabó el tiempo. */
  chosen: number | null
  correct: boolean
}

export const useTriviaStore = defineStore('trivia', () => {
  const config = ref<TriviaUrlConfig | null>(null)
  const questions = ref<Question[]>([])
  const index = ref(0)
  const answers = ref<TriviaAnswer[]>([])
  const finished = ref(false)
  const startedAt = ref(0)
  const endedAt = ref(0)

  const current = computed(() => questions.value[index.value] ?? null)
  const currentAnswer = computed(() =>
    current.value ? answers.value.find((a) => a.questionId === current.value?.id) : undefined,
  )
  const score = computed(() => answers.value.reduce((sum, a) => sum + triviaPoints(a.correct), 0))
  const isLast = computed(() => index.value >= questions.value.length - 1)

  function start(c: TriviaUrlConfig) {
    config.value = c
    questions.value = generateTrivia({
      seed: c.seed,
      difficulty: c.difficulty,
      region: c.region,
      only: c.only,
    })
    index.value = 0
    answers.value = []
    finished.value = questions.value.length === 0
    startedAt.value = Date.now()
    endedAt.value = 0
  }

  /** Responde la pregunta actual (null = se acabó el tiempo). Devuelve si acertó. */
  function answer(chosen: number | null): boolean | null {
    const q = current.value
    if (!q || currentAnswer.value || finished.value) return null
    const correct = chosen === q.answer
    answers.value.push({ questionId: q.id, chosen, correct })
    return correct
  }

  function next() {
    if (!currentAnswer.value) return
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
    const missed = questions.value.filter(
      (q) => !answers.value.find((a) => a.questionId === q.id)?.correct,
    )
    return {
      mode: 'trivia',
      region: c.region,
      difficulty: c.difficulty,
      timer: c.timer,
      seed: c.seed,
      review: Boolean(c.only),
      only: c.only,
      score: score.value,
      maxScore: maxScore('trivia', questions.value.length),
      correct: score.value,
      total: questions.value.length,
      timeMs: endedAt.value - startedAt.value,
      finishedAt: new Date(endedAt.value).toISOString(),
      answers: questions.value.map((q) => ({
        code: q.subject,
        mark: answers.value.find((a) => a.questionId === q.id)?.correct ? 'ok' : 'fail',
      })),
      misses: missed.map((q) => ({
        code: q.subject,
        label: q.prompt,
        detail: es.trivia.answerWas(q.options[q.answer]?.label ?? ''),
        flag: q.flag,
      })),
    }
  }

  return {
    config,
    questions,
    index,
    answers,
    finished,
    current,
    currentAnswer,
    score,
    isLast,
    start,
    answer,
    next,
    buildResult,
  }
})
