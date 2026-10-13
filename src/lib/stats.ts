/**
 * Estadísticas de "Mi progreso": cómo te va con cada país, los días jugados y lo
 * que necesitan los logros. Lógica pura; el store (stores/stats.ts) las guarda.
 *
 * Escribe los países cuenta para los días, el tiempo y las regiones, pero no para
 * la precisión por país: no recordar un nombre a contrarreloj no es fallarlo.
 */
import type { AchievementSnapshot, Feat } from './achievements'
import { CONTINENTS, getCountry } from './countries'
import { dayNumber, localDateKey } from './daily'
import { dailyKind } from './dailyChallenge'
import type { DailyChallengeDay } from './dailyChallengeRecord'
import { DAILY_LENGTH } from './dailyChallengeRules'
import type { DailyEntry } from './dailyRecord'
import type { MapColor } from './map'
import { REGIONS, isRegionId } from './regions'
import { parseRecordKey, type AnswerMark, type GameResult, type RecordEntry } from './results'
import { SILHOUETTE_ATTEMPTS } from './silhouetteRules'
import { computeStreak, type Streak } from './streak'
import type { ContinentId, RegionId } from './types'

/** Microestado: país de menos de 1.000 km² (Mónaco, Malta, Granada…). */
export const MICROSTATE_MAX_AREA = 1000

/** Mapa de lo que sabes: verde desde el 80 %, amarillo desde el 50 %. */
export const KNOWN_AT = 0.8
export const HALF_KNOWN_AT = 0.5

export type AnswerKind = 'map' | 'quiz' | 'silhouette' | 'typing'

export interface PlayedAnswer {
  code: string
  mark: AnswerMark
  kind: AnswerKind
}

/** Una partida terminada, tal como la necesitan las estadísticas. */
export interface PlayedGame {
  /** Fecha local "AAAA-MM-DD" en que terminó. */
  day: string
  region: RegionId
  timeMs: number
  answers: readonly PlayedAnswer[]
  feats: readonly Feat[]
}

export interface CountryStat {
  ok: number
  meh: number
  fail: number
}

export interface StatsData {
  /** Desde cuándo se cuentan las estadísticas por país (fecha ISO). */
  since: string
  countries: Record<string, CountryStat>
  /** Días con al menos una partida terminada ("AAAA-MM-DD"). */
  days: string[]
  timeMs: number
  regions: RegionId[]
  /** Microestados encontrados en el mapa al primer intento. */
  microstates: string[]
  feats: Feat[]
}

export function emptyStats(now: Date = new Date()): StatsData {
  return {
    since: now.toISOString(),
    countries: {},
    days: [],
    timeMs: 0,
    regions: [],
    microstates: [],
    feats: [],
  }
}

/** Lee lo guardado sin fiarse de su forma. */
export function parseStats(raw: unknown): StatsData | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Partial<StatsData>
  const strings = (value: unknown) =>
    Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
  const countries: Record<string, CountryStat> = {}
  for (const [code, stat] of Object.entries(r.countries ?? {})) {
    const s = stat as Partial<CountryStat>
    const n = (v: unknown) => (typeof v === 'number' && v > 0 ? Math.floor(v) : 0)
    countries[code] = { ok: n(s.ok), meh: n(s.meh), fail: n(s.fail) }
  }
  return {
    since: typeof r.since === 'string' ? r.since : new Date().toISOString(),
    countries,
    days: strings(r.days),
    timeMs: typeof r.timeMs === 'number' && r.timeMs > 0 ? r.timeMs : 0,
    regions: strings(r.regions).filter(isRegionId),
    microstates: strings(r.microstates),
    feats: strings(r.feats) as Feat[],
  }
}

export function isMicrostate(code: string): boolean {
  const area = getCountry(code)?.area
  return area !== undefined && area < MICROSTATE_MAX_AREA
}

const union = <T>(list: readonly T[], more: Iterable<T>) => [...new Set([...list, ...more])]

/** Suma una partida a las estadísticas. */
export function addGame(data: StatsData, game: PlayedGame): StatsData {
  const countries = { ...data.countries }
  const microstates: string[] = []
  for (const answer of game.answers) {
    if (answer.kind === 'typing' || !getCountry(answer.code)) continue
    const stat = countries[answer.code] ?? { ok: 0, meh: 0, fail: 0 }
    countries[answer.code] = { ...stat, [answer.mark]: stat[answer.mark] + 1 }
    if (answer.kind === 'map' && answer.mark === 'ok' && isMicrostate(answer.code)) {
      microstates.push(answer.code)
    }
  }
  return {
    ...data,
    countries,
    days: union(data.days, [game.day]).sort(),
    timeMs: data.timeMs + Math.max(0, game.timeMs),
    regions: union(data.regions, [game.region]),
    microstates: union(data.microstates, microstates),
    feats: union(data.feats, game.feats),
  }
}

const KIND_OF_MODE: Record<GameResult['mode'], AnswerKind> = {
  locate: 'map',
  trivia: 'quiz',
  silhouette: 'silhouette',
  typing: 'typing',
}

/** Hazañas de una partida para los logros. */
export function featsOf(result: Omit<GameResult, 'isRecord' | 'previousBest'>): Feat[] {
  const classic = (result.variant ?? 'clasica') === 'clasica' && !result.review
  const perfect = result.total > 0 && result.score === result.maxScore
  const feats: Feat[] = []
  if (
    classic &&
    perfect &&
    result.mode === 'locate' &&
    result.region === 'sudamerica' &&
    result.count === 'todos'
  ) {
    feats.push('sudamerica-perfecta')
  }
  if (
    classic &&
    perfect &&
    result.mode === 'trivia' &&
    result.difficulty === 'dificil' &&
    result.total === 10
  ) {
    feats.push('trivia-dificil-perfecta')
  }
  if (result.mode === 'silhouette' && result.answers?.some((a) => a.mark === 'ok')) {
    feats.push('silueta-primera')
  }
  return feats
}

export function playedFromResult(
  result: Omit<GameResult, 'isRecord' | 'previousBest'>,
  day: string = localDateKey(),
): PlayedGame {
  const kind = KIND_OF_MODE[result.mode]
  return {
    day,
    region: result.region,
    timeMs: result.timeMs,
    answers: (result.answers ?? []).map((a) => ({ ...a, kind })),
    feats: featsOf(result),
  }
}

/** Reto diario terminado. */
export function playedFromDailyChallenge(day: DailyChallengeDay, key: string): PlayedGame {
  const start = day.startedAt ? Date.parse(day.startedAt) : NaN
  const end = day.finishedAt ? Date.parse(day.finishedAt) : NaN
  return {
    day: key,
    region: 'mundo',
    timeMs: Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, end - start) : 0,
    answers: day.answers.map((a, i) => ({
      code: a.code,
      mark: a.mark,
      kind: dailyKind(i) === 'map' ? 'map' : 'quiz',
    })),
    feats: [],
  }
}

/** Silueta del día terminada (o null si aún no terminó). */
export function playedFromDailySilhouette(entry: DailyEntry, key: string): PlayedGame | null {
  const at = entry.guesses.indexOf(entry.code)
  if (at < 0 && entry.guesses.length < SILHOUETTE_ATTEMPTS) return null
  const mark: AnswerMark = at === 0 ? 'ok' : at > 0 ? 'meh' : 'fail'
  return {
    day: key,
    region: 'mundo',
    timeMs: 0,
    answers: [{ code: entry.code, mark, kind: 'silhouette' }],
    feats: at === 0 ? ['silueta-primera'] : [],
  }
}

export interface SavedProgress {
  records: Readonly<Record<string, RecordEntry>>
  dailyChallenge: Readonly<Record<string, DailyChallengeDay>>
  dailySilhouette: Readonly<Record<string, DailyEntry>>
}

/**
 * Primera vez con "Mi progreso": se deduce lo que se puede de lo guardado antes.
 * Los récords dan días y regiones; los retos diarios, también sus respuestas.
 */
export function seedStats(saved: SavedProgress, now: Date = new Date()): StatsData {
  let data = emptyStats(now)
  for (const [key, entry] of Object.entries(saved.records)) {
    const record = parseRecordKey(key)
    const date = new Date(entry.date)
    const feats: Feat[] = []
    const perfect = entry.score === entry.maxScore
    if (record.variant === 'clasica' && perfect) {
      if (key === 'locate|sudamerica|todos') feats.push('sudamerica-perfecta')
      if (record.mode === 'trivia' && record.level === 'dificil' && entry.maxScore === 10) {
        feats.push('trivia-dificil-perfecta')
      }
    }
    data = addGame(data, {
      day: Number.isNaN(date.getTime()) ? localDateKey(now) : localDateKey(date),
      region: isRegionId(record.region) ? record.region : 'mundo',
      timeMs: 0,
      answers: [],
      feats,
    })
  }
  for (const [key, day] of Object.entries(saved.dailyChallenge)) {
    if (day.answers.length >= DAILY_LENGTH) data = addGame(data, playedFromDailyChallenge(day, key))
  }
  for (const [key, entry] of Object.entries(saved.dailySilhouette)) {
    const game = playedFromDailySilhouette(entry, key)
    if (game) data = addGame(data, game)
  }
  return data
}

export function answered(stat: CountryStat): number {
  return stat.ok + stat.meh + stat.fail
}

/** Aciertos (al primer intento o después) sobre el total. */
export function accuracyOf(stat: CountryStat): number {
  const total = answered(stat)
  return total === 0 ? 0 : (stat.ok + stat.meh) / total
}

export function totals(data: StatsData) {
  let questions = 0
  let right = 0
  for (const stat of Object.values(data.countries)) {
    questions += answered(stat)
    right += stat.ok + stat.meh
  }
  return { questions, right, accuracy: questions === 0 ? 0 : right / questions }
}

export interface ContinentStat {
  continent: Exclude<ContinentId, 'antartida'>
  questions: number
  right: number
  accuracy: number
}

export function continentStats(data: StatsData): ContinentStat[] {
  return CONTINENTS.map((continent) => {
    let questions = 0
    let right = 0
    for (const [code, stat] of Object.entries(data.countries)) {
      if (getCountry(code)?.continent !== continent) continue
      questions += answered(stat)
      right += stat.ok + stat.meh
    }
    return { continent, questions, right, accuracy: questions === 0 ? 0 : right / questions }
  })
}

/** Color del país en el mapa de lo que sabes (sin color si nunca salió). */
export function knowledgeColor(stat: CountryStat | undefined): 'ok' | 'meh' | 'fail' | null {
  if (!stat || answered(stat) === 0) return null
  const accuracy = accuracyOf(stat)
  return accuracy >= KNOWN_AT ? 'ok' : accuracy >= HALF_KNOWN_AT ? 'meh' : 'fail'
}

export function knowledgeMap(data: StatsData): Record<string, MapColor> {
  const map: Record<string, MapColor> = {}
  for (const [code, stat] of Object.entries(data.countries)) {
    const color = knowledgeColor(stat)
    if (color) map[code] = color
  }
  return map
}

export interface WeakCountry {
  code: string
  fails: number
  seen: number
  accuracy: number
}

/** Los países que más fallas: peor proporción primero (con un mínimo de preguntas). */
export function weakestCountries(data: StatsData, limit = 10, minSeen = 2): WeakCountry[] {
  return Object.entries(data.countries)
    .map(([code, stat]) => ({
      code,
      fails: stat.fail,
      seen: answered(stat),
      accuracy: accuracyOf(stat),
    }))
    .filter((c) => c.seen >= minSeen && c.fails > 0)
    .sort((a, b) => a.accuracy - b.accuracy || b.fails - a.fails || b.seen - a.seen)
    .slice(0, limit)
}

/** Países distintos acertados al menos una vez. */
export function knownCountries(data: StatsData): number {
  return Object.values(data.countries).filter((s) => s.ok + s.meh > 0).length
}

export function streakOf(data: StatsData, today: string = localDateKey()): Streak {
  return computeStreak(data.days.map(dayNumber), dayNumber(today))
}

export function snapshotOf(
  data: StatsData,
  progress: { gamesPlayed: number; stamps: number },
  today: string = localDateKey(),
): AchievementSnapshot {
  return {
    gamesPlayed: progress.gamesPlayed,
    stamps: progress.stamps,
    regions: REGIONS.filter((r) => data.regions.includes(r)).length,
    bestStreak: streakOf(data, today).best,
    knownCountries: knownCountries(data),
    microstates: data.microstates.length,
    feats: data.feats,
  }
}
