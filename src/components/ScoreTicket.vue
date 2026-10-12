<script setup lang="ts">
/** Boleto con los puntos; al sumar, el boleto da un salto y aparece "+n". */
import { ref, watch } from 'vue'

import { es } from '@/i18n/es'

const props = defineProps<{ score: number }>()

const gained = ref(0)
const bumpKey = ref(0)

watch(
  () => props.score,
  (now, before) => {
    if (now > before) {
      gained.value = now - before
      bumpKey.value += 1
    }
  },
)
</script>

<template>
  <span class="relative inline-flex">
    <span
      :key="bumpKey"
      class="inline-flex items-center gap-1.5 rounded-lg border-2 border-ink bg-sun px-2.5 py-0.5 font-mono text-sm font-semibold shadow-ink-sm"
      :class="bumpKey > 0 && 'animate-pop'"
    >
      <svg viewBox="0 0 16 16" class="size-3.5" aria-hidden="true">
        <path
          d="M8 1.5l1.9 4 4.4.5-3.3 3 .9 4.3L8 11.1l-3.9 2.2.9-4.3-3.3-3 4.4-.5z"
          fill="var(--color-ink)"
        />
      </svg>
      {{ es.locate.pointsShort(score) }}
    </span>
    <span
      v-if="bumpKey > 0"
      :key="`g${bumpKey}`"
      class="gain pointer-events-none absolute -top-3 right-1 font-mono text-sm font-semibold text-jade-ink"
      aria-hidden="true"
      >+{{ gained }}</span
    >
  </span>
</template>

<style scoped>
.gain {
  animation: gain 900ms ease-out forwards;
}

@keyframes gain {
  0% {
    transform: translateY(6px);
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  100% {
    transform: translateY(-14px);
    opacity: 0;
  }
}
</style>
