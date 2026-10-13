/**
 * Instalar GeoRetos como app. En Chrome y Android el navegador ofrece el evento
 * beforeinstallprompt, que se guarda al arrancar para lanzarlo desde un botón;
 * en iPhone no existe y se explica cómo añadirla a la pantalla de inicio.
 */
import { computed, ref, shallowRef } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  // Los iPad recientes se presentan como Mac, pero con pantalla táctil.
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

const deferred = shallowRef<BeforeInstallPromptEvent | null>(null)
const installed = ref(isStandalone())
let started = false

/** Escucha los eventos de instalación (se llama una vez al arrancar la app). */
export function startInstallCapture() {
  if (started || typeof window === 'undefined') return
  started = true
  window.addEventListener('beforeinstallprompt', (event) => {
    // Se guarda para lanzarlo desde "Mi progreso".
    event.preventDefault()
    deferred.value = event as BeforeInstallPromptEvent
  })
  window.addEventListener('appinstalled', () => {
    deferred.value = null
    installed.value = true
  })
}

export function useInstall() {
  const canPrompt = computed(() => deferred.value !== null)
  const ios = isIos()

  /** Abre el diálogo de instalación del navegador. */
  async function install(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    const event = deferred.value
    if (!event) return 'unavailable'
    await event.prompt()
    const { outcome } = await event.userChoice
    // El evento solo sirve una vez.
    deferred.value = null
    if (outcome === 'accepted') installed.value = true
    return outcome
  }

  return { installed, canPrompt, ios, install }
}
