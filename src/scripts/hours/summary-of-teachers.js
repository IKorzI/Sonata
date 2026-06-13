import { ipcMain } from "electron";
import XlsxPopulate from "xlsx-populate";
import { findCell } from "../utils.js";

const monthNames = {
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

async function getInfo(filePath) {
  let findedCell;

  const workbook = await XlsxPopulate.fromFileAsync(filePath);

  const sheetNames = workbook.sheets().map((s) => s.name());
  const filteredSheetNames = sheetNames.filter((name) => name !== "Приклад");

  const sheet = workbook.sheet(filteredSheetNames[0]);

  // Expected fixed string format in cell C7 (e.g., "за жовтень 2023 року")
  let cell = sheet.cell(7, 3).value();
  let parts = cell.split(" ");
  const month = monthNames[parts[1]];
  const year = parseInt(parts[2], 10);

  // Dynamic search for the bottom border of the table, starting from cell E12
  findedCell = findCell(sheet, undefined, "down", { row: 12, column: 5 });
  const endRow = findedCell.row - 1;

  // Dynamic search for the right border (last day) relative to the cell with the text "Примітка"
  findedCell = findCell(sheet, "Примітка", "right", { row: 10, column: 5 });
  const endCol = findedCell.column - 2;

  const startDay = sheet.cell(11, 6).value();
  const endDay = sheet.cell(11, endCol).value();
  const date = new Date(year, month - 1, startDay);

  // Adaptation of the day of the week number: from JS format (Sun=0) to standard (Mon=0, Sun=6)
  let dayOfWeek = date.getDay();
  dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const days = {
    startDay: startDay,
    endDay: endDay,
    startWeekday: dayOfWeek,
  };

  const groups = [];
  for (const sheetName of filteredSheetNames) {
    const sheet = workbook.sheet(sheetName);

    const cellC8 = sheet.cell(8, 3).value();

    const subjects = [];
    for (let row = 12; row <= endRow; row++) {
      const subjectName = sheet.cell(row, 4).value();
      const teacherName = sheet.cell(row, 5).value();
      const values = [];

      // Data collection for each day in the found column range
      for (let col = 6; col <= endCol; col++) {
        values.push(sheet.cell(row, col).value() ?? null);
      }
      subjects.push({ subjectName, teacherName, values });
    }

    groups.push({ groupName: sheetName, cellC8, subjects });
  }

  return {
    groups,
    month,
    year,
    days,
  };
}

function dataSupplement(data) {
  const groupsArray = data.groups;
  const teachersMap = {};

  for (const group of groupsArray) {
    const groupName = group.groupName;
    const groupSubjects = group.subjects;

    if (!groupSubjects || groupSubjects.length === 0) continue;

    const firstSubject = groupSubjects[0];

    // Calculation of the target column position: base offset (5) + number of days + 1
    const column = 5 + firstSubject.values.length + 1;

    let step = 1;
    for (const subject of groupSubjects) {
      const teacherName = subject.teacherName;

      if (!teachersMap[teacherName]) {
        teachersMap[teacherName] = [];
      }

      // Saving coordinates for further data recording for a specific teacher
      teachersMap[teacherName].push({
        groupName: groupName,
        row: 11 + step,
        column: column,
      });

      step += 1;
    }
  }

  const teachers = Object.keys(teachersMap).map((teacherName) => {
    return {
      teacherName: teacherName,
      groups: teachersMap[teacherName],
    };
  });

  // Sorting the array of teachers taking into account the Ukrainian alphabet (correct position of 'І', 'Є', 'Ґ')
  teachers.sort((a, b) => {
    return a.teacherName.localeCompare(b.teacherName, "uk");
  });

  data.teachers = teachers;

  return data;
}

ipcMain.handle("hoursSummaryGetInformation", async (event, path) => {
  try {
    return await getInfo(path);
  } catch (error) {
    console.error(error.message);
    return false;
  }
});

ipcMain.handle("hoursSummaryDataSupplement", async (event, data) => {
  return dataSupplement(data);
});
