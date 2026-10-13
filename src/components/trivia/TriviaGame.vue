<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import RouteProgress from '@/components/brand/RouteProgress.vue'
import TimerRing from '@/components/brand/TimerRing.vue'
import type { StopMark } from '@/components/brand/types'
import TriviaQuestion from '@/components/questions/TriviaQuestion.vue'
import ScoreTicket from '@/components/ScoreTicket.vue'
import { es } from '@/i18n/es'
import type { TriviaUrlConfig } from '@/lib/urlConfig'
import { finishGame } from '@/stores/stats'
import { useResultStore } from '@/stores/result'
import { useTriviaStore } from '@/stores/trivia'

const props = defineProps<{ config: TriviaUrlConfig }>()

const TIME_LIMIT_MS = 15_000

const store = useTriviaStore()
const router = useRouter()

store.start(props.config)

const remainingMs = ref(TIME_LIMIT_MS)
let deadline = 0
let ticker: ReturnType<typeof setInterval> | undefined

const secondsLeft = computed(() => Math.ceil(remainingMs.value / 1000))

const stops = computed<StopMark[]>(() =>
  store.questions.map((q) => {
    const a = store.answers.find((x) => x.questionId === q.id)
    return a ? (a.correct ? 'ok' : 'fail') : null
  }),
)

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
  if (store.answer(index) !== null) stopTimer()
}

watch(() => store.index, startTimer)

watch(
  () => store.finished,
  (finished) => {
    if (!finished || store.questions.length === 0) return
    const partial = store.buildResult()
    if (!partial) return
    useResultStore().set(finishGame(partial))
    void router.push({ name: 'results' })
  },
)

onMounted(startTimer)
onBeforeUnmount(stopTimer)
</script>

<template>
  <div v-if="store.questions.length === 0" class="flex flex-col gap-4 px-4 py-8">
    <p class="card p-5 font-semibold">{{ es.trivia.notEnough }}</p>
    <RouterLink to="/trivia" class="btn-primary w-fit">{{ es.setup.back }}</RouterLink>
  </div>

  <div
    v-else-if="store.current"
    class="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pt-3 pb-8"
  >
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

    <TriviaQuestion
      :key="store.current.id"
      :question="store.current"
      :answer="store.currentAnswer"
      :position="store.index + 1"
      :total="store.questions.length"
      :is-last="store.isLast"
      @choose="choose"
      @next="store.next()"
    />
  </div>
</template>
