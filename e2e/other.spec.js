import { test, expect } from "./fixture.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { clearFolder, waitFiles, checkingOutputFiles } from "./utils.js";

const codeWord = "other";
const codeWord1 = "Other";
const testDuration = 150000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testPath = path.resolve(__dirname, "../test/");
const outputPath = path.join(testPath, "output/");

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

test(`[${codeWord1}] 1.1. NumDen (14 subjects)`, async ({ window }) => {
  await clearFolder(outputPath);
  test.setTimeout(testDuration);

  const inputPath = path.join(testPath, `${codeWord}--other/`);
  const referencePath = path.join(inputPath, "reference/");
  const files = ["Чисельник Знаменник.xlsx"];

  await test.step("1. Fill out the form and start", async () => {
    await window.locator(".section-button#other").click();

    await window.locator(".gui#other--other .start").click();
  });

  await test.step("2. Waiting for output files", async () => {
    await waitFiles(outputPath, files);
  });

  await test.step("3. Checking output files", async () => {
    await checkingOutputFiles(referencePath, outputPath, files);
  });
});
