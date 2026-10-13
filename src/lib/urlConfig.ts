/**
 * La configuración de cada partida vive en la URL, por ejemplo
 * /mapa?region=sudamerica&n=10&seed=k3x9tq o /trivia?dificultad=media&seed=abc.
 */
import type { LocationQuery, LocationQueryRaw } from 'vue-router'

import { getCountry } from './countries'
import type { LocateConfig, LocateCount } from './locate'
import { isRegionId } from './regions'
import { SILHOUETTE_COUNTS, type SilhouetteConfig, type SilhouetteCount } from './silhouette'
import type { Difficulty, RegionId } from './types'
import { isTypingMinutes, type TypingConfig } from './typing'
import type { RunConfig, RunMode } from './variants'

export interface TriviaUrlConfig {
  difficulty: Difficulty
  region: RegionId
  timer: boolean
  seed: string
  only?: string[]
}

const DIFFICULTIES: readonly Difficulty[] = ['facil', 'media', 'dificil']
const SEED_PATTERN = /^[a-z0-9-]{1,32}$/

function single(query: LocationQuery, key: string): string | undefined {
  const value = query[key]
  const first = Array.isArray(value) ? value[0] : value
  return typeof first === 'string' ? first : undefined
}

function parseOnly(query: LocationQuery): string[] | undefined {
  const raw = single(query, 'paises')
  if (!raw) return undefined
  const codes = raw.split(',').filter((code) => getCountry(code)?.playable)
  return codes.length > 0 ? [...new Set(codes)] : undefined
}

function parseSeed(query: LocationQuery): string | undefined {
  const seed = single(query, 'seed')
  return seed && SEED_PATTERN.test(seed) ? seed : undefined
}

/** Configuración de "Ubica el país"; seed vacío si la URL no la trae. null si falta o no es válida. */
export function parseLocateQuery(query: LocationQuery): LocateConfig | null {
  const region = single(query, 'region')
  const n = single(query, 'n')
  if (!isRegionId(region)) return null
  let count: LocateCount
  if (n === '10' || n === '20') count = Number(n) as 10 | 20
  else if (n === 'todos') count = 'todos'
  else return null
  return { region, count, seed: parseSeed(query) ?? '', only: parseOnly(query) }
}

export function locateQuery(config: LocateConfig): LocationQueryRaw {
  return {
    region: config.region,
    n: String(config.count),
    seed: config.seed,
    ...(config.only ? { paises: config.only.join(',') } : {}),
  }
}

/** Configuración de Trivia; región opcional (por defecto, el mundo). */
export function parseTriviaQuery(query: LocationQuery): TriviaUrlConfig | null {
  const difficulty = single(query, 'dificultad')
  if (!difficulty || !(DIFFICULTIES as readonly string[]).includes(difficulty)) return null
  const region = single(query, 'region') ?? 'mundo'
  if (!isRegionId(region)) return null
  return {
    difficulty: difficulty as Difficulty,
    region,
    timer: single(query, 'tiempo') === '1',
    seed: parseSeed(query) ?? '',
    only: parseOnly(query),
  }
}

export function triviaQuery(config: TriviaUrlConfig): LocationQueryRaw {
  return {
    dificultad: config.difficulty,
    ...(config.region !== 'mundo' ? { region: config.region } : {}),
    ...(config.timer ? { tiempo: '1' } : {}),
    seed: config.seed,
    ...(config.only ? { paises: config.only.join(',') } : {}),
  }
}

/** Configuración de Silueta: /silueta?region=europa&n=5&seed=… */
export function parseSilhouetteQuery(query: LocationQuery): SilhouetteConfig | null {
  const region = single(query, 'region') ?? 'mundo'
  const n = Number(single(query, 'n'))
  if (!isRegionId(region) || !(SILHOUETTE_COUNTS as readonly number[]).includes(n)) return null
  return {
    region,
    count: n as SilhouetteCount,
    seed: parseSeed(query) ?? '',
    only: parseOnly(query),
  }
}

export function silhouetteQuery(config: SilhouetteConfig): LocationQueryRaw {
  return {
    ...(config.region !== 'mundo' ? { region: config.region } : {}),
    n: String(config.count),
    seed: config.seed,
    ...(config.only ? { paises: config.only.join(',') } : {}),
  }
}

/**
 * Partidas sin cantidad fija: /mapa?variante=contrarreloj&region=europa&seed=…,
 * /trivia?variante=supervivencia&seed=… En Supervivencia la región es siempre el
 * mundo y la dificultad sube sola.
 */
export function parseRunQuery(mode: RunMode, query: LocationQuery): RunConfig | null {
  const variant = single(query, 'variante')
  if (variant !== 'contrarreloj' && variant !== 'supervivencia') return null
  const region = variant === 'supervivencia' ? 'mundo' : (single(query, 'region') ?? 'mundo')
  if (!isRegionId(region)) return null
  const difficulty = single(query, 'dificultad') ?? 'media'
  if (!(DIFFICULTIES as readonly string[]).includes(difficulty)) return null
  return {
    mode,
    variant,
    region,
    difficulty: difficulty as Difficulty,
    seed: parseSeed(query) ?? '',
  }
}

export function runQuery(config: RunConfig): LocationQueryRaw {
  return {
    variante: config.variant,
    ...(config.variant === 'contrarreloj' && config.region !== 'mundo'
      ? { region: config.region }
      : {}),
    ...(config.mode === 'trivia' && config.variant === 'contrarreloj'
      ? { dificultad: config.difficulty }
      : {}),
    seed: config.seed,
  }
}

/** Escribe los países: /escribe?region=europa&min=10 (sin azar: no lleva semilla). */
export function parseTypingQuery(query: LocationQuery): TypingConfig | null {
  const region = single(query, 'region') ?? 'mundo'
  const minutes = Number(single(query, 'min'))
  if (!isRegionId(region) || !isTypingMinutes(minutes)) return null
  return { region, minutes }
}

export function typingQuery(config: TypingConfig): LocationQueryRaw {
  return {
    ...(config.region !== 'mundo' ? { region: config.region } : {}),
    min: String(config.minutes),
  }
}
