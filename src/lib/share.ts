/**
 * Compartir un texto: en el celular abre el menú de compartir del sistema; en
 * el escritorio lo copia al portapapeles. Si el menú falla, también copia.
 */

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed'

/** Lo que se usa del navegador; en las pruebas se reemplaza por un doble. */
export interface ShareEnvironment {
  share?: (data: { text: string; title?: string }) => Promise<void>
  writeClipboard?: (text: string) => Promise<void>
  /** Copia con el método antiguo (textarea + execCommand); devuelve si funcionó. */
  legacyCopy?: (text: string) => boolean
  /** ¿Pantalla táctil? Chrome en Windows también tiene navigator.share, pero ahí se copia. */
  isTouch: boolean
}

function legacyCopy(text: string): boolean {
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    area.remove()
  }
}

export function browserShareEnvironment(): ShareEnvironment {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined
  return {
    share: nav?.share ? (data) => nav.share(data) : undefined,
    writeClipboard: nav?.clipboard?.writeText ? (text) => nav.clipboard.writeText(text) : undefined,
    legacyCopy: typeof document !== 'undefined' ? legacyCopy : undefined,
    isTouch:
      typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches ?? false),
  }
}

async function copy(text: string, env: ShareEnvironment): Promise<ShareOutcome> {
  if (env.writeClipboard) {
    try {
      await env.writeClipboard(text)
      return 'copied'
    } catch {
      // Sin permiso o fuera de un contexto seguro: se prueba el método antiguo.
    }
  }
  return env.legacyCopy?.(text) ? 'copied' : 'failed'
}

export async function shareText(
  text: string,
  options: { title?: string } = {},
  env: ShareEnvironment = browserShareEnvironment(),
): Promise<ShareOutcome> {
  if (env.isTouch && env.share) {
    try {
      await env.share({ text, ...options })
      return 'shared'
    } catch (error) {
      // Cerrar el menú no es un error: no se copia nada.
      if (error instanceof Error && error.name === 'AbortError') return 'cancelled'
    }
  }
  return copy(text, env)
}
