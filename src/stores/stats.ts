import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import {
  evaluateAchievements,
  isAchievementId,
  newlyUnlocked,
  type AchievementId,
} from '@/lib/achievements'
import {
  STORAGE_KEY as DAILY_CHALLENGE_KEY,
  readDailyChallengeDays,
} from '@/lib/dailyChallengeRecord'
import { STORAGE_KEY as DAILY_SILHOUETTE_KEY, readDailyEntries } from '@/lib/dailyRecord'
import type { GameResult } from '@/lib/results'
import {
  addGame,
  parseStats,
  playedFromResult,
  seedStats,
  snapshotOf,
  type PlayedGame,
  type StatsData,
} from '@/lib/stats'
import { readJson, removeKey, writeJson } from '@/lib/storage'
import { useAchievementToasts } from './achievementToasts'
import { STORAGE_KEY as PROGRESS_KEY, useProgressStore } from './progress'
import { STORAGE_KEY as LAST_RESULT_KEY } from './result'

export const STATS_STORAGE_KEY = 'georetos:v1:estadisticas'
export const ACHIEVEMENTS_STORAGE_KEY = 'georetos:v1:logros'

type Unlocked = Partial<Record<AchievementId, string>>

function loadUnlocked(): Unlocked | null {
  const raw = readJson<Record<string, unknown> | null>(ACHIEVEMENTS_STORAGE_KEY, null)
  if (!raw || typeof raw !== 'object') return null
  return Object.fromEntries(
    Object.entries(raw).filter(
      (entry): entry is [AchievementId, string] =>
        isAchievementId(entry[0]) && typeof entry[1] === 'string',
    ),
  )
}

/**
 * Estadísticas de "Mi progreso" y logros, guardados en localStorage. Se apoya
 * en el store de progreso (partidas y sellos) sin que este dependa de él, así la
 * portada no carga los datos de países.
 */
export const useStatsStore = defineStore('stats', () => {
  const progress = useProgressStore()

  // La primera vez se deduce lo posible de lo guardado antes de esta versión.
  const data = ref<StatsData>(
    parseStats(readJson<unknown>(STATS_STORAGE_KEY, null)) ??
      seedStats({
        records: progress.records,
        dailyChallenge: readDailyChallengeDays(),
        dailySilhouette: readDailyEntries(),
      }),
  )
  writeJson(STATS_STORAGE_KEY, data.value)

  const savedUnlocked = loadUnlocked()
  const unlocked = ref<Unlocked>(savedUnlocked ?? {})

  const snapshot = computed(() =>
    snapshotOf(data.value, {
      gamesPlayed: progress.gamesPlayed,
      stamps: Object.keys(progress.records).length,
    }),
  )
  // Un logro desbloqueado no se pierde aunque cambie el avance.
  const achievements = computed(() =>
    evaluateAchievements(snapshot.value).map((a) => {
      const unlockedAt = unlocked.value[a.id]
      return unlockedAt ? { ...a, value: a.goal, done: true, unlockedAt } : { ...a, unlockedAt }
    }),
  )

  /** Desbloquea lo que ya se cumple; con aviso, salvo `silent`. */
  function check(silent: boolean) {
    const fresh = newlyUnlocked(snapshot.value, unlocked.value)
    if (fresh.length === 0) return
    const at = new Date().toISOString()
    unlocked.value = { ...unlocked.value, ...Object.fromEntries(fresh.map((id) => [id, at])) }
    writeJson(ACHIEVEMENTS_STORAGE_KEY, unlocked.value)
    if (!silent) useAchievementToasts().push(fresh)
  }

  // Primera vez con esta versión: los logros que ya se cumplen, sin aviso.
  if (!savedUnlocked) {
    check(true)
    writeJson(ACHIEVEMENTS_STORAGE_KEY, unlocked.value)
  }

  /** Suma una partida terminada y revisa los logros. */
  function record(game: PlayedGame) {
    data.value = addGame(data.value, game)
    writeJson(STATS_STORAGE_KEY, data.value)
    check(false)
  }

  return { data, unlocked, achievements, record }
})

/**
 * Registra una partida terminada: viaje y récord del pasaporte, estadísticas y
 * logros. Las estadísticas se preparan antes, para que la primera vez no se
 * desbloquee en silencio lo que consiga esta misma partida.
 */
export function finishGame(partial: Omit<GameResult, 'isRecord' | 'previousBest'>): GameResult {
  const stats = useStatsStore()
  const result = useProgressStore().register(partial)
  stats.record(playedFromResult(result))
  return result
}

/**
 * Igual que finishGame, para los retos diarios (cuentan como viaje, no como
 * récord). Sus stores crean antes el de estadísticas (ver dailyChallenge.ts).
 */
export function finishDailyGame(game: PlayedGame | null) {
  const stats = useStatsStore()
  useProgressStore().countTrip()
  if (game) stats.record(game)
}

/**
 * "Borrar mi progreso": partidas, récords, estadísticas, logros y retos diarios
 * de este dispositivo. El tema se conserva. Después conviene recargar la página.
 */
export function clearAllProgress() {
  for (const key of [
    PROGRESS_KEY,
    STATS_STORAGE_KEY,
    ACHIEVEMENTS_STORAGE_KEY,
    DAILY_CHALLENGE_KEY,
    DAILY_SILHOUETTE_KEY,
  ]) {
    removeKey(key)
  }
  removeKey(LAST_RESULT_KEY, 'session')
}
