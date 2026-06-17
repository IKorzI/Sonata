import { test, expect, _electron as electron } from "@playwright/test";
import fs from "fs";
import path from "path";
import XlsxPopulate from "xlsx-populate";

import { exec } from "child_process";
import util from "util";
import { fromPath } from "pdf2pic";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const execAsync = util.promisify(exec);

const STYLES_TO_COMPARE = [
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "fontSize",
  "fontFamily",
  "fontColor",
  "fill",
  "horizontalAlignment",
  "verticalAlignment",
  "wrapText",
];

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
      .poll(() => fs.existsSync(fullFilePath), {
        message: `The file was not created on time. Searched here: ${fullFilePath}`,
        timeout: timeout,
      })
      .toBeTruthy();
  }
}

async function convertToPdf(inputFilePath, outputFilePath) {
  const sofficeCmd = '"C:\\Program Files\\LibreOffice\\program\\soffice.exe"';
  const outputDir = path.dirname(outputFilePath);

  const command = `${sofficeCmd} --headless --convert-to pdf --outdir "${outputDir}" "${inputFilePath}"`;

  await execAsync(command);

  const baseName = path.parse(inputFilePath).name;
  const defaultOutputPath = path.join(outputDir, `${baseName}.pdf`);

  if (defaultOutputPath !== outputFilePath) {
    fs.renameSync(defaultOutputPath, outputFilePath);
  }

  return outputFilePath;
}

function readPNG(filePath) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(filePath);
    readStream.on("error", reject);

    const img = readStream
      .pipe(new PNG())
      .on("parsed", () => resolve(img))
      .on("error", reject);
  });
}

async function renderPdfPage(pdfPath, pageNum, outputDir) {
  const options = {
    density: 300,
    saveFilename: path.parse(pdfPath).name,
    savePath: outputDir,
    format: "png",
    width: 2480,
    height: 3508,
  };

  const storeAsImage = fromPath(pdfPath, options);
  const result = await storeAsImage(pageNum);
  return result.path;
}

async function comparePdfs(refPdfPath, testPdfPath, outputDir) {
  const refImgPath = await renderPdfPage(refPdfPath, 1, outputDir);
  const testImgPath = await renderPdfPage(testPdfPath, 1, outputDir);

  const img1 = await readPNG(refImgPath);
  const img2 = await readPNG(testImgPath);

  if (img1.width !== img2.width || img1.height !== img2.height) {
    return false;
  }

  const diff = new PNG({ width: img1.width, height: img1.height });
  const numDiffPixels = pixelmatch(
    img1.data,
    img2.data,
    diff.data,
    img1.width,
    img1.height,
    { threshold: 0.1 },
  );

  if (numDiffPixels === 0) {
    fs.unlinkSync(refImgPath);
    fs.unlinkSync(testImgPath);
    return true;
  } else {
    const diffPath = path.join(outputDir, "difference_map.png");

    await new Promise((resolve, reject) => {
      const outStream = fs.createWriteStream(diffPath);
      outStream.on("finish", resolve);
      outStream.on("error", reject);
      diff.pack().pipe(outStream);
    });

    return false;
  }
}

export async function checkingOutputFiles(referencePath, outputPath, files) {
  for (const file of files) {
    const stepResult = await test.step(file, async () => {
      const refPdfPath = path.join(referencePath, "ref.pdf");
      const outPdfPath = path.join(outputPath, "out.pdf");

      await convertToPdf(path.join(referencePath, file), refPdfPath);
      await convertToPdf(path.join(outputPath, file), outPdfPath);

      const isMatch = await comparePdfs(refPdfPath, outPdfPath, outputPath);

      if (!isMatch) {
        return file;
      }

      fs.unlinkSync(refPdfPath);
      fs.unlinkSync(outPdfPath);
    });

    if (stepResult) {
      return stepResult;
    }
  }
}
