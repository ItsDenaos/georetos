<script setup lang="ts">
/** Marco común de las pantallas de configuración: cabecera, campos y barra para empezar. */
import { es } from '@/i18n/es'

defineProps<{ mode: number; title: string; intro: string; summary: string[] }>()
const emit = defineEmits<{ start: [] }>()
</script>

<template>
  <form class="flex flex-1 flex-col" @submit.prevent="emit('start')">
    <div class="flex flex-1 flex-col gap-8 px-4 pt-6 pb-8 sm:pt-10">
      <header class="relative animate-rise">
        <span
          class="numeral pointer-events-none absolute top-4 right-1 font-display text-[6.5rem] leading-none font-extrabold select-none sm:-top-2 sm:right-8 sm:text-[9rem]"
          aria-hidden="true"
          >{{ String(mode).padStart(2, '0') }}</span
        >
        <p class="label-mono text-cobalt-ink">{{ es.setup.modeKicker(mode, title) }}</p>
        <h1
          class="relative mt-2 font-display text-[2.6rem] leading-none font-extrabold sm:text-6xl"
        >
          {{ es.setup.planTitle[0] }}<br />{{ es.setup.planTitle[1] }}
        </h1>
        <p class="relative mt-3 max-w-md text-lg text-ink-soft">{{ intro }}</p>
      </header>
      <div class="flex flex-col gap-8 animate-rise [animation-delay:100ms]">
        <slot />
      </div>
    </div>

    <!-- Barra para empezar -->
    <div
      class="sticky bottom-0 z-10 border-t-[2.5px] border-ink bg-paper-light/95 backdrop-blur-sm"
    >
      <div
        class="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div class="min-w-0 flex-1">
          <p
            v-for="(line, i) in summary"
            :key="i"
            class="label-mono truncate"
            :class="i > 0 && 'text-ink-soft'"
          >
            {{ line }}
          </p>
        </div>
        <button type="submit" class="btn-primary shrink-0 px-6 text-lg">
          {{ es.setup.start }}
          <svg viewBox="0 0 20 20" class="size-4" aria-hidden="true">
            <path
              d="M4 10h11M11 5l5 5-5 5"
              fill="none"
              stroke="currentColor"
              stroke-width="2.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  </form>
</template>

<style scoped>
.numeral {
  color: transparent;
  -webkit-text-stroke: 2px var(--color-ink);
  text-shadow: 6px 6px 0 var(--color-sun);
  opacity: 0.9;
  z-index: 0;
}
</style>
