# GeoRetos

Retos de geografía en español para aprender jugando, pensados para el celular.

- **Ubica el país**: encuentra cada país en el mapa con 3 intentos (3, 2 o 1 punto).
- **Trivia**: 10 preguntas de 4 opciones sobre capitales, banderas, continentes,
  superficie, fronteras y países sin salida al mar, en tres dificultades.
- **Silueta**: ves solo la forma de un país y tienes 6 intentos para escribir su
  nombre. Cada fallo dice a cuántos km está y en qué dirección. Hay partidas de
  práctica (5 o 10 siluetas) y una **silueta del día**, igual para todos.
- **Escribe los países**: eliges región y tiempo (5, 10 o 15 minutos) y escribes
  todos los países que recuerdes; cada acierto se pinta en el mapa sin pulsar Enter.
- **Reto diario**: 10 preguntas mezcladas (5 de mapa y 5 de trivia, de fácil a
  difícil), iguales para todos ese día. Se juega una vez al día, guarda la racha
  y se puede compartir el resultado.
- **Contrarreloj** y **Supervivencia**: variantes sin cantidad fija de "Ubica el
  país" y de la Trivia (ver abajo).
- **Mi progreso** (`/progreso`): estadísticas por país y continente, el mapa de lo
  que sabes, la racha de días y 10 logros.
- **Desafía a un amigo**: al terminar una partida se comparte un link con la misma
  partida y tu resultado; quien lo abre juega lo mismo y ve los dos resultados.

Se puede instalar como app y, una vez cargada, funciona sin internet.

Todo corre en el navegador: no hay servidor ni cuentas. Los récords, las
estadísticas y los logros se guardan en `localStorage` de cada dispositivo.

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
  Node 24), la carpeta `dist`, la redirección de rutas, la caché de `/assets` y que
  `sw.js` y `manifest.webmanifest` no se cacheen (así llegan las versiones nuevas).
  Con la CLI: `npx netlify-cli deploy --prod`; o conecta el repositorio en Netlify
  para que cada push publique solo.
- **Cloudflare Pages**: crea `public/_redirects` con `/* /index.html 200`.
- **Vercel**: `vercel.json` con `{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }`.
- **GitHub Pages**: copia `dist/index.html` como `dist/404.html` y, si el sitio vive
  en una subcarpeta, compila con `npx vite build --base=/nombre-del-repo/`.

## App instalable y sin internet (PWA)

- **Plugin:** `vite-plugin-pwa` (Workbox) en `vite.config.ts`. Genera
  `manifest.webmanifest` ("GeoRetos", en español, a pantalla completa, con los
  colores de la marca) y `sw.js`.
- **Sin internet:** la primera visita guarda en segundo plano lo necesario para
  jugar, unos 2,9 MB: el código y los estilos, las fuentes (solo el alfabeto
  latino, que cubre todos los nombres), el mapa (unos 740 KB), las siluetas y solo
  las 195 banderas jugables. Las banderas regionales (Galicia, Escocia…) quedan
  fuera: se publican en `assets/banderas/` con el código antes de un punto para
  poder filtrarlas. Cualquier ruta (`/silueta/diario`, `/progreso`…) abre la app
  desde la caché.
- **Actualizaciones:** al publicar una versión nueva aparece "Hay una versión
  nueva · Actualizar" (`src/components/UpdatePrompt.vue`). No es automático, para
  no cortar una partida; con la app abierta se busca una versión nueva cada hora.
- **Instalar:** en "Mi progreso" → Ajustes. En Chrome y Android hay un botón
  "Instalar app" (`src/composables/useInstall.ts` guarda el aviso del navegador al
  arrancar); en iPhone se explica "Compartir → Añadir a pantalla de inicio".
- **Íconos:** se generan desde el emblema (`public/favicon.svg`) con
  `npm run build:icons` (`pwa-assets.config.ts`) y quedan en `public/`. El ícono
  adaptable de Android lleva margen para que el alfiler no se recorte.
- **En desarrollo** (`npm run dev`) no hay service worker. Para probarlo:
  `npm run build && npm run preview`, abrir la app, detener el servidor y recargar.

## Reto diario

- **Ruta:** `/diario`. Las preguntas salen de la semilla del día
  (`diario-AAAA-MM-DD`, con la fecha local) y de la versión del generador
  (`DAILY_CHALLENGE_VERSION` en `src/lib/dailyChallenge.ts`). Si cambias cómo se
  generan, sube la versión para no alterar los retos ya jugados.
- **Orden:** mapa y trivia alternados; preguntas 1–3 fáciles, 4–7 medias y 8–10
  difíciles.
  - En el mapa, la dificultad la da la superficie del país: más de 500.000 km²,
    de 100.000 a 500.000 km², o menos de 100.000 km².
  - La trivia usa sus tres dificultades y nunca repite tema.
  - Ningún país se repite.
- **Puntaje sobre 30:** el mapa da 3, 2 o 1 punto según el intento; la trivia, 3
  si aciertas.
- **Una vez al día:** cada respuesta (y cada toque equivocado en el mapa) se
  guarda en `localStorage` al momento, así que recargar no permite volver a
  sortear. Al terminar se muestra el resultado y la **racha** de días seguidos.
- **Compartir:** en el celular abre el menú del sistema; en el escritorio copia
  este texto:
  ```
  GeoRetos · Reto diario Nº 3
  24/30 · racha de 5 🔥
  🟩🟨🟩🟥🟩🟩🟨🟩🟩🟥
  https://tu-sitio/diario
  ```

## Contrarreloj y Supervivencia

Se eligen en el primer paso de la configuración de "Ubica el país" y de la Trivia.
Las reglas están en `src/lib/variants.ts`, las preguntas a demanda en
`src/lib/streams.ts` y la partida en `src/stores/run.ts` (con
`src/components/run/RunGame.vue`). Las preguntas son las mismas de siempre
(`MapQuestion` y `TriviaQuestion`).

- **Contrarreloj:** 60 segundos para acertar todo lo que puedas; cada fallo resta 3
  segundos. En el mapa cuenta cada toque equivocado, también el que agota los 3
  intentos o el salto. Se elige región y, en la Trivia, dificultad.
- **Supervivencia:** preguntas sin fin con 3 vidas, siempre con el mundo entero.
  En el mapa la vida se pierde al fallar el país (tras 3 intentos o al saltar), no
  en cada toque. La dificultad sube cada 5 aciertos: fácil, media y difícil. En el
  mapa se mide por la superficie del país, igual que en el Reto diario.
- **Puntaje:** la cantidad de aciertos. Cada variante guarda su propio récord (por
  región y, en la Trivia contrarreloj, por dificultad). Si dos partidas empatan,
  gana la de menos fallos y después la más rápida.
- **Nunca repiten país**; si se acaban los países de la región, la partida
  termina.

## Desafía a un amigo

- **El link** es el de la misma partida (misma semilla y opciones) más
  `&desafio=…`: tu puntaje, aciertos, tiempo, la fila de resultados por pregunta y
  un nombre opcional (máximo 20 caracteres, recordado en `georetos:v1:nombre`), en
  JSON codificado en base64url. Unos 150 caracteres. Lógica en `src/lib/challenge.ts`.
- **Al abrirlo** se presenta el reto antes de jugar ("Ana te desafía: 21/30. ¿Lo
  superas?"). Al aceptarlo se guarda en `sessionStorage` (`georetos:v1:desafio`) y,
  al terminar, los resultados muestran los dos lado a lado con "¡Ganaste!", "¡Te
  ganó!" o "¡Empate!". Gana más puntos; si empatan, el menor tiempo (en segundos).
  En Contrarreloj y Supervivencia, antes que el tiempo, gana quien falló menos.
- **Funciona en todos los modos con resultados**: Ubica el país, Trivia, Silueta,
  Contrarreloj, Supervivencia y Escribe los países (ahí el reto es la misma región
  y el mismo tiempo). En Supervivencia las preguntas coinciden mientras los dos
  acierten y fallen igual, porque la dificultad depende de los aciertos. Las
  partidas de repaso no se comparten. Los retos diarios ya tienen su propio botón.
- **Versión del generador** (`GENERATOR_VERSION` en `src/lib/challenge.ts`): va
  dentro del link. Si cambias cómo se generan las partidas o los datos de países,
  súbela: un link viejo avisará de que las preguntas pueden no coincidir.
- **Validación:** el link se lee sin fiarse de él (números enteros dentro de rango,
  puntaje no mayor que el máximo, nombre sin caracteres de control y recortado, que
  se muestra siempre como texto). Un link dañado deja jugar la partida sin comparar.
  Parámetros ajenos, como el `fbclid` que añaden algunas apps, se ignoran.
- **Limitación honesta:** sin servidor, quien edite el link puede inventar un
  puntaje. Para jugar entre amigos alcanza.

## Mi progreso y logros

- **Un solo punto de registro:** cada partida terminada pasa por `finishGame` (o
  `finishDailyGame` en los retos diarios), en `src/stores/stats.ts`, que suma el
  viaje y el récord del pasaporte, las estadísticas y los logros.
- **Estadísticas** (`georetos:v1:estadisticas`, lógica pura en `src/lib/stats.ts`):
  aciertos, aciertos tardíos y fallos por país; días jugados; tiempo; regiones;
  microestados encontrados al primer intento y hazañas para los logros.
  - Escribe los países suma días, tiempo y regiones, pero no precisión por país:
    no recordar un nombre a contrarreloj no es fallarlo.
  - Las partidas de antes de esta versión no traían el detalle por pregunta. La
    primera vez se deduce lo posible: días y regiones a partir de los récords, y las
    respuestas de los retos diarios ya jugados.
- **La página:** resumen (partidas, preguntas, precisión, tiempo), racha de días con
  cualquier partida (la del Reto diario aparte), logros, precisión por continente,
  mapa de lo que sabes (verde desde el 80 %, amarillo con puntos desde el 50 %, rojo
  con rayas por debajo; tocar un país dice cómo te va), los 10 países que más fallas
  (con dos preguntas o más) con "Repasar estos países", récords por modo y ajustes
  (tema y "Borrar mi progreso", con confirmación).
- **Logros** (`georetos:v1:logros`, reglas puras en `src/lib/achievements.ts`):

  | Logro | Cómo se consigue |
  |---|---|
  | Primer viaje | Termina tu primera partida |
  | Sudamérica sin fallos | Ubica el país en Sudamérica, todos los países al primer intento |
  | Trotamundos | Termina una partida en cada una de las 8 regiones |
  | Mente enciclopédica | 10/10 en la Trivia difícil |
  | Ojo de águila | 10 microestados distintos (menos de 1.000 km²) al primer intento en el mapa |
  | A la primera | Adivina una silueta al primer intento |
  | Constancia | Juega 7 días seguidos |
  | Coleccionista | 10 sellos en el pasaporte |
  | Cartógrafo | Acierta al menos una vez 100 países distintos |
  | Maratón | Juega 50 partidas |

  Al desbloquear uno cae un sello con confeti ("¡Logro desbloqueado!"), también
  anunciado al lector de pantalla; si salen varios, aparecen en cola. La primera
  vez con esta versión, los que ya se cumplían se desbloquean sin aviso.
- **Ligereza:** la portada no carga los datos de países. Los logros, el aviso y los
  textos de los récords (`src/lib/recordLabels.ts`) son ligeros; las estadísticas
  se cargan solo con los juegos y con "Mi progreso".

## Escribe los países

- **Ruta:** `/escribe?region=europa&min=10`. No hay azar: la misma región y el mismo
  tiempo son siempre el mismo reto.
- **Cómo se reconoce lo escrito** (`src/lib/typing.ts`, lógica pura con pruebas):
  - ignora tildes, mayúsculas, espacios y signos ("ee. uu.", "EEUU", "costa  rica")
    y acepta los alias de `scripts/excepciones.ts` (Holanda, Birmania…);
  - un país se acepta en cuanto lo escrito es su nombre, sin Enter;
  - si ese nombre es el comienzo de otro aún pendiente (Guinea / Guinea Ecuatorial,
    Níger / Nigeria, Sudán / Sudán del Sur, Dominica / Dominicana, o Trinidad /
    Trinidad y Tobago), espera 0,7 s sin teclear, o un Enter, antes de aceptarlo;
  - lo que se escribe justo después de un acierto se une a él: "Sudán" + " del
    Sur" encuentra Sudán del Sur, y el resto de un nombre largo no queda en el campo;
  - avisa si el país ya está o si no es de la región. Los territorios que no son
    países jugables (Groenlandia, Puerto Rico…) no cuentan.
- **En el celular:** el campo lee cada evento `input` en lugar de usar `v-model`,
  porque en Android el teclado "compone" cada palabra y `v-model` no avisaría
  hasta terminarla.
- **Al terminar** (tiempo, todos encontrados o "Me rindo"): los que faltaron se
  pintan en rojo con rayas y aparecen en una lista. Tocar uno de la lista hace zoom
  a él (útil para los microestados) y tocar el mapa dice el nombre del país.
- **Récord** por región y tiempo; si empatan, gana el menor tiempo usado. En los
  resultados, "Ubícalos en el mapa" abre "Ubica el país" con los que faltaron.

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

**Modo oscuro ("atlas nocturno")**: papel azul noche y tinta crema. El botón de la
cabecera alterna entre sistema, claro y oscuro; un script en `index.html` aplica el
tema antes de pintar. Los colores tienen significado (`paper` = superficie, `ink` =
texto y bordes, `*-ink` = texto de color, `*-light` = fondos suaves, `carbon` y
`cream` = fijos), así que el tema oscuro solo los reasigna. Los carteles son
"islas impresas" (`.theme-light`) que se ven igual en los dos temas. Una prueba
(`contrast.spec.ts`) exige 4,5:1 en los pares de texto de ambos temas.

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
src/views/          portada, Ubica el país, Trivia, Silueta, Escribe los países,
                    Reto diario, Mi progreso, resultados
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
- `/mapa?variante=contrarreloj&region=europa&seed=k3x9tq`,
  `/trivia?variante=supervivencia&seed=k3x9tq`
- `&paises=co,ec` limita la partida a esos países ("Repasar fallos").
- `/escribe?region=europa&min=10` (sin semilla: no hay azar).

La misma URL produce siempre la misma partida (en Supervivencia, mientras aciertes
y falles en el mismo orden, porque la dificultad depende de tus aciertos). Es la base
para compartir retos.

## Créditos

Formas: Natural Earth vía world-atlas. Datos: world-countries (ODbL). Banderas:
flag-icons (MIT).
