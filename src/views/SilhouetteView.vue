<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import SilhouetteGame from '@/components/silhouette/SilhouetteGame.vue'
import SilhouetteSetup from '@/components/silhouette/SilhouetteSetup.vue'
import { newSeed } from '@/lib/rng'
import { parseSilhouetteQuery, silhouetteQuery } from '@/lib/urlConfig'

const route = useRoute()
const router = useRouter()

const config = computed(() => parseSilhouetteQuery(route.query))

// Toda partida lleva semilla en la URL: si falta, se crea una (sin añadir historial).
watchEffect(() => {
  if (config.value && !config.value.seed) {
    void router.replace({ query: silhouetteQuery({ ...config.value, seed: newSeed() }) })
  }
})
</script>

<template>
  <SilhouetteGame v-if="config?.seed" :key="route.fullPath" :config="config" />
  <SilhouetteSetup v-else-if="!config" />
</template>
