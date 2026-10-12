<script setup lang="ts">
/**
 * Una silueta completa: lámina, intentos, campo para escribir y, al terminar,
 * el país en el mapa con tus intentos marcados. La usan la práctica y el diario.
 */
import { computed, nextTick, ref, watch } from 'vue'

import AtlasPlate from '@/components/brand/AtlasPlate.vue'
import InkStamp from '@/components/brand/InkStamp.vue'
import FlagImage from '@/components/FlagImage.vue'
import WorldMap from '@/components/WorldMap.vue'
import { es } from '@/i18n/es'
import { getCountry } from '@/lib/countries'
import type { MapColor } from '@/lib/map'
import { roundState, SILHOUETTE_ATTEMPTS, type Guess } from '@/lib/silhouette'
import CountryCombobox from './CountryCombobox.vue'
import GuessList from './GuessList.vue'
import SilhouettePlate from './SilhouettePlate.vue'

const props = defineProps<{
  target: string
  guesses: readonly Guess[]
  kicker: string
  /** Puntos ganados (solo en práctica). */
  points?: number
}>()
const emit = defineEmits<{ guess: [code: string] }>()

const combobox = ref<InstanceType<typeof CountryCombobox> | null>(null)
const reveal = ref<HTMLElement | null>(null)

const state = computed(() => roundState(props.guesses))
const country = computed(() => getCountry(props.target))
const status = computed(() =>
  !state.value.done ? 'playing' : state.value.solved ? 'solved' : 'failed',
)

const highlights = computed(() => {
  const result: Record<string, MapColor> = {}
  for (const g of props.guesses) if (!g.correct) result[g.code] = 'fail'
  result[props.target] = 'focus'
  return result
})

// Al terminar, se muestra el país en el mapa (y se lleva el foco ahí).
watch(
  () => state.value.done,
  (done) => {
    if (done) void nextTick(() => reveal.value?.focus())
  },
)

defineExpose({ focus: () => combobox.value?.focus() })
</script>

<template>
  <div class="flex flex-col gap-5">
    <div class="relative">
      <SilhouettePlate :code="target" :kicker="kicker" :status="status" />
      <div
        v-if="state.done"
        class="pointer-events-none absolute -top-3 right-2 z-10 sm:right-[calc(50%-11rem)]"
      >
        <InkStamp :tone="state.solved ? 'ok' : 'fail'" size="lg" :rotate="8" aria-hidden="true">
          {{ state.solved ? es.trivia.stampCorrect : es.trivia.stampWrong }}
        </InkStamp>
      </div>
    </div>

    <div class="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div class="flex items-center justify-between">
        <span class="label-mono">
          {{
            !state.done
              ? es.silhouette.attemptsLeft(state.attemptsLeft)
              : state.solved
                ? es.silhouette.solvedIn(guesses.length)
                : es.silhouette.failed
          }}
        </span>
        <span class="flex gap-1" aria-hidden="true">
          <span
            v-for="i in SILHOUETTE_ATTEMPTS"
            :key="i"
            class="size-3 rounded-full border-2 border-ink"
            :class="
              i <= guesses.length
                ? guesses[i - 1]?.correct
                  ? 'bg-jade'
                  : 'bg-tomato'
                : 'bg-paper-light'
            "
          />
        </span>
      </div>
      <CountryCombobox
        v-if="!state.done"
        ref="combobox"
        :exclude="guesses.map((g) => g.code)"
        @select="emit('guess', $event)"
      />
      <GuessList :guesses="guesses" :done="state.done" />
    </div>

    <!-- Revelación: el país en el mapa -->
    <section
      v-if="state.done && country"
      ref="reveal"
      tabindex="-1"
      class="card mx-auto flex w-full max-w-xl animate-rise flex-col gap-4 p-4 outline-none sm:p-5"
    >
      <div class="flex items-center gap-3">
        <FlagImage
          :code="country.code"
          alt=""
          class="h-10 shrink-0 -rotate-2 rounded-sm border-2 border-ink"
        />
        <div class="min-w-0 flex-1">
          <p class="label-mono" :class="state.solved ? 'text-jade-ink' : 'text-tomato-ink'">
            {{ state.solved ? es.silhouette.solved : es.silhouette.failed }}
          </p>
          <h2 class="truncate font-display text-3xl leading-tight font-extrabold">
            {{ country.name }}
          </h2>
        </div>
        <span
          v-if="points !== undefined"
          class="shrink-0 rounded-lg border-2 border-ink bg-sun px-2.5 py-1 font-mono text-sm font-semibold shadow-ink-sm"
          >{{ es.silhouette.points(points) }}</span
        >
      </div>
      <AtlasPlate
        class="h-56 sm:h-72"
        :caption="`${es.map.plate} · ${country.name}`"
        :compass="false"
        flat
      >
        <WorldMap :focus="target" :highlights="highlights" :interactive="false" />
      </AtlasPlate>
      <slot name="actions" />
    </section>
  </div>
</template>
