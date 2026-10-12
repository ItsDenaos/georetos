<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import AtlasPlate from '@/components/brand/AtlasPlate.vue'
import InkStamp from '@/components/brand/InkStamp.vue'
import RouteProgress from '@/components/brand/RouteProgress.vue'
import type { StopMark } from '@/components/brand/types'
import FlagImage from '@/components/FlagImage.vue'
import ScoreTicket from '@/components/ScoreTicket.vue'
import StatusIcon from '@/components/StatusIcon.vue'
import WorldMap from '@/components/WorldMap.vue'
import { useAnnouncer } from '@/composables/useAnnouncer'
import { es } from '@/i18n/es'
import { getCountry, playableIn } from '@/lib/countries'
import type { LocateConfig } from '@/lib/locate'
import type { MapColor } from '@/lib/map'
import { MAX_ATTEMPTS } from '@/lib/scoring'
import { useLocateStore, type LocateMark } from '@/stores/locate'
import { useProgressStore } from '@/stores/progress'
import { useResultStore } from '@/stores/result'

const props = defineProps<{ config: LocateConfig }>()

const CORRECT_DELAY = 800
const WRONG_FLASH = 1400
const REVEAL_DELAY = 3400

const store = useLocateStore()
const router = useRouter()
const { announce } = useAnnouncer()

store.start(props.config)

const showFlag = ref(false)
/** País equivocado que se marca un momento en rojo. */
const wrongFlash = ref<string | null>(null)
const toast = ref<{ text: string; kind: 'ok' | 'meh' | 'fail' } | null>(null)
const toastKey = ref(0)

let flashTimer: ReturnType<typeof setTimeout> | undefined
let advanceTimer: ReturnType<typeof setTimeout> | undefined

const target = computed(() => (store.target ? getCountry(store.target) : undefined))
const active = computed(() => playableIn(props.config.region).map((c) => c.code))
const revealing = computed(() => store.phase === 'revealing')
const position = computed(() => Math.min(store.index + 1, store.total))

const MARK_TO_STOP: Record<LocateMark, StopMark> = { first: 'ok', later: 'meh', failed: 'fail' }
const stops = computed<StopMark[]>(() =>
  store.queue.map((code) => {
    const mark = store.marks[code]
    return mark ? MARK_TO_STOP[mark] : null
  }),
)

const highlights = computed(() => {
  const result: Record<string, MapColor> = {}
  for (const [code, mark] of Object.entries(store.marks)) {
    result[code] = mark === 'first' ? 'ok' : mark === 'later' ? 'meh' : 'fail'
  }
  if (revealing.value && store.target) result[store.target] = 'focus'
  if (wrongFlash.value) result[wrongFlash.value] = 'wrong'
  return result
})

function showToast(text: string, kind: 'ok' | 'meh' | 'fail') {
  toast.value = { text, kind }
  toastKey.value += 1
}

function flashWrong(code: string) {
  wrongFlash.value = code
  clearTimeout(flashTimer)
  flashTimer = setTimeout(() => (wrongFlash.value = null), WRONG_FLASH)
}

function scheduleNext(delay: number) {
  clearTimeout(advanceTimer)
  advanceTimer = setTimeout(goNext, delay)
}

function onSelect(code: string) {
  const outcome = store.guess(code)
  if (!outcome) return
  const name = getCountry(code)?.name ?? code
  if (outcome.kind === 'correct') {
    const text = es.locate.correct(outcome.points)
    showToast(text, outcome.attempt === 1 ? 'ok' : 'meh')
    announce(text)
    scheduleNext(CORRECT_DELAY)
  } else if (outcome.kind === 'wrong') {
    flashWrong(code)
    showToast(es.locate.thatIs(name), 'fail')
    announce(es.locate.announceWrong(name, outcome.attemptsLeft))
  } else {
    flashWrong(code)
    reveal(es.locate.thatIs(name))
  }
}

function reveal(prefix?: string) {
  const name = target.value?.name ?? ''
  const text = es.locate.revealed(name)
  showToast(prefix ? `${prefix}. ${text}` : text, 'fail')
  announce(`${prefix ? `${prefix}. ` : ''}${es.locate.announceFailed(name)}`)
  scheduleNext(REVEAL_DELAY)
}

function skip() {
  if (store.skip()) reveal()
}

function goNext() {
  clearTimeout(advanceTimer)
  store.next()
}

watch(
  () => store.target,
  (code) => {
    showFlag.value = false
    const name = code ? getCountry(code)?.name : undefined
    if (name) announce(es.locate.announceTarget(name))
  },
  { immediate: true },
)

watch(
  () => store.phase,
  (phase) => {
    if (phase !== 'finished') return
    const partial = store.buildResult()
    if (!partial) return
    useResultStore().set(useProgressStore().register(partial))
    void router.push({ name: 'results' })
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  clearTimeout(flashTimer)
  clearTimeout(advanceTimer)
})
</script>

<template>
  <div class="flex h-[calc(100dvh-3.75rem)] flex-col">
    <!-- Cabecera: ruta, puntos y país a encontrar -->
    <div class="flex flex-col gap-1.5 px-4 pt-3 pb-2.5">
      <div class="flex items-center justify-between gap-3">
        <span class="label-mono text-ink-soft">{{ es.locate.route(config.seed) }}</span>
        <ScoreTicket :score="store.score" />
      </div>
      <RouteProgress :total="store.total" :current="store.index" :marks="stops" />
      <p class="sr-only">{{ es.locate.progressLabel(position, store.total) }}</p>
      <div class="flex items-end gap-3 pt-1">
        <div class="min-w-0 flex-1">
          <p class="label-mono text-cobalt">
            {{ es.locate.find }} ·
            <span aria-hidden="true">{{ es.locate.progress(position, store.total) }}</span>
          </p>
          <h1
            :key="store.target ?? ''"
            class="animate-rise truncate font-display text-[2.1rem] leading-[1.05] font-extrabold sm:text-5xl"
          >
            {{ target?.name }}
          </h1>
        </div>
        <FlagImage
          v-if="showFlag && target"
          :code="target.code"
          :alt="es.locate.flagAlt"
          class="h-11 -rotate-3 animate-pop border-2 border-ink sm:h-14"
        />
        <div class="flex flex-col items-end gap-1 pb-1">
          <div class="flex gap-0.5" aria-hidden="true">
            <svg
              v-for="i in MAX_ATTEMPTS"
              :key="i"
              viewBox="0 0 20 26"
              class="h-6 w-5 transition-opacity"
              :class="i > store.attemptsLeft && 'opacity-35'"
            >
              <path
                d="M10 25C9 21 2 17 2 10a8 8 0 1 1 16 0c0 7-7 11-8 15z"
                :fill="i <= store.attemptsLeft ? 'var(--color-pink)' : 'none'"
                stroke="var(--color-ink)"
                stroke-width="2"
                :stroke-dasharray="i <= store.attemptsLeft ? undefined : '3 2.5'"
                stroke-linejoin="round"
              />
              <circle
                cx="10"
                cy="10"
                r="3"
                :fill="i <= store.attemptsLeft ? 'var(--color-paper-light)' : 'none'"
                stroke="var(--color-ink)"
                stroke-width="1.6"
              />
            </svg>
          </div>
          <span class="font-mono text-[0.68rem] font-semibold text-ink-soft">
            {{ es.locate.attemptsLeft(store.attemptsLeft) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Mapa -->
    <AtlasPlate
      class="mx-3 min-h-0 flex-1"
      :caption="`${es.map.plate} · ${es.regions[config.region]}`"
    >
      <WorldMap
        :region="config.region"
        :active="active"
        :highlights="highlights"
        :focus="revealing ? store.target : null"
        :blink="revealing ? store.target : null"
        @select="onSelect"
      />
      <div class="pointer-events-none absolute inset-x-0 top-3 flex justify-center pr-14 pl-3">
        <InkStamp
          v-if="toast"
          :key="toastKey"
          :tone="toast.kind"
          :rotate="toastKey % 2 ? -4 : 3"
          class="max-w-full"
          aria-hidden="true"
        >
          <StatusIcon :kind="toast.kind" class="size-5" />
          {{ toast.text }}
        </InkStamp>
      </div>
    </AtlasPlate>

    <!-- Leyenda y acciones (zona del pulgar) -->
    <div class="flex flex-col gap-2.5 px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <ul
        class="flex flex-wrap justify-center gap-x-4 gap-y-1 font-mono text-[0.68rem] font-semibold text-ink-soft"
      >
        <li class="flex items-center gap-1">
          <StatusIcon kind="ok" class="size-4" />{{ es.locate.legendFirst }}
        </li>
        <li class="flex items-center gap-1">
          <StatusIcon kind="meh" class="size-4" />{{ es.locate.legendLater }}
        </li>
        <li class="flex items-center gap-1">
          <StatusIcon kind="fail" class="size-4" />{{ es.locate.legendFailed }}
        </li>
      </ul>
      <div class="mx-auto flex w-full max-w-md gap-2">
        <button v-if="revealing" type="button" class="btn-primary flex-1" @click="goNext">
          {{ es.locate.next }}
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
        <template v-else>
          <button
            type="button"
            class="btn-secondary flex-1"
            :aria-pressed="showFlag"
            :disabled="store.phase !== 'playing'"
            @click="showFlag = !showFlag"
          >
            <svg viewBox="0 0 20 20" class="size-5" aria-hidden="true">
              <path d="M4 18V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <path
                d="M4 3.5h11l-2.5 3.5L15 10.5H4z"
                :fill="showFlag ? 'var(--color-pink)' : 'var(--color-sun)'"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linejoin="round"
              />
            </svg>
            {{ showFlag ? es.locate.hideFlag : es.locate.showFlag }}
          </button>
          <button
            type="button"
            class="btn-ghost"
            :disabled="store.phase !== 'playing'"
            @click="skip"
          >
            {{ es.locate.skip }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
