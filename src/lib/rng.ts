/**
 * Generador aleatorio con semilla: la misma semilla produce siempre la misma
 * partida. Servirá para el reto diario y para compartir retos.
 */

export interface Rng {
  /** Número en [0, 1). */
  next(): number
  /** Entero en [0, max). */
  int(max: number): number
  /** Elemento al azar (la lista no puede estar vacía). */
  pick<T>(items: readonly T[]): T
  /** Copia barajada (Fisher–Yates). */
  shuffle<T>(items: readonly T[]): T[]
}

/** Convierte un texto en un entero de 32 bits (cyrb53 recortado). */
export function hashSeed(seed: string): number {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (h1 ^ h2) >>> 0
}

/** mulberry32: rápido, suficiente para juegos y con periodo de 2³². */
export function createRng(seed: string): Rng {
  let state = hashSeed(seed)
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (max: number) => Math.floor(next() * max)
  return {
    next,
    int,
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new Error('pick() con una lista vacía')
      return items[int(items.length)] as T
    },
    shuffle<T>(items: readonly T[]): T[] {
      const copy = [...items]
      for (let i = copy.length - 1; i > 0; i--) {
        const j = int(i + 1)
        ;[copy[i], copy[j]] = [copy[j] as T, copy[i] as T]
      }
      return copy
    },
  }
}

const SEED_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'

/** Semilla nueva, corta y legible para la URL (por ejemplo "k3x9tq"). */
export function newSeed(length = 6): string {
  const values = new Uint32Array(length)
  crypto.getRandomValues(values)
  return Array.from(values, (v) => SEED_ALPHABET[v % SEED_ALPHABET.length]).join('')
}
