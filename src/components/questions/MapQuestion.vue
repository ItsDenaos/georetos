<script setup lang="ts">
/**
 * Una pregunta de mapa: "Encuentra X", hasta 3 intentos, aviso "Eso es…" al
 * fallar y, si se agotan los intentos o se salta, el país parpadea en el mapa.
 * La usan "Ubica el país" y el Reto diario.
 *
 * Emite `attempt` en cada toque equivocado (para guardar el progreso), `resolved`
 * cuando la pregunta termina y `advance` cuando toca pasar a la siguiente.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import AtlasPlate from '@/components/brand/AtlasPlate.vue'
import InkStamp from '@/components/brand/InkStamp.vue'
import FlagImage from '@/components/FlagImage.vue'
import StatusIcon from '@/components/StatusIcon.vue'
import WorldMap from '@/components/WorldMap.vue'
import { useAnnouncer } from '@/composables/useAnnouncer'
import { es } from '@/i18n/es'
import { getCountry } from '@/lib/countries'
import { evaluateGuess } from '@/lib/locate'
import type { MapColor } from '@/lib/map'
import type { AnswerMark } from '@/lib/results'
import { MAX_ATTEMPTS, locatePoints } from '@/lib/scoring'
import type { RegionId } from '@/lib/types'

const props = withDefaults(
  defineProps<{
    target: string
    region: RegionId
    /** Países que se pueden tocar; el resto se atenúa. */
    active: readonly string[]
    /** Países ya respondidos en la partida, pintados con su color. */
    answered?: Readonly<Record<string, MapColor>>
    /** Posición de la pregunta (1 = primera) y total (sin total en partidas sin fin). */
    position: number
    total?: number
    /** Toques equivocados ya hechos (al reanudar una partida guardada). */
    initialAttempts?: number
    /** "fast" acorta las pausas tras acertar o fallar (Contrarreloj). */
    pace?: 'normal' | 'fast'
  }>(),
  { answered: () => ({}), initialAttempts: 0, pace: 'normal' },
)

const emit = defineEmits<{
  attempt: [attemptsUsed: number]
  resolved: [result: { mark: AnswerMark; attempt: number | null }]
  advance: []
}>()

const WRONG_FLASH = 1400
const CORRECT_DELAY = props.pace === 'fast' ? 350 : 800
const REVEAL_DELAY = props.pace === 'fast' ? 1300 : 3400

const { announce } = useAnnouncer()

const attemptsUsed = ref(Math.min(props.initialAttempts, MAX_ATTEMPTS - 1))
const phase = ref<'playing' | 'correct' | 'revealing'>('playing')
const showFlag = ref(false)
/** País equivocado que se marca un momento en rojo. */
const wrongFlash = ref<string | null>(null)
const toast = ref<{ text: string; kind: 'ok' | 'meh' | 'fail' } | null>(null)
const toastKey = ref(0)

let flashTimer: ReturnType<typeof setTimeout> | undefined
let advanceTimer: ReturnType<typeof setTimeout> | undefined

const country = computed(() => getCountry(props.target))
const attemptsLeft = computed(() => MAX_ATTEMPTS - attemptsUsed.value)
const revealing = computed(() => phase.value === 'revealing')

const highlights = computed(() => {
  const result: Record<string, MapColor> = { ...props.answered }
  if (phase.value === 'correct') result[props.target] = attemptsUsed.value === 0 ? 'ok' : 'meh'
  if (revealing.value) result[props.target] = 'focus'
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

function scheduleAdvance(delay: number) {
  clearTimeout(advanceTimer)
  advanceTimer = setTimeout(advance, delay)
}

function advance() {
  clearTimeout(advanceTimer)
  emit('advance')
}

function reveal(prefix?: string) {
  phase.value = 'revealing'
  emit('resolved', { mark: 'fail', attempt: null })
  const name = country.value?.name ?? ''
  const text = es.locate.revealed(name)
  showToast(prefix ? `${prefix}. ${text}` : text, 'fail')
  announce(`${prefix ? `${prefix}. ` : ''}${es.locate.announceFailed(name)}`)
  scheduleAdvance(REVEAL_DELAY)
}

function onSelect(code: string) {
  if (phase.value !== 'playing') return
  const outcome = evaluateGuess(props.target, code, attemptsUsed.value)
  const name = getCountry(code)?.name ?? code
  if (outcome.kind === 'correct') {
    phase.value = 'correct'
    emit('resolved', { mark: outcome.attempt === 1 ? 'ok' : 'meh', attempt: outcome.attempt })
    const text = es.locate.correct(locatePoints(outcome.attempt))
    showToast(text, outcome.attempt === 1 ? 'ok' : 'meh')
    announce(text)
    scheduleAdvance(CORRECT_DELAY)
  } else if (outcome.kind === 'wrong') {
    attemptsUsed.value += 1
    emit('attempt', attemptsUsed.value)
    flashWrong(code)
    showToast(es.locate.thatIs(name), 'fail')
    announce(es.locate.announceWrong(name, outcome.attemptsLeft))
  } else {
    attemptsUsed.value = MAX_ATTEMPTS
    flashWrong(code)
    reveal(es.locate.thatIs(name))
  }
}

/** Saltar cuenta como fallo. */
function skip() {
  if (phase.value !== 'playing') return
  attemptsUsed.value = MAX_ATTEMPTS
  reveal()
}

onMounted(() => {
  if (country.value) announce(es.locate.announceTarget(country.value.name))
})

onBeforeUnmount(() => {
  clearTimeout(flashTimer)
  clearTimeout(advanceTimer)
})
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <!-- País a encontrar, pista e intentos -->
    <div class="flex items-end gap-3 px-4 pt-1 pb-2.5">
      <div class="min-w-0 flex-1">
        <p class="label-mono text-cobalt-ink">
          {{ es.locate.find }} ·
          <template v-if="total">
            <span aria-hidden="true">{{ es.locate.progress(position, total) }}</span>
            <span class="sr-only">{{ es.locate.progressLabel(position, total) }}</span>
          </template>
          <template v-else>{{ es.locate.countryNumber(position) }}</template>
        </p>
        <h1
          class="animate-rise truncate font-display text-[2.1rem] leading-[1.05] font-extrabold sm:text-5xl"
        >
          {{ country?.name }}
        </h1>
      </div>
      <FlagImage
        v-if="showFlag && country"
        :code="country.code"
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
            :class="i > attemptsLeft && 'opacity-35'"
          >
            <path
              d="M10 25C9 21 2 17 2 10a8 8 0 1 1 16 0c0 7-7 11-8 15z"
              :fill="i <= attemptsLeft ? 'var(--color-pink)' : 'none'"
              stroke="var(--color-ink)"
              stroke-width="2"
              :stroke-dasharray="i <= attemptsLeft ? undefined : '3 2.5'"
              stroke-linejoin="round"
            />
            <circle
              cx="10"
              cy="10"
              r="3"
              :fill="i <= attemptsLeft ? 'var(--color-paper-light)' : 'none'"
              stroke="var(--color-ink)"
              stroke-width="1.6"
            />
          </svg>
        </div>
        <span class="font-mono text-[0.68rem] font-semibold text-ink-soft">
          {{ es.locate.attemptsLeft(attemptsLeft) }}
        </span>
      </div>
    </div>

    <!-- Mapa -->
    <AtlasPlate class="mx-3 min-h-0 flex-1" :caption="`${es.map.plate} · ${es.regions[region]}`">
      <WorldMap
        :region="region"
        :active="active"
        :highlights="highlights"
        :focus="revealing ? target : null"
        :blink="revealing ? target : null"
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
        <button v-if="revealing" type="button" class="btn-primary flex-1" @click="advance">
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
            :disabled="phase !== 'playing'"
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
          <button type="button" class="btn-ghost" :disabled="phase !== 'playing'" @click="skip">
            {{ es.locate.skip }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
