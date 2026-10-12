/**
 * Normalización de textos para comparar nombres: sin tildes, en minúsculas y con
 * la puntuación convertida en espacios. Sin dependencias: la usa también el
 * script de datos.
 */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim()
}

/** Igual que normalize, pero sin espacios: "EE. UU." y "eeuu" coinciden. */
export function compact(text: string): string {
  return normalize(text).replace(/ /g, '')
}
