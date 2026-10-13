<script setup lang="ts">
/** Al terminar un desafío: tu resultado junto al de quien te desafió, y quién ganó. */
import { computed } from 'vue'

import InkStamp from '@/components/brand/InkStamp.vue'
import RouteProgress from '@/components/brand/RouteProgress.vue'
import type { InkTone } from '@/components/brand/types'
import { es } from '@/i18n/es'
import { duelOutcome, type Challenge } from '@/lib/challenge'
import type { GameResult } from '@/lib/results'

const props = defineProps<{ result: GameResult; challenge: Challenge }>()

/** Contrarreloj y Supervivencia: puntaje sin máximo y desempate por fallos. */
const endless = computed(() => (props.result.variant ?? 'clasica') !== 'clasica')
const outcome = computed(() => duelOutcome(props.result, props.challenge, endless.value))
const tone = computed<InkTone>(() =>
  outcome.value === 'win' ? 'ok' : outcome.value === 'lose' ? 'fail' : 'meh',
)

const sides = computed(() => [
  {
    key: 'tu',
    who: es.challenge.you,
    played: props.result,
    marks: props.result.mode === 'typing' ? [] : (props.result.answers ?? []).map((a) => a.mark),
    leads: outcome.value === 'win',
  },
  {
    key: 'rival',
    who: props.challenge.name || es.challenge.rival,
    played: props.challenge,
    marks: props.challenge.marks,
    leads: outcome.value === 'lose',
  },
])
</script>

<template>
  <section class="duel relative overflow-hidden animate-rise" aria-labelledby="desafio-resultado">
    <header
      class="flex items-center justify-between gap-3 border-b-2 border-dashed border-ink/40 px-5 py-3"
    >
      <h2 id="desafio-resultado" class="label-mono text-pink-ink">
        {{ es.challenge.duelTitle }}
      </h2>
    </header>

    <div class="flex justify-center px-5 pt-5">
      <InkStamp :tone="tone" size="lg" :rotate="-5">{{ es.challenge.outcomes[outcome] }}</InkStamp>
    </div>

    <div class="grid grid-cols-2 divide-x-2 divide-dashed divide-ink/30 px-2 py-5">
      <div
        v-for="side in sides"
        :key="side.key"
        class="flex min-w-0 flex-col gap-2 px-3"
        :class="side.leads && 'leader'"
      >
        <p class="truncate font-bold">{{ side.who }}</p>
        <p class="font-display text-5xl leading-none font-extrabold">
          {{ side.played.score
          }}<span v-if="!endless" class="text-xl text-ink-soft">/{{ side.played.maxScore }}</span>
        </p>
        <dl class="grid gap-0.5 font-mono text-sm">
          <dt class="label-mono text-ink-soft">{{ es.challenge.correctLabel }}</dt>
          <dd class="font-semibold">
            {{ es.challenge.correctOf(side.played.correct, side.played.total) }}
          </dd>
          <dt class="label-mono mt-1 text-ink-soft">{{ es.challenge.timeLabel }}</dt>
          <dd class="font-semibold">{{ es.format.duration(side.played.timeMs) }}</dd>
        </dl>
        <RouteProgress
          v-if="side.marks.length"
          :total="side.marks.length"
          :current="side.marks.length"
          :marks="side.marks"
        />
      </div>
    </div>

    <p class="border-t-2 border-dashed border-ink/30 px-5 py-3 text-sm text-ink-soft">
      {{ endless ? es.challenge.tieBreakEndless : es.challenge.tieBreak }}
      <template v-if="!challenge.sameVersion"> {{ es.challenge.otherVersion }}</template>
    </p>
  </section>
</template>

<style scoped>
.duel {
  border: 2.5px solid var(--color-ink);
  border-radius: 1.3rem;
  background: var(--color-paper-light);
  box-shadow: 7px 7px 0 0 var(--color-shadow);
}

/* Quien va ganando se marca con un subrayado de rotulador */
.leader > p:first-child {
  text-decoration: underline;
  text-decoration-color: var(--color-pink);
  text-decoration-thickness: 3px;
  text-underline-offset: 4px;
}
</style>
