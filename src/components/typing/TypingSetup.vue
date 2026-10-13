<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import ChoiceGroup from '@/components/ChoiceGroup.vue'
import SetupLayout from '@/components/SetupLayout.vue'
import { es } from '@/i18n/es'
import { playableIn } from '@/lib/countries'
import { REGIONS } from '@/lib/regions'
import type { RegionId } from '@/lib/types'
import { TYPING_MINUTES, type TypingMinutes } from '@/lib/typing'
import { typingQuery } from '@/lib/urlConfig'

type MinutesChoice = `${TypingMinutes}`

const router = useRouter()
const region = ref<RegionId>('mundo')
const minutes = ref<MinutesChoice>('10')

const regionOptions = REGIONS.map((r) => ({
  value: r,
  label: es.regions[r],
  hint: es.setup.countryCount(playableIn(r).length),
}))
const minuteOptions = TYPING_MINUTES.map((m) => ({
  value: String(m) as MinutesChoice,
  label: es.typing.minutes(m),
  hint: es.typing.minutesHints[m],
}))

const summary = computed(() => [
  es.regions[region.value],
  `${es.typing.minutes(Number(minutes.value))} · ${es.setup.countryCount(playableIn(region.value).length)}`,
])

function start() {
  const query = typingQuery({
    region: region.value,
    minutes: Number(minutes.value) as TypingMinutes,
  })
  void router.push({ query })
}
</script>

<template>
  <SetupLayout
    :mode="4"
    :title="es.typing.title"
    :intro="es.typing.intro"
    :summary="summary"
    @start="start"
  >
    <ChoiceGroup v-model="region" :step="1" :legend="es.setup.region" :options="regionOptions" />
    <ChoiceGroup
      v-model="minutes"
      :step="2"
      :legend="es.typing.minutesLegend"
      :options="minuteOptions"
    />
  </SetupLayout>
</template>
