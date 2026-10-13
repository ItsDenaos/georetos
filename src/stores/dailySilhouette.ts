import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { getCountry } from '@/lib/countries'
import { dailyChallenge } from '@/lib/daily'
import { readDailyEntries, writeDailyEntries } from '@/lib/dailyRecord'
import { dailySilhouetteCode, evaluateGuess, roundState } from '@/lib/silhouette'
import { playedFromDailySilhouette } from '@/lib/stats'
import { finishDailyGame, useStatsStore } from './stats'

/**
 * Silueta del día: misma para todos en la misma fecha local. El progreso se
 * guarda en localStorage, así una recarga no reinicia el reto ni deja repetirlo.
 */
export const useDailySilhouetteStore = defineStore('dailySilhouette', () => {
  // Como en el Reto diario: las estadísticas, antes de guardar intentos.
  useStatsStore()
  const challenge = ref(dailyChallenge())
  const entries = ref(readDailyEntries())

  const code = computed(() => dailySilhouetteCode(challenge.value.number))
  const guessCodes = computed(() => {
    const entry = entries.value[challenge.value.key]
    return entry?.code === code.value ? entry.guesses : []
  })
  const guesses = computed(() => guessCodes.value.map((g) => evaluateGuess(code.value, g)))
  const state = computed(() => roundState(guesses.value))

  function guess(guessCode: string) {
    if (state.value.done || !getCountry(guessCode)?.playable) return null
    if (guessCodes.value.includes(guessCode)) return null
    const entry = { code: code.value, guesses: [...guessCodes.value, guessCode] }
    entries.value = writeDailyEntries({ ...entries.value, [challenge.value.key]: entry })
    // El reto diario cuenta como un viaje del pasaporte (no como récord) y suma a las estadísticas.
    if (state.value.done) finishDailyGame(playedFromDailySilhouette(entry, challenge.value.key))
    return guesses.value[guesses.value.length - 1] ?? null
  }

  /** Vuelve a calcular el día (por ejemplo, al pasar la medianoche con la página abierta). */
  function refresh() {
    challenge.value = dailyChallenge()
  }

  return { challenge, code, guesses, state, guess, refresh }
})
