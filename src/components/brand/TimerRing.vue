<script setup lang="ts">
/** Cronómetro circular (el texto accesible lo pone quien lo usa). */
import { computed } from 'vue'

const props = defineProps<{ remainingMs: number; totalMs: number }>()

const RADIUS = 17
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const fraction = computed(() => Math.max(0, Math.min(1, props.remainingMs / props.totalMs)))
const seconds = computed(() => Math.ceil(props.remainingMs / 1000))
const urgent = computed(() => seconds.value <= 5)
</script>

<template>
  <svg
    viewBox="0 0 48 52"
    class="h-13 w-12 shrink-0"
    :class="{ 'animate-shake': urgent && seconds > 0 }"
    aria-hidden="true"
  >
    <rect x="20" y="1" width="8" height="5" rx="1.5" fill="var(--color-ink)" />
    <path d="M36 9l3-3" stroke="var(--color-ink)" stroke-width="3" stroke-linecap="round" />
    <circle
      cx="24"
      cy="29"
      r="22"
      fill="var(--color-paper-light)"
      stroke="var(--color-ink)"
      stroke-width="2.5"
    />
    <circle
      cx="24"
      cy="29"
      :r="RADIUS"
      fill="none"
      :stroke="urgent ? 'var(--color-tomato)' : 'var(--color-cobalt)'"
      stroke-width="6"
      :stroke-dasharray="CIRCUMFERENCE"
      :stroke-dashoffset="CIRCUMFERENCE * (1 - fraction)"
      transform="rotate(-90 24 29)"
      class="transition-[stroke-dashoffset] duration-200 ease-linear"
    />
    <text
      x="24"
      y="33.5"
      text-anchor="middle"
      class="font-mono"
      font-size="12.5"
      font-weight="600"
      fill="var(--color-ink)"
    >
      {{ seconds }}
    </text>
  </svg>
</template>
