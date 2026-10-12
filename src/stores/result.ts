import { ref } from 'vue'
import { defineStore } from 'pinia'

import type { GameResult } from '@/lib/results'
import { readJson, writeJson } from '@/lib/storage'

const STORAGE_KEY = 'georetos:v1:ultimo-resultado'

/** Resultado de la última partida (en sessionStorage, para sobrevivir a una recarga). */
export const useResultStore = defineStore('result', () => {
  const last = ref<GameResult | null>(readJson<GameResult | null>(STORAGE_KEY, null, 'session'))

  function set(result: GameResult) {
    last.value = result
    writeJson(STORAGE_KEY, result, 'session')
  }

  return { last, set }
})
