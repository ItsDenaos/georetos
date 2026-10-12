import rawCountries from '@/data/countries.json'
import type { ContinentId, Country, RegionId } from './types'

// El JSON lo genera scripts/build-countries.ts con el tipo Country; las pruebas
// de integridad (src/__tests__/data.spec.ts) comprueban que se cumpla.
export const ALL_COUNTRIES = rawCountries as unknown as readonly Country[]

export const PLAYABLE: readonly Country[] = ALL_COUNTRIES.filter((c) => c.playable)

const byCode = new Map(ALL_COUNTRIES.map((c) => [c.code, c]))
const byNumeric = new Map(ALL_COUNTRIES.filter((c) => c.numeric).map((c) => [c.numeric, c]))
const byTopoName = new Map(ALL_COUNTRIES.flatMap((c) => c.topoNames.map((n) => [n, c] as const)))

export function getCountry(code: string): Country | undefined {
  return byCode.get(code)
}

/** Busca el país de una forma del TopoJSON: por id numérico o, si no tiene, por nombre. */
export function countryForFeature(id: string | number | undefined, name: string | undefined) {
  if (id !== undefined && id !== '') return byNumeric.get(String(id))
  return name ? byTopoName.get(name) : undefined
}

export function inRegion(country: Country, region: RegionId): boolean {
  if (region === 'mundo') return country.zone !== 'antartida'
  return country.zone === region
}

/** Países jugables de una región, en orden alfabético. */
export function playableIn(region: RegionId): Country[] {
  return PLAYABLE.filter((c) => inRegion(c, region))
}

/** Los cinco continentes que se enseñan (sin la Antártida). */
export const CONTINENTS: readonly Exclude<ContinentId, 'antartida'>[] = [
  'africa',
  'america',
  'asia',
  'europa',
  'oceania',
]

/** Todas las capitales de un país: la principal y las demás. */
export function capitalsOf(country: Country): string[] {
  return [country.capital, ...country.otherCapitals]
}
