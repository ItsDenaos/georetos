<script setup lang="ts">
/** Banderín de banderas inventadas (ninguna es de un país real) y una carta de pregunta. Decorativo. */
const flags = [
  { x: 30, y: 31, r: -8 },
  { x: 75, y: 39, r: -3 },
  { x: 120, y: 41, r: 2 },
  { x: 165, y: 37, r: 6 },
  { x: 210, y: 28, r: 10 },
]
</script>

<template>
  <svg viewBox="0 0 240 150" aria-hidden="true" class="h-full w-full overflow-visible">
    <!-- Carta de pregunta -->
    <g transform="rotate(9 186 104)">
      <rect
        x="152"
        y="66"
        width="70"
        height="80"
        rx="10"
        fill="var(--color-ink)"
        transform="translate(5 5)"
      />
      <rect
        x="152"
        y="66"
        width="70"
        height="80"
        rx="10"
        fill="var(--color-pink)"
        stroke="var(--color-ink)"
        stroke-width="2.5"
      />
      <text
        x="187"
        y="128"
        text-anchor="middle"
        class="font-display"
        font-size="58"
        font-weight="800"
        fill="var(--color-ink)"
      >
        ?
      </text>
    </g>
    <!-- Respuestas -->
    <g class="font-mono" font-size="11" font-weight="600">
      <g transform="rotate(-4 60 110)">
        <rect
          x="22"
          y="92"
          width="96"
          height="24"
          rx="7"
          fill="var(--color-paper-light)"
          stroke="var(--color-ink)"
          stroke-width="2"
        />
        <circle
          cx="35"
          cy="104"
          r="7"
          fill="var(--color-sun)"
          stroke="var(--color-ink)"
          stroke-width="1.6"
        />
        <text x="35" y="108" text-anchor="middle" fill="var(--color-ink)">1</text>
        <rect x="48" y="101" width="56" height="6" rx="3" fill="var(--color-ink)" opacity="0.18" />
      </g>
      <g transform="rotate(3 70 136)">
        <rect
          x="34"
          y="122"
          width="96"
          height="24"
          rx="7"
          fill="var(--color-jade-light)"
          stroke="var(--color-ink)"
          stroke-width="2"
        />
        <circle
          cx="47"
          cy="134"
          r="7"
          fill="var(--color-jade)"
          stroke="var(--color-ink)"
          stroke-width="1.6"
        />
        <path
          d="M43.5 134.2l2.4 2.4 4.4-4.8"
          fill="none"
          stroke="white"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <rect x="60" y="131" width="50" height="6" rx="3" fill="var(--color-ink)" opacity="0.18" />
      </g>
    </g>
    <!-- Banderín -->
    <path d="M-6 20Q120 66 246 16" fill="none" stroke="var(--color-ink)" stroke-width="2" />
    <g stroke="var(--color-ink)" stroke-width="2" stroke-linejoin="round">
      <g v-for="(f, i) in flags" :key="i" :transform="`translate(${f.x} ${f.y}) rotate(${f.r})`">
        <template v-if="i === 0">
          <rect x="-17" y="0" width="34" height="24" rx="2" fill="var(--color-sun)" />
          <path d="M-17 24L17 0V24Z" fill="var(--color-cobalt)" stroke="none" />
          <circle cx="-8" cy="7" r="3" fill="var(--color-paper-light)" stroke-width="1.2" />
          <rect x="-17" y="0" width="34" height="24" rx="2" fill="none" />
        </template>
        <template v-else-if="i === 1">
          <rect x="-17" y="0" width="34" height="24" rx="2" fill="var(--color-sun)" />
          <rect x="-17" y="8" width="34" height="8" fill="var(--color-jade)" stroke="none" />
          <rect x="-17" y="0" width="34" height="24" rx="2" fill="none" />
        </template>
        <template v-else-if="i === 2">
          <rect x="-17" y="0" width="34" height="24" rx="2" fill="var(--color-paper-light)" />
          <path
            d="M-17 0h34M-17 6h34M-17 12h34M-17 18h34"
            stroke="var(--color-pink)"
            stroke-width="3"
          />
          <path d="M-17 0H0L-6 12 0 24H-17Z" fill="var(--color-ink)" stroke="none" />
          <path
            d="M-11.5 8.5l1.1 2.3 2.5.3-1.9 1.7.5 2.4-2.2-1.3-2.2 1.3.5-2.4-1.9-1.7 2.5-.3z"
            fill="var(--color-sun)"
            stroke="none"
          />
          <rect x="-17" y="0" width="34" height="24" rx="2" fill="none" />
        </template>
        <template v-else-if="i === 3">
          <rect x="-17" y="0" width="34" height="24" rx="2" fill="var(--color-pink)" />
          <path d="M-17 0L4 12-17 24Z" fill="var(--color-paper-light)" stroke="none" />
          <circle cx="-9" cy="12" r="3.2" fill="var(--color-jade)" stroke-width="1.2" />
          <rect x="-17" y="0" width="34" height="24" rx="2" fill="none" />
        </template>
        <template v-else>
          <rect x="-17" y="0" width="34" height="24" rx="2" fill="var(--color-tomato)" />
          <path d="M-17 24L17 0" stroke="var(--color-paper-light)" stroke-width="5" />
          <path
            d="M-8 4l1.4 3 3.2.3-2.4 2.1.7 3.1-2.9-1.7-2.9 1.7.7-3.1-2.4-2.1 3.2-.3z"
            fill="var(--color-sun)"
            stroke-width="0.8"
          />
          <rect x="-17" y="0" width="34" height="24" rx="2" fill="none" />
        </template>
      </g>
    </g>
  </svg>
</template>
