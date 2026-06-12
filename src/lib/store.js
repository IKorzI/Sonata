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