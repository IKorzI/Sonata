import { ipcMain } from "electron";
import XlsxPopulate from 'xlsx-populate';
import { findCell } from "../utils.js";

// Проверка, число ли значение
function getNumericValue(val) {
  // Если это число или число в виде строки
  const num = Number(val);
  if (!isNaN(num) && typeof val !== 'boolean') {
    return num;
  }

  // Если записан текст, который нельзя перевести в число
  return 0;
}

/**
 * Форматирует ФИО в "Фамилия И.О."
 * Если ФИО содержит дефисы или не соответствует формату из 3-х слов — возвращает оригинал.
 */
function formatFio(fullName) {
  // Убираем лишние пробелы и разбиваем на массив
  const parts = fullName.trim().split(/\s+/);

  // Регулярное выражение \p{L} проверяет, является ли символ буквой в любом алфавите
  // Флаг 'u' обязателен для поддержки Unicode (кириллицы)
  const isOnlyLetters = (str) => /^\p{L}+$/u.test(str);

  // Проверка: ровно 3 слова и каждое состоит только из букв
  if (parts.length === 3 && parts.every(isOnlyLetters)) {
    const [lastName, firstName, middleName] = parts;
    
    const firstInitial = firstName[0].toUpperCase();
    const middleInitial = middleName[0].toUpperCase();
    
    return `${lastName} ${firstInitial}.${middleInitial}.`;
  }

  // Если не стандарт (дефис, 2 слова, цифры и т.д.)
  return fullName;
}

async function getInfo(filePath, type) {
  let findedCell;
  
  // --- Загрузка книги ---
  const workbook = await XlsxPopulate.fromFileAsync(filePath);
  // Получаем список названий листов начинающиеся на "Зведена"
  const sheetNames = workbook.sheets().map(s => s.name());
  const filteredSheetNames = sheetNames.filter(name => name.startsWith('Зведена'));

  // --- Получение одинаковых данных во всех листах ---
  const sheet = workbook.sheet(filteredSheetNames[0]);
  // Группа
  const groupCode = sheet.cell(7, 3).value().split(" ")[1];

  // Итерируем по отфильтрованным листам
  let students = [];
  let specialityCodes = [];
  filteredSheetNames.forEach(sheetName => {
    const sheet = workbook.sheet(sheetName);
    // Код специальности
    const specialityCode = sheet.cell(5, 3).value().split(" ")[3];
    specialityCodes.push(specialityCode);

    // строка последнего студента
    findedCell = findCell(sheet, undefined, "down", {row: 10, column: 4});
    const endRow = findedCell.row - 1;
    // столбец среднего балла
    findedCell = findCell(sheet, "Середній бал", "right", {row: 8, column: 5});
    const endCol = findedCell.column;
    
    let step = -1;
    for (let row = 10; row <= endRow; row++) {
      let newStudent = true;
      for (let col = 6; col <= endCol - 1; col++) {
        const value = getNumericValue(sheet.cell(row, col).value());
        if (!value || value < 4) {
          if (newStudent) {
            newStudent = false;
            step += 1;
            const studentShortName = formatFio(sheet.cell(row, 5).value())
            students[step] = {
              "studentName": studentShortName,
              "bc": sheet.cell(row, 3).value(),
              "grades": []
            };
          }
          const text = sheet.cell(9, col).value();
          const lines = text.split(/\r?\n/);
          const grade = !value ? "н/а" : value;
          const element = {
            "subjectName": lines[0],
            "teacherName": lines[1],
            "grade": grade
          }
          students[step].grades.push(element);
        }
      }
    }
    
  });

  const answer = {
    "groupCode": groupCode,
    "students": students,
    "specialityCodes": specialityCodes
  }

  return answer;
}

function dataSupplement(data) {
  data.groups.forEach(group => {
    delete group.filePath;
  });
  return data
}

ipcMain.handle('sessionDebtorsGetInformation', async (event, path, type) => {
  return getInfo(path, type);
});
ipcMain.handle('sessionDebtorsDataSupplement', async (event, data) => {
  return dataSupplement(data);
});