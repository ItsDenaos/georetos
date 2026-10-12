import { describe, expect, it } from 'vitest'

import { createRng, hashSeed, newSeed } from '@/lib/rng'

describe('generador con semilla', () => {
  it('la misma semilla produce la misma secuencia', () => {
    const a = createRng('reto-diario')
    const b = createRng('reto-diario')
    expect(Array.from({ length: 20 }, a.next)).toEqual(Array.from({ length: 20 }, b.next))
  })

  it('semillas distintas producen secuencias distintas', () => {
    expect(hashSeed('a')).not.toBe(hashSeed('b'))
    expect(createRng('a').next()).not.toBe(createRng('b').next())
  })

  it('next() queda en [0, 1) e int() en [0, max)', () => {
    const rng = createRng('rango')
    for (let i = 0; i < 1000; i++) {
      const x = rng.next()
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
      const n = rng.int(7)
      expect(Number.isInteger(n) && n >= 0 && n < 7).toBe(true)
    }
  })

  it('shuffle() devuelve una permutación sin tocar el original', () => {
    const items = Array.from({ length: 30 }, (_, i) => i)
    const shuffled = createRng('barajar').shuffle(items)
    expect(shuffled).not.toEqual(items)
    expect([...shuffled].sort((x, y) => x - y)).toEqual(items)
    expect(items[0]).toBe(0)
  })

  it('pick() falla con una lista vacía', () => {
    expect(() => createRng('x').pick([])).toThrow('pick() con una lista vacía')
  })

  it('newSeed() genera semillas cortas aptas para la URL', () => {
    const seed = newSeed()
    expect(seed).toMatch(/^[a-z0-9]{6}$/)
    expect(newSeed()).not.toBe(seed)
  })
})
