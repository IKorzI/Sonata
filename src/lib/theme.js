import { styles, unflattenStyles } from "./store.js";
import stylesData from "./styles.json";

const theme = {
  current: null,
  dark: null,
  light: null
}

export function themeSwap() {
  theme.current = theme.current === "dark" ? "light" : "dark";
  styles.set(unflattenStyles(stylesData[theme[theme.current]]));
  window.electron.saveSetting("theme.current", theme.current)
}

export function start(_theme) {
  theme.current = _theme.current;
  theme.dark = _theme.dark;
  theme.light = _theme.light;
  styles.set(unflattenStyles(stylesData[theme[theme.current]]));
}

export function setTheme(type, theme) {
  theme[type] = theme
  window.electron.saveSetting(`theme.${type}`, theme)
}