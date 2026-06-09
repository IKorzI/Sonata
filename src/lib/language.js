import { lng } from './store.js';

export const availableLngs = ['en', 'ru', 'uk'];
import lng_ru from './language/ru.json';
import lng_uk from './language/uk.json';
import lng_en from './language/en.json';
const lngs = {
  'ru': unflattenStyles(lng_ru),
  'uk': unflattenStyles(lng_uk),
  'en': unflattenStyles(lng_en)
}

// Загружаем данные по умолчанию (uk)
const defaultLng = lngs['uk'];

// Функция для смены языка
export async function changeLanguage(language) {
    if (!availableLngs.includes(language)) {
        console.warn(`Language ${language} is not available.`);
        return;
    }

    let newLng = lngs[language];

    // Мержим данные: если в новом языке отсутствует ключ, оставляем значение из украинского
    newLng = deepMerge(defaultLng, newLng);

    // Обновляем store
    lng.set(newLng);
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// Функция для преобразования данных из "плоской" структуры в вложенную
function unflattenStyles(flat) {
  const result = {};
  for (const key in flat) {
    const keys = key.split('.');
    keys.reduce((acc, part, index) => {
      if (index === keys.length - 1) {
        acc[part] = flat[key];
      } else {
        acc[part] = acc[part] || {};
      }
      return acc[part];
    }, result);
  }
  return result;
}

export function start() {
  lng.set(defaultLng);
}