/**
 * Tema claro u oscuro. La preferencia ("sistema", "claro" u "oscuro") se guarda
 * en localStorage; el script de index.html la aplica antes de pintar para que no
 * haya destello, y este composable la mantiene al día.
 */
import { computed, ref, watchEffect } from 'vue'

export type ThemePreference = 'system' | 'light' | 'dark'

/** La misma clave que lee el script de index.html. */
export const THEME_STORAGE_KEY = 'georetos:v1:tema'
const THEME_COLORS = { light: '#f6f0e1', dark: '#12152a' } as const
const ORDER: readonly ThemePreference[] = ['system', 'light', 'dark']

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

const media =
  typeof window !== 'undefined' ? window.matchMedia?.('(prefers-color-scheme: dark)') : undefined
const preference = ref<ThemePreference>(readPreference())
const systemDark = ref(media?.matches ?? false)
media?.addEventListener('change', (event) => (systemDark.value = event.matches))

const resolved = computed<'light' | 'dark'>(() =>
  preference.value === 'system' ? (systemDark.value ? 'dark' : 'light') : preference.value,
)

let started = false

/** Aplica el tema al documento (se llama una vez al arrancar la app). */
export function startTheme() {
  if (started || typeof document === 'undefined') return
  started = true
  watchEffect(() => {
    document.documentElement.dataset.theme = resolved.value
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLORS[resolved.value])
  })
}

export function useTheme() {
  function setPreference(value: ThemePreference) {
    preference.value = value
    try {
      if (value === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
      else localStorage.setItem(THEME_STORAGE_KEY, value)
    } catch {
      // Sin almacenamiento: el tema vale solo para esta visita.
    }
  }

  /** Sistema → claro → oscuro → sistema… */
  function cycle() {
    const next = ORDER[(ORDER.indexOf(preference.value) + 1) % ORDER.length] ?? 'system'
    setPreference(next)
  }

  return { preference, resolved, setPreference, cycle }
}
