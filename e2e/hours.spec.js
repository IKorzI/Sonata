import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  clearFolder,
  electronLaunch,
  waitFiles,
  checkingOutputFiles,
} from "./utils.js";

const codeWord = "hours";
const codeWord1 = "Hours";
const testDuration = 150000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testPath = path.resolve(__dirname, "../test/");
const outputPath = path.join(testPath, "output/");

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

test(`[${codeWord1}] 1.1. Based on the first month (1 semester 14 subjects)`, async () => {
  await clearFolder(outputPath);
  test.setTimeout(testDuration);

  const inputPath = path.join(
    testPath,
    `${codeWord}--based-on-the-first-month/`,
  );
  const referencePath = path.join(
    inputPath,
    "reference/1 semester 14 subjects/",
  );
  const files = [
    "Вересень.xlsx",
    "Грудень.xlsx",
    "Жовтень.xlsx",
    "Загальна.xlsx",
    "Листопад.xlsx",
  ];

  let electronApp, window;

  await test.step("1. Launching the application", async () => {
    [electronApp, window] = await electronLaunch();
  });

  await test.step("2. Fill out the form and start", async () => {
    await window.locator(".section-button#based-on-the-first-month").click();
    const filePath = path.join(inputPath, "hours_1_14.xlsx");
    await window
      .locator(".file-input#hours--based-on-the-first-month--hours input")
      .setInputFiles(filePath);

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

test(`[${codeWord1}] 1.2. Based on the first month (2 semester 15 subjects)`, async () => {
  await clearFolder(outputPath);
  test.setTimeout(testDuration);

  const inputPath = path.join(
    testPath,
    `${codeWord}--based-on-the-first-month/`,
  );
  const referencePath = path.join(
    inputPath,
    "reference/2 semester 15 subjects/",
  );
  const files = [
    "Березень.xlsx",
    "Загальна.xlsx",
    "Квітень.xlsx",
    "Лютий.xlsx",
    "Січень.xlsx",
    "Травень.xlsx",
    "Червень.xlsx",
  ];

  let electronApp, window;

  await test.step("1. Launching the application", async () => {
    [electronApp, window] = await electronLaunch();
  });

  await test.step("2. Fill out the form and start", async () => {
    await window.locator(".section-button#based-on-the-first-month").click();
    const filePath = path.join(inputPath, "hours_2_15.xlsx");
    await window
      .locator(".file-input#hours--based-on-the-first-month--hours input")
      .setInputFiles(filePath);

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

test(`[${codeWord1}] 2.1. Summary of teachers (1 semester 14 subjects)`, async () => {
  await clearFolder(outputPath);
  test.setTimeout(testDuration);

  const inputPath = path.join(testPath, `${codeWord}--summary-of-teachers/`);
  const referencePath = path.join(
    inputPath,
    "reference/1 semester 14 subjects/",
  );
  const files = ["hours_1_14.xlsx"];

  let electronApp, window;

  await test.step("1. Launching the application", async () => {
    [electronApp, window] = await electronLaunch();
  });

  await test.step("2. Fill out the form and start", async () => {
    await window.locator(".section-button#summary-of-teachers").click();
    const filePath = path.join(inputPath, "hours_1_14.xlsx");
    await window
      .locator(".file-input#hours--summary-of-teachers--hours input")
      .setInputFiles(filePath);

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

test(`[${codeWord1}] 2.2. Summary of teachers (1 semester 15 subjects)`, async () => {
  await clearFolder(outputPath);
  test.setTimeout(testDuration);

  const inputPath = path.join(testPath, `${codeWord}--summary-of-teachers/`);
  const referencePath = path.join(
    inputPath,
    "reference/1 semester 15 subjects/",
  );
  const files = ["hours_1_15.xlsx"];

  let electronApp, window;

  await test.step("1. Launching the application", async () => {
    [electronApp, window] = await electronLaunch();
  });

  await test.step("2. Fill out the form and start", async () => {
    await window.locator(".section-button#summary-of-teachers").click();
    const filePath = path.join(inputPath, "hours_1_15.xlsx");
    await window
      .locator(".file-input#hours--summary-of-teachers--hours input")
      .setInputFiles(filePath);

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

test(`[${codeWord1}] 2.3. Summary of teachers (2 semester 14 subjects)`, async () => {
  await clearFolder(outputPath);
  test.setTimeout(testDuration);

  const inputPath = path.join(testPath, `${codeWord}--summary-of-teachers/`);
  const referencePath = path.join(
    inputPath,
    "reference/2 semester 14 subjects/",
  );
  const files = ["hours_2_14.xlsx"];

  let electronApp, window;

  await test.step("1. Launching the application", async () => {
    [electronApp, window] = await electronLaunch();
  });

  await test.step("2. Fill out the form and start", async () => {
    await window.locator(".section-button#summary-of-teachers").click();
    const filePath = path.join(inputPath, "hours_2_14.xlsx");
    await window
      .locator(".file-input#hours--summary-of-teachers--hours input")
      .setInputFiles(filePath);

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

test(`[${codeWord1}] 2.4. Summary of teachers (2 semester 15 subjects)`, async () => {
  await clearFolder(outputPath);
  test.setTimeout(testDuration);

  const inputPath = path.join(testPath, `${codeWord}--summary-of-teachers/`);
  const referencePath = path.join(
    inputPath,
    "reference/2 semester 15 subjects/",
  );
  const files = ["hours_2_15.xlsx"];

  let electronApp, window;

  await test.step("1. Launching the application", async () => {
    [electronApp, window] = await electronLaunch();
  });

  await test.step("2. Fill out the form and start", async () => {
    await window.locator(".section-button#summary-of-teachers").click();
    const filePath = path.join(inputPath, "hours_2_15.xlsx");
    await window
      .locator(".file-input#hours--summary-of-teachers--hours input")
      .setInputFiles(filePath);

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
