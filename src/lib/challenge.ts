/**
 * Desafía a un amigo, sin servidor: tu resultado viaja dentro del link de la
 * misma partida (?…&desafio=…). Quien lo abre juega las mismas preguntas (misma
 * semilla y opciones) y al final ve su resultado junto al tuyo.
 *
 * Al leerlo se valida todo (números en rango, nombre limpio), pero quien edite
 * el link puede inventar un puntaje: para jugar entre amigos alcanza.
 */
import type { LocationQuery, LocationQueryRaw } from 'vue-router'

import { describeRecord, type RecordLabel } from './recordLabels'
import { recordKey, type AnswerMark, type GameResult } from './results'
import {
  locateQuery,
  parseLocateQuery,
  parseRunQuery,
  parseSilhouetteQuery,
  parseTriviaQuery,
  parseTypingQuery,
  runQuery,
  silhouetteQuery,
  triviaQuery,
  typingQuery,
} from './urlConfig'
import type { TypingMinutes } from './typing'

export const CHALLENGE_PARAM = 'desafio'

/**
 * Versión del generador de partidas. Súbela si cambia cómo se generan las
 * preguntas o los datos de países: los links viejos avisarán de que las
 * preguntas pueden no coincidir.
 */
export const GENERATOR_VERSION = 1

/** Formato del desafío dentro del link. */
const FORMAT = 1
export const NAME_MAX = 20
/** Más largo que esto, el link no puede ser un desafío de verdad. */
const RAW_MAX = 2000
const MARKS_MAX = 300
const MAX_POINTS = 10_000
const MAX_QUESTIONS = 1_000
const MAX_TIME_MS = 24 * 3_600_000

const MARK_TO_CODE: Record<AnswerMark, string> = { ok: 'o', meh: 'm', fail: 'f' }
const CODE_TO_MARK: Record<string, AnswerMark> = { o: 'ok', m: 'meh', f: 'fail' }

export type ChallengeRoute = {
  name: 'locate' | 'trivia' | 'silhouette' | 'typing'
  query: LocationQueryRaw
}

export interface Challenge {
  /** Nombre de quien desafía ('' si no lo puso). */
  name: string
  score: number
  maxScore: number
  correct: number
  total: number
  timeMs: number
  /** Resultado de cada pregunta (vacío si no viene). */
  marks: AnswerMark[]
  /** ¿Se creó con este mismo generador de partidas? */
  sameVersion: boolean
}

type Played = Pick<GameResult, 'score' | 'maxScore' | 'correct' | 'total' | 'timeMs'>

/** Nombre sin caracteres de control ni de dirección de texto, sin espacios de más y corto. */
export function cleanName(raw: string): string {
  const clean = raw
    .replace(/[\p{Cc}\p{Cf}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
  return [...clean].slice(0, NAME_MAX).join('').trim()
}

function toBase64Url(text: string): string {
  let binary = ''
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): string {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4))
  return new TextDecoder('utf-8', { fatal: true }).decode(
    Uint8Array.from(binary, (c) => c.charCodeAt(0)),
  )
}

/** El desafío para el link de la partida. Escribe los países no lleva fila de resultados. */
export function encodeChallenge(result: GameResult, name: string): string {
  const marks =
    result.mode === 'typing' ? '' : (result.answers ?? []).map((a) => MARK_TO_CODE[a.mark]).join('')
  const payload = {
    v: FORMAT,
    g: GENERATOR_VERSION,
    ...(cleanName(name) ? { n: cleanName(name) } : {}),
    s: result.score,
    m: result.maxScore,
    c: result.correct,
    t: result.total,
    ms: Math.round(result.timeMs),
    ...(marks && marks.length <= MARKS_MAX ? { r: marks } : {}),
  }
  return toBase64Url(JSON.stringify(payload))
}

const whole = (value: unknown, max: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max

/** Lee el desafío del link; null si falta o no es válido. */
export function decodeChallenge(raw: unknown): Challenge | null {
  const text = Array.isArray(raw) ? raw[0] : raw
  if (typeof text !== 'string' || text.length === 0 || text.length > RAW_MAX) return null
  if (!/^[A-Za-z0-9_-]+$/.test(text)) return null
  let data: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(fromBase64Url(text))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    data = parsed as Record<string, unknown>
  } catch {
    return null
  }
  const { v, g, n, s, m, c, t, ms, r } = data
  if (v !== FORMAT || !whole(g, 1_000)) return null
  if (!whole(s, MAX_POINTS) || !whole(m, MAX_POINTS) || s > m) return null
  if (!whole(c, MAX_QUESTIONS) || !whole(t, MAX_QUESTIONS) || c > t) return null
  if (!whole(ms, MAX_TIME_MS)) return null
  if (n !== undefined && typeof n !== 'string') return null
  if (r !== undefined && (typeof r !== 'string' || r.length > MARKS_MAX || !/^[omf]*$/.test(r))) {
    return null
  }
  return {
    name: typeof n === 'string' ? cleanName(n) : '',
    score: s,
    maxScore: m,
    correct: c,
    total: t,
    timeMs: ms,
    marks: typeof r === 'string' ? [...r].map((code) => CODE_TO_MARK[code] as AnswerMark) : [],
    sameVersion: g === GENERATOR_VERSION,
  }
}

/**
 * La misma partida que el resultado: misma semilla y opciones. null para las
 * partidas de repaso, que son de cada uno.
 */
export function sameGameRoute(result: GameResult): ChallengeRoute | null {
  if (result.review || result.only) return null
  const { region, seed } = result
  const variant = result.variant ?? 'clasica'
  if (result.mode === 'typing') {
    const minutes = (result.count ?? 10) as TypingMinutes
    return { name: 'typing', query: typingQuery({ region, minutes }) }
  }
  if (!seed) return null
  if (variant !== 'clasica' && result.mode !== 'silhouette') {
    const difficulty = result.difficulty ?? 'media'
    const query = runQuery({ mode: result.mode, variant, region, difficulty, seed })
    return { name: result.mode, query }
  }
  if (result.mode === 'locate') {
    const count = result.count === 20 || result.count === 'todos' ? result.count : 10
    return { name: 'locate', query: locateQuery({ region, count, seed }) }
  }
  if (result.mode === 'silhouette') {
    const count = result.count === 10 ? 10 : 5
    return { name: 'silhouette', query: silhouetteQuery({ region, count, seed }) }
  }
  const difficulty = result.difficulty ?? 'facil'
  return {
    name: 'trivia',
    query: triviaQuery({ difficulty, region, timer: result.timer ?? false, seed }),
  }
}

/** Parámetros que definen una partida (los demás, como el fbclid que añaden algunas apps, se ignoran). */
const GAME_PARAMS = new Set([
  'region',
  'n',
  'seed',
  'dificultad',
  'tiempo',
  'variante',
  'min',
  'paises',
])

/** Identifica una partida por su ruta (sin el desafío), para unir resultado y desafío. */
export function gameKey(name: unknown, query: LocationQuery | LocationQueryRaw): string {
  const entries = Object.entries(query)
    .filter(([key, value]) => GAME_PARAMS.has(key) && value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${String(Array.isArray(value) ? value[0] : value)}`)
    .sort()
  return `${String(name)}?${entries.join('&')}`
}

export function resultKey(result: GameResult): string | null {
  const route = sameGameRoute(result)
  return route ? gameKey(route.name, route.query) : null
}

/** Qué partida es, a partir de su ruta (para presentar el desafío antes de jugar). */
export function gameFromRoute(
  name: unknown,
  query: LocationQuery,
): Pick<GameResult, 'mode' | 'region' | 'count' | 'difficulty' | 'variant'> | null {
  if (name === 'locate' || name === 'trivia') {
    const run = parseRunQuery(name, query)
    if (run) {
      return { mode: name, region: run.region, variant: run.variant, difficulty: run.difficulty }
    }
  }
  if (name === 'locate') {
    const c = parseLocateQuery(query)
    return c && { mode: 'locate', region: c.region, count: c.count }
  }
  if (name === 'trivia') {
    const c = parseTriviaQuery(query)
    return c && { mode: 'trivia', region: c.region, difficulty: c.difficulty }
  }
  if (name === 'silhouette') {
    const c = parseSilhouetteQuery(query)
    return c && { mode: 'silhouette', region: c.region, count: c.count }
  }
  if (name === 'typing') {
    const c = parseTypingQuery(query)
    return c && { mode: 'typing', region: c.region, count: c.minutes }
  }
  return null
}

/** Textos de una partida con un puntaje (modo, región, nivel y puntaje). */
export function describePlayed(
  game: Pick<GameResult, 'mode' | 'region' | 'count' | 'difficulty' | 'variant'>,
  played: Played,
): RecordLabel {
  return describeRecord(recordKey(game), {
    score: played.score,
    maxScore: played.maxScore,
    timeMs: played.timeMs,
    date: new Date().toISOString(),
  })
}

export type DuelOutcome = 'win' | 'lose' | 'tie'

/**
 * ¿Quién gana? Más puntos; si empatan, en Contrarreloj y Supervivencia gana
 * quien respondió menos (falló menos), y después el menor tiempo (en segundos).
 */
export function duelOutcome(mine: Played, theirs: Played, endless = false): DuelOutcome {
  if (mine.score !== theirs.score) return mine.score > theirs.score ? 'win' : 'lose'
  if (endless && mine.maxScore !== theirs.maxScore) {
    return mine.maxScore < theirs.maxScore ? 'win' : 'lose'
  }
  const a = Math.round(mine.timeMs / 1000)
  const b = Math.round(theirs.timeMs / 1000)
  if (a !== b) return a < b ? 'win' : 'lose'
  return 'tie'
}
