import { ipcMain, dialog } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { lng } from "./language.js";

// Getting the absolute path to the project's root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(path.dirname(__filename), "../..");

// Searching for a file by its base name in the directory, ignoring files with the .png extension
export function findFileWithExtension(dir, baseName) {
  const fullDir = path.resolve(dir);

  const files = fs.readdirSync(fullDir);

  const found = files.find((file) => {
    if (!file.startsWith(baseName + ".")) return false;
    const ext = path.extname(file).toLowerCase();
    return ext !== ".png";
  });

  if (!found) return null;

  const extension = path.extname(found);
  const fullPath = path.join(fullDir, found);

  return { extension, fullPath };
}

// Calling the system dialog window to save a file
async function saveDialog(fileName, extension) {
  const { filePath, canceled } = await dialog.showSaveDialog({
    defaultPath: `${fileName}${extension}`,
    filters: [{ name: lng.files, extensions: [extension.replace(".", "")] }],
  });

  if (canceled || !filePath) return null;
  return filePath;
}

ipcMain.handle("save-dialog", async (event, fileName, extension) => {
  return saveDialog(fileName, extension);
});

ipcMain.handle("save-file", async (event, sourcePath, targetPath) => {
  try {
    fs.copyFileSync(sourcePath, targetPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle("find-file", async (event, dir, baseName) => {
  const fullDir = path.join(__dirname, "public/", dir);
  return findFileWithExtension(fullDir, baseName);
});

ipcMain.handle("check-file-access", async (event, filePath) => {
  try {
    const fd = fs.openSync(filePath, "r");
    fs.closeSync(fd);
    return true;
  } catch (err) {
    return false;
  }
});
