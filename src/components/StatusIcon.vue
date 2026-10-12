<script setup lang="ts">
/**
 * Ícono de acierto, acierto tardío o fallo. Acompaña al color con una forma
 * distinta (círculo con ✓, círculo con –, rombo con ✕) para no depender solo de él.
 */
defineProps<{ kind: 'ok' | 'meh' | 'fail' }>()
</script>

<template>
  <svg viewBox="0 0 24 24" aria-hidden="true" class="size-5 shrink-0" :class="`status-${kind}`">
    <rect
      v-if="kind === 'fail'"
      x="4"
      y="4"
      width="16"
      height="16"
      rx="3"
      transform="rotate(45 12 12)"
    />
    <circle v-else cx="12" cy="12" r="10" />
    <path v-if="kind === 'ok'" d="M7.2 12.4l3.2 3.2 6.4-6.8" />
    <path v-else-if="kind === 'meh'" d="M7.5 12h9" />
    <path v-else d="M9 9l6 6M15 9l-6 6" />
  </svg>
</template>

<style scoped>
svg :is(circle, rect) {
  stroke: var(--color-ink);
  stroke-width: 2;
}
svg path {
  fill: none;
  stroke: white;
  stroke-width: 2.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.status-ok :is(circle, rect) {
  fill: var(--color-jade);
}
.status-meh :is(circle, rect) {
  fill: var(--color-sun);
}
.status-meh path {
  stroke: var(--color-ink);
}
.status-fail :is(circle, rect) {
  fill: var(--color-tomato);
}
</style>
