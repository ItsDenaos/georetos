import { ref } from 'vue'
import { defineStore } from 'pinia'

import { cleanName, resultKey, type Challenge } from '@/lib/challenge'
import type { GameResult } from '@/lib/results'
import { readJson, writeJson } from '@/lib/storage'

/** Desafío aceptado (en sessionStorage, para sobrevivir a una recarga). */
const ACTIVE_KEY = 'georetos:v1:desafio'
/** Nombre que se pone en los desafíos, recordado para la próxima vez. */
export const NAME_KEY = 'georetos:v1:nombre'

interface ActiveChallenge {
  /** Partida a la que pertenece (ver gameKey). */
  key: string
  challenge: Challenge
}

/** Desafíos entre amigos: el aceptado y el nombre propio. */
export const useChallengeStore = defineStore('challenge', () => {
  const active = ref<ActiveChallenge | null>(
    readJson<ActiveChallenge | null>(ACTIVE_KEY, null, 'session'),
  )
  const name = ref(cleanName(readJson<string>(NAME_KEY, '')))

  function accept(key: string, challenge: Challenge) {
    active.value = { key, challenge }
    writeJson(ACTIVE_KEY, active.value, 'session')
  }

  /** El desafío de esta partida, si se aceptó uno. */
  function forResult(result: GameResult): Challenge | null {
    const key = resultKey(result)
    return key && active.value?.key === key ? active.value.challenge : null
  }

  function setName(value: string) {
    name.value = cleanName(value)
    writeJson(NAME_KEY, name.value)
  }

  return { active, name, accept, forResult, setName }
})
