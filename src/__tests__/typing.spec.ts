/** Escribe los países: cómo se reconoce lo escrito y la partida. */
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { playableIn } from '@/lib/countries'
import { recordKey } from '@/lib/results'
import { createTypingIndex, readTyped, type Carry } from '@/lib/typing'
import { useTypingStore } from '@/stores/typing'

const world = createTypingIndex('mundo')

function read(text: string, found: Iterable<string> = [], carry?: Carry, index = world) {
  return readTyped(index, text, new Set(found), carry)
}

/** Código del país aceptado al instante, o null. */
function matched(text: string, found: Iterable<string> = []) {
  const result = read(text, found)
  return result.kind === 'match' ? result.code : null
}

describe('normalización de las respuestas', () => {
  it('ignora tildes, mayúsculas, espacios y signos', () => {
    const peru = ['Perú', 'peru', 'PERU', '  perú ', 'P e r ú']
    expect(peru.map((text) => matched(text))).toEqual(peru.map(() => 'pe'))
    const costaRica = ['Costa Rica', 'costa  rica', 'COSTA-RICA', 'costarica']
    expect(costaRica.map((text) => matched(text))).toEqual(costaRica.map(() => 'cr'))
    expect(matched("Côte d'Ivoire")).toBe('ci')
    expect(matched('cote divoire')).toBe('ci')
    expect(matched('Japón.')).toBe('jp')
  })

  it('acepta los nombres alternativos', () => {
    expect(matched('EE. UU.')).toBe('us')
    expect(matched('EEUU')).toBe('us')
    expect(matched('ee.uu')).toBe('us')
    expect(matched('USA')).toBe('us')
    expect(matched('Holanda')).toBe('nl')
    expect(matched('Birmania')).toBe('mm')
    expect(matched('Suazilandia')).toBe('sz')
    expect(matched('República Checa')).toBe('cz')
    expect(matched('Méjico')).toBe('mx')
  })

  it('un nombre a medias no cuenta', () => {
    expect(read('Argent')).toEqual({ kind: 'none' })
    expect(read('')).toEqual({ kind: 'none' })
    expect(read('   ')).toEqual({ kind: 'none' })
  })

  it('los territorios que no son países jugables no cuentan', () => {
    expect(read('Groenlandia')).toEqual({ kind: 'none' })
    expect(read('Puerto Rico')).toEqual({ kind: 'none' })
    // Samoa sí, aunque exista Samoa Americana.
    expect(matched('Samoa')).toBe('ws')
  })
})

describe('nombres que son el comienzo de otro', () => {
  it('espera antes de aceptar si otro país pendiente empieza igual', () => {
    expect(read('Guinea')).toMatchObject({ kind: 'wait', code: 'gn' })
    expect(read('Níger')).toMatchObject({ kind: 'wait', code: 'ne' })
    expect(read('Sudán')).toMatchObject({ kind: 'wait', code: 'sd' })
    expect(read('Dominica')).toMatchObject({ kind: 'wait', code: 'dm' })
  })

  it('también si el mismo país tiene un nombre más largo', () => {
    expect(read('Trinidad')).toMatchObject({ kind: 'wait', code: 'tt' })
    expect(read('Bosnia')).toMatchObject({ kind: 'wait', code: 'ba' })
    expect(read('Estados Unidos')).toMatchObject({ kind: 'wait', code: 'us' })
    expect(matched('Trinidad y Tobago')).toBe('tt')
    expect(matched('Estados Unidos de América')).toBe('us')
  })

  it('el nombre largo se acepta al instante', () => {
    expect(matched('Guinea Ecuatorial')).toBe('gq')
    expect(matched('Guinea-Bisáu')).toBe('gw')
    expect(matched('Nigeria')).toBe('ng')
    expect(matched('Sudán del Sur')).toBe('ss')
    expect(matched('República Dominicana')).toBe('do')
  })

  it('si los otros ya están, no hay que esperar', () => {
    expect(matched('Guinea', ['gq', 'gw'])).toBe('gn')
    expect(matched('Níger', ['ng'])).toBe('ne')
    // Desde otra región no hay nada que esperar: se avisa de que no es de ahí.
    expect(read('Níger', [], undefined, createTypingIndex('europa'))).toMatchObject({
      kind: 'outside',
      code: 'ne',
    })
  })
})

describe('países ya encontrados o de otra región', () => {
  it('avisa si ya está', () => {
    expect(read('Perú', ['pe'])).toEqual({ kind: 'repeat', code: 'pe' })
    // Sudán ya está, pero puede ser el comienzo de Sudán del Sur: no se avisa todavía.
    expect(read('Sudán', ['sd'])).toEqual({ kind: 'none' })
  })

  it('un país de otra región no cuenta, pero se avisa', () => {
    const europe = createTypingIndex('europa')
    expect(read('Chile', [], undefined, europe)).toEqual({ kind: 'outside', code: 'cl' })
    expect(read('Francia', [], undefined, europe)).toMatchObject({ kind: 'match', code: 'fr' })
  })
})

describe('lo que se escribe justo después de un acierto', () => {
  it('se une al acierto si completa otro país', () => {
    const carry = { code: 'sd', text: 'Sudán' }
    expect(read(' del Sur', ['sd'], carry)).toEqual({
      kind: 'match',
      code: 'ss',
      text: 'Sudán del Sur',
    })
    expect(read('ia', ['ne'], { code: 'ne', text: 'Níger' })).toMatchObject({ code: 'ng' })
  })

  it('el resto del nombre largo del mismo país se absorbe', () => {
    const carry = { code: 'tt', text: 'Trinidad' }
    expect(read(' ', ['tt'], carry)).toEqual({ kind: 'continuing' })
    expect(read(' y Tob', ['tt'], carry)).toEqual({ kind: 'continuing' })
    expect(read(' y Tobago', ['tt'], carry)).toEqual({
      kind: 'absorb',
      text: 'Trinidad y Tobago',
    })
  })

  it('si lo nuevo es otro país, se acepta solo', () => {
    const carry = { code: 'gn', text: 'Guinea' }
    // "Guinea" + "Ecua…" puede ser Guinea Ecuatorial…
    expect(read('Ecua', ['gn'], carry)).toEqual({ kind: 'continuing' })
    // …pero "Ecuador" es Ecuador.
    expect(read('Ecuador', ['gn'], carry)).toMatchObject({ kind: 'match', code: 'ec' })
    expect(read('Chile', ['pe'], { code: 'pe', text: 'Perú' })).toMatchObject({ code: 'cl' })
    expect(read('xyz', ['pe'], { code: 'pe', text: 'Perú' })).toEqual({ kind: 'none' })
  })
})

describe('partida', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('cuenta los países de la región y no acepta repetidos ni de fuera', () => {
    const store = useTypingStore()
    store.start({ region: 'europa', minutes: 5 }, 0)
    expect(store.total).toBe(playableIn('europa').length)
    expect(store.accept('fr', 1_000)).toBe(true)
    expect(store.accept('fr', 2_000)).toBe(false)
    expect(store.accept('cl', 3_000)).toBe(false)
    expect(store.found).toEqual(['fr'])
    expect(store.missing).not.toContain('fr')
    expect(store.read('Francia')).toEqual({ kind: 'repeat', code: 'fr' })
  })

  it('termina al acabarse el tiempo', () => {
    const store = useTypingStore()
    store.start({ region: 'europa', minutes: 5 }, 0)
    store.accept('es', 10_000)
    store.tick(4 * 60_000)
    expect(store.timeLeft).toBe(60_000)
    expect(store.finished).toBe(false)
    store.tick(5 * 60_000 + 200)
    expect(store.finished).toBe(true)
    expect(store.endReason).toBe('time')
    expect(store.accept('fr')).toBe(false)
    const result = store.buildResult()
    expect(result).toMatchObject({
      mode: 'typing',
      region: 'europa',
      count: 5,
      score: 1,
      maxScore: store.total,
      timeMs: 5 * 60_000,
    })
    expect(recordKey(result!)).toBe('typing|europa|5')
    // Primero los encontrados y después los que faltaron.
    expect(result?.answers?.[0]).toEqual({ code: 'es', mark: 'ok' })
    expect(result?.answers?.filter((a) => a.mark === 'fail')).toHaveLength(store.total - 1)
    expect(result?.misses).toHaveLength(store.total - 1)
  })

  it('termina al encontrarlos todos, con el tiempo usado', () => {
    const store = useTypingStore()
    store.start({ region: 'oceania', minutes: 10 }, 0)
    const codes = playableIn('oceania').map((c) => c.code)
    codes.forEach((code, i) => store.accept(code, (i + 1) * 1_000))
    expect(store.finished).toBe(true)
    expect(store.endReason).toBe('complete')
    expect(store.buildResult()).toMatchObject({
      score: codes.length,
      maxScore: codes.length,
      timeMs: codes.length * 1_000,
      misses: [],
    })
  })

  it('rendirse termina la partida y muestra los que faltan', () => {
    const store = useTypingStore()
    store.start({ region: 'sudamerica', minutes: 5 }, 0)
    store.accept('pe', 5_000)
    store.giveUp(90_000)
    expect(store.endReason).toBe('gaveUp')
    expect(store.buildResult()?.timeMs).toBe(90_000)
    expect(store.missing).toHaveLength(store.total - 1)
  })
})
