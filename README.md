# GeoRetos

Retos de geografía en español para aprender jugando, pensados para el celular.

- **Ubica el país**: encuentra cada país en el mapa con 3 intentos (3, 2 o 1 punto).
- **Trivia**: 10 preguntas de 4 opciones sobre capitales, banderas, continentes,
  superficie, fronteras y países sin salida al mar, en tres dificultades.
- **Silueta**: ves solo la forma de un país y tienes 6 intentos para escribir su
  nombre. Cada fallo dice a cuántos km está y en qué dirección. Hay partidas de
  práctica (5 o 10 siluetas) y una **silueta del día**, igual para todos.

Todo corre en el navegador: no hay servidor ni cuentas. Los récords se guardan en
`localStorage` de cada dispositivo.

## Requisitos

- Node.js 22.18 o posterior (probado con Node 24) y npm.

## Instalar y correr

```bash
npm install
npm run dev
```

Abre la dirección que muestra la consola (por defecto http://localhost:5173).

## Probar

```bash
npm test            # pruebas una vez (Vitest)
npm run test:unit   # pruebas en modo observación
npm run lint        # oxlint + ESLint (corrige lo que puede)
npm run type-check  # TypeScript estricto con vue-tsc
```

Las pruebas cubren el generador aleatorio con semilla, el puntaje, el generador de
preguntas (que la respuesta correcta lo sea según los datos, que no se repitan
preguntas ni opciones, las reglas de dificultad…), la configuración en la URL y la
integridad de los datos (cada país jugable tiene nombre, capital, bandera y forma o
círculo en el mapa).

## Publicar

```bash
npm run build       # comprueba tipos y genera dist/
npm run preview     # sirve dist/ en local para revisarlo
```

`dist/` es un sitio estático: súbelo a cualquier hosting. Como usa rutas reales
(`/mapa`, `/trivia`, `/silueta/diario`), el hosting debe devolver `index.html` para
cualquier ruta.

- **Netlify** (ya configurado): `netlify.toml` define el build (`npm run build`,
  Node 24), la carpeta `dist`, la redirección de rutas y la caché de `/assets`.
  Con la CLI: `npx netlify-cli deploy --prod`; o conecta el repositorio en Netlify
  para que cada push publique solo.
- **Cloudflare Pages**: crea `public/_redirects` con `/* /index.html 200`.
- **Vercel**: `vercel.json` con `{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }`.
- **GitHub Pages**: copia `dist/index.html` como `dist/404.html` y, si el sitio vive
  en una subcarpeta, compila con `npx vite build --base=/nombre-del-repo/`.

## Modo Silueta

- **Intentos**: 6. Puntos: 6 al primer intento, 5 al segundo… 1 al sexto, 0 si no
  sale.
- **Pistas**: la distancia es la del círculo máximo entre los centroides de los dos
  países, y la flecha marca el rumbo inicial de esa ruta (también en texto: "al
  noreste"). Además, la silueta trae una barra de escala en km.
- **Campo de texto**: autocompleta solo países jugables, ignora tildes, mayúsculas y
  signos, y acepta alias comunes (Holanda, EE. UU., Birmania…) definidos en
  `scripts/excepciones.ts`.
- **Silueta del día** (`/silueta/diario`): la fecha local da la semilla
  (`diario-AAAA-MM-DD`) y el número de reto (el 12 de octubre de 2026 es el nº 1),
  en `src/lib/daily.ts`. El país sale de una permutación fija del grupo de siluetas,
  así que no se repite hasta agotarlas. El progreso del día se guarda en
  `localStorage`: recargar no reinicia el reto ni permite repetirlo.
- **Qué países tienen silueta**: 173. Quedan fuera Tuvalu (sin forma) y los
  microestados cuya forma en el mapa tiene menos de 25 puntos (Vaticano, Mónaco…),
  pero se pueden escribir como respuesta.

## Datos de países

`src/data/countries.json` y `src/data/siluetas.json` se generan con:

```bash
npm run build:countries
```

El script (`scripts/build-countries.ts`) une
[world-countries](https://github.com/mledoze/countries) con el TopoJSON de
[world-atlas](https://github.com/topojson/world-atlas) (`countries-50m`) por código
numérico (ccn3 = id del TopoJSON) y:

- marca como jugables los 193 miembros de la ONU más Ciudad del Vaticano y Palestina;
  los demás territorios se dibujan pero no se preguntan;
- traduce las capitales con `scripts/capitales-es.ts` y **falla si a un país jugable le
  falta su capital en español**;
- resuelve los casos especiales con `scripts/excepciones.ts`: nombres corregidos,
  capitales múltiples (una principal; las otras nunca salen como opción incorrecta),
  formas sin id (Somalilandia → Somalia, Chipre del Norte → Chipre, Kosovo…) y qué
  países se dibujan como círculo;
- lista los países jugables sin forma (Tuvalu) y las formas sin datos (glaciar de
  Siachen);
- calcula el **territorio principal** de cada país (`scripts/territory.ts`): agrupa
  los polígonos a menos de 600 km entre sí y se queda el grupo más grande. Así
  Francia queda sin la Guayana, Ecuador sin Galápagos y España sin Canarias, pero
  Indonesia o Japón conservan todas sus islas. Con él se obtienen el **centroide**
  (para distancias y rumbos) y la **silueta**, proyectada con Equal Earth y
  simplificada (`scripts/silhouette-path.ts`).

## Identidad visual: "atlas risográfico"

GeoRetos se ve como un cuaderno de expedición impreso en risografía:

- **Papel y tinta**: fondo crema con grano, texto y bordes en tinta azul marino y
  sombras duras de imprenta (los botones se "hunden" al pulsar).
- **Cuatro tintas**: cobalto (marca), rosa flúor (acentos y récords), sol y jade. El
  verde, el amarillo y el tomate marcan acierto, acierto tardío y fallo, siempre con
  una forma distinta además del color (círculo con ✓, círculo con –, rombo con ✕).
- **Tipografía**: Fraunces (con el eje SOFT al máximo) para títulos, Bricolage
  Grotesque para el texto e IBM Plex Mono para etiquetas tipo coordenadas. Las tres
  van autoalojadas con Fontsource: no se pide nada a Google.
- **Objetos de viaje**: la ruta con un avión como barra de progreso, sellos de
  pasaporte para los récords, boletos para las opciones de trivia, láminas de atlas
  (marcas de registro, rosa de los vientos) para los mapas y un pase de abordar en los
  resultados, con código de barras generado a partir de la semilla.

Los tokens (colores, fuentes, sombras, animaciones) están en `src/assets/main.css`
y los componentes de identidad en `src/components/brand/`. El globo de la portada es
una proyección ortográfica real precalculada con `npm run build:globe`, así la
portada no carga d3 ni el TopoJSON.

## Estructura

```
scripts/            generación de datos (capitales, excepciones)
src/i18n/es.ts      todos los textos de la interfaz (para traducir, copia este archivo)
src/data/           countries.json generado
src/lib/            lógica sin Vue: semilla, preguntas, puntaje, regiones, URL, mapa
src/stores/         Pinia: partida de cada modo, último resultado, récords
src/components/     WorldMap.vue (mapa reutilizable) y piezas de cada modo
src/views/          portada, Ubica el país, Trivia, resultados
src/__tests__/      pruebas con Vitest
```

### Mapa (`WorldMap.vue`)

SVG dibujado con d3-geo (proyección Equal Earth), d3-zoom y topojson-client. Sin
nombres ni etiquetas. Props: `highlights` (país → color con significado), `region`
(zoom a una caja fija de coordenadas), `active` (países tocables; el resto se
atenúa), `focus` (zoom a un país), `blink` e `interactive`. Emite `select` con el
código del país tocado; arrastrar no cuenta como toque. Los países diminutos o sin
forma se dibujan como círculos que mantienen su tamaño en pantalla. El TopoJSON se
descarga solo cuando se abre un mapa.

### Partidas reproducibles

Cada partida se genera con un generador aleatorio con semilla y su configuración va
en la URL, por ejemplo:

- `/mapa?region=sudamerica&n=10&seed=k3x9tq`
- `/trivia?dificultad=media&region=europa&tiempo=1&seed=k3x9tq`
- `&paises=co,ec` limita la partida a esos países ("Repasar fallos").

La misma URL produce siempre la misma partida: es la base del futuro reto diario y de
compartir retos.

## Créditos

Formas: Natural Earth vía world-atlas. Datos: world-countries (ODbL). Banderas:
flag-icons (MIT).
