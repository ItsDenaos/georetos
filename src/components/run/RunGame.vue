<script setup lang="ts">
/**
 * Partida sin cantidad fija (Contrarreloj o Supervivencia) para "Ubica el país"
 * y la Trivia. Reutiliza MapQuestion y TriviaQuestion; las reglas viven en
 * lib/variants.ts y el estado en stores/run.ts.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import InkStamp from '@/components/brand/InkStamp.vue'
import TimerRing from '@/components/brand/TimerRing.vue'
import MapQuestion from '@/components/questions/MapQuestion.vue'
import TriviaQuestion from '@/components/questions/TriviaQuestion.vue'
import { useAnnouncer } from '@/composables/useAnnouncer'
import { es } from '@/i18n/es'
import { playableIn } from '@/lib/countries'
import type { MapColor } from '@/lib/map'
import { SURVIVAL_LIVES, TIME_ATTACK_MS, difficultyOfLevel, type RunConfig } from '@/lib/variants'
import { finishGame } from '@/stores/stats'
import { useResultStore } from '@/stores/result'
import { useRunStore } from '@/stores/run'

const props = defineProps<{ config: RunConfig }>()

/** Pausa tras responder en la Trivia contrarreloj, antes de la siguiente. */
const BRIEF_PAUSE = 700
/** Tiempo que se ve el sello final antes de ir a los resultados. */
const END_PAUSE = 1400

const store = useRunStore()
const router = useRouter()
const { announce } = useAnnouncer()

store.start(props.config)

const timeAttack = props.config.variant === 'contrarreloj'
const active = playableIn(props.config.region).map((c) => c.code)
const penaltyKey = ref(0)
let ticker: ReturnType<typeof setInterval> | undefined
let pauseTimer: ReturnType<typeof setTimeout> | undefined

const seconds = computed(() => Math.ceil((store.timeLeft ?? 0) / 1000))
const levelName = computed(() => es.difficulties[difficultyOfLevel(store.level)])

/** Variante y, si los hay, región y dificultad elegidas. */
const tagline = [
  es.variants.labels[props.config.variant],
  ...(props.config.region !== 'mundo' ? [es.regions[props.config.region]] : []),
  ...(timeAttack && props.config.mode === 'trivia'
    ? [es.difficulties[props.config.difficulty]]
    : []),
].join(' · ')

/** Países de mapa ya respondidos, pintados con su resultado. */
const answered = computed(() =>
  Object.fromEntries(store.answers.map((a) => [a.code, a.mark as MapColor])),
)

watch(
  () => store.run.penaltyMs,
  (now, before) => {
    if (now > before) penaltyKey.value += 1
  },
)

watch(
  () => store.level,
  (now, before) => {
    if (now > before) announce(es.variants.levelUp(levelName.value))
  },
)

watch(
  () => store.run.lives,
  (now, before) => {
    if (now < before && now > 0) announce(es.variants.lifeLost(now))
  },
)

// En Contrarreloj la Trivia avanza sola tras un instante.
watch(
  () => store.currentAnswer,
  (answer) => {
    if (!answer || !timeAttack) return
    clearTimeout(pauseTimer)
    pauseTimer = setTimeout(() => store.advance(), BRIEF_PAUSE)
  },
)

watch(
  () => store.finished,
  (finished) => {
    if (!finished) return
    clearInterval(ticker)
    if (store.endReason) announce(es.variants.ends[store.endReason])
    const partial = store.buildResult()
    if (!partial) return
    const result = finishGame(partial)
    setTimeout(() => {
      useResultStore().set(result)
      void router.push({ name: 'results' })
    }, END_PAUSE)
  },
)

onMounted(() => {
  if (timeAttack) ticker = setInterval(() => store.tick(), 100)
})

onBeforeUnmount(() => {
  clearInterval(ticker)
  clearTimeout(pauseTimer)
})
</script>

<template>
  <div
    :class="
      store.item?.kind === 'map'
        ? 'flex h-[calc(100dvh-3.75rem)] flex-col'
        : 'mx-auto flex w-full max-w-3xl flex-col gap-5 pb-8'
    "
  >
    <!-- Aciertos y reloj o vidas -->
    <div class="flex items-center gap-3 px-4 pt-3 pb-1">
      <div class="min-w-0 flex-1">
        <p class="label-mono truncate text-ink-soft">{{ tagline }}</p>
        <p class="font-display text-2xl leading-tight font-extrabold" aria-live="polite">
          {{ es.variants.correctCount(store.run.correct) }}
        </p>
      </div>

      <div
        v-if="timeAttack"
        class="relative"
        role="timer"
        :aria-label="es.variants.clockLabel(seconds)"
      >
        <TimerRing :remaining-ms="store.timeLeft ?? 0" :total-ms="TIME_ATTACK_MS" />
        <span
          v-if="penaltyKey"
          :key="penaltyKey"
          class="penalty pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 font-mono text-sm font-semibold whitespace-nowrap text-tomato-ink"
          aria-hidden="true"
          >{{ es.variants.penalty }}</span
        >
      </div>

      <div v-else class="flex flex-col items-end gap-1">
        <span class="flex gap-1" aria-hidden="true">
          <svg
            v-for="i in SURVIVAL_LIVES"
            :key="i"
            viewBox="0 0 24 22"
            class="h-5 w-6 transition-transform"
            :class="i > store.run.lives && 'scale-90 opacity-40'"
          >
            <path
              d="M12 20.5S2 14.3 2 7.6A5.1 5.1 0 0 1 12 5.4a5.1 5.1 0 0 1 10 2.2c0 6.7-10 12.9-10 12.9z"
              :fill="i <= store.run.lives ? 'var(--color-tomato)' : 'none'"
              stroke="var(--color-ink)"
              stroke-width="2"
              stroke-linejoin="round"
              :stroke-dasharray="i <= store.run.lives ? undefined : '3 2.5'"
            />
          </svg>
        </span>
        <span class="sr-only">{{ es.variants.livesLabel(store.run.lives) }}</span>
        <span
          class="label-mono rounded-full border-2 border-ink bg-sun-light px-2 py-0.5 text-sun-ink"
          >{{ es.variants.level(levelName) }}</span
        >
      </div>
    </div>

    <MapQuestion
      v-if="store.item?.kind === 'map'"
      :key="`run-${store.position}`"
      :target="store.item.code"
      :region="config.region"
      :active="active"
      :answered="answered"
      :position="store.position"
      :pace="timeAttack ? 'fast' : 'normal'"
      @attempt="store.mapAttempt()"
      @resolved="store.resolveMap($event.attempt)"
      @advance="store.advance()"
    />

    <div v-else-if="store.item?.kind === 'trivia'" class="px-4">
      <TriviaQuestion
        :key="`run-${store.position}`"
        :question="store.item.question"
        :answer="store.currentAnswer"
        :position="store.position"
        :is-last="store.run.over"
        :brief="timeAttack"
        @choose="store.answerTrivia"
        @next="store.advance()"
      />
    </div>

    <!-- Final: un sello sobre la partida antes de ir a los resultados -->
    <div
      v-if="store.finished && store.endReason"
      class="fixed inset-0 z-40 grid place-items-center bg-paper/70 backdrop-blur-[2px]"
      aria-hidden="true"
    >
      <InkStamp :tone="store.endReason === 'exhausted' ? 'ok' : 'fail'" size="lg" :rotate="-6">
        {{ es.variants.ends[store.endReason] }}
      </InkStamp>
    </div>
  </div>
</template>

<style scoped>
.penalty {
  animation: penalty 900ms ease-out forwards;
}

@keyframes penalty {
  0% {
    transform: translate(-50%, -4px);
    opacity: 0;
  }
  25% {
    opacity: 1;
  }
  100% {
    transform: translate(-50%, 14px);
    opacity: 0;
  }
}
</style>
