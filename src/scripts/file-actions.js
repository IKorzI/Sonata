import { ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Getting the absolute path to the project's root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(path.dirname(__filename), '../..');
console.log(__dirname)

// Searching for a file by its base name in the directory, ignoring files with the .png extension
export function findFileWithExtension(dir, baseName) {
  const fullDir = path.resolve(dir);

  const files = fs.readdirSync(fullDir);

  const found = files.find(file => {
    if (!file.startsWith(baseName + '.')) return false;
    const ext = path.extname(file).toLowerCase();
    return ext !== '.png';
  });

  if (!found) return null;

  const extension = path.extname(found);
  const fullPath = path.join(fullDir, found);

  return { extension, fullPath };
}

// Calling the system dialog window to save a file
async function saveDialog(fileName, extension) {
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: 'Сохранить файл как',
    defaultPath: `${fileName}${extension}`,
    filters: [{ name: 'Файлы', extensions: [extension.replace('.', '')] }],
  });

  if (canceled || !filePath) return null;
  return filePath;
}

// Registering IPC handlers for interaction with the frontend part of Electron

// Handler for calling the save dialog window
ipcMain.handle('save-dialog', async (event, fileName, extension) => {
  return saveDialog(fileName, extension);
});

// Handler for physical copying (saving) of a file
ipcMain.handle('save-file', async (event, sourcePath, targetPath) => {
  try {
    fs.copyFileSync(sourcePath, targetPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Handler for searching a file in the public project directory
ipcMain.handle('find-file', async (event, dir, baseName) => {
  const fullDir = path.join(__dirname, 'public/', dir);
  return findFileWithExtension(fullDir, baseName);
});

// Checking file accessibility for reading (whether it is locked by another process)
ipcMain.handle('check-file-access', async (event, filePath) => {
  try {
    const fd = fs.openSync(filePath, 'r');
    fs.closeSync(fd);
    return true;
  } catch (err) {
    return false;
  }
});