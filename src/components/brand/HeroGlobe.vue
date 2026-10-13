<script setup lang="ts">
/**
 * Ilustración de portada: globo de risografía con alfileres y un avión de papel
 * en órbita. Es decorativa (aria-hidden). Sin animaciones si se piden menos.
 */
import { useId } from 'vue'

import { HERO_GLOBE } from './heroGlobePaths'

const id = useId()
const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const ORBIT = 'M15 165 A165 50 0 1 0 345 165 A165 50 0 1 0 15 165'
const PIN = 'M0 0C-2-6-9-10-9-17a9 9 0 1 1 18 0C9-10 2-6 0 0Z'
const PIN_COLORS = ['var(--color-jade)', 'var(--color-pink)', 'var(--color-sun)']
</script>

<template>
  <svg viewBox="0 0 360 330" aria-hidden="true" class="h-auto w-full overflow-visible">
    <defs>
      <clipPath :id="`${id}-globe`">
        <circle cx="180" cy="165" r="110" />
      </clipPath>
      <pattern :id="`${id}-dots`" width="7" height="7" patternUnits="userSpaceOnUse">
        <circle cx="3.5" cy="3.5" r="1.25" fill="var(--color-carbon)" opacity="0.38" />
      </pattern>
      <mask :id="`${id}-shade`">
        <circle cx="180" cy="165" r="110" fill="white" />
        <circle cx="158" cy="140" r="112" fill="black" />
      </mask>
      <!-- Mitad delantera de la órbita (en coordenadas del grupo rotado) -->
      <clipPath :id="`${id}-front`">
        <rect x="-40" y="165" width="440" height="120" />
      </clipPath>
      <g :id="`${id}-plane`">
        <path
          d="M-12-8L14 0-12 8-7 0Z"
          fill="var(--color-pink)"
          stroke="var(--color-carbon)"
          stroke-width="1.8"
          stroke-linejoin="round"
        />
        <path d="M-7 0H14" stroke="var(--color-carbon)" stroke-width="1.2" />
      </g>
    </defs>

    <!-- Destellos -->
    <g stroke="var(--color-ink)" stroke-width="1.6" stroke-linejoin="round">
      <path d="M48 52l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="var(--color-sun)" />
      <path d="M318 56l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="var(--color-pink)" />
      <path d="M330 262l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="var(--color-jade)" />
    </g>

    <g transform="rotate(-14 180 165)">
      <!-- Órbita completa (la parte trasera queda tapada por el globo) -->
      <path
        :d="ORBIT"
        fill="none"
        stroke="var(--color-ink)"
        stroke-width="2"
        stroke-dasharray="7 8"
        opacity="0.55"
      />
      <use v-if="!reducedMotion" :href="`#${id}-plane`">
        <animateMotion dur="11s" repeatCount="indefinite" rotate="auto" :path="ORBIT" />
      </use>
    </g>

    <!-- Globo -->
    <circle cx="192" cy="177" r="110" fill="var(--color-pink)" />
    <circle cx="180" cy="165" r="110" fill="var(--color-cobalt)" />
    <g :clip-path="`url(#${id}-globe)`">
      <path
        :d="HERO_GLOBE.graticule"
        fill="none"
        stroke="var(--color-cream)"
        stroke-width="1.3"
        opacity="0.45"
      />
      <!-- Tierra con desfase de registro rosa -->
      <path :d="HERO_GLOBE.land" fill="var(--color-pink)" transform="translate(2.5 2.5)" />
      <path
        :d="HERO_GLOBE.land"
        fill="var(--color-sun)"
        stroke="var(--color-carbon)"
        stroke-width="1.7"
        stroke-linejoin="round"
      />
      <rect
        x="60"
        y="45"
        width="240"
        height="240"
        :fill="`url(#${id}-dots)`"
        :mask="`url(#${id}-shade)`"
      />
    </g>
    <circle cx="180" cy="165" r="110" fill="none" stroke="var(--color-carbon)" stroke-width="3.2" />

    <!-- Alfileres -->
    <g stroke="var(--color-carbon)" stroke-width="2.4" stroke-linejoin="round">
      <g v-for="([x, y], i) in HERO_GLOBE.pins" :key="i" :transform="`translate(${x} ${y})`">
        <g class="pin" :style="{ animationDelay: `${-0.85 * i}s` }">
          <path :d="PIN" :fill="PIN_COLORS[i]" />
          <circle cy="-17" r="3.6" fill="var(--color-cream)" stroke-width="1.8" />
        </g>
      </g>
    </g>

    <!-- Mitad delantera de la órbita y el avión, por encima del globo -->
    <g transform="rotate(-14 180 165)" :clip-path="`url(#${id}-front)`">
      <path
        :d="ORBIT"
        fill="none"
        stroke="var(--color-ink)"
        stroke-width="2"
        stroke-dasharray="7 8"
      />
      <use
        :href="`#${id}-plane`"
        :transform="reducedMotion ? 'translate(290 208) rotate(170)' : undefined"
      >
        <animateMotion
          v-if="!reducedMotion"
          dur="11s"
          repeatCount="indefinite"
          rotate="auto"
          :path="ORBIT"
        />
      </use>
    </g>
  </svg>
</template>

<style scoped>
.pin {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: bob 2.6s ease-in-out infinite;
}

@keyframes bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pin {
    animation: none;
  }
}
</style>
