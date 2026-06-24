import { lng, unflattenStyles } from "./store.js";

export const availableLngs = {};
const lngs = {};

const localeFiles = import.meta.glob("../../locales/*.json", { eager: true });

for (const path in localeFiles) {
  const fileData = localeFiles[path].default || localeFiles[path];
  const langKey = fileData.lng;

  if (langKey && !availableLngs[langKey]) {
    availableLngs[langKey] = fileData.name || langKey;
    
    lngs[langKey] = {
      lng: fileData.lng,
      name: fileData.name,
      ...unflattenStyles(fileData.frontend || {})
    };
  }
}

const defaultLangCode = "uk";
const defaultLng = lngs[defaultLangCode] || {};

export async function changeLanguage(language) {
  if (!availableLngs.hasOwnProperty(language)) {
    console.warn(`Language ${language} is not available.`);
    return;
  }

  let newLng = lngs[language];

  newLng = deepMerge(defaultLng, newLng);

  lng.set(newLng);

  await window.electron.languageSet(language);
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

export function start(language) {
  changeLanguage(language);
}