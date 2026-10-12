/**
 * Dibuja la silueta de un país como un trazado SVG en una caja de SILHOUETTE_BOX
 * unidades: proyección Equal Earth centrada en su longitud (se ve como en el mapa
 * del juego), simplificada con Douglas-Peucker para que el archivo pese poco.
 */
import { geoDistance, geoEqualEarth, geoPath } from 'd3-geo'
import type { MultiPolygon } from 'geojson'

export const SILHOUETTE_BOX = 200
const PADDING = 8
/** Tolerancia de simplificación, en unidades de la caja. */
const TOLERANCE = 0.6
/** Anillos más pequeños que esto (unidades²) no se ven: se descartan. */
const MIN_RING_AREA = 1.5
const EARTH_RADIUS_KM = 6371
const NICE_KM = [1, 2, 5, 10, 20, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000]

export interface Silhouette {
  /** Trazado SVG (relleno evenodd) dentro de 0..SILHOUETTE_BOX. */
  d: string
  /** Kilómetros que representa la barra de escala… */
  km: number
  /** …y su largo en unidades de la caja. */
  px: number
}

type Point = [number, number]

/** Contexto de geoPath que guarda los anillos ya proyectados. */
class RingRecorder {
  rings: Point[][] = []
  private current: Point[] | null = null
  moveTo(x: number, y: number) {
    this.current = [[x, y]]
    this.rings.push(this.current)
  }
  lineTo(x: number, y: number) {
    this.current?.push([x, y])
  }
  closePath() {
    this.current = null
  }
  beginPath() {}
  arc() {}
}

function distanceToSegment([px, py]: Point, [ax, ay]: Point, [bx, by]: Point): number {
  const dx = bx - ax
  const dy = by - ay
  const lengthSq = dx * dx + dy * dy
  const t =
    lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

/** Douglas-Peucker iterativo. */
function simplify(points: Point[], tolerance: number): Point[] {
  if (points.length <= 3) return points
  const keep = new Uint8Array(points.length)
  keep[0] = 1
  keep[points.length - 1] = 1
  const stack: [number, number][] = [[0, points.length - 1]]
  while (stack.length > 0) {
    const [first, last] = stack.pop() as [number, number]
    let maxDistance = 0
    let index = -1
    for (let i = first + 1; i < last; i++) {
      const d = distanceToSegment(points[i] as Point, points[first] as Point, points[last] as Point)
      if (d > maxDistance) {
        maxDistance = d
        index = i
      }
    }
    if (index !== -1 && maxDistance > tolerance) {
      keep[index] = 1
      stack.push([first, index], [index, last])
    }
  }
  return points.filter((_, i) => keep[i])
}

function ringArea(ring: Point[]): number {
  let sum = 0
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i] as Point
    const [x2, y2] = ring[(i + 1) % ring.length] as Point
    sum += x1 * y2 - x2 * y1
  }
  return Math.abs(sum) / 2
}

/** Coordenadas en pasos de media unidad: exactas al restar, así los desplazamientos no se acumulan. */
const snap = (v: number) => Math.round(v * 2) / 2

export function silhouetteOf(geometry: MultiPolygon, [lat, lon]: [number, number]): Silhouette {
  const projection = geoEqualEarth()
    .rotate([-lon, 0])
    .fitExtent(
      [
        [PADDING, PADDING],
        [SILHOUETTE_BOX - PADDING, SILHOUETTE_BOX - PADDING],
      ],
      geometry,
    )
  const recorder = new RingRecorder()
  geoPath(projection, recorder)(geometry)

  const d = recorder.rings
    .filter((ring) => ringArea(ring) >= MIN_RING_AREA)
    .map((ring) => {
      const points = simplify(ring, TOLERANCE).map(([x, y]): Point => [snap(x), snap(y)])
      const unique = points.filter((p, i) => {
        const prev = points[i - 1]
        return !prev || p[0] !== prev[0] || p[1] !== prev[1]
      })
      if (unique.length < 3) return ''
      // Trazado relativo (l dx,dy): ocupa bastante menos que coordenadas absolutas.
      const [first, ...rest] = unique as [Point, ...Point[]]
      const deltas = rest.map(([x, y], i) => {
        const [px, py] = unique[i] as Point
        return `${x - px},${y - py}`
      })
      return `M${first[0]},${first[1]}l${deltas.join(' ')}z`
    })
    .join('')

  // Barra de escala: el valor "redondo" que mida entre un 18 % y un 40 % de la caja.
  const west: Point = [lon - 0.5, lat]
  const east: Point = [lon + 0.5, lat]
  const [ax, ay] = projection(west) ?? [0, 0]
  const [bx, by] = projection(east) ?? [0, 0]
  const unitsPerKm = Math.hypot(bx - ax, by - ay) / (geoDistance(west, east) * EARTH_RADIUS_KM)
  const fits = NICE_KM.filter((km) => km * unitsPerKm <= SILHOUETTE_BOX * 0.4)
  const km = fits[fits.length - 1] ?? NICE_KM[0] ?? 1
  return { d, km, px: Math.round(km * unitsPerKm * 10) / 10 }
}
