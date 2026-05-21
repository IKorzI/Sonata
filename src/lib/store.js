import { writable } from 'svelte/store';

export const styles = writable();
export const selectedSection = writable();
export const whatDocument = writable();
export const hide = writable(false);
export const clearInformation = writable();
export const saveInformation = writable();
export const savedInformation = writable({});
export const error = writable({type: '', text: ''});

export const transition = writable('0s');
export { themeSwap } from './theme.js';
import { start as startTheme } from './theme.js';
startTheme();
