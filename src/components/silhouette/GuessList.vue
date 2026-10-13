<script setup lang="ts">
/**
 * Intentos de una silueta: cada uno con su distancia (de frío a caliente, con el
 * número siempre visible) y una brújula que apunta hacia el país correcto.
 */
import { computed } from 'vue'

import FlagImage from '@/components/FlagImage.vue'
import StatusIcon from '@/components/StatusIcon.vue'
import { es } from '@/i18n/es'
import { getCountry } from '@/lib/countries'
import { closeness, compassPoint, type Closeness } from '@/lib/geo'
import { SILHOUETTE_ATTEMPTS, type Guess } from '@/lib/silhouette'

const props = defineProps<{ guesses: readonly Guess[]; done: boolean }>()

const CHIP: Record<Closeness, string> = {
  hot: 'bg-tomato text-carbon',
  warm: 'bg-sun text-carbon',
  cool: 'bg-cobalt-light text-ink',
  cold: 'bg-paper-deep text-ink-soft',
}

const rows = computed(() =>
  props.guesses.map((g) => {
    const name = getCountry(g.code)?.name ?? g.code
    const direction = es.silhouette.directions[compassPoint(g.bearing)]
    return {
      ...g,
      name,
      chip: CHIP[closeness(g.distanceKm)],
      label: g.correct
        ? es.silhouette.guessCorrect(name)
        : es.silhouette.guessLabel(name, g.distanceKm, direction),
    }
  }),
)

const empty = computed(() => (props.done ? 0 : SILHOUETTE_ATTEMPTS - props.guesses.length))
</script>

<template>
  <ol class="flex flex-col gap-2">
    <li
      v-for="(row, i) in rows"
      :key="row.code"
      class="flex min-h-12 animate-rise items-center gap-3 rounded-xl border-2 border-ink py-1.5 pr-1.5 pl-3"
      :class="row.correct ? 'bg-jade-light shadow-ink-sm' : 'bg-paper-light'"
    >
      <span class="sr-only">{{ row.label }}</span>
      <span class="w-5 shrink-0 font-mono text-xs font-semibold text-ink-soft" aria-hidden="true">{{
        i + 1
      }}</span>
      <FlagImage
        :code="row.code"
        alt=""
        class="h-6 shrink-0 rounded-[3px] border-[1.5px] border-ink"
      />
      <span class="min-w-0 flex-1 truncate font-bold" aria-hidden="true">{{ row.name }}</span>
      <template v-if="row.correct">
        <StatusIcon kind="ok" class="size-7" />
      </template>
      <template v-else>
        <span
          class="shrink-0 rounded-lg border-2 border-ink px-2 py-0.5 font-mono text-sm font-semibold tabular-nums"
          :class="row.chip"
          aria-hidden="true"
          >{{ es.silhouette.distance(row.distanceKm) }}</span
        >
        <span
          class="grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink bg-paper"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" class="size-6" :style="{ rotate: `${row.bearing}deg` }">
            <path
              d="M12 3l5.5 9H14v9h-4v-9H6.5z"
              fill="var(--color-cobalt)"
              stroke="var(--color-ink)"
              stroke-width="1.6"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      </template>
    </li>
    <li
      v-for="n in empty"
      :key="`vacio-${n}`"
      class="flex min-h-12 items-center rounded-xl border-2 border-dashed border-ink/30 px-3"
      aria-hidden="true"
    >
      <span class="label-mono text-ink-soft/70">{{
        es.silhouette.attempt(guesses.length + n)
      }}</span>
    </li>
  </ol>
</template>
