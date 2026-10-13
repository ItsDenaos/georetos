<script setup lang="ts">
/** Botón de tema: sistema → claro → oscuro. El ícono muestra la preferencia actual. */
import { computed } from 'vue'

import { useTheme } from '@/composables/useTheme'
import { es } from '@/i18n/es'

const { preference, cycle } = useTheme()

const label = computed(() => es.theme.button(es.theme.options[preference.value]))
</script>

<template>
  <button
    type="button"
    class="grid size-10 shrink-0 place-items-center rounded-full border-2 border-ink bg-paper-light shadow-ink-sm transition hover:-translate-y-px active:translate-y-px active:shadow-none"
    :aria-label="label"
    :title="label"
    @click="cycle"
  >
    <svg viewBox="0 0 24 24" class="size-5" aria-hidden="true">
      <g
        v-if="preference === 'light'"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      >
        <circle cx="12" cy="12" r="4.2" fill="var(--color-sun)" />
        <path
          d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"
        />
      </g>
      <path
        v-else-if="preference === 'dark'"
        d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"
        fill="var(--color-cobalt)"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <g v-else stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="8.5" fill="none" />
        <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" />
      </g>
    </svg>
  </button>
</template>
