/**
 * Carga diferida de las siluetas precalculadas (src/data/siluetas.json, generado
 * por scripts/build-countries.ts): solo se descargan en el modo Silueta.
 */
export interface SilhouetteShape {
  /** Trazado SVG (relleno evenodd) dentro de una caja de SILHOUETTE_BOX unidades. */
  d: string
  /** Kilómetros de la barra de escala y su largo en unidades de la caja. */
  km: number
  px: number
}

export const SILHOUETTE_BOX = 200

let cache: Promise<Record<string, SilhouetteShape>> | null = null

export function loadSilhouettes(): Promise<Record<string, SilhouetteShape>> {
  cache ??= import('@/data/siluetas.json')
    .then((m) => m.default as Record<string, SilhouetteShape>)
    .catch((error: unknown) => {
      cache = null
      throw error
    })
  return cache
}
