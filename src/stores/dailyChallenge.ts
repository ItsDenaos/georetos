import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { dailyChallenge } from '@/lib/daily'
import {
  DAILY_LENGTH,
  DAILY_MAX_SCORE,
  DAILY_POINTS,
  generateDailyChallenge,
} from '@/lib/dailyChallenge'
import {
  dailyChallengeStreak,
  readDailyChallengeDays,
  writeDailyChallengeDays,
  type DailyChallengeAnswer,
  type DailyChallengeDay,
} from '@/lib/dailyChallengeRecord'
import { locatePoints } from '@/lib/scoring'
import { playedFromDailyChallenge } from '@/lib/stats'
import { finishDailyGame, useStatsStore } from './stats'

/**
 * Reto diario: cada respuesta se guarda al momento en localStorage, así que
 * recargar no permite volver a sortear una pregunta y el reto se juega una sola
 * vez al día.
 */
export const useDailyChallengeStore = defineStore('dailyChallenge', () => {
  // Las estadísticas se preparan antes de guardar respuestas: la primera vez se
  // deducen de los retos ya terminados y no deben contar dos veces el de hoy.
  useStatsStore()
  const challenge = ref(dailyChallenge())
  const days = ref(readDailyChallengeDays())

  const items = computed(() => generateDailyChallenge(challenge.value.seed))
  const today = computed<DailyChallengeDay | undefined>(() => {
    const day = days.value[challenge.value.key]
    return day?.number === challenge.value.number ? day : undefined
  })
  const answers = computed(() => today.value?.answers ?? [])

  /** Pregunta que se está viendo: puede ser la recién respondida, antes de pulsar "Siguiente". */
  const cursor = ref(answers.value.length)

  const started = computed(() => today.value !== undefined)
  const finished = computed(() => answers.value.length >= DAILY_LENGTH)
  const showingResult = computed(() => finished.value && cursor.value >= DAILY_LENGTH)
  const current = computed(() => items.value[cursor.value] ?? null)
  const currentAnswer = computed<DailyChallengeAnswer | undefined>(
    () => answers.value[cursor.value],
  )
  const score = computed(() => answers.value.reduce((sum, a) => sum + a.points, 0))
  const marks = computed(() => answers.value.map((a) => a.mark))
  const streak = computed(() => dailyChallengeStreak(days.value, challenge.value.number))

  function save(day: DailyChallengeDay) {
    days.value = writeDailyChallengeDays({ ...days.value, [challenge.value.key]: day })
  }

  function start() {
    if (today.value) return
    save({
      number: challenge.value.number,
      answers: [],
      attempts: 0,
      startedAt: new Date().toISOString(),
    })
    cursor.value = 0
  }

  /** Toques equivocados en la pregunta de mapa en curso. */
  function recordAttempt(attempts: number) {
    if (today.value && !currentAnswer.value) save({ ...today.value, attempts })
  }

  function record(answer: DailyChallengeAnswer) {
    const day = today.value
    // Solo se puede responder la pregunta que toca, y una sola vez.
    if (!day || cursor.value !== day.answers.length || finished.value) return
    const next = [...day.answers, answer]
    const done = next.length >= DAILY_LENGTH
    save({
      ...day,
      answers: next,
      attempts: 0,
      ...(done ? { finishedAt: new Date().toISOString() } : {}),
    })
    // El reto terminado cuenta como un viaje del pasaporte y suma a las estadísticas.
    const saved = today.value
    if (done && saved) finishDailyGame(playedFromDailyChallenge(saved, challenge.value.key))
  }

  function recordMap(code: string, attempt: number | null) {
    const points = attempt === null ? 0 : locatePoints(attempt)
    record({ code, mark: attempt === null ? 'fail' : attempt === 1 ? 'ok' : 'meh', points })
  }

  function recordTrivia(code: string, chosen: number, correct: boolean) {
    record({ code, mark: correct ? 'ok' : 'fail', points: correct ? DAILY_POINTS : 0, chosen })
  }

  function advance() {
    if (cursor.value < answers.value.length) cursor.value += 1
  }

  /** Vuelve a leer el día (por ejemplo, al pasar la medianoche o al volver a la página). */
  function refresh() {
    challenge.value = dailyChallenge()
    days.value = readDailyChallengeDays()
    cursor.value = answers.value.length
  }

  return {
    challenge,
    items,
    today,
    answers,
    cursor,
    started,
    finished,
    showingResult,
    current,
    currentAnswer,
    score,
    marks,
    streak,
    maxScore: DAILY_MAX_SCORE,
    start,
    recordAttempt,
    recordMap,
    recordTrivia,
    advance,
    refresh,
  }
})
