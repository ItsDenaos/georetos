import { describe, expect, it } from 'vitest'

import { bearingDeg, closeness, compassPoint, distanceKm } from '@/lib/geo'

const BOGOTA: [number, number] = [4.711, -74.072]
const LIMA: [number, number] = [-12.046, -77.043]
const LONDRES: [number, number] = [51.507, -0.128]
const NUEVA_YORK: [number, number] = [40.713, -74.006]
const SUVA: [number, number] = [-18.124, 178.45]
const APIA: [number, number] = [-13.833, -171.767]

describe('distancia entre puntos', () => {
  it('calcula distancias conocidas (círculo máximo)', () => {
    expect(distanceKm(BOGOTA, LIMA)).toBeCloseTo(1890, -1)
    expect(distanceKm(LONDRES, NUEVA_YORK)).toBeCloseTo(5570, -1)
  })

  it('es simétrica y vale 0 en el mismo punto', () => {
    expect(distanceKm(LIMA, BOGOTA)).toBeCloseTo(distanceKm(BOGOTA, LIMA), 6)
    expect(distanceKm(LIMA, LIMA)).toBe(0)
  })

  it('cruza el antimeridiano por el camino corto (Fiyi–Samoa)', () => {
    const km = distanceKm(SUVA, APIA)
    expect(km).toBeGreaterThan(1000)
    expect(km).toBeLessThan(1300)
  })
})

describe('rumbo y dirección', () => {
  it('apunta a los cuatro puntos cardinales', () => {
    expect(bearingDeg([0, 0], [10, 0])).toBeCloseTo(0, 6)
    expect(bearingDeg([0, 0], [0, 10])).toBeCloseTo(90, 6)
    expect(bearingDeg([0, 0], [-10, 0])).toBeCloseTo(180, 6)
    expect(bearingDeg([0, 0], [0, -10])).toBeCloseTo(270, 6)
  })

  it('de Bogotá a Lima se va al sur; de Fiyi a Samoa, hacia el este', () => {
    expect(compassPoint(bearingDeg(BOGOTA, LIMA))).toBe('s')
    expect(['e', 'ne']).toContain(compassPoint(bearingDeg(SUVA, APIA)))
  })

  it('redondea a 8 puntos', () => {
    expect(compassPoint(0)).toBe('n')
    expect(compassPoint(359)).toBe('n')
    expect(compassPoint(44)).toBe('ne')
    expect(compassPoint(180)).toBe('s')
    expect(compassPoint(225)).toBe('so')
    expect(compassPoint(270)).toBe('o')
    expect(compassPoint(315)).toBe('no')
    expect(compassPoint(-90)).toBe('o')
  })

  it('clasifica la cercanía de frío a caliente', () => {
    expect(closeness(120)).toBe('hot')
    expect(closeness(900)).toBe('warm')
    expect(closeness(2500)).toBe('cool')
    expect(closeness(9000)).toBe('cold')
  })
})
