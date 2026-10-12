<script setup lang="ts">
/**
 * Marco de lámina de atlas para los mapas: borde de tinta, marcas de registro de
 * imprenta en las esquinas, rosa de los vientos y una etiqueta con el título.
 */
import CompassRose from './CompassRose.vue'

withDefaults(defineProps<{ caption?: string; compass?: boolean; flat?: boolean }>(), {
  caption: undefined,
  compass: true,
  flat: false,
})

const corners = [
  'top-1.5 left-1.5',
  'top-1.5 right-1.5',
  'bottom-1.5 left-1.5',
  'bottom-1.5 right-1.5',
]
</script>

<template>
  <div
    class="plate relative overflow-hidden rounded-2xl border-2 border-ink"
    :class="!flat && 'shadow-ink'"
  >
    <slot />
    <svg
      v-for="corner in corners"
      :key="corner"
      viewBox="0 0 16 16"
      class="pointer-events-none absolute size-3.5 opacity-50"
      :class="corner"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="4.2" fill="none" stroke="var(--color-ink)" stroke-width="1.2" />
      <path d="M8 0v16M0 8h16" stroke="var(--color-ink)" stroke-width="1.2" />
    </svg>
    <CompassRose
      v-if="compass"
      class="pointer-events-none absolute bottom-2 left-2 size-12 sm:size-14"
    />
    <span
      v-if="caption"
      class="label-mono pointer-events-none absolute right-0 bottom-0 max-w-[70%] truncate rounded-tl-xl border-t-2 border-l-2 border-ink bg-paper-light px-2.5 py-1"
      >{{ caption }}</span
    >
  </div>
</template>

<style scoped>
.plate {
  background: var(--map-ocean);
}
</style>
