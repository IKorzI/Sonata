import { ipcMain } from "electron";
import XlsxPopulate from "xlsx-populate";
import { findCell } from "../utils.js";

const monthNames = {
    "січень": 1,        "січня": 1,         1: "січень",
    "лютий": 2,         "лютого": 2,        2: "лютий",
    "березень": 3,      "березня": 3,       3: "березень",
    "квітень": 4,       "квітня": 4,        4: "квітень",
    "травень": 5,       "травня": 5,        5: "травень",
    "червень": 6,       "червня": 6,        6: "червень",
    "липень": 7,        "липня": 7,         7: "липень",
    "серпень": 8,       "серпня": 8,        8: "серпень",
    "вересень": 9,      "вересня": 9,       9: "вересень",
    "жовтень": 10,      "жовтня": 10,       10: "жовтень",
    "листопад": 11,     "листопада": 11,    11: "листопад",
    "грудень": 12,      "грудня": 12,       12: "грудень"
};

async function getInfo(filePath) {
  let findedCell;

  // === Загрузка книги ===
  const workbook = await XlsxPopulate.fromFileAsync(filePath);

  // Список листов без "Приклад"
  const sheetNames = workbook.sheets().map(s => s.name());
  const filteredSheetNames = sheetNames.filter(name => name !== "Приклад");
  
  // --- Получение одинаковых данных во всех листах ---
  const sheet = workbook.sheet(filteredSheetNames[0]);
  let cell = sheet.cell(7, 3).value();
  let parts = cell.split(" ");
  const month = monthNames[parts[1]];
  const year = parseInt(parts[2], 10);

  findedCell = findCell(sheet, undefined, "down", {row: 12, column: 5});
  const endRow = findedCell.row - 1;

  findedCell = findCell(sheet, "Примітка", "right", {row: 10, column: 5});
  const endCol = findedCell.column - 2;

  const startDay = sheet.cell(11, 6).value();
  const endDay = sheet.cell(11, endCol).value();
  const date = new Date(year, month - 1, startDay);
  let dayOfWeek = date.getDay();
  dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const days = {
    "startDay": startDay,
    "endDay": endDay,
    "startWeekday": dayOfWeek
  };

  // --- Чтение часов по группам ---
  const groups = []; // Теперь это массив
  for (const sheetName of filteredSheetNames) {
    const sheet = workbook.sheet(sheetName);

    const cellC8 = sheet.cell(8, 3).value();

    const subjects = [];
    for (let row = 12; row <= endRow; row++) {
      const subjectName = sheet.cell(row, 4).value(); // D
      const teacherName = sheet.cell(row, 5).value(); // E
      const values = []
      for (let col = 6; col <= endCol; col++) {
        values.push(sheet.cell(row, col).value() ?? null);
      }
      subjects.push({ subjectName, teacherName, values });
    }
    
    // Сразу формируем нужную структуру элемента массива
    groups.push({groupName: sheetName, cellC8, subjects });
  }

  return {
    groups,
    month,
    year,
    days
  };
}

function dataSupplement(info) {
  const groupsArray = info.groups; // Теперь изначально получаем массив
  const teachersMap = {};

  // 1. Собираем данные по учителям
  for (const group of groupsArray) {
    const groupName = group.groupName;
    const groupSubjects = group.subjects;
    
    // Пропускаем, если нет данных по предметам
    if (!groupSubjects || groupSubjects.length === 0) continue; 

    const firstSubject = groupSubjects[0];
    const column = 5 + firstSubject.values.length + 1;
    
    let step = 1;
    for (const subject of groupSubjects) {
      const teacherName = subject.teacherName;
      
      if (!teachersMap[teacherName]) {
        teachersMap[teacherName] = [];
      }

      // Добавляем запись для каждого вхождения (предмета) у этого учителя
      teachersMap[teacherName].push({
        groupName: groupName,
        row: 11 + step,
        column: column
      });
      
      step += 1;
    }
  }

  // 2. Преобразуем объект в требуемый массив teachersList
  const teachersList = Object.keys(teachersMap).map(teacherName => {
    return {
      teacherName: teacherName,
      groups: teachersMap[teacherName]
    };
  });

  // 3. Сортируем список учителей по украинскому алфавиту
  teachersList.sort((a, b) => {
    return a.teacherName.localeCompare(b.teacherName, 'uk');
  });

  info.teachersList = teachersList;
  // Шаг с преобразованием groups из объекта в массив удален, так как он выполняется в getInfo

  return info;
}

ipcMain.handle('hoursSummaryGetInformation', async (event, path) => {
  return getInfo(path);
});
ipcMain.handle('hoursSummaryDataSupplement', async (event, info) => {
  return dataSupplement(info);
});