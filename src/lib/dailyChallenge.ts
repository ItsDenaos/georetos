/**
 * Reto diario: 10 preguntas mezcladas (mapa y trivia, alternadas) que suben de
 * fácil a difícil. Se generan con la semilla del día (lib/daily.ts), así que son
 * las mismas para todos en la misma fecha local.
 */
import { PLAYABLE } from './countries'
import { QUESTION_TYPES, generateTrivia, type Question, type QuestionType } from './questions'
import { createRng } from './rng'
import type { Difficulty } from './types'

/** Si cambia la forma de generar el reto, se sube la versión para no alterar los ya jugados. */
export const DAILY_CHALLENGE_VERSION = 'v1'

/** Dificultad de cada pregunta, en orden. */
export const DAILY_DIFFICULTY: readonly Difficulty[] = [
  'facil',
  'facil',
  'facil',
  'media',
  'media',
  'media',
  'media',
  'dificil',
  'dificil',
  'dificil',
]

export { DAILY_LENGTH, DAILY_MAX_SCORE, DAILY_POINTS } from './dailyChallengeRules'

/** Superficie (km²) de los países de mapa según la dificultad: [mínimo, máximo). */
export const MAP_AREA: Record<Difficulty, readonly [number, number]> = {
  facil: [500_000, Infinity],
  media: [100_000, 500_000],
  dificil: [0, 100_000],
}

export type DailyItem =
  | { kind: 'map'; difficulty: Difficulty; code: string }
  | { kind: 'trivia'; difficulty: Difficulty; question: Question }

/** Las preguntas 1.ª, 3.ª, 5.ª… son de mapa; las demás, de trivia. */
export function dailyKind(index: number): DailyItem['kind'] {
  return index % 2 === 0 ? 'map' : 'trivia'
}

/** Las dos preguntas de capitales cuentan como un mismo tipo para no repetir tema. */
const TYPE_FAMILY: Partial<Record<QuestionType, QuestionType[]>> = {
  'capital-de': ['capital-de', 'pais-de-capital'],
  'pais-de-capital': ['capital-de', 'pais-de-capital'],
}

export function generateDailyChallenge(seed: string): DailyItem[] {
  const rng = createRng(`reto-diario|${DAILY_CHALLENGE_VERSION}|${seed}`)
  const used = new Set<string>()
  const usedTypes = new Set<QuestionType>()

  return DAILY_DIFFICULTY.map((difficulty, index): DailyItem => {
    if (dailyKind(index) === 'map') {
      const [min, max] = MAP_AREA[difficulty]
      const pool = PLAYABLE.filter((c) => c.area >= min && c.area < max && !used.has(c.code))
      const { code } = rng.pick(pool)
      used.add(code)
      return { kind: 'map', difficulty, code }
    }

    const config = {
      seed: `${seed}|${DAILY_CHALLENGE_VERSION}|${index}|${rng.int(1_000_000_000)}`,
      difficulty,
      region: 'mundo' as const,
      count: 1,
      exclude: [...used],
    }
    // Primero un tipo que aún no salió; si ninguno encaja, cualquiera.
    const fresh = QUESTION_TYPES.filter((t) => !usedTypes.has(t))
    const question = generateTrivia({ ...config, types: fresh })[0] ?? generateTrivia(config)[0]
    if (!question) throw new Error(`No se pudo generar la pregunta ${index + 1} del reto ${seed}`)
    used.add(question.subject)
    for (const t of TYPE_FAMILY[question.type] ?? [question.type]) usedTypes.add(t)
    return { kind: 'trivia', difficulty, question }
  })
}
