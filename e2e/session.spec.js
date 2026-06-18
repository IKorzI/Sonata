import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  clearFolder,
  preparingTheFolder,
  electronLaunch,
  waitFiles,
  checkingOutputFiles,
} from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectPath = path.resolve(__dirname, "../");
const outputPath = path.join(projectPath, "test/output/");

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

test("[Session] 1.1. Package of documents (14 subjects)", async () => {
  await clearFolder(outputPath);
  test.setTimeout(120000);

  const inputPath = path.join(projectPath, "test/package-of-documents/");
  const referencePath = path.join(inputPath, "reference/14 subjects/");
  const files = [
    "Відомості.xlsx",
    "Клопотання D5.docx",
    "Клопотання D7.docx",
    "Подання D7.docx",
    "Пояснення D7.docx",
    "Рейтинг на сайт D5.docx",
    "Рейтинг на сайт D7.docx",
  ];

  let electronApp, window;

  await test.step("1. Launching the application", async () => {
    await preparingTheFolder(inputPath, files);
    [electronApp, window] = await electronLaunch();
  });

  await test.step("2. Fill out the form and start", async () => {
    await window.locator(".section-button#package-of-documents").click();
    const filePath = path.join(inputPath, "statements_14.xlsx");
    await window
      .locator(".file-input#session--package-of-documents--statements input")
      .setInputFiles(filePath);
    await window.locator(".social-scholarship .add").click();
    await window.locator(".social-scholarship .add").click();
    await window.locator(".social-scholarship .list #row-0 .student").click();
    await window.getByText("Білан Інна Євгенівна").click();
    await window.locator(".social-scholarship .list #row-0 .status").click();
    await window.getByText("Внутрішньо переміщена особа").click();
    await window.locator(".social-scholarship .list #row-1 .student").click();
    await window.getByText("Безуглий Юрій Віталійович").click();
    await window.locator(".social-scholarship .list #row-1 .status").click();
    await window.getByText("Дитина учасника бойових дій").click();
    await window.locator(".social-scholarship .label2").click();
    await window.locator(".social-scholarship .add").click();
    await window.locator(".social-scholarship .list #row-0 .student").click();
    await window.getByText("Сидоренко Ілля Артемович").click();

    await window.locator(".workspace > .start").click();
  });

  await test.step("3. Waiting for output files", async () => {
    await waitFiles(outputPath, files);
  });

  await test.step("4. Checking output files", async () => {
    await checkingOutputFiles(referencePath, outputPath, files);
  });

  await electronApp.close();
});

test("[Session] 1.2. Package of documents (15 subjects)", async () => {
  await clearFolder(outputPath);
  test.setTimeout(120000);

  const inputPath = path.join(projectPath, "test/package-of-documents/");
  const referencePath = path.join(inputPath, "reference/15 subjects/");
  const files = [
    "Відомості.xlsx",
    "Клопотання D5.docx",
    "Клопотання D7.docx",
    "Подання D7.docx",
    "Пояснення D7.docx",
    "Рейтинг на сайт D5.docx",
    "Рейтинг на сайт D7.docx",
  ];

  let electronApp, window;

  await test.step("1. Launching the application", async () => {
    await preparingTheFolder(inputPath, files);
    [electronApp, window] = await electronLaunch();
  });

  await test.step("2. Fill out the form and start", async () => {
    await window.locator(".section-button#package-of-documents").click();
    const filePath = path.join(inputPath, "statements_15.xlsx");
    await window
      .locator(".file-input#session--package-of-documents--statements input")
      .setInputFiles(filePath);
    await window.locator(".social-scholarship .add").click();
    await window.locator(".social-scholarship .add").click();
    await window.locator(".social-scholarship .list #row-0 .student").click();
    await window.getByText("Білан Інна Євгенівна").click();
    await window.locator(".social-scholarship .list #row-0 .status").click();
    await window.getByText("Внутрішньо переміщена особа").click();
    await window.locator(".social-scholarship .list #row-1 .student").click();
    await window.getByText("Безуглий Юрій Віталійович").click();
    await window.locator(".social-scholarship .list #row-1 .status").click();
    await window.getByText("Дитина учасника бойових дій").click();
    await window.locator(".social-scholarship .label2").click();
    await window.locator(".social-scholarship .add").click();
    await window.locator(".social-scholarship .list #row-0 .student").click();
    await window.getByText("Сидоренко Ілля Артемович").click();

    await window.locator(".workspace > .start").click();
  });

  await test.step("3. Waiting for output files", async () => {
    await waitFiles(outputPath, files);
  });

  await test.step("4. Checking output files", async () => {
    await checkingOutputFiles(referencePath, outputPath, files);
  });

  await electronApp.close();
});

test("[Session] 2.1. Empty statements (1 semester 14 subjects)", async () => {
  await clearFolder(outputPath);
  test.setTimeout(120000);

  const inputPath = path.join(projectPath, "test/empty-statements/");
  const referencePath = path.join(
    inputPath,
    "reference/1 semester 14 subjects/",
  );
  const files = [
    "I семестр/25-1/Відомості 25-1.xlsx",
    "I семестр/25-2/Відомості 25-2.xlsx",
    "I семестр/25-3/Відомості 25-3.xlsx",
    "I семестр/25-4/Відомості 25-4.xlsx",
    "I семестр/25-5/Відомості 25-5.xlsx",
    "I семестр/Відомості для викладачів.xlsx",
    "I семестр/Журнал видачі відомостей.xlsx",
  ];

  let electronApp, window;

  await test.step("1. Launching the application", async () => {
    await preparingTheFolder(inputPath, files);
    [electronApp, window] = await electronLaunch();
  });

  await test.step("2. Fill out the form and start", async () => {
    await window.locator(".section-button#empty-statements").click();
    const hoursFilePath = path.join(inputPath, "hours_1_14.xlsx");
    await window
      .locator(".file-input#session--empty-statements--hours input")
      .setInputFiles(hoursFilePath);
    const contingentFilePath = path.join(inputPath, "contingent.xlsx");
    await window
      .locator(".file-input#session--empty-statements--contingent input")
      .setInputFiles(contingentFilePath);
    await window.locator(".semester-number input").fill("1");

    await window.locator(".workspace > .start").click();
  });

  await test.step("3. Waiting for output files", async () => {
    await waitFiles(outputPath, files);
  });

  await test.step("4. Checking output files", async () => {
    await checkingOutputFiles(referencePath, outputPath, files);
  });

  await electronApp.close();
});

test("[Session] 2.2. Empty statements (1 semester 15 subjects)", async () => {
  await clearFolder(outputPath);
  test.setTimeout(120000);

  const inputPath = path.join(projectPath, "test/empty-statements/");
  const referencePath = path.join(
    inputPath,
    "reference/1 semester 15 subjects/",
  );
  const files = [
    "I семестр/25-1/Відомості 25-1.xlsx",
    "I семестр/25-2/Відомості 25-2.xlsx",
    "I семестр/25-3/Відомості 25-3.xlsx",
    "I семестр/25-4/Відомості 25-4.xlsx",
    "I семестр/25-5/Відомості 25-5.xlsx",
    "I семестр/Відомості для викладачів.xlsx",
    "I семестр/Журнал видачі відомостей.xlsx",
  ];

  let electronApp, window;

  await test.step("1. Launching the application", async () => {
    await preparingTheFolder(inputPath, files);
    [electronApp, window] = await electronLaunch();
  });

  await test.step("2. Fill out the form and start", async () => {
    await window.locator(".section-button#empty-statements").click();
    const hoursFilePath = path.join(inputPath, "hours_1_15.xlsx");
    await window
      .locator(".file-input#session--empty-statements--hours input")
      .setInputFiles(hoursFilePath);
    const contingentFilePath = path.join(inputPath, "contingent.xlsx");
    await window
      .locator(".file-input#session--empty-statements--contingent input")
      .setInputFiles(contingentFilePath);
    await window.locator(".semester-number input").fill("1");

    await window.locator(".workspace > .start").click();
  });

  await test.step("3. Waiting for output files", async () => {
    await waitFiles(outputPath, files);
  });

  await test.step("4. Checking output files", async () => {
    await checkingOutputFiles(referencePath, outputPath, files);
  });

  await electronApp.close();
});

test("[Session] 2.3. Empty statements (2 semester 14 subjects)", async () => {
  await clearFolder(outputPath);
  test.setTimeout(120000);

  const inputPath = path.join(projectPath, "test/empty-statements/");
  const referencePath = path.join(
    inputPath,
    "reference/2 semester 14 subjects/",
  );
  const files = [
    "II семестр/25-1/Відомості 25-1.xlsx",
    "II семестр/25-2/Відомості 25-2.xlsx",
    "II семестр/25-3/Відомості 25-3.xlsx",
    "II семестр/25-4/Відомості 25-4.xlsx",
    "II семестр/25-5/Відомості 25-5.xlsx",
    "II семестр/Відомості для викладачів.xlsx",
    "II семестр/Журнал видачі відомостей.xlsx",

    "рік/25-1/Відомості 25-1.xlsx",
    "рік/25-2/Відомості 25-2.xlsx",
    "рік/25-3/Відомості 25-3.xlsx",
    "рік/25-4/Відомості 25-4.xlsx",
    "рік/25-5/Відомості 25-5.xlsx",
    "рік/Відомості для викладачів.xlsx",
    "рік/Журнал видачі відомостей.xlsx",
  ];

  let electronApp, window;

  await test.step("1. Launching the application", async () => {
    await preparingTheFolder(inputPath, files);
    [electronApp, window] = await electronLaunch();
  });

  await test.step("2. Fill out the form and start", async () => {
    await window.locator(".section-button#empty-statements").click();
    const hoursFilePath = path.join(inputPath, "hours_2_14.xlsx");
    await window
      .locator(".file-input#session--empty-statements--hours input")
      .setInputFiles(hoursFilePath);
    const contingentFilePath = path.join(inputPath, "contingent.xlsx");
    await window
      .locator(".file-input#session--empty-statements--contingent input")
      .setInputFiles(contingentFilePath);
    await window.locator(".semester-number input").fill("2");
    await window.locator(".first-index input").fill("71");

    await window.locator(".workspace > .start").click();
  });

  await test.step("3. Waiting for output files", async () => {
    await waitFiles(outputPath, files);
  });

  await test.step("4. Checking output files", async () => {
    await checkingOutputFiles(referencePath, outputPath, files);
  });

  await electronApp.close();
});

test("[Session] 2.4. Empty statements (2 semester 15 subjects)", async () => {
  await clearFolder(outputPath);
  test.setTimeout(120000);

  const inputPath = path.join(projectPath, "test/empty-statements/");
  const referencePath = path.join(
    inputPath,
    "reference/2 semester 15 subjects/",
  );
  const files = [
    "II семестр/25-1/Відомості 25-1.xlsx",
    "II семестр/25-2/Відомості 25-2.xlsx",
    "II семестр/25-3/Відомості 25-3.xlsx",
    "II семестр/25-4/Відомості 25-4.xlsx",
    "II семестр/25-5/Відомості 25-5.xlsx",
    "II семестр/Відомості для викладачів.xlsx",
    "II семестр/Журнал видачі відомостей.xlsx",

    "рік/25-1/Відомості 25-1.xlsx",
    "рік/25-2/Відомості 25-2.xlsx",
    "рік/25-3/Відомості 25-3.xlsx",
    "рік/25-4/Відомості 25-4.xlsx",
    "рік/25-5/Відомості 25-5.xlsx",
    "рік/Відомості для викладачів.xlsx",
    "рік/Журнал видачі відомостей.xlsx",
  ];

  let electronApp, window;

  await test.step("1. Launching the application", async () => {
    await preparingTheFolder(inputPath, files);
    [electronApp, window] = await electronLaunch();
  });

  await test.step("2. Fill out the form and start", async () => {
    await window.locator(".section-button#empty-statements").click();
    const hoursFilePath = path.join(inputPath, "hours_2_15.xlsx");
    await window
      .locator(".file-input#session--empty-statements--hours input")
      .setInputFiles(hoursFilePath);
    const contingentFilePath = path.join(inputPath, "contingent.xlsx");
    await window
      .locator(".file-input#session--empty-statements--contingent input")
      .setInputFiles(contingentFilePath);
    await window.locator(".semester-number input").fill("2");
    await window.locator(".first-index input").fill("76");

    await window.locator(".workspace > .start").click();
  });

  await test.step("3. Waiting for output files", async () => {
    await waitFiles(outputPath, files);
  });

  await test.step("4. Checking output files", async () => {
    await checkingOutputFiles(referencePath, outputPath, files);
  });

  await electronApp.close();
});
