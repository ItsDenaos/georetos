<script setup lang="ts">
/**
 * Una pregunta de trivia: ficha con pestaña de categoría, opciones como boletos
 * (teclas 1 a 4), sello al responder y lámina con el país. La usan la Trivia y
 * el Reto diario. Quien la usa guarda la respuesta y decide cuándo avanzar.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import AtlasPlate from '@/components/brand/AtlasPlate.vue'
import InkStamp from '@/components/brand/InkStamp.vue'
import type { InkTone } from '@/components/brand/types'
import FlagImage from '@/components/FlagImage.vue'
import StatusIcon from '@/components/StatusIcon.vue'
import WorldMap from '@/components/WorldMap.vue'
import { useAnnouncer } from '@/composables/useAnnouncer'
import { es } from '@/i18n/es'
import { getCountry } from '@/lib/countries'
import type { MapColor } from '@/lib/map'
import type { Question, QuestionType } from '@/lib/questions'

const props = defineProps<{
  question: Question
  /** Respuesta dada (chosen = null si se acabó el tiempo); undefined si aún no se respondió. */
  answer?: { chosen: number | null; correct: boolean }
  /** Posición de la pregunta (1 = primera) y total. */
  position: number
  /** Total de preguntas; sin total (partidas sin fin) no se muestra "de N". */
  total?: number
  isLast: boolean
  /** Sin la lámina ni el botón "Siguiente": quien la usa avanza solo (Contrarreloj). */
  brief?: boolean
}>()

const emit = defineEmits<{ choose: [index: number]; next: [] }>()

const { announce } = useAnnouncer()
const heading = ref<HTMLHeadingElement | null>(null)
const nextButton = ref<HTMLButtonElement | null>(null)

/** Color de la pestaña de cada categoría de pregunta. */
const CATEGORY_CLASS: Record<QuestionType, string> = {
  'capital-de': 'bg-cobalt text-cream',
  'pais-de-capital': 'bg-cobalt text-cream',
  bandera: 'bg-pink text-carbon',
  continente: 'bg-jade text-carbon',
  'mas-grande': 'bg-sun text-carbon',
  'limita-con': 'bg-tomato text-carbon',
  'sin-mar': 'bg-sea text-carbon',
}

const answered = computed(() => Boolean(props.answer))
const correctLabel = computed(() => props.question.options[props.question.answer]?.label ?? '')
const focusName = computed(() => getCountry(props.question.focus)?.name ?? '')

const stamp = computed<{ text: string; tone: InkTone } | null>(() => {
  if (!props.answer) return null
  if (props.answer.correct) return { text: es.trivia.stampCorrect, tone: 'ok' }
  if (props.answer.chosen === null) return { text: es.trivia.stampTime, tone: 'meh' }
  return { text: es.trivia.stampWrong, tone: 'fail' }
})

const mapHighlights = computed(() => {
  const result: Record<string, MapColor> = {}
  for (const code of props.question.related) result[code] = 'related'
  result[props.question.focus] = 'focus'
  return result
})

function optionState(i: number): 'correct' | 'wrong' | 'idle' | 'neutral' {
  if (!props.answer) return 'idle'
  if (i === props.question.answer) return 'correct'
  if (i === props.answer.chosen) return 'wrong'
  return 'neutral'
}

function choose(index: number) {
  if (!answered.value) emit('choose', index)
}

function onKeydown(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || answered.value) return
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, select')) return
  if (/^[1-4]$/.test(event.key)) {
    const index = Number(event.key) - 1
    if (index < props.question.options.length) {
      event.preventDefault()
      choose(index)
    }
  }
}

// Al responder: se anuncia el resultado y el foco pasa a "Siguiente".
watch(
  () => props.answer,
  (answer, before) => {
    if (!answer || before) return
    const parts = [
      answer.correct
        ? es.trivia.correct
        : answer.chosen === null
          ? es.trivia.timeUp
          : es.trivia.wrong,
      ...(answer.correct ? [] : [es.trivia.answerWas(correctLabel.value)]),
      ...(props.question.detail ? [props.question.detail] : []),
    ]
    announce(parts.join('. '))
    if (!props.brief) void nextTick(() => nextButton.value?.focus())
  },
)

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  // Cada pregunta nueva lleva el foco a su enunciado (si no se está escribiendo en otro lado).
  void nextTick(() => heading.value?.focus())
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="flex flex-col gap-5">
    <!-- Ficha de la pregunta -->
    <section class="relative mt-3 animate-rise">
      <span
        class="label-mono absolute -top-3.5 left-4 z-10 rounded-t-lg border-2 border-b-0 border-ink px-3 pt-1 pb-1.5"
        :class="CATEGORY_CLASS[question.type]"
        >{{ es.trivia.categories[question.type] }}</span
      >
      <div class="card relative px-5 pt-6 pb-5 sm:px-7">
        <p class="label-mono text-ink-soft">
          <template v-if="total">
            <span aria-hidden="true">{{ es.trivia.counter(position, total) }}</span>
            <span class="sr-only">{{ es.trivia.questionOf(position, total) }}</span>
          </template>
          <template v-else>{{ es.trivia.questionNumber(position) }}</template>
        </p>
        <h1
          ref="heading"
          tabindex="-1"
          class="mt-1 font-display text-[1.7rem] leading-[1.1] font-extrabold outline-none sm:text-4xl"
        >
          {{ question.prompt }}
        </h1>
        <figure v-if="question.flag" class="relative mx-auto mt-6 mb-1 w-52 -rotate-2 sm:w-64">
          <span
            class="tape absolute -top-3 left-1/2 z-10 h-6 w-20 -translate-x-1/2 rotate-3"
            aria-hidden="true"
          />
          <FlagImage
            :code="question.flag"
            :alt="question.flagAlt ?? es.trivia.flagAlt"
            class="w-full rounded-md border-[2.5px] border-ink shadow-ink"
          />
        </figure>
        <div v-if="stamp" class="pointer-events-none absolute -top-5 right-3 z-20">
          <InkStamp :tone="stamp.tone" size="lg" :rotate="8" aria-hidden="true">{{
            stamp.text
          }}</InkStamp>
        </div>
      </div>
    </section>

    <!-- Opciones -->
    <ol class="grid gap-3 sm:grid-cols-2">
      <li v-for="(option, i) in question.options" :key="option.key">
        <button
          type="button"
          class="option"
          :class="[
            `is-${optionState(i)}`,
            optionState(i) === 'correct' && 'animate-pop',
            optionState(i) === 'wrong' && 'animate-shake',
          ]"
          :aria-disabled="answered"
          :aria-label="es.trivia.optionLabel(i + 1, option.label)"
          @click="choose(i)"
        >
          <span class="key" aria-hidden="true">{{ i + 1 }}</span>
          <span class="flex-1 py-3 pr-2 text-left">{{ option.label }}</span>
          <StatusIcon v-if="optionState(i) === 'correct'" kind="ok" class="mr-3 size-6" />
          <StatusIcon v-else-if="optionState(i) === 'wrong'" kind="fail" class="mr-3 size-6" />
        </button>
      </li>
    </ol>
    <p v-if="!answered" class="label-mono hidden text-center text-ink-soft sm:block">
      {{ es.trivia.keyboardHint }}
    </p>

    <!-- Respuesta y lámina -->
    <section v-if="answer && !brief" class="card flex animate-rise flex-col gap-4 p-4 sm:p-5">
      <div>
        <p
          class="flex items-center gap-2 font-display text-2xl font-extrabold"
          :class="answer.correct ? 'text-jade-ink' : 'text-tomato-ink'"
        >
          <StatusIcon :kind="answer.correct ? 'ok' : 'fail'" class="size-7" />
          {{
            answer.correct
              ? es.trivia.correct
              : answer.chosen === null
                ? es.trivia.timeUp
                : es.trivia.wrong
          }}
        </p>
        <p v-if="!answer.correct" class="mt-1 font-semibold">
          {{ es.trivia.answerWas(correctLabel) }}
        </p>
        <p v-if="question.detail" class="mt-1 text-ink-soft">{{ question.detail }}</p>
      </div>
      <AtlasPlate
        class="h-52 sm:h-72"
        :caption="`${es.map.plate} · ${focusName}`"
        :compass="false"
        flat
      >
        <WorldMap :focus="question.focus" :highlights="mapHighlights" :interactive="false" />
      </AtlasPlate>
      <button
        ref="nextButton"
        type="button"
        class="btn-primary w-full text-lg"
        @click="emit('next')"
      >
        {{ isLast ? es.trivia.finish : es.trivia.next }}
        <svg viewBox="0 0 20 20" class="size-4" aria-hidden="true">
          <path
            d="M4 10h11M11 5l5 5-5 5"
            fill="none"
            stroke="currentColor"
            stroke-width="2.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </section>
  </div>
</template>

<style scoped>
.option {
  display: flex;
  width: 100%;
  min-height: 3.6rem;
  align-items: center;
  gap: 0.75rem;
  overflow: hidden;
  border: 2px solid var(--color-ink);
  border-radius: 0.9rem;
  background: var(--color-paper-light);
  font-size: 1.1rem;
  font-weight: 700;
  box-shadow: 3px 3px 0 0 var(--color-shadow);
  transition:
    transform 140ms ease,
    box-shadow 140ms ease,
    background-color 160ms ease,
    opacity 160ms ease;
}

/* Talón del boleto: número separado con línea perforada */
.key {
  display: grid;
  place-items: center;
  align-self: stretch;
  width: 3rem;
  flex-shrink: 0;
  border-right: 2px dashed var(--color-ink);
  background: var(--color-sun);
  color: var(--color-carbon);
  font-family: var(--font-mono);
  font-size: 1rem;
  font-weight: 600;
  transition: background-color 160ms ease;
}

.option.is-idle {
  cursor: pointer;
}
.option.is-idle:hover {
  transform: translate(-1px, -2px);
  box-shadow: 5px 5px 0 0 var(--color-shadow);
}
.option.is-idle:hover .key {
  background: var(--color-pink);
}
.option.is-idle:active {
  transform: translate(3px, 3px);
  box-shadow: 0 0 0 0 var(--color-shadow);
}
.option.is-correct {
  background: var(--color-jade-light);
  color: var(--color-jade-ink);
}
.option.is-correct .key {
  background: var(--color-jade);
}
.option.is-wrong {
  background: var(--color-tomato-light);
  color: var(--color-tomato-ink);
}
.option.is-wrong .key {
  background: var(--color-tomato);
}
.option.is-neutral {
  opacity: 0.5;
  box-shadow: none;
}

/* Cinta adhesiva que sujeta la bandera */
.tape {
  background: rgb(255 201 60 / 0.75);
  border-left: 2px dashed rgb(27 31 59 / 0.25);
  border-right: 2px dashed rgb(27 31 59 / 0.25);
}
</style>
