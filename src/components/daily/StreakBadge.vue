<script setup lang="ts">
/** Racha del Reto diario: días seguidos y mejor racha. */
import { es } from '@/i18n/es'
import type { Streak } from '@/lib/streak'

defineProps<{ streak: Streak }>()
</script>

<template>
  <div
    class="flex items-center gap-4 rounded-2xl border-2 border-ink bg-sun-light px-4 py-3 shadow-ink-sm"
  >
    <svg viewBox="0 0 32 40" class="h-11 w-9 shrink-0" aria-hidden="true">
      <path
        d="M16 2c2 7 10 11 10 22a10 10 0 0 1-20 0c0-6 3-9 5-12 0 4 2 6 4 6-1-6 0-11 1-16z"
        :fill="streak.current > 0 ? 'var(--color-tomato)' : 'none'"
        stroke="var(--color-ink)"
        stroke-width="2.2"
        stroke-linejoin="round"
        :stroke-dasharray="streak.current > 0 ? undefined : '3 3'"
      />
      <path
        v-if="streak.current > 0"
        d="M16 20c1 3 5 5 5 10a5 5 0 0 1-10 0c0-3 2-5 3-6 0 2 1 3 2 3 0-2 0-5 0-7z"
        fill="var(--color-sun)"
        stroke="var(--color-carbon)"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
    </svg>
    <div class="min-w-0">
      <p class="label-mono text-sun-ink">{{ es.daily.streakLabel }}</p>
      <p v-if="streak.current > 0" class="font-display text-2xl leading-tight font-extrabold">
        {{ es.daily.streakDays(streak.current) }}
      </p>
      <p v-else class="font-semibold">{{ es.daily.streakStart }}</p>
      <p v-if="streak.best > 0" class="text-sm text-ink-soft">
        {{ es.daily.bestStreak(streak.best) }}
      </p>
    </div>
  </div>
</template>
