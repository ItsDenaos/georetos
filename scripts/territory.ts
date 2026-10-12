/**
 * Territorio principal de un país: se agrupan los polígonos que están a menos
 * de LINK_KM entre sí y se queda el grupo con más superficie. Así Francia queda
 * sin la Guayana ni Reunión y Ecuador sin Galápagos, pero Indonesia o Japón
 * conservan todas sus islas. Se usa para la silueta y para el centroide.
 */
import { geoArea, geoBounds, geoCentroid } from 'd3-geo'
import type { MultiPolygon, Position } from 'geojson'

export const LINK_KM = 600
const EARTH_RADIUS_KM = 6371
const DEGREES_PER_KM = 180 / Math.PI / EARTH_RADIUS_KM

export type PolygonCoords = Position[][]

interface Box {
  west: number
  south: number
  east: number
  north: number
}

function boxOf(polygon: PolygonCoords): Box {
  const [[west, south], [east, north]] = geoBounds({ type: 'Polygon', coordinates: polygon })
  // Si cruza el antimeridiano, geoBounds devuelve west > east.
  return { west, south, east: east < west ? east + 360 : east, north }
}

/** ¿Están dos cajas a menos de LINK_KM? (aproximación con cajas ampliadas) */
function near(a: Box, b: Box): boolean {
  const padLat = LINK_KM * DEGREES_PER_KM
  const maxLat = Math.min(
    80,
    Math.max(Math.abs(a.south), Math.abs(a.north), Math.abs(b.south), Math.abs(b.north)),
  )
  const padLon = Math.min(180, padLat / Math.cos((maxLat * Math.PI) / 180))
  const latOk = a.south - padLat <= b.north && b.south - padLat <= a.north
  const lonOk = [-360, 0, 360].some(
    (shift) => a.west - padLon <= b.east + shift && b.west + shift - padLon <= a.east,
  )
  return latOk && lonOk
}

export interface Territory {
  geometry: MultiPolygon
  /** Polígonos descartados por lejanos. */
  dropped: number
  /** Vértices del territorio principal (mide el detalle de la silueta). */
  vertices: number
}

export function mainTerritory(polygons: PolygonCoords[]): Territory {
  const parts = polygons.map((coordinates) => ({
    coordinates,
    area: geoArea({ type: 'Polygon', coordinates }),
    box: boxOf(coordinates),
  }))
  // Unión-búsqueda: dos polígonos cercanos quedan en el mismo grupo.
  const parent = parts.map((_, i) => i)
  const find = (i: number): number => {
    while (parent[i] !== i) i = parent[i] = parent[parent[i] as number] as number
    return i
  }
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      if (
        near((parts[i] as (typeof parts)[number]).box, (parts[j] as (typeof parts)[number]).box)
      ) {
        parent[find(i)] = find(j)
      }
    }
  }
  const groups = new Map<number, typeof parts>()
  parts.forEach((part, i) => {
    const root = find(i)
    groups.set(root, [...(groups.get(root) ?? []), part])
  })
  const area = (group: typeof parts) => group.reduce((sum, p) => sum + p.area, 0)
  const best = [...groups.values()].sort((a, b) => area(b) - area(a))[0] ?? []
  return {
    geometry: { type: 'MultiPolygon', coordinates: best.map((p) => p.coordinates) },
    dropped: parts.length - best.length,
    vertices: best.reduce(
      (sum, p) => sum + p.coordinates.reduce((s, ring) => s + ring.length, 0),
      0,
    ),
  }
}

/** Centroide esférico como [latitud, longitud], con un decimal de precisión de sobra. */
export function centroidOf(geometry: MultiPolygon): [number, number] {
  const [lon, lat] = geoCentroid(geometry)
  return [Math.round(lat * 100) / 100, Math.round(lon * 100) / 100]
}
