<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'

import RouteProgress from '@/components/brand/RouteProgress.vue'
import MapQuestion from '@/components/questions/MapQuestion.vue'
import ScoreTicket from '@/components/ScoreTicket.vue'
import { es } from '@/i18n/es'
import { playableIn } from '@/lib/countries'
import type { LocateConfig } from '@/lib/locate'
import type { MapColor } from '@/lib/map'
import type { AnswerMark } from '@/lib/results'
import { useLocateStore } from '@/stores/locate'
import { finishGame } from '@/stores/stats'
import { useResultStore } from '@/stores/result'

const props = defineProps<{ config: LocateConfig }>()

const store = useLocateStore()
const router = useRouter()

store.start(props.config)

const active = computed(() => playableIn(props.config.region).map((c) => c.code))
const stops = computed(() => store.queue.map((code) => store.marks[code] ?? null))

const MARK_COLOR: Record<AnswerMark, MapColor> = { ok: 'ok', meh: 'meh', fail: 'fail' }
const answered = computed(() =>
  Object.fromEntries(Object.entries(store.marks).map(([code, mark]) => [code, MARK_COLOR[mark]])),
)

watch(
  () => store.finished,
  (finished) => {
    if (!finished) return
    const partial = store.buildResult()
    if (!partial) return
    useResultStore().set(finishGame(partial))
    void router.push({ name: 'results' })
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex h-[calc(100dvh-3.75rem)] flex-col">
    <!-- Ruta y puntos -->
    <div class="flex flex-col gap-1.5 px-4 pt-3 pb-1">
      <div class="flex items-center justify-between gap-3">
        <span class="label-mono text-ink-soft">{{ es.locate.route(config.seed) }}</span>
        <ScoreTicket :score="store.score" />
      </div>
      <RouteProgress :total="store.total" :current="store.index" :marks="stops" />
    </div>

    <MapQuestion
      v-if="store.target"
      :key="store.target"
      :target="store.target"
      :region="config.region"
      :active="active"
      :answered="answered"
      :position="store.index + 1"
      :total="store.total"
      @resolved="store.resolve($event.attempt)"
      @advance="store.next()"
    />
  </div>
</template>
