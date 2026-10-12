/**
 * Acceso a localStorage/sessionStorage a prueba de fallos: en modo privado o con
 * el almacenamiento bloqueado, el juego sigue funcionando sin guardar.
 */

type StorageKind = 'local' | 'session'

function getStorage(kind: StorageKind): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

export function readJson<T>(key: string, fallback: T, kind: StorageKind = 'local'): T {
  try {
    const raw = getStorage(kind)?.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown, kind: StorageKind = 'local'): void {
  try {
    getStorage(kind)?.setItem(key, JSON.stringify(value))
  } catch {
    // Sin espacio o almacenamiento bloqueado: se ignora.
  }
}
