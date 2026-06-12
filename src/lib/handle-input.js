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
 * @param {number} [params.minNumber] - Мінімальне допустиме числове значення.
 * @param {number} [params.maxNumber] - Максимальне допустиме числове значення.
 * @returns {string} Очищений рядок, або строка без останнього символу (якщо число вийшло за межі).
 */
export function textFilter(text, { 
  numbers = false, 
  letters = false, 
  period = false, 
  comma = false, 
  spaces = false,
  date = false,
  future = false,
  minNumber = 0,
  maxNumber = undefined
} = {}) {
  if (typeof text !== 'string') return '';

  // Режим роботи з датою (без змін)
  if (date) {
    const dateRegex = /^(\d{2})\.(\d{2})\.(\d{4})$/;
    const match = text.trim().match(dateRegex);
    if (!match) return '';
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const year = parseInt(match[3], 10);
    const parsedDate = new Date(year, month, day);
    if (parsedDate.getFullYear() !== year || parsedDate.getMonth() !== month || parsedDate.getDate() !== day) {
      return '';
    }
    if (future) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      parsedDate.setHours(0, 0, 0, 0);
      if (parsedDate <= today) return '';
    }
    return text.trim();
  }

  // Звичайний режим фільтрації символів
  let allowedChars = '';
  if (numbers) allowedChars += '0-9';
  if (letters) allowedChars += 'a-zA-Zа-яёА-ЯЁіІїЇєЄґҐ'; 
  if (period)  allowedChars += '\\.';
  if (comma)   allowedChars += ',';
  if (spaces)  allowedChars += ' ';

  if (!allowedChars) return '';

  const regex = new RegExp(`[^${allowedChars}]`, 'g');
  let filteredText = text.replace(regex, '');

  // Валідація діапазону чисел
  if (numbers) {
    const onlyDigits = filteredText.replace(/[^0-9]/g, '');
    
    if (onlyDigits.length > 0) {
      const numericValue = parseInt(onlyDigits, 10);

      // Якщо число занадто велике, відкочуємо введення (прибираємо останній символ тексту)
      if (maxNumber !== undefined && numericValue > maxNumber) {
        return filteredText.slice(0, -1); 
      }
      
      // Для minNumber: якщо користувач тільки починає писати (наприклад, натиснув "1", а мін. 10),
      // ми НЕ повинні стирати "1", інакше він ніколи не зможе ввести "10".
      // Тому minNumber перевіряємо тільки якщо довжина числа вже дозволяє порівняння, 
      // або перевіряємо фінальний вихід (зазвичай minNumber краще валідувати при blur, але зробимо м'який ліміт)
      if (minNumber !== undefined && numericValue < minNumber) {
        // Якщо довжина введеного числа вже дорівнює або більша за довжину мінімального числа,
        // і воно все ще менше — значить це дійсно невалідний ввід
        if (onlyDigits.length >= String(minNumber).length) {
          return filteredText.slice(0, -1);
        }
      }
    } else if (minNumber !== undefined || maxNumber !== undefined) {
      return '';
    }
  }

  return filteredText;
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

export function strToDate(str) {
  const [day, month, year] = str.split('.').map(Number);
  return new Date(year, month - 1, day);
}