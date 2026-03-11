/**
 * spreadsheet.js
 * Labs 05 & 06
 */

// MODULE STATE  

let gradebook = null;        // populated after CSV loads
let currentSelection = null; // { type: 'row'|'col', index: number, label: string }

// TABLE RENDERING   

function renderTable() {
  if (!gradebook) return;

  const { headers, students, grid } = gradebook;

  let html = '<table id="gradebook-table">';

  // ── Header row ──
  html += "<thead><tr>";
  html += '<th class="corner-cell">Student</th>';
  headers.forEach((h, ci) => {
    html += `<th class="col-header" data-col="${ci}">${h}</th>`;
  });
  html += "</tr></thead>";

  // ── Data rows ──
  html += "<tbody>";
  students.forEach((name, ri) => {
    html += "<tr>";
    html += `<th class="row-header" data-row="${ri}">${name}</th>`;
    grid[ri].forEach((val, ci) => {
      const display = isValidGrade(val) ? val : "";
      html += `<td class="grade-cell" data-row="${ri}" data-col="${ci}">${display}</td>`;
    });
    html += "</tr>";
  });
  html += "</tbody></table>";

  $("#table-container").html(html);
  attachHandlers();
}

// EVENT HANDLERS 

function attachHandlers() {
  // Column header click
  $(document).on("click", ".col-header", function () {
    const ci = parseInt($(this).data("col"));
    deselectAll();
    selectColumn(ci);
  });

  // Row header click
  $(document).on("click", ".row-header", function () {
    const ri = parseInt($(this).data("row"));
    deselectAll();
    selectRow(ri);
  });

  // Grade cell click → inline edit
  $(document).on("click", ".grade-cell", function () {
    if ($(this).find("input").length) return; // already editing
    const currentText = $(this).text();
    const $input = $(`<input type="text" class="cell-input" value="${currentText}" />`);
    $(this).empty().append($input);
    $input.focus().select();

    $input.on("keydown", function (e) {
      if (e.key === "Enter") saveCell($(this));
    });
    $input.on("blur", function () {
      saveCell($(this));
    });
  });
}

/**
 * Commits a cell edit to the gradebook data and restores the cell text.
 */
function saveCell($input) {
  const $td = $input.closest("td");
  const ri = parseInt($td.data("row"));
  const ci = parseInt($td.data("col"));
  const raw = $input.val();

  setCell(gradebook, ri, ci, raw);

  const stored = readCell(gradebook, ri, ci);
  const display = isValidGrade(stored) ? stored : "";
  $td.text(display);

  // Refresh summary + chart if this cell belongs to the current selection
  if (currentSelection) {
    const inRow = currentSelection.type === "row" && currentSelection.index === ri;
    const inCol = currentSelection.type === "col" && currentSelection.index === ci;
    if (inRow || inCol) updateSummaryAndChart();
  }
}

// SELECTION  

/** De-selects every cell and resets the summary panel to its default state. */
function deselectAll() {
  $(".grade-cell").removeClass("selected");
  $(".col-header, .row-header").removeClass("header-active");
  currentSelection = null;
  clearSummary();
}


function selectRow(rowIndex) {
  if (!isValidRowIndex(gradebook, rowIndex)) return;
  currentSelection = {
    type: "row",
    index: rowIndex,
    label: gradebook.students[rowIndex],
  };
  $(`.grade-cell[data-row="${rowIndex}"]`).addClass("selected");
  $(`.row-header[data-row="${rowIndex}"]`).addClass("header-active");
  updateSummaryAndChart();
}


function selectColumn(colIndex) {
  if (!isValidColIndex(gradebook, colIndex)) return;
  currentSelection = {
    type: "col",
    index: colIndex,
    label: gradebook.headers[colIndex],
  };
  $(`.grade-cell[data-col="${colIndex}"]`).addClass("selected");
  $(`.col-header[data-col="${colIndex}"]`).addClass("header-active");
  updateSummaryAndChart();
}

// SUMMARY + CHART 

function updateSummaryAndChart() {
  if (!currentSelection) return;

  const values =
    currentSelection.type === "row"
      ? getRow(gradebook, currentSelection.index)
      : getColumn(gradebook, currentSelection.index);

  const stats = calculateStats(values);
  const typeLabel = currentSelection.type === "row" ? "Row" : "Column";
  const name = currentSelection.label;

  const fmt = (n) => (n !== null ? n.toFixed(2) : "—");

  // Update the five stat boxes
  $("#summary-label").text(`${typeLabel}: ${name}`);
  $("#summary-count").text(stats.count);
  $("#summary-mean").text(fmt(stats.mean));
  $("#summary-min").text(fmt(stats.min));
  $("#summary-max").text(fmt(stats.max));

  // Chart (Lab 06)
  // compute letter-grade frequencies for the current selection
  // note: the helper is defined in gradebook.js as `letterGradeFrequencies`
  const freq = letterGradeFrequencies(values);
  renderChart(freq, name);
  $("#chart-wrapper").addClass("active");
}

function clearSummary() {
  $("#summary-label").text("None: —");
  $("#summary-count").text("0");
  $("#summary-mean, #summary-min, #summary-max").text("—");
  d3.select("#chart-container").selectAll("*").remove();
  $("#chart-wrapper").removeClass("active");
}

// BOOTSTRAP  - Testing the code and adding logs for my ease of debugging

$(function () {
  const csvPath = "../data/grades.csv";

  loadGradesFromFile(csvPath)
    .then((gb) => {
      gradebook = gb;
      renderTable();
      console.log("[spreadsheet.js] Gradebook loaded ✓", gradebook);
    })
    .catch((err) => {
      console.error("[spreadsheet.js] CSV load error:", err);
      $("#table-container").html(
        `<p class="error-msg">⚠ Could not load grades.csv.<br>
         Serve the folder with: <code>python -m http.server 8000</code><br>
         Then open: <code>http://localhost:8000/src/pages/spreadsheet.html</code></p>`
      );
    });
});