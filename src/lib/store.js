import { writable } from 'svelte/store';

export const styles = writable();
export const lng = writable();

export const selectedSection = writable();
export const whatDocument = writable();
export const hide = writable(false);
export const clearInformation = writable();
export const saveInformation = writable();
export const savedInformation = writable({});
export const message = writable({type: '', text: ''});

export const transition = writable('0s');

export { themeSwap } from './theme.js';
export { changeLanguage, availableLngs } from './language.js';
export { textFilter, handleInput, strToDate } from './handle-input.js';

import { start as startTheme } from './theme.js';
import { start as startLanguage } from './language.js';
startTheme();
startLanguage();

// Перетворює ключі з крапками на ієрархію об'єктів: { "a.b": "val" } -> { a: { b: "val" } }
export function unflattenStyles(flat) {
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