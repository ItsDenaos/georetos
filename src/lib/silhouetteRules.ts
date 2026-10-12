/** Reglas fijas del modo Silueta, sin dependencias (las usa también la portada). */
export const SILHOUETTE_ATTEMPTS = 6
export const SILHOUETTE_COUNTS = [5, 10] as const
export type SilhouetteCount = (typeof SILHOUETTE_COUNTS)[number]
