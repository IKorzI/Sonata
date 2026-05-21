import { styles } from './store.js';
import stylesData from './styles.json';

let theme = 'dark';

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

export function themeSwap() {
  theme = theme === 'light' ? 'dark' : 'light';
  styles.set(unflattenStyles(stylesData[theme]));
}

export function start() {
  styles.set(unflattenStyles(stylesData[theme]));
}