/**
 * Todos los textos de la interfaz. Para traducir GeoRetos basta con crear otro
 * archivo con la misma forma (el tipo Messages lo garantiza).
 * Los nombres de países y capitales vienen de src/data/countries.json.
 */
import type { CompassPoint } from '@/lib/geo'
import type { QuestionType } from '@/lib/questions'
import type { ContinentId, Difficulty, RegionId } from '@/lib/types'

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)
const pad = (n: number) => String(n).padStart(2, '0')
const km = (n: number) => `${n.toLocaleString('es')} km`

export const es = {
  app: {
    name: 'GeoRetos',
    tagline: 'Atlas de retos',
    home: 'Inicio',
    skipToContent: 'Saltar al contenido',
  },

  regions: {
    mundo: 'Mundo',
    africa: 'África',
    'norte-centroamerica': 'Norte y Centroamérica',
    caribe: 'Caribe',
    sudamerica: 'Sudamérica',
    asia: 'Asia',
    europa: 'Europa',
    oceania: 'Oceanía',
  } satisfies Record<RegionId, string>,

  continents: {
    africa: 'África',
    america: 'América',
    asia: 'Asia',
    europa: 'Europa',
    oceania: 'Oceanía',
    antartida: 'Antártida',
  } satisfies Record<ContinentId, string>,

  difficulties: {
    facil: 'Fácil',
    media: 'Media',
    dificil: 'Difícil',
  } satisfies Record<Difficulty, string>,

  difficultyHints: {
    facil: 'Opciones de otros continentes',
    media: 'Opciones del mismo continente',
    dificil: 'Vecinos y países de la zona',
  } satisfies Record<Difficulty, string>,

  home: {
    kicker: (n: number) => `Atlas de retos · ${n} países`,
    titleStart: 'El mundo es tu',
    titleEmphasis: 'tablero',
    subtitle:
      'Ubica países en el mapa y pon a prueba lo que sabes de capitales, banderas y fronteras. Partidas de un par de minutos.',
    modeLabel: (n: number) => `Modo ${pad(n)}`,
    locateTitle: 'Ubica el país',
    locateText: 'Te decimos un país; tú lo encuentras en el mapa. Tienes tres intentos.',
    locateMeta: '3 intentos · mapa',
    triviaTitle: 'Trivia',
    triviaText: 'Capitales, banderas, fronteras y más. Diez preguntas, cuatro opciones.',
    triviaMeta: '10 preguntas · 7 tipos',
    silhouetteTitle: 'Silueta',
    silhouetteText:
      'Solo la forma, sin mapa. Seis intentos, con la distancia y el rumbo como pistas.',
    silhouetteMeta: '6 intentos · rumbo',
    dailyKicker: (n: number) => `Silueta del día · Nº ${n}`,
    dailyPending: '¿Reconoces el país de hoy?',
    dailyDone: (attempts: number, solved: boolean) =>
      solved ? `Resuelto en ${attempts}/6` : 'Hoy no salió · X/6',
    dailyPlay: 'Jugar el reto',
    dailySee: 'Ver resultado',
    play: 'Jugar',
    passportKicker: 'Pasaporte GeoRetos',
    passportTitle: 'Tu pasaporte',
    trips: (n: number) => `${n} ${plural(n, 'viaje', 'viajes')}`,
    stamps: (n: number) => `${n} ${plural(n, 'sello', 'sellos')}`,
    noStamps: 'Aún no tienes sellos. Cada récord que consigas quedará estampado aquí.',
    stampLabel: (mode: string, region: string, level: string, score: string, date: string) =>
      `Récord de ${mode} en ${region} (${level}): ${score}, ${date}`,
  },

  setup: {
    modeKicker: (n: number, title: string) => `Modo ${pad(n)} · ${title}`,
    planTitle: ['Planifica', 'tu ruta'],
    locateIntro: 'Elige dónde jugar y cuántos países quieres encontrar.',
    triviaIntro: 'Elige la dificultad y, si quieres, una región.',
    silhouetteIntro: 'Elige región y cuántas siluetas quieres adivinar.',
    silhouetteCount: 'Cantidad de siluetas',
    silhouetteN: (n: number) => `${n} siluetas`,
    region: 'Región',
    count: 'Cantidad de países',
    countAll: (n: number) => `Todos (${n})`,
    difficulty: 'Dificultad',
    regionOptional: 'Región (opcional)',
    timer: 'Contrarreloj',
    timerHint: '15 segundos por pregunta',
    countryCount: (n: number) => `${n} países`,
    start: '¡A jugar!',
    back: 'Volver',
  },

  map: {
    label: 'Mapa del mundo',
    zoomIn: 'Acercar',
    zoomOut: 'Alejar',
    reset: 'Centrar mapa',
    loading: 'Desplegando el mapa…',
    error: 'No se pudo cargar el mapa. Revisa tu conexión y recarga la página.',
    plate: 'Lámina',
  },

  locate: {
    title: 'Ubica el país',
    find: 'Encuentra',
    route: (seed: string) => `Ruta ${seed}`,
    progress: (current: number, total: number) => `${current}/${total}`,
    progressLabel: (current: number, total: number) => `País ${current} de ${total}`,
    points: (n: number) => `${n} ${plural(n, 'punto', 'puntos')}`,
    pointsShort: (n: number) => `${n} pts`,
    attemptsLeft: (n: number) => `${n} ${plural(n, 'intento', 'intentos')}`,
    showFlag: 'Ver bandera',
    hideFlag: 'Ocultar bandera',
    flagAlt: 'Bandera del país que buscas',
    skip: 'Saltar',
    next: 'Siguiente',
    thatIs: (name: string) => `Eso es ${name}`,
    correct: (points: number) => `¡Correcto! +${points}`,
    revealed: (name: string) => `Era aquí: ${name}`,
    announceTarget: (name: string) => `Encuentra ${name}`,
    announceWrong: (name: string, left: number) =>
      `Incorrecto: eso es ${name}. Te ${plural(left, 'queda', 'quedan')} ${left} ${plural(left, 'intento', 'intentos')}.`,
    announceFailed: (name: string) => `Sin intentos. ${name} está resaltado en el mapa.`,
    legendFirst: 'Al primer intento',
    legendLater: 'Al 2.º o 3.º',
    legendFailed: 'Fallado',
  },

  silhouette: {
    title: 'Silueta',
    specimen: (n: number, total: number) => `Espécimen ${pad(n)}/${pad(total)}`,
    prompt: '¿Qué país es?',
    silhouetteLabel: 'Silueta de un país misterioso',
    scale: (n: number) => km(n),
    scaleLabel: (n: number) => `Barra de escala de ${km(n)}`,
    inputLabel: 'Escribe un país',
    placeholder: 'Por ejemplo, Perú',
    submit: 'Probar',
    unknown: 'No conozco ese país: elige uno de la lista.',
    repeated: (name: string) => `Ya probaste ${name}.`,
    suggestions: (n: number) =>
      n === 0
        ? 'Sin coincidencias'
        : `${n} ${plural(n, 'sugerencia', 'sugerencias')}; usa las flechas para elegir.`,
    aliasOf: (alias: string) => `«${alias}»`,
    attempt: (n: number) => `Intento ${n}`,
    attemptsLeft: (n: number) => `${n} ${plural(n, 'intento', 'intentos')}`,
    solvedIn: (n: number) => `Resuelto en ${n} de 6`,
    distance: km,
    directions: {
      n: 'al norte',
      ne: 'al noreste',
      e: 'al este',
      se: 'al sureste',
      s: 'al sur',
      so: 'al suroeste',
      o: 'al oeste',
      no: 'al noroeste',
    } satisfies Record<CompassPoint, string>,
    guessLabel: (name: string, distance: number, direction: string) =>
      `${name}: el país está a ${km(distance)}, ${direction}`,
    guessCorrect: (name: string) => `${name}: ¡correcto!`,
    announceWrong: (name: string, distance: number, direction: string, left: number) =>
      `${name} no es. El país está a ${km(distance)}, ${direction}. Te ${plural(left, 'queda', 'quedan')} ${left} ${plural(left, 'intento', 'intentos')}.`,
    announceCorrect: (name: string, attempt: number) =>
      `¡Correcto! Es ${name}, al intento ${attempt}.`,
    announceFailed: (name: string) => `Sin intentos. Era ${name}.`,
    solved: '¡Lo encontraste!',
    failed: 'Sin intentos',
    answer: (name: string) => `Era ${name}`,
    points: (n: number) => `+${n} ${plural(n, 'punto', 'puntos')}`,
    next: 'Siguiente silueta',
    finish: 'Ver resultados',
    dailyTitle: 'Silueta del día',
    dailyNumber: (n: number) => `Nº ${n}`,
    dailyIntro: 'Una silueta para todos, cada día. ¿La reconoces en seis intentos?',
    dailySolved: '¡Reto de hoy completado!',
    dailyFailed: 'Hoy no pudo ser',
    nextIn: (time: string) => `Próxima silueta en ${time}`,
    practice: 'Practicar con más siluetas',
  },

  trivia: {
    title: 'Trivia',
    questionOf: (current: number, total: number) => `Pregunta ${current} de ${total}`,
    counter: (current: number, total: number) => `${pad(current)}/${pad(total)}`,
    categories: {
      'capital-de': 'Capitales',
      bandera: 'Banderas',
      'pais-de-capital': 'Capitales',
      continente: 'Continentes',
      'mas-grande': 'Tamaños',
      'limita-con': 'Fronteras',
      'sin-mar': 'Costas',
    } satisfies Record<QuestionType, string>,
    capitalOf: (country: string) => `¿Cuál es la capital de ${country}?`,
    flagOf: '¿De qué país es esta bandera?',
    countryOfCapital: (capital: string) => `¿De qué país es capital ${capital}?`,
    continentOf: (country: string) => `¿En qué continente está ${country}?`,
    largest: '¿Cuál de estos países es el más grande?',
    bordersWith: (country: string) => `¿Cuál de estos países limita con ${country}?`,
    landlocked: '¿Cuál de estos países no tiene salida al mar?',
    flagAlt: 'Bandera misteriosa',
    correct: '¡Correcto!',
    wrong: 'Incorrecto',
    timeUp: 'Se acabó el tiempo',
    stampCorrect: '¡Bien!',
    stampWrong: '¡Ups!',
    stampTime: '¡Tiempo!',
    answerWas: (answer: string) => `La respuesta correcta es: ${answer}`,
    largestDetail: (name: string, area: string) => `${name} mide ${area} km².`,
    next: 'Siguiente',
    finish: 'Ver resultados',
    keyboardHint: 'Atajo: teclas 1 a 4',
    secondsLeft: (s: number) => `${s}`,
    timerLabel: (s: number) => `Quedan ${s} segundos`,
    optionLabel: (n: number, text: string) => `Opción ${n}: ${text}`,
    notEnough: 'No hay suficientes países para esta combinación. Prueba otra región o dificultad.',
  },

  results: {
    pass: 'Pase de abordar',
    title: '¡Reto completado!',
    headline: (accuracy: number) =>
      accuracy >= 1
        ? '¡Ruta perfecta!'
        : accuracy >= 0.8
          ? '¡Gran viaje!'
          : accuracy >= 0.5
            ? '¡Buen viaje!'
            : '¡Sigue explorando!',
    barcodeLabel: (seed: string) => `Código de ruta ${seed}`,
    mode: 'Modo',
    destination: 'Destino',
    level: 'Nivel',
    route: 'Ruta',
    date: 'Fecha',
    score: 'Puntaje',
    accuracy: 'Aciertos',
    time: 'Tiempo',
    newRecord: '¡Nuevo récord!',
    previousRecord: (score: number) => `Tu récord anterior: ${score}`,
    misses: 'Por visitar',
    missesHint: 'Repásalos y vuelve a intentarlo.',
    noMisses: '¡Sin fallos! Ruta perfecta.',
    reviewMisses: 'Repasar fallos',
    playAgain: 'Jugar otra vez',
    home: 'Ir al inicio',
    reviewNote: 'Las partidas de repaso no cuentan para los récords.',
    capitalHint: (capital: string) => `Capital: ${capital}`,
  },

  records: {
    locate: 'Ubica el país',
    trivia: 'Trivia',
    silhouette: 'Silueta',
    countAll: 'todos',
    countN: (n: number) => `${n} países`,
  },

  format: {
    duration: (ms: number) => {
      const total = Math.round(ms / 1000)
      const m = Math.floor(total / 60)
      const s = total % 60
      return m > 0 ? `${m} min ${s.toString().padStart(2, '0')} s` : `${s} s`
    },
    percent: (value: number) => `${Math.round(value * 100)} %`,
    clock: (ms: number) => {
      const total = Math.max(0, Math.floor(ms / 1000))
      const h = Math.floor(total / 3600)
      const m = Math.floor((total % 3600) / 60)
      return [h, m, total % 60].map((v) => String(v).padStart(2, '0')).join(':')
    },
    number: (value: number) => value.toLocaleString('es'),
    date: (iso: string) =>
      new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' }),
  },
}

export type Messages = typeof es
