<template>
  <!-- Mapa de papel doblado con una ruta y alfileres (decorativo) -->
  <svg viewBox="0 0 240 150" aria-hidden="true" class="h-full w-full overflow-visible">
    <g transform="rotate(-5 120 78)">
      <rect
        x="22"
        y="16"
        width="196"
        height="122"
        rx="10"
        fill="var(--color-ink)"
        transform="translate(5 5)"
      />
      <rect
        x="22"
        y="16"
        width="196"
        height="122"
        rx="10"
        fill="var(--color-sea)"
        stroke="var(--color-ink)"
        stroke-width="2.5"
      />
      <g fill="none" stroke="#7fbccb" stroke-width="1.4" stroke-linecap="round">
        <path
          d="M34 34q6-3 12 0t12 0M168 30q6-3 12 0t12 0M178 112q6-3 12 0t12 0M40 118q6-3 12 0t12 0"
        />
      </g>
      <g
        fill="var(--color-sand)"
        stroke="var(--color-ink)"
        stroke-width="2.2"
        stroke-linejoin="round"
      >
        <path
          d="M44 48c12-10 34-8 40 4 5 10-6 16-6 26s14 14 10 26c-4 10-16 14-26 8-8-6-4-18-12-26-8-7-18-8-16-20 1-8 4-13 10-18z"
        />
        <path
          d="M120 40c14-6 38-2 44 12 4 10-8 14-4 24 5 12 22 10 22 26 0 12-16 18-30 14-12-4-10-18-22-24-10-5-24-2-26-16-2-12 6-30 16-36z"
        />
        <path d="M188 56c6-4 16-2 18 4s-6 10-12 9-10-9-6-13z" />
      </g>
      <!-- Pliegues -->
      <path d="M87 16v122M152 16v122" stroke="var(--color-ink)" stroke-width="1.2" opacity="0.18" />
      <!-- Ruta -->
      <path
        d="M62 70C80 40 110 96 136 68s40 30 60-6"
        fill="none"
        stroke="var(--color-pink)"
        stroke-width="3.2"
        stroke-dasharray="1 7"
        stroke-linecap="round"
      />
      <g stroke="var(--color-ink)" stroke-width="2.2" stroke-linejoin="round">
        <g transform="translate(62 72)">
          <path d="M0 0C-2-6-8-9-8-15a8 8 0 1 1 16 0C8-9 2-6 0 0Z" fill="var(--color-jade)" />
          <circle cy="-15" r="3" fill="var(--color-paper-light)" stroke-width="1.6" />
        </g>
        <g transform="translate(136 70)">
          <path d="M0 0C-2-6-8-9-8-15a8 8 0 1 1 16 0C8-9 2-6 0 0Z" fill="var(--color-sun)" />
          <circle cy="-15" r="3" fill="var(--color-paper-light)" stroke-width="1.6" />
        </g>
        <g transform="translate(196 64) scale(1.45)">
          <path d="M0 0C-2-6-8-9-8-15a8 8 0 1 1 16 0C8-9 2-6 0 0Z" fill="var(--color-pink)" />
          <circle cy="-15" r="3" fill="var(--color-paper-light)" stroke-width="1.6" />
        </g>
      </g>
    </g>
  </svg>
</template>
