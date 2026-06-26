import { styles, unflattenStyles } from "./store.js";
import stylesData from "./styles.json";

const theme = {
  current: {
    type: null,
    number: null,
  },
  dark: null,
  light: null,
};

function applyTheme() {
  const { type, number } = theme.current;

  if (!stylesData[type]) {
    console.error(`Theme type "${type}" not found in styles.json`);
    return;
  }

  const generalStyles = stylesData[type].general;
  const specificStyles = stylesData[type][number];
  const combinedStyles = Object.assign({}, generalStyles, specificStyles);

  styles.set(unflattenStyles(combinedStyles));

  window.electron.saveSetting("theme.current.type", type);
  window.electron.saveSetting("theme.current.number", number);
}

export function themeSwap() {
  theme.current.type = theme.current.type === "dark" ? "light" : "dark";
  theme.current.number = theme[theme.current.type];

  applyTheme();
}

export function start(_theme) {
  theme.current.type = _theme.current.type;
  theme.current.number = _theme.current.number;
  theme.dark = _theme.dark;
  theme.light = _theme.light;

  applyTheme();
}

export function setTheme(type, number) {
  if (theme.current.type == type) {
    theme[theme.current.type] = number;
    theme.current.type = type;
    theme.current.number = number;
    applyTheme();
    window.electron.saveSetting(`theme.${theme.current.type}`, number);
  }
}
