/**
 * Banderas SVG locales del paquete flag-icons (4:3). Vite las publica como
 * archivos aparte (ver assetsInlineLimit en vite.config.ts), así que solo se
 * descarga la bandera que se muestra.
 */
const urls = import.meta.glob<string>('/node_modules/flag-icons/flags/4x3/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
})

const byCode = new Map(
  Object.entries(urls).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -4), url]),
)

export function flagUrl(code: string): string | undefined {
  return byCode.get(code)
}
