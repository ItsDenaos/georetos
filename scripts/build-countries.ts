/**
 * Genera src/data/countries.json y src/data/siluetas.json a partir de
 * world-countries y world-atlas. Uso: npm run build:countries
 *
 * Falla (código de salida 1) si a un país jugable le falta su capital o su
 * subregión en español, si un alias choca con otro país o si no hay exactamente
 * 195 países jugables.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import type { Geometry } from 'geojson'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'

import { compact } from '../src/lib/normalize.ts'
import type { ContinentId, Country, ZoneId } from '../src/lib/types.ts'
import { CAPITALES_ES } from './capitales-es.ts'
import {
  ALIAS_ES,
  CAPITALES_MULTIPLES,
  EXTRA_JUGABLES,
  FORMAS_SIN_ID,
  MARCADOR_AREA_MAX,
  MARCADOR_FORZADO,
  NOMBRES_ES,
  SILUETA_MIN_VERTICES,
  SUBREGIONES_ES,
} from './excepciones.ts'
import { silhouetteOf, type Silhouette } from './silhouette-path.ts'
import { centroidOf, mainTerritory, type PolygonCoords, type Territory } from './territory.ts'

interface RawCountry {
  cca2: string
  cca3: string
  ccn3: string
  unMember: boolean
  capital: string[]
  region: string
  subregion: string
  translations: { spa?: { common: string } }
  name: { common: string }
  latlng: [number, number]
  landlocked: boolean
  borders: string[]
  area: number
}

const TOTAL_JUGABLES = 195

const root = (path: string) => fileURLToPath(new URL(`../${path}`, import.meta.url))
const readJson = <T>(path: string): T => JSON.parse(readFileSync(root(path), 'utf8')) as T

const raw = readJson<RawCountry[]>('node_modules/world-countries/countries.json')
const topo = readJson<Topology<{ countries: GeometryCollection<{ name: string }> }>>(
  'node_modules/world-atlas/countries-50m.json',
)
const geometries = topo.objects.countries.geometries
/** Nombre de una forma del TopoJSON (todas lo traen). */
const nameOf = (g: { properties?: unknown }) =>
  (g.properties as { name?: string } | undefined)?.name ?? ''
const features = feature(topo, topo.objects.countries).features

const errors: string[] = []
const report: string[] = []

const topoIds = new Set(geometries.flatMap((g) => (g.id ? [String(g.id)] : [])))
const cca3ToCode = new Map(raw.map((c) => [c.cca3, c.cca2.toLowerCase()]))
const rawByCca2 = new Map(raw.map((c) => [c.cca2, c]))

function zoneOf(c: RawCountry): { continent: ContinentId; zone: ZoneId } | null {
  switch (c.region) {
    case 'Africa':
      return { continent: 'africa', zone: 'africa' }
    case 'Asia':
      return { continent: 'asia', zone: 'asia' }
    case 'Europe':
      return { continent: 'europa', zone: 'europa' }
    case 'Oceania':
      return { continent: 'oceania', zone: 'oceania' }
    case 'Antarctic':
      return { continent: 'antartida', zone: 'antartida' }
    case 'Americas':
      if (c.subregion === 'South America') return { continent: 'america', zone: 'sudamerica' }
      if (c.subregion === 'Caribbean') return { continent: 'america', zone: 'caribe' }
      return { continent: 'america', zone: 'norte-centroamerica' }
    default:
      return null
  }
}

// Formas sin id: se asignan por nombre según la tabla de excepciones.
const topoNamesByCode = new Map<string, string[]>()
for (const g of geometries) {
  if (g.id) continue
  const name = nameOf(g)
  if (!(name in FORMAS_SIN_ID)) {
    errors.push(`Forma sin id y sin excepción definida: "${name}"`)
    continue
  }
  const cca2 = FORMAS_SIN_ID[name]
  if (cca2 === null || cca2 === undefined) {
    report.push(`Forma sin país (se dibuja neutra): ${name}`)
    continue
  }
  if (!rawByCca2.has(cca2)) errors.push(`La excepción "${name}" apunta a ${cca2}, que no existe`)
  topoNamesByCode.set(cca2, [...(topoNamesByCode.get(cca2) ?? []), name])
}

function spanishCapital(c: RawCountry, playable: boolean): { capital: string; others: string[] } {
  const multiple = CAPITALES_MULTIPLES[c.cca2]
  if (multiple) return { capital: multiple.principal, others: multiple.otras }
  if (playable && c.capital.length > 1) {
    errors.push(
      `${c.cca2} tiene varias capitales (${c.capital.join(', ')}): defínelas en excepciones.ts`,
    )
  }
  const english = c.capital[0]
  const spanish = english ? CAPITALES_ES[english] : undefined
  if (playable && !spanish) {
    errors.push(`Falta la capital en español de ${c.cca2} (${c.name.common}): "${english ?? '—'}"`)
  }
  return { capital: spanish ?? '', others: [] }
}

/** Polígonos de un país: los de su id numérico y los de sus formas sin id. */
function polygonsOf(numeric: string, topoNames: string[]): PolygonCoords[] {
  const own = features.filter((f) =>
    f.id ? String(f.id) === numeric && numeric !== '' : topoNames.includes(f.properties.name),
  )
  return own.flatMap((f) => {
    const g = f.geometry as Geometry | null
    if (g?.type === 'Polygon') return [g.coordinates]
    if (g?.type === 'MultiPolygon') return g.coordinates
    return []
  })
}

const countries: Country[] = []
const playableWithoutShape: string[] = []
const territories = new Map<string, Territory>()

for (const c of raw) {
  const playable = c.unMember || EXTRA_JUGABLES.includes(c.cca2)
  const topoNames = topoNamesByCode.get(c.cca2) ?? []
  const hasShape = (c.ccn3 !== '' && topoIds.has(c.ccn3)) || topoNames.length > 0
  // Los territorios que no se dibujan ni se preguntan no hacen falta.
  if (!playable && !hasShape) continue

  const zone = zoneOf(c)
  if (!zone) {
    errors.push(`Región desconocida para ${c.cca2}: "${c.region}"`)
    continue
  }
  const name = NOMBRES_ES[c.cca2] ?? c.translations.spa?.common
  if (!name) errors.push(`Falta el nombre en español de ${c.cca2}`)
  const subregion = SUBREGIONES_ES[c.subregion]
  if (playable && !subregion)
    errors.push(`Falta la subregión en español de ${c.cca2}: "${c.subregion}"`)
  if (playable && !hasShape) playableWithoutShape.push(`${c.cca2} (${name})`)

  const { capital, others } = spanishCapital(c, playable)
  const code = c.cca2.toLowerCase()
  const polygons = hasShape ? polygonsOf(c.ccn3, topoNames) : []
  const territory = polygons.length > 0 ? mainTerritory(polygons) : null
  if (territory) territories.set(code, territory)
  const spanishName = name ?? c.name.common
  // Solo alias curados: los nombres oficiales del paquete traen errores ("República francés").
  const aliases = playable
    ? (ALIAS_ES[c.cca2] ?? []).filter((a) => compact(a) !== compact(spanishName))
    : []
  countries.push({
    code,
    numeric: c.ccn3,
    name: name ?? c.name.common,
    capital,
    otherCapitals: others,
    continent: zone.continent,
    zone: zone.zone,
    subregion: subregion ?? c.subregion,
    area: c.area,
    borders: c.borders.flatMap((b) => {
      const border = cca3ToCode.get(b)
      return border ? [border] : []
    }),
    landlocked: c.landlocked,
    latlng: c.latlng,
    playable,
    marker:
      playable && (!hasShape || c.area < MARCADOR_AREA_MAX || MARCADOR_FORZADO.includes(c.cca2)),
    topoNames,
    centroid: territory ? centroidOf(territory.geometry) : c.latlng,
    aliases,
    silhouette: playable && territory !== null && territory.vertices >= SILUETA_MIN_VERTICES,
  })
}

// Fronteras solo con entradas incluidas (por ejemplo, la Guayana Francesa no tiene forma propia).
const included = new Set(countries.map((c) => c.code))
for (const c of countries) c.borders = c.borders.filter((b) => included.has(b))

// Formas con id que no corresponden a ningún país de los datos.
const numericIds = new Set(countries.map((c) => c.numeric))
for (const g of geometries) {
  if (g.id && !numericIds.has(String(g.id))) report.push(`Forma sin datos: ${g.id} (${nameOf(g)})`)
}

const playables = countries.filter((c) => c.playable)
if (playables.length !== TOTAL_JUGABLES) {
  errors.push(`Se esperaban ${TOTAL_JUGABLES} países jugables y hay ${playables.length}`)
}
// Cada nombre o alias escrito debe llevar a un solo país.
const writtenNames = new Map<string, string>()
for (const c of playables) {
  for (const text of [c.name, ...c.aliases]) {
    const key = compact(text)
    const owner = writtenNames.get(key)
    if (owner && owner !== c.code) errors.push(`"${text}" lleva a ${owner} y a ${c.code}`)
    writtenNames.set(key, c.code)
  }
}
for (const alias of Object.keys(ALIAS_ES)) {
  if (!playables.some((c) => c.code === alias.toLowerCase()))
    errors.push(`Alias para ${alias}, que no es jugable`)
}

for (const field of ['name', 'capital'] as const) {
  const seen = new Map<string, string>()
  for (const c of playables) {
    const previous = seen.get(c[field])
    if (previous) errors.push(`"${c[field]}" se repite como ${field} en ${previous} y ${c.code}`)
    seen.set(c[field], c.code)
  }
}

countries.sort((a, b) => a.name.localeCompare(b.name, 'es'))

console.log(
  `Países jugables: ${playables.length}; territorios solo de mapa: ${countries.length - playables.length}`,
)
console.log(
  `Jugables sin forma en el mapa (se dibujan como círculo): ${playableWithoutShape.join(', ') || 'ninguno'}`,
)
console.log(`Jugables con círculo: ${playables.filter((c) => c.marker).length}`)
const trimmed = playables.flatMap((c) => {
  const t = territories.get(c.code)
  return t && t.dropped > 0 ? [`${c.code} (−${t.dropped})`] : []
})
console.log(`Siluetas sin territorios lejanos: ${trimmed.join(', ')}`)
const withoutSilhouette = playables.filter((c) => !c.silhouette).map((c) => c.code)
console.log(
  `Jugables con silueta: ${playables.length - withoutSilhouette.length}; sin silueta (diminutos o sin forma): ${withoutSilhouette.join(' ')}`,
)
for (const line of report) console.log(line)

if (errors.length > 0) {
  console.error(`\n✗ ${errors.length} error(es):`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}

// Un país por línea: el archivo se versiona y así los cambios se leen fácil.
const json = `[\n${countries.map((c) => JSON.stringify(c)).join(',\n')}\n]\n`
writeFileSync(root('src/data/countries.json'), json)
console.log(`\n✓ src/data/countries.json generado (${countries.length} entradas)`)

const silhouettes: [string, Silhouette][] = playables
  .filter((c) => c.silhouette)
  .map((c) => [c.code, silhouetteOf((territories.get(c.code) as Territory).geometry, c.centroid)])
silhouettes.sort(([a], [b]) => a.localeCompare(b))
const silhouetteJson = `{\n${silhouettes.map(([code, s]) => `${JSON.stringify(code)}:${JSON.stringify(s)}`).join(',\n')}\n}\n`
writeFileSync(root('src/data/siluetas.json'), silhouetteJson)
console.log(
  `✓ src/data/siluetas.json generado (${silhouettes.length} siluetas, ${Math.round(silhouetteJson.length / 1024)} KB)`,
)
