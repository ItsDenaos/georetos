<script setup lang="ts">
/**
 * Botón "Compartir": menú del sistema en el celular, portapapeles en el
 * escritorio. Si no se puede copiar, muestra el texto para copiarlo a mano.
 */
import { ref } from 'vue'

import { es } from '@/i18n/es'
import { shareText, type ShareOutcome } from '@/lib/share'

const props = defineProps<{ text: string; title?: string; label?: string }>()

const status = ref<ShareOutcome | null>(null)
const busy = ref(false)

async function share() {
  if (busy.value) return
  busy.value = true
  status.value = await shareText(props.text, props.title ? { title: props.title } : {})
  busy.value = false
}

function selectAll(event: Event) {
  ;(event.target as HTMLTextAreaElement).select()
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <button type="button" class="btn-primary w-full text-lg" :disabled="busy" @click="share">
      <svg viewBox="0 0 24 24" class="size-5" aria-hidden="true">
        <path
          d="M12 15V3M7.5 7.5L12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      {{ label ?? es.daily.share }}
    </button>
    <p
      class="label-mono min-h-4 text-center"
      :class="status === 'failed' ? 'text-tomato-ink' : 'text-jade-ink'"
      role="status"
    >
      {{
        status === 'copied'
          ? es.daily.copied
          : status === 'shared'
            ? es.daily.shared
            : status === 'failed'
              ? es.daily.shareFailed
              : ''
      }}
    </p>
    <textarea
      v-if="status === 'failed'"
      readonly
      rows="4"
      :value="text"
      class="w-full rounded-xl border-2 border-ink bg-paper-light p-3 font-mono text-sm"
      @focus="selectAll"
    />
  </div>
</template>
