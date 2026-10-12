<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import ChoiceGroup from '@/components/ChoiceGroup.vue'
import SetupLayout from '@/components/SetupLayout.vue'
import { es } from '@/i18n/es'
import { playableIn } from '@/lib/countries'
import type { LocateCount } from '@/lib/locate'
import { REGIONS } from '@/lib/regions'
import { newSeed } from '@/lib/rng'
import type { RegionId } from '@/lib/types'
import { locateQuery } from '@/lib/urlConfig'

type CountChoice = '10' | '20' | 'todos'

const router = useRouter()
const region = ref<RegionId>('mundo')
const count = ref<CountChoice>('10')

const regionOptions = REGIONS.map((r) => ({
  value: r,
  label: es.regions[r],
  hint: es.setup.countryCount(playableIn(r).length),
}))
const available = computed(() => playableIn(region.value).length)

// Solo las cantidades menores que los países disponibles, más "todos".
const countOptions = computed(() => [
  ...(['10', '20'] as const)
    .filter((n) => Number(n) < available.value)
    .map((n) => ({ value: n, label: n })),
  { value: 'todos' as const, label: es.setup.countAll(available.value) },
])

watch(countOptions, (options) => {
  if (!options.some((o) => o.value === count.value)) count.value = options[0]?.value ?? 'todos'
})

const summary = computed(() => [
  es.regions[region.value],
  count.value === 'todos'
    ? es.setup.countAll(available.value)
    : es.setup.countryCount(Number(count.value)),
])

function start() {
  const n: LocateCount = count.value === 'todos' ? 'todos' : (Number(count.value) as 10 | 20)
  void router.push({ query: locateQuery({ region: region.value, count: n, seed: newSeed() }) })
}
</script>

<template>
  <SetupLayout
    :mode="1"
    :title="es.locate.title"
    :intro="es.setup.locateIntro"
    :summary="summary"
    @start="start"
  >
    <ChoiceGroup v-model="region" :step="1" :legend="es.setup.region" :options="regionOptions" />
    <ChoiceGroup v-model="count" :step="2" :legend="es.setup.count" :options="countOptions" />
  </SetupLayout>
</template>
