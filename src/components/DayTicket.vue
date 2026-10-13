<script setup lang="ts">
/** Boleto con talón para los retos del día (Reto diario, Silueta del día). */
import { RouterLink, type RouteLocationRaw } from 'vue-router'

withDefaults(
  defineProps<{
    to: RouteLocationRaw
    number: number
    kicker: string
    title: string
    cta: string
    /** Línea extra, por ejemplo la racha. */
    note?: string
    tone?: 'cobalt' | 'pink'
  }>(),
  { note: undefined, tone: 'pink' },
)
</script>

<template>
  <RouterLink
    :to="to"
    class="ticket group flex items-stretch overflow-hidden rounded-2xl border-[2.5px] border-ink shadow-ink"
    :class="tone === 'cobalt' ? 'bg-cobalt-light' : 'bg-pink-light'"
  >
    <span
      class="flex w-20 shrink-0 flex-col items-center justify-center gap-0.5 border-r-[2.5px] border-dashed border-ink"
      :class="tone === 'cobalt' ? 'bg-cobalt text-cream' : 'bg-pink text-carbon'"
      aria-hidden="true"
    >
      <span class="label-mono text-[0.6rem]">Nº</span>
      <span class="font-display text-4xl leading-none font-extrabold">{{ number }}</span>
    </span>
    <span class="flex min-w-0 flex-1 flex-col justify-center gap-1 px-4 py-3">
      <span class="label-mono" :class="tone === 'cobalt' ? 'text-cobalt-ink' : 'text-pink-ink'">{{
        kicker
      }}</span>
      <span class="font-display text-xl leading-tight font-extrabold">{{ title }}</span>
      <span v-if="note" class="text-sm font-semibold text-ink-soft">{{ note }}</span>
    </span>
    <span class="flex items-center pr-4">
      <span class="cta hidden sm:inline-flex">{{ cta }}</span>
      <svg
        viewBox="0 0 20 20"
        class="size-6 transition-transform group-hover:translate-x-1 sm:hidden"
        aria-hidden="true"
      >
        <path
          d="M4 10h11M11 5l5 5-5 5"
          fill="none"
          stroke="currentColor"
          stroke-width="2.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
  </RouterLink>
</template>

<style scoped>
.ticket {
  transition:
    transform 250ms ease,
    box-shadow 250ms ease;
}
.ticket:hover {
  transform: translate(-2px, -2px);
  box-shadow: 7px 7px 0 0 var(--color-shadow);
}

.cta {
  align-items: center;
  border: 2px solid var(--color-ink);
  border-radius: 0.8rem;
  background: var(--color-paper-light);
  padding: 0.45rem 0.9rem;
  font-weight: 800;
  white-space: nowrap;
  box-shadow: 3px 3px 0 0 var(--color-shadow);
  transition: background-color 200ms ease;
}
.ticket:hover .cta {
  background: var(--color-sun);
  color: var(--color-carbon);
}
</style>
