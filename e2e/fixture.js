import { test as base, expect } from "@playwright/test";
import { electronLaunch } from "./utils.js";

// Расширяем базовый test своей логикой
export const test = base.extend({
  // Эта фикстура имеет scope: "worker", значит она выполнится 1 раз для всех файлов
  appState: [
    async ({}, use) => {
      const [electronApp, window] = await electronLaunch();

      // Передаем управление тестам (здесь будут по очереди выполняться все твои файлы)
      await use({ electronApp, window });

      // Этот код сработает только после того, как завершится ПОСЛЕДНИЙ тест во всех файлах
      await electronApp.close();
    },
    { scope: "worker" },
  ],

  // Делаем удобную обертку, чтобы в тестах сразу получать window, а не appState.window
  window: [
    async ({ appState }, use) => {
      await use(appState.window);
    },
    { scope: "worker" },
  ],
});

export { expect };
