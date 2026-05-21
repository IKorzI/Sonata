import { ipcMain } from "electron";
import XlsxPopulate from "xlsx-populate";
import { findCell } from "../utils.js";

async function getInfo(filePath) {
  let findedCell;
  let match;

  // --- Загрузка книги ---
  const workbook = await XlsxPopulate.fromFileAsync(filePath);
  // Получаем список названий листов начинающиеся на "Зведена"
  const sheetNames = workbook.sheets().map(s => s.name());
  const filteredSheetNames = sheetNames.filter(name => name.startsWith('Зведена'));

  // --- Получение одинаковых данных во всех листах ---
  const sheet = workbook.sheet(filteredSheetNames[0]);
  // Номер семестра, слово семестра и год
  const semesterCellV = sheet.cell(6, 3).value();
  match = semesterCellV.match(/За\s+([IІ]+)/i);
  const semesterNumberRoman = match[1].toUpperCase().replace('І', 'I');
  const semesterNumber = semesterNumberRoman === 'I' ? 1 : 2;
  const semesterNumberWord = semesterNumber === 1 ? `першого` : `другого`
  match = semesterCellV.match(/семестр\s+(\d{4})/i);
  const yearNumber = parseInt(match[1], 10); // число 2025
  // Даты начала и конца семестра, года учебного года
  const semesterStart = semesterNumber === 1 ? `01.01.${yearNumber + 1}`: `01.09.${yearNumber}`;
  const semesterEnd = semesterNumber === 1 ? `30.06.${yearNumber + 1}` : `31.12.${yearNumber}`;
  const years = semesterNumber === 1 ? `${yearNumber}-${yearNumber + 1}` : `${yearNumber - 1}-${yearNumber}`
  // Средний бал и предметы
  findedCell = findCell(sheet, "Середній бал", "right", {row: 8, column: 5});
  const avgGradeColumn = findedCell.column;
  const subjects = [];
  for (let col = 6; col <= avgGradeColumn - 1; col++) {
    const text = sheet.cell(9, col).value();
    const lines = text.split(/\r?\n/);
    subjects.push({
      "subjectName": lines[0],
      "teacherName": lines[1]
    });
  }
  // Куратор и процент на стипендию
  const groupCode = sheet.cell(7, 3).value().split(" ")[1];
  // строка под последним студентом
  findedCell = findCell(sheet, undefined, "down", {row: 10, column: 4});
  const percentageF = sheet.cell(findedCell.row + 8, 6).formula();
  match = percentageF.match(/ROUNDDOWN\([^*]+\*([0-9.]+),0\)/);
  const percentage = parseFloat(match[1]) * 100;
  // колонка "Класний керівник"
  findedCell = findCell(sheet, "Класний керівник", "right", {row: findedCell.row + 6, column: 7});
  // первая непустая ячейка справа от "Класний керівник"
  findedCell = findCell(sheet, true, "right", {row: findedCell.row, column: findedCell.column + 1});
  const kurator = sheet.cell(findedCell.row, findedCell.column).value();

  // Итерируем по отфильтрованным листам
  const subgroups = [];
  filteredSheetNames.forEach(sheetName => {
    const students = [];
    const sheet = workbook.sheet(sheetName);
    const cells = {
      C5: sheet.cell(5, 3).value(),
      C6: sheet.cell(6, 3).value(),
      C7: sheet.cell(7, 3).value()
    }

    match = sheet.cell(5, 3).value().match(/спеціальності\s+([A-Z]\d+)\s+(«[^»]+»)/i);
    const specialityCode = match[1];   // "G1"
    const specialityName = match[2];   // "«Хімічні технології та інженерія»"

    findedCell = findCell(sheet, undefined, "down", {row: 10, column: 4});
    const endRow = findedCell.row - 1;
    for (let row = 10; row <= endRow; row++) {
      const studentName = sheet.cell(row, 5).value();
      const bc = sheet.cell(row, 3).value();
      const grades = [];

      for (let col = 6; col <= avgGradeColumn - 1; col++) {
        grades.push(sheet.cell(row, col).value());
      }

      let avgGrade = sheet.cell(row, avgGradeColumn).value();
      if (avgGrade !== ' - ' && avgGrade !== '-') {
        avgGrade = parseFloat(Number(avgGrade).toFixed(2))
      }

      students.push({
        studentName: studentName,
        grades: grades,
        avgGrade: avgGrade,
        bc: bc,
        socialStatus: null,
        scholarship: false,
        increased: false
      });
    }

    const scholarshipNumber = sheet.cell(findedCell.row + 8, 6).value();

    subgroups.push({
      students: students,
      cells: cells,
      specialityCode: specialityCode,
      specialityName: specialityName,
      scholarshipNumber: scholarshipNumber
    });
  });

  return {
    groupCode: groupCode,
    subgroups: subgroups,
    kurator: kurator,
    years: years,
    semesterNumber: semesterNumberRoman,
    semesterNumberWord: semesterNumberWord,
    semesterStart: semesterStart,
    semesterEnd: semesterEnd,
    subjects: subjects,
    percentage: percentage
  };
}

function dataSupplement(info) {
  const subgroups = info.subgroups;
  
  // 1. Присвоение статусов по изначальным индексам (теперь используем specialityIndex)
  for (const item of (info.socialyList || [])) {
    const { specialityIndex, studentIndex, status } = item;
    if (subgroups[specialityIndex] && subgroups[specialityIndex].students[studentIndex]) {
      subgroups[specialityIndex].students[studentIndex].socialStatus = status;
    }
  }
  
  for (const item of (info.increasedList || [])) {
    const { specialityIndex, studentIndex } = item;
    if (subgroups[specialityIndex] && subgroups[specialityIndex].students[studentIndex]) {
      subgroups[specialityIndex].students[studentIndex].increased = true;
    }
  }

  // Вспомогательная функция
  const parseGrade = (grade) => {
    if (grade === "-" || grade === " - ") return -1;
    const parsed = parseFloat(String(grade).replace(',', '.'));
    return isNaN(parsed) ? -1 : parsed;
  };

  // Проходим по массиву специальностей
  for (let specIndex = 0; specIndex < subgroups.length; specIndex++) {
    const specialityData = subgroups[specIndex];
    const students = specialityData.students;

    // Инициализируем массивы списков внутри текущей специальности
    specialityData.socialScholarshipList = [];
    specialityData.increasedScholarshipList = [];
    specialityData.sameScoresList = [];
    specialityData.sortedList = [];

    // Создаем массив оригинальных индексов: [0, 1, 2, ..., N]
    const indices = students.map((_, index) => index);

    // 2. Сортируем ТОЛЬКО массив индексов, сверяясь с данными из students
    indices.sort((aIndex, bIndex) => {
      const a = students[aIndex];
      const b = students[bIndex];

      if (a.bc === "Б" && b.bc !== "Б") return -1;
      if (a.bc !== "Б" && b.bc === "Б") return 1;

      const gradeA = parseGrade(a.avgGrade);
      const gradeB = parseGrade(b.avgGrade);
      if (gradeA !== gradeB) return gradeB - gradeA;

      return (a.studentName || "").localeCompare(b.studentName || "");
    });

    // Сохраняем отсортированный список оригинальных индексов
    specialityData.sortedList = indices;

    // --- БЛОК: Поиск одинаковых баллов ---
    let currentGrade = null;
    let currentIndices = [];
    
    const flushIndices = () => {
      if (currentIndices.length > 1) {
        specialityData.sameScoresList.push(currentIndices);
      }
    };

    // Проходим по отсортированным индексам
    indices.forEach((originalIndex, sortedIndex) => {
      const student = students[originalIndex];
      if (student.bc === "Б") {
        const grade = parseGrade(student.avgGrade);
        if (grade !== -1) {
          if (currentGrade === grade) {
            // Записываем sortedIndex, чтобы значения оставались как в старом коде
            currentIndices.push(sortedIndex);
          } else {
            flushIndices();
            currentGrade = grade;
            currentIndices = [sortedIndex];
          }
        }
      }
    });
    flushIndices(); 
    // -----------------------------------------------------------

    // Собираем тех, кто имеет право на стипендию
    const scholarshipList = indices
      .filter(originalIndex => {
        const s = students[originalIndex];
        return s.avgGrade !== "-" && s.avgGrade !== " - " && s.bc !== "К";
      })
      .map(originalIndex => {
        return {
          index: originalIndex,
          score: parseFloat(students[originalIndex].avgGrade) 
        };
      });

    // Сортируем: score по убыванию, при равенстве — index по возрастанию
    scholarshipList.sort((a, b) => {
      if (b.score === a.score) {
        return a.index - b.index;
      }
      return b.score - a.score;
    });

    // Достаем первые scholarshipNumber студентов и оставляем только их индексы
    const scholarshipFilteredIndices = scholarshipList
      .slice(0, specialityData.scholarshipNumber)
      .map(item => item.index);

    // Назначаем обычную стипендию
    if (scholarshipFilteredIndices.length !== 0) {
      scholarshipFilteredIndices.forEach(studIndex => {
        students[studIndex].scholarship = true;
      });
    }

    // Заполняем списки социальных и повышенных стипендий
    students.forEach((student, studIndex) => {
      if (student.socialStatus && !student.scholarship) {
        specialityData.socialScholarshipList.push(studIndex);
      }
      if (student.increased && student.scholarship) {
        specialityData.increasedScholarshipList.push(studIndex);
      }
    });
  }
  
  // Очистка глобальных свойств
  delete info.socialyList;
  delete info.increasedList;
  delete info.kurator;
  
  return info;
}

ipcMain.handle('sessionPackageGetInformation', async (event, path) => {
  return getInfo(path);
});
ipcMain.handle('sessionPackageDataSupplement', async (event, info) => {
  return dataSupplement(info);
});