<script setup lang="ts">
/**
 * Registra el service worker y avisa de dos cosas: que la app ya funciona sin
 * internet y que hay una versión nueva. La actualización no es automática, para
 * no cortar una partida a medias.
 */
import { onBeforeUnmount, watch } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

import { useAnnouncer } from '@/composables/useAnnouncer'
import { es } from '@/i18n/es'

/** Cada cuánto se busca una versión nueva con la app abierta. */
const CHECK_EVERY = 60 * 60 * 1000
/** Tiempo que se ve el aviso de "sin internet". */
const OFFLINE_NOTICE_MS = 5000

const { announce } = useAnnouncer()
let checkTimer: ReturnType<typeof setInterval> | undefined
let offlineTimer: ReturnType<typeof setTimeout> | undefined

const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return
    checkTimer = setInterval(() => {
      if (navigator.onLine) void registration.update()
    }, CHECK_EVERY)
  },
})

watch(needRefresh, (value) => {
  if (value) announce(es.pwa.updateTitle)
})

watch(offlineReady, (value) => {
  if (!value) return
  announce(es.pwa.offlineReady)
  offlineTimer = setTimeout(() => (offlineReady.value = false), OFFLINE_NOTICE_MS)
})

onBeforeUnmount(() => {
  clearInterval(checkTimer)
  clearTimeout(offlineTimer)
})
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
  >
    <Transition name="notice">
      <div
        v-if="needRefresh"
        class="pointer-events-auto flex w-full max-w-md flex-wrap items-center gap-3 rounded-2xl border-[2.5px] border-ink bg-paper-light p-3 pl-4 shadow-ink-lg"
        role="alert"
      >
        <div class="min-w-0 flex-1">
          <p class="font-bold">{{ es.pwa.updateTitle }}</p>
          <p class="text-sm text-ink-soft">{{ es.pwa.updateText }}</p>
        </div>
        <div class="flex gap-2">
          <button type="button" class="btn-ghost min-h-10 px-2" @click="needRefresh = false">
            {{ es.pwa.later }}
          </button>
          <button type="button" class="btn-primary min-h-10" @click="updateServiceWorker()">
            {{ es.pwa.update }}
          </button>
        </div>
      </div>
      <p
        v-else-if="offlineReady"
        class="label-mono pointer-events-auto flex items-center gap-2 rounded-full border-2 border-ink bg-jade-light px-4 py-2 text-jade-ink shadow-ink-sm"
        role="status"
      >
        <svg viewBox="0 0 20 20" class="size-4" aria-hidden="true">
          <path
            d="M4 10.5l4 4 8-9"
            fill="none"
            stroke="currentColor"
            stroke-width="2.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        {{ es.pwa.offlineReady }}
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.notice-enter-active,
.notice-leave-active {
  transition:
    transform 250ms cubic-bezier(0.2, 0.9, 0.3, 1.2),
    opacity 200ms ease;
}
.notice-enter-from,
.notice-leave-to {
  transform: translateY(16px);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .notice-enter-from,
  .notice-leave-to {
    transform: none;
  }
}
</style>
