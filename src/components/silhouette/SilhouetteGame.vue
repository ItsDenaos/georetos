<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import RouteProgress from '@/components/brand/RouteProgress.vue'
import type { StopMark } from '@/components/brand/types'
import ScoreTicket from '@/components/ScoreTicket.vue'
import { useAnnouncer } from '@/composables/useAnnouncer'
import { es } from '@/i18n/es'
import { getCountry } from '@/lib/countries'
import { compassPoint } from '@/lib/geo'
import { roundState, type SilhouetteConfig } from '@/lib/silhouette'
import { useProgressStore } from '@/stores/progress'
import { useResultStore } from '@/stores/result'
import { useSilhouetteStore } from '@/stores/silhouette'
import SilhouetteRound from './SilhouetteRound.vue'

const props = defineProps<{ config: SilhouetteConfig }>()

const store = useSilhouetteStore()
const router = useRouter()
const { announce } = useAnnouncer()
const round = ref<InstanceType<typeof SilhouetteRound> | null>(null)

store.start(props.config)

/** Parada de la ruta: verde al primer intento, amarilla después, roja si no salió. */
const stops = computed<StopMark[]>(() =>
  store.queue.map((code) => {
    const list = store.guesses[code] ?? []
    const st = roundState(list)
    if (!st.done) return null
    if (!st.solved) return 'fail'
    return list.length === 1 ? 'ok' : 'meh'
  }),
)

function onGuess(code: string) {
  const result = store.guess(code)
  if (!result) return
  const name = getCountry(code)?.name ?? code
  const targetName = getCountry(store.target ?? '')?.name ?? ''
  if (result.correct) {
    announce(es.silhouette.announceCorrect(name, store.currentGuesses.length))
    return
  }
  const direction = es.silhouette.directions[compassPoint(result.bearing)]
  const wrong = es.silhouette.announceWrong(
    name,
    result.distanceKm,
    direction,
    store.state.attemptsLeft,
  )
  announce(store.state.done ? `${wrong} ${es.silhouette.announceFailed(targetName)}` : wrong)
}

function goNext() {
  store.next()
  if (store.finished) return
  window.scrollTo({ top: 0 })
  void nextTick(() => round.value?.focus())
}

watch(
  () => store.finished,
  (finished) => {
    if (!finished) return
    const partial = store.buildResult()
    if (!partial) return
    useResultStore().set(useProgressStore().register(partial))
    void router.push({ name: 'results' })
  },
  { immediate: true },
)
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pt-3 pb-10">
    <div class="flex flex-col gap-1.5">
      <div class="flex items-center justify-between gap-3">
        <span class="label-mono truncate text-ink-soft">
          {{ es.locate.route(config.seed) }} · {{ es.regions[config.region] }}
        </span>
        <ScoreTicket :score="store.score" />
      </div>
      <RouteProgress :total="store.queue.length" :current="store.index" :marks="stops" />
    </div>

    <SilhouetteRound
      v-if="store.target"
      :key="store.target"
      ref="round"
      :target="store.target"
      :guesses="store.currentGuesses"
      :kicker="es.silhouette.specimen(store.index + 1, store.queue.length)"
      :points="store.state.done ? store.pointsFor(store.target) : undefined"
      @guess="onGuess"
    >
      <template #actions>
        <button type="button" class="btn-primary w-full text-lg" @click="goNext">
          {{ store.isLast ? es.silhouette.finish : es.silhouette.next }}
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
      </template>
    </SilhouetteRound>
  </div>
</template>
