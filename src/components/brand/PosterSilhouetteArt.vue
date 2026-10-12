<template>
  <!-- Silueta inventada recortada en papel, con lupa y una etiqueta de distancia (decorativo) -->
  <svg viewBox="0 0 240 150" aria-hidden="true" class="h-full w-full overflow-visible">
    <g transform="rotate(4 96 78)">
      <rect
        x="30"
        y="12"
        width="132"
        height="128"
        rx="10"
        fill="var(--color-ink)"
        transform="translate(5 5)"
      />
      <rect
        x="30"
        y="12"
        width="132"
        height="128"
        rx="10"
        fill="var(--color-paper-light)"
        stroke="var(--color-ink)"
        stroke-width="2.5"
      />
      <!-- País inventado: no corresponde a ninguno real -->
      <path
        d="M74 34c10-8 24-6 30 2 8-3 18 2 18 10 10 2 14 12 8 20 6 8 2 20-8 22-2 10-12 16-22 12-6 8-18 8-22 0-10 0-16-10-12-18-8-6-6-18 4-22-2-12 2-22 4-26z"
        fill="var(--color-pink)"
        transform="translate(3 3)"
      />
      <path
        d="M74 34c10-8 24-6 30 2 8-3 18 2 18 10 10 2 14 12 8 20 6 8 2 20-8 22-2 10-12 16-22 12-6 8-18 8-22 0-10 0-16-10-12-18-8-6-6-18 4-22-2-12 2-22 4-26z"
        fill="var(--color-ink)"
      />
      <path
        d="M66 26c14-12 36-10 44-2 10-2 22 4 22 14 12 4 16 16 10 24 6 10 2 24-10 28-4 12-16 18-28 14-8 10-24 10-30 0-12-2-20-14-14-24-10-8-8-24 6-30-2-10 0-18 0-24z"
        fill="none"
        stroke="var(--color-ink)"
        stroke-width="1.4"
        stroke-dasharray="4 4"
        opacity="0.5"
      />
      <path
        d="M44 126h40M44 122v8M84 122v8M64 124v4"
        stroke="var(--color-ink)"
        stroke-width="2"
        stroke-linecap="round"
      />
    </g>
    <!-- Lupa -->
    <g transform="translate(150 70) rotate(-20)">
      <path d="M22 22l20 20" stroke="var(--color-ink)" stroke-width="8" stroke-linecap="round" />
      <path d="M22 22l20 20" stroke="var(--color-tomato)" stroke-width="4" stroke-linecap="round" />
      <circle r="24" fill="rgb(191 227 234 / 0.55)" stroke="var(--color-ink)" stroke-width="3.5" />
      <path
        d="M-12-8a14 14 0 0 1 10-8"
        fill="none"
        stroke="white"
        stroke-width="3"
        stroke-linecap="round"
      />
    </g>
    <!-- Etiqueta de distancia -->
    <g transform="rotate(-6 196 30)" class="font-mono" font-weight="600">
      <rect
        x="160"
        y="16"
        width="74"
        height="28"
        rx="8"
        fill="var(--color-sun)"
        stroke="var(--color-ink)"
        stroke-width="2"
      />
      <text x="170" y="35" font-size="11.5" fill="var(--color-ink)">812 km</text>
      <circle
        cx="221"
        cy="30"
        r="8"
        fill="var(--color-paper-light)"
        stroke="var(--color-ink)"
        stroke-width="1.6"
      />
      <path
        d="M221 24l4 6h-2.5v6h-3v-6H217z"
        fill="var(--color-cobalt)"
        transform="rotate(45 221 30)"
      />
    </g>
  </svg>
</template>
