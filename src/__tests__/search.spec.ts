import { describe, expect, it } from 'vitest'

import { PLAYABLE } from '@/lib/countries'
import { resolveCountry, searchCountries } from '@/lib/search'

const names = (query: string, exclude?: Set<string>) =>
  searchCountries(query, exclude).map((s) => s.name)

describe('búsqueda de países', () => {
  it('ignora tildes y mayúsculas', () => {
    for (const query of ['peru', 'PERU', 'Perú', 'pErÚ']) expect(names(query)[0]).toBe('Perú')
  })

  it('ordena primero los que empiezan por el texto', () => {
    const results = names('guinea')
    expect(results[0]).toBe('Guinea')
    expect(results).toEqual(
      expect.arrayContaining(['Guinea Ecuatorial', 'Guinea-Bisáu', 'Papúa Nueva Guinea']),
    )
    expect(results.indexOf('Papúa Nueva Guinea')).toBeGreaterThan(
      results.indexOf('Guinea Ecuatorial'),
    )
  })

  it('encuentra palabras del medio del nombre', () => {
    expect(names('dominicana')).toContain('República Dominicana')
    expect(names('marfil')).toContain('Costa de Marfil')
  })

  it('acepta alias y dice con cuál coincidió', () => {
    const [holanda] = searchCountries('holanda')
    expect(holanda).toEqual({ code: 'nl', name: 'Países Bajos', alias: 'Holanda' })
    for (const query of ['eeuu', 'EE. UU.', 'usa']) expect(names(query)[0]).toBe('Estados Unidos')
  })

  it('no sugiere países ya intentados ni territorios no jugables', () => {
    expect(names('peru', new Set(['pe']))).not.toContain('Perú')
    expect(names('groen')).toEqual([])
  })

  it('devuelve como mucho 6 sugerencias y nada para un texto vacío', () => {
    expect(searchCountries('a')).toHaveLength(6)
    expect(searchCountries('   ')).toEqual([])
  })

  it('resuelve un nombre escrito completo', () => {
    expect(resolveCountry('mexico')).toBe('mx')
    expect(resolveCountry('Méjico')).toBe('mx')
    expect(resolveCountry('costa rica')).toBe('cr')
    expect(resolveCountry('Groenlandia')).toBeNull()
    expect(resolveCountry('Atlántida')).toBeNull()
  })

  it('cada nombre y alias lleva a su propio país', () => {
    const wrong = PLAYABLE.flatMap((c) =>
      [c.name, ...c.aliases]
        .filter((text) => resolveCountry(text) !== c.code)
        .map((t) => `${c.code}: ${t}`),
    )
    expect(wrong).toEqual([])
  })
})
