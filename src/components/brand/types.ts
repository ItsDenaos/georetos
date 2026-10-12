/** Tipos compartidos por los componentes de identidad. */

/** Tinta de un sello de pasaporte. */
export type StampTone = 'cobalt' | 'pink' | 'jade' | 'tomato'

/** Tinta de un sello de acierto, fallo o récord. */
export type InkTone = 'ok' | 'meh' | 'fail' | 'brand' | 'pink'

/** Estado de una parada en la ruta de progreso. */
export type StopMark = 'ok' | 'meh' | 'fail' | null | undefined
