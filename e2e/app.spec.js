import { test, expect, _electron as electron } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('Генерация .xlsx файла проходит успешно', async () => {
  // 1. Запускаем собранное приложение в тестовом режиме
  const electronApp = await electron.launch({
    args: ['.'], // Точка входа из package.json
    env: { ...process.env, E2E_TEST: 'true' } // Передаем флаг для обхода C# диалога
  });

  const window = await electronApp.firstWindow();

  // 2. Клик на кнопку с id="other" (id уникальны, Svelte их не ломает)
  await window.locator('#other').click();

  // 3. Клик на кнопку старта
  // Если класс .start тоже хешируется в Svelte, надежнее искать по тексту внутри кнопки:
  // await window.locator('button:has-text("Старт")').click();
  await window.locator('.start').click();

  // 4. Ожидание результата
  // Путь, который мы захардкодили в Шаге 2
  const testFilePath = path.join(__dirname, '../test-output.xlsx');

  // Даем приложению время на работу Python-бэкенда и формирование таблицы (например, до 15 секунд)
  await expect.poll(() => fs.existsSync(testFilePath), {
    timeout: 15000,
  }).toBeTruthy();

  // 5. Уборка и закрытие
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath); // Удаляем тестовый файл
  }
  await electronApp.close();
});