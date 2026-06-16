import { test, expect, _electron as electron } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Успешный клик по кнопкам и проверка создания файла', async () => {
  test.setTimeout(60000);

  const electronApp = await electron.launch({
    args: ['.'],
    env: { ...process.env, E2E_TEST: 'true' }
  });

  electronApp.process().stdout.on('data', (data) => console.log(`[Electron STDOUT]: ${data.toString()}`));
  electronApp.process().stderr.on('data', (data) => console.error(`[Electron STDERR]: ${data.toString()}`));

  const window = await electronApp.firstWindow();

  await window.locator('.section-button#other').click();
  await window.locator('#num-den .start').click();

  const expectedFilePath = path.join(__dirname, '../test/Чисельник Знаменник.xlsx');
  console.log(`[Test Debug]: Ожидаем появление файла по пути: ${expectedFilePath}`);

  await expect.poll(() => fs.existsSync(expectedFilePath), {
    message: 'Файл ведомости не был создан в отведенное время',
    timeout: 45000,
  }).toBeTruthy();

  if (fs.existsSync(expectedFilePath)) {
    fs.unlinkSync(expectedFilePath);
  }

  await electronApp.close();
});