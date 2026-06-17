import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from "url";
import { preparingTheFolder, electronLaunch, waitFiles, checkingOutputFiles } from "./utils.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Package of documents', async () => {
  test.setTimeout(60000);

  const inputPath = path.join(__dirname, '../test/package-of-documents/')
  const referencePath = path.join(inputPath, 'reference/')
  const outputPath = path.join(__dirname, '../test/')
  const files = [
    "Відомості.xlsx",
    "Клопотання D5.docx",
    "Клопотання D7.docx",
    "Подання D7.docx",
    "Пояснення D7.docx",
    "Рейтинг на сайт D5.docx",
    "Рейтинг на сайт D7.docx"
  ]

  await preparingTheFolder(outputPath, files)
  const [electronApp, window] = await electronLaunch()

  await window.locator('.section-button#package-of-documents').click();
  const filePath = path.join(inputPath, 'statements_14.xlsx');
  await window.locator('.file-input#session--package-of-documents--statements input').setInputFiles(filePath);
  await window.locator('.social-scholarship .add').click();
  await window.locator('.social-scholarship .add').click();
  await window.locator('.social-scholarship .list #row-0 .student').click();
  await window.getByText('Білан Інна Євгенівна').click();
  await window.locator('.social-scholarship .list #row-0 .status').click();
  await window.getByText('Внутрішньо переміщена особа').click();
  await window.locator('.social-scholarship .list #row-1 .student').click();
  await window.getByText('Безуглий Юрій Віталійович').click();
  await window.locator('.social-scholarship .list #row-1 .status').click();
  await window.getByText('Дитина учасника бойових дій').click();
  await window.locator('.social-scholarship .label2').click();
  await window.locator('.social-scholarship .add').click();
  await window.locator('.social-scholarship .list #row-0 .student').click();
  await window.getByText('Сидоренко Ілля Артемович').click();

  await window.locator('.workspace > .start').click();

  await waitFiles(outputPath, files)

  const result = await checkingOutputFiles(referencePath, outputPath, files)

  await electronApp.close();
});