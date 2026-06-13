import { ipcMain } from "electron";
import XlsxPopulate from 'xlsx-populate';
import { findCell } from "../utils.js";

// Safe conversion of a value to a number
function getNumericValue(val) {
  const num = Number(val);
  if (!isNaN(num) && typeof val !== 'boolean') {
    return num;
  }

  return 0;
}

// Collecting statistical data from summary reports (academic performance, scholarships, etc.)
async function getInfo(filePath, type) {
  let findedCell;
  
  const workbook = await XlsxPopulate.fromFileAsync(filePath);
  const sheetNames = workbook.sheets().map(s => s.name());
  
  // Selecting sheets with names starting with "Зведена"
  const filteredSheetNames = sheetNames.filter(name => name.startsWith('Зведена'));

  const sheet = workbook.sheet(filteredSheetNames[0]);
  
  // Getting the group code
  const groupCode = sheet.cell(7, 3).value().split(" ")[1];

  // Initializing counters for general statistics
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
    
    // Determining table boundaries (end of the student list and the average grade column)
    findedCell = findCell(sheet, undefined, "down", {row: 10, column: 4});
    const endRow = findedCell.row - 1;
    findedCell = findCell(sheet, "Середній бал", "right", {row: 8, column: 5});
    const endCol = findedCell.column;
    
    // Reading the number of students and their distribution (state-funded, contract, scholarships)
    amount += endRow - 9;
    budget += getNumericValue(sheet.cell(endRow + 6, 6).value());
    kontrakt += getNumericValue(sheet.cell(endRow + 7, 6).value());
    socialScholarship += getNumericValue(sheet.cell(endRow + 8, 6).value());
    scholarship += getNumericValue(sheet.cell(endRow + 9, 6).value());

    const specialityCode = sheet.cell(5, 3).value().split(" ")[3];
    specialityCodes.push(specialityCode);

    // Reading students' average grades and calculating academic performance levels
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
  
  // Calculating the overall average grade of the group
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

// Cleaning objects from local file paths
function dataSupplement(data) {
  data.groups.forEach(group => {
    delete group.filePath;
  });
  return data
}

// Registering IPC handlers for passing report data to the frontend
ipcMain.handle('sessionReportGetInformation', async (event, path, type) => {
  try {
    return await getInfo(path);
  } catch (error) {
    console.error(error.message);
    return false;
  }
});
ipcMain.handle('sessionReportDataSupplement', async (event, data) => {
  return dataSupplement(data);
});