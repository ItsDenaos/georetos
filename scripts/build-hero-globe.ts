/**
 * Precalcula los trazados del globo de la portada (proyección ortográfica de las
 * tierras de Natural Earth 1:110m) para que la portada no tenga que cargar d3
 * ni el TopoJSON. Uso: npm run build:globe
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { geoGraticule, geoOrthographic, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'

const root = (path: string) => fileURLToPath(new URL(`../${path}`, import.meta.url))

const topo = JSON.parse(
  readFileSync(root('node_modules/world-atlas/land-110m.json'), 'utf8'),
) as Topology<{
  land: GeometryCollection
}>
const land = feature(topo, topo.objects.land)

// Centrado en el Atlántico: se ven América, Europa y África. Mismo centro y radio que HeroGlobe.vue.
const CENTER: [number, number] = [180, 165]
const RADIUS = 110
const ROTATION: [number, number] = [38, -12]

const projection = geoOrthographic().scale(RADIUS).translate(CENTER).rotate(ROTATION).clipAngle(90)
// Coordenadas enteras: a este tamaño no se nota y el trazado pesa mucho menos.
const path = geoPath(projection).digits(0)

const out = {
  land: path(land) ?? '',
  graticule: path(geoGraticule().step([30, 30])()) ?? '',
  // Puntos para los alfileres de la ilustración: Bogotá, El Cairo y Lisboa.
  pins: (
    [
      [-74.1, 4.6],
      [31.2, 30],
      [-9.1, 38.7],
    ] as [number, number][]
  ).map((p) => (projection(p) ?? [0, 0]).map((v) => Math.round(v * 10) / 10)),
}

const file = `// Generado por scripts/build-hero-globe.ts: no editar a mano.
export const HERO_GLOBE = ${JSON.stringify(out, null, 2)} as const
`
writeFileSync(root('src/components/brand/heroGlobePaths.ts'), file)
console.log(
  `✓ heroGlobePaths.ts: tierra ${out.land.length} caracteres, retícula ${out.graticule.length}`,
)
console.log('Alfileres:', JSON.stringify(out.pins))
