<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ChallengeIntro from '@/components/challenge/ChallengeIntro.vue'
import RunGame from '@/components/run/RunGame.vue'
import TriviaGame from '@/components/trivia/TriviaGame.vue'
import TriviaSetup from '@/components/trivia/TriviaSetup.vue'
import { useChallengeGate } from '@/composables/useChallengeGate'
import { newSeed } from '@/lib/rng'
import { parseRunQuery, parseTriviaQuery, runQuery, triviaQuery } from '@/lib/urlConfig'

const route = useRoute()
const { pending, challenge, label, endless, accept } = useChallengeGate()
const router = useRouter()

// Contrarreloj o Supervivencia primero (también llevan "dificultad"); si no, la clásica.
const run = computed(() => parseRunQuery('trivia', route.query))
const config = computed(() => (run.value ? null : parseTriviaQuery(route.query)))

// Toda partida lleva semilla en la URL: si falta, se crea una (sin añadir historial).
watchEffect(() => {
  if (run.value && !run.value.seed) {
    void router.replace({ query: runQuery({ ...run.value, seed: newSeed() }) })
  } else if (config.value && !config.value.seed) {
    void router.replace({ query: triviaQuery({ ...config.value, seed: newSeed() }) })
  }
})
</script>

<template>
  <ChallengeIntro
    v-if="pending"
    :challenge="challenge"
    :label="label"
    :endless="endless"
    @accept="accept"
  />
  <RunGame v-else-if="run?.seed" :key="route.fullPath" :config="run" />
  <TriviaGame v-else-if="config?.seed" :key="route.fullPath" :config="config" />
  <TriviaSetup v-else-if="!run && !config" />
</template>
