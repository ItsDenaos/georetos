/** Cálculos sobre la esfera: distancia, rumbo y dirección en texto. */

export const EARTH_RADIUS_KM = 6371

const rad = (deg: number) => (deg * Math.PI) / 180
const deg = (radians: number) => (radians * 180) / Math.PI

/** Distancia del círculo máximo (haversine) entre dos puntos [lat, lon], en km. */
export function distanceKm([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]): number {
  const dLat = rad(lat2 - lat1)
  const dLon = rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)))
}

/** Rumbo inicial de la ruta más corta de `from` a `to`: 0 = norte, 90 = este. */
export function bearingDeg([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]): number {
  const dLon = rad(lon2 - lon1)
  const y = Math.sin(dLon) * Math.cos(rad(lat2))
  const x =
    Math.cos(rad(lat1)) * Math.sin(rad(lat2)) -
    Math.sin(rad(lat1)) * Math.cos(rad(lat2)) * Math.cos(dLon)
  return (deg(Math.atan2(y, x)) + 360) % 360
}

export const COMPASS_POINTS = ['n', 'ne', 'e', 'se', 's', 'so', 'o', 'no'] as const
export type CompassPoint = (typeof COMPASS_POINTS)[number]

/** Rumbo redondeado a uno de los 8 puntos cardinales. */
export function compassPoint(bearing: number): CompassPoint {
  const index = Math.round((((bearing % 360) + 360) % 360) / 45) % 8
  return COMPASS_POINTS[index] as CompassPoint
}

/** Qué tan cerca está un intento: sirve para colorear la distancia (con el número siempre visible). */
export type Closeness = 'hot' | 'warm' | 'cool' | 'cold'

export function closeness(km: number): Closeness {
  if (km < 500) return 'hot'
  if (km < 1500) return 'warm'
  if (km < 4000) return 'cool'
  return 'cold'
}
