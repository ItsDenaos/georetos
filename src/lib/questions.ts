/**
 * Generador de preguntas de trivia a partir de los datos de países.
 * Determinista: misma configuración + misma semilla = misma partida.
 */
import { es } from '@/i18n/es'
import { CONTINENTS, PLAYABLE, capitalsOf, getCountry, playableIn } from './countries'
import { createRng, type Rng } from './rng'
import type { ContinentId, Country, Difficulty, RegionId } from './types'

export const QUESTION_TYPES = [
  'capital-de',
  'bandera',
  'pais-de-capital',
  'continente',
  'mas-grande',
  'limita-con',
  'sin-mar',
] as const

export type QuestionType = (typeof QUESTION_TYPES)[number]

export const QUESTIONS_PER_GAME = 10
export const OPTIONS_PER_QUESTION = 4

/** Países entre dos continentes: no se pregunta "¿en qué continente está?". */
export const TRANSCONTINENTAL = ['ru', 'tr', 'kz', 'ge', 'am', 'az', 'cy', 'eg', 'id', 'tl']

/** En "¿cuál es más grande?" la respuesta supera al resto al menos en este factor. */
export const LARGEST_MIN_RATIO = 1.15

export interface Option {
  /** Único dentro de la pregunta: código de país o id de continente. */
  key: string
  label: string
}

export interface Question {
  /** Único en la partida. */
  id: string
  type: QuestionType
  prompt: string
  /** Código del país cuya bandera se muestra (solo en preguntas de bandera). */
  flag?: string
  /** Texto alternativo de la bandera: nunca revela la respuesta. */
  flagAlt?: string
  /** País del que trata la pregunta: no se repite en la partida. */
  subject: string
  options: Option[]
  /** Índice de la opción correcta. */
  answer: number
  /** País al que hace zoom el mini mapa. */
  focus: string
  /** Otros países que se resaltan en el mini mapa. */
  related: string[]
  /** Dato extra que se muestra al responder. */
  detail?: string
}

export interface TriviaConfig {
  seed: string
  difficulty: Difficulty
  region: RegionId
  /** Partida de repaso: solo preguntas sobre estos países. */
  only?: string[]
  count?: number
}

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

/** "Ciudad de México" o "Brasilia" delatan al país: solo se preguntan en fácil. */
function capitalRevealsCountry(c: Country): boolean {
  const capital = normalize(c.capital)
  const name = normalize(c.name)
  return capital.includes(name) || name.includes(capital)
}

interface Context {
  rng: Rng
  difficulty: Difficulty
  /** Veces que cada clave ya apareció como opción: se prefieren las no usadas. */
  used: Map<string, number>
}

/**
 * Candidatos a opción incorrecta por niveles, de más a menos creíble según la
 * dificultad. Si un nivel no alcanza, se completa con el siguiente.
 */
function distractorTiers(subject: Country, difficulty: Difficulty): Country[][] {
  const others = PLAYABLE.filter((c) => c.code !== subject.code)
  const sameContinent = others.filter((c) => c.continent === subject.continent)
  if (difficulty === 'facil') {
    return [others.filter((c) => c.continent !== subject.continent), others]
  }
  if (difficulty === 'media') return [sameContinent, others]
  const close = others.filter(
    (c) => subject.borders.includes(c.code) || c.subregion === subject.subregion,
  )
  return [close, sameContinent, others]
}

/** Elige `n` candidatos válidos recorriendo los niveles; null si no alcanzan. */
function pickDistractors(
  ctx: Context,
  tiers: Country[][],
  n: number,
  isValid: (c: Country) => boolean,
): Country[] | null {
  const chosen: Country[] = []
  const chosenCodes = new Set<string>()
  for (const tier of tiers) {
    if (chosen.length >= n) break
    const candidates = ctx.rng
      .shuffle(tier.filter((c) => !chosenCodes.has(c.code) && isValid(c)))
      // Orden estable: primero las que menos han salido en la partida.
      .sort((a, b) => (ctx.used.get(a.code) ?? 0) - (ctx.used.get(b.code) ?? 0))
    for (const c of candidates) {
      if (chosen.length >= n) break
      chosen.push(c)
      chosenCodes.add(c.code)
    }
  }
  return chosen.length === n ? chosen : null
}

/** Mezcla las opciones y devuelve el índice de la correcta. */
function arrange(ctx: Context, correct: Option, wrong: Option[]) {
  const options = ctx.rng.shuffle([correct, ...wrong])
  for (const o of options) ctx.used.set(o.key, (ctx.used.get(o.key) ?? 0) + 1)
  return { options, answer: options.findIndex((o) => o.key === correct.key) }
}

const countryOption = (c: Country): Option => ({ key: c.code, label: c.name })
const WRONG = OPTIONS_PER_QUESTION - 1

type Builder = (s: Country, ctx: Context) => Omit<Question, 'id' | 'type' | 'subject'> | null

const builders: Record<QuestionType, Builder> = {
  'capital-de'(s, ctx) {
    if (!s.capital || (ctx.difficulty !== 'facil' && capitalRevealsCountry(s))) return null
    const own = capitalsOf(s)
    const wrong = pickDistractors(
      ctx,
      distractorTiers(s, ctx.difficulty),
      WRONG,
      (c) => !own.includes(c.capital) && !capitalsOf(c).includes(s.capital),
    )
    if (!wrong) return null
    const { options, answer } = arrange(
      ctx,
      { key: s.code, label: s.capital },
      wrong.map((c) => ({ key: c.code, label: c.capital })),
    )
    return { prompt: es.trivia.capitalOf(s.name), options, answer, focus: s.code, related: [] }
  },

  bandera(s, ctx) {
    const wrong = pickDistractors(ctx, distractorTiers(s, ctx.difficulty), WRONG, () => true)
    if (!wrong) return null
    const { options, answer } = arrange(ctx, countryOption(s), wrong.map(countryOption))
    return {
      prompt: es.trivia.flagOf,
      flag: s.code,
      flagAlt: es.trivia.flagAlt,
      options,
      answer,
      focus: s.code,
      related: [],
    }
  },

  'pais-de-capital'(s, ctx) {
    if (!s.capital || (ctx.difficulty !== 'facil' && capitalRevealsCountry(s))) return null
    const wrong = pickDistractors(
      ctx,
      distractorTiers(s, ctx.difficulty),
      WRONG,
      (c) => !capitalsOf(c).includes(s.capital),
    )
    if (!wrong) return null
    const { options, answer } = arrange(ctx, countryOption(s), wrong.map(countryOption))
    return {
      prompt: es.trivia.countryOfCapital(s.capital),
      options,
      answer,
      focus: s.code,
      related: [],
    }
  },

  continente(s, ctx) {
    if (TRANSCONTINENTAL.includes(s.code) || s.continent === 'antartida') return null
    const correct = s.continent
    const others = ctx.rng.shuffle(CONTINENTS.filter((c) => c !== correct)).slice(0, WRONG)
    const toOption = (id: ContinentId): Option => ({ key: id, label: es.continents[id] })
    const { options, answer } = arrange(ctx, toOption(correct), others.map(toOption))
    return { prompt: es.trivia.continentOf(s.name), options, answer, focus: s.code, related: [] }
  },

  'mas-grande'(s, ctx) {
    const wrong = pickDistractors(
      ctx,
      distractorTiers(s, ctx.difficulty),
      WRONG,
      (c) => c.area * LARGEST_MIN_RATIO <= s.area,
    )
    if (!wrong) return null
    const { options, answer } = arrange(ctx, countryOption(s), wrong.map(countryOption))
    return {
      prompt: es.trivia.largest,
      options,
      answer,
      focus: s.code,
      related: wrong.map((c) => c.code),
      detail: es.trivia.largestDetail(s.name, es.format.number(s.area)),
    }
  },

  'limita-con'(s, ctx) {
    const neighbours = s.borders.filter((code) => getCountry(code)?.playable)
    if (neighbours.length === 0) return null
    const neighbour = getCountry(ctx.rng.pick(neighbours))
    if (!neighbour) return null
    // En difícil, los vecinos de los vecinos son las opciones más engañosas.
    const tiers = distractorTiers(s, ctx.difficulty)
    if (ctx.difficulty === 'dificil') {
      const twoHops = new Set(neighbours.flatMap((code) => getCountry(code)?.borders ?? []))
      tiers.unshift(PLAYABLE.filter((c) => twoHops.has(c.code)))
    }
    const wrong = pickDistractors(
      ctx,
      tiers,
      WRONG,
      (c) => c.code !== s.code && c.code !== neighbour.code && !s.borders.includes(c.code),
    )
    if (!wrong) return null
    const { options, answer } = arrange(ctx, countryOption(neighbour), wrong.map(countryOption))
    return {
      prompt: es.trivia.bordersWith(s.name),
      options,
      answer,
      focus: s.code,
      related: [neighbour.code],
    }
  },

  'sin-mar'(s, ctx) {
    if (!s.landlocked) return null
    const wrong = pickDistractors(
      ctx,
      distractorTiers(s, ctx.difficulty),
      WRONG,
      (c) => !c.landlocked,
    )
    if (!wrong) return null
    const { options, answer } = arrange(ctx, countryOption(s), wrong.map(countryOption))
    return { prompt: es.trivia.landlocked, options, answer, focus: s.code, related: [] }
  },
}

/** Genera una partida de trivia. Puede devolver menos preguntas si no hay países suficientes. */
export function generateTrivia(config: TriviaConfig): Question[] {
  const rng = createRng(`trivia|${config.seed}|${config.difficulty}|${config.region}`)
  const ctx: Context = { rng, difficulty: config.difficulty, used: new Map() }

  const pool = config.only
    ? config.only.flatMap((code) => {
        const c = getCountry(code)
        return c?.playable ? [c] : []
      })
    : playableIn(config.region)
  const count = Math.min(config.count ?? QUESTIONS_PER_GAME, QUESTIONS_PER_GAME, pool.length)

  // Cada tipo sale al menos una vez si se puede; el resto, al azar.
  const plan = rng.shuffle(QUESTION_TYPES)
  while (plan.length < count) plan.push(rng.pick(QUESTION_TYPES))

  const subjects = rng.shuffle(pool)
  const usedSubjects = new Set<string>()
  const questions: Question[] = []

  for (let slot = 0; slot < plan.length && questions.length < count; slot++) {
    const preferred = plan[slot] as QuestionType
    // Si el tipo planeado no encaja con ningún país libre, se prueba con los demás.
    const types = [preferred, ...rng.shuffle(QUESTION_TYPES.filter((t) => t !== preferred))]
    // Primero los países que menos han salido como opción en preguntas anteriores.
    const ordered = [...subjects].sort(
      (a, b) => (ctx.used.get(a.code) ?? 0) - (ctx.used.get(b.code) ?? 0),
    )
    let made: Question | null = null
    for (const type of types) {
      for (const s of ordered) {
        if (usedSubjects.has(s.code)) continue
        const built = builders[type](s, ctx)
        if (!built) continue
        made = { id: `${type}:${s.code}`, type, subject: s.code, ...built }
        break
      }
      if (made) break
    }
    if (!made) break
    usedSubjects.add(made.subject)
    questions.push(made)
  }
  return questions
}
