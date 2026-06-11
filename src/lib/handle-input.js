import { tick } from 'svelte';

export function textFilter(text, { numbers = false, letters = false, period = false, comma = false, spaces = false } = {}) {
  if (typeof text !== 'string') return '';

  // Собираем паттерн для того, что мы ХОТИМ оставить
  let allowedChars = '';

  if (numbers) allowedChars += '0-9';
  if (letters) allowedChars += 'a-zA-Zа-яёА-ЯЁ'; // Английский и русский алфавит
  if (period)  allowedChars += '\\.';
  if (comma)   allowedChars += ',';
  if (spaces)  allowedChars += ' ';

  // Если ни один флаг не передан, вернем пустую строку
  if (!allowedChars) return '';

  // Создаем регулярное выражение: инвертируем класс [^...] 
  // То есть «удалить всё, что НЕ входит в список разрешенных»
  const regex = new RegExp(`[^${allowedChars}]`, 'g');

  return text.replace(regex, '');
}

export async function handleInput(input, params) {
  // Запис поточної позиції курсору, яку поставив браузер після введення
  const cursorStart = input.selectionStart;
  const originalValue = input.value;
  // Очистка значення (видалення всього крім цифр)
  const cleanValue = textFilter(originalValue, params);
  // Оновлення тексту
  input.value = cleanValue;
  // Обчислення зміщення курсору
  const diff = originalValue.length - cleanValue.length;
  const newCursorPos = cursorStart - diff;
  // Очікування Svelte
  await tick();
  // Встановлення курсору на правильну позицію
  input.setSelectionRange(newCursorPos, newCursorPos);
}