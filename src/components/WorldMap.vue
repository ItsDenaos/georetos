<script setup lang="ts">
/**
 * Mapa del mundo reutilizable: SVG con d3-geo y d3-zoom, sin nombres ni etiquetas.
 *
 * - highlights: país → color con significado (ver lib/map.ts).
 * - region: región a la que hace zoom (cajas fijas de lib/regions.ts).
 * - active: países que se pueden tocar; el resto se atenúa (null = todos los jugables).
 * - focus: país al que hacer zoom (tiene prioridad sobre la región).
 * - blink: país que parpadea.
 * - interactive: si se puede tocar, arrastrar y hacer zoom.
 * Emite "select" con el código del país tocado (nunca al terminar un arrastre).
 */
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useId, watch } from 'vue'
import { geoEqualEarth, geoGraticule10, geoPath, type GeoProjection } from 'd3-geo'
import { select } from 'd3-selection'
import 'd3-transition'
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom'

import { es } from '@/i18n/es'
import { PLAYABLE, getCountry } from '@/lib/countries'
import { MAP_PATTERNS, type MapColor, type MapHighlights } from '@/lib/map'
import { REGION_VIEWS, boxAround, type GeoBox } from '@/lib/regions'
import type { Country, RegionId } from '@/lib/types'
import { loadWorld, type WorldShape } from '@/lib/world'

const props = withDefaults(
  defineProps<{
    highlights?: MapHighlights
    region?: RegionId
    active?: readonly string[] | null
    focus?: string | null
    blink?: string | null
    interactive?: boolean
    label?: string
  }>(),
  {
    highlights: () => ({}),
    region: 'mundo',
    active: null,
    focus: null,
    blink: null,
    interactive: true,
    label: undefined,
  },
)

const emit = defineEmits<{ select: [code: string] }>()

const uid = useId()
const MAX_ZOOM = 80
/** Radio en pantalla (px) de los círculos de países diminutos y de su zona táctil. */
const DOT_RADIUS = 4.5
const HIT_RADIUS = 12
/** Más de esta distancia (px) entre pulsar y soltar es un arrastre, no un toque. */
const TAP_TOLERANCE = 6

const container = ref<HTMLDivElement | null>(null)
const svgEl = ref<SVGSVGElement | null>(null)
const layer = ref<SVGGElement | null>(null)

const size = ref({ width: 0, height: 0 })
const shapes = shallowRef<WorldShape[] | null>(null)
const loadError = ref(false)
const paths = shallowRef<string[]>([])
const spherePath = ref('')
const graticulePath = ref('')
const projection = shallowRef<GeoProjection | null>(null)
/** Escala actual del zoom: mantiene círculos y tramas del mismo tamaño en pantalla. */
const k = ref(1)

let zoomBehavior: ZoomBehavior<SVGSVGElement, unknown> | null = null
let resizeObserver: ResizeObserver | null = null
let pointerStart: { x: number; y: number } | null = null

const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const activeSet = computed(() => (props.active ? new Set(props.active) : null))
const centerLon = computed(() => REGION_VIEWS[props.region].centerLon)

function isActive(code: string | null): boolean {
  if (!code) return false
  if (activeSet.value) return activeSet.value.has(code)
  return getCountry(code)?.playable ?? false
}

function fillFor(code: string | null): string {
  const color: MapColor | undefined = code ? props.highlights[code] : undefined
  if (color) return MAP_PATTERNS[color] ? `url(#${uid}-${color})` : `var(--map-${color})`
  if (activeSet.value && !isActive(code)) return 'var(--map-dim)'
  return isActive(code) ? 'var(--map-land)' : 'var(--map-muted)'
}

function classFor(code: string | null): string {
  const classes = ['land']
  if (props.interactive && isActive(code)) classes.push('clickable')
  if (code && code === props.blink) classes.push('blink')
  return classes.join(' ')
}

/** Círculos para países diminutos o sin forma. */
const markers = computed(() => {
  const proj = projection.value
  if (!proj) return []
  return PLAYABLE.flatMap((c) => {
    const visible = props.highlights[c.code] || (props.interactive && isActive(c.code))
    if (!c.marker || !visible) return []
    const point = proj([c.latlng[1], c.latlng[0]])
    return point ? [{ code: c.code, x: point[0], y: point[1] }] : []
  })
})

const patterns = computed(() =>
  (Object.keys(MAP_PATTERNS) as MapColor[]).flatMap((color) => {
    const kind = MAP_PATTERNS[color]
    return kind ? [{ color, kind }] : []
  }),
)

function buildProjection() {
  const { width, height } = size.value
  if (!shapes.value || width === 0 || height === 0) return
  const pad = 4
  const proj = geoEqualEarth()
    .rotate([-centerLon.value, 0])
    .fitExtent(
      [
        [pad, pad],
        [width - pad, height - pad],
      ],
      { type: 'Sphere' },
    )
  const path = geoPath(proj).digits(1)
  paths.value = shapes.value.map((s) => path(s.feature) ?? '')
  spherePath.value = path({ type: 'Sphere' }) ?? ''
  graticulePath.value = path(geoGraticule10()) ?? ''
  projection.value = proj
}

/** Transformación de zoom que encuadra una caja de coordenadas. */
function boxTransform(box: GeoBox): ZoomTransform {
  const proj = projection.value
  const { width, height } = size.value
  if (!proj) return zoomIdentity
  const [[west, south], [east, north]] = box
  const xs: number[] = []
  const ys: number[] = []
  // Se muestrean los bordes: en esta proyección la caja no es un rectángulo.
  for (let i = 0; i <= 24; i++) {
    const lon = west + ((east - west) * i) / 24
    const lat = south + ((north - south) * i) / 24
    for (const p of [
      [lon, south],
      [lon, north],
      [west, lat],
      [east, lat],
    ] as [number, number][]) {
      const xy = proj(p)
      if (xy) {
        xs.push(xy[0])
        ys.push(xy[1])
      }
    }
  }
  if (xs.length === 0) return zoomIdentity
  const x0 = Math.min(...xs)
  const x1 = Math.max(...xs)
  const y0 = Math.min(...ys)
  const y1 = Math.max(...ys)
  const contain = Math.min(width / (x1 - x0), height / (y1 - y0))
  const cover = Math.max(width / (x1 - x0), height / (y1 - y0))
  // En pantallas muy verticales u horizontales se recorta un poco la caja para aprovechar el espacio.
  const scale = Math.min(MAX_ZOOM, cover * 0.94, contain * 1.25 * 0.94)
  return zoomIdentity
    .translate(width / 2 - (scale * (x0 + x1)) / 2, height / 2 - (scale * (y0 + y1)) / 2)
    .scale(scale)
}

/** Caja alrededor de un país, sin cruzar el borde del mapa (por ejemplo Fiyi o Samoa). */
function focusBox(country: Country): GeoBox {
  const center = centerLon.value
  const [lat, lon] = country.latlng
  // Longitud llevada al rango visible [centro − 180, centro + 180).
  const visibleLon = ((((lon - center + 180) % 360) + 360) % 360) - 180 + center
  const [[west, south], [east, north]] = boxAround([lat, visibleLon], country.area)
  const edge = 179.5
  return [
    [Math.max(west, center - edge), south],
    [Math.min(east, center + edge), north],
  ]
}

function targetTransform(): ZoomTransform {
  const focusCountry = props.focus ? getCountry(props.focus) : undefined
  if (focusCountry) return boxTransform(focusBox(focusCountry))
  const box = REGION_VIEWS[props.region].box
  return box ? boxTransform(box) : zoomIdentity
}

function applyView(animate: boolean) {
  if (!svgEl.value || !zoomBehavior) return
  const selection = select(svgEl.value)
  const transform = targetTransform()
  if (animate && !reducedMotion) {
    selection.transition().duration(700).call(zoomBehavior.transform, transform)
  } else {
    selection.interrupt().call(zoomBehavior.transform, transform)
  }
}

function setupZoom() {
  if (!svgEl.value || !layer.value) return
  const { width, height } = size.value
  const g = layer.value
  zoomBehavior ??= zoom<SVGSVGElement, unknown>().on(
    'zoom',
    (event: { transform: ZoomTransform }) => {
      g.setAttribute('transform', event.transform.toString())
      k.value = event.transform.k
    },
  )
  zoomBehavior
    .scaleExtent([1, MAX_ZOOM])
    .translateExtent([
      [0, 0],
      [width, height],
    ])
    .extent([
      [0, 0],
      [width, height],
    ])
  const selection = select(svgEl.value)
  if (props.interactive) {
    // Sin doble clic para acercar: tocar dos veces seguidas un país no debe hacer zoom.
    selection.call(zoomBehavior).on('dblclick.zoom', null)
  }
  applyView(false)
}

function zoomBy(factor: number) {
  if (!svgEl.value || !zoomBehavior) return
  const selection = select(svgEl.value)
  if (reducedMotion) selection.call(zoomBehavior.scaleBy, factor)
  else selection.transition().duration(250).call(zoomBehavior.scaleBy, factor)
}

function onPointerDown(event: PointerEvent) {
  pointerStart = { x: event.clientX, y: event.clientY }
}

/** Un solo listener para todo el mapa: el país sale del data-code más cercano. */
function onClick(event: MouseEvent) {
  const code = (event.target as Element | null)?.closest('[data-code]')?.getAttribute('data-code')
  if (!props.interactive || !code || !isActive(code)) return
  if (pointerStart) {
    const moved = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y)
    if (moved > TAP_TOLERANCE) return
  }
  emit('select', code)
}

function measure() {
  const el = container.value
  if (!el) return
  const width = Math.round(el.clientWidth)
  const height = Math.round(el.clientHeight)
  if (width !== size.value.width || height !== size.value.height) size.value = { width, height }
}

onMounted(() => {
  measure()
  resizeObserver = new ResizeObserver(() => requestAnimationFrame(measure))
  if (container.value) resizeObserver.observe(container.value)
  loadWorld()
    .then((loaded) => {
      shapes.value = loaded
    })
    .catch(() => {
      loadError.value = true
    })
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  if (svgEl.value) select(svgEl.value).interrupt().on('.zoom', null)
})

// Nuevo tamaño, datos o rotación: se recalculan las formas y se reencuadra sin animar.
watch([size, shapes, centerLon], () => {
  buildProjection()
  // El SVG puede montarse en este mismo ciclo: se espera al siguiente frame.
  requestAnimationFrame(setupZoom)
})

watch(
  () => [props.focus, props.region] as const,
  () => applyView(true),
)

defineExpose({ reset: () => applyView(true) })
</script>

<template>
  <div ref="container" class="world-map relative h-full w-full overflow-hidden">
    <svg
      v-if="projection"
      ref="svgEl"
      :width="size.width"
      :height="size.height"
      :viewBox="`0 0 ${size.width} ${size.height}`"
      role="img"
      :aria-label="label ?? es.map.label"
      class="block touch-none select-none"
      @pointerdown.capture="onPointerDown"
      @click="onClick"
    >
      <defs>
        <!-- Océano grabado: líneas onduladas que no cambian de tamaño con el zoom -->
        <pattern
          :id="`${uid}-sea`"
          patternUnits="userSpaceOnUse"
          width="16"
          height="8"
          :patternTransform="`scale(${1 / k})`"
        >
          <rect width="16" height="8" fill="var(--map-ocean)" />
          <path
            d="M0 4.5q4-2.4 8 0t8 0"
            fill="none"
            stroke="var(--map-ocean-ink)"
            stroke-width="0.8"
          />
        </pattern>
        <pattern
          v-for="p in patterns"
          :id="`${uid}-${p.color}`"
          :key="p.color"
          patternUnits="userSpaceOnUse"
          width="7"
          height="7"
          :patternTransform="`scale(${1 / k})`"
        >
          <rect width="7" height="7" :style="{ fill: `var(--map-${p.color})` }" />
          <path
            v-if="p.kind === 'stripes'"
            d="M-1,1 l2,-2 M0,7 l7,-7 M6,8 l2,-2"
            class="pattern-ink"
            stroke-width="1.6"
          />
          <circle v-else cx="3.5" cy="3.5" r="1.3" class="pattern-dot" />
        </pattern>
      </defs>
      <g ref="layer">
        <path class="sphere" :d="spherePath" :style="{ fill: `url(#${uid}-sea)` }" />
        <path class="graticule" :d="graticulePath" />
        <path
          v-for="(shape, i) in shapes"
          :key="shape.key"
          v-memo="[paths[i], fillFor(shape.code), classFor(shape.code)]"
          :d="paths[i]"
          :class="classFor(shape.code)"
          :style="{ fill: fillFor(shape.code) }"
          :data-code="shape.code ?? undefined"
        />
        <g
          v-for="m in markers"
          :key="m.code"
          :transform="`translate(${m.x},${m.y})`"
          :class="classFor(m.code)"
          class="marker"
          :data-code="m.code"
        >
          <circle class="hit" :r="HIT_RADIUS / k" />
          <circle class="dot" :r="DOT_RADIUS / k" :style="{ fill: fillFor(m.code) }" />
        </g>
      </g>
    </svg>

    <div
      v-if="!projection"
      class="absolute inset-0 grid place-items-center p-6 text-center"
      role="status"
    >
      <div class="flex flex-col items-center gap-3">
        <svg
          v-if="!loadError"
          viewBox="0 0 48 48"
          class="size-12 animate-spin [animation-duration:2.4s]"
          aria-hidden="true"
        >
          <circle
            cx="24"
            cy="24"
            r="20"
            fill="none"
            stroke="var(--color-ink)"
            stroke-width="2.5"
            stroke-dasharray="6 6"
          />
          <path
            d="M24 8l4 16-4 16-4-16z"
            fill="var(--color-tomato)"
            stroke="var(--color-ink)"
            stroke-width="1.6"
            stroke-linejoin="round"
          />
        </svg>
        <p class="label-mono max-w-xs">{{ loadError ? es.map.error : es.map.loading }}</p>
      </div>
    </div>

    <div
      v-if="interactive && projection"
      class="absolute top-2 right-2 flex flex-col gap-1.5"
      role="group"
      :aria-label="es.map.label"
    >
      <button type="button" class="map-btn" :aria-label="es.map.zoomIn" @click="zoomBy(1.6)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      </button>
      <button type="button" class="map-btn" :aria-label="es.map.zoomOut" @click="zoomBy(1 / 1.6)">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14" /></svg>
      </button>
      <button type="button" class="map-btn" :aria-label="es.map.reset" @click="applyView(true)">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="7" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.world-map {
  background: var(--map-ocean);
  background-image: var(--grain);
}

.sphere {
  stroke: var(--map-border-strong);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}

.graticule {
  fill: none;
  stroke: var(--map-graticule);
  stroke-width: 0.8;
  stroke-dasharray: 2 4;
  vector-effect: non-scaling-stroke;
}

.land {
  stroke: var(--map-border);
  stroke-width: 0.75;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
  transition: filter 120ms ease;
}

.land:not(.clickable) {
  pointer-events: none;
}

.clickable {
  cursor: pointer;
}

@media (hover: hover) {
  path.clickable:hover,
  .marker.clickable:hover .dot {
    filter: brightness(0.9) saturate(1.35);
    stroke: var(--map-border-strong);
    stroke-width: 1.8;
  }
}

.marker .hit {
  fill: transparent;
  stroke: none;
}

.marker .dot {
  stroke: var(--map-border-strong);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}

.pattern-ink {
  stroke: var(--map-pattern-ink);
}

.pattern-dot {
  fill: var(--map-pattern-ink);
}

.blink,
.blink .dot {
  animation: map-blink 0.5s ease-in-out 8 alternate;
}

@keyframes map-blink {
  from {
    fill: var(--map-focus);
  }
  to {
    fill: var(--map-blink);
  }
}

@media (prefers-reduced-motion: reduce) {
  .blink,
  .blink .dot {
    animation: none;
    fill: var(--map-focus);
  }
}

.map-btn {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 2px solid var(--color-ink);
  border-radius: 0.7rem;
  background: var(--color-paper-light);
  color: var(--color-ink);
  box-shadow: 2px 2px 0 0 var(--color-ink);
  transition:
    transform 120ms ease,
    box-shadow 120ms ease;
}

.map-btn:hover {
  background: var(--color-sun);
}

.map-btn:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}

.map-btn svg {
  width: 1.3rem;
  height: 1.3rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.6;
  stroke-linecap: round;
}
</style>
