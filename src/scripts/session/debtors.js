import { ipcMain } from 'electron';
import XlsxPopulate from 'xlsx-populate';
import { findCell } from '../utils.js';

// Safe conversion of a value to a number
function getNumericValue(val) {
  const num = Number(val);
  if (!isNaN(num) && typeof val !== 'boolean') {
    return num;
  }

  return 0;
}

// Shortening the full name to the format "Last Name F.M."
function fullNameToShortName(fullName) {
  const parts = fullName.trim().split(/\s+/);

  const isOnlyLetters = (str) => /^\p{L}+$/u.test(str);

  if (parts.length === 3 && parts.every(isOnlyLetters)) {
    const [lastName, firstName, middleName] = parts;
    
    const firstInitial = firstName[0].toUpperCase();
    const middleInitial = middleName[0].toUpperCase();
    
    return `${lastName} ${firstInitial}.${middleInitial}.`;
  }

  return fullName;
}

async function getInfo(filePath, type) {
  let findedCell;
  
  const workbook = await XlsxPopulate.fromFileAsync(filePath);
  const sheetNames = workbook.sheets().map(s => s.name());
  
  // Selecting only the sheets containing summary information
  const filteredSheetNames = sheetNames.filter(name => name.startsWith('Зведена'));

  const sheet = workbook.sheet(filteredSheetNames[0]);
  
  // Getting the group code from the specified cell
  const groupCode = sheet.cell(7, 3).value().split(' ')[1];

  let students = [];
  let specialityCodes = [];
  filteredSheetNames.forEach(sheetName => {
    const sheet = workbook.sheet(sheetName);
    const specialityCode = sheet.cell(5, 3).value().split(' ')[3];
    specialityCodes.push(specialityCode);

    // Determining the table boundaries (last row and column)
    findedCell = findCell(sheet, undefined, 'down', {row: 10, column: 4});
    const endRow = findedCell.row - 1;
    findedCell = findCell(sheet, 'Середній бал', 'right', {row: 8, column: 5});
    const endCol = findedCell.column;
    
    let step = -1;
    for (let row = 10; row <= endRow; row++) {
      let newStudent = true;
      for (let col = 6; col <= endCol - 1; col++) {
        const value = getNumericValue(sheet.cell(row, col).value());
        
        // Finding debts (grade is missing or less than 4)
        if (!value || value < 4) {
          if (newStudent) {
            newStudent = false;
            step += 1;
            const studentShortName = fullNameToShortName(sheet.cell(row, 5).value())
            students[step] = {
              'studentName': studentShortName,
              'bc': sheet.cell(row, 3).value(),
              'grades': []
            };
          }
          const text = sheet.cell(9, col).value();
          
          // Separating the subject name and the teacher's full name
          const lines = text.split(/\r?\n/);
          const grade = !value ? 'н/а' : value;
          const element = {
            'subjectName': lines[0],
            'teacherName': lines[1],
            'grade': grade
          }
          students[step].grades.push(element);
        }
      }
    }
    
  });

  const answer = {
    'groupCode': groupCode,
    'students': students,
    'specialityCodes': specialityCodes
  }

  return answer;
}

// Cleaning data from local file paths
function dataSupplement(data) {
  data.groups.forEach(group => {
    delete group.filePath;
  });
  return data
}

// Registering IPC handlers for interaction with the frontend part
ipcMain.handle('sessionDebtorsGetInformation', async (event, path, type) => {
  try {
    return await getInfo(path);
  } catch (error) {
    console.error(error.message);
    return false;
  }
});
ipcMain.handle('sessionDebtorsDataSupplement', async (event, data) => {
  return dataSupplement(data);
});