<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink, useRouter, type RouteLocationRaw } from 'vue-router'

import BrandMark from '@/components/brand/BrandMark.vue'
import InkStamp from '@/components/brand/InkStamp.vue'
import RouteBarcode from '@/components/brand/RouteBarcode.vue'
import FlagImage from '@/components/FlagImage.vue'
import StatusIcon from '@/components/StatusIcon.vue'
import { useAnnouncer } from '@/composables/useAnnouncer'
import { es } from '@/i18n/es'
import type { GameResult } from '@/lib/results'
import { newSeed } from '@/lib/rng'
import { locateQuery, silhouetteQuery, triviaQuery } from '@/lib/urlConfig'
import { useResultStore } from '@/stores/result'

const router = useRouter()
const { announce } = useAnnouncer()
const result = computed(() => useResultStore().last)

const accuracy = computed(() =>
  result.value && result.value.total > 0 ? result.value.correct / result.value.total : 0,
)

const levelLabel = computed(() => {
  const r = result.value
  if (!r) return ''
  if (r.mode === 'trivia') return es.difficulties[r.difficulty ?? 'facil']
  if (r.mode === 'silhouette') return es.setup.silhouetteN(r.total)
  return r.count === 'todos' ? es.records.countAll : es.records.countN(r.count ?? r.total)
})

const dateLabel = computed(() =>
  es.format.date(result.value?.finishedAt ?? new Date().toISOString()),
)

/** Confeti de tinta para los récords: posiciones fijas, colores de la paleta. */
const confetti = Array.from({ length: 14 }, (_, i) => ({
  angle: (i / 14) * 360,
  distance: 70 + (i % 3) * 22,
  color: ['var(--color-pink)', 'var(--color-sun)', 'var(--color-jade)', 'var(--color-cobalt)'][
    i % 4
  ],
  round: i % 2 === 0,
}))

/** Misma configuración con semilla nueva; `only` = solo esos países. */
function gameLink(r: GameResult, only: string[] | undefined): RouteLocationRaw {
  const seed = newSeed()
  if (r.mode === 'locate') {
    const count = r.count === 20 || r.count === 'todos' ? r.count : 10
    return { name: 'locate', query: locateQuery({ region: r.region, count, seed, only }) }
  }
  if (r.mode === 'silhouette') {
    const count = r.count === 10 ? 10 : 5
    return { name: 'silhouette', query: silhouetteQuery({ region: r.region, count, seed, only }) }
  }
  return {
    name: 'trivia',
    query: triviaQuery({
      difficulty: r.difficulty ?? 'facil',
      region: r.region,
      timer: r.timer ?? false,
      seed,
      only,
    }),
  }
}

const reviewLink = computed(() =>
  result.value && result.value.misses.length > 0
    ? gameLink(result.value, [...new Set(result.value.misses.map((m) => m.code))])
    : null,
)

const replayLink = computed(() => {
  const r = result.value
  if (!r) return null
  // Una partida de repaso se repite con los mismos países.
  return gameLink(r, r.only)
})

onMounted(() => {
  const r = result.value
  if (!r) {
    void router.replace('/')
    return
  }
  announce(
    [
      es.results.headline(accuracy.value),
      `${es.results.score}: ${r.score} / ${r.maxScore}`,
      `${es.results.accuracy}: ${es.format.percent(accuracy.value)}`,
      ...(r.isRecord ? [es.results.newRecord] : []),
    ].join('. '),
  )
})
</script>

<template>
  <div v-if="result" class="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-6 pb-14 sm:pt-10">
    <header class="animate-rise">
      <p class="label-mono text-cobalt">{{ es.results.title }}</p>
      <h1 class="mt-1 font-display text-[2.6rem] leading-none font-extrabold sm:text-6xl">
        {{ es.results.headline(accuracy) }}
      </h1>
    </header>

    <!-- Pase de abordar -->
    <article class="pass relative animate-rise [animation-delay:80ms]">
      <header
        class="flex items-center justify-between gap-3 rounded-t-[1.15rem] border-b-[2.5px] border-ink bg-cobalt px-5 py-3 text-paper-light"
      >
        <span class="flex items-center gap-2">
          <BrandMark :size="28" />
          <span class="font-display text-xl leading-none font-extrabold">Geo<em>Retos</em></span>
        </span>
        <span class="label-mono">{{ es.results.pass }}</span>
      </header>

      <!-- Modo → destino -->
      <div class="grid grid-cols-[1fr_auto_1fr] items-end gap-3 px-5 pt-5">
        <div class="min-w-0">
          <p class="label-mono text-ink-soft">{{ es.results.mode }}</p>
          <p class="font-display text-[1.6rem] leading-[1.05] font-extrabold">
            {{ es.records[result.mode] }}
          </p>
        </div>
        <svg viewBox="0 0 64 24" class="mb-1 w-14 sm:w-20" aria-hidden="true">
          <path
            d="M2 18C20 4 44 4 54 12"
            fill="none"
            stroke="var(--color-ink)"
            stroke-width="2"
            stroke-dasharray="3 4"
          />
          <path
            d="M46 6.5L62 12l-15 6 2.5-5.5z"
            fill="var(--color-pink)"
            stroke="var(--color-ink)"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
        </svg>
        <div class="min-w-0 text-right">
          <p class="label-mono text-ink-soft">{{ es.results.destination }}</p>
          <p class="font-display text-[1.6rem] leading-[1.05] font-extrabold">
            {{ es.regions[result.region] }}
          </p>
        </div>
      </div>

      <!-- Datos del viaje -->
      <dl class="grid grid-cols-3 gap-x-3 gap-y-4 px-5 py-5">
        <div>
          <dt class="label-mono text-ink-soft">{{ es.results.accuracy }}</dt>
          <dd class="font-mono text-lg font-semibold">{{ es.format.percent(accuracy) }}</dd>
        </div>
        <div>
          <dt class="label-mono text-ink-soft">{{ es.results.time }}</dt>
          <dd class="font-mono text-lg font-semibold">{{ es.format.duration(result.timeMs) }}</dd>
        </div>
        <div>
          <dt class="label-mono text-ink-soft">{{ es.results.level }}</dt>
          <dd class="font-mono text-lg font-semibold">{{ levelLabel }}</dd>
        </div>
        <div>
          <dt class="label-mono text-ink-soft">{{ es.results.route }}</dt>
          <dd class="font-mono text-lg font-semibold uppercase">{{ result.seed }}</dd>
        </div>
        <div class="col-span-2">
          <dt class="label-mono text-ink-soft">{{ es.results.date }}</dt>
          <dd class="font-mono text-lg font-semibold">{{ dateLabel }}</dd>
        </div>
      </dl>

      <!-- Línea perforada -->
      <div class="perforation" aria-hidden="true" />

      <!-- Talón -->
      <div class="flex items-end gap-4 px-5 pt-4 pb-5">
        <div class="flex flex-col gap-1">
          <RouteBarcode :seed="result.seed" class="h-12 w-32 sm:w-40" />
          <span class="sr-only">{{ es.results.barcodeLabel(result.seed) }}</span>
        </div>
        <div class="ml-auto text-right">
          <p class="label-mono text-ink-soft">{{ es.results.score }}</p>
          <p class="font-display text-6xl leading-none font-extrabold">
            {{ result.score }}<span class="text-2xl text-ink-soft">/{{ result.maxScore }}</span>
          </p>
        </div>
      </div>

      <!-- Sello de récord con confeti -->
      <!-- Cae sobre el código de barras, que es decorativo, para no tapar datos -->
      <div v-if="result.isRecord" class="pointer-events-none absolute bottom-9 left-3 sm:left-5">
        <span class="relative block">
          <span
            v-for="(c, i) in confetti"
            :key="i"
            class="confetti"
            :class="c.round ? 'rounded-full' : 'rounded-[2px]'"
            :style="{ '--a': `${c.angle}deg`, '--d': `${c.distance}px`, background: c.color }"
            aria-hidden="true"
          />
          <InkStamp tone="pink" size="lg" :rotate="-9">{{ es.results.newRecord }}</InkStamp>
        </span>
      </div>
    </article>

    <p
      v-if="!result.isRecord && result.previousBest !== undefined && !result.review"
      class="label-mono -mt-2 text-center text-ink-soft"
    >
      {{ es.results.previousRecord(result.previousBest) }}
    </p>
    <p v-if="result.review" class="label-mono -mt-2 text-center text-ink-soft">
      {{ es.results.reviewNote }}
    </p>

    <div class="flex flex-col gap-3 sm:flex-row">
      <RouterLink v-if="reviewLink" :to="reviewLink" class="btn-accent flex-1">
        {{ es.results.reviewMisses }}
      </RouterLink>
      <RouterLink v-if="replayLink" :to="replayLink" class="btn-primary flex-1">
        {{ es.results.playAgain }}
      </RouterLink>
      <RouterLink to="/" class="btn-ghost">{{ es.results.home }}</RouterLink>
    </div>

    <!-- Por visitar -->
    <section class="card overflow-hidden" aria-labelledby="por-visitar">
      <header class="border-b-2 border-dashed border-ink/30 px-5 py-4">
        <h2 id="por-visitar" class="font-display text-2xl font-extrabold">
          {{ es.results.misses }}
        </h2>
        <p v-if="result.misses.length" class="label-mono mt-1 text-ink-soft">
          {{ es.results.missesHint }}
        </p>
      </header>
      <p
        v-if="result.misses.length === 0"
        class="flex items-center gap-2 px-5 py-4 font-semibold text-jade-ink"
      >
        <StatusIcon kind="ok" />
        {{ es.results.noMisses }}
      </p>
      <ul v-else class="divide-y-2 divide-dashed divide-ink/15">
        <li
          v-for="(miss, i) in result.misses"
          :key="`${miss.code}-${i}`"
          class="flex items-center gap-3 px-5 py-3"
        >
          <FlagImage
            :code="miss.flag ?? miss.code"
            alt=""
            class="h-9 -rotate-2 rounded-sm border-2 border-ink"
          />
          <div class="min-w-0 flex-1">
            <p class="font-bold leading-snug">{{ miss.label }}</p>
            <p v-if="miss.detail" class="text-sm text-ink-soft">{{ miss.detail }}</p>
          </div>
          <StatusIcon kind="fail" />
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.pass {
  border: 2.5px solid var(--color-ink);
  border-radius: 1.3rem;
  background: var(--color-paper-light);
  box-shadow: 7px 7px 0 0 var(--color-ink);
}

/* Perforación con muescas a los lados, como un pase de verdad */
.perforation {
  position: relative;
  height: 0;
  border-top: 2.5px dashed rgb(27 31 59 / 0.45);
  margin: 0 1.1rem;
}
.perforation::before,
.perforation::after {
  content: '';
  position: absolute;
  top: -15px;
  width: 28px;
  height: 28px;
  border: 2.5px solid var(--color-ink);
  border-radius: 9999px;
  background-color: var(--color-paper);
  background-image: var(--grain);
}
.perforation::before {
  left: calc(-1.1rem - 16px);
  clip-path: inset(0 0 0 50%);
}
.perforation::after {
  right: calc(-1.1rem - 16px);
  clip-path: inset(0 50% 0 0);
}

.confetti {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 9px;
  height: 9px;
  border: 1.5px solid var(--color-ink);
  opacity: 0;
  animation: burst 900ms cubic-bezier(0.15, 0.8, 0.3, 1) 260ms forwards;
}

@keyframes burst {
  0% {
    transform: translate(-50%, -50%) rotate(var(--a)) translateX(0) scale(0.4);
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--a)) translateX(var(--d)) scale(1) rotate(200deg);
    opacity: 0;
  }
}
</style>
