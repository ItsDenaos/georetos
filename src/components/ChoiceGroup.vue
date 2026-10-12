<script setup lang="ts" generic="T extends string">
/** Grupo de opciones tipo "etiqueta" con radios nativos (accesible con teclado y lector de pantalla). */
import { useId } from 'vue'

defineProps<{
  legend: string
  step?: number
  options: readonly { value: T; label: string; hint?: string }[]
}>()

const model = defineModel<T>({ required: true })
const name = useId()
</script>

<template>
  <fieldset>
    <legend class="mb-3 flex items-center gap-2">
      <span
        v-if="step"
        class="grid size-7 place-items-center rounded-full border-2 border-ink bg-sun font-mono text-xs font-semibold"
        aria-hidden="true"
        >{{ String(step).padStart(2, '0') }}</span
      >
      <span class="label-mono text-ink">{{ legend }}</span>
    </legend>
    <div class="flex flex-wrap gap-2.5">
      <label
        v-for="option in options"
        :key="option.value"
        class="tag group relative flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border-2 border-ink px-3.5 py-2 transition-[transform,box-shadow,background-color] duration-150"
        :class="
          model === option.value
            ? 'bg-cobalt text-paper-light shadow-ink'
            : 'bg-paper-light text-ink shadow-ink-sm hover:-translate-x-px hover:-translate-y-px hover:shadow-ink'
        "
      >
        <input v-model="model" type="radio" :name="name" :value="option.value" class="sr-only" />
        <svg
          v-if="model === option.value"
          viewBox="0 0 16 16"
          class="size-4 shrink-0 animate-pop"
          aria-hidden="true"
        >
          <circle
            cx="8"
            cy="8"
            r="7"
            fill="var(--color-sun)"
            stroke="var(--color-ink)"
            stroke-width="1.6"
          />
          <path
            d="M4.8 8.3l2.1 2.1 4.3-4.6"
            fill="none"
            stroke="var(--color-ink)"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span class="flex flex-col">
          <span class="leading-tight font-bold">{{ option.label }}</span>
          <span
            v-if="option.hint"
            class="font-mono text-[0.68rem] tracking-wide"
            :class="model === option.value ? 'text-cobalt-light' : 'text-ink-soft'"
            >{{ option.hint }}</span
          >
        </span>
      </label>
    </div>
  </fieldset>
</template>

<style scoped>
.tag:has(:focus-visible) {
  outline: 3px solid var(--color-pink);
  outline-offset: 3px;
}
</style>
