<script setup lang="ts">
/**
 * Mi progreso: resumen, racha, logros, precisión por continente, mapa de lo que
 * sabes, países que más fallas, récords y ajustes.
 */
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'

import AchievementMedal from '@/components/brand/AchievementMedal.vue'
import AtlasPlate from '@/components/brand/AtlasPlate.vue'
import InkStamp from '@/components/brand/InkStamp.vue'
import FlagImage from '@/components/FlagImage.vue'
import StatusIcon from '@/components/StatusIcon.vue'
import WorldMap from '@/components/WorldMap.vue'
import { useAnnouncer } from '@/composables/useAnnouncer'
import { useInstall } from '@/composables/useInstall'
import { useTheme, type ThemePreference } from '@/composables/useTheme'
import { es } from '@/i18n/es'
import { getCountry } from '@/lib/countries'
import { dayNumber, localDateKey } from '@/lib/daily'
import { dailyChallengeStreak, readDailyChallengeDays } from '@/lib/dailyChallengeRecord'
import { describeRecord } from '@/lib/recordLabels'
import type { GameMode } from '@/lib/results'
import { newSeed } from '@/lib/rng'
import {
  accuracyOf,
  answered,
  continentStats,
  knowledgeColor,
  knowledgeMap,
  streakOf,
  totals,
  weakestCountries,
} from '@/lib/stats'
import { locateQuery } from '@/lib/urlConfig'
import { useProgressStore } from '@/stores/progress'
import { clearAllProgress, useStatsStore } from '@/stores/stats'

const MODES: readonly GameMode[] = ['locate', 'trivia', 'silhouette', 'typing']
const THEMES: readonly ThemePreference[] = ['system', 'light', 'dark']

const stats = useStatsStore()
const progress = useProgressStore()
const theme = useTheme()
const app = useInstall()
const { announce } = useAnnouncer()

const today = localDateKey()
const summary = computed(() => totals(stats.data))
const streak = computed(() => streakOf(stats.data, today))
const dailyStreak = dailyChallengeStreak(readDailyChallengeDays(), dayNumber(today))
const continents = computed(() => continentStats(stats.data))
const highlights = computed(() => knowledgeMap(stats.data))
const weak = computed(() => weakestCountries(stats.data))
const unlockedCount = computed(() => stats.achievements.filter((a) => a.done).length)
const sinceLabel = computed(() => es.format.date(stats.data.since))

const reviewLink = computed(() => {
  const only = weak.value.map((c) => c.code)
  if (only.length === 0) return null
  return {
    name: 'locate',
    query: locateQuery({ region: 'mundo', count: 'todos', seed: newSeed(), only }),
  }
})

/** Récords agrupados por modo. */
const recordGroups = computed(() =>
  MODES.map((mode) => ({
    mode,
    items: Object.entries(progress.records)
      .map(([key, entry]) => describeRecord(key, entry))
      .filter((r) => r.mode === mode)
      .sort(
        (a, b) =>
          a.regionLabel.localeCompare(b.regionLabel, 'es') || a.level.localeCompare(b.level, 'es'),
      ),
  })).filter((g) => g.items.length > 0),
)

/** País tocado en el mapa. */
const picked = ref<string | null>(null)
const pickedInfo = computed(() => {
  const code = picked.value
  if (!code) return null
  const name = getCountry(code)?.name ?? code
  const stat = stats.data.countries[code]
  if (!stat || answered(stat) === 0) {
    return { text: es.progress.countryNever(name), kind: 'brand' as const }
  }
  const text = es.progress.countryLine(
    name,
    stat.ok + stat.meh,
    answered(stat),
    es.format.percent(accuracyOf(stat)),
  )
  return { text, kind: knowledgeColor(stat) ?? ('brand' as const) }
})

function pick(code: string) {
  picked.value = code
  if (pickedInfo.value) announce(pickedInfo.value.text)
}

function nameOf(code: string) {
  return getCountry(code)?.name ?? code
}

function percentWidth(value: number) {
  return `${Math.round(value * 100)}%`
}

const confirmReset = ref(false)

function resetAll() {
  clearAllProgress()
  // Se recarga para que todos los datos vuelvan a leerse vacíos.
  window.location.reload()
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 pt-6 pb-14 sm:pt-10">
    <header class="animate-rise">
      <p class="label-mono text-cobalt-ink">{{ es.progress.kicker }}</p>
      <h1 class="mt-1 font-display text-[2.6rem] leading-none font-extrabold sm:text-6xl">
        {{ es.progress.title }}
      </h1>
      <p class="mt-3 text-ink-soft">
        {{ progress.gamesPlayed > 0 ? es.progress.since(sinceLabel) : es.progress.empty }}
      </p>
    </header>

    <!-- Resumen -->
    <dl class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="ticket">
        <dt class="label-mono text-ink-soft">{{ es.progress.games }}</dt>
        <dd class="font-display text-4xl font-extrabold">
          {{ es.format.number(progress.gamesPlayed) }}
        </dd>
      </div>
      <div class="ticket">
        <dt class="label-mono text-ink-soft">{{ es.progress.questions }}</dt>
        <dd class="font-display text-4xl font-extrabold">
          {{ es.format.number(summary.questions) }}
        </dd>
      </div>
      <div class="ticket">
        <dt class="label-mono text-ink-soft">{{ es.progress.accuracy }}</dt>
        <dd class="font-display text-4xl font-extrabold">
          {{ summary.questions ? es.format.percent(summary.accuracy) : '—' }}
        </dd>
      </div>
      <div class="ticket">
        <dt class="label-mono text-ink-soft">{{ es.progress.time }}</dt>
        <dd class="font-display text-4xl font-extrabold">
          {{ es.progress.playTime(stats.data.timeMs) }}
        </dd>
      </div>
    </dl>

    <!-- Racha -->
    <section class="card flex items-center gap-4 p-5" aria-labelledby="racha">
      <svg viewBox="0 0 24 24" class="size-14 shrink-0 text-tomato-ink" aria-hidden="true">
        <path
          d="M12 21.5c3.9 0 6.5-2.8 6.5-6.3 0-4.6-3.6-6.6-4.4-10.7-1.9 2.4-1.4 4.6-2.7 5.7-.9-1.6-2-2.4-2-2.4-1.6 2.6-3.9 4.4-3.9 7.4 0 3.5 2.6 6.3 6.5 6.3z"
          :fill="streak.current > 0 ? 'var(--color-tomato)' : 'none'"
          stroke="var(--color-ink)"
          stroke-width="1.6"
          stroke-linejoin="round"
        />
      </svg>
      <div class="min-w-0">
        <h2 id="racha" class="label-mono text-ink-soft">{{ es.progress.streakTitle }}</h2>
        <p class="font-display text-4xl leading-tight font-extrabold">
          {{ es.progress.streakDays(streak.current) }}
        </p>
        <p class="text-sm text-ink-soft">
          {{ es.progress.streakBest(streak.best) }} ·
          {{ streak.playedToday ? es.progress.streakToday : es.progress.streakPending }}
        </p>
        <p v-if="dailyStreak.best > 0" class="label-mono mt-1 text-pink-ink">
          {{ es.progress.dailyStreak(dailyStreak.current) }}
        </p>
      </div>
    </section>

    <!-- Logros -->
    <section aria-labelledby="logros">
      <div class="mb-4 flex items-baseline justify-between gap-3">
        <h2 id="logros" class="font-display text-3xl font-extrabold">
          {{ es.achievements.title }}
        </h2>
        <span class="label-mono rounded-full border-2 border-ink bg-sun px-3 py-1 text-carbon">
          {{ es.achievements.count(unlockedCount, stats.achievements.length) }}
        </span>
      </div>
      <ul class="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-5">
        <li
          v-for="(a, i) in stats.achievements"
          :key="a.id"
          class="flex flex-col items-center text-center"
        >
          <AchievementMedal :id="a.id" :done="a.done" :rotate="(i % 3) * 5 - 5" class="size-20" />
          <p
            class="mt-2 leading-tight font-bold"
            :class="!a.done && 'text-ink-soft'"
            aria-hidden="true"
          >
            {{ es.achievements.items[a.id].name }}
          </p>
          <p class="mt-0.5 text-xs leading-snug text-ink-soft" aria-hidden="true">
            {{ es.achievements.items[a.id].hint }}
          </p>
          <p v-if="a.done && a.unlockedAt" class="label-mono mt-1 text-jade-ink" aria-hidden="true">
            {{ es.format.date(a.unlockedAt) }}
          </p>
          <div
            v-else-if="!a.done && a.goal > 1"
            class="mt-1.5 flex w-full max-w-28 items-center gap-1.5"
            aria-hidden="true"
          >
            <span class="h-2 flex-1 overflow-hidden rounded-full border border-ink bg-paper-deep">
              <span
                class="block h-full bg-cobalt"
                :style="{ width: percentWidth(a.value / a.goal) }"
              />
            </span>
            <span class="font-mono text-[0.65rem] font-semibold text-ink-soft">
              {{ es.achievements.progress(a.value, a.goal) }}
            </span>
          </div>
          <span class="sr-only">
            {{
              a.done && a.unlockedAt
                ? es.achievements.unlockedLabel(
                    es.achievements.items[a.id].name,
                    es.achievements.items[a.id].hint,
                    es.format.date(a.unlockedAt),
                  )
                : es.achievements.lockedLabel(
                    es.achievements.items[a.id].name,
                    es.achievements.items[a.id].hint,
                    a.goal > 1 ? es.achievements.progress(a.value, a.goal) : '',
                  )
            }}
          </span>
        </li>
      </ul>
    </section>

    <!-- Precisión por continente -->
    <section class="card p-5" aria-labelledby="continentes">
      <h2 id="continentes" class="mb-4 font-display text-2xl font-extrabold">
        {{ es.progress.continentsTitle }}
      </h2>
      <ul class="flex flex-col gap-3.5">
        <li v-for="c in continents" :key="c.continent">
          <div class="flex items-baseline justify-between gap-3">
            <span class="font-bold">{{ es.continents[c.continent] }}</span>
            <span class="font-mono text-xs font-semibold text-ink-soft">
              {{
                c.questions
                  ? es.progress.continentLine(es.format.percent(c.accuracy), c.questions)
                  : es.progress.noQuestions
              }}
            </span>
          </div>
          <span
            class="mt-1 block h-3.5 overflow-hidden rounded-full border-2 border-ink bg-paper-deep"
            aria-hidden="true"
          >
            <span
              class="block h-full"
              :class="c.accuracy >= 0.8 ? 'bg-jade' : c.accuracy >= 0.5 ? 'bg-sun' : 'bg-tomato'"
              :style="{ width: c.questions ? percentWidth(c.accuracy) : '0%' }"
            />
          </span>
        </li>
      </ul>
    </section>

    <!-- Mapa de lo que sabes -->
    <section aria-labelledby="lo-que-sabes">
      <h2 id="lo-que-sabes" class="font-display text-3xl font-extrabold">
        {{ es.progress.mapTitle }}
      </h2>
      <p class="mt-1 mb-3 text-ink-soft">{{ es.progress.mapHint }}</p>
      <AtlasPlate class="h-72 sm:h-[26rem]" :caption="`${es.map.plate} · ${es.regions.mundo}`">
        <WorldMap region="mundo" :highlights="highlights" :blink="picked" @select="pick" />
        <div
          class="pointer-events-none absolute inset-x-0 top-3 flex justify-center pr-14 pl-3"
          aria-hidden="true"
        >
          <InkStamp
            v-if="pickedInfo"
            :key="picked ?? ''"
            :tone="pickedInfo.kind"
            :rotate="-3"
            class="max-w-full"
          >
            {{ pickedInfo.text }}
          </InkStamp>
        </div>
      </AtlasPlate>
      <ul
        class="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 font-mono text-[0.7rem] font-semibold text-ink-soft"
      >
        <li class="flex items-center gap-1">
          <StatusIcon kind="ok" class="size-4" />{{ es.progress.mapLegend.ok }}
        </li>
        <li class="flex items-center gap-1">
          <StatusIcon kind="meh" class="size-4" />{{ es.progress.mapLegend.meh }}
        </li>
        <li class="flex items-center gap-1">
          <StatusIcon kind="fail" class="size-4" />{{ es.progress.mapLegend.fail }}
        </li>
        <li class="flex items-center gap-1">
          <span class="size-3.5 rounded-sm border-2 border-ink bg-sand" aria-hidden="true" />{{
            es.progress.mapLegend.none
          }}
        </li>
      </ul>
    </section>

    <!-- Países que más fallas -->
    <section class="card overflow-hidden" aria-labelledby="mas-fallas">
      <header class="border-b-2 border-dashed border-ink/30 px-5 py-4">
        <h2 id="mas-fallas" class="font-display text-2xl font-extrabold">
          {{ es.progress.weakTitle }}
        </h2>
      </header>
      <p v-if="weak.length === 0" class="px-5 py-4 text-ink-soft">{{ es.progress.weakEmpty }}</p>
      <template v-else>
        <ol class="divide-y-2 divide-dashed divide-ink/15">
          <li v-for="c in weak" :key="c.code" class="flex items-center gap-3 px-5 py-2.5">
            <FlagImage :code="c.code" alt="" class="h-8 -rotate-2 rounded-sm border-2 border-ink" />
            <span class="min-w-0 flex-1 font-bold">{{ nameOf(c.code) }}</span>
            <span class="font-mono text-xs font-semibold text-tomato-ink">
              {{ es.progress.weakLine(c.fails, c.seen) }}
            </span>
          </li>
        </ol>
        <div class="px-5 py-4">
          <RouterLink v-if="reviewLink" :to="reviewLink" class="btn-accent w-full">
            {{ es.progress.weakReview }}
          </RouterLink>
        </div>
      </template>
    </section>

    <!-- Récords -->
    <section aria-labelledby="records">
      <h2 id="records" class="mb-3 font-display text-3xl font-extrabold">
        {{ es.progress.recordsTitle }}
      </h2>
      <p v-if="recordGroups.length === 0" class="text-ink-soft">{{ es.progress.noRecords }}</p>
      <div class="grid gap-4 sm:grid-cols-2">
        <div v-for="group in recordGroups" :key="group.mode" class="card p-4">
          <h3 class="label-mono mb-2 text-cobalt-ink">{{ es.records[group.mode] }}</h3>
          <ul class="flex flex-col gap-2">
            <li v-for="r in group.items" :key="r.key" class="flex items-baseline gap-3">
              <span class="min-w-0 flex-1">
                <span class="font-bold">{{ r.regionLabel }}</span>
                <span class="text-ink-soft"> · {{ r.level }}</span>
                <span class="block font-mono text-[0.68rem] text-ink-soft">{{ r.dateLabel }}</span>
              </span>
              <span
                class="font-display text-xl font-extrabold"
                :class="r.perfect && 'text-jade-ink'"
                :aria-label="r.scoreLabel"
                >{{ r.score }}</span
              >
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- Ajustes -->
    <section class="card p-5" aria-labelledby="ajustes">
      <h2 id="ajustes" class="mb-4 font-display text-2xl font-extrabold">
        {{ es.progress.settingsTitle }}
      </h2>
      <fieldset>
        <legend class="label-mono mb-2 text-ink-soft">{{ es.progress.theme }}</legend>
        <div class="inline-flex overflow-hidden rounded-xl border-2 border-ink shadow-ink-sm">
          <label
            v-for="option in THEMES"
            :key="option"
            class="theme-option cursor-pointer border-ink px-4 py-2 font-bold not-last:border-r-2"
            :class="theme.preference.value === option ? 'bg-cobalt text-cream' : 'bg-paper-light'"
          >
            <input
              type="radio"
              name="tema"
              class="sr-only"
              :value="option"
              :checked="theme.preference.value === option"
              @change="theme.setPreference(option)"
            />
            {{ es.progress.themeOptions[option] }}
          </label>
        </div>
      </fieldset>

      <!-- Instalar como app (PWA) -->
      <div class="mt-6 border-t-2 border-dashed border-ink/30 pt-5">
        <h3 class="label-mono mb-1 text-ink-soft">{{ es.pwa.installTitle }}</h3>
        <p v-if="app.installed.value" class="font-semibold text-jade-ink">
          {{ es.pwa.installed }}
        </p>
        <template v-else>
          <p class="text-ink-soft">{{ es.pwa.installText }}</p>
          <button
            v-if="app.canPrompt.value"
            type="button"
            class="btn-primary mt-3"
            @click="app.install()"
          >
            {{ es.pwa.install }}
          </button>
          <p v-else class="mt-2 text-sm font-semibold">
            {{ app.ios ? es.pwa.installIos : es.pwa.installOther }}
          </p>
        </template>
      </div>

      <div class="mt-6 border-t-2 border-dashed border-ink/30 pt-5">
        <button
          v-if="!confirmReset"
          type="button"
          class="btn bg-paper-light text-tomato-ink"
          @click="confirmReset = true"
        >
          {{ es.progress.reset }}
        </button>
        <div v-else class="rounded-xl border-2 border-ink bg-tomato-light p-4" role="alert">
          <p class="text-ink">{{ es.progress.resetWarning }}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <button type="button" class="btn bg-tomato text-carbon" @click="resetAll">
              {{ es.progress.resetConfirm }}
            </button>
            <button type="button" class="btn-ghost" @click="confirmReset = false">
              {{ es.progress.resetCancel }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.ticket {
  position: relative;
  border: 2px solid var(--color-ink);
  border-radius: 1rem;
  background: var(--color-paper-light);
  padding: 0.85rem 1rem 0.9rem;
  box-shadow: 4px 4px 0 0 var(--color-shadow);
}

/* Muescas de boleto a los lados */
.ticket::before,
.ticket::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 14px;
  height: 14px;
  margin-top: -7px;
  border: 2px solid var(--color-ink);
  border-radius: 9999px;
  background: var(--color-paper);
}
.ticket::before {
  left: -8px;
  clip-path: inset(0 0 0 50%);
}
.ticket::after {
  right: -8px;
  clip-path: inset(0 50% 0 0);
}

.theme-option:has(:focus-visible) {
  outline: 3px solid var(--color-pink);
  outline-offset: -3px;
}
</style>
