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
  const docbuilderCmd =
    '"C:\\Program Files\\ONLYOFFICE\\DocumentBuilder\\docbuilder.exe"';

  const outputDir = path.dirname(outputFilePath);
  const scriptPath = path.join(
    outputDir,
    `convert_${Date.now()}_${Math.floor(Math.random() * 1000)}.docbuilder`,
  );

  const safeInputPath = inputFilePath.replace(/\\/g, "/");
  const safeOutputPath = outputFilePath.replace(/\\/g, "/");

  const scriptContent = `
    builder.OpenFile("${safeInputPath}");
    builder.SaveFile("pdf", "${safeOutputPath}");
    builder.CloseFile();
  `;

  fs.writeFileSync(scriptPath, scriptContent);

  const command = `${docbuilderCmd} "${scriptPath}"`;

  try {
    await execAsync(command);
  } catch (error) {
    console.error(
      `[ONLYOFFICE Error] Ошибка конвертации файла: ${inputFilePath}\n`,
      error.message,
    );
    throw error;
  } finally {
    if (fs.existsSync(scriptPath)) {
      fs.unlinkSync(scriptPath);
    }
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

async function renderAllPdfPages(pdfPath, outputDir, prefix) {
  const options = {
    density: 300,
    saveFilename: `${path.parse(pdfPath).name}_${prefix}`,
    savePath: outputDir,
    format: "png",
    width: 2480,
    height: 3508,
  };

  const storeAsImage = fromPath(pdfPath, options);
  const results = await storeAsImage.bulk(-1, { returnAsFile: true });

  return results.map((res) => res.path).sort();
}

async function comparePdfs(refPdfPath, testPdfPath, outputDir) {
  const refImages = await renderAllPdfPages(refPdfPath, outputDir, "ref");
  const testImages = await renderAllPdfPages(testPdfPath, outputDir, "out");

  if (refImages.length !== testImages.length) {
    console.error(
      `Page count mismatch: Ref has ${refImages.length}, Test has ${testImages.length}`,
    );
    return false;
  }

  for (let i = 0; i < refImages.length; i++) {
    const img1 = await readPNG(refImages[i]);
    const img2 = await readPNG(testImages[i]);

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

    if (numDiffPixels !== 0) {
      const diffPath = path.join(outputDir, `difference_map_page_${i + 1}.png`);
      await new Promise((resolve, reject) => {
        const outStream = fs.createWriteStream(diffPath);
        outStream.on("finish", resolve);
        outStream.on("error", reject);
        diff.pack().pipe(outStream);
      });
      return false;
    }

    fs.unlinkSync(refImages[i]);
    fs.unlinkSync(testImages[i]);
  }

  return true;
}

export async function clearFolder(pathForClear) {
  if (fs.existsSync(pathForClear)) {
    const dirFiles = fs.readdirSync(pathForClear);

    for (const entry of dirFiles) {
      // "..txt"
      const isTargetTxt = /^\..*\.txt$/i.test(entry);

      if (!isTargetTxt) {
        const fullPath = path.join(pathForClear, entry);
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    }
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
