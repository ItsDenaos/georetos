<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import ChoiceGroup from '@/components/ChoiceGroup.vue'
import SetupLayout from '@/components/SetupLayout.vue'
import { es } from '@/i18n/es'
import { REGIONS } from '@/lib/regions'
import { newSeed } from '@/lib/rng'
import { SILHOUETTE_COUNTS, silhouettePool, type SilhouetteCount } from '@/lib/silhouette'
import type { RegionId } from '@/lib/types'
import { silhouetteQuery } from '@/lib/urlConfig'
import { useDailySilhouetteStore } from '@/stores/dailySilhouette'

type CountChoice = `${SilhouetteCount}`

const router = useRouter()
const daily = useDailySilhouetteStore()
const region = ref<RegionId>('mundo')
const count = ref<CountChoice>('5')

const regionOptions = REGIONS.map((r) => ({
  value: r,
  label: es.regions[r],
  hint: es.setup.silhouetteN(silhouettePool(r).length),
}))
const available = computed(() => silhouettePool(region.value).length)
const countOptions = computed(() =>
  SILHOUETTE_COUNTS.filter((n) => n <= available.value).map((n) => ({
    value: String(n) as CountChoice,
    label: String(n),
  })),
)

watch(countOptions, (options) => {
  if (!options.some((o) => o.value === count.value)) count.value = options[0]?.value ?? '5'
})

const summary = computed(() => [
  es.regions[region.value],
  es.setup.silhouetteN(Number(count.value)),
])

function start() {
  void router.push({
    query: silhouetteQuery({
      region: region.value,
      count: Number(count.value) as SilhouetteCount,
      seed: newSeed(),
    }),
  })
}
</script>

<template>
  <SetupLayout
    :mode="3"
    :title="es.silhouette.title"
    :intro="es.setup.silhouetteIntro"
    :summary="summary"
    @start="start"
  >
    <RouterLink
      to="/silueta/diario"
      class="group flex items-center gap-4 rounded-2xl border-2 border-ink bg-pink-light px-4 py-3 shadow-ink-sm transition hover:-translate-y-px hover:shadow-ink"
    >
      <span
        class="grid size-12 shrink-0 -rotate-6 place-items-center rounded-full border-2 border-ink bg-pink font-display text-xl font-extrabold"
        aria-hidden="true"
        >{{ daily.challenge.number }}</span
      >
      <span class="min-w-0 flex-1">
        <span class="label-mono block text-pink-ink">{{
          es.home.dailyKicker(daily.challenge.number)
        }}</span>
        <span class="block font-bold">
          {{
            daily.state.done
              ? es.home.dailyDone(daily.guesses.length, daily.state.solved)
              : es.home.dailyPending
          }}
        </span>
      </span>
      <svg
        viewBox="0 0 20 20"
        class="size-5 shrink-0 transition-transform group-hover:translate-x-1"
        aria-hidden="true"
      >
        <path
          d="M4 10h11M11 5l5 5-5 5"
          fill="none"
          stroke="currentColor"
          stroke-width="2.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </RouterLink>
    <ChoiceGroup v-model="region" :step="1" :legend="es.setup.region" :options="regionOptions" />
    <ChoiceGroup
      v-model="count"
      :step="2"
      :legend="es.setup.silhouetteCount"
      :options="countOptions"
    />
  </SetupLayout>
</template>
