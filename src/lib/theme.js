import { styles, unflattenStyles } from "./store.js";
import stylesData from "./styles.json";

let theme = "dark";

export function themeSwap() {
  theme = theme === "light" ? "dark" : "light";
  styles.set(unflattenStyles(stylesData[theme]));
}

// Тема за замовчуванням
export function start() {
  styles.set(unflattenStyles(stylesData[theme]));
}
