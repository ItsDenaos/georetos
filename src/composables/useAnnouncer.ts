import { readonly, ref } from 'vue'

const message = ref('')
let clearTimer: ReturnType<typeof setTimeout> | undefined

/**
 * Anuncios para lectores de pantalla (región aria-live en App.vue).
 * Se vacía y se vuelve a escribir para que se lea aunque el texto se repita.
 */
export function useAnnouncer() {
  function announce(text: string) {
    message.value = ''
    clearTimeout(clearTimer)
    requestAnimationFrame(() => {
      message.value = text
      clearTimer = setTimeout(() => (message.value = ''), 4000)
    })
  }
  return { message: readonly(message), announce }
}
