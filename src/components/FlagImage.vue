<script setup lang="ts">
import { computed } from 'vue'

import { flagUrl } from '@/lib/flags'

/** El texto alternativo lo decide quien usa el componente: nunca debe revelar la respuesta. */
const props = defineProps<{ code: string; alt: string }>()

const src = computed(() => flagUrl(props.code))
</script>

<template>
  <img
    v-if="src"
    :src="src"
    :alt="alt"
    class="aspect-[4/3] bg-paper-light object-cover"
    draggable="false"
  />
</template>
