<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import LocateGame from '@/components/locate/LocateGame.vue'
import LocateSetup from '@/components/locate/LocateSetup.vue'
import { newSeed } from '@/lib/rng'
import { locateQuery, parseLocateQuery } from '@/lib/urlConfig'

const route = useRoute()
const router = useRouter()

const config = computed(() => parseLocateQuery(route.query))

// Toda partida lleva semilla en la URL: si falta, se crea una (sin añadir historial).
watchEffect(() => {
  if (config.value && !config.value.seed) {
    void router.replace({ query: locateQuery({ ...config.value, seed: newSeed() }) })
  }
})
</script>

<template>
  <LocateGame v-if="config?.seed" :key="route.fullPath" :config="config" />
  <LocateSetup v-else-if="!config" />
</template>
