/** Los diez logros: reglas puras. */
import { describe, expect, it } from 'vitest'

import {
  ACHIEVEMENT_IDS,
  evaluateAchievements,
  newlyUnlocked,
  type AchievementSnapshot,
} from '@/lib/achievements'

const empty: AchievementSnapshot = {
  gamesPlayed: 0,
  stamps: 0,
  regions: 0,
  bestStreak: 0,
  knownCountries: 0,
  microstates: 0,
  feats: [],
}

function done(snapshot: Partial<AchievementSnapshot>) {
  return evaluateAchievements({ ...empty, ...snapshot })
    .filter((a) => a.done)
    .map((a) => a.id)
}

describe('logros', () => {
  it('son diez y al empezar no hay ninguno', () => {
    expect(ACHIEVEMENT_IDS).toHaveLength(10)
    expect(done({})).toEqual([])
  })

  it('cada meta se cumple justo al llegar', () => {
    expect(done({ gamesPlayed: 1 })).toEqual(['primer-viaje'])
    expect(done({ gamesPlayed: 49 })).toEqual(['primer-viaje'])
    expect(done({ gamesPlayed: 50 })).toEqual(['primer-viaje', 'maraton'])
    expect(done({ regions: 7 })).toEqual([])
    expect(done({ regions: 8 })).toEqual(['trotamundos'])
    expect(done({ microstates: 10 })).toEqual(['ojo-de-aguila'])
    expect(done({ bestStreak: 6 })).toEqual([])
    expect(done({ bestStreak: 7 })).toEqual(['constancia'])
    expect(done({ stamps: 10 })).toEqual(['coleccionista'])
    expect(done({ knownCountries: 99 })).toEqual([])
    expect(done({ knownCountries: 100 })).toEqual(['cartografo'])
  })

  it('las hazañas de una sola partida', () => {
    expect(done({ feats: ['sudamerica-perfecta'] })).toEqual(['sudamerica-perfecta'])
    expect(done({ feats: ['trivia-dificil-perfecta'] })).toEqual(['mente-enciclopedica'])
    expect(done({ feats: ['silueta-primera'] })).toEqual(['a-la-primera'])
  })

  it('el avance no pasa de la meta', () => {
    const cartographer = evaluateAchievements({ ...empty, knownCountries: 37 }).find(
      (a) => a.id === 'cartografo',
    )
    expect(cartographer).toEqual({ id: 'cartografo', value: 37, goal: 100, done: false })
    const marathon = evaluateAchievements({ ...empty, gamesPlayed: 80 }).find(
      (a) => a.id === 'maraton',
    )
    expect(marathon?.value).toBe(50)
  })

  it('solo avisa de los que aún no estaban desbloqueados', () => {
    const snapshot = { ...empty, gamesPlayed: 3, stamps: 10 }
    expect(newlyUnlocked(snapshot, {})).toEqual(['primer-viaje', 'coleccionista'])
    expect(newlyUnlocked(snapshot, { 'primer-viaje': '2026-10-12T10:00:00Z' })).toEqual([
      'coleccionista',
    ])
  })
})
