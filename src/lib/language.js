import { lng, unflattenStyles } from './store.js';

export const availableLngs = ['en', 'ru', 'uk'];
import lng_ru from './language/ru.json';
import lng_uk from './language/uk.json';
import lng_en from './language/en.json';

// Expand flat keys (e.g. "header.title") into nested objects during initialization
const lngs = {
  'ru': unflattenStyles(lng_ru),
  'uk': unflattenStyles(lng_uk),
  'en': unflattenStyles(lng_en)
}

const defaultLng = lngs['uk'];

export async function changeLanguage(language) {
    if (!availableLngs.includes(language)) {
        console.warn(`Language ${language} is not available.`);
        return;
    }

    let newLng = lngs[language];

    // We use the default language (uk) as a fallback to fill in missing translations
    newLng = deepMerge(defaultLng, newLng);

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

// Default language
export function start() {
  lng.set(defaultLng);
}