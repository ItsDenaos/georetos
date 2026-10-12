<script setup lang="ts">
/**
 * Campo para escribir un país con autocompletado (patrón combobox de ARIA).
 * Ignora tildes y mayúsculas y acepta alias. Las sugerencias se abren hacia
 * arriba: en el celular, el teclado ocupa la parte de abajo.
 */
import { computed, ref, useId, watch } from 'vue'

import { es } from '@/i18n/es'
import { getCountry } from '@/lib/countries'
import { resolveCountry, searchCountries } from '@/lib/search'

const props = withDefaults(defineProps<{ exclude?: readonly string[]; disabled?: boolean }>(), {
  exclude: () => [],
  disabled: false,
})
const emit = defineEmits<{ select: [code: string] }>()

const id = useId()
const listId = `${id}-lista`
const input = ref<HTMLInputElement | null>(null)
const query = ref('')
const open = ref(false)
const active = ref(0)
const error = ref('')

const excluded = computed(() => new Set(props.exclude))
const suggestions = computed(() => searchCountries(query.value, excluded.value))
const activeId = computed(() =>
  open.value && suggestions.value[active.value] ? `${id}-op-${active.value}` : undefined,
)

watch(query, (text) => {
  active.value = 0
  error.value = ''
  open.value = text.trim() !== ''
})

function choose(code: string) {
  emit('select', code)
  query.value = ''
  open.value = false
  input.value?.focus()
}

function submit() {
  const highlighted = open.value ? suggestions.value[active.value] : undefined
  if (highlighted) return choose(highlighted.code)
  const code = resolveCountry(query.value)
  if (code && excluded.value.has(code))
    error.value = es.silhouette.repeated(getCountry(code)?.name ?? '')
  else if (code) choose(code)
  else if (query.value.trim()) error.value = es.silhouette.unknown
}

function onKeydown(event: KeyboardEvent) {
  const count = suggestions.value.length
  if (event.key === 'ArrowDown' && count > 0) {
    event.preventDefault()
    if (!open.value) open.value = true
    else active.value = (active.value + 1) % count
  } else if (event.key === 'ArrowUp' && count > 0) {
    event.preventDefault()
    active.value = (active.value - 1 + count) % count
  } else if (event.key === 'Escape') {
    open.value = false
  }
}

defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <form class="relative" @submit.prevent="submit">
    <label :for="id" class="label-mono mb-1.5 block">{{ es.silhouette.inputLabel }}</label>
    <div class="flex gap-2">
      <input
        :id="id"
        ref="input"
        v-model="query"
        type="text"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="open && suggestions.length > 0"
        :aria-controls="listId"
        :aria-activedescendant="activeId"
        :aria-invalid="error !== ''"
        :disabled="disabled"
        :placeholder="es.silhouette.placeholder"
        autocomplete="off"
        autocapitalize="none"
        autocorrect="off"
        spellcheck="false"
        enterkeyhint="go"
        class="min-h-13 w-full min-w-0 flex-1 rounded-xl border-2 border-ink bg-paper-light px-4 text-lg font-semibold shadow-ink-sm placeholder:font-normal placeholder:text-ink-soft/70 focus:bg-white disabled:opacity-50"
        @keydown="onKeydown"
        @blur="open = false"
        @focus="open = query.trim() !== ''"
      />
      <button type="submit" class="btn-primary shrink-0" :disabled="disabled">
        {{ es.silhouette.submit }}
      </button>
    </div>

    <ul
      v-show="open && suggestions.length > 0"
      :id="listId"
      role="listbox"
      :aria-label="es.silhouette.inputLabel"
      class="absolute right-0 bottom-full left-0 z-30 mb-2 overflow-hidden rounded-xl border-2 border-ink bg-paper-light shadow-ink"
    >
      <li
        v-for="(s, i) in suggestions"
        :id="`${id}-op-${i}`"
        :key="s.code"
        role="option"
        :aria-selected="i === active"
        class="flex cursor-pointer items-center justify-between gap-3 border-b border-dashed border-ink/20 px-4 py-2.5 last:border-b-0"
        :class="i === active ? 'bg-sun' : 'hover:bg-paper-deep'"
        @mousedown.prevent="choose(s.code)"
        @mousemove="active = i"
      >
        <span class="font-bold">{{ s.name }}</span>
        <span v-if="s.alias" class="label-mono text-ink-soft">{{
          es.silhouette.aliasOf(s.alias)
        }}</span>
      </li>
    </ul>

    <p class="sr-only" aria-live="polite">
      {{ open && query ? es.silhouette.suggestions(suggestions.length) : '' }}
    </p>
    <p v-if="error" class="mt-2 text-sm font-semibold text-tomato-ink" role="alert">{{ error }}</p>
  </form>
</template>
