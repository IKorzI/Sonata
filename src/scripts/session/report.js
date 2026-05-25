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
  let amount = 0;
  let budget = 0;
  let kontrakt = 0;
  let socialScholarship = 0;
  let scholarship = 0;
  const achievement = {"hight": 0, "sufficient": 0, "middle": 0, "low": 0};
  let avgGrades = [];
  let specialityCodes = [];
  filteredSheetNames.forEach(sheetName => {
    const sheet = workbook.sheet(sheetName);
    // строка последнего студента
    findedCell = findCell(sheet, undefined, "down", {row: 10, column: 4});
    const endRow = findedCell.row - 1;
    // столбец среднего балла
    findedCell = findCell(sheet, "Середній бал", "right", {row: 8, column: 5});
    const endCol = findedCell.column;
    
    amount += endRow - 9;
    budget += getNumericValue(sheet.cell(endRow + 6, 6).value());
    kontrakt += getNumericValue(sheet.cell(endRow + 7, 6).value());
    socialScholarship += getNumericValue(sheet.cell(endRow + 8, 6).value());
    scholarship += getNumericValue(sheet.cell(endRow + 9, 6).value());

    // Код специальности
    const specialityCode = sheet.cell(5, 3).value().split(" ")[3];
    specialityCodes.push(specialityCode);

    for (let row = 10; row <= endRow; row++) {
      const value = getNumericValue(sheet.cell(row, endCol).value());
      if (!value) continue;
      avgGrades.push(value);
      if (10 <= value && value <= 12) {
        achievement.hight++;
      } else if (7 <= value && value < 10) {
        achievement.sufficient++;
      } else if (5 <= value && value < 7) {
        achievement.middle++;
      } else if (1 <= value && value < 5) {
        achievement.low++;
      }
    }
    
  });
  const avgGrade = avgGrades.length > 0 
  ? Math.round((avgGrades.reduce((sum, current) => sum + current, 0) / avgGrades.length) * 100) / 100 
  : 0;

  const answer = {
    "groupCode": groupCode,
    "specialityCodes": specialityCodes,
    "amount": amount,
    "budget": budget,
    "kontrakt": kontrakt,
    "socialScholarship": socialScholarship,
    "scholarship": scholarship,
    "achievement": achievement,
    "avgGrade": avgGrade
  }

  return answer;
}

function dataSupplement(data) {
  data.groups.forEach(group => {
    delete group.filePath;
  });
  return data
}

ipcMain.handle('sessionReportGetInformation', async (event, path, type) => {
  return getInfo(path, type);
});
ipcMain.handle('sessionReportDataSupplement', async (event, data) => {
  return dataSupplement(data);
});