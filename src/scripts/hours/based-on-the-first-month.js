import { ipcMain } from 'electron';
import XlsxPopulate from 'xlsx-populate';
import { findCell } from '../utils.js';

const monthNames = {
    'січень': 1,        'січня': 1,         1: 'січень',
    'лютий': 2,         'лютого': 2,        2: 'лютий',
    'березень': 3,      'березня': 3,       3: 'березень',
    'квітень': 4,       'квітня': 4,        4: 'квітень',
    'травень': 5,       'травня': 5,        5: 'травень',
    'червень': 6,       'червня': 6,        6: 'червень',
    'липень': 7,        'липня': 7,         7: 'липень',
    'серпень': 8,       'серпня': 8,        8: 'серпень',
    'вересень': 9,      'вересня': 9,       9: 'вересень',
    'жовтень': 10,      'жовтня': 10,       10: 'жовтень',
    'листопад': 11,     'листопада': 11,    11: 'листопад',
    'грудень': 12,      'грудня': 12,       12: 'грудень'
};

async function getInfo(filePath) {
  let row = 0
  let col = 0
  let findedCell;

  const workbook = await XlsxPopulate.fromFileAsync(filePath);
  const sheetNames = workbook.sheets().map(s => s.name());
  const filteredSheetNames = sheetNames.filter(name => name !== 'Приклад');

  const sheet = workbook.sheet(filteredSheetNames[0]);
  let cell = sheet.cell(7, 3).value();
  let parts = cell.split(' ');
  const startDay = sheet.cell(11, 6).value();
  const startMonth = monthNames[parts[1]];
  const year = parseInt(parts[2], 10);

  // Finding dynamic table borders (bottom and right)
  findedCell = findCell(sheet, undefined, 'down', {row: 12, column: 5});
  const endRow = findedCell.row - 1;
  findedCell = findCell(sheet, 'Примітка', 'right', {row: 10, column: 5});
  const endCol = findedCell.column - 2

  // Background color pattern to find the start of the schedule: 5 working days (white), 2 days off (gray), 5 working days
  const pattern = [
    ...Array(5).fill('FFFFFFFF'),
    ...Array(2).fill('FFBFBFBF'),
    ...Array(5).fill('FFFFFFFF')
  ];
  const targetPattern = pattern.join('|');
  const rowColors = [];

  function normalizeColor(colorObj) {
    if (!colorObj) return 'FFFFFFFF';
    if (colorObj.rgb) {
      return colorObj.rgb;
    }
    if (colorObj.theme === 0) {
      if (colorObj.tint !== undefined && colorObj.tint <= -0.24 && colorObj.tint >= -0.26) {
        return 'FFBFBFBF';
      } else if (colorObj.tint === undefined || colorObj.tint === 0) {
        return 'FFFFFFFF';
      };
    }
    return '';
  }

  for (let col = 6; col <= endCol; col++) {
    const colorObj = sheet.cell(12, col).style('fill').color;
    const finalColor = normalizeColor(colorObj);
    rowColors.push(finalColor);
  }
  const rowIndex = rowColors.join('|').indexOf(targetPattern);
  if (rowIndex !== -1) {
    col = 6 + rowColors.join('|').substring(0, rowIndex).split('|').length - 1;
  } else {
    return;
  }
  const start12Col = col;
  const hoursStartDay = sheet.cell(11, start12Col).value();

  const groups = []; 
  for (const sheetName of filteredSheetNames) {
    const sheet = workbook.sheet(sheetName);
    const cellC8 = sheet.cell(8, 3).value();
    
    const groupData = { 
      groupCode: sheetName, 
      cellC8: cellC8,
      subjects: [] 
    };

    for (row = 12; row <= endRow; row++) {
      const subject = sheet.cell(row, 4).value();
      const teacher = sheet.cell(row, 5).value();
      const values = []
      for (col = start12Col; col < start12Col + 12; col++) {
        // Skipping columns with weekends in Excel
        if (col === start12Col + 5) col = start12Col + 7;
        values.push(sheet.cell(row, col).value() ?? null);
      }
      const element = {
        subjectName: subject, 
        teacherName: teacher, 
        values: values
      };
      groupData.subjects.push(element);
    }
    groups.push(groupData);
  }

  // Setting the end date depending on whether it is the autumn (>=8) or spring semester
  let endDay, endMonth
  if (startMonth >= 8) {
    endDay = 31;
    endMonth = 12;
  } else {
    endDay = 30;
    endMonth = 6;
  }

  const startDayStr = startDay.toString().padStart(2, '0');
  const startMonthStr = startMonth.toString().padStart(2, '0');
  const endDayStr = endDay.toString().padStart(2, '0');
  const endMonthStr = endMonth.toString().padStart(2, '0');
  const hoursStartDayStr = hoursStartDay.toString().padStart(2, '0');

  const semesterStartDate = `${startDayStr}.${startMonthStr}.${year}`;
  const semesterEndDate = `${endDayStr}.${endMonthStr}.${year}`;
  const hoursStartDate = `${hoursStartDayStr}.${startMonthStr}.${year}`;

  return {
    groups,
    semesterStartDate,
    semesterEndDate,
    hoursStartDate,
    year
  };
}

function getSemesterMonths(startStr, endStr) {
    const parseDate = (str) => {
        const [day, month, year] = str.split('.').map(Number);
        return new Date(year, month - 1, day);
    };

    const formatDate = (date) => {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}.${m}.${y}`;
    };

    const adjustBusinessDay = (date, isStart) => {
        // Shifting the date so that the month always starts/ends on a business day
        const d = new Date(date);
        const dayOfWeek = d.getDay(); 

        if (isStart) {
            if (dayOfWeek === 6) d.setDate(d.getDate() + 2);
            if (dayOfWeek === 0) d.setDate(d.getDate() + 1);
        } else {
            if (dayOfWeek === 6) d.setDate(d.getDate() - 1);
            if (dayOfWeek === 0) d.setDate(d.getDate() - 2);
        }
        return d;
    };

    const getEuroDayOfWeek = (date) => {
        const day = date.getDay();
        return day === 0 ? 6 : day - 1;
    };

    const startDate = parseDate(startStr);
    const endDate = parseDate(endStr);
    const result = [];

    let currentIterDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (currentIterDate <= endDate) {
        const currentYear = currentIterDate.getFullYear();
        const currentMonth = currentIterDate.getMonth();

        let monthStart = (currentYear === startDate.getFullYear() && currentMonth === startDate.getMonth()) 
            ? new Date(startDate) 
            : new Date(currentYear, currentMonth, 1);

        let monthEnd = (currentYear === endDate.getFullYear() && currentMonth === endDate.getMonth()) 
            ? new Date(endDate) 
            : new Date(currentYear, currentMonth + 1, 0);

        const adjustedStart = adjustBusinessDay(monthStart, true);
        const adjustedEnd = adjustBusinessDay(monthEnd, false);

        result.push({
            monthIndex: currentMonth + 1,
            year: currentYear,
            startDay: adjustedStart.getDate(),
            endDay: adjustedEnd.getDate(),
            startWeekday: getEuroDayOfWeek(adjustedStart), 
            start: formatDate(adjustedStart),
            end: formatDate(adjustedEnd)
        });

        currentIterDate.setMonth(currentIterDate.getMonth() + 1);
    }

    return result;
}

function getScheduleRange(pattern, patternStartStr, rangeStartStr, rangeEndStr) {
    const parseDate = (str) => {
        const [day, month, year] = str.split('.').map(Number);
        return new Date(year, month - 1, day);
    };

    const patternStart = parseDate(patternStartStr);
    const start = parseDate(rangeStartStr);
    const end = parseDate(rangeEndStr);
    const result = [];

    let current = new Date(start);

    while (current <= end) {
        const dayOfWeek = current.getDay();

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            result.push(null);
        } else {
            // Calculation of the index (0-9) in the two-week pattern (numerator/denominator) taking into account the week offset
            const diffTime = current - patternStart;
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            const currentMondayDiff = diffDays - (dayOfWeek - 1);
            const weekOffset = Math.floor(currentMondayDiff / 7);

            const cycleIndex = ((weekOffset % 2) + 2) % 2;
            const dayIndex = dayOfWeek - 1; 
            const valueIndex = (cycleIndex * 5) + dayIndex;

            result.push(pattern[valueIndex]);
        }
        current.setDate(current.getDate() + 1);
    }

    return result;
}

function dataSupplement(data) {
  const hoursStartDate = data.hoursStartDate;
  const dataGroups = data.groups; 
  const months = []; 

  const semesterMonths = getSemesterMonths(data.semesterStartDate, data.semesterEndDate);

  for (const month of semesterMonths) {
    const monthName = monthNames[month.monthIndex];
    const monthStart = month.start;
    const monthEnd = month.end;
    
    const monthData = {
      monthName: monthName,
      startDay: month.startDay,
      endDay: month.endDay,
      startWeekday: month.startWeekday,
      groups: []
    };

    for (const group of dataGroups) {
      const groupSchedule = {
        groupCode: group.groupCode,
        cellC8: group.cellC8,
        subjects: []
      };

      for (const subject of group.subjects) {
        groupSchedule.subjects.push({
          subjectName: subject.subjectName, 
          teacherName: subject.teacherName, 
          values: getScheduleRange(subject.values, hoursStartDate, monthStart, monthEnd),
        });
      }
      monthData.groups.push(groupSchedule);
    }
    months.push(monthData);
  }

  if (data.hours) delete data.hours;
  if (data.days) delete data.days; 
  if (data.groups) delete data.groups;
  if (data.cellsC8) delete data.cellsC8;
  
  data.months = months;
  
  // Converting the array of objects into a dictionary { "Subject": hours } for easier access
  const result = Object.fromEntries(
    data.hoursPerSubject.map(item => [item.subjectName, item.hours])
  );
  data.hoursPerSubject = result;

  return data;
}

ipcMain.handle('hoursBasedGetInformation', async (event, path) => {
  try {
    return await getInfo(path);
  } catch (error) {
    console.error(error.message);
    return false;
  }
});
ipcMain.handle('hoursBasedDataSupplement', async (event, data) => {
  return dataSupplement(data);
});