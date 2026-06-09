import { ipcMain, dialog } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pathStart = path.resolve(__dirname, './python/start.exe')
const up2 = path.resolve(__dirname, '../../');

export const monthNames = {
    'січень': 1,        'січня': 1,         1: 'січень',
    'лютий': 2,         'лютого': 2,        2: 'лютий',
    'березень': 3,      'березня': 3,       3: 'березень',
    'квітень': 4,       'квітня': 4,        4: 'квітень',
    'травень': 5,       'травня': 5,        5: 'травень',
    'червень': 6,       'червня': 6,        6: 'червень',
    'липень': 7,        'липня': 7,         7: 'липень',
    'серпень': 8,       'серпня': 8,        8: 'серпень',
    'вересень': 9,      'вересня': 9,       9: 'вересень',
    'жовтень': 10,      'жовтня': 10,       10: 'жовтень',
    'листопад': 11,     'листопада': 11,    11: 'листопад',
    'грудень': 12,      'грудня': 12,       12: 'грудень'
};

export const specNames = {
  'D5':  '«Маркетинг»',
  'D7':  '«Торгівля»',
  'E2':  '«Екологія»',
  'G1':  '«Хімічні технології та інженерія»',
  'G3':  '«Електрична інженерія»',
  'G5':  '«Електроніка, електронні комунікації, приладобудування та радіотехніка»',
  'G7':  "«Автоматизація, комп'ютерно-інтегровані технології та робототехніка»",
  'G13': '«Харчові технології»',
  'G16': '«Гірництво та нафтогазові технології»',
  'J2':  '«Готельно-ресторанна справа та кейтеринг»',
  'J3':  '«Туризм та рекреація»'
}

/**
 * Возвращает координаты первой ячейки, содержащей указанное значение (для xlsx-populate).
 * @param {Object} sheet - Объект листа xlsx-populate.
 * @param {string|number|boolean|Date} searchValue - Значение для поиска.
 * @param {string} direction - Направление поиска: 'up', 'down', 'left', 'right'.
 * @param {string | {row: number, column: number}} startAddress - Адрес начальной ячейки (например, "A1" или {row: 1, column: 1}).
 * @returns {{row: number, column: number}|null} Объект с координатами (1-based) или null.
 */
export function findCell(sheet, searchValue, direction, startAddress) {
    // 1. Получаем используемый диапазон (чтобы знать границы поиска)
    const usedRange = sheet.usedRange();
    if (!usedRange) return null; // Лист пустой

    const endRow = usedRange.endCell().rowNumber();
    const endColumn = usedRange.endCell().columnNumber();
    // Начало используемого диапазона (обычно 1, 1, но может быть смещено)
    const minRow = usedRange.startCell().rowNumber();
    const minColumn = usedRange.startCell().columnNumber();

    // 2. Нормализуем стартовую позицию в координаты {row, column} (1-based)
    let startR, startC;

    if (typeof startAddress === 'string') {
        // xlsx-populate умеет получать ячейку по адресу, достаем из неё координаты
        const cell = sheet.cell(startAddress);
        startR = cell.rowNumber();
        startC = cell.columnNumber();
    } else if (typeof startAddress === 'object') {
        // Поддержка и {row, column} (1-based), и {r, c} (0-based - на всякий случай, если прилетит из старого кода)
        if ('r' in startAddress && 'c' in startAddress) {
            startR = startAddress.r + 1;
            startC = startAddress.c + 1;
        } else {
            startR = startAddress.row || 1;
            startC = startAddress.column || 1;
        }
    }

    const dir = direction.toLowerCase();

    // 3. Логика поиска
    // ВАЖНО: xlsx-populate использует (row, column) начиная с 1.
    if (dir === 'down') {
        // Ищем от стартовой строки до конца используемого диапазона
        // Если startR уже ниже endRow, цикл не запустится (корректно)
        for (let r = startR; r <= endRow; r++) {
            const val = sheet.cell(r, startC).value();
            if (val === searchValue) {
                return { row: r, column: startC };
            } else if (searchValue === true && val !== undefined) {
                return { row: r, column: startC };
            }
        }
    } 
    else if (dir === 'up') {
        // Ищем от стартовой строки вверх до минимальной используемой (или до 1)
        // Math.max(minRow, 1) гарантирует, что мы не уйдем в 0 или минус
        for (let r = startR; r >= Math.max(minRow, 1); r--) {
            const val = sheet.cell(r, startC).value();
            if (val === searchValue) {
                return { row: r, column: startC };
            } else if (searchValue === true && val !== undefined) {
                return { row: r, column: startC };
            }
        }
    } 
    else if (dir === 'right') {
        // Ищем вправо до конца диапазона
        for (let c = startC; c <= endColumn; c++) {
            const val = sheet.cell(startR, c).value();
            if (val === searchValue) {
                return { row: startR, column: c };
            } else if (searchValue === true && val !== undefined) {
                return { row: startR, column: c };
            }
        }
    } 
    else if (dir === 'left') {
        // Ищем влево до начала диапазона
        for (let c = startC; c >= Math.max(minColumn, 1); c--) {
            const val = sheet.cell(startR, c).value();
            if (val === searchValue) {
                return { row: startR, column: c };
            } else if (searchValue === true && val !== undefined) {
                return { row: startR, column: c };
            }
        }
    }

    return null;
}

let pyProcess = null;
let requestCounter = 0; // Счётчик для генерации уникальных ID
const pendingRequests = new Map(); // Хранилище ожидающих Promise

export function initPythonServer() {
    if (pyProcess) return; 

    // Запускаем твой скомпилированный .exe файл напрямую
    pyProcess = spawn(pathStart, [up2], { cwd: './' });

    // Настраиваем построчное чтение из stdout
    const rl = readline.createInterface({
        input: pyProcess.stdout,
        terminal: false
    });

    rl.on('line', (line) => {
        try {
            // 1. Парсим сырую строку от Python
            const rawResponse = JSON.parse(line);
            
            // 2. Сразу переводим ВСЕ ключи объекта в camelCase
            const response = camelizeKeys(rawResponse);

            // 3. Теперь здесь гарантированно будет reqId, а не req_id!
            const { reqId } = response;

            if (pendingRequests.has(reqId)) {
                const { resolve, reject } = pendingRequests.get(reqId);
                
                if (response.error) {
                    reject(new Error(`Python Error: ${response.error}`));
                } else {
                    // response.success тоже уже прошел через camelizeKeys,
                    // так что все вложенные данные будут в camelCase
                    resolve(response.result);
                }
                
                pendingRequests.delete(reqId);
            } else {
                // Добавим лог для отладки, если вдруг ID не совпал
                console.warn('Получен ответ для неизвестного reqId:', reqId, '\n',response);
            }
        } catch (e) {
            console.error('Failed to parse Python response:', line);
        }
    });

    pyProcess.stderr.on('data', (data) => {
        console.error('Python Stderr:', data.toString());
    });

    pyProcess.on('close', (code) => {
        console.log(`Python server (.exe) exited with code ${code}`);
        pyProcess = null;
        
        for (const [id, { reject }] of pendingRequests) {
            reject(new Error('Python server closed unexpectedly'));
        }
        pendingRequests.clear();
    });
}
initPythonServer()

/**
 * Переводит строку из snake_case в camelCase
 */
function snakeToCamel(str) {
    return str.replace(/_([a-z0-9])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Рекурсивно переводит все ключи объекта/массива в camelCase
 */
function camelizeKeys(data) {
    if (Array.isArray(data)) {
        return data.map(item => camelizeKeys(item));
    } else if (data !== null && typeof data === 'object') {
        return Object.keys(data).reduce((result, key) => {
            const camelKey = snakeToCamel(key);
            result[camelKey] = camelizeKeys(data[key]);
            return result;
        }, {});
    }
    // Если это примитив (строка, число, boolean, null), возвращаем как есть
    return data;
}

export async function startBackendFunc(data) {
    if (!pyProcess) {
        throw new Error('Python server is not running. Call initPythonServer first.');
    }
    
    return new Promise((resolve, reject) => {
        // Генерируем уникальный ID
        const reqId = ++requestCounter;

        // ИЗМЕНЕНИЕ ЗДЕСЬ: Создаем кастомный resolve, который сначала
        // переведет ответ из snake_case в camelCase, а потом отдаст наружу.
        const customResolve = (responseData) => {
            const camelizedData = camelizeKeys(responseData);
            resolve(camelizedData);
        };

        // Сохраняем функции resolve/reject (передаем наш customResolve)
        pendingRequests.set(reqId, { resolve: customResolve, reject });

        // Оборачиваем запрос в конверт!
        // Оригинальный data остается нетронутым.
        const payloadObj = {
            reqId: reqId,
            data: data
        };

        // Отправляем конверт в Python
        const payload = JSON.stringify(payloadObj) + '\n';
        
        try {
            pyProcess.stdin.write(payload);
        } catch (err) {
            pendingRequests.delete(reqId);
            reject(new Error(`Failed to write to stdin: ${err.message}`));
        }
    });
}

function findFileWithExtension(dir, baseName) {
  const fullDir = path.join(up2, 'public/', dir);

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

ipcMain.handle('findFileWithExtension', async (event, dir, baseName) => {
  return findFileWithExtension(dir, baseName);
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

ipcMain.handle('startBackendFunc', async (event, data) => {
  return startBackendFunc(data);
});