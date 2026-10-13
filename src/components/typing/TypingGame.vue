<script setup lang="ts">
/**
 * "Escribe los países": se escriben nombres y cada acierto se pinta al instante
 * en el mapa, sin Enter. Al terminar, los que faltaron quedan en rojo y se
 * pueden tocar en el mapa o en la lista para ver dónde están.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import AtlasPlate from '@/components/brand/AtlasPlate.vue'
import InkStamp from '@/components/brand/InkStamp.vue'
import FlagImage from '@/components/FlagImage.vue'
import StatusIcon from '@/components/StatusIcon.vue'
import WorldMap from '@/components/WorldMap.vue'
import { useAnnouncer } from '@/composables/useAnnouncer'
import { es } from '@/i18n/es'
import { getCountry, playableIn } from '@/lib/countries'
import type { MapColor } from '@/lib/map'
import type { GameResult } from '@/lib/results'
import { PREFIX_WAIT_MS, type Carry, type TypedResult, type TypingConfig } from '@/lib/typing'
import { finishGame } from '@/stores/stats'
import { useResultStore } from '@/stores/result'
import { useTypingStore } from '@/stores/typing'

const props = defineProps<{ config: TypingConfig }>()

/** Tiempo que se ve el aviso bajo el campo. */
const FEEDBACK_MS = 1600
/** Segundos finales en que el reloj se pone en rojo. */
const URGENT_MS = 30_000

const store = useTypingStore()
const router = useRouter()
const { announce } = useAnnouncer()

store.start(props.config)

const input = ref<HTMLInputElement | null>(null)
const text = ref('')
/** Último país aceptado, por si se sigue escribiendo su nombre largo. */
const carry = ref<Carry | null>(null)
const feedback = ref<{ text: string; kind: 'ok' | 'meh' | 'fail' } | null>(null)
const feedbackKey = ref(0)
const shake = ref(false)
/** País recién encontrado, que parpadea un momento. */
const flash = ref<string | null>(null)
/** Al terminar: país tocado en el mapa o en la lista. */
const picked = ref<string | null>(null)
/** País de la lista al que se hace zoom. */
const zoomTo = ref<string | null>(null)
const result = ref<GameResult | null>(null)

let ticker: ReturnType<typeof setInterval> | undefined
let waitTimer: ReturnType<typeof setTimeout> | undefined
let feedbackTimer: ReturnType<typeof setTimeout> | undefined
let flashTimer: ReturnType<typeof setTimeout> | undefined

const regionName = es.regions[props.config.region]
const active = playableIn(props.config.region).map((c) => c.code)
const clock = computed(() => es.format.countdown(store.timeLeft))
const urgent = computed(() => !store.finished && store.timeLeft <= URGENT_MS)
const recent = computed(() => [...store.found].reverse())

const highlights = computed(() => {
  const marks: Record<string, MapColor> = {}
  for (const code of store.found) marks[code] = 'ok'
  if (store.finished) for (const code of store.missing) marks[code] = 'fail'
  return marks
})

function nameOf(code: string) {
  return getCountry(code)?.name ?? code
}

function showFeedback(message: string, kind: 'ok' | 'meh' | 'fail') {
  feedback.value = { text: message, kind }
  feedbackKey.value += 1
  clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => (feedback.value = null), FEEDBACK_MS)
}

function take(code: string, typed: string) {
  if (!store.accept(code)) return
  carry.value = { code, text: typed }
  text.value = ''
  const name = nameOf(code)
  showFeedback(es.typing.found(name), 'ok')
  announce(es.typing.announceFound(name, store.found.length, store.total))
  flash.value = code
  clearTimeout(flashTimer)
  flashTimer = setTimeout(() => (flash.value = null), FEEDBACK_MS)
}

/** `now`: aceptar aunque el nombre sea el comienzo de otro (Enter o fin de la espera). */
function handle(read: TypedResult | null, now: boolean) {
  if (!read || store.finished) return
  switch (read.kind) {
    case 'match':
      take(read.code, read.text)
      return
    case 'wait':
      if (now) take(read.code, read.text)
      else
        waitTimer = setTimeout(
          () => handle(store.read(text.value, carry.value), true),
          PREFIX_WAIT_MS,
        )
      return
    case 'absorb':
      // Terminó de escribir el nombre largo del que acaba de acertar.
      text.value = ''
      if (carry.value) carry.value = { code: carry.value.code, text: read.text }
      return
    case 'continuing':
      return
    case 'repeat':
      carry.value = null
      showFeedback(es.typing.repeat(nameOf(read.code)), 'meh')
      return
    case 'outside':
      carry.value = null
      showFeedback(es.typing.outside(nameOf(read.code), regionName), 'fail')
      return
    case 'none':
      if (text.value.trim()) carry.value = null
  }
}

// Se lee el valor en cada evento (sin v-model): en Android el teclado "compone"
// cada palabra y v-model no avisaría hasta terminarla.
function onInput(event: Event) {
  text.value = (event.target as HTMLInputElement).value
  clearTimeout(waitTimer)
  handle(store.read(text.value, carry.value), false)
}

function onEnter() {
  clearTimeout(waitTimer)
  const read = store.read(text.value, carry.value)
  if (read?.kind === 'match' || read?.kind === 'wait') handle(read, true)
  else if (text.value.trim()) {
    shake.value = false
    void nextTick(() => (shake.value = true))
  }
}

function giveUp() {
  store.giveUp()
}

/**
 * Al terminar, tocar un país en el mapa muestra su nombre; en la lista, además
 * hace zoom (y tocarlo otra vez vuelve a la región).
 */
function pick(code: string, zoom = false) {
  if (!store.finished) return
  if (zoom && zoomTo.value === code) {
    zoomTo.value = null
    picked.value = null
    return
  }
  picked.value = code
  if (zoom) zoomTo.value = code
  announce(nameOf(code))
}

function seeResults() {
  if (!result.value) return
  useResultStore().set(result.value)
  void router.push({ name: 'results' })
}

watch(
  () => store.finished,
  (finished) => {
    if (!finished) return
    clearInterval(ticker)
    clearTimeout(waitTimer)
    flash.value = null
    if (store.endReason) announce(es.typing.ends[store.endReason])
    const partial = store.buildResult()
    // Se guarda al terminar, aunque no se abra la pantalla de resultados.
    if (partial) result.value = finishGame(partial)
  },
)

onMounted(() => {
  ticker = setInterval(() => store.tick(), 250)
  input.value?.focus()
})

onBeforeUnmount(() => {
  clearInterval(ticker)
  clearTimeout(waitTimer)
  clearTimeout(feedbackTimer)
  clearTimeout(flashTimer)
})
</script>

<template>
  <div class="flex h-[calc(100dvh-3.75rem)] flex-col">
    <!-- Contador, reloj y "Me rindo" -->
    <div class="flex items-center gap-3 px-4 pt-3 pb-1">
      <div class="min-w-0 flex-1">
        <p class="label-mono truncate text-ink-soft">{{ regionName }}</p>
        <p class="font-display text-[2rem] leading-none font-extrabold">
          <span aria-hidden="true"
            >{{ store.found.length
            }}<span class="text-xl text-ink-soft">/{{ store.total }}</span></span
          >
          <span class="sr-only">{{ es.typing.counterLabel(store.found.length, store.total) }}</span>
        </p>
      </div>
      <span
        role="timer"
        :aria-label="es.typing.clockLabel(clock)"
        class="rounded-full border-2 border-ink px-3 py-1 font-mono text-lg font-semibold tabular-nums shadow-ink-sm"
        :class="urgent ? 'bg-tomato-light text-tomato-ink' : 'bg-paper-light'"
        >{{ clock }}</span
      >
      <button v-if="!store.finished" type="button" class="btn-ghost" @click="giveUp">
        {{ es.typing.giveUp }}
      </button>
    </div>

    <!-- Campo para escribir -->
    <div v-if="!store.finished" class="px-4 pt-2">
      <label for="escribe-pais" class="sr-only">{{ es.typing.inputLabel }}</label>
      <input
        id="escribe-pais"
        ref="input"
        :value="text"
        type="text"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        enterkeyhint="done"
        :placeholder="es.typing.placeholder"
        aria-describedby="escribe-ayuda"
        class="w-full rounded-xl border-[2.5px] border-ink bg-paper-light px-4 py-3 text-lg font-semibold shadow-ink placeholder:font-normal placeholder:text-ink-soft focus:outline-3 focus:outline-offset-2 focus:outline-pink"
        :class="shake && 'animate-shake'"
        @input="onInput"
        @keydown.enter.prevent="onEnter"
        @animationend="shake = false"
      />
      <p id="escribe-ayuda" class="mt-1.5 min-h-5 font-mono text-[0.7rem] text-ink-soft">
        <span
          v-if="feedback"
          :key="feedbackKey"
          class="inline-flex animate-pop items-center gap-1 font-semibold"
          :class="{
            'text-jade-ink': feedback.kind === 'ok',
            'text-sun-ink': feedback.kind === 'meh',
            'text-tomato-ink': feedback.kind === 'fail',
          }"
          aria-hidden="true"
        >
          <StatusIcon :kind="feedback.kind" class="size-4" />{{ feedback.text }}
        </span>
        <template v-else>{{ es.typing.inputHint }}</template>
      </p>
    </div>

    <!-- Mapa -->
    <AtlasPlate class="mx-3 mt-1 min-h-40 flex-1" :caption="`${es.map.plate} · ${regionName}`">
      <WorldMap
        :region="config.region"
        :active="active"
        :highlights="highlights"
        :focus="zoomTo"
        :blink="store.finished ? picked : flash"
        @select="pick"
      />
      <div
        v-if="store.finished"
        class="pointer-events-none absolute inset-x-0 top-3 flex justify-center pr-14 pl-3"
      >
        <InkStamp
          v-if="picked"
          :key="picked"
          :tone="store.foundSet.has(picked) ? 'ok' : 'fail'"
          :rotate="-3"
          class="max-w-full"
          aria-hidden="true"
        >
          <StatusIcon :kind="store.foundSet.has(picked) ? 'ok' : 'fail'" class="size-5" />
          {{ nameOf(picked) }}
        </InkStamp>
        <InkStamp
          v-else-if="store.endReason"
          :tone="store.endReason === 'complete' ? 'ok' : 'brand'"
          :rotate="-5"
          size="lg"
        >
          {{ es.typing.ends[store.endReason] }}
        </InkStamp>
      </div>
    </AtlasPlate>

    <!-- Encontrados (durante la partida) o los que faltaron (al terminar) -->
    <div class="flex flex-col gap-2 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <template v-if="!store.finished">
        <p class="label-mono text-ink-soft">{{ es.typing.foundHeading }}</p>
        <ul
          v-if="recent.length"
          class="flex max-h-[4.5rem] flex-wrap gap-1.5 overflow-y-auto"
          :aria-label="es.typing.foundHeading"
        >
          <li
            v-for="code in recent"
            :key="code"
            class="flex animate-pop items-center gap-1.5 rounded-full border-2 border-ink bg-jade-light py-0.5 pr-2.5 pl-1 text-sm font-semibold"
          >
            <FlagImage :code="code" alt="" class="h-4 rounded-sm border border-ink" />
            {{ nameOf(code) }}
          </li>
        </ul>
        <p v-else class="text-sm text-ink-soft">{{ es.typing.foundEmpty }}</p>
      </template>

      <template v-else>
        <ul
          class="flex flex-wrap justify-center gap-x-4 gap-y-1 font-mono text-[0.68rem] font-semibold text-ink-soft"
        >
          <li class="flex items-center gap-1">
            <StatusIcon kind="ok" class="size-4" />{{ es.typing.legendFound }}
          </li>
          <li class="flex items-center gap-1">
            <StatusIcon kind="fail" class="size-4" />{{ es.typing.legendMissing }}
          </li>
          <li>{{ es.typing.tapHint }}</li>
        </ul>
        <template v-if="store.missing.length">
          <p class="label-mono text-tomato-ink">
            {{ es.typing.missingHeading(store.missing.length) }}
          </p>
          <ul class="flex max-h-[5.5rem] flex-wrap gap-1.5 overflow-y-auto">
            <li v-for="code in store.missing" :key="code">
              <button
                type="button"
                class="flex items-center gap-1.5 rounded-full border-2 border-ink bg-tomato-light py-0.5 pr-2.5 pl-1 text-sm font-semibold text-ink"
                :aria-pressed="zoomTo === code"
                @click="pick(code, true)"
              >
                <FlagImage :code="code" alt="" class="h-4 rounded-sm border border-ink" />
                {{ nameOf(code) }}
              </button>
            </li>
          </ul>
        </template>
        <button type="button" class="btn-primary mx-auto w-full max-w-md" @click="seeResults">
          {{ es.typing.seeResults }}
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
      </template>
    </div>
  </div>
</template>
