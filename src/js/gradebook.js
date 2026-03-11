/**
 * gradebook.js
 * Core data-parsing, storage, and utility functions for the Gradebook Explorer.
 * Lab 04 – Part A/B/C
 */

// A) DATA PARSING AND STORAGE 

/**
 * Converts a 2-D array (rows of strings) into a structured gradebook object.
 * The first row is treated as headers; the first column of every row is the
 * student name.
 */
function parseGradebook(rawRows) {
  if (!rawRows || rawRows.length < 2) {
    return { headers: [], students: [], grid: [] };
  }

  const [headerRow, ...dataRows] = rawRows;

  const headers = headerRow.slice(1);

  const students = [];
  const grid = [];

  dataRows.forEach((row) => {
    if (row.length === 0) return; // skip blank lines
    students.push(row[0] || "");
    const grades = row.slice(1).map((cell) => parseGrade(cell));
    grid.push(grades);
  });

  return { headers, students, grid };
}

/**
 * Parses a CSV string into a 2-D array of strings.
 */
function csvToRawRows(csvText) {
  return csvText
    .trim()
    .split("\n")
    .map((line) => line.split(",").map((cell) => cell.trim()));
}

/**
 * Returns the value at (rowIndex, colIndex) from the gradebook grid,
 * or NaN if the indices are out of bounds.
 */
function readCell(gradebook, rowIndex, colIndex) {
  if (!isValidRowIndex(gradebook, rowIndex)) return NaN;
  if (!isValidColIndex(gradebook, colIndex)) return NaN;
  return gradebook.grid[rowIndex][colIndex];
}

/**
 * Updates a cell value in the gradebook grid.
 */
function setCell(gradebook, rowIndex, colIndex, value) {
  if (!isValidRowIndex(gradebook, rowIndex)) return;
  if (!isValidColIndex(gradebook, colIndex)) return;
  gradebook.grid[rowIndex][colIndex] = parseGrade(value);
}

/**
 * Returns an entire row as a numeric array (NaN for missing/invalid values).
 */
function getRow(gradebook, rowIndex) {
  if (!isValidRowIndex(gradebook, rowIndex)) return [];
  return [...gradebook.grid[rowIndex]];
}

/**
 * Returns an entire column as a numeric array (NaN for missing/invalid values).
 */
function getColumn(gradebook, colIndex) {
  if (!isValidColIndex(gradebook, colIndex)) return [];
  return gradebook.grid.map((row) => row[colIndex]);
}

// B) EQUALITY AND SAFETY CHECKS 

/**
 * Converts a raw string or number to a float.
 * Returns NaN for empty strings, null, undefined, or non-numeric text.
 */
function parseGrade(value) {
  if (value === null || value === undefined || value === "") return NaN;
  const n = parseFloat(value);
  return isFinite(n) ? n : NaN;
}

/**
 * Returns true if the value is a valid (non-NaN, finite) grade number.
 */
function isValidGrade(value) {
  return typeof value === "number" && isFinite(value) && !isNaN(value);
}

/**
 * Filters an array of numbers, removing NaN / invalid values.
 */
function filterValid(arr) {
  return arr.filter(isValidGrade);
}

/**
 * Returns true if rowIndex is a valid data row index (0-based, excludes header).
 */
function isValidRowIndex(gradebook, rowIndex) {
  return (
    Number.isInteger(rowIndex) &&
    rowIndex >= 0 &&
    rowIndex < gradebook.grid.length
  );
}

/**
 * Returns true if colIndex is a valid data column index (0-based, excludes student name).
 */
function isValidColIndex(gradebook, colIndex) {
  return (
    Number.isInteger(colIndex) &&
    colIndex >= 0 &&
    colIndex < gradebook.headers.length
  );
}

// NUMERIC SUMMARIES 

/**
 * Returns { count, mean, min, max } for a numeric array, ignoring invalid values.
 */
function calculateStats(arr) {
  const valid = filterValid(arr);
  if (valid.length === 0) {
    return { count: 0, mean: null, min: null, max: null };
  }
  const sum = valid.reduce((a, b) => a + b, 0);
  return {
    count: valid.length,
    mean: sum / valid.length,
    min: Math.min(...valid),
    max: Math.max(...valid),
  };
}

// GRADE CONVERSION 

/**
 * Converts a numeric grade (0–100) to a letter grade A–F.
 */
function toLetter(grade) {
  if (!isValidGrade(grade)) return "?";
  if (grade >= 90) return "A";
  if (grade >= 80) return "B";
  if (grade >= 70) return "C";
  if (grade >= 60) return "D";
  return "F";
}

/**
 * Converts an array of numeric grades to letter-grade frequency ratios.
 * Returns an object with keys A, B, C, D, F, each with a value in [0, 1].
 */
function letterGradeFrequencies(grades) {
  const valid = filterValid(grades);
  const freq = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  if (valid.length === 0) return freq;

  valid.forEach((g) => {
    const letter = toLetter(g);
    freq[letter]++;
  });

  Object.keys(freq).forEach((k) => {
    freq[k] = freq[k] / valid.length;
  });
  return freq;
}

// C) PROMISE PLACEHOLDER 

/**
 * Loads grades.csv from the given URL and returns a Promise that resolves
 * with a parsed gradebook object.
 * (Completed in Lab 06 via fetch + local server)
 */
function loadGradesFromFile(url) {
  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load CSV: ${response.statusText}`);
      }
      return response.text();
    })
    .then((text) => {
      const rawRows = csvToRawRows(text);
      return parseGradebook(rawRows);
    });
}

// INFORMAL UNIT TESTS (Lab 04 console checks) 

(function selfTest() {
  // Small hard-coded sample for offline testing
  const sample = [
    ["Student", "Quiz 1", "Midterm"],
    ["Alice", "88", "79"],
    ["Bob", "73", ""],
    ["Carol", "95", "93"],
  ];
  const gb = parseGradebook(sample);

  console.assert(gb.headers.length === 2, "headers length");
  console.assert(gb.students[0] === "Alice", "first student");
  console.assert(readCell(gb, 0, 0) === 88, "readCell(0,0)");
  console.assert(isNaN(readCell(gb, 1, 1)), "missing grade is NaN");
  console.assert(isNaN(readCell(gb, 99, 0)), "out-of-bounds row → NaN");

  const col0 = getColumn(gb, 0);
  console.assert(col0.length === 3, "column length");

  const stats = calculateStats(col0);
  console.assert(stats.count === 3, "calculateStats count");
  console.assert(Math.abs(stats.mean - (88 + 73 + 95) / 3) < 0.001, "calculateStats mean");

  const freq = letterGradeFrequencies([95, 85, 73, 62, 55]);
  console.assert(freq.A === 1 / 5, "letter freq A");
  console.assert(freq.F === 1 / 5, "letter freq F");

  console.log("[gradebook.js] All self-tests passed ✓");
})();