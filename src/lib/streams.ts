/**
 * Preguntas a demanda para las partidas sin cantidad fija (Contrarreloj y
 * Supervivencia). Reutilizan el generador de Trivia y los niveles de superficie
 * del Reto diario; son deterministas: misma semilla y mismas dificultades
 * pedidas, mismas preguntas. Nunca repiten país.
 */
import { playableIn } from './countries'
import { MAP_AREA } from './dailyChallenge'
import { QUESTION_TYPES, generateTrivia, type Question, type QuestionType } from './questions'
import { createRng } from './rng'
import type { Difficulty, RegionId } from './types'

export interface MapStream {
  /** Siguiente país; con dificultad, de la superficie que le toca. null si no quedan. */
  next(difficulty?: Difficulty): string | null
}

export function createMapStream(seed: string, region: RegionId): MapStream {
  const rng = createRng(`mapa-sin-fin|${seed}|${region}`)
  const used = new Set<string>()
  return {
    next(difficulty) {
      const remaining = playableIn(region).filter((c) => !used.has(c.code))
      if (remaining.length === 0) return null
      let pool = remaining
      if (difficulty) {
        const [min, max] = MAP_AREA[difficulty]
        const tier = remaining.filter((c) => c.area >= min && c.area < max)
        // Si ya no quedan del tamaño pedido, vale cualquiera.
        if (tier.length > 0) pool = tier
      }
      const { code } = rng.pick(pool)
      used.add(code)
      return code
    },
  }
}

export interface TriviaStream {
  /** Siguiente pregunta con la dificultad pedida; null si no quedan países en la región. */
  next(difficulty: Difficulty): Question | null
}

export function createTriviaStream(seed: string, region: RegionId): TriviaStream {
  const used: string[] = []
  let lastType: QuestionType | null = null
  let count = 0
  return {
    next(difficulty) {
      const config = {
        seed: `${seed}|${count++}`,
        difficulty,
        region,
        count: 1,
        exclude: used,
      }
      // Para que no salgan dos preguntas seguidas del mismo tipo.
      const types = QUESTION_TYPES.filter((t) => t !== lastType)
      const question = generateTrivia({ ...config, types })[0] ?? generateTrivia(config)[0] ?? null
      if (question) {
        used.push(question.subject)
        lastType = question.type
      }
      return question
    },
  }
}
