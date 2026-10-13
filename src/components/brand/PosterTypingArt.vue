<script setup lang="ts">
/** Hoja con países ya escritos y teclas que escriben el siguiente. Decorativo. */
const lines = ['Chile', 'Kenia', 'Nepal']
const keys = [
  { letter: 'P', x: 118, y: 104, r: -6 },
  { letter: 'E', x: 148, y: 110, r: 3 },
  { letter: 'R', x: 178, y: 103, r: -2 },
  { letter: 'Ú', x: 208, y: 109, r: 7 },
]
</script>

<template>
  <svg viewBox="0 0 240 150" aria-hidden="true" class="h-full w-full overflow-visible">
    <!-- Hoja -->
    <g transform="rotate(-4 86 60)">
      <rect
        x="20"
        y="10"
        width="134"
        height="100"
        rx="10"
        fill="var(--color-ink)"
        transform="translate(5 5)"
      />
      <rect
        x="20"
        y="10"
        width="134"
        height="100"
        rx="10"
        fill="var(--color-paper-light)"
        stroke="var(--color-ink)"
        stroke-width="2.5"
      />
      <g class="font-mono" font-size="13" font-weight="600" fill="var(--color-ink)">
        <g v-for="(line, i) in lines" :key="line" :transform="`translate(0 ${i * 21})`">
          <circle
            cx="38"
            cy="31"
            r="7"
            fill="var(--color-jade)"
            stroke="var(--color-ink)"
            stroke-width="1.6"
          />
          <path
            d="M34.6 31.2l2.3 2.3 4.2-4.6"
            fill="none"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <text x="52" y="36">{{ line }}</text>
        </g>
        <!-- Lo que se está escribiendo, con el cursor -->
        <text x="31" y="99">Per</text>
        <rect x="58" y="88" width="2.5" height="14" fill="var(--color-pink)" class="cursor" />
      </g>
      <path d="M28 82h118" stroke="var(--color-ink)" stroke-width="1.4" stroke-dasharray="3 4" />
    </g>

    <!-- Teclas -->
    <g
      v-for="key in keys"
      :key="key.letter"
      :transform="`translate(${key.x} ${key.y}) rotate(${key.r})`"
    >
      <rect x="-14" y="-14" width="30" height="30" rx="6" fill="var(--color-ink)" />
      <rect
        x="-16"
        y="-16"
        width="30"
        height="30"
        rx="6"
        fill="var(--color-paper-light)"
        stroke="var(--color-ink)"
        stroke-width="2.2"
      />
      <text
        x="-1"
        y="5"
        text-anchor="middle"
        class="font-display"
        font-size="17"
        font-weight="800"
        fill="var(--color-ink)"
      >
        {{ key.letter }}
      </text>
    </g>
  </svg>
</template>

<style scoped>
.cursor {
  animation: cursor 1s steps(1) infinite;
}

@keyframes cursor {
  50% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cursor {
    animation: none;
  }
}
</style>
