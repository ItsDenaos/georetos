<script setup lang="ts">
/**
 * Lámina con la silueta de un país, sola y sin mapa: tinta con desfase rosa de
 * risografía y una barra de escala en km (el tamaño también es pista).
 */
import { computed, onMounted, ref, shallowRef } from 'vue'

import { es } from '@/i18n/es'
import { SILHOUETTE_BOX, loadSilhouettes, type SilhouetteShape } from '@/lib/silhouettes'

const props = withDefaults(
  defineProps<{ code: string; kicker: string; status?: 'playing' | 'solved' | 'failed' }>(),
  { status: 'playing' },
)

const shapes = shallowRef<Record<string, SilhouetteShape> | null>(null)
const failedToLoad = ref(false)

onMounted(() => {
  loadSilhouettes()
    .then((loaded) => (shapes.value = loaded))
    .catch(() => (failedToLoad.value = true))
})

/** La barra de escala va debajo de la caja de la silueta, nunca encima. */
const SCALE_Y = SILHOUETTE_BOX + 14
const shape = computed(() => shapes.value?.[props.code])
</script>

<template>
  <figure
    class="graticule-bg relative mx-auto w-full max-w-[min(100%,24rem)] overflow-hidden rounded-2xl border-[2.5px] border-ink bg-paper-light shadow-ink-lg"
  >
    <figcaption
      class="flex items-center justify-between border-b-2 border-dashed border-ink/25 px-4 py-2"
    >
      <span class="label-mono">{{ kicker }}</span>
      <span class="label-mono text-ink-soft">{{ es.silhouette.prompt }}</span>
    </figcaption>
    <div class="relative aspect-[212/232] w-full">
      <svg
        v-if="shape"
        :viewBox="`-6 -4 ${SILHOUETTE_BOX + 12} ${SILHOUETTE_BOX + 32}`"
        role="img"
        :aria-label="`${es.silhouette.silhouetteLabel}. ${es.silhouette.scaleLabel(shape.km)}`"
        class="absolute inset-0 h-full w-full"
      >
        <g :key="code" class="silhouette animate-pop">
          <path
            :d="shape.d"
            fill="var(--color-pink)"
            fill-rule="evenodd"
            transform="translate(2.5 2.5)"
          />
          <path
            :d="shape.d"
            fill-rule="evenodd"
            class="transition-[fill] duration-500"
            :style="{
              fill:
                status === 'solved'
                  ? 'var(--color-jade)'
                  : status === 'failed'
                    ? 'var(--color-tomato)'
                    : 'var(--color-ink)',
            }"
          />
        </g>
        <!-- Barra de escala -->
        <g>
          <path
            :d="`M8 ${SCALE_Y}h${shape.px}M8 ${SCALE_Y - 4}v8M${8 + shape.px} ${SCALE_Y - 4}v8M${8 + shape.px / 2} ${SCALE_Y - 2.5}v5`"
            fill="none"
            stroke="var(--color-ink)"
            stroke-width="2"
            stroke-linecap="round"
          />
          <text
            :x="14 + shape.px"
            :y="SCALE_Y + 3.5"
            class="font-mono"
            font-size="10"
            font-weight="600"
            fill="var(--color-ink)"
          >
            {{ es.silhouette.scale(shape.km) }}
          </text>
        </g>
      </svg>
      <div v-else class="absolute inset-0 grid place-items-center" role="status">
        <span
          class="grid size-28 place-items-center rounded-full border-[3px] border-dashed border-ink/30 font-display text-5xl font-extrabold text-ink/30"
          :class="!failedToLoad && 'animate-pulse'"
        >
          ?
        </span>
        <span v-if="failedToLoad" class="label-mono absolute bottom-6">{{ es.map.error }}</span>
      </div>
    </div>
  </figure>
</template>
