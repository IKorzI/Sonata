import { ipcMain } from 'electron';
import XlsxPopulate from 'xlsx-populate';
import { specNames } from '../utils.js';

// Checks if a cell belongs to a merged range
function getMergeRangeForCell(sheet, cell) {
  const merges = sheet._mergeCells; 
  
  if (!merges) return null;

  const cellRow = cell.rowNumber();
  const cellCol = cell.columnNumber();

  for (const address in merges) {
    const range = sheet.range(address);

    const startRow = range.startCell().rowNumber();
    const startCol = range.startCell().columnNumber();
    const endRow = range.endCell().rowNumber();
    const endCol = range.endCell().columnNumber();

    if (cellRow >= startRow && cellRow <= endRow &&
      cellCol >= startCol && cellCol <= endCol) {
      
      return range;
    }
  }
  
  return null;
}

// Getting contingent data (students, specialties, subgroups)
async function getInfoContingent(filePath) {
  const workbook = await XlsxPopulate.fromFileAsync(filePath);
  const sheetNames = workbook.sheets().map(s => s.name());
  
  // Filtering sheets, ignoring system ones
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

    // Reading data row by row
    while (true) {
      const cell4 = sheet.cell(row, 4);
      const cell5 = sheet.cell(row, 5);

      const mergedRange = getMergeRangeForCell(sheet, cell4);

      // If the cell is merged, it's a row with a specialty code
      if (mergedRange) {
        newSpec = true;
        step++;
        specCode = sheet.cell(row, 3).value(); 
        row++;
        continue;
      }

      const cell4Val = cell4.value();
      const cell5Val = cell5.value();

      // Stopping if the data has ended
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

      const studentObj = { 'studentName': cell4Val, 'bc': cell5Val };

      if (groups[sheetName].subgroups[step]) {
        groups[sheetName].subgroups[step].studentIDs.push(studentObj);
      }

      groups[sheetName].students.push(studentObj);

      row++;
      if (row >= 200) break; // Failsafe against an infinite loop
    }

    // Getting the curator's full name under the main table
    const kuratorCellText = sheet.cell(row + 1, 4).value();
    
    if (kuratorCellText && typeof kuratorCellText === 'string') {
      const parts = kuratorCellText.split('керівник ');
      if (parts.length > 1) {
        groups[sheetName].kuratorNom = parts[1];
      }
    }

    // Sorting students by the Ukrainian alphabet
    groups[sheetName].students.sort((a, b) => a.studentName.localeCompare(b.studentName, 'uk'));

    // Binding indices of the sorted array to subgroups
    const studentIndexMap = new Map();
    groups[sheetName].students.forEach((student, index) => {
      studentIndexMap.set(student, index);
    });

    groups[sheetName].subgroups.forEach(spec => {
      spec.studentIDs = spec.studentIDs.map(studentObj => studentIndexMap.get(studentObj));
    });
  });

  // Determining the current academic year and semester based on the date
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

// Getting hours data (subjects and teachers)
async function getInfoHours(filePath) {
  const workbook = await XlsxPopulate.fromFileAsync(filePath);
  const sheetNames = workbook.sheets().map(s => s.name());
  const filteredSheetNames = sheetNames.filter(name => name !== 'Приклад' && name !== 'Зведена');

  const groups = {};

  filteredSheetNames.forEach(sheetName => {
    const sheet = workbook.sheet(sheetName);
    groups[sheetName] = { 'subjects': [] };
    
    let row = 12;
    
    while (true) {
      const cell4Val = sheet.cell(row, 4).value();
      const cell5Val = sheet.cell(row, 5).value();

      if (cell5Val === undefined || cell5Val === null) {
        break;
      }

      groups[sheetName].subjects.push({
        'subjectName': cell4Val,
        'teacherName': cell5Val
      });

      row++;
      if (row >= 50) return; // Failsafe against an infinite loop
    }
  });

  return groups;
}

// Entry point for file processing depending on the data type
async function getInfo(filePath, type) {
  if (type === 'contingent') {
    return await getInfoContingent(filePath);
  } else {
    return await getInfoHours(filePath);
  }
}

// Merging contingent and hours data into a single structure
function dataSupplement(data) {
  const transformedGroups = Object.entries(data.contingentData.groups).map(([groupCode, groupInfo]) => {
    const hoursInfo = data.hoursData[groupCode] || {};
    
    return {
      groupCode: groupCode,
      ...groupInfo,
      ...hoursInfo
    };
  });

  const { hoursData, contingentData, ...rootLevelData } = data;
  const { groups, ...contingentLevelData } = contingentData;

  const result = {
    ...rootLevelData,
    ...contingentLevelData,
    groups: transformedGroups
  };

  return result;
}

// Registering IPC handlers for interaction with the frontend part of Electron
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