<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import ChoiceGroup from '@/components/ChoiceGroup.vue'
import SetupLayout from '@/components/SetupLayout.vue'
import { es } from '@/i18n/es'
import { playableIn } from '@/lib/countries'
import { REGIONS } from '@/lib/regions'
import { newSeed } from '@/lib/rng'
import type { Difficulty, RegionId } from '@/lib/types'
import { triviaQuery } from '@/lib/urlConfig'

const router = useRouter()
const difficulty = ref<Difficulty>('facil')
const region = ref<RegionId>('mundo')
const timer = ref(false)

const difficultyOptions = (['facil', 'media', 'dificil'] as const).map((d) => ({
  value: d,
  label: es.difficulties[d],
  hint: es.difficultyHints[d],
}))
const regionOptions = REGIONS.map((r) => ({
  value: r,
  label: es.regions[r],
  hint: es.setup.countryCount(playableIn(r).length),
}))

const summary = computed(() => [
  `${es.difficulties[difficulty.value]} · ${es.regions[region.value]}`,
  ...(timer.value ? [`${es.setup.timer} · ${es.setup.timerHint}`] : []),
])

function start() {
  void router.push({
    query: triviaQuery({
      difficulty: difficulty.value,
      region: region.value,
      timer: timer.value,
      seed: newSeed(),
    }),
  })
}
</script>

<template>
  <SetupLayout
    :mode="2"
    :title="es.trivia.title"
    :intro="es.setup.triviaIntro"
    :summary="summary"
    @start="start"
  >
    <ChoiceGroup
      v-model="difficulty"
      :step="1"
      :legend="es.setup.difficulty"
      :options="difficultyOptions"
    />
    <ChoiceGroup
      v-model="region"
      :step="2"
      :legend="es.setup.regionOptional"
      :options="regionOptions"
    />
    <fieldset>
      <legend class="mb-3 flex items-center gap-2">
        <span
          class="grid size-7 place-items-center rounded-full border-2 border-ink bg-sun font-mono text-xs font-semibold"
          aria-hidden="true"
          >03</span
        >
        <span class="label-mono">{{ es.setup.timer }}</span>
      </legend>
      <label
        class="switch flex min-h-14 max-w-md cursor-pointer items-center gap-4 rounded-xl border-2 border-ink bg-paper-light px-4 py-2 shadow-ink-sm"
      >
        <input v-model="timer" type="checkbox" class="peer sr-only" role="switch" />
        <span
          class="relative h-7 w-12 shrink-0 rounded-full border-2 border-ink bg-paper-deep transition-colors peer-checked:bg-tomato"
          aria-hidden="true"
        >
          <span
            class="absolute top-0.5 left-0.5 size-5 rounded-full border-2 border-ink bg-paper-light transition-transform"
            :class="timer && 'translate-x-5'"
          />
        </span>
        <span class="flex flex-col">
          <span class="font-bold">{{ es.setup.timer }}</span>
          <span class="font-mono text-[0.7rem] text-ink-soft">{{ es.setup.timerHint }}</span>
        </span>
      </label>
    </fieldset>
  </SetupLayout>
</template>

<style scoped>
.switch:has(:focus-visible) {
  outline: 3px solid var(--color-pink);
  outline-offset: 3px;
}
</style>
