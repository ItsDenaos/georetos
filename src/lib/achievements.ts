/**
 * Los diez logros, como reglas puras sobre un resumen del progreso. No depende
 * de los datos de países, así la portada y el aviso de logro siguen siendo ligeros.
 */

/** Hazañas de una sola partida (las demás metas se acumulan). */
export const FEATS = ['sudamerica-perfecta', 'trivia-dificil-perfecta', 'silueta-primera'] as const
export type Feat = (typeof FEATS)[number]

export const ACHIEVEMENT_IDS = [
  'primer-viaje',
  'sudamerica-perfecta',
  'trotamundos',
  'mente-enciclopedica',
  'ojo-de-aguila',
  'a-la-primera',
  'constancia',
  'coleccionista',
  'cartografo',
  'maraton',
] as const
export type AchievementId = (typeof ACHIEVEMENT_IDS)[number]

/** Lo que miran los logros. */
export interface AchievementSnapshot {
  gamesPlayed: number
  /** Sellos del pasaporte (récords guardados). */
  stamps: number
  /** Regiones distintas (de las 8) con al menos una partida terminada. */
  regions: number
  /** Racha más larga de días seguidos con alguna partida. */
  bestStreak: number
  /** Países distintos acertados al menos una vez. */
  knownCountries: number
  /** Microestados distintos encontrados en el mapa al primer intento. */
  microstates: number
  feats: readonly Feat[]
}

interface Rule {
  id: AchievementId
  goal: number
  value: (s: AchievementSnapshot) => number
}

const feat = (name: Feat) => (s: AchievementSnapshot) => (s.feats.includes(name) ? 1 : 0)

const RULES: readonly Rule[] = [
  { id: 'primer-viaje', goal: 1, value: (s) => s.gamesPlayed },
  { id: 'sudamerica-perfecta', goal: 1, value: feat('sudamerica-perfecta') },
  { id: 'trotamundos', goal: 8, value: (s) => s.regions },
  { id: 'mente-enciclopedica', goal: 1, value: feat('trivia-dificil-perfecta') },
  { id: 'ojo-de-aguila', goal: 10, value: (s) => s.microstates },
  { id: 'a-la-primera', goal: 1, value: feat('silueta-primera') },
  { id: 'constancia', goal: 7, value: (s) => s.bestStreak },
  { id: 'coleccionista', goal: 10, value: (s) => s.stamps },
  { id: 'cartografo', goal: 100, value: (s) => s.knownCountries },
  { id: 'maraton', goal: 50, value: (s) => s.gamesPlayed },
]

export interface AchievementProgress {
  id: AchievementId
  /** Avance, sin pasar de la meta. */
  value: number
  goal: number
  done: boolean
}

export function evaluateAchievements(snapshot: AchievementSnapshot): AchievementProgress[] {
  return RULES.map(({ id, goal, value }) => {
    const reached = Math.min(goal, Math.max(0, value(snapshot)))
    return { id, value: reached, goal, done: reached >= goal }
  })
}

/** Logros cumplidos que aún no estaban desbloqueados, en el orden de la lista. */
export function newlyUnlocked(
  snapshot: AchievementSnapshot,
  unlocked: Readonly<Partial<Record<AchievementId, string>>>,
): AchievementId[] {
  return evaluateAchievements(snapshot)
    .filter((a) => a.done && !unlocked[a.id])
    .map((a) => a.id)
}

export function isAchievementId(value: unknown): value is AchievementId {
  return typeof value === 'string' && (ACHIEVEMENT_IDS as readonly string[]).includes(value)
}
