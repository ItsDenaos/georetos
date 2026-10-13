/**
 * Al abrir el link de un desafío, antes de la partida se presenta el reto
 * ("Ana te desafía: 23/30. ¿Lo superas?"). Al aceptarlo se guarda para
 * comparar los resultados al final.
 */
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import {
  CHALLENGE_PARAM,
  decodeChallenge,
  describePlayed,
  gameFromRoute,
  gameKey,
} from '@/lib/challenge'
import { useChallengeStore } from '@/stores/challenge'

export function useChallengeGate() {
  const route = useRoute()
  const store = useChallengeStore()

  const present = computed(() => route.query[CHALLENGE_PARAM] !== undefined)
  /** null si el link no trae desafío o está dañado. */
  const challenge = computed(() => decodeChallenge(route.query[CHALLENGE_PARAM]))
  const game = computed(() => gameFromRoute(route.name, route.query))
  const label = computed(() =>
    game.value && challenge.value ? describePlayed(game.value, challenge.value) : null,
  )
  /** En Supervivencia las preguntas dependen de los aciertos de cada uno. */
  const endless = computed(() => game.value?.variant === 'supervivencia')

  const accepted = ref(false)
  watch(
    () => route.fullPath,
    () => (accepted.value = false),
  )
  const pending = computed(() => present.value && !accepted.value)

  function accept() {
    if (challenge.value) store.accept(gameKey(route.name, route.query), challenge.value)
    accepted.value = true
  }

  return { pending, challenge, label, endless, accept }
}
