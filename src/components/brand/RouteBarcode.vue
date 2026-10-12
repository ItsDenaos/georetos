<script setup lang="ts">
/** Código de barras decorativo generado a partir de la semilla: cada ruta tiene el suyo. */
import { computed } from 'vue'

import { createRng } from '@/lib/rng'

const props = defineProps<{ seed: string }>()

const bars = computed(() => {
  const rng = createRng(`barcode|${props.seed}`)
  const result: { x: number; w: number }[] = []
  let x = 0
  while (x < 116) {
    const w = 1 + rng.int(3)
    result.push({ x, w })
    x += w + 1 + rng.int(3)
  }
  return result
})
</script>

<template>
  <svg viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true">
    <rect
      v-for="(b, i) in bars"
      :key="i"
      :x="b.x"
      y="0"
      :width="b.w"
      height="40"
      fill="var(--color-ink)"
    />
  </svg>
</template>
