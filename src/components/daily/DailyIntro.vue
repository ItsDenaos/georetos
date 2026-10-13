<script setup lang="ts">
/** Portada del Reto diario antes de empezar: reglas, racha y botón para jugar. */
import { RouterLink } from 'vue-router'

import { es } from '@/i18n/es'
import type { Streak } from '@/lib/streak'
import StreakBadge from './StreakBadge.vue'

defineProps<{ number: number; dateLabel: string; streak: Streak }>()
const emit = defineEmits<{ start: [] }>()
</script>

<template>
  <div class="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-6 pb-12 sm:pt-10">
    <header class="relative animate-rise">
      <p class="label-mono text-pink-ink">{{ dateLabel }}</p>
      <h1 class="mt-1 font-display text-[2.6rem] leading-none font-extrabold sm:text-6xl">
        {{ es.daily.title }}
        <span class="whitespace-nowrap text-cobalt-ink italic">{{ es.daily.number(number) }}</span>
      </h1>
      <p class="mt-3 max-w-md text-lg text-ink-soft">{{ es.daily.intro }}</p>
    </header>

    <ol
      class="card flex animate-rise flex-col divide-y-2 divide-dashed divide-ink/15 [animation-delay:80ms]"
    >
      <li v-for="(rule, i) in es.daily.rules" :key="i" class="flex items-center gap-3 px-4 py-3">
        <span
          class="grid size-7 shrink-0 place-items-center rounded-full border-2 border-ink bg-sun font-mono text-xs font-semibold text-carbon"
          aria-hidden="true"
          >{{ String(i + 1).padStart(2, '0') }}</span
        >
        <span class="font-semibold">{{ rule }}</span>
      </li>
    </ol>

    <StreakBadge :streak="streak" class="animate-rise [animation-delay:140ms]" />

    <button
      type="button"
      class="btn-primary w-full text-lg sm:w-auto sm:self-start"
      @click="emit('start')"
    >
      {{ es.daily.start }}
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

    <RouterLink to="/silueta/diario" class="btn-ghost self-start">
      {{ es.daily.alsoToday }}: {{ es.silhouette.dailyTitle }}
    </RouterLink>
  </div>
</template>
