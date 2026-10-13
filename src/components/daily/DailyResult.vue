<script setup lang="ts">
/** Resultado del Reto diario: puntaje, una casilla por pregunta, racha y Compartir. */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import InkStamp from '@/components/brand/InkStamp.vue'
import ShareButton from '@/components/ShareButton.vue'
import StatusIcon from '@/components/StatusIcon.vue'
import { es } from '@/i18n/es'
import type { DailyItem } from '@/lib/dailyChallenge'
import type { AnswerMark } from '@/lib/results'
import type { Streak } from '@/lib/streak'
import StreakBadge from './StreakBadge.vue'

const props = defineProps<{
  number: number
  dateLabel: string
  score: number
  max: number
  marks: readonly AnswerMark[]
  kinds: readonly DailyItem['kind'][]
  streak: Streak
  shareText: string
  /** Texto de la cuenta regresiva hasta el próximo reto. */
  nextIn: string
}>()

const perfect = computed(() => props.score === props.max)
</script>

<template>
  <div class="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-6 pb-12 sm:pt-10">
    <header class="animate-rise">
      <p class="label-mono text-pink-ink">{{ es.daily.resultKicker }} · {{ dateLabel }}</p>
      <h1 class="mt-1 font-display text-[2.6rem] leading-none font-extrabold sm:text-6xl">
        {{ es.results.headline(score / max) }}
      </h1>
    </header>

    <!-- Ficha del día -->
    <section class="card relative animate-rise overflow-visible p-5 [animation-delay:80ms] sm:p-6">
      <div class="flex items-end justify-between gap-4">
        <div>
          <p class="label-mono text-ink-soft">
            {{ es.daily.title }} · {{ es.daily.number(number) }}
          </p>
          <p class="font-display text-6xl leading-none font-extrabold">
            {{ score }}<span class="text-2xl text-ink-soft">/{{ max }}</span>
          </p>
        </div>
        <InkStamp v-if="perfect" tone="ok" :rotate="-8" aria-hidden="true">{{
          es.daily.perfect
        }}</InkStamp>
      </div>

      <!-- Una casilla por pregunta: forma + color + tipo -->
      <ol class="mt-5 grid grid-cols-10 gap-1 sm:gap-2">
        <li v-for="(mark, i) in marks" :key="i" class="flex flex-col items-center gap-1">
          <span class="sr-only">{{
            es.daily.markLabel(i + 1, es.daily.kinds[kinds[i] ?? 'map'], es.daily.marks[mark])
          }}</span>
          <StatusIcon :kind="mark" class="size-6 sm:size-8" />
          <svg v-if="kinds[i] === 'map'" viewBox="0 0 12 16" class="h-3 w-2.5" aria-hidden="true">
            <path
              d="M6 15C5 12 1 10 1 6a5 5 0 1 1 10 0c0 4-4 6-5 9z"
              fill="var(--color-ink-soft)"
            />
          </svg>
          <span
            v-else
            class="font-mono text-[0.65rem] leading-3 font-semibold text-ink-soft"
            aria-hidden="true"
            >?</span
          >
        </li>
      </ol>
    </section>

    <StreakBadge :streak="streak" class="animate-rise [animation-delay:140ms]" />

    <section class="flex animate-rise flex-col gap-3 [animation-delay:200ms]">
      <ShareButton :text="shareText" :title="`${es.daily.title} ${es.daily.number(number)}`" />
      <figure class="rounded-xl border-2 border-dashed border-ink/30 px-4 py-3">
        <figcaption class="label-mono text-ink-soft">{{ es.daily.sharePreview }}</figcaption>
        <pre class="mt-2 font-mono text-sm leading-relaxed whitespace-pre-wrap">{{
          shareText
        }}</pre>
      </figure>
    </section>

    <p class="label-mono rounded-xl border-2 border-dashed border-ink/30 px-3 py-2 text-center">
      {{ nextIn }}
    </p>

    <div class="flex flex-col gap-2 sm:flex-row">
      <RouterLink to="/silueta/diario" class="btn-secondary flex-1">
        {{ es.daily.alsoToday }}: {{ es.silhouette.dailyTitle }}
      </RouterLink>
      <RouterLink to="/" class="btn-ghost">{{ es.results.home }}</RouterLink>
    </div>
  </div>
</template>
