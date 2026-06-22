import { ipcMain } from "electron";
import XlsxPopulate from "xlsx-populate";
import { findCell } from "../utils.js";
import shevchenko from "shevchenko";

// Converting full name to genitive case (whom/whose)
async function convertToGenitive(fullNameString) {
  try {
    const parts = fullNameString.trim().split(/\s+/);

    if (parts.length < 2) {
      throw new Error("The line must contain at least the first and last name");
    }

    const givenName = parts[0];
    const familyName = parts[1];

    // Gender detection for correct declension
    const detectedGender = await shevchenko.detectGender({ givenName });
    const gender = detectedGender || "masculine";

    const person = {
      gender,
      givenName,
      familyName,
    };

    const declined = await shevchenko.inGenitive(person);

    return `${declined.givenName} ${declined.familyName}`;
  } catch (error) {
    return "";
  }
}

// Reading and parsing data from the Excel file
async function getInfo(filePath) {
  let findedCell;
  let match;

  const workbook = await XlsxPopulate.fromFileAsync(filePath);
  const sheetNames = workbook.sheets().map((s) => s.name());

  // Selecting sheets with names starting with "Зведена"
  const filteredSheetNames = sheetNames.filter((name) =>
    name.startsWith("Зведена"),
  );

  const sheet = workbook.sheet(filteredSheetNames[0]);

  // Determining the semester number, year, and start/end dates from the text
  const semesterCellV = sheet.cell(6, 3).value();
  match = semesterCellV.match(/За\s+([IІ]+)/i);
  const semesterNumberRoman = match[1].toUpperCase().replaceAll("І", "I");
  const semesterNumber = semesterNumberRoman === "I" ? 1 : 2;
  const semesterNumberWord = semesterNumber === 1 ? "першого" : "другого";
  match = semesterCellV.match(/семестр\s+(\d{4})/i);
  const yearNumber = parseInt(match[1], 10);
  const semesterStart =
    semesterNumber === 1
      ? `01.01.${yearNumber + 1}`
      : `01.07.${yearNumber + 1}`;
  const semesterEnd =
    semesterNumber === 1
      ? `30.06.${yearNumber + 1}`
      : `31.12.${yearNumber + 1}`;
  const years = `${yearNumber}-${yearNumber + 1}`;

  // Finding the "Average grade" column and reading the list of subjects and teachers
  findedCell = findCell(sheet, "Середній бал", "right", { row: 8, column: 5 });
  const avgGradeColumn = findedCell.column;
  const subjects = [];
  for (let col = 6; col <= avgGradeColumn - 1; col++) {
    const text = sheet.cell(9, col).value();
    const lines = text.split(/\r?\n/);
    subjects.push({
      subjectName: lines[0],
      teacherName: lines[1],
    });
  }

  const groupCode = sheet.cell(7, 3).value().split(" ")[1];

  // Calculation of the scholarship holders' percentage based on the Excel formula
  findedCell = findCell(sheet, undefined, "down", { row: 10, column: 4 });
  const percentageF = sheet.cell(findedCell.row + 8, 6).formula();
  match = percentageF.match(/ROUNDDOWN\([^*]+\*([0-9.]+),0\)/);
  const percentage = parseFloat(match[1]) * 100;

  // Finding and declining the full name of the curator (homeroom teacher)
  findedCell = findCell(sheet, "Класний керівник", "right", {
    row: findedCell.row + 6,
    column: 7,
  });
  findedCell = findCell(sheet, true, "right", {
    row: findedCell.row,
    column: findedCell.column + 1,
  });
  const kuratorNom = sheet.cell(findedCell.row, findedCell.column).value();
  const kuratorGen = await convertToGenitive(kuratorNom);

  // Reading student data for each subgroup (specialty)
  const subgroups = [];
  filteredSheetNames.forEach((sheetName) => {
    const students = [];
    const sheet = workbook.sheet(sheetName);
    const cells = {
      C5: sheet.cell(5, 3).value(),
      C6: sheet.cell(6, 3).value(),
      C7: sheet.cell(7, 3).value(),
    };

    match = sheet
      .cell(5, 3)
      .value()
      .match(/спеціальності\s+([A-Z]\d+)\s+(«[^»]+»)/i);
    const specialityCode = match[1];
    const specialityName = match[2];

    findedCell = findCell(sheet, undefined, "down", { row: 10, column: 4 });
    const endRow = findedCell.row - 1;

    // Reading grades and data for each student
    for (let row = 10; row <= endRow; row++) {
      const studentName = sheet.cell(row, 5).value();
      const bc = sheet.cell(row, 3).value();
      const grades = [];

      for (let col = 6; col <= avgGradeColumn - 1; col++) {
        grades.push(sheet.cell(row, col).value());
      }

      let avgGrade = sheet.cell(row, avgGradeColumn).value();
      if (avgGrade !== " - " && avgGrade !== "-") {
        avgGrade = parseFloat(Number(avgGrade).toFixed(2));
      }

      students.push({
        studentName: studentName,
        grades: grades,
        avgGrade: avgGrade,
        bc: bc,
        socialStatus: null,
        scholarship: false,
        increased: false,
      });
    }

    const scholarshipNumber = sheet.cell(findedCell.row + 8, 6).value();

    subgroups.push({
      students: students,
      cells: cells,
      specialityCode: specialityCode,
      specialityName: specialityName,
      scholarshipNumber: scholarshipNumber,
    });
  });

  return {
    groupCode: groupCode,
    subgroups: subgroups,
    kuratorNom: kuratorNom,
    kuratorGen: kuratorGen,
    years: years,
    semesterNumber: semesterNumberRoman,
    semesterNumberWord: semesterNumberWord,
    semesterStart: semesterStart,
    semesterEnd: semesterEnd,
    subjects: subjects,
    percentage: percentage,
  };
}

// Processing, supplementing data, and ranking (scholarships, benefits)
function dataSupplement(data) {
  const subgroups = data.subgroups;

  // Adding social status to students
  for (const item of data.socialyList || []) {
    const { specialityIndex, studentIndex, status } = item;
    if (
      subgroups[specialityIndex] &&
      subgroups[specialityIndex].students[studentIndex]
    ) {
      subgroups[specialityIndex].students[studentIndex].socialStatus = status;
    }
  }

  // Marking students with an increased scholarship
  for (const item of data.increasedList || []) {
    const { specialityIndex, studentIndex } = item;
    if (
      subgroups[specialityIndex] &&
      subgroups[specialityIndex].students[studentIndex]
    ) {
      subgroups[specialityIndex].students[studentIndex].increased = true;
    }
  }

  // Helper function for correct grade parsing
  const parseGrade = (grade) => {
    if (grade === "-" || grade === " - ") return -1;
    const parsed = parseFloat(String(grade).replace(",", "."));
    return isNaN(parsed) ? -1 : parsed;
  };

  for (let specIndex = 0; specIndex < subgroups.length; specIndex++) {
    const specialityData = subgroups[specIndex];
    const students = specialityData.students;

    students.forEach((student) => {
      const grade = parseGrade(student.avgGrade);
      if (student.bc === "Б" && grade !== -1) {
        student.ratingGrade = ((grade / 12) * 90).toFixed(2).replace(".", ",");
      } else {
        student.ratingGrade = null;
      }
    });

    specialityData.socialScholarshipList = [];
    specialityData.increasedScholarshipList = [];
    specialityData.sameScoresList = [];
    specialityData.sortedList = [];

    const indices = students.map((_, index) => index);

    // Sorting: 1. State-funded students higher; 2. By average grade (descending); 3. Alphabetical order
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

    specialityData.sortedList = indices;

    let currentGrade = null;
    let currentIndices = [];

    // Grouping state-funded students with the same average grade (to resolve tie-breaking issues)
    const flushIndices = () => {
      if (currentIndices.length > 1) {
        specialityData.sameScoresList.push(currentIndices);
      }
    };

    indices.forEach((originalIndex, sortedIndex) => {
      const student = students[originalIndex];
      if (student.bc === "Б") {
        const grade = parseGrade(student.avgGrade);
        if (grade !== -1) {
          if (currentGrade === grade) {
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

    // Forming the list for an academic scholarship
    const scholarshipList = indices
      .filter((originalIndex) => {
        const s = students[originalIndex];
        return s.avgGrade !== "-" && s.avgGrade !== " - " && s.bc !== "К";
      })
      .map((originalIndex) => {
        return {
          index: originalIndex,
          score: parseGrade(students[originalIndex].avgGrade),
        };
      });

    scholarshipList.sort((a, b) => {
      if (b.score === a.score) {
        return a.index - b.index;
      }
      return b.score - a.score;
    });

    // Selecting students who pass the scholarship limit
    const scholarshipFilteredIndices = scholarshipList
      .slice(0, specialityData.scholarshipNumber)
      .map((item) => item.index);

    if (scholarshipFilteredIndices.length !== 0) {
      scholarshipFilteredIndices.forEach((studIndex) => {
        students[studIndex].scholarship = true;
      });
    }

    // Distributing students into social and increased scholarship lists
    students.forEach((student, studIndex) => {
      if (student.socialStatus && !student.scholarship) {
        specialityData.socialScholarshipList.push(studIndex);
      }
      if (student.increased && student.scholarship) {
        specialityData.increasedScholarshipList.push(studIndex);
      }
    });

    // Sorting the lists socialScholarshipList and increasedScholarshipList by the avgGrade and studentName fields
    specialityData.socialScholarshipList.sort((indexA, indexB) => {
      const studentA = students[indexA];
      const studentB = students[indexB];

      const gradeA = parseGrade(studentA.avgGrade);
      const gradeB = parseGrade(studentB.avgGrade);

      if (gradeA !== gradeB) {
        return gradeB - gradeA; // Highest score
      }

      // Alphabetically from A to Z
      return (studentA.studentName || "").localeCompare(
        studentB.studentName || "",
      );
    });

    specialityData.increasedScholarshipList.sort((indexA, indexB) => {
      const studentA = students[indexA];
      const studentB = students[indexB];

      const gradeA = parseGrade(studentA.avgGrade);
      const gradeB = parseGrade(studentB.avgGrade);

      if (gradeA !== gradeB) {
        return gradeB - gradeA; // Highest score
      }

      // Alphabetically from A to Z
      return (studentA.studentName || "").localeCompare(
        studentB.studentName || "",
      );
    });
  }

  // Cleaning up temporary input data
  delete data.socialyList;
  delete data.increasedList;
  delete data.kurator;

  return data;
}

// Registering IPC handlers for interaction with the frontend
ipcMain.handle("sessionPackageGetInformation", async (event, path) => {
  try {
    return await getInfo(path);
  } catch (error) {
    console.error(error);
    return false;
  }
});
ipcMain.handle("sessionPackageDataSupplement", async (event, data) => {
  return dataSupplement(data);
});
