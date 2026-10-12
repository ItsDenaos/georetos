import { describe, expect, it } from 'vitest'

import { PLAYABLE, capitalsOf, getCountry, playableIn } from '@/lib/countries'
import {
  LARGEST_MIN_RATIO,
  OPTIONS_PER_QUESTION,
  QUESTIONS_PER_GAME,
  TRANSCONTINENTAL,
  generateTrivia,
  type Question,
} from '@/lib/questions'
import { REGIONS } from '@/lib/regions'
import type { Country, Difficulty } from '@/lib/types'

const DIFFICULTIES: Difficulty[] = ['facil', 'media', 'dificil']
const SEEDS = ['a', 'b', 'c', 'reto', '2026-10-12']

function country(code: string): Country {
  const c = getCountry(code)
  if (!c) throw new Error(`País desconocido: ${code}`)
  return c
}

/** Todas las combinaciones: 8 regiones × 3 dificultades × 5 semillas = 120 partidas. */
const games = REGIONS.flatMap((region) =>
  DIFFICULTIES.flatMap((difficulty) =>
    SEEDS.map((seed) => ({
      region,
      difficulty,
      seed,
      questions: generateTrivia({ seed, difficulty, region }),
    })),
  ),
)
const allQuestions = games.flatMap((g) => g.questions.map((q) => ({ ...g, q })))

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

/**
 * Problemas de una pregunta según los datos (lista vacía = la respuesta marcada
 * como correcta lo es de verdad y las incorrectas son incorrectas).
 */
function answerProblems(q: Question): string[] {
  const s = country(q.subject)
  const correct = q.options[q.answer]
  const wrong = q.options.filter((_, i) => i !== q.answer)
  const fail = (why: string) => [`${q.id}: ${why}`]
  if (!correct) return fail('sin respuesta correcta')
  switch (q.type) {
    case 'capital-de':
      if (correct.label !== s.capital) return fail(`capital ${correct.label}`)
      return wrong.flatMap((o) => (capitalsOf(s).includes(o.label) ? fail(o.label) : []))
    case 'pais-de-capital':
      if (correct.key !== s.code) return fail(`país ${correct.key}`)
      return wrong.flatMap((o) =>
        capitalsOf(country(o.key)).includes(s.capital) ? fail(o.key) : [],
      )
    case 'bandera':
      return q.flag === s.code && correct.key === s.code ? [] : fail(`bandera ${q.flag}`)
    case 'continente':
      if (TRANSCONTINENTAL.includes(s.code)) return fail('transcontinental')
      return correct.key === s.continent ? [] : fail(`continente ${correct.key}`)
    case 'mas-grande':
      if (correct.key !== s.code) return fail(`más grande ${correct.key}`)
      return wrong.flatMap((o) =>
        country(o.key).area * LARGEST_MIN_RATIO > s.area ? fail(`${o.key} demasiado grande`) : [],
      )
    case 'limita-con':
      if (!s.borders.includes(correct.key)) return fail(`${correct.key} no es vecino`)
      return wrong.flatMap((o) =>
        o.key === s.code || s.borders.includes(o.key) ? fail(`${o.key} sí limita`) : [],
      )
    case 'sin-mar':
      if (correct.key !== s.code || !s.landlocked) return fail(`${correct.key} tiene mar`)
      return wrong.flatMap((o) => (country(o.key).landlocked ? fail(`${o.key} sin mar`) : []))
  }
}

describe('generador de trivia', () => {
  it('genera 10 preguntas en todas las regiones y dificultades', () => {
    for (const g of games) expect(g.questions).toHaveLength(QUESTIONS_PER_GAME)
  })

  it('cada pregunta tiene 4 opciones distintas y la respuesta está entre ellas', () => {
    for (const { q } of allQuestions) {
      expect(q.options).toHaveLength(OPTIONS_PER_QUESTION)
      expect(new Set(q.options.map((o) => o.key)).size).toBe(OPTIONS_PER_QUESTION)
      expect(new Set(q.options.map((o) => o.label)).size).toBe(OPTIONS_PER_QUESTION)
      expect(q.answer).toBeGreaterThanOrEqual(0)
      expect(q.answer).toBeLessThan(OPTIONS_PER_QUESTION)
    }
  })

  it('la respuesta correcta es correcta según los datos', () => {
    expect(allQuestions.flatMap(({ q }) => answerProblems(q))).toEqual([])
  })

  it('no repite preguntas ni países preguntados en una partida', () => {
    for (const g of games) {
      expect(new Set(g.questions.map((q) => q.id)).size).toBe(g.questions.length)
      expect(new Set(g.questions.map((q) => q.subject)).size).toBe(g.questions.length)
    }
  })

  it('usa los 7 tipos de pregunta', () => {
    const types = new Set(allQuestions.map(({ q }) => q.type))
    expect(types.size).toBe(7)
  })

  it('pregunta solo por países de la región elegida', () => {
    for (const { region, q } of allQuestions) {
      expect(playableIn(region).map((c) => c.code)).toContain(q.subject)
    }
  })

  it('es determinista: misma configuración y semilla, misma partida', () => {
    const config = { seed: 'compartir', difficulty: 'media' as const, region: 'mundo' as const }
    expect(generateTrivia(config)).toEqual(generateTrivia(config))
    expect(generateTrivia({ ...config, seed: 'otra' })).not.toEqual(generateTrivia(config))
  })

  it('el texto alternativo de la bandera no revela la respuesta', () => {
    const flags = allQuestions.filter(({ q }) => q.type === 'bandera')
    expect(flags.length).toBeGreaterThan(0)
    for (const { q } of flags) {
      const alt = normalize(q.flagAlt ?? '')
      expect(alt).not.toBe('')
      for (const o of q.options) expect(alt).not.toContain(normalize(o.label))
      expect(alt.split(/\s+/)).not.toContain(q.subject)
    }
  })

  it('nunca ofrece una capital secundaria como opción incorrecta', () => {
    // Países con varias capitales (Sudáfrica, Bolivia, Palestina…), muchas semillas.
    const multi = PLAYABLE.filter((c) => c.otherCapitals.length > 0)
    expect(multi.map((c) => c.code)).toEqual(expect.arrayContaining(['za', 'bo', 'ps']))
    const offered = multi.flatMap((c) =>
      Array.from({ length: 40 }, (_, i) =>
        generateTrivia({
          seed: `multi-${i}`,
          difficulty: DIFFICULTIES[i % 3] as Difficulty,
          region: 'mundo',
          only: [c.code],
        }),
      )
        .flat()
        .filter((q) => q.type === 'capital-de')
        .flatMap((q) => q.options.filter((o) => c.otherCapitals.includes(o.label))),
    )
    expect(offered).toEqual([])
  })

  describe('opciones según la dificultad', () => {
    const countryQuestions = allQuestions.filter(({ q }) =>
      ['bandera', 'capital-de', 'pais-de-capital'].includes(q.type),
    )
    const distractors = (q: Question) =>
      q.options.filter((_, i) => i !== q.answer).map((o) => country(o.key))

    /** Opciones incorrectas que no cumplen la regla de la dificultad. */
    const violations = (difficulty: Difficulty, ok: (s: Country, d: Country) => boolean) =>
      countryQuestions
        .filter((x) => x.difficulty === difficulty)
        .flatMap(({ q }) =>
          distractors(q)
            .filter((d) => !ok(country(q.subject), d))
            .map((d) => `${q.id} → ${d.code}`),
        )

    it('fácil: de otros continentes', () => {
      expect(violations('facil', (s, d) => d.continent !== s.continent)).toEqual([])
    })

    it('media: del mismo continente', () => {
      expect(violations('media', (s, d) => d.continent === s.continent)).toEqual([])
    })

    it('difícil: vecinos o de la misma subregión cuando los hay', () => {
      const banderas = countryQuestions.filter(
        (x) => x.difficulty === 'dificil' && x.q.type === 'bandera',
      )
      expect(banderas.length).toBeGreaterThan(0)
      const bad = banderas.flatMap(({ q }) => {
        const s = country(q.subject)
        const close = PLAYABLE.filter(
          (c) => c.code !== s.code && (s.borders.includes(c.code) || c.subregion === s.subregion),
        )
        // Si hay suficientes cercanos, todas las opciones lo son; si no, al menos del continente.
        const ok = (d: Country) =>
          close.length >= OPTIONS_PER_QUESTION - 1 ? close.includes(d) : d.continent === s.continent
        return distractors(q)
          .filter((d) => !ok(d))
          .map((d) => `${q.id} → ${d.code}`)
      })
      expect(bad).toEqual([])
    })
  })

  it('en un repaso pregunta solo por los países fallados', () => {
    const only = ['co', 'fr', 'jp']
    const questions = generateTrivia({ seed: 'r', difficulty: 'media', region: 'mundo', only })
    expect(questions).toHaveLength(3)
    expect(questions.map((q) => q.subject).sort()).toEqual([...only].sort())
  })
})
