import { ipcMain } from "electron";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "../..");

const availableLngs = ["en", "ru", "uk"];
const defaultLangCode = "uk";

const localesDir = path.join(rootDir, "locales");

let defaultBackendLng = {};

export const lng = {};

// Converts dotted keys to an object hierarchy: { "a.b": "val" } -> { a: { b: "val" } }
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

function initBackendLanguage() {
  const defaultPath = path.join(localesDir, `${defaultLangCode}.json`);
  const fileData = JSON.parse(fs.readFileSync(defaultPath, "utf8"));

  defaultBackendLng = unflattenStyles(fileData.backend || {});

  Object.assign(lng, defaultBackendLng);
}

export function languageSet(language) {
  if (!availableLngs.includes(language)) return;

  const filePath = path.join(localesDir, `${language}.json`);
  if (!fs.existsSync(filePath)) return;

  const fileData = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const targetBackend = unflattenStyles(fileData.backend || {});

  const newLng = deepMerge(defaultBackendLng, targetBackend);

  for (const key in lng) {
    delete lng[key];
  }
  Object.assign(lng, newLng);
}

initBackendLanguage();

ipcMain.handle("languageSet", async (event, isMode) => {
  languageSet(isMode);
});
