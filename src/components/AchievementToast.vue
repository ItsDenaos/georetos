<script setup lang="ts">
/**
 * Aviso de "¡Logro desbloqueado!": un sello que cae con confeti. Si salen varios
 * a la vez, aparecen de uno en uno.
 */
import { onBeforeUnmount, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import AchievementMedal from '@/components/brand/AchievementMedal.vue'
import { useAnnouncer } from '@/composables/useAnnouncer'
import { es } from '@/i18n/es'
import { useAchievementToasts } from '@/stores/achievementToasts'

/** Tiempo que se ve cada aviso. */
const SHOW_MS = 5500

const toasts = useAchievementToasts()
const route = useRoute()
const { announce } = useAnnouncer()
let timer: ReturnType<typeof setTimeout> | undefined

/** Confeti de tinta: posiciones fijas, colores de la paleta. */
const confetti = Array.from({ length: 12 }, (_, i) => ({
  angle: (i / 12) * 360,
  distance: 44 + (i % 3) * 14,
  color: ['var(--color-pink)', 'var(--color-sun)', 'var(--color-jade)', 'var(--color-cobalt)'][
    i % 4
  ],
  round: i % 2 === 0,
}))

watch(
  () => toasts.current,
  (id) => {
    clearTimeout(timer)
    if (!id) return
    announce(es.achievements.announce(es.achievements.items[id].name))
    timer = setTimeout(() => toasts.dismiss(), SHOW_MS)
  },
  { immediate: true },
)

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 top-16 z-40 flex justify-center px-4">
    <Transition name="toast" mode="out-in">
      <div
        v-if="toasts.current"
        :key="toasts.current"
        class="pointer-events-auto relative flex w-full max-w-sm items-center gap-3 rounded-2xl border-[2.5px] border-ink bg-paper-light p-3 pr-10 shadow-ink-lg"
      >
        <span class="relative shrink-0">
          <span
            v-for="(c, i) in confetti"
            :key="i"
            class="confetti"
            :class="c.round ? 'rounded-full' : 'rounded-[2px]'"
            :style="{ '--a': `${c.angle}deg`, '--d': `${c.distance}px`, background: c.color }"
            aria-hidden="true"
          />
          <AchievementMedal :id="toasts.current" done :rotate="0" class="size-16 animate-slam" />
        </span>
        <div class="min-w-0">
          <p class="label-mono text-pink-ink">{{ es.achievements.unlocked }}</p>
          <p class="font-display text-xl leading-tight font-extrabold">
            {{ es.achievements.items[toasts.current].name }}
          </p>
          <p class="text-sm leading-snug text-ink-soft">
            {{ es.achievements.items[toasts.current].hint }}
          </p>
          <RouterLink
            v-if="route.name !== 'progress'"
            to="/progreso"
            class="label-mono mt-1 inline-block text-cobalt-ink underline decoration-2 underline-offset-4"
            @click="toasts.dismiss()"
          >
            {{ es.achievements.see }}
          </RouterLink>
        </div>
        <button
          type="button"
          class="absolute top-2 right-2 grid size-8 place-items-center rounded-full border-2 border-ink bg-paper-light"
          :aria-label="es.achievements.close"
          @click="toasts.dismiss()"
        >
          <svg viewBox="0 0 16 16" class="size-3.5" aria-hidden="true">
            <path
              d="M4 4l8 8M12 4l-8 8"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.toast-enter-active {
  transition:
    transform 320ms cubic-bezier(0.2, 0.9, 0.3, 1.3),
    opacity 200ms ease;
}
.toast-leave-active {
  transition:
    transform 200ms ease,
    opacity 200ms ease;
}
.toast-enter-from {
  transform: translateY(-24px);
  opacity: 0;
}
.toast-leave-to {
  transform: translateY(-12px);
  opacity: 0;
}

.confetti {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  border: 1.5px solid var(--color-ink);
  opacity: 0;
  animation: burst 900ms cubic-bezier(0.15, 0.8, 0.3, 1) 220ms forwards;
}

@keyframes burst {
  0% {
    transform: translate(-50%, -50%) rotate(var(--a)) translateX(0) scale(0.4);
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--a)) translateX(var(--d)) scale(1) rotate(200deg);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .confetti {
    display: none;
  }
  .toast-enter-active,
  .toast-leave-active {
    transition: opacity 150ms ease;
  }
  .toast-enter-from,
  .toast-leave-to {
    transform: none;
  }
}
</style>
