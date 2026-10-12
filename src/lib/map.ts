/**
 * Colores con significado para resaltar países en WorldMap. Cada uno se apoya
 * además en una trama (rayas, puntos) para no depender solo del color.
 */
export type MapColor = 'ok' | 'meh' | 'fail' | 'wrong' | 'focus' | 'related'

export type MapHighlights = Readonly<Record<string, MapColor>>

/** Tramas SVG que acompañan a algunos colores (null = color liso). */
export const MAP_PATTERNS: Record<MapColor, 'stripes' | 'dots' | null> = {
  ok: null,
  meh: 'dots',
  fail: 'stripes',
  wrong: 'stripes',
  focus: null,
  related: 'dots',
}
