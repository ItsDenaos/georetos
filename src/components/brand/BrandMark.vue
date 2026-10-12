<script setup lang="ts">
/** Emblema de GeoRetos: globo cobalto con desfase rosa de risografía y un alfiler. */
withDefaults(defineProps<{ size?: number }>(), { size: 40 })
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 48 48" aria-hidden="true" class="shrink-0">
    <!-- Desfase de registro: la tinta rosa quedó corrida -->
    <circle cx="25.5" cy="26.5" r="18.5" fill="var(--color-pink)" />
    <circle
      cx="22.5"
      cy="24"
      r="18.5"
      fill="var(--color-cobalt)"
      stroke="var(--color-ink)"
      stroke-width="2.4"
    />
    <g
      fill="none"
      stroke="var(--color-paper-light)"
      stroke-width="1.5"
      stroke-linecap="round"
      opacity="0.9"
    >
      <ellipse cx="22.5" cy="24" rx="7.5" ry="18" />
      <path d="M5.5 18.5c11 3.2 23 3.2 34 0M5.5 29.5c11-3.2 23-3.2 34 0" />
    </g>
    <path
      d="M12 17.5c3-3.6 8.5-4.6 11.2-2.4 2 1.6.6 4.2-1.9 4.5-2.6.3-3.1 2.8-1.2 4.2 1.6 1.3.2 3.9-2.4 3.6-3.3-.4-6.4-3-7.1-5.9-.3-1.5.4-2.9 1.4-4z"
      fill="var(--color-sun)"
      stroke="var(--color-ink)"
      stroke-width="1.4"
      stroke-linejoin="round"
    />
    <!-- Alfiler -->
    <path
      d="M37 3c-4.6 0-8.3 3.5-8.3 7.9 0 5.8 8.3 13.6 8.3 13.6s8.3-7.8 8.3-13.6C45.3 6.5 41.6 3 37 3z"
      fill="var(--color-pink)"
      stroke="var(--color-ink)"
      stroke-width="2.2"
      stroke-linejoin="round"
    />
    <circle
      cx="37"
      cy="11"
      r="2.9"
      fill="var(--color-paper-light)"
      stroke="var(--color-ink)"
      stroke-width="1.6"
    />
  </svg>
</template>
