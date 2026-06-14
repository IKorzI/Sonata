import { lng, unflattenStyles } from "./store.js";

export const availableLngs = ["en", "ru", "uk"];
import lng_ru from "../../locales/ru.json";
import lng_uk from "../../locales/uk.json";
import lng_en from "../../locales/en.json";

// Extract only the "frontend" key before unpacking (unflatten)
const lngs = {
  ru: unflattenStyles(lng_ru.frontend || {}),
  uk: unflattenStyles(lng_uk.frontend || {}),
  en: unflattenStyles(lng_en.frontend || {}),
};

const defaultLng = lngs["uk"];

export async function changeLanguage(language) {
  if (!availableLngs.includes(language)) {
    console.warn(`Language ${language} is not available.`);
    return;
  }

  let newLng = lngs[language];

  // We use the default language (uk) as a fallback
  newLng = deepMerge(defaultLng, newLng);

  lng.set(newLng);

  // Notifying the backend via the IPC bridge
  if (window.electron) {
    try {
      await window.electron.languageSet(language);
    } catch (err) {
      console.error(
        "Error notifying the backend about a language change:",
        err,
      );
    }
  }
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// Setting the default language when starting the frontend
export function start() {
  lng.set(defaultLng);
}
