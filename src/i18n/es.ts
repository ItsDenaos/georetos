/**
 * Todos los textos de la interfaz. Para traducir GeoRetos basta con crear otro
 * archivo con la misma forma (el tipo Messages lo garantiza).
 * Los nombres de países y capitales vienen de src/data/countries.json.
 */
import type { CompassPoint } from '@/lib/geo'
import type { QuestionType } from '@/lib/questions'
import type { ContinentId, Difficulty, RegionId } from '@/lib/types'
import type { AchievementId } from '@/lib/achievements'
import type { Variant } from '@/lib/variants'

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

  theme: {
    options: { system: 'sistema', light: 'claro', dark: 'oscuro' } satisfies Record<
      'system' | 'light' | 'dark',
      string
    >,
    button: (current: string) => `Tema: ${current}. Pulsa para cambiarlo`,
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
    typingTitle: 'Escribe los países',
    typingText:
      'Todos los que recuerdes antes de que acabe el tiempo. Cada acierto se pinta en el mapa.',
    typingMeta: '5 a 15 min · teclado',
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
    locateIntro: 'Elige cómo jugar, dónde y cuántos países quieres encontrar.',
    triviaIntro: 'Elige cómo jugar, la dificultad y, si quieres, una región.',
    silhouetteIntro: 'Elige región y cuántas siluetas quieres adivinar.',
    silhouetteCount: 'Cantidad de siluetas',
    silhouetteN: (n: number) => `${n} siluetas`,
    region: 'Región',
    count: 'Cantidad de países',
    countAll: (n: number) => `Todos (${n})`,
    difficulty: 'Dificultad',
    regionOptional: 'Región (opcional)',
    timer: 'Reloj por pregunta',
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
    countryNumber: (n: number) => `País ${n}`,
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

  variants: {
    legend: 'Variante',
    labels: {
      clasica: 'Clásica',
      contrarreloj: 'Contrarreloj',
      supervivencia: 'Supervivencia',
    } satisfies Record<Variant, string>,
    hints: {
      locate: {
        clasica: '10, 20 o todos los países',
        contrarreloj: '60 s · cada fallo −3 s',
        supervivencia: '3 vidas · sube cada 5 aciertos',
      },
      trivia: {
        clasica: '10 preguntas',
        contrarreloj: '60 s · cada fallo −3 s',
        supervivencia: '3 vidas · sube cada 5 aciertos',
      },
    } satisfies Record<'locate' | 'trivia', Record<Variant, string>>,
    survivalNote: 'Se juega con todo el mundo y la dificultad sube sola: fácil, media y difícil.',
    correctCount: (n: number) => `${n} ${plural(n, 'acierto', 'aciertos')}`,
    clockLabel: (s: number) => `Quedan ${s} segundos`,
    penalty: '−3 s',
    livesLabel: (n: number) => `${n} ${plural(n, 'vida', 'vidas')}`,
    level: (difficulty: string) => `Nivel · ${difficulty}`,
    levelUp: (difficulty: string) => `¡Subes de nivel! Ahora: ${difficulty}`,
    lifeLost: (n: number) => `Pierdes una vida. Te ${plural(n, 'queda', 'quedan')} ${n}.`,
    ends: {
      time: '¡Se acabó el tiempo!',
      lives: '¡Sin vidas!',
      exhausted: '¡Completaste la región!',
    } satisfies Record<'time' | 'lives' | 'exhausted', string>,
    reachedLevel: 'Nivel alcanzado',
    /** Contrarreloj de mapa: países de todos los tamaños. */
    mixedLevel: 'Mixto',
    scoreLabel: 'Aciertos',
    accuracy: 'Precisión',
  },

  typing: {
    title: 'Escribe los países',
    intro: 'Elige una región y el tiempo, y escribe todos los países que recuerdes.',
    minutesLegend: 'Tiempo',
    minutes: (n: number) => `${n} min`,
    minutesHints: {
      5: 'Un sprint',
      10: 'Con calma',
      15: 'Para el mundo entero',
    } satisfies Record<5 | 10 | 15, string>,
    inputLabel: 'Escribe un país',
    placeholder: 'Escribe un país…',
    inputHint: 'Sin Enter: cada acierto se marca solo. Da igual las tildes y las mayúsculas.',
    counter: (n: number, total: number) => `${n}/${total}`,
    counterLabel: (n: number, total: number) => `${n} de ${total} países`,
    clockLabel: (time: string) => `Quedan ${time}`,
    giveUp: 'Me rindo',
    found: (name: string) => `¡${name}!`,
    announceFound: (name: string, n: number, total: number) => `${name}: ${n} de ${total}`,
    repeat: (name: string) => `${name} ya está`,
    outside: (name: string, region: string) => `${name} no está en ${region}`,
    foundHeading: 'Encontrados',
    foundEmpty: 'Aún ninguno. ¡Empieza a escribir!',
    missingHeading: (n: number) => `Te ${plural(n, 'faltó', 'faltaron')} ${n}`,
    ends: {
      time: '¡Tiempo!',
      complete: '¡Los tienes todos!',
      gaveUp: 'Te rendiste',
    } satisfies Record<'time' | 'complete' | 'gaveUp', string>,
    tapHint: 'Toca un país del mapa para ver su nombre.',
    legendFound: 'Encontrado',
    legendMissing: 'Faltó',
    seeResults: 'Ver resultados',
    reviewOnMap: 'Ubícalos en el mapa',
  },

  pwa: {
    updateTitle: 'Hay una versión nueva',
    updateText: 'Actualiza cuando termines la partida.',
    update: 'Actualizar',
    later: 'Más tarde',
    offlineReady: 'Listo: GeoRetos ya funciona sin internet',
    installTitle: 'Instalar GeoRetos',
    installText:
      'Tenla en la pantalla de inicio como una app más. Funciona sin internet una vez cargada.',
    install: 'Instalar app',
    installed: 'Ya está instalada en este dispositivo.',
    installIos: 'En Safari, toca Compartir y después «Añadir a pantalla de inicio».',
    installOther: 'Desde el menú del navegador: «Instalar app» o «Añadir a pantalla de inicio».',
  },

  challenge: {
    kicker: 'Desafío',
    from: (name: string) => (name ? `${name} te desafía` : 'Te desafían'),
    question: '¿Lo superas?',
    sameQuestions: 'Jugarás la misma partida: las mismas preguntas, en el mismo orden.',
    sameQuestionsSurvival:
      'Las mismas preguntas mientras aciertes y falles igual: en Supervivencia la dificultad sube con tus aciertos.',
    otherVersion:
      'Este desafío se creó con otra versión de GeoRetos: las preguntas pueden no coincidir.',
    invalid:
      'Este enlace de desafío está dañado. Puedes jugar la partida igual, pero sin comparar resultados.',
    accept: 'Aceptar el desafío',
    playAnyway: 'Jugar la partida',
    decline: 'Ahora no',
    correctOf: (correct: number, total: number) => `${correct} de ${total}`,
    correctLabel: 'Aciertos',
    timeLabel: 'Tiempo',
    shareTitle: 'Desafía a un amigo',
    shareIntro:
      'Comparte esta misma partida: quien abra el enlace jugará las mismas preguntas y verá su resultado junto al tuyo.',
    shareIntroTyping:
      'Comparte este reto: la misma región y el mismo tiempo, y al final verá su resultado junto al tuyo.',
    nameLabel: 'Tu nombre (opcional)',
    namePlaceholder: 'Para que sepa quién lo desafía',
    share: 'Desafiar a un amigo',
    shareBack: 'Devolver el desafío',
    shareText: (name: string, game: string, score: string) =>
      name
        ? `${name} te desafía en GeoRetos · ${game}: ${score}. ¿Lo superas?`
        : `¡Te desafío en GeoRetos! ${game}: ${score}. ¿Lo superas?`,
    duelTitle: 'Resultado del desafío',
    you: 'Tú',
    rival: 'Tu rival',
    outcomes: {
      win: '¡Ganaste!',
      lose: '¡Te ganó!',
      tie: '¡Empate!',
    } satisfies Record<'win' | 'lose' | 'tie', string>,
    tieBreak: 'Con los mismos puntos gana el menor tiempo.',
    tieBreakEndless: 'Con los mismos aciertos gana quien falló menos y, después, el menor tiempo.',
  },

  achievements: {
    title: 'Logros',
    unlocked: '¡Logro desbloqueado!',
    count: (n: number, total: number) => `${n} de ${total}`,
    progress: (value: number, goal: number) => `${value}/${goal}`,
    lockedLabel: (name: string, hint: string, progress: string) =>
      `${name}, bloqueado. ${hint}${progress ? ` Llevas ${progress}.` : ''}`,
    unlockedLabel: (name: string, hint: string, date: string) =>
      `${name}, desbloqueado el ${date}. ${hint}`,
    announce: (name: string) => `Logro desbloqueado: ${name}`,
    see: 'Ver mis logros',
    close: 'Cerrar aviso',
    items: {
      'primer-viaje': { name: 'Primer viaje', hint: 'Termina tu primera partida.' },
      'sudamerica-perfecta': {
        name: 'Sudamérica sin fallos',
        hint: 'En Ubica el país, encuentra todos los países de Sudamérica al primer intento.',
      },
      trotamundos: {
        name: 'Trotamundos',
        hint: 'Termina una partida en cada una de las 8 regiones (el mundo cuenta como una).',
      },
      'mente-enciclopedica': {
        name: 'Mente enciclopédica',
        hint: 'Saca 10 de 10 en la Trivia difícil.',
      },
      'ojo-de-aguila': {
        name: 'Ojo de águila',
        hint: 'Encuentra en el mapa, al primer intento, 10 microestados distintos (menos de 1.000 km²).',
      },
      'a-la-primera': { name: 'A la primera', hint: 'Adivina una silueta al primer intento.' },
      constancia: { name: 'Constancia', hint: 'Juega 7 días seguidos.' },
      coleccionista: { name: 'Coleccionista', hint: 'Consigue 10 sellos en el pasaporte.' },
      cartografo: { name: 'Cartógrafo', hint: 'Acierta al menos una vez 100 países distintos.' },
      maraton: { name: 'Maratón', hint: 'Juega 50 partidas.' },
    } satisfies Record<AchievementId, { name: string; hint: string }>,
  },

  progress: {
    title: 'Mi progreso',
    kicker: 'Bitácora de viaje',
    link: 'Mi progreso',
    since: (date: string) => `Estadísticas por país desde el ${date}`,
    games: 'Partidas',
    questions: 'Preguntas',
    accuracy: 'Precisión',
    time: 'Tiempo jugado',
    playTime: (ms: number) => {
      const minutes = Math.round(ms / 60_000)
      if (minutes < 60) return `${minutes} min`
      return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`
    },
    streakTitle: 'Racha de días',
    streakNote: 'Días seguidos con al menos una partida.',
    streakDays: (n: number) => `${n} ${plural(n, 'día', 'días')}`,
    streakBest: (n: number) => `Mejor racha: ${n} ${plural(n, 'día', 'días')}`,
    streakToday: 'Hoy ya jugaste',
    streakPending: 'Juega hoy para no perderla',
    dailyStreak: (n: number) => `Reto diario: ${n} ${plural(n, 'día', 'días')} seguidos`,
    continentsTitle: 'Precisión por continente',
    continentLine: (percent: string, n: number) =>
      `${percent} · ${n} ${plural(n, 'pregunta', 'preguntas')}`,
    noQuestions: 'Sin preguntas aún',
    mapTitle: 'Lo que sabes',
    mapHint: 'Toca un país para ver cómo te va con él.',
    mapLegend: {
      ok: '80 % o más',
      meh: 'De 50 a 80 %',
      fail: 'Menos del 50 %',
      none: 'Aún no salió',
    },
    countryLine: (name: string, right: number, seen: number, percent: string) =>
      `${name}: ${right} de ${seen} (${percent})`,
    countryNever: (name: string) => `${name}: aún no salió`,
    weakTitle: 'Países que más fallas',
    weakLine: (fails: number, seen: number) => `Fallas ${fails} de ${seen}`,
    weakEmpty: 'Aún no hay países con dos preguntas o más y algún fallo. ¡Sigue jugando!',
    weakReview: 'Repasar estos países',
    recordsTitle: 'Récords',
    noRecords: 'Aún no tienes récords.',
    settingsTitle: 'Ajustes',
    theme: 'Tema',
    themeOptions: { system: 'Sistema', light: 'Claro', dark: 'Oscuro' } satisfies Record<
      'system' | 'light' | 'dark',
      string
    >,
    reset: 'Borrar mi progreso',
    resetWarning:
      'Se borran las partidas, los récords, las estadísticas, los logros y los retos diarios de este dispositivo. No se puede deshacer.',
    resetConfirm: 'Sí, borrar todo',
    resetCancel: 'Cancelar',
    empty: 'Juega una partida para empezar a llenar tu bitácora.',
  },

  daily: {
    title: 'Reto diario',
    number: (n: number) => `Nº ${n}`,
    todayHeading: 'Hoy',
    intro:
      'Diez preguntas iguales para todos hoy: cinco de mapa y cinco de trivia, de fácil a difícil.',
    rules: [
      '10 preguntas: mapa y trivia, alternadas',
      'Suben de fácil a difícil',
      'Mapa: 3, 2 o 1 punto según el intento · Trivia: 3 si aciertas',
      'Una sola vez al día: tu resultado queda guardado',
    ],
    start: 'Empezar el reto',
    kinds: { map: 'Mapa', trivia: 'Trivia' } satisfies Record<'map' | 'trivia', string>,
    streakLabel: 'Racha',
    streakDays: (n: number) => `${n} ${plural(n, 'día', 'días')}`,
    bestStreak: (n: number) => `Mejor: ${n} ${plural(n, 'día', 'días')}`,
    streakStart: 'Juega hoy para empezar tu racha',
    resultKicker: 'Reto de hoy completado',
    perfect: '¡Perfecto!',
    marks: { ok: 'acierto', meh: 'acierto tardío', fail: 'fallo' } satisfies Record<
      'ok' | 'meh' | 'fail',
      string
    >,
    markLabel: (n: number, kind: string, mark: string) => `Pregunta ${n} (${kind}): ${mark}`,
    share: 'Compartir',
    shared: '¡Gracias por compartir!',
    copied: '¡Copiado! Pégalo donde quieras.',
    shareFailed: 'No se pudo copiar: selecciona el texto de abajo y cópialo a mano.',
    sharePreview: 'Así se verá',
    nextIn: (time: string) => `Próximo reto en ${time}`,
    alsoToday: 'También hoy',
    homeKicker: (n: number) => `Reto diario · Nº ${n}`,
    homePending: '10 preguntas · ¿te atreves?',
    homeProgress: (n: number) => `Vas en la ${n} de 10`,
    homeDone: (score: number, max: number) => `${score}/${max} puntos`,
    homePlay: 'Jugar',
    homeContinue: 'Seguir',
    homeSee: 'Ver resultado',
    shareText: (
      number: number,
      score: number,
      max: number,
      streak: number,
      row: string,
      url: string,
    ) =>
      [
        `GeoRetos · Reto diario Nº ${number}`,
        `${score}/${max}${streak > 1 ? ` · racha de ${streak} 🔥` : ''}`,
        row,
        url,
      ].join('\n'),
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
    questionNumber: (n: number) => `Pregunta ${n}`,
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
    yourRoute: 'Tu ruta',
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
    typing: 'Escribe los países',
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
    /** Cuenta atrás en minutos y segundos: "9:05". */
    countdown: (ms: number) => {
      const total = Math.max(0, Math.ceil(ms / 1000))
      return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
    },
    number: (value: number) => value.toLocaleString('es'),
    date: (iso: string) =>
      new Date(iso).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' }),
  },
}

export type Messages = typeof es
