import { test, expect, _electron as electron } from "@playwright/test";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

export async function preparingTheFolder(pathToTheFolder, files) {
  for (const file of files) {
    const filePath = path.join(pathToTheFolder, file);

    if (file.includes("/") || file.includes("\\")) {
      const firstSubFolder = file.split(/[/\\]/)[0];
      const subFolderPath = path.join(pathToTheFolder, firstSubFolder);

      if (fs.existsSync(subFolderPath)) {
        fs.rmSync(subFolderPath, { recursive: true, force: true });
      }
    } else {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
}

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

  return [electronApp, window];
}

export async function waitFiles(pathToTheFolder, files, timeout = 45000) {
  for (const file of files) {
    const fullFilePath = path.join(pathToTheFolder, file);
    await expect
      .poll(() => {
        if (!fs.existsSync(fullFilePath)) return false;
        
        try {
          new AdmZip(fullFilePath);
          return true;
        } catch (error) {
          return false;
        }
      }, {
        message: `The file was not created or fully written on time. Searched here: ${fullFilePath}`,
        timeout: timeout,
      })
      .toBeTruthy();
  }
}

export async function clearFolder(pathForClear) {
  if (fs.existsSync(pathForClear)) {
    const dirFiles = fs.readdirSync(pathForClear);

    for (const entry of dirFiles) {
      const isTargetTxt = /^\..*\.txt$/i.test(entry);

      if (!isTargetTxt) {
        const fullPath = path.join(pathForClear, entry);
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    }
  }
}

function getNormalizedDocx(filePath) {
  const zip = new AdmZip(filePath);
  let documentXml = zip.readAsText("word/document.xml");
  
  if (!documentXml) {
    throw new Error(`Invalid DOCX or missing document.xml: ${filePath}`);
  }

  documentXml = documentXml.replace(/ w:rsid[a-zA-Z0-9]*="[^"]*"/g, "");
  
  return documentXml;
}

function getNormalizedXlsx(filePath) {
  const zip = new AdmZip(filePath);
  const zipEntries = zip.getEntries();
  const extractedData = {};

  zipEntries.forEach((entry) => {
    const fileName = entry.entryName;

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

export async function checkingOutputFiles(referencePath, outputPath, files) {
  for (const file of files) {
    const stepResult = await test.step(file, async () => {
      const refFile = path.join(referencePath, file);
      const outFile = path.join(outputPath, file);

      if (!fs.existsSync(outFile)) {
        console.error(`Missing output file: ${outFile}`);
        return file;
      }

      try {
        if (file.endsWith(".docx")) {
          const refContent = getNormalizedDocx(refFile);
          const outContent = getNormalizedDocx(outFile);
          
          if (refContent !== outContent) return file;
        } else if (file.endsWith(".xlsx")) {
          const refStruct = getNormalizedXlsx(refFile);
          const outStruct = getNormalizedXlsx(outFile);

          const refKeys = Object.keys(refStruct).sort();
          const outKeys = Object.keys(outStruct).sort();

          if (JSON.stringify(refKeys) !== JSON.stringify(outKeys)) {
            return file;
          }

          for (const key of refKeys) {
            if (refStruct[key] !== outStruct[key]) {
              return file;
            }
          }
        } else {
          console.warn(`Unsupported file format for comparison: ${file}`);
        }
      } catch (error) {
        console.error(`Error comparing ${file}:`, error);
        return file;
      }
    });

    if (stepResult) {
      return stepResult;
    }
  }
  
  return undefined;
}