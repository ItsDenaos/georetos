<script setup lang="ts">
/**
 * Presentación del desafío al abrir su link: quién desafía, a qué partida y con
 * qué resultado. Si el link está dañado, se puede jugar igual sin comparar.
 */
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

import InkStamp from '@/components/brand/InkStamp.vue'
import RouteProgress from '@/components/brand/RouteProgress.vue'
import { es } from '@/i18n/es'
import type { Challenge } from '@/lib/challenge'
import type { RecordLabel } from '@/lib/recordLabels'

defineProps<{ challenge: Challenge | null; label: RecordLabel | null; endless: boolean }>()
const emit = defineEmits<{ accept: [] }>()

const button = ref<HTMLButtonElement | null>(null)
onMounted(() => button.value?.focus())
</script>

<template>
  <div class="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 pt-8 pb-14 sm:pt-12">
    <article
      v-if="challenge && label"
      class="postcard relative animate-rise"
      aria-labelledby="desafio-titulo"
    >
      <header class="border-b-2 border-dashed border-ink/40 px-5 py-3 pr-28">
        <p class="label-mono text-ink-soft">
          {{ label.title }} · {{ label.regionLabel }} · {{ label.level }}
        </p>
      </header>
      <div class="px-5 pt-5 pb-6">
        <h1
          id="desafio-titulo"
          class="pr-16 font-display text-[2.4rem] leading-none font-extrabold break-words sm:text-5xl"
        >
          {{ es.challenge.from(challenge.name) }}
        </h1>

        <div class="mt-5 flex items-end gap-5">
          <p class="font-display text-6xl leading-none font-extrabold" aria-hidden="true">
            <template v-if="label.classic">
              {{ challenge.score
              }}<span class="text-2xl text-ink-soft">/{{ challenge.maxScore }}</span>
            </template>
            <template v-else>{{ challenge.score }}</template>
          </p>
          <dl class="grid grid-cols-2 gap-x-4 pb-1">
            <dt class="label-mono text-ink-soft">{{ es.challenge.correctLabel }}</dt>
            <dt class="label-mono text-ink-soft">{{ es.challenge.timeLabel }}</dt>
            <dd class="font-mono font-semibold">
              {{ es.challenge.correctOf(challenge.correct, challenge.total) }}
            </dd>
            <dd class="font-mono font-semibold">{{ es.format.duration(challenge.timeMs) }}</dd>
          </dl>
        </div>
        <span class="sr-only">{{ label.scoreLabel }}</span>

        <RouteProgress
          v-if="challenge.marks.length"
          class="mt-4"
          :total="challenge.marks.length"
          :current="challenge.marks.length"
          :marks="challenge.marks"
        />

        <p class="mt-5 font-display text-2xl font-extrabold">{{ es.challenge.question }}</p>
        <p class="mt-1 text-ink-soft">
          {{ endless ? es.challenge.sameQuestionsSurvival : es.challenge.sameQuestions }}
        </p>
        <p
          v-if="!challenge.sameVersion"
          class="mt-3 rounded-xl border-2 border-ink bg-tomato-light px-3 py-2 text-sm text-ink"
          role="note"
        >
          {{ es.challenge.otherVersion }}
        </p>
      </div>
      <InkStamp tone="pink" :rotate="9" class="absolute top-3 right-3" aria-hidden="true">
        {{ es.challenge.kicker }}
      </InkStamp>
    </article>

    <article v-else class="postcard animate-rise p-5" role="alert">
      <p class="label-mono text-pink-ink">{{ es.challenge.kicker }}</p>
      <p class="mt-2 text-lg">{{ es.challenge.invalid }}</p>
    </article>

    <div class="flex flex-col gap-3 sm:flex-row">
      <button ref="button" type="button" class="btn-primary flex-1 text-lg" @click="emit('accept')">
        {{ challenge ? es.challenge.accept : es.challenge.playAnyway }}
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
      <RouterLink to="/" class="btn-ghost">{{ es.challenge.decline }}</RouterLink>
    </div>
  </div>
</template>

<style scoped>
/* Postal: papel con un rayado diagonal tenue */
.postcard {
  border: 2.5px solid var(--color-ink);
  border-radius: 1.3rem;
  background-color: var(--color-paper-light);
  background-image: repeating-linear-gradient(
    -45deg,
    transparent 0 14px,
    color-mix(in srgb, var(--color-pink) 7%, transparent) 14px 15px
  );
  box-shadow: 7px 7px 0 0 var(--color-shadow);
  rotate: -0.6deg;
}
</style>
