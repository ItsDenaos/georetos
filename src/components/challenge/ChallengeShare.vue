<script setup lang="ts">
/**
 * "Desafía a un amigo": arma el link de esta misma partida con tu resultado y
 * lo comparte (menú del sistema en el celular, portapapeles en el escritorio).
 */
import { computed, useId } from 'vue'
import { useRouter } from 'vue-router'

import ShareButton from '@/components/ShareButton.vue'
import { es } from '@/i18n/es'
import {
  CHALLENGE_PARAM,
  NAME_MAX,
  describePlayed,
  encodeChallenge,
  sameGameRoute,
} from '@/lib/challenge'
import type { GameResult } from '@/lib/results'
import { useChallengeStore } from '@/stores/challenge'

const props = defineProps<{ result: GameResult; reply?: boolean }>()

const router = useRouter()
const store = useChallengeStore()
const inputId = useId()

const route = computed(() => sameGameRoute(props.result))

const url = computed(() => {
  if (!route.value) return ''
  const { href } = router.resolve({
    name: route.value.name,
    query: { ...route.value.query, [CHALLENGE_PARAM]: encodeChallenge(props.result, store.name) },
  })
  return new URL(href, window.location.origin).href
})

const text = computed(() => {
  const label = describePlayed(props.result, props.result)
  const game = `${label.title} · ${label.regionLabel} · ${label.level}`
  return `${es.challenge.shareText(store.name, game, label.scoreLabel)}\n${url.value}`
})

function onName(event: Event) {
  store.setName((event.target as HTMLInputElement).value)
}
</script>

<template>
  <section v-if="route" class="card p-5" aria-labelledby="desafia">
    <h2 id="desafia" class="font-display text-2xl font-extrabold">
      {{ es.challenge.shareTitle }}
    </h2>
    <p class="mt-1 text-ink-soft">
      {{ result.mode === 'typing' ? es.challenge.shareIntroTyping : es.challenge.shareIntro }}
    </p>
    <label :for="inputId" class="label-mono mt-4 mb-1.5 block text-ink-soft">
      {{ es.challenge.nameLabel }}
    </label>
    <input
      :id="inputId"
      :value="store.name"
      type="text"
      autocomplete="nickname"
      :maxlength="NAME_MAX"
      :placeholder="es.challenge.namePlaceholder"
      class="mb-4 w-full rounded-xl border-2 border-ink bg-paper-light px-4 py-2.5 font-semibold placeholder:font-normal placeholder:text-ink-soft focus:outline-3 focus:outline-offset-2 focus:outline-pink"
      @change="onName"
    />
    <ShareButton
      :text="text"
      :title="es.challenge.shareTitle"
      :label="reply ? es.challenge.shareBack : es.challenge.share"
    />
  </section>
</template>
