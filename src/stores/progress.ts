import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { recordKey, type GameResult, type RecordEntry } from '@/lib/results'
import { isBetter } from '@/lib/scoring'
import { readJson, writeJson } from '@/lib/storage'

const STORAGE_KEY = 'georetos:v1:progreso'

interface ProgressData {
  gamesPlayed: number
  records: Record<string, RecordEntry>
}

function load(): ProgressData {
  const data = readJson<Partial<ProgressData> | null>(STORAGE_KEY, null)
  return {
    gamesPlayed: typeof data?.gamesPlayed === 'number' ? data.gamesPlayed : 0,
    records: data?.records && typeof data.records === 'object' ? data.records : {},
  }
}

/** Récords y partidas jugadas, guardados en localStorage. */
export const useProgressStore = defineStore('progress', () => {
  const data = ref<ProgressData>(load())

  const gamesPlayed = computed(() => data.value.gamesPlayed)
  const records = computed(() => data.value.records)

  /** Registra una partida terminada y dice si es un récord nuevo. */
  function register(result: Omit<GameResult, 'isRecord' | 'previousBest'>): GameResult {
    data.value.gamesPlayed += 1
    const key = recordKey(result)
    const previous = data.value.records[key]
    // Las partidas de repaso no cuentan; un 0 tampoco es un récord que celebrar.
    const isRecord = !result.review && result.score > 0 && isBetter(result, previous)
    if (isRecord) {
      data.value.records[key] = {
        score: result.score,
        maxScore: result.maxScore,
        timeMs: result.timeMs,
        date: new Date().toISOString(),
      }
    }
    writeJson(STORAGE_KEY, data.value)
    return { ...result, isRecord, previousBest: previous?.score }
  }

  /** Suma un viaje sin récord (por ejemplo, el reto diario). */
  function countTrip() {
    data.value.gamesPlayed += 1
    writeJson(STORAGE_KEY, data.value)
  }

  return { gamesPlayed, records, register, countTrip }
})
