<script setup lang="ts">
/**
 * Progreso como una ruta de viaje: cada parada es una pregunta o un país, y el
 * avión marca la actual. Acierto, acierto tardío y fallo usan formas distintas
 * (círculo, círculo con raya, rombo con aspa), no solo colores. Decorativo: el
 * progreso en texto lo da quien lo usa.
 */
import { computed } from 'vue'

import type { StopMark } from './types'

const props = defineProps<{ total: number; current: number; marks: readonly StopMark[] }>()

/** Con muchas paradas se dibuja una barra continua en lugar de puntos. */
const MAX_STOPS = 24

const compact = computed(() => props.total > MAX_STOPS)
const progress = computed(() =>
  props.total <= 1 ? 0 : Math.min(1, props.current / (props.total - 1)),
)
const barProgress = computed(() =>
  props.total === 0 ? 0 : Math.min(1, props.current / props.total),
)
</script>

<template>
  <div class="route" aria-hidden="true">
    <!-- Paradas -->
    <div v-if="!compact" class="relative flex h-7 items-center justify-between px-0.5">
      <div
        class="absolute inset-x-2 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-ink/35"
      />
      <div
        class="absolute left-2 top-1/2 -translate-y-1/2 border-t-[3px] border-ink transition-[width] duration-500"
        :style="{ width: `calc((100% - 1rem) * ${progress})` }"
      />
      <template v-for="i in total" :key="i">
        <span v-if="i - 1 === current" class="stop-current">
          <svg viewBox="0 0 24 24" class="size-4">
            <path
              d="M3 11.5L21 4l-5 16-4.5-6.5z"
              fill="var(--color-paper-light)"
              stroke="var(--color-ink)"
              stroke-width="1.8"
              stroke-linejoin="round"
            />
            <path d="M11.5 13.5L21 4" stroke="var(--color-ink)" stroke-width="1.4" />
          </svg>
        </span>
        <span v-else-if="marks[i - 1] === 'ok'" class="stop bg-jade">
          <svg viewBox="0 0 12 12" class="size-2.5">
            <path
              d="M2.5 6.2l2.2 2.2L9.5 3.6"
              fill="none"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span v-else-if="marks[i - 1] === 'meh'" class="stop bg-sun">
          <svg viewBox="0 0 12 12" class="size-2.5">
            <path d="M3 6h6" stroke="var(--color-ink)" stroke-width="2" stroke-linecap="round" />
          </svg>
        </span>
        <span v-else-if="marks[i - 1] === 'fail'" class="stop stop-fail bg-tomato">
          <svg viewBox="0 0 12 12" class="size-2.5 -rotate-45">
            <path
              d="M3.5 3.5l5 5M8.5 3.5l-5 5"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </span>
        <span v-else class="stop bg-paper-light" :class="{ 'opacity-60': i - 1 > current }" />
      </template>
    </div>

    <!-- Barra continua para partidas largas -->
    <div v-else class="relative h-7">
      <div
        class="absolute inset-x-0 top-1/2 flex h-3 -translate-y-1/2 overflow-hidden rounded-full border-2 border-ink bg-paper-light"
      >
        <span
          v-for="i in total"
          :key="i"
          class="h-full flex-1"
          :class="{
            'bg-jade': marks[i - 1] === 'ok',
            'bg-sun': marks[i - 1] === 'meh',
            'bg-tomato': marks[i - 1] === 'fail',
          }"
        />
      </div>
      <span
        class="stop-current absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-500"
        :style="{ left: `${barProgress * 100}%` }"
      >
        <svg viewBox="0 0 24 24" class="size-4">
          <path
            d="M3 11.5L21 4l-5 16-4.5-6.5z"
            fill="var(--color-paper-light)"
            stroke="var(--color-ink)"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </div>
  </div>
</template>

<style scoped>
.stop {
  position: relative;
  display: grid;
  place-items: center;
  width: 0.95rem;
  height: 0.95rem;
  border: 2px solid var(--color-ink);
  border-radius: 9999px;
  flex-shrink: 0;
}

.stop-fail {
  border-radius: 3px;
  transform: rotate(45deg);
  width: 0.85rem;
  height: 0.85rem;
}

.stop-current {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  flex-shrink: 0;
  border: 2px solid var(--color-ink);
  border-radius: 9999px;
  background: var(--color-cobalt);
  box-shadow: 2px 2px 0 0 var(--color-ink);
}

.stop-current::after {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 9999px;
  border: 2px solid var(--color-cobalt);
  opacity: 0;
  animation: ping 1.8s ease-out infinite;
}

@keyframes ping {
  0% {
    transform: scale(0.7);
    opacity: 0.7;
  }
  100% {
    transform: scale(1.25);
    opacity: 0;
  }
}
</style>
