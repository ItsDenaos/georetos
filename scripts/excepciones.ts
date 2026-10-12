/**
 * Casos especiales que build-countries no puede resolver solo con los paquetes.
 * Todas las claves son cca2 en mayúsculas, como en world-countries.
 */

/** Jugables además de los 193 miembros de la ONU. */
export const EXTRA_JUGABLES = ['VA', 'PS']

/** Nombres en español que corregimos respecto a world-countries. */
export const NOMBRES_ES: Record<string, string> = {
  CD: 'República Democrática del Congo',
  CG: 'República del Congo',
  IR: 'Irán',
  SZ: 'Esuatini',
  SL: 'Sierra Leona',
  BH: 'Baréin',
  GD: 'Granada',
  DJ: 'Yibuti',
  BW: 'Botsuana',
  SA: 'Arabia Saudita',
  KG: 'Kirguistán',
  ML: 'Malí',
  FO: 'Islas Feroe',
  AX: 'Islas Åland',
  MF: 'San Martín (Francia)',
  SX: 'San Martín (Países Bajos)',
  VG: 'Islas Vírgenes Británicas',
  VI: 'Islas Vírgenes de EE. UU.',
  CX: 'Territorios australianos del océano Índico',
}

/**
 * Países con más de una capital: la principal es la que se pregunta; las otras
 * nunca se ofrecen como opción incorrecta (serían correctas también).
 */
export const CAPITALES_MULTIPLES: Record<string, { principal: string; otras: string[] }> = {
  ZA: { principal: 'Pretoria', otras: ['Bloemfontein', 'Ciudad del Cabo'] },
  BO: { principal: 'Sucre', otras: ['La Paz'] },
  NL: { principal: 'Ámsterdam', otras: ['La Haya'] },
  MY: { principal: 'Kuala Lumpur', otras: ['Putrajaya'] },
  LK: { principal: 'Colombo', otras: ['Sri Jayawardenepura Kotte'] },
  CI: { principal: 'Yamusukro', otras: ['Abiyán'] },
  BJ: { principal: 'Porto Novo', otras: ['Cotonú'] },
  SZ: { principal: 'Mbabane', otras: ['Lobamba'] },
  TZ: { principal: 'Dodoma', otras: ['Dar es-Salam'] },
  BI: { principal: 'Gitega', otras: ['Buyumbura'] },
  ME: { principal: 'Podgorica', otras: ['Cetinje'] },
  // Jerusalén Este es la capital reclamada; Ramala es la sede administrativa.
  PS: { principal: 'Ramala', otras: ['Jerusalén'] },
}

/**
 * Formas del TopoJSON (world-atlas) que no traen id numérico. Se unen por nombre:
 * el valor es el cca2 del país al que pertenecen, o null si se dibujan sin país.
 */
export const FORMAS_SIN_ID: Record<string, string | null> = {
  Somaliland: 'SO',
  'N. Cyprus': 'CY',
  Kosovo: 'XK',
  'Indian Ocean Ter.': 'CX',
  'Siachen Glacier': null,
}

/** Por debajo de esta superficie (km²) el país se dibuja también como círculo. */
export const MARCADOR_AREA_MAX = 6500

/** Países más grandes que el umbral pero formados por islas finas o dispersas. */
export const MARCADOR_FORZADO = ['BS', 'VU']

/** Mínimo de vértices del territorio principal para que la silueta se reconozca. */
export const SILUETA_MIN_VERTICES = 25

/**
 * Nombres alternativos que se aceptan al escribir un país (además del nombre
 * oficial en español de world-countries). No pueden coincidir con otro país.
 */
export const ALIAS_ES: Record<string, string[]> = {
  US: ['EE. UU.', 'USA', 'Estados Unidos de América'],
  GB: ['Gran Bretaña'],
  NL: ['Holanda'],
  MM: ['Birmania'],
  CZ: ['República Checa'],
  SZ: ['Suazilandia', 'Eswatini'],
  TL: ['Timor-Leste'],
  CI: ["Côte d'Ivoire"],
  CD: ['RD Congo', 'Congo-Kinshasa', 'Zaire'],
  CG: ['Congo-Brazzaville'],
  MK: ['Macedonia'],
  VA: ['Vaticano'],
  AE: ['Emiratos'],
  BY: ['Belarús'],
  MD: ['Moldova'],
  BH: ['Bahrein', 'Bahréin'],
  BW: ['Botswana'],
  DJ: ['Djibouti'],
  KG: ['Kirguizistán', 'Kirguizia'],
  SA: ['Arabia Saudí'],
  SL: ['Sierra Leone'],
  BA: ['Bosnia'],
  TT: ['Trinidad'],
  KN: ['San Cristóbal'],
  VC: ['San Vicente'],
  AG: ['Antigua'],
  PG: ['Papúa'],
  GW: ['Guinea-Bissau'],
  CF: ['Centroáfrica'],
  DO: ['Dominicana'],
  MX: ['Méjico'],
  FM: ['Estados Federados de Micronesia'],
  BS: ['Las Bahamas'],
  GM: ['La Gambia'],
  KZ: ['Kazajstán'],
  QA: ['Qatar'],
  KE: ['Kenya'],
  PS: ['Estado de Palestina'],
}

export const SUBREGIONES_ES: Record<string, string> = {
  'Southern Asia': 'Asia del Sur',
  'Middle Africa': 'África Central',
  'Southeast Europe': 'Europa del Sudeste',
  'Southern Europe': 'Europa del Sur',
  'Western Asia': 'Asia Occidental',
  'South America': 'Sudamérica',
  Caribbean: 'Caribe',
  'Australia and New Zealand': 'Australia y Nueva Zelanda',
  'Central Europe': 'Europa Central',
  'Eastern Africa': 'África Oriental',
  'Western Europe': 'Europa Occidental',
  'Western Africa': 'África Occidental',
  'Eastern Europe': 'Europa del Este',
  'Central America': 'Centroamérica',
  'South-Eastern Asia': 'Sudeste Asiático',
  'Southern Africa': 'África Austral',
  'North America': 'Norteamérica',
  'Eastern Asia': 'Asia Oriental',
  'Northern Europe': 'Europa del Norte',
  'Northern Africa': 'África del Norte',
  Melanesia: 'Melanesia',
  Micronesia: 'Micronesia',
  'Central Asia': 'Asia Central',
  Polynesia: 'Polinesia',
}
