/**
 * Contraste de los colores del tema (WCAG AA, 4,5:1 para texto). Lee los valores
 * directamente de src/assets/main.css, en el tema claro y en el oscuro.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(process.cwd(), 'src/assets/main.css'), 'utf8')

/** Contenido entre la llave que sigue a `start` y su llave de cierre. */
function block(start: string): string {
  const from = css.indexOf(start)
  if (from === -1) throw new Error(`No encontré el bloque ${start}`)
  const open = css.indexOf('{', from)
  let depth = 0
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++
    if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i)
  }
  throw new Error(`Bloque sin cerrar: ${start}`)
}

function colors(text: string): Record<string, string> {
  return Object.fromEntries(
    [...text.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [
      m[1] as string,
      (m[2] as string).toLowerCase(),
    ]),
  )
}

const light = colors(block('@theme {'))
const dark = { ...light, ...colors(block(":root[data-theme='dark'] {")) }
const island = colors(block(":root[data-theme='dark'] .theme-light {"))

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

/** [texto, fondo] tal como aparecen en la interfaz. */
const TEXT_PAIRS: [string, string][] = [
  ['ink', 'paper'],
  ['ink', 'paper-light'],
  ['ink', 'paper-deep'],
  ['ink-soft', 'paper'],
  ['ink-soft', 'paper-light'],
  ['cobalt-ink', 'paper'],
  ['cobalt-ink', 'paper-light'],
  ['pink-ink', 'paper'],
  ['pink-ink', 'paper-light'],
  ['pink-ink', 'pink-light'],
  ['jade-ink', 'paper-light'],
  ['jade-ink', 'jade-light'],
  ['tomato-ink', 'paper-light'],
  ['tomato-ink', 'tomato-light'],
  ['sun-ink', 'paper-light'],
  ['sun-ink', 'sun-light'],
  ['cobalt-ink', 'cobalt-light'],
  ['ink', 'cobalt-light'],
  ['ink', 'pink-light'],
  ['ink', 'jade-light'],
  ['ink', 'tomato-light'],
  ['cream', 'cobalt'],
  ['cream', 'cobalt-deep'],
  ['carbon', 'sun'],
  ['carbon', 'pink'],
  ['carbon', 'jade'],
  ['carbon', 'tomato'],
  ['carbon', 'sea'],
]

function failures(theme: Record<string, string>): string[] {
  return TEXT_PAIRS.flatMap(([fg, bg]) => {
    const a = theme[fg]
    const b = theme[bg]
    if (!a || !b) return [`falta el color ${a ? bg : fg}`]
    const ratio = contrast(a, b)
    return ratio >= 4.5 ? [] : [`${fg} sobre ${bg}: ${ratio.toFixed(2)}:1`]
  })
}

describe('contraste de colores', () => {
  it('el cálculo coincide con valores conocidos', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2)
  })

  it('tema claro: todos los textos llegan a 4,5:1', () => {
    expect(failures(light)).toEqual([])
  })

  it('tema oscuro: todos los textos llegan a 4,5:1', () => {
    expect(failures(dark)).toEqual([])
  })

  it('las islas impresas repiten exactamente los colores claros', () => {
    const different = Object.entries(island).filter(([name, hex]) => light[name] !== hex)
    expect(different).toEqual([])
    // Y cubren todos los colores que cambian en el tema oscuro.
    const flipped = Object.keys(colors(block(":root[data-theme='dark'] {")))
    expect(flipped.filter((name) => !(name in island))).toEqual([])
  })
})
