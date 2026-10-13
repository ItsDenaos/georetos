<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import SilhouetteRound from '@/components/silhouette/SilhouetteRound.vue'
import { useAnnouncer } from '@/composables/useAnnouncer'
import { es } from '@/i18n/es'
import { getCountry } from '@/lib/countries'
import { msUntilNextDay } from '@/lib/daily'
import { compassPoint } from '@/lib/geo'
import { useDailySilhouetteStore } from '@/stores/dailySilhouette'

const daily = useDailySilhouetteStore()
const { announce } = useAnnouncer()

const remaining = ref(msUntilNextDay())
let ticker: ReturnType<typeof setInterval> | undefined

const dateLabel = computed(() => es.format.date(`${daily.challenge.key}T12:00:00`))

function onGuess(code: string) {
  const result = daily.guess(code)
  if (!result) return
  const name = getCountry(code)?.name ?? code
  if (result.correct) {
    announce(es.silhouette.announceCorrect(name, daily.guesses.length))
    return
  }
  const direction = es.silhouette.directions[compassPoint(result.bearing)]
  const wrong = es.silhouette.announceWrong(
    name,
    result.distanceKm,
    direction,
    daily.state.attemptsLeft,
  )
  const target = getCountry(daily.code)?.name ?? ''
  announce(daily.state.done ? `${wrong} ${es.silhouette.announceFailed(target)}` : wrong)
}

onMounted(() => {
  daily.refresh()
  ticker = setInterval(() => {
    remaining.value = msUntilNextDay()
    // Pasó la medianoche con la página abierta: llega la silueta nueva.
    if (remaining.value > 86_000_000) daily.refresh()
  }, 1000)
})

onBeforeUnmount(() => clearInterval(ticker))
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-6 pb-10 sm:pt-10">
    <header class="relative animate-rise">
      <p class="label-mono text-pink-ink">{{ dateLabel }}</p>
      <h1 class="mt-1 font-display text-[2.5rem] leading-none font-extrabold sm:text-6xl">
        {{ es.silhouette.dailyTitle }}
        <span class="whitespace-nowrap text-cobalt-ink italic">{{
          es.silhouette.dailyNumber(daily.challenge.number)
        }}</span>
      </h1>
      <p class="mt-3 max-w-md text-lg text-ink-soft">
        {{
          daily.state.done
            ? daily.state.solved
              ? es.silhouette.dailySolved
              : es.silhouette.dailyFailed
            : es.silhouette.dailyIntro
        }}
      </p>
    </header>

    <SilhouetteRound
      :key="daily.code"
      :target="daily.code"
      :guesses="daily.guesses"
      :kicker="es.silhouette.dailyNumber(daily.challenge.number)"
      @guess="onGuess"
    >
      <template #actions>
        <p class="label-mono rounded-xl border-2 border-dashed border-ink/30 px-3 py-2 text-center">
          {{ es.silhouette.nextIn(es.format.clock(remaining)) }}
        </p>
        <RouterLink to="/silueta" class="btn-secondary w-full">{{
          es.silhouette.practice
        }}</RouterLink>
      </template>
    </SilhouetteRound>
  </div>
</template>
