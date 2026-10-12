<script setup lang="ts">
/** Sello circular de pasaporte para un récord, con texto en arco y textura de tinta. */
import { useId } from 'vue'

import type { StampTone } from './types'

withDefaults(
  defineProps<{
    top: string
    bottom: string
    score: string
    detail: string
    date: string
    tone?: StampTone
    rotate?: number
    label: string
  }>(),
  { tone: 'cobalt', rotate: 0 },
)

const id = useId()
</script>

<template>
  <figure class="stamp" :class="`tone-${tone}`" :style="{ rotate: `${rotate}deg` }">
    <svg viewBox="0 0 160 160" role="img" :aria-label="label" class="ink-texture h-auto w-full">
      <defs>
        <path :id="`${id}-top`" d="M18 80a62 62 0 0 1 124 0" />
        <path :id="`${id}-bottom`" d="M10 80a70 70 0 0 0 140 0" />
      </defs>
      <circle cx="80" cy="80" r="76" fill="none" stroke="currentColor" stroke-width="3.5" />
      <circle cx="80" cy="80" r="55" fill="none" stroke="currentColor" stroke-width="1.6" />
      <circle
        cx="80"
        cy="80"
        r="51"
        fill="none"
        stroke="currentColor"
        stroke-width="0.8"
        stroke-dasharray="2 3"
      />
      <g class="font-mono" fill="currentColor" font-weight="600" letter-spacing="1.6">
        <text font-size="10.5" text-anchor="middle">
          <textPath :href="`#${id}-top`" startOffset="50%">{{ top }}</textPath>
        </text>
        <text font-size="9.5" text-anchor="middle">
          <textPath :href="`#${id}-bottom`" startOffset="50%">{{ bottom }}</textPath>
        </text>
      </g>
      <path d="M10 80l3-4 3 4-3 4zM144 80l3-4 3 4-3 4z" fill="currentColor" />
      <text
        x="80"
        y="84"
        text-anchor="middle"
        class="font-display"
        font-size="29"
        font-weight="800"
        fill="currentColor"
      >
        {{ score }}
      </text>
      <text
        x="80"
        y="101"
        text-anchor="middle"
        class="font-mono"
        font-size="8.5"
        font-weight="600"
        letter-spacing="1.2"
        fill="currentColor"
      >
        {{ detail }}
      </text>
      <text
        x="80"
        y="62"
        text-anchor="middle"
        class="font-mono"
        font-size="8"
        font-weight="600"
        letter-spacing="1.2"
        fill="currentColor"
      >
        {{ date }}
      </text>
    </svg>
  </figure>
</template>

<style scoped>
.stamp {
  margin: 0;
  transition: rotate 300ms ease;
}
.stamp:hover {
  rotate: 0deg !important;
}
.tone-cobalt {
  color: var(--color-cobalt);
}
.tone-pink {
  color: var(--color-pink-ink);
}
.tone-jade {
  color: var(--color-jade-ink);
}
.tone-tomato {
  color: var(--color-tomato-ink);
}
</style>
