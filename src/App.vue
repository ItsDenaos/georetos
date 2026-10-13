<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'

import AchievementToast from '@/components/AchievementToast.vue'
import BrandMark from '@/components/brand/BrandMark.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import UpdatePrompt from '@/components/UpdatePrompt.vue'
import { useAnnouncer } from '@/composables/useAnnouncer'
import { es } from '@/i18n/es'

const route = useRoute()
const { message } = useAnnouncer()
</script>

<template>
  <a
    href="#contenido"
    class="sr-only z-50 rounded-xl border-2 border-ink bg-paper-light px-4 py-2 font-bold focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
    >{{ es.app.skipToContent }}</a
  >
  <div class="flex min-h-dvh flex-col">
    <header
      class="sticky top-0 z-30 border-b-4 border-double border-ink bg-paper/95 backdrop-blur-sm"
    >
      <div class="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <RouterLink to="/" class="group flex items-center gap-2" :aria-label="es.app.name">
          <BrandMark :size="36" class="transition-transform duration-300 group-hover:-rotate-12" />
          <span class="font-display text-[1.6rem] leading-none font-extrabold">
            Geo<em class="text-cobalt-ink">Retos</em>
          </span>
        </RouterLink>
        <span class="ml-auto" />
        <span
          v-if="route.name === 'home'"
          class="label-mono hidden rounded-full border-2 border-ink px-3 py-1 sm:inline"
          >{{ es.app.tagline }}</span
        >
        <RouterLink
          v-else
          to="/"
          class="label-mono flex items-center gap-1.5 rounded-full border-2 border-ink bg-paper-light px-3 py-1.5 shadow-ink-sm transition hover:-translate-y-px active:translate-y-px active:shadow-none"
        >
          <svg viewBox="0 0 16 16" class="size-3.5" aria-hidden="true">
            <path
              d="M10 3L5 8l5 5"
              fill="none"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          {{ es.app.home }}
        </RouterLink>
        <ThemeToggle />
      </div>
    </header>
    <main id="contenido" class="mx-auto flex w-full max-w-5xl flex-1 flex-col" tabindex="-1">
      <RouterView />
    </main>
  </div>
  <AchievementToast />
  <UpdatePrompt />
  <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ message }}</div>
</template>
