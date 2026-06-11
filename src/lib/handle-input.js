import { tick } from 'svelte';

/**
 * Фільтрує рядок, залишаючи лише дозволені типи символів.
 * @param {string} text - Вихідний текст для фільтрації.
 * @param {Object} [params] - Об'єкт з параметрами фільтрації.
 * @param {boolean} [params.numbers=false] - Дозволити цифри (0-9).
 * @param {boolean} [params.letters=false] - Дозволити літери (укр/рос/англ).
 * @param {boolean} [params.period=false] - Дозволити крапку.
 * @param {boolean} [params.comma=false] - Дозволити кому.
 * @param {boolean} [params.spaces=false] - Дозволити пробіли.
 * @returns {string} Очищений рядок, що містить лише дозволені символи.
 */
export function textFilter(text, { numbers = false, letters = false, period = false, comma = false, spaces = false } = {}) {
  if (typeof text !== 'string') return '';

  let allowedChars = '';

  if (numbers) allowedChars += '0-9';
  if (letters) allowedChars += 'a-zA-Zа-яёА-ЯЁіІїЇєЄґҐ'; 
  if (period)  allowedChars += '\\.';
  if (comma)   allowedChars += ',';
  if (spaces)  allowedChars += ' ';

  if (!allowedChars) return '';

  // Видаляємо всі символи, які не входять до списку дозволених
  const regex = new RegExp(`[^${allowedChars}]`, 'g');

  return text.replace(regex, '');
}

/**
 * Застосовує фільтр до поля вводу та зберігає правильну позицію курсора,
 * щоб він не стрибав у кінець рядка після перезапису значення.
 */
export async function handleInput(input, params) {
  const cursorStart = input.selectionStart;
  const originalValue = input.value;
  
  const cleanValue = textFilter(originalValue, params);
  input.value = cleanValue;

  // Коригуємо позицію курсора на кількість видалених (невалідних) символів
  const diff = originalValue.length - cleanValue.length;
  const newCursorPos = Math.max(0, cursorStart - diff); 

  await tick();
  
  input.setSelectionRange(newCursorPos, newCursorPos);
}