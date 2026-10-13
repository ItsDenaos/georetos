import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { AchievementId } from '@/lib/achievements'

/**
 * Avisos de "¡Logro desbloqueado!", en cola: si salen varios a la vez se
 * muestran de uno en uno. Ligero a propósito: lo usa la cabecera de la app.
 */
export const useAchievementToasts = defineStore('achievementToasts', () => {
  const queue = ref<AchievementId[]>([])
  const current = computed(() => queue.value[0] ?? null)

  function push(ids: readonly AchievementId[]) {
    queue.value = [...queue.value, ...ids.filter((id) => !queue.value.includes(id))]
  }

  function dismiss() {
    queue.value = queue.value.slice(1)
  }

  return { queue, current, push, dismiss }
})
