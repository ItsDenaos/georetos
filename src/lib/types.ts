/** Continentes como se enseñan en español (más la Antártida, que solo se dibuja). */
export type ContinentId = 'africa' | 'america' | 'asia' | 'europa' | 'oceania' | 'antartida'

/** Regiones para filtrar: América se divide en tres. */
export type RegionId =
  | 'mundo'
  | 'africa'
  | 'norte-centroamerica'
  | 'caribe'
  | 'sudamerica'
  | 'asia'
  | 'europa'
  | 'oceania'

/** Zona de un país: la región más pequeña a la que pertenece. */
export type ZoneId = Exclude<RegionId, 'mundo'> | 'antartida'

export type Difficulty = 'facil' | 'media' | 'dificil'

export interface Country {
  /** cca2 en minúsculas, por ejemplo "co". */
  code: string
  /** ccn3; coincide con el id del TopoJSON. Vacío si no tiene (Kosovo). */
  numeric: string
  /** Nombre común en español. */
  name: string
  /** Capital principal en español ("" en territorios no jugables sin traducción). */
  capital: string
  /** Otras capitales: nunca se usan como opción incorrecta. */
  otherCapitals: string[]
  continent: ContinentId
  zone: ZoneId
  /** Subregión en español (por ejemplo "Sudamérica" o "Europa del Sur"). */
  subregion: string
  /** Superficie en km². */
  area: number
  /** Países con frontera terrestre (códigos cca2 en minúsculas). */
  borders: string[]
  landlocked: boolean
  /** [latitud, longitud] aproximadas del centro. */
  latlng: [number, number]
  /** Miembro de la ONU, Ciudad del Vaticano o Palestina. */
  playable: boolean
  /** Se dibuja también como círculo clicable (diminuto o sin forma en el mapa). */
  marker: boolean
  /** Formas del TopoJSON sin id que pertenecen a este país (por nombre). */
  topoNames: string[]
  /** [latitud, longitud] del centroide de su territorio principal (o latlng si no tiene forma). */
  centroid: [number, number]
  /** Otros nombres aceptados al escribir (Holanda, EE. UU., nombre oficial…). */
  aliases: string[]
  /** Tiene silueta reconocible para el modo Silueta. */
  silhouette: boolean
}
