/** Variantes Contrarreloj y Supervivencia: reglas puras y claves de récord. */
import { describe, expect, it } from 'vitest'

import { parseRecordKey, recordKey } from '@/lib/results'
import {
  LEVEL_EVERY,
  SURVIVAL_LIVES,
  TIME_ATTACK_MS,
  TIME_PENALTY_MS,
  applyCorrect,
  applyMiss,
  createRun,
  difficultyOfLevel,
  endRun,
  levelOf,
  remainingMs,
} from '@/lib/variants'

describe('Contrarreloj', () => {
  it('dura 60 segundos y cada fallo resta 3', () => {
    expect(TIME_ATTACK_MS).toBe(60_000)
    expect(TIME_PENALTY_MS).toBe(3_000)
    let run = createRun('contrarreloj')
    expect(remainingMs(run, 10_000)).toBe(50_000)
    run = applyMiss(applyMiss(run))
    expect(run.penaltyMs).toBe(6_000)
    expect(run.misses).toBe(2)
    expect(remainingMs(run, 10_000)).toBe(44_000)
    // Los fallos no quitan vidas ni terminan la partida.
    expect(run.lives).toBe(SURVIVAL_LIVES)
    expect(run.over).toBe(false)
  })

  it('el tiempo no baja de cero', () => {
    const run = applyMiss(createRun('contrarreloj'))
    expect(remainingMs(run, 58_000)).toBe(0)
  })

  it('los aciertos solo suman', () => {
    const run = applyCorrect(applyCorrect(createRun('contrarreloj')))
    expect(run.correct).toBe(2)
    expect(run.penaltyMs).toBe(0)
  })
})

describe('Supervivencia', () => {
  it('3 vidas: el tercer fallo termina la partida', () => {
    let run = createRun('supervivencia')
    expect(run.lives).toBe(3)
    run = applyMiss(run)
    run = applyMiss(run)
    expect(run.lives).toBe(1)
    expect(run.over).toBe(false)
    run = applyMiss(run)
    expect(run.lives).toBe(0)
    expect(run.over).toBe(true)
    // Terminada, ya no cambia.
    expect(applyCorrect(run)).toBe(run)
    expect(applyMiss(run)).toBe(run)
    // No usa reloj.
    expect(run.penaltyMs).toBe(0)
  })

  it('sube de nivel cada 5 aciertos y se queda en difícil', () => {
    expect(LEVEL_EVERY).toBe(5)
    expect([0, 4, 5, 9, 10, 40].map(levelOf)).toEqual([0, 0, 1, 1, 2, 2])
    expect([0, 1, 2, 7].map(difficultyOfLevel)).toEqual(['facil', 'media', 'dificil', 'dificil'])
  })
})

describe('fin de partida', () => {
  it('endRun la cierra sin tocar el resto', () => {
    const run = endRun(applyCorrect(createRun('contrarreloj')))
    expect(run.over).toBe(true)
    expect(run.correct).toBe(1)
  })
})

describe('claves de récord', () => {
  it('las partidas clásicas conservan sus claves de siempre', () => {
    expect(recordKey({ mode: 'locate', region: 'europa', count: 10 })).toBe('locate|europa|10')
    expect(recordKey({ mode: 'trivia', region: 'mundo', difficulty: 'media' })).toBe(
      'trivia|mundo|media',
    )
    expect(recordKey({ mode: 'locate', region: 'asia', count: 'todos', variant: 'clasica' })).toBe(
      'locate|asia|todos',
    )
    expect(parseRecordKey('locate|europa|10')).toEqual({
      mode: 'locate',
      region: 'europa',
      level: '10',
      variant: 'clasica',
    })
  })

  it('cada variante guarda su propio récord', () => {
    const timeAttack = recordKey({ mode: 'locate', region: 'europa', variant: 'contrarreloj' })
    const survival = recordKey({ mode: 'locate', region: 'mundo', variant: 'supervivencia' })
    const triviaFast = recordKey({
      mode: 'trivia',
      region: 'mundo',
      difficulty: 'dificil',
      variant: 'contrarreloj',
    })
    expect(timeAttack).toBe('locate|europa|-|contrarreloj')
    expect(survival).toBe('locate|mundo|-|supervivencia')
    expect(triviaFast).toBe('trivia|mundo|dificil|contrarreloj')
    expect(parseRecordKey(triviaFast)).toEqual({
      mode: 'trivia',
      region: 'mundo',
      level: 'dificil',
      variant: 'contrarreloj',
    })
    // La dificultad de Supervivencia sube sola: no separa récords.
    expect(
      recordKey({ mode: 'trivia', region: 'mundo', difficulty: 'facil', variant: 'supervivencia' }),
    ).toBe('trivia|mundo|-|supervivencia')
  })
})
