import { ipcMain } from "electron";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "../..");

const localesDir = path.join(rootDir, "locales");

export const availableLngs = {};
const defaultLangCode = "uk";

const backendLngsData = {};
let defaultBackendLng = {};
export const lng = {};

function unflattenStyles(flat) {
  const result = {};
  for (const key in flat) {
    const keys = key.split(".");
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

function loadAvailableLanguages() {
  if (!fs.existsSync(localesDir)) return;

  const files = fs.readdirSync(localesDir).filter(file => file.endsWith(".json"));

  for (const file of files) {
    const filePath = path.join(localesDir, file);
    try {
      const fileData = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const langKey = fileData.lng;

      if (langKey && !availableLngs[langKey]) {
        availableLngs[langKey] = file;

        backendLngsData[langKey] = {
          lng: fileData.lng,
          name: fileData.name,
          ...unflattenStyles(fileData.backend || {})
        };
      }
    } catch (error) {
      console.error(`Ошибка при чтении файла ${file}:`, error);
    }
  }
}

function initBackendLanguage() {
  defaultBackendLng = backendLngsData[defaultLangCode] || {};
  Object.assign(lng, defaultBackendLng);
}

export function languageSet(language) {
  if (!availableLngs.hasOwnProperty(language)) return;

  const targetBackend = backendLngsData[language] || {};
  const newLng = deepMerge(defaultBackendLng, targetBackend);

  for (const key in lng) {
    delete lng[key];
  }
  Object.assign(lng, newLng);
}

loadAvailableLanguages();
initBackendLanguage();

ipcMain.handle("languageSet", async (event, isMode) => {
  languageSet(isMode);
});