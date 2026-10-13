<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import ChallengeIntro from '@/components/challenge/ChallengeIntro.vue'
import TypingGame from '@/components/typing/TypingGame.vue'
import TypingSetup from '@/components/typing/TypingSetup.vue'
import { useChallengeGate } from '@/composables/useChallengeGate'
import { parseTypingQuery } from '@/lib/urlConfig'

const route = useRoute()
const { pending, challenge, label, endless, accept } = useChallengeGate()

// Sin azar: la misma región y el mismo tiempo son siempre el mismo reto.
const config = computed(() => parseTypingQuery(route.query))
</script>

<template>
  <ChallengeIntro
    v-if="pending"
    :challenge="challenge"
    :label="label"
    :endless="endless"
    @accept="accept"
  />
  <TypingGame v-else-if="config" :key="route.fullPath" :config="config" />
  <TypingSetup v-else />
</template>
