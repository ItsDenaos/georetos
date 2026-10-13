<script setup lang="ts">
/**
 * Medalla de un logro, como un sello de tinta con su pictograma. Bloqueada se
 * ve en contorno punteado. Decorativa: el texto lo pone quien la usa.
 */
import { computed } from 'vue'

import type { AchievementId } from '@/lib/achievements'
import type { StampTone } from './types'

const props = withDefaults(defineProps<{ id: AchievementId; done: boolean; rotate?: number }>(), {
  rotate: -6,
})

const TONES: Record<AchievementId, StampTone> = {
  'primer-viaje': 'cobalt',
  'sudamerica-perfecta': 'jade',
  trotamundos: 'pink',
  'mente-enciclopedica': 'tomato',
  'ojo-de-aguila': 'sun',
  'a-la-primera': 'tomato',
  constancia: 'pink',
  coleccionista: 'cobalt',
  cartografo: 'jade',
  maraton: 'sun',
}

/** Pictogramas de trazo en una caja de 24×24. */
const ICONS: Record<AchievementId, string[]> = {
  'primer-viaje': ['M3 11.5 20.5 4l-6 16.5-3.2-6.8z', 'M11.3 13.7 20.5 4'],
  'sudamerica-perfecta': [
    'M12 21.5s6.5-6.3 6.5-11.2a6.5 6.5 0 0 0-13 0c0 4.9 6.5 11.2 6.5 11.2z',
    'M9.2 10.2l2 2 3.8-4',
  ],
  trotamundos: [
    'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18z',
    'M3 12h18',
    'M12 3c3 3 3 15 0 18c-3-3-3-15 0-18',
  ],
  'mente-enciclopedica': [
    'M3 5.5h6a3 3 0 0 1 3 3V20a2.5 2.5 0 0 0-2.5-2.5H3z',
    'M21 5.5h-6a3 3 0 0 0-3 3V20a2.5 2.5 0 0 1 2.5-2.5H21z',
  ],
  'ojo-de-aguila': [
    'M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z',
    'M12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6z',
  ],
  'a-la-primera': [
    'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18z',
    'M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 1 0 0-9z',
    'M12 11a1 1 0 1 0 0 2 1 1 0 1 0 0-2z',
  ],
  constancia: [
    'M12 21.5c3.9 0 6.5-2.8 6.5-6.3 0-4.6-3.6-6.6-4.4-10.7-1.9 2.4-1.4 4.6-2.7 5.7-.9-1.6-2-2.4-2-2.4-1.6 2.6-3.9 4.4-3.9 7.4 0 3.5 2.6 6.3 6.5 6.3z',
  ],
  coleccionista: [
    'M12 2.8a9.2 9.2 0 1 0 0 18.4 9.2 9.2 0 1 0 0-18.4z',
    'M12 7.2l1.4 3 3.2.3-2.4 2.1.7 3.2L12 14.2l-2.9 1.6.7-3.2-2.4-2.1 3.2-.3z',
  ],
  cartografo: ['M3 6.5l6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5z', 'M9 4v13.5', 'M15 6.5V20'],
  maraton: [
    'M7.5 3.5h9V9a4.5 4.5 0 0 1-9 0z',
    'M7.5 5.5H4.5a3 3 0 0 0 3.4 4.3',
    'M16.5 5.5h3a3 3 0 0 1-3.4 4.3',
    'M12 13.5V17',
    'M8 20.5h8',
  ],
}

const tone = computed(() => TONES[props.id])
</script>

<template>
  <svg
    viewBox="0 0 64 64"
    aria-hidden="true"
    class="medal"
    :class="done ? `tone-${tone}` : 'locked'"
    :style="{ rotate: `${rotate}deg` }"
  >
    <circle
      cx="32"
      cy="32"
      r="29"
      class="medal-face"
      stroke="currentColor"
      stroke-width="3"
      :stroke-dasharray="done ? undefined : '5 4'"
    />
    <circle
      cx="32"
      cy="32"
      r="23.5"
      fill="none"
      stroke="currentColor"
      stroke-width="1.2"
      stroke-dasharray="2 2.5"
      :opacity="done ? 1 : 0.6"
    />
    <g
      transform="translate(18 18) scale(1.1667)"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path v-for="(d, i) in ICONS[id]" :key="i" :d="d" />
    </g>
  </svg>
</template>

<style scoped>
.medal {
  display: block;
}
.medal-face {
  fill: var(--medal-fill, transparent);
}
.locked {
  color: var(--color-ink-soft);
  opacity: 0.7;
}
.tone-cobalt {
  color: var(--color-cobalt-ink);
  --medal-fill: var(--color-cobalt-light);
}
.tone-pink {
  color: var(--color-pink-ink);
  --medal-fill: var(--color-pink-light);
}
.tone-jade {
  color: var(--color-jade-ink);
  --medal-fill: var(--color-jade-light);
}
.tone-tomato {
  color: var(--color-tomato-ink);
  --medal-fill: var(--color-tomato-light);
}
.tone-sun {
  color: var(--color-sun-ink);
  --medal-fill: var(--color-sun-light);
}
</style>
