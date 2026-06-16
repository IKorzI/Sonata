import { test, expect, _electron as electron } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Успешный клик по кнопкам и проверка создания файла', async () => {
  const electronApp = await electron.launch({
    args: ['.'],
    env: { ...process.env, E2E_TEST: 'true' }
  });

  const window = await electronApp.firstWindow();

  await window.locator('.section-button#other').click();
  await window.locator('#num-den .start').click();

  const expectedFilePath = path.join(__dirname, '../test/Чисельник Знаменник.xlsx');

  await expect.poll(() => fs.existsSync(expectedFilePath), {
    message: 'Файл ведомости не был создан в отведенное время',
    timeout: 15000,
  }).toBeTruthy();

  if (fs.existsSync(expectedFilePath)) {
    fs.unlinkSync(expectedFilePath);
  }

  await electronApp.close();
});