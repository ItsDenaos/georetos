/** Instalar como app: se guarda el aviso del navegador y se lanza desde un botón. */
import { describe, expect, it, vi } from 'vitest'

import { startInstallCapture, useInstall } from '@/composables/useInstall'

describe('instalar la app', () => {
  it('sin el aviso del navegador no se puede lanzar', async () => {
    const app = useInstall()
    expect(app.canPrompt.value).toBe(false)
    expect(await app.install()).toBe('unavailable')
  })

  it('guarda el aviso del navegador y lo lanza una sola vez', async () => {
    startInstallCapture()
    const prompt = vi.fn<() => Promise<void>>().mockResolvedValue()
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    })
    window.dispatchEvent(event)
    // Se evita la barra automática del navegador: el botón está en "Mi progreso".
    expect(event.defaultPrevented).toBe(true)

    const app = useInstall()
    expect(app.canPrompt.value).toBe(true)
    expect(await app.install()).toBe('accepted')
    expect(prompt).toHaveBeenCalledOnce()
    expect(app.installed.value).toBe(true)
    expect(app.canPrompt.value).toBe(false)
  })

  it('al instalarse desde el menú del navegador también se entera', () => {
    startInstallCapture()
    window.dispatchEvent(new Event('appinstalled'))
    expect(useInstall().installed.value).toBe(true)
  })
})
