import { describe, expect, it, vi } from 'vitest'

import { shareText, type ShareEnvironment } from '@/lib/share'

type ShareFn = NonNullable<ShareEnvironment['share']>
type ClipboardFn = NonNullable<ShareEnvironment['writeClipboard']>
type LegacyFn = NonNullable<ShareEnvironment['legacyCopy']>

function env(overrides: Partial<ShareEnvironment> = {}): ShareEnvironment {
  return {
    share: vi.fn<ShareFn>(async () => {}),
    writeClipboard: vi.fn<ClipboardFn>(async () => {}),
    legacyCopy: vi.fn<LegacyFn>(() => true),
    isTouch: false,
    ...overrides,
  }
}

const abort = () => Object.assign(new Error('cancelado'), { name: 'AbortError' })

describe('compartir', () => {
  it('en el celular abre el menú del sistema', async () => {
    const e = env({ isTouch: true })
    await expect(shareText('hola', { title: 'GeoRetos' }, e)).resolves.toBe('shared')
    expect(e.share).toHaveBeenCalledWith({ text: 'hola', title: 'GeoRetos' })
    expect(e.writeClipboard).not.toHaveBeenCalled()
  })

  it('en el escritorio copia aunque exista navigator.share', async () => {
    const e = env({ isTouch: false })
    await expect(shareText('hola', {}, e)).resolves.toBe('copied')
    expect(e.share).not.toHaveBeenCalled()
    expect(e.writeClipboard).toHaveBeenCalledWith('hola')
  })

  it('si cierras el menú, no copia nada', async () => {
    const e = env({ isTouch: true, share: vi.fn<ShareFn>(async () => Promise.reject(abort())) })
    await expect(shareText('hola', {}, e)).resolves.toBe('cancelled')
    expect(e.writeClipboard).not.toHaveBeenCalled()
  })

  it('si el menú falla, copia', async () => {
    const e = env({
      isTouch: true,
      share: vi.fn<ShareFn>(async () => Promise.reject(new Error('no'))),
    })
    await expect(shareText('hola', {}, e)).resolves.toBe('copied')
    expect(e.writeClipboard).toHaveBeenCalledWith('hola')
  })

  it('sin portapapeles moderno usa el método antiguo', async () => {
    const e = env({
      writeClipboard: vi.fn<ClipboardFn>(async () => Promise.reject(new Error('sin permiso'))),
    })
    await expect(shareText('hola', {}, e)).resolves.toBe('copied')
    expect(e.legacyCopy).toHaveBeenCalledWith('hola')
  })

  it('avisa si no pudo compartir ni copiar', async () => {
    const e = env({ share: undefined, writeClipboard: undefined, legacyCopy: () => false })
    await expect(shareText('hola', {}, e)).resolves.toBe('failed')
  })
})
