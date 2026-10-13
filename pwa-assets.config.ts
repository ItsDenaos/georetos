/**
 * Íconos de la PWA, generados desde el emblema (public/favicon.svg) con
 * `npm run build:icons`. Quedan en public/ y se versionan con el resto.
 */
import { defineConfig, minimal2023Preset as preset } from '@vite-pwa/assets-generator/config'

/** Papel crema de la marca: fondo del ícono adaptable de Android y del de iPhone. */
const paper = '#f6f0e1'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...preset,
    // Con más margen, la punta del alfiler queda dentro de la zona segura (círculo del 80 %).
    maskable: { ...preset.maskable, padding: 0.36, resizeOptions: { background: paper } },
    apple: { ...preset.apple, resizeOptions: { background: paper } },
  },
  images: ['public/favicon.svg'],
})
