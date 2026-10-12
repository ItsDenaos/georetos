<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import TriviaGame from '@/components/trivia/TriviaGame.vue'
import TriviaSetup from '@/components/trivia/TriviaSetup.vue'
import { newSeed } from '@/lib/rng'
import { parseTriviaQuery, triviaQuery } from '@/lib/urlConfig'

const route = useRoute()
const router = useRouter()

const config = computed(() => parseTriviaQuery(route.query))

// Toda partida lleva semilla en la URL: si falta, se crea una (sin añadir historial).
watchEffect(() => {
  if (config.value && !config.value.seed) {
    void router.replace({ query: triviaQuery({ ...config.value, seed: newSeed() }) })
  }
})
</script>

<template>
  <TriviaGame v-if="config?.seed" :key="route.fullPath" :config="config" />
  <TriviaSetup v-else-if="!config" />
</template>
