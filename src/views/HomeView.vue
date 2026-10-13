<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import HeroGlobe from '@/components/brand/HeroGlobe.vue'
import PassportStamp from '@/components/brand/PassportStamp.vue'
import DayTicket from '@/components/DayTicket.vue'
import PosterLocateArt from '@/components/brand/PosterLocateArt.vue'
import PosterSilhouetteArt from '@/components/brand/PosterSilhouetteArt.vue'
import PosterTriviaArt from '@/components/brand/PosterTriviaArt.vue'
import PosterTypingArt from '@/components/brand/PosterTypingArt.vue'
import type { StampTone } from '@/components/brand/types'
import { es } from '@/i18n/es'
import { dailyChallenge } from '@/lib/daily'
import {
  dailyChallengeStreak,
  dailyChallengeSummary,
  readDailyChallengeDays,
} from '@/lib/dailyChallengeRecord'
import { DAILY_LENGTH, DAILY_MAX_SCORE } from '@/lib/dailyChallengeRules'
import { dailySummary, readDailyEntries } from '@/lib/dailyRecord'
import { describeRecord } from '@/lib/recordLabels'
import type { GameMode } from '@/lib/results'
import { hashSeed } from '@/lib/rng'
import { useProgressStore } from '@/stores/progress'

const TOTAL_COUNTRIES = 195
const MODE_TONE: Record<GameMode, StampTone> = {
  locate: 'cobalt',
  trivia: 'pink',
  silhouette: 'tomato',
  typing: 'sun',
}

const progress = useProgressStore()

// Estado del reto diario leído directamente del registro: la portada no carga los países.
const today = dailyChallenge()
const daily = dailySummary(readDailyEntries()[today.key])
const challengeDays = readDailyChallengeDays()
const todayChallenge = challengeDays[today.key]
const challenge = dailyChallengeSummary(
  todayChallenge?.number === today.number ? todayChallenge : undefined,
  DAILY_LENGTH,
)
const challengeStreak = dailyChallengeStreak(challengeDays, today.number)

const stamps = computed(() =>
  Object.entries(progress.records)
    .map(([key, entry]) => {
      const r = describeRecord(key, entry)
      const tone: StampTone = r.perfect ? 'jade' : (MODE_TONE[r.mode] ?? 'cobalt')
      return {
        key,
        date: r.date,
        top: r.title.toUpperCase(),
        bottom: r.regionLabel.toUpperCase(),
        score: r.score,
        detail: r.level.toUpperCase(),
        dateLabel: r.dateLabel.toUpperCase(),
        tone,
        // Cada sello cae con un giro distinto, pero siempre el mismo para el mismo récord.
        rotate: (hashSeed(key) % 21) - 10,
        label: es.home.stampLabel(r.title, r.regionLabel, r.level, r.scoreLabel, r.dateLabel),
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date)),
)
</script>

<template>
  <div class="flex flex-col gap-10 px-4 pt-6 pb-14 sm:gap-14 sm:pt-10">
    <!-- Portada -->
    <section class="grid items-center gap-2 sm:grid-cols-[1.15fr_0.85fr] sm:gap-8">
      <div class="animate-rise">
        <p
          class="label-mono inline-flex items-center gap-2 rounded-full border-2 border-ink bg-paper-light px-3 py-1.5 shadow-ink-sm"
        >
          <span
            class="size-2.5 rounded-full border-[1.5px] border-ink bg-pink"
            aria-hidden="true"
          />
          {{ es.home.kicker(TOTAL_COUNTRIES) }}
        </p>
        <h1 class="font-display mt-5 text-[3.1rem] leading-[0.92] font-extrabold sm:text-7xl">
          {{ es.home.titleStart }}
          <span class="relative inline-block whitespace-nowrap text-cobalt-ink italic">
            <span class="riso-shadow">{{ es.home.titleEmphasis }}</span>
            <svg
              viewBox="0 0 200 14"
              preserveAspectRatio="none"
              class="absolute -bottom-2.5 left-0 h-3.5 w-full"
              aria-hidden="true"
            >
              <path
                d="M3 8c16-9 32 9 48 0s32 9 48 0 32 9 48 0 32 9 48 0"
                fill="none"
                stroke="var(--color-pink)"
                stroke-width="5"
                stroke-linecap="round"
              /></svg></span
          >.
        </h1>
        <p class="mt-6 max-w-md text-lg leading-snug text-ink-soft">{{ es.home.subtitle }}</p>
      </div>
      <div class="relative mx-auto w-[min(80vw,380px)] animate-rise [animation-delay:120ms]">
        <HeroGlobe />
      </div>
    </section>

    <!-- Hoy: los dos retos del día -->
    <section class="flex animate-rise flex-col gap-3 [animation-delay:140ms]" aria-labelledby="hoy">
      <h2 id="hoy" class="label-mono">{{ es.daily.todayHeading }}</h2>
      <div class="grid gap-4 lg:grid-cols-2">
        <DayTicket
          to="/diario"
          tone="cobalt"
          :number="today.number"
          :kicker="es.daily.homeKicker(today.number)"
          :title="
            challenge.finished
              ? es.daily.homeDone(challenge.score, DAILY_MAX_SCORE)
              : challenge.started
                ? es.daily.homeProgress(Math.min(challenge.answered + 1, DAILY_LENGTH))
                : es.daily.homePending
          "
          :note="
            challengeStreak.current > 0
              ? `🔥 ${es.daily.streakLabel}: ${es.daily.streakDays(challengeStreak.current)}`
              : undefined
          "
          :cta="
            challenge.finished
              ? es.daily.homeSee
              : challenge.started
                ? es.daily.homeContinue
                : es.daily.homePlay
          "
        />
        <DayTicket
          to="/silueta/diario"
          :number="today.number"
          :kicker="es.home.dailyKicker(today.number)"
          :title="
            daily.done ? es.home.dailyDone(daily.attempts, daily.solved) : es.home.dailyPending
          "
          :cta="daily.done ? es.home.dailySee : es.home.dailyPlay"
        />
      </div>
    </section>

    <!-- Modos: carteles de viaje -->
    <section class="grid gap-7 sm:grid-cols-2 sm:gap-8">
      <RouterLink
        to="/mapa"
        class="poster theme-light group -rotate-1 bg-cobalt text-cream animate-rise [animation-delay:180ms]"
      >
        <div class="poster-strip bg-cobalt-deep">
          <span>{{ es.home.modeLabel(1) }}</span>
          <span>{{ es.home.locateMeta }}</span>
        </div>
        <div class="halftone h-40 px-4 pt-3 text-cobalt-deep sm:h-44">
          <PosterLocateArt
            class="transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-2"
          />
        </div>
        <div class="p-5 pt-2">
          <h2 class="font-display text-[2.4rem] leading-none font-extrabold">
            {{ es.home.locateTitle }}
          </h2>
          <p class="mt-2 text-cream/80">{{ es.home.locateText }}</p>
          <span class="poster-cta">
            {{ es.home.play }}
            <svg
              viewBox="0 0 20 20"
              class="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            >
              <path
                d="M4 10h11M11 5l5 5-5 5"
                fill="none"
                stroke="currentColor"
                stroke-width="2.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
        </div>
      </RouterLink>

      <RouterLink
        to="/trivia"
        class="poster theme-light group rotate-1 bg-sun text-ink animate-rise [animation-delay:260ms]"
      >
        <div class="poster-strip bg-pink">
          <span>{{ es.home.modeLabel(2) }}</span>
          <span>{{ es.home.triviaMeta }}</span>
        </div>
        <div class="halftone h-40 px-4 pt-3 text-sun-ink/25 sm:h-44">
          <PosterTriviaArt
            class="transition-transform duration-500 group-hover:scale-105 group-hover:rotate-2"
          />
        </div>
        <div class="p-5 pt-2">
          <h2 class="font-display text-[2.4rem] leading-none font-extrabold">
            {{ es.home.triviaTitle }}
          </h2>
          <p class="mt-2 text-ink-soft">{{ es.home.triviaText }}</p>
          <span class="poster-cta">
            {{ es.home.play }}
            <svg
              viewBox="0 0 20 20"
              class="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            >
              <path
                d="M4 10h11M11 5l5 5-5 5"
                fill="none"
                stroke="currentColor"
                stroke-width="2.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
        </div>
      </RouterLink>

      <RouterLink
        to="/silueta"
        class="poster theme-light group -rotate-1 bg-tomato text-ink animate-rise [animation-delay:300ms]"
      >
        <div class="poster-strip bg-ink">
          <span>{{ es.home.modeLabel(3) }}</span>
          <span>{{ es.home.silhouetteMeta }}</span>
        </div>
        <div class="halftone h-40 px-4 pt-3 text-tomato-ink sm:h-44">
          <PosterSilhouetteArt
            class="transition-transform duration-500 group-hover:scale-105 group-hover:rotate-1"
          />
        </div>
        <div class="p-5 pt-2">
          <h2 class="font-display text-[2.4rem] leading-none font-extrabold">
            {{ es.home.silhouetteTitle }}
          </h2>
          <p class="mt-2 text-ink">{{ es.home.silhouetteText }}</p>
          <span class="poster-cta">
            {{ es.home.play }}
            <svg
              viewBox="0 0 20 20"
              class="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            >
              <path
                d="M4 10h11M11 5l5 5-5 5"
                fill="none"
                stroke="currentColor"
                stroke-width="2.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
        </div>
      </RouterLink>

      <RouterLink
        to="/escribe"
        class="poster theme-light group rotate-1 bg-jade text-ink animate-rise [animation-delay:340ms]"
      >
        <div class="poster-strip bg-ink">
          <span>{{ es.home.modeLabel(4) }}</span>
          <span>{{ es.home.typingMeta }}</span>
        </div>
        <div class="halftone h-40 px-4 pt-3 text-jade-ink sm:h-44">
          <PosterTypingArt
            class="transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-1"
          />
        </div>
        <div class="p-5 pt-2">
          <h2 class="font-display text-[2.4rem] leading-none font-extrabold">
            {{ es.home.typingTitle }}
          </h2>
          <p class="mt-2 text-ink">{{ es.home.typingText }}</p>
          <span class="poster-cta">
            {{ es.home.play }}
            <svg
              viewBox="0 0 20 20"
              class="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            >
              <path
                d="M4 10h11M11 5l5 5-5 5"
                fill="none"
                stroke="currentColor"
                stroke-width="2.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
        </div>
      </RouterLink>
    </section>

    <!-- Pasaporte con los récords -->
    <section
      class="overflow-hidden rounded-[1.4rem] border-[2.5px] border-ink bg-paper-light shadow-ink-lg animate-rise [animation-delay:340ms]"
      aria-labelledby="pasaporte-titulo"
    >
      <header
        class="flex flex-wrap items-end justify-between gap-3 border-b-[2.5px] border-ink bg-cobalt px-5 py-4 text-cream"
      >
        <div>
          <p class="label-mono text-cream/80">{{ es.home.passportKicker }}</p>
          <h2 id="pasaporte-titulo" class="font-display text-3xl font-extrabold">
            {{ es.home.passportTitle }}
          </h2>
        </div>
        <div class="flex gap-2">
          <span
            class="label-mono rounded-full border-2 border-ink bg-paper-light px-3 py-1 text-ink"
          >
            {{ es.home.trips(progress.gamesPlayed) }}
          </span>
          <span class="label-mono rounded-full border-2 border-ink bg-sun px-3 py-1 text-carbon">
            {{ es.home.stamps(stamps.length) }}
          </span>
          <RouterLink
            to="/progreso"
            class="label-mono flex items-center gap-1 rounded-full border-2 border-ink bg-pink px-3 py-1 text-carbon shadow-ink-sm transition-transform hover:-translate-y-0.5"
          >
            {{ es.progress.link }}
            <svg viewBox="0 0 20 20" class="size-3.5" aria-hidden="true">
              <path
                d="M4 10h11M11 5l5 5-5 5"
                fill="none"
                stroke="currentColor"
                stroke-width="2.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </RouterLink>
        </div>
      </header>
      <div class="guilloche p-5 sm:p-7">
        <ul v-if="stamps.length > 0" class="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
          <li v-for="s in stamps" :key="s.key" class="mx-auto w-full max-w-40">
            <PassportStamp
              :top="s.top"
              :bottom="s.bottom"
              :score="s.score"
              :detail="s.detail"
              :date="s.dateLabel"
              :tone="s.tone"
              :rotate="s.rotate"
              :label="s.label"
            />
          </li>
        </ul>
        <div
          v-else
          class="flex flex-col items-center gap-4 py-2 text-center sm:flex-row sm:text-left"
        >
          <div class="flex -space-x-6" aria-hidden="true">
            <span
              class="grid size-24 -rotate-6 place-items-center rounded-full border-[3px] border-dashed border-cobalt-ink/40 font-display text-2xl font-extrabold text-cobalt-ink/40"
              >?</span
            >
            <span
              class="grid size-24 rotate-6 place-items-center rounded-full border-[3px] border-dashed border-pink-ink/40 font-display text-2xl font-extrabold text-pink-ink/40"
              >?</span
            >
          </div>
          <p class="max-w-sm text-ink-soft">{{ es.home.noStamps }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.poster {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 2.5px solid var(--color-ink);
  border-radius: 1.4rem;
  box-shadow: 7px 7px 0 0 var(--color-shadow);
  transition:
    rotate 300ms ease,
    transform 300ms ease,
    box-shadow 300ms ease;
}

.poster:hover {
  rotate: 0deg;
  transform: translate(-2px, -3px);
  box-shadow: 10px 10px 0 0 var(--color-shadow);
}

.poster:active {
  transform: translate(4px, 4px);
  box-shadow: 2px 2px 0 0 var(--color-shadow);
}

.poster-strip {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  border-bottom: 2.5px solid var(--color-ink);
  padding: 0.5rem 1rem;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-paper-light);
}

.poster-cta {
  margin-top: 1.1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 2px solid var(--color-ink);
  border-radius: 0.8rem;
  background: var(--color-paper-light);
  padding: 0.55rem 1.1rem;
  font-weight: 800;
  color: var(--color-ink);
  box-shadow: 3px 3px 0 0 var(--color-shadow);
  transition: background-color 200ms ease;
}

.poster:hover .poster-cta {
  background: var(--color-pink);
}

/* Fondo de seguridad de pasaporte (guilloché) */
.guilloche {
  background-image:
    repeating-radial-gradient(
      circle at 0% 100%,
      transparent 0 11px,
      rgb(47 79 209 / 0.07) 11px 12px
    ),
    repeating-radial-gradient(
      circle at 100% 0%,
      transparent 0 15px,
      rgb(255 95 162 / 0.08) 15px 16px
    );
}
</style>
