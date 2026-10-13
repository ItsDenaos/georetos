<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import RouteProgress from '@/components/brand/RouteProgress.vue'
import DailyIntro from '@/components/daily/DailyIntro.vue'
import DailyResult from '@/components/daily/DailyResult.vue'
import MapQuestion from '@/components/questions/MapQuestion.vue'
import TriviaQuestion from '@/components/questions/TriviaQuestion.vue'
import ScoreTicket from '@/components/ScoreTicket.vue'
import { es } from '@/i18n/es'
import { PLAYABLE } from '@/lib/countries'
import { msUntilNextDay } from '@/lib/daily'
import { DAILY_LENGTH } from '@/lib/dailyChallenge'
import { dailyShareText } from '@/lib/dailyShare'
import type { MapColor } from '@/lib/map'
import { useDailyChallengeStore } from '@/stores/dailyChallenge'

const store = useDailyChallengeStore()

const ALL_PLAYABLE = PLAYABLE.map((c) => c.code)
const remaining = ref(msUntilNextDay())
let ticker: ReturnType<typeof setInterval> | undefined

const dateLabel = computed(() => es.format.date(`${store.challenge.key}T12:00:00`))
const stops = computed(() => store.items.map((_, i) => store.marks[i] ?? null))
const kinds = computed(() => store.items.map((item) => item.kind))

/** Países de las preguntas de mapa ya respondidas, pintados con su resultado. */
const answeredOnMap = computed(() => {
  const result: Record<string, MapColor> = {}
  store.items.forEach((item, i) => {
    const answer = store.answers[i]
    if (item.kind === 'map' && answer && i !== store.cursor) result[item.code] = answer.mark
  })
  return result
})

const triviaAnswer = computed(() => {
  const a = store.currentAnswer
  return a ? { chosen: a.chosen ?? null, correct: a.mark === 'ok' } : undefined
})

function onMapResolved(attempt: number | null) {
  const item = store.current
  if (item?.kind === 'map') store.recordMap(item.code, attempt)
}

function onTriviaChoose(index: number) {
  const item = store.current
  if (item?.kind === 'trivia') {
    store.recordTrivia(item.question.subject, index, index === item.question.answer)
  }
}

const shareText = computed(() =>
  dailyShareText({
    number: store.challenge.number,
    score: store.score,
    max: store.maxScore,
    marks: store.marks,
    streak: store.streak.current,
    url: `${window.location.origin}/diario`,
  }),
)

onMounted(() => {
  store.refresh()
  ticker = setInterval(() => {
    remaining.value = msUntilNextDay()
    // Pasó la medianoche: si no hay una partida a medias, llega el reto nuevo.
    if (remaining.value > 86_000_000 && (!store.started || store.showingResult)) store.refresh()
  }, 1000)
})

onBeforeUnmount(() => clearInterval(ticker))
</script>

<template>
  <DailyIntro
    v-if="!store.started"
    :number="store.challenge.number"
    :date-label="dateLabel"
    :streak="store.streak"
    @start="store.start()"
  />

  <DailyResult
    v-else-if="store.showingResult"
    :number="store.challenge.number"
    :date-label="dateLabel"
    :score="store.score"
    :max="store.maxScore"
    :marks="store.marks"
    :kinds="kinds"
    :streak="store.streak"
    :share-text="shareText"
    :next-in="es.daily.nextIn(es.format.clock(remaining))"
  />

  <div
    v-else-if="store.current"
    :class="
      store.current.kind === 'map'
        ? 'flex h-[calc(100dvh-3.75rem)] flex-col'
        : 'mx-auto flex w-full max-w-3xl flex-col gap-5 pb-8'
    "
  >
    <!-- Reto, dificultad, puntos y ruta -->
    <div class="flex flex-col gap-1.5 px-4 pt-3 pb-1">
      <div class="flex items-center justify-between gap-3">
        <span class="label-mono truncate text-ink-soft">
          {{ es.daily.title }} {{ es.daily.number(store.challenge.number) }} ·
          {{ es.difficulties[store.current.difficulty] }}
        </span>
        <ScoreTicket :score="store.score" />
      </div>
      <RouteProgress :total="store.items.length" :current="store.cursor" :marks="stops" />
    </div>

    <MapQuestion
      v-if="store.current.kind === 'map'"
      :key="`map-${store.cursor}`"
      :target="store.current.code"
      region="mundo"
      :active="ALL_PLAYABLE"
      :answered="answeredOnMap"
      :position="store.cursor + 1"
      :total="DAILY_LENGTH"
      :initial-attempts="store.today?.attempts ?? 0"
      @attempt="store.recordAttempt($event)"
      @resolved="onMapResolved($event.attempt)"
      @advance="store.advance()"
    />

    <div v-else class="px-4">
      <TriviaQuestion
        :key="`trivia-${store.cursor}`"
        :question="store.current.question"
        :answer="triviaAnswer"
        :position="store.cursor + 1"
        :total="DAILY_LENGTH"
        :is-last="store.cursor === DAILY_LENGTH - 1"
        @choose="onTriviaChoose"
        @next="store.advance()"
      />
    </div>
  </div>
</template>
