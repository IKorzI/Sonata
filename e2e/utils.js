import { test, expect, _electron as electron } from "@playwright/test";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

/**
 * Prepares the test directory by cleaning up specific files or subdirectories.
 * @param {string} pathToTheFolder - The absolute path to the target folder.
 * @param {string[]} files - An array of file names or relative paths to remove.
 */
export async function preparingTheFolder(pathToTheFolder, files) {
  for (const file of files) {
    const filePath = path.join(pathToTheFolder, file);

    // If the path contains slashes, we assume it's a subdirectory and remove the entire top-level subfolder
    if (file.includes("/") || file.includes("\\")) {
      const firstSubFolder = file.split(/[/\\]/)[0];
      const subFolderPath = path.join(pathToTheFolder, firstSubFolder);

      if (fs.existsSync(subFolderPath)) {
        fs.rmSync(subFolderPath, { recursive: true, force: true });
      }
    } else {
      // Otherwise, it's a direct file in the root of the folder
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
}

/**
 * Launches the Electron application in E2E mode and attaches console listeners.
 * @returns {Promise<[import('@playwright/test').ElectronApplication, import('@playwright/test').Page]>}
 * Returns the Electron app instance and the first loaded window.
 */
export async function electronLaunch() {
  const electronApp = await electron.launch({
    args: ["."],
    env: { ...process.env, E2E_TEST: "true" },
  });

  electronApp
    .process()
    .stdout.on("data", (data) =>
      console.log(`[Electron STDOUT]: ${data.toString()}`),
    );
  electronApp
    .process()
    .stderr.on("data", (data) =>
      console.error(`[Electron STDERR]: ${data.toString()}`),
    );

  const window = await electronApp.firstWindow();

  // Ensuring the app is completely rendered before tests start
  await window.waitForLoadState("load");
  await window.waitForLoadState("domcontentloaded");

  return [electronApp, window];
}

/**
 * Polls the file system until the specified ZIP-based files (like DOCX/XLSX) are fully written.
 * @param {string} pathToTheFolder - The directory where the files should appear.
 * @param {string[]} files - An array of file names to wait for.
 * @param {number} [timeout=1200000] - Maximum time to wait in milliseconds.
 */
export async function waitFiles(pathToTheFolder, files, timeout = 1200000) {
  for (const file of files) {
    const fullFilePath = path.join(pathToTheFolder, file);
    await expect
      .poll(
        () => {
          if (!fs.existsSync(fullFilePath)) return false;

          try {
            // Instantiating AdmZip acts as a validation check.
            // If the file is still being written by the OS, reading it as a ZIP will throw an error.
            new AdmZip(fullFilePath);
            return true;
          } catch (error) {
            return false;
          }
        },
        {
          message: `The file was not created or fully written on time. Searched here: ${fullFilePath}`,
          timeout: timeout,
        },
      )
      .toBeTruthy();
  }
}

/**
 * Clears all files in a directory except for hidden text files (e.g., .gitkeep variants).
 * @param {string} pathForClear - The path to the directory to clean up.
 */
export async function clearFolder(pathForClear) {
  if (fs.existsSync(pathForClear)) {
    const dirFiles = fs.readdirSync(pathForClear);

    for (const entry of dirFiles) {
      // Matches files like ".placeholder.txt" so they aren't deleted
      const isTargetTxt = /^\..*\.txt$/i.test(entry);

      if (!isTargetTxt) {
        const fullPath = path.join(pathForClear, entry);
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    }
  }
}

/**
 * Extracts and normalizes the core XML content from a DOCX file for consistent comparison.
 * @param {string} filePath - Path to the DOCX file.
 * @returns {string} The normalized document.xml content.
 */
function getNormalizedDocx(filePath) {
  const zip = new AdmZip(filePath);
  let documentXml = zip.readAsText("word/document.xml");

  if (!documentXml) {
    throw new Error(`Invalid DOCX or missing document.xml: ${filePath}`);
  }

  // Microsoft Word injects random 'rsid' attributes on every save, which ruins strict string comparison.
  // We strip them out to only compare the actual document structure and text.
  documentXml = documentXml.replace(/ w:rsid[a-zA-Z0-9]*="[^"]*"/g, "");

  return documentXml;
}

/**
 * Extracts key structural and data XML files from an XLSX archive.
 * @param {string} filePath - Path to the XLSX file.
 * @returns {Object<string, string>} A dictionary mapping internal file paths to their XML content.
 */
function getNormalizedXlsx(filePath) {
  const zip = new AdmZip(filePath);
  const zipEntries = zip.getEntries();
  const extractedData = {};

  zipEntries.forEach((entry) => {
    const fileName = entry.entryName;

    // We only care about the core structure, styles, strings, and actual sheet data.
    if (
      fileName === "xl/styles.xml" ||
      fileName === "xl/sharedStrings.xml" ||
      fileName === "xl/workbook.xml" ||
      fileName.startsWith("xl/worksheets/")
    ) {
      extractedData[fileName] = zip.readAsText(fileName);
    }
  });

  return extractedData;
}

/**
 * Compares generated output files against pre-validated reference files.
 * Supports DOCX and XLSX formats by doing deep XML comparison instead of raw binary comparison.
 * @param {string} referencePath - Directory containing the "golden" reference files.
 * @param {string} outputPath - Directory containing the newly generated files.
 * @param {string[]} files - List of file names to compare.
 */
export async function checkingOutputFiles(referencePath, outputPath, files) {
  for (const file of files) {
    await test.step(`Compare: ${file}`, async () => {
      const refFile = path.join(referencePath, file);
      const outFile = path.join(outputPath, file);

      if (!fs.existsSync(outFile)) {
        throw new Error(`Missing output file: ${outFile}`);
      }

      if (file.endsWith(".docx")) {
        const refContent = getNormalizedDocx(refFile);
        const outContent = getNormalizedDocx(outFile);

        expect(outContent, `Mismatch in DOCX: ${file}`).toEqual(refContent);
      } else if (file.endsWith(".xlsx")) {
        const refStruct = getNormalizedXlsx(refFile);
        const outStruct = getNormalizedXlsx(outFile);

        const refKeys = Object.keys(refStruct).sort();
        const outKeys = Object.keys(outStruct).sort();

        // Ensure both files contain the exact same internal XML structures (same number of sheets, etc.)
        expect(outKeys, `Missing internal files in ${file}`).toEqual(refKeys);

        for (const key of refKeys) {
          expect(outStruct[key], `Mismatch in ${file} -> ${key}`).toEqual(
            refStruct[key],
          );
        }
      } else {
        console.warn(`Unsupported file format for comparison: ${file}`);
      }
    });
  }

  return undefined;
}
