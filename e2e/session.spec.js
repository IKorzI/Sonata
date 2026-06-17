import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  preparingTheFolder,
  electronLaunch,
  waitFiles,
  checkingOutputFiles,
} from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("1. Package of documents (14 subjects)", async () => {
  test.setTimeout(60000);

  const inputOutputPath = path.join(__dirname, "../test/package-of-documents/");
  const referencePath = path.join(inputOutputPath, "reference/14 subjects/");
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
    await preparingTheFolder(inputOutputPath, files);
    [electronApp, window] = await electronLaunch();
  });

  await test.step("2. Fill out the form and start", async () => {
    await window.locator(".section-button#package-of-documents").click();
    const filePath = path.join(inputOutputPath, "statements_14.xlsx");
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
    await waitFiles(inputOutputPath, files);
  });

  await test.step("4. Checking output files", async () => {
    const mismatchedFile = await checkingOutputFiles(
      referencePath,
      inputOutputPath,
      files,
    );

    expect(
      mismatchedFile,
      `The file '${mismatchedFile}' differs from the reference!`,
    ).toBeUndefined();
  });

  await electronApp.close();
});

test("2. Package of documents (15 subjects)", async () => {
  test.setTimeout(60000);

  const inputOutputPath = path.join(__dirname, "../test/package-of-documents/");
  const referencePath = path.join(inputOutputPath, "reference/15 subjects/");
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
    await preparingTheFolder(inputOutputPath, files);
    [electronApp, window] = await electronLaunch();
  });

  await test.step("2. Fill out the form and start", async () => {
    await window.locator(".section-button#package-of-documents").click();
    const filePath = path.join(inputOutputPath, "statements_15.xlsx");
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
    await waitFiles(inputOutputPath, files);
  });

  await test.step("4. Checking output files", async () => {
    const mismatchedFile = await checkingOutputFiles(
      referencePath,
      inputOutputPath,
      files,
    );

    expect(
      mismatchedFile,
      `The file '${mismatchedFile}' differs from the reference!`,
    ).toBeUndefined();
  });

  await electronApp.close();
});
