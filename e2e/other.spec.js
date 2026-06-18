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

const codeWord = "other";
const codeWord1 = "Other";
const testDuration = 150000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testPath = path.resolve(__dirname, "../test/");
const outputPath = path.join(testPath, "output/");

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

test(`[${codeWord1}] 1.1. NumDen (14 subjects)`, async () => {
  await clearFolder(outputPath);
  test.setTimeout(testDuration);

  const inputPath = path.join(testPath, `${codeWord}--other/`);
  const referencePath = path.join(inputPath, "reference/");
  const files = ["Чисельник Знаменник.xlsx"];

  let electronApp, window;

  await test.step("1. Launching the application", async () => {
    [electronApp, window] = await electronLaunch();
  });

  await test.step("2. Fill out the form and start", async () => {
    await window.locator(".section-button#other").click();

    await window.locator(".gui#other--other .start").click();
  });

  await test.step("3. Waiting for output files", async () => {
    await waitFiles(outputPath, files);
  });

  await test.step("4. Checking output files", async () => {
    await checkingOutputFiles(referencePath, outputPath, files);
  });

  await electronApp.close();
});
