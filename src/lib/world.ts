/**
 * Carga diferida del TopoJSON de world-atlas: el archivo (~750 KB) se pide solo
 * cuando un mapa lo necesita, así la portada abre rápido.
 */
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'
import worldUrl from 'world-atlas/countries-50m.json?url'

import { countryForFeature } from './countries'

export interface WorldShape {
  /** Clave única para v-for (hay ids repetidos y formas sin id). */
  key: string
  /** Código del país, o null si la forma no pertenece a ninguno (glaciar de Siachen). */
  code: string | null
  feature: Feature<Geometry, { name: string }>
}

type WorldTopology = Topology<{ countries: GeometryCollection<{ name: string }> }>

let cache: Promise<WorldShape[]> | null = null

export function loadWorld(): Promise<WorldShape[]> {
  cache ??= fetch(worldUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json() as Promise<WorldTopology>
    })
    .then((topo) => {
      const collection = feature(topo, topo.objects.countries) as FeatureCollection<
        Geometry,
        { name: string }
      >
      return collection.features.map((f, i) => ({
        key: `${f.id ?? 'sin-id'}-${i}`,
        code: countryForFeature(f.id, f.properties.name)?.code ?? null,
        feature: f,
      }))
    })
    .catch((error: unknown) => {
      cache = null // permite reintentar
      throw error
    })
  return cache
}
