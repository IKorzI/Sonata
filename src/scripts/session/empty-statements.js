import { ipcMain } from 'electron';
import XlsxPopulate from 'xlsx-populate';
import { specNames } from '../utils.js';

// Функция для проверки, входит ли ячейка в объединенный диапазон
function getMergeRangeForCell(sheet, cell) {
  const merges = sheet._mergeCells; 
  
  if (!merges) return null;

  const cellRow = cell.rowNumber();
  const cellCol = cell.columnNumber();

  // Перебираем ключи (адреса диапазонов, например "A1:B2")
  for (const address in merges) {
    // ИСПРАВЛЕНИЕ: Создаем официальный объект Range из адреса
    const range = sheet.range(address);

    // Теперь методы .startCell() и .endCell() гарантированно существуют
    const startRow = range.startCell().rowNumber();
    const startCol = range.startCell().columnNumber();
    const endRow = range.endCell().rowNumber();
    const endCol = range.endCell().columnNumber();

    // Проверяем, попадает ли наша ячейка в координаты диапазона
    if (cellRow >= startRow && cellRow <= endRow &&
      cellCol >= startCol && cellCol <= endCol) {
      
      return range; // Возвращаем найденный диапазон
    }
  }
  
  return null; // Ячейка не объединена
}

async function getInfoContingent(filePath) {
  // --- Загрузка книги ---
  const workbook = await XlsxPopulate.fromFileAsync(filePath);
  // Получаем список названий листов кроме "Приклад" и "Зведена"
  const sheetNames = workbook.sheets().map(s => s.name());
  const filteredSheetNames = sheetNames.filter(name => name !== 'Приклад' && name !== 'Зведена');

  const groups = {};

  filteredSheetNames.forEach(sheetName => {
    const sheet = workbook.sheet(sheetName);
    groups[sheetName] = {
      'kuratorNom': '',
      'subgroups': [],
      'students': []
    };

    let row = 9;
    let newSpec = false;
    let step = -1;
    let specCode = '';

    while (true) {
      const cell4 = sheet.cell(row, 4); // Колонка D
      const cell5 = sheet.cell(row, 5); // Колонка E

      // Проверка на объединенную ячейку
      const mergedRange = getMergeRangeForCell(sheet, cell4);

      if (mergedRange) {
        newSpec = true;
        step++;
        specCode = sheet.cell(row, 3).value(); 
        row++;
        continue;
      }

      const cell4Val = cell4.value();
      const cell5Val = cell5.value();

      // Проверка на конец списка
      if (cell4Val === undefined || cell4Val === null) {
        break;
      }

      if (newSpec) {
        newSpec = false;
        groups[sheetName].subgroups.push({
          'specialityCode': specCode,
          'specialityName': (typeof specNames !== 'undefined' ? specNames[specCode] : specCode),
          'studentIDs': []
        });
      }

      // --- ИЗМЕНЕНИЯ НАЧИНАЮТСЯ ЗДЕСЬ ---

      // 1. Создаем объект студента
      const studentObj = { 'studentName': cell4Val, 'bc': cell5Val };

      // 2. Добавляем объект во временный список внутри специальности
      if (groups[sheetName].subgroups[step]) {
        groups[sheetName].subgroups[step].studentIDs.push(studentObj);
      }

      // 3. Добавляем ТОТ ЖЕ объект в общий список
      groups[sheetName].students.push(studentObj);

      row++;
      // Важно: используем break вместо return, чтобы код дошел до сортировки внизу
      if (row >= 200) break; 
    }

    // Получаем куратора
    const kuratorCellText = sheet.cell(row + 1, 4).value();
    
    if (kuratorCellText && typeof kuratorCellText === 'string') {
      const parts = kuratorCellText.split('керівник ');
      if (parts.length > 1) {
        groups[sheetName].kuratorNom = parts[1];
      }
    }

    // --- ПОСТ-ОБРАБОТКА И ИНДЕКСАЦИЯ ---

    // 1. Сортируем общий список объектов по имени
    groups[sheetName].students.sort((a, b) => a.studentName.localeCompare(b.studentName, 'uk'));

    // 2. Создаем Map для быстрого поиска индекса по ссылке на объект
    // Так как мы пушили один и тот же объект в оба списка, ссылки будут идентичны
    const studentIndexMap = new Map();
    groups[sheetName].students.forEach((student, index) => {
      studentIndexMap.set(student, index);
    });

    // 3. Заменяем объекты внутри subgroups на индексы из отсортированного общего списка
    groups[sheetName].subgroups.forEach(spec => {
      // map вернет новый массив, состоящий только из индексов
      spec.studentIDs = spec.studentIDs.map(studentObj => studentIndexMap.get(studentObj));
    });
  });

  const currentDate = new Date();
  const yearNumber = currentDate.getFullYear();
  const monthNumber = currentDate.getMonth();
  const semesterNumber = monthNumber > 7 ? 1 : 2;
  const semesterRoman = semesterNumber === 1 ? 'I' : 'II';
  const years = semesterNumber === 1 ? `${yearNumber}-${yearNumber + 1}` : `${yearNumber - 1}-${yearNumber}`;
  const year = `${yearNumber}`;

  return {
    'groups': groups,
    'semesterNumber': semesterNumber,
    'semesterRoman': semesterRoman,
    'years': years,
    'year': year
  };
}

async function getInfoHours(filePath) {
  // --- Загрузка книги ---
  const workbook = await XlsxPopulate.fromFileAsync(filePath);
  // Получаем список названий листов кроме "Приклад" и "Зведена"
  const sheetNames = workbook.sheets().map(s => s.name());
  const filteredSheetNames = sheetNames.filter(name => name !== 'Приклад' && name !== 'Зведена');

  const groups = {};

  filteredSheetNames.forEach(sheetName => {
    const sheet = workbook.sheet(sheetName);
    groups[sheetName] = { 'subjects': [] };
    
    let row = 12;
    
    while (true) {
      // Получаем значения ячеек (колонки D=4, E=5)
      const cell4Val = sheet.cell(row, 4).value();
      const cell5Val = sheet.cell(row, 5).value();

      // Если значение undefined или null - выходим
      if (cell5Val === undefined || cell5Val === null) {
        break;
      }

      groups[sheetName].subjects.push({
        'subjectName': cell4Val,
        'teacherName': cell5Val
      });

      row++;
      if (row >= 50) return;
    }
  });

  return groups;
}

async function getInfo(filePath, type) {
  if (type === 'contingent') {
    return await getInfoContingent(filePath);
  } else {
    return await getInfoHours(filePath);
  }
}

function dataSupplement(data) {
  // 1 та 2 крок: Перебираємо об'єкт groups, додаємо hoursData, groupCode і формуємо масив
  const transformedGroups = Object.entries(data.contingentData.groups).map(([groupCode, groupInfo]) => {
    // Отримуємо дані з hoursData для поточної групи (якщо вони існують)
    const hoursInfo = data.hoursData[groupCode] || {};
    
    return {
      groupCode: groupCode, // Додаємо назву ключа як окреме поле
      ...groupInfo,         // Розгортаємо існуючі дані групи (kuratorNom, subgroups, students)
      ...hoursInfo          // Додаємо інформацію з hoursData (subjects)
    };
  });

  // 3 крок: Видаляємо hoursData та contingentData, виносимо все на верхній рівень
  // Використовуємо деструктуризацію для відокремлення непотрібних полів
  const { hoursData, contingentData, ...rootLevelData } = data;
  const { groups, ...contingentLevelData } = contingentData;

  // Збираємо фінальний об'єкт
  const result = {
    ...rootLevelData,         // id, filePath, percentage
    ...contingentLevelData,   // semesterNumber, semesterRoman, years, year
    groups: transformedGroups // Оновлений масив груп
  };

  return result;
}

ipcMain.handle('sessionEmptyGetInformation', async (event, path, type) => {
  try {
    return await getInfo(path, type);
  } catch (error) {
    console.error(error.message);
    return false;
  }
});
ipcMain.handle('sessionEmptyDataSupplement', async (event, data) => {
  return dataSupplement(data);
});