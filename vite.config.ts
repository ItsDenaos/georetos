import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import vueDevTools from 'vite-plugin-vue-devtools'

/** Papel crema de la marca: fondo de la pantalla de inicio de la app instalada. */
const PAPER = '#f6f0e1'

/** Banderas que se guardan para jugar sin internet: solo las de países jugables. */
const playableFlags = new Set(
  (
    JSON.parse(
      readFileSync(new URL('./src/data/countries.json', import.meta.url), 'utf8'),
    ) as { code: string; playable: boolean }[]
  )
    .filter((country) => country.playable)
    .map((country) => country.code),
)

/**
 * Qué se guarda en la caché para jugar sin internet. Se dejan fuera las
 * banderas regionales (Galicia, Escocia…) y los alfabetos que no usa el español
 * (latin-ext, cirílico, vietnamita): bastan los caracteres latinos.
 */
function keepOffline(entry: { url: string }): boolean {
  const flag = entry.url.match(/^assets\/banderas\/([^.]+)\./)
  if (flag) return playableFlags.has(flag[1] ?? '')
  if (entry.url.endsWith('.woff2')) {
    return entry.url.includes('-latin-') && !entry.url.includes('-latin-ext-')
  }
  return true
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    vueDevTools(),
    VitePWA({
      // Al publicar una versión nueva se avisa ("Actualizar"), sin cortar una partida.
      registerType: 'prompt',
      // El registro lo hace src/components/UpdatePrompt.vue.
      injectRegister: false,
      // Los íconos de public/ ya entran en la caché por globPatterns.
      includeManifestIcons: false,
      manifest: {
        name: 'GeoRetos',
        short_name: 'GeoRetos',
        description:
          'Retos de geografía para aprender jugando: mapa, trivia, siluetas y más, también sin internet.',
        lang: 'es',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: PAPER,
        theme_color: PAPER,
        categories: ['education', 'games'],
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,json}'],
        manifestTransforms: [
          (entries) => ({ manifest: entries.filter(keepOffline), warnings: [] }),
        ],
        // El mapa del mundo pesa unos 760 KB.
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
        // Cualquier ruta (/silueta/diario, /progreso…) abre la app desde la caché.
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Las banderas van como archivos: incrustadas inflarían el JS de cada vista.
    assetsInlineLimit: (filePath) => (filePath.includes('flag-icons') ? false : undefined),
    rolldownOptions: {
      output: {
        // Las banderas, en su carpeta y con el código antes de un punto (es.Hx3….svg):
        // así se sabe cuáles guardar para jugar sin internet.
        assetFileNames: (asset) =>
          asset.originalFileNames.some((name) => name.includes('flag-icons'))
            ? 'assets/banderas/[name].[hash][extname]'
            : 'assets/[name]-[hash][extname]',
      },
    },
  },
})
