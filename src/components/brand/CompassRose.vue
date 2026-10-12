<template>
  <!-- Rosa de los vientos decorativa -->
  <svg viewBox="0 0 64 64" aria-hidden="true">
    <circle
      cx="32"
      cy="34"
      r="20"
      fill="var(--color-paper-light)"
      fill-opacity="0.75"
      stroke="var(--color-ink)"
      stroke-width="1.5"
    />
    <circle
      cx="32"
      cy="34"
      r="16"
      fill="none"
      stroke="var(--color-ink)"
      stroke-width="0.8"
      stroke-dasharray="1.5 2.5"
    />
    <g stroke="var(--color-ink)" stroke-width="1.3" stroke-linejoin="round">
      <path d="M32 34l-4-4 4-18 4 18z" fill="var(--color-tomato)" />
      <path d="M32 34l4 4-4 18-4-18z" fill="var(--color-paper-light)" />
      <path d="M32 34l4-4 18 4-18 4z" fill="var(--color-paper-light)" />
      <path d="M32 34l-4 4-18-4 18-4z" fill="var(--color-paper-light)" />
      <path
        d="M32 34l-2.8-1.2L22 24l8.8 7.2zM32 34l1.2-2.8L42 24l-7.2 8.8zM32 34l2.8 1.2L42 44l-8.8-7.2zM32 34l-1.2 2.8L22 44l7.2-8.8z"
        fill="var(--color-ink)"
      />
    </g>
    <circle cx="32" cy="34" r="2.2" fill="var(--color-ink)" />
    <text
      x="32"
      y="9.5"
      text-anchor="middle"
      class="font-display"
      font-size="10"
      font-weight="800"
      fill="var(--color-ink)"
    >
      N
    </text>
  </svg>
</template>
