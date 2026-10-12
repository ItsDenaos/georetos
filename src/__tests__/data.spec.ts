/**
 * Integridad de src/data/countries.json: cada país jugable tiene nombre, capital,
 * bandera y forma (o círculo) en el mapa.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { ALL_COUNTRIES, CONTINENTS, PLAYABLE, countryForFeature, getCountry } from '@/lib/countries'
import { REGIONS } from '@/lib/regions'

// Vitest se ejecuta desde la raíz del proyecto (ver vitest.config.ts).
const root = (path: string) => resolve(process.cwd(), path)

interface Geometry {
  id?: string
  properties: { name: string }
}
const topo = JSON.parse(
  readFileSync(root('node_modules/world-atlas/countries-50m.json'), 'utf8'),
) as {
  objects: { countries: { geometries: Geometry[] } }
}
const geometries = topo.objects.countries.geometries
const topoIds = new Set(geometries.flatMap((g) => (g.id ? [g.id] : [])))
const topoNames = new Set(geometries.map((g) => g.properties.name))

describe('datos de países', () => {
  it('hay 195 países jugables: los 193 de la ONU, el Vaticano y Palestina', () => {
    expect(PLAYABLE).toHaveLength(195)
    expect(getCountry('va')?.playable).toBe(true)
    expect(getCountry('ps')?.playable).toBe(true)
    expect(getCountry('tw')?.playable).toBe(false)
    expect(getCountry('xk')?.playable).toBe(false)
  })

  it('los códigos son únicos y en minúsculas', () => {
    const codes = ALL_COUNTRIES.map((c) => c.code)
    expect(new Set(codes).size).toBe(codes.length)
    for (const code of codes) expect(code).toMatch(/^[a-z]{2}$/)
  })

  it('cada país jugable tiene nombre, capital y datos completos', () => {
    const incomplete = PLAYABLE.filter(
      (c) =>
        !c.name ||
        !c.capital ||
        !(CONTINENTS as readonly string[]).includes(c.continent) ||
        !(REGIONS as readonly string[]).includes(c.zone) ||
        !c.subregion ||
        !(c.area > 0) ||
        c.latlng.length !== 2 ||
        typeof c.landlocked !== 'boolean',
    ).map((c) => c.code)
    expect(incomplete).toEqual([])
  })

  it('nombres y capitales no se repiten entre países jugables', () => {
    expect(new Set(PLAYABLE.map((c) => c.name)).size).toBe(PLAYABLE.length)
    expect(new Set(PLAYABLE.map((c) => c.capital)).size).toBe(PLAYABLE.length)
  })

  it('cada país jugable tiene su bandera SVG local', () => {
    const missing = PLAYABLE.filter(
      (c) => !existsSync(root(`node_modules/flag-icons/flags/4x3/${c.code}.svg`)),
    ).map((c) => c.code)
    expect(missing).toEqual([])
  })

  it('cada país jugable tiene forma en el mapa o se dibuja como círculo', () => {
    const invisible = PLAYABLE.filter(
      (c) => !topoIds.has(c.numeric) && !c.topoNames.some((n) => topoNames.has(n)) && !c.marker,
    ).map((c) => c.code)
    expect(invisible).toEqual([])
    // Tuvalu no tiene forma en countries-50m: va como círculo.
    expect(getCountry('tv')?.marker).toBe(true)
  })

  it('cada forma del mapa pertenece a un país, salvo el glaciar de Siachen', () => {
    const orphans = geometries
      .filter((g) => !countryForFeature(g.id, g.properties.name))
      .map((g) => g.properties.name)
    expect(orphans).toEqual(['Siachen Glacier'])
    // Somalilandia y Chipre del Norte se cuentan como Somalia y Chipre.
    expect(countryForFeature(undefined, 'Somaliland')?.code).toBe('so')
    expect(countryForFeature(undefined, 'N. Cyprus')?.code).toBe('cy')
  })

  it('las capitales están en español', () => {
    const expected: Record<string, string> = {
      gb: 'Londres',
      cn: 'Pekín',
      ru: 'Moscú',
      mx: 'Ciudad de México',
      dk: 'Copenhague',
      us: 'Washington D. C.',
      co: 'Bogotá',
    }
    for (const [code, capital] of Object.entries(expected)) {
      expect(getCountry(code)?.capital).toBe(capital)
    }
  })

  it('los países con varias capitales tienen una principal', () => {
    expect(getCountry('za')?.capital).toBe('Pretoria')
    expect(getCountry('za')?.otherCapitals).toEqual(['Bloemfontein', 'Ciudad del Cabo'])
    expect(getCountry('bo')?.capital).toBe('Sucre')
    expect(getCountry('bo')?.otherCapitals).toContain('La Paz')
  })

  it('América se divide en Norte y Centroamérica, Caribe y Sudamérica', () => {
    const america = PLAYABLE.filter((c) => c.continent === 'america')
    expect(america).toHaveLength(35)
    expect(getCountry('mx')?.zone).toBe('norte-centroamerica')
    expect(getCountry('pa')?.zone).toBe('norte-centroamerica')
    expect(getCountry('cu')?.zone).toBe('caribe')
    expect(getCountry('ar')?.zone).toBe('sudamerica')
  })

  it('las fronteras apuntan a países existentes', () => {
    const broken = ALL_COUNTRIES.flatMap((c) =>
      c.borders.filter((b) => !getCountry(b)).map((b) => `${c.code}→${b}`),
    )
    expect(broken).toEqual([])
  })
})

describe('datos del modo Silueta', () => {
  const silhouettes = JSON.parse(readFileSync(root('src/data/siluetas.json'), 'utf8')) as Record<
    string,
    { d: string; km: number; px: number }
  >

  it('cada país jugable tiene un centroide válido', () => {
    const invalid = PLAYABLE.filter(
      ({ centroid: [lat, lon] }) => !(Math.abs(lat) <= 90 && Math.abs(lon) <= 180),
    ).map((c) => c.code)
    expect(invalid).toEqual([])
  })

  it('el centroide usa el territorio principal (sin territorios lejanos)', () => {
    const [frLat, frLon] = getCountry('fr')?.centroid ?? [0, 0]
    expect(frLat).toBeGreaterThan(42)
    expect(frLat).toBeLessThan(51)
    expect(frLon).toBeGreaterThan(-5)
    expect(frLon).toBeLessThan(8)
    // Ecuador sin Galápagos: el centroide queda en el continente.
    expect(getCountry('ec')?.centroid[1]).toBeGreaterThan(-81)
  })

  it('hay una silueta para cada país del grupo y solo para ellos', () => {
    const expected = PLAYABLE.filter((c) => c.silhouette)
      .map((c) => c.code)
      .sort()
    expect(Object.keys(silhouettes).sort()).toEqual(expected)
  })

  it('cada silueta tiene trazado y una barra de escala que cabe en la caja', () => {
    const bad = Object.entries(silhouettes).filter(
      ([, s]) => !s.d.startsWith('M') || s.km <= 0 || s.px <= 0 || s.px > 200,
    )
    expect(bad.map(([code]) => code)).toEqual([])
  })
})
