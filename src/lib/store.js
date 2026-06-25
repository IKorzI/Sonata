import { writable, get } from "svelte/store";

export const settings = writable({});

export const appVersion = writable("0.0.0");
export const updating = writable(false);
export const updateAvailable = writable(false);
export const updateProgress = writable(0);

export const styles = writable();
export const lng = writable();

export const selectedSection = writable();

export const whatDocumentWindow = writable(false);
export const aboutWindow = writable(false);
export const themeMenuWindow = writable(false);
export const settingsWindow = writable(false);
const stores = [
  whatDocumentWindow,
  aboutWindow,
  themeMenuWindow,
  settingsWindow,
];
function autoCloseOthers(currentStore) {
  currentStore.subscribe((value) => {
    if (value === true) {
      stores.forEach((store) => {
        if (store !== currentStore) {
          store.set(false);
        }
      });
    }
  });
}
stores.forEach(autoCloseOthers);

export const hide = writable(false);
export const clearInformation = writable();
export const saveInformation = writable();
export const savedInformation = writable({});
export const message = writable({ type: "", text: "" });

export const transition = writable("0s");

export { themeSwap, setTheme } from "./theme.js";
export { changeLanguage, availableLngs } from "./language.js";
export { textFilter, handleInput, strToDate } from "./handle-input.js";

import { start as startTheme } from "./theme.js";
import { start as startLanguage } from "./language.js";

async function initializeApp() {
  const collectedSettings = await window.electron.getSettings();
  settings.set(collectedSettings);
  startTheme(collectedSettings.theme);
  startLanguage(collectedSettings.language);

  appVersion.set(await window.electron.getAppVersion());
  updateAvailable.set(await window.electron.checkUpdate());
}
initializeApp();

// Converts dotted keys to an object hierarchy: { "a.b": "val" } -> { a: { b: "val" } }
export function unflattenStyles(flat) {
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