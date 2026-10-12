<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import AtlasPlate from '@/components/brand/AtlasPlate.vue'
import InkStamp from '@/components/brand/InkStamp.vue'
import RouteProgress from '@/components/brand/RouteProgress.vue'
import TimerRing from '@/components/brand/TimerRing.vue'
import type { InkTone, StopMark } from '@/components/brand/types'
import FlagImage from '@/components/FlagImage.vue'
import ScoreTicket from '@/components/ScoreTicket.vue'
import StatusIcon from '@/components/StatusIcon.vue'
import WorldMap from '@/components/WorldMap.vue'
import { useAnnouncer } from '@/composables/useAnnouncer'
import { es } from '@/i18n/es'
import { getCountry } from '@/lib/countries'
import type { MapColor } from '@/lib/map'
import type { QuestionType } from '@/lib/questions'
import type { TriviaUrlConfig } from '@/lib/urlConfig'
import { useProgressStore } from '@/stores/progress'
import { useResultStore } from '@/stores/result'
import { useTriviaStore } from '@/stores/trivia'

const props = defineProps<{ config: TriviaUrlConfig }>()

const TIME_LIMIT_MS = 15_000

const store = useTriviaStore()
const router = useRouter()
const { announce } = useAnnouncer()

store.start(props.config)

const heading = ref<HTMLHeadingElement | null>(null)
const nextButton = ref<HTMLButtonElement | null>(null)
const remainingMs = ref(TIME_LIMIT_MS)
let deadline = 0
let ticker: ReturnType<typeof setInterval> | undefined

const question = computed(() => store.current)
const answer = computed(() => store.currentAnswer)
const answered = computed(() => Boolean(answer.value))
const correctLabel = computed(() =>
  question.value ? (question.value.options[question.value.answer]?.label ?? '') : '',
)
const secondsLeft = computed(() => Math.ceil(remainingMs.value / 1000))

/** Color de la pestaña de cada categoría de pregunta. */
const CATEGORY_CLASS: Record<QuestionType, string> = {
  'capital-de': 'bg-cobalt text-paper-light',
  'pais-de-capital': 'bg-cobalt text-paper-light',
  bandera: 'bg-pink text-ink',
  continente: 'bg-jade text-paper-light',
  'mas-grande': 'bg-sun text-ink',
  'limita-con': 'bg-tomato text-paper-light',
  'sin-mar': 'bg-sea text-ink',
}

const stops = computed<StopMark[]>(() =>
  store.questions.map((q) => {
    const a = store.answers.find((x) => x.questionId === q.id)
    return a ? (a.correct ? 'ok' : 'fail') : null
  }),
)

const stamp = computed<{ text: string; tone: InkTone } | null>(() => {
  if (!answer.value) return null
  if (answer.value.correct) return { text: es.trivia.stampCorrect, tone: 'ok' }
  if (answer.value.chosen === null) return { text: es.trivia.stampTime, tone: 'meh' }
  return { text: es.trivia.stampWrong, tone: 'fail' }
})

const focusName = computed(() => (question.value ? getCountry(question.value.focus)?.name : ''))

const mapHighlights = computed(() => {
  const q = question.value
  if (!q) return {}
  const result: Record<string, MapColor> = {}
  for (const code of q.related) result[code] = 'related'
  result[q.focus] = 'focus'
  return result
})

function optionState(i: number): 'correct' | 'wrong' | 'idle' | 'neutral' {
  if (!answer.value || !question.value) return 'idle'
  if (i === question.value.answer) return 'correct'
  if (i === answer.value.chosen) return 'wrong'
  return 'neutral'
}

function stopTimer() {
  clearInterval(ticker)
  ticker = undefined
}

function startTimer() {
  stopTimer()
  if (!props.config.timer) return
  deadline = Date.now() + TIME_LIMIT_MS
  remainingMs.value = TIME_LIMIT_MS
  ticker = setInterval(() => {
    remainingMs.value = Math.max(0, deadline - Date.now())
    if (remainingMs.value === 0) choose(null)
  }, 200)
}

function choose(index: number | null) {
  const correct = store.answer(index)
  if (correct === null) return
  stopTimer()
  const parts = [
    correct ? es.trivia.correct : index === null ? es.trivia.timeUp : es.trivia.wrong,
    ...(correct ? [] : [es.trivia.answerWas(correctLabel.value)]),
    ...(question.value?.detail ? [question.value.detail] : []),
  ]
  announce(parts.join('. '))
  void nextTick(() => nextButton.value?.focus())
}

function goNext() {
  store.next()
}

function onKeydown(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey) return
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, select')) return
  if (!answered.value && /^[1-4]$/.test(event.key)) {
    const index = Number(event.key) - 1
    if (question.value && index < question.value.options.length) {
      event.preventDefault()
      choose(index)
    }
  }
}

watch(
  () => store.index,
  () => {
    startTimer()
    void nextTick(() => heading.value?.focus())
  },
)

watch(
  () => store.finished,
  (finished) => {
    if (!finished || store.questions.length === 0) return
    const partial = store.buildResult()
    if (!partial) return
    useResultStore().set(useProgressStore().register(partial))
    void router.push({ name: 'results' })
  },
)

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  startTimer()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  stopTimer()
})
</script>

<template>
  <div v-if="store.questions.length === 0" class="flex flex-col gap-4 px-4 py-8">
    <p class="card p-5 font-semibold">{{ es.trivia.notEnough }}</p>
    <RouterLink to="/trivia" class="btn-primary w-fit">{{ es.setup.back }}</RouterLink>
  </div>

  <div v-else-if="question" class="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pt-3 pb-8">
    <!-- Ruta, puntos y cronómetro -->
    <div class="flex items-center gap-3">
      <div class="flex min-w-0 flex-1 flex-col gap-1.5">
        <div class="flex items-center justify-between gap-3">
          <span class="label-mono truncate text-ink-soft">
            {{ es.locate.route(config.seed) }} · {{ es.difficulties[config.difficulty] }}
          </span>
          <ScoreTicket :score="store.score" />
        </div>
        <RouteProgress :total="store.questions.length" :current="store.index" :marks="stops" />
      </div>
      <div v-if="config.timer" role="timer" :aria-label="es.trivia.timerLabel(secondsLeft)">
        <TimerRing :remaining-ms="remainingMs" :total-ms="TIME_LIMIT_MS" />
      </div>
    </div>

    <!-- Ficha de la pregunta -->
    <section :key="question.id" class="relative mt-3 animate-rise">
      <span
        class="label-mono absolute -top-3.5 left-4 z-10 rounded-t-lg border-2 border-b-0 border-ink px-3 pt-1 pb-1.5"
        :class="CATEGORY_CLASS[question.type]"
        >{{ es.trivia.categories[question.type] }}</span
      >
      <div class="card relative px-5 pt-6 pb-5 sm:px-7">
        <p class="label-mono text-ink-soft">
          <span aria-hidden="true">{{
            es.trivia.counter(store.index + 1, store.questions.length)
          }}</span>
          <span class="sr-only">{{
            es.trivia.questionOf(store.index + 1, store.questions.length)
          }}</span>
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
    <section v-if="answer" class="card flex animate-rise flex-col gap-4 p-4 sm:p-5">
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
      <button ref="nextButton" type="button" class="btn-primary w-full text-lg" @click="goNext">
        {{ store.isLast ? es.trivia.finish : es.trivia.next }}
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
  box-shadow: 3px 3px 0 0 var(--color-ink);
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
  box-shadow: 5px 5px 0 0 var(--color-ink);
}
.option.is-idle:hover .key {
  background: var(--color-pink);
}
.option.is-idle:active {
  transform: translate(3px, 3px);
  box-shadow: 0 0 0 0 var(--color-ink);
}
.option.is-correct {
  background: var(--color-jade-light);
  color: var(--color-jade-ink);
}
.option.is-correct .key {
  background: var(--color-jade);
  color: white;
}
.option.is-wrong {
  background: var(--color-tomato-light);
  color: var(--color-tomato-ink);
}
.option.is-wrong .key {
  background: var(--color-tomato);
  color: white;
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
  mix-blend-mode: multiply;
}
</style>
