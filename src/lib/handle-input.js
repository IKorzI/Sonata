import { tick } from 'svelte';

/**
 * Фільтрує або валідує рядок залежно від параметрів.
 * @param {string} text - Вихідний текст для фільтрації чи перевірки.
 * @param {Object} [params] - Об'єкт з параметрами.
 * @param {boolean} [params.numbers=false] - Дозволити цифри (0-9).
 * @param {boolean} [params.letters=false] - Дозволити літери (укр/рос/англ).
 * @param {boolean} [params.period=false] - Дозволити крапку.
 * @param {boolean} [params.comma=false] - Дозволити кому.
 * @param {boolean} [params.spaces=false] - Дозволити пробіли.
 * @param {boolean} [params.date=false] - Увімкнути режим валідації дати (ДД.ММ.РРРР).
 * @param {boolean} [params.future=false] - Якщо true разом з date, дата має бути більшою за сьогодні.
 * @returns {string} Очищений рядок, або вихідний рядок (якщо дата валідна), або порожній рядок.
 */
export function textFilter(text, { 
  numbers = false, 
  letters = false, 
  period = false, 
  comma = false, 
  spaces = false,
  date = false,
  future = false
} = {}) {
  if (typeof text !== 'string') return '';

  // Режим роботи з датою (пріоритетний)
  if (date) {
    // Регулярний вираз для базового формату ДД.ММ.РРРР
    const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    const match = text.trim().match(dateRegex);
    
    if (!match) return '';

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // Місяці в JS Date починаються з 0
    const year = parseInt(match[3], 10);

    const parsedDate = new Date(year, month, day);

    // Перевірка на реальність дати (наприклад, щоб не пройшло 31.02.2026)
    if (
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() !== month ||
      parsedDate.getDate() !== day
    ) {
      return '';
    }

    // Якщо активовано future, перевіряємо чи дата строго більша за сьогоднішню
    if (future) {
      const today = new Date();
      // Скидаємо час до 00:00:00 для коректного порівняння лише дат
      today.setHours(0, 0, 0, 0);
      parsedDate.setHours(0, 0, 0, 0);

      if (parsedDate <= today) {
        return '';
      }
    }

    return text.trim();
  }

  // Звичайний режим фільтрації символів (якщо date === false)
  let allowedChars = '';

  if (numbers) allowedChars += '0-9';
  if (letters) allowedChars += 'a-zA-Zа-яёА-ЯЁіІїЇєЄґҐ'; 
  if (period)  allowedChars += '\\.';
  if (comma)   allowedChars += ',';
  if (spaces)  allowedChars += ' ';

  if (!allowedChars) return '';

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