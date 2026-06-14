import { ipcMain, dialog } from "electron";
import { fileURLToPath } from "url";
import path from "path";
import { spawn } from "child_process";
import fs from "fs";
import readline from "readline";
import { lng } from "./language.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const up2 = path.resolve(__dirname, "../../");

export const monthNames = {
  січень: 1,
  січня: 1,
  1: "січень",
  лютий: 2,
  лютого: 2,
  2: "лютий",
  березень: 3,
  березня: 3,
  3: "березень",
  квітень: 4,
  квітня: 4,
  4: "квітень",
  травень: 5,
  травня: 5,
  5: "травень",
  червень: 6,
  червня: 6,
  6: "червень",
  липень: 7,
  липня: 7,
  7: "липень",
  серпень: 8,
  серпня: 8,
  8: "серпень",
  вересень: 9,
  вересня: 9,
  9: "вересень",
  жовтень: 10,
  жовтня: 10,
  10: "жовтень",
  листопад: 11,
  листопада: 11,
  11: "листопад",
  грудень: 12,
  грудня: 12,
  12: "грудень",
};

export const specNames = {
  D5: "«Маркетинг»",
  D7: "«Торгівля»",
  E2: "«Екологія»",
  G1: "«Хімічні технології та інженерія»",
  G3: "«Електрична інженерія»",
  G5: "«Електроніка, електронні комунікації, приладобудування та радіотехніка»",
  G7: "«Автоматизація, комп'ютерно-інтегровані технології та робототехніка»",
  G13: "«Харчові технології»",
  G16: "«Гірництво та нафтогазові технології»",
  J2: "«Готельно-ресторанна справа та кейтеринг»",
  J3: "«Туризм та рекреація»",
};

/**
 * Returns the coordinates of the first cell containing the specified value (for xlsx-populate).
 * @param {Object} sheet - The xlsx-populate sheet object.
 * @param {string|number|boolean|Date} searchValue - The value to search for.
 * @param {string} direction - The search direction: 'up', 'down', 'left', 'right'.
 * @param {string | {row: number, column: number}} startAddress - The address of the starting cell (e.g., "A1" or {row: 1, column: 1}).
 * @returns {{row: number, column: number}|null} An object with coordinates (starting from 1) or null.
 */
export function findCell(sheet, searchValue, direction, startAddress) {
  const usedRange = sheet.usedRange();
  if (!usedRange) return null;

  const endRow = usedRange.endCell().rowNumber();
  const endColumn = usedRange.endCell().columnNumber();
  const minRow = usedRange.startCell().rowNumber();
  const minColumn = usedRange.startCell().columnNumber();

  let startR, startC;

  if (typeof startAddress === "string") {
    const cell = sheet.cell(startAddress);
    startR = cell.rowNumber();
    startC = cell.columnNumber();
  } else if (typeof startAddress === "object") {
    if ("r" in startAddress && "c" in startAddress) {
      startR = startAddress.r + 1;
      startC = startAddress.c + 1;
    } else {
      startR = startAddress.row || 1;
      startC = startAddress.column || 1;
    }
  }

  const dir = direction.toLowerCase();

  if (dir === "down") {
    for (let r = startR; r <= endRow; r++) {
      const val = sheet.cell(r, startC).value();
      if (val === searchValue) {
        return { row: r, column: startC };
      } else if (searchValue === true && val !== undefined) {
        return { row: r, column: startC };
      }
    }
  } else if (dir === "up") {
    for (let r = startR; r >= Math.max(minRow, 1); r--) {
      const val = sheet.cell(r, startC).value();
      if (val === searchValue) {
        return { row: r, column: startC };
      } else if (searchValue === true && val !== undefined) {
        return { row: r, column: startC };
      }
    }
  } else if (dir === "right") {
    for (let c = startC; c <= endColumn; c++) {
      const val = sheet.cell(startR, c).value();
      if (val === searchValue) {
        return { row: startR, column: c };
      } else if (searchValue === true && val !== undefined) {
        return { row: startR, column: c };
      }
    }
  } else if (dir === "left") {
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

const isDev = process.env.NODE_ENV?.trim() === "development";

const pythonBasePath = isDev
  ? path.join(process.cwd(), "src", "scripts", "python")
  : path.join(process.resourcesPath, "python-backend");

const pathStart = path.join(pythonBasePath, "start.exe");

let pyProcess = null;
let requestCounter = 0;
const pendingRequests = new Map();

/**
 * Initializes the child process of the Python server and sets up response handling.
 */
export function initPythonServer() {
  if (pyProcess) return;

  pyProcess = spawn(pathStart, [up2], { cwd: pythonBasePath });

  const rl = readline.createInterface({
    input: pyProcess.stdout,
    terminal: false,
  });

  rl.on("line", (line) => {
    try {
      const rawResponse = JSON.parse(line);

      const response = camelizeKeys(rawResponse);

      const { reqId } = response;

      if (pendingRequests.has(reqId)) {
        const { resolve, reject } = pendingRequests.get(reqId);

        if (response.error) {
          reject(new Error(`Python Error: ${response.error}`));
        } else {
          resolve(response.result);
        }

        pendingRequests.delete(reqId);
      } else {
        console.warn(
          "Response received for unknown reqId:",
          reqId,
          "\n",
          response,
        );
      }
    } catch (e) {
      console.error("Failed to parse Python response:", line);
    }
  });

  pyProcess.stderr.on("data", (data) => {
    console.error("Python Stderr:", data.toString());
  });

  pyProcess.on("close", (code) => {
    console.log(`Python server (.exe) exited with code ${code}`);
    pyProcess = null;

    for (const [id, { reject }] of pendingRequests) {
      reject(new Error("Python server closed unexpectedly"));
    }
    pendingRequests.clear();
  });
}
initPythonServer();

/**
 * Converts a string from snake_case format to camelCase.
 * @param {string} str - The input string.
 * @returns {string} The string in camelCase format.
 */
function snakeToCamel(str) {
  return str.replace(/_([a-z0-9])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Recursively converts all keys of an object (or array) from snake_case to camelCase.
 * @param {any} data - The input data (object, array, or primitive).
 * @returns {any} Data with converted keys.
 */
function camelizeKeys(data) {
  if (Array.isArray(data)) {
    return data.map((item) => camelizeKeys(item));
  } else if (data !== null && typeof data === "object") {
    return Object.keys(data).reduce((result, key) => {
      const camelKey = snakeToCamel(key);
      result[camelKey] = camelizeKeys(data[key]);
      return result;
    }, {});
  }
  return data;
}

/**
 * Sends a request to the Python server and returns a promise with the result.
 * @param {Object} data - The data to send.
 * @returns {Promise<Object>} The response from the server.
 */
export async function startBackendFunc(data) {
  if (!pyProcess) {
    throw new Error(
      "Python server is not running. Call initPythonServer first.",
    );
  }

  return new Promise((resolve, reject) => {
    const reqId = ++requestCounter;

    const customResolve = (responseData) => {
      const camelizedData = camelizeKeys(responseData);
      resolve(camelizedData);
    };

    pendingRequests.set(reqId, { resolve: customResolve, reject });

    const payloadObj = {
      reqId: reqId,
      data: data,
    };

    const payload = JSON.stringify(payloadObj) + "\n";

    try {
      pyProcess.stdin.write(payload);
    } catch (err) {
      pendingRequests.delete(reqId);
      reject(new Error(`Failed to write to stdin: ${err.message}`));
    }
  });
}

/**
 * Searches for a file by its base name in the specified directory, ignoring .png files.
 * @param {string} dir - The relative directory to search in.
 * @param {string} baseName - The base name of the file without the extension.
 * @returns {{extension: string, fullPath: string}|null} An object with the extension and full path, or null.
 */
function findFileWithExtension(dir, baseName) {
  const fullDir = path.join(up2, "public/", dir);

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

/**
 * Opens a system dialog window to save a file.
 * @param {string} fileName - The default file name.
 * @param {string} extension - The allowed file extension.
 * @returns {Promise<string|null>} The path to the saved file or null if canceled.
 */
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

ipcMain.handle("findFileWithExtension", async (event, dir, baseName) => {
  return findFileWithExtension(dir, baseName);
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

ipcMain.handle("startBackendFunc", async (event, data) => {
  return startBackendFunc(data);
});
