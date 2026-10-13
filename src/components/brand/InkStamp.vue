<script setup lang="ts">
/** Sello de goma que "cae" sobre el papel: para aciertos, fallos y récords. */
import type { InkTone } from './types'

withDefaults(defineProps<{ tone?: InkTone; rotate?: number; size?: 'md' | 'lg' }>(), {
  tone: 'brand',
  rotate: -6,
  size: 'md',
})
</script>

<template>
  <span
    class="ink-stamp ink-texture animate-slam"
    :class="[`tone-${tone}`, size === 'lg' ? 'text-xl sm:text-2xl' : 'text-sm sm:text-base']"
    :style="{ '--stamp-rotate': `${rotate}deg` }"
  >
    <slot />
  </span>
</template>

<style scoped>
.ink-stamp {
  display: inline-flex;
  align-items: center;
  gap: 0.45em;
  padding: 0.35em 0.8em;
  border: 3px solid currentColor;
  border-radius: 0.6rem;
  background: color-mix(in srgb, var(--color-paper-light) 94%, transparent);
  box-shadow:
    inset 0 0 0 2px color-mix(in srgb, var(--color-paper-light) 94%, transparent),
    inset 0 0 0 3.5px currentColor;
  font-family: var(--font-mono);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.15;
  text-wrap: balance;
  text-align: center;
}

.tone-ok {
  color: var(--color-jade-ink);
}
.tone-meh {
  color: var(--color-sun-ink);
}
.tone-fail {
  color: var(--color-tomato-ink);
}
.tone-brand {
  color: var(--color-cobalt);
}
.tone-pink {
  color: var(--color-pink-ink);
}
</style>
