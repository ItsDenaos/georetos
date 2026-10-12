import type { RegionId } from './types'

/** [[oeste, sur], [este, norte]] en grados. El este puede pasar de 180 (cruza el antimeridiano). */
export type GeoBox = [[number, number], [number, number]]

export interface RegionView {
  /** Caja fija a la que hace zoom el mapa; null = el mundo entero. */
  box: GeoBox | null
  /** Longitud que queda en el centro del mapa. */
  centerLon: number
}

export const REGIONS: readonly RegionId[] = [
  'mundo',
  'africa',
  'norte-centroamerica',
  'caribe',
  'sudamerica',
  'asia',
  'europa',
  'oceania',
]

/**
 * Cajas de coordenadas fijas. No se calculan con las formas porque Rusia,
 * Francia (Guayana Francesa) o Fiyi (cruza el meridiano 180) las deforman.
 */
export const REGION_VIEWS: Record<RegionId, RegionView> = {
  mundo: { box: null, centerLon: 10 },
  africa: {
    box: [
      [-19, -36],
      [53, 38],
    ],
    centerLon: 10,
  },
  'norte-centroamerica': {
    box: [
      [-168, 6],
      [-52, 72],
    ],
    centerLon: 10,
  },
  caribe: {
    box: [
      [-86, 9.5],
      [-59, 27],
    ],
    centerLon: 10,
  },
  sudamerica: {
    box: [
      [-82, -56],
      [-34, 13],
    ],
    centerLon: 10,
  },
  asia: {
    box: [
      [25, -11],
      [148, 56],
    ],
    centerLon: 10,
  },
  europa: {
    box: [
      [-25, 34],
      [48, 71],
    ],
    centerLon: 10,
  },
  // El Pacífico queda partido en la vista normal: se rota la proyección.
  oceania: {
    box: [
      [110, -48],
      [210, 16],
    ],
    centerLon: 165,
  },
}

export function isRegionId(value: unknown): value is RegionId {
  return typeof value === 'string' && (REGIONS as readonly string[]).includes(value)
}

/** Caja alrededor de un punto, de tamaño acorde a la superficie del país. */
export function boxAround([lat, lon]: [number, number], areaKm2: number): GeoBox {
  // Lado aproximado del país en grados, con margen para ver a los vecinos;
  // acotado para micro y macroestados.
  const span = Math.min(70, Math.max(18, (Math.sqrt(areaKm2) / 111) * 4))
  const latSpan = span * 0.6
  return [
    [lon - span / 2, Math.max(-85, lat - latSpan / 2)],
    [lon + span / 2, Math.min(85, lat + latSpan / 2)],
  ]
}
