import { ipcMain, dialog } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.join(path.dirname(__filename), '../..');
console.log(__dirname)

export function findFileWithExtension(dir, baseName) {
  const fullDir = path.resolve(dir); // абсолютный путь

  const files = fs.readdirSync(fullDir);

  // Фильтруем все файлы, которые начинаются с baseName + '.' и не являются .png
  const found = files.find(file => {
    if (!file.startsWith(baseName + '.')) return false;
    const ext = path.extname(file).toLowerCase();
    return ext !== '.png'; // пропускаем .png
  });

  if (!found) return null;

  const extension = path.extname(found);
  const fullPath = path.join(fullDir, found);

  return { extension, fullPath };
}

async function saveDialog(fileName, extension) {
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: 'Сохранить файл как',
    defaultPath: `${fileName}${extension}`,
    filters: [{ name: 'Файлы', extensions: [extension.replace('.', '')] }],
  });

  if (canceled || !filePath) return null;
  return filePath;
}

ipcMain.handle('save-dialog', async (event, fileName, extension) => {
  return saveDialog(fileName, extension);
});

ipcMain.handle('save-file', async (event, sourcePath, targetPath) => {
  try {
    fs.copyFileSync(sourcePath, targetPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('find-file', async (event, dir, baseName) => {
  const fullDir = path.join(__dirname, 'public/', dir);
  return findFileWithExtension(fullDir, baseName);
});

ipcMain.handle('check-file-access', async (event, filePath) => {
  try {
    // Пробуем открыть файл на чтение и запись
    const fd = fs.openSync(filePath, 'r');
    fs.closeSync(fd);
    return true; // файл доступен
  } catch (err) {
    return false; // файл недоступен
  }
});