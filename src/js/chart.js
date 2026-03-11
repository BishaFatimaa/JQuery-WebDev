/**
 * chart.js
 * D3 bar-chart visualisation for letter-grade frequencies.
 * Lab 06 – Part 3
 */

// load the chart after creating it
function renderChart(freqObj, selectionLabel) {
  const containerId = "chart-container";
  const container = document.getElementById(containerId);
  if (!container) return;

  // Clear previous chart
  d3.select("#" + containerId).selectAll("*").remove();

  const letters = ["A", "B", "C", "D", "F"];
  const data = letters.map((l) => ({ letter: l, value: freqObj[l] || 0 }));

  // Responsive dimensions
  const totalWidth = container.clientWidth || 400;
  const margin = { top: 36, right: 24, bottom: 48, left: 52 };
  const width = totalWidth - margin.left - margin.right;
  const height = 220 - margin.top - margin.bottom;

  const svg = d3
    .select("#" + containerId)
    .append("svg")
    .attr("width", totalWidth)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Title
  svg
    .append("text")
    .attr("class", "chart-title")
    .attr("x", width / 2)
    .attr("y", -14)
    .attr("text-anchor", "middle")
    .text(selectionLabel ? `Grade Distribution — ${selectionLabel}` : "Grade Distribution");

  // Colour scale
  const colorMap = {
    A: "#000000",
    B: "#000000",
    C: "#000000",
    D: "#000000",
    F: "#000000",
  };
 
  // X scale
  const x = d3
    .scaleBand()
    .domain(letters)
    .range([0, width])
    .padding(0.28);

  // Y scale
  const y = d3.scaleLinear().domain([0, 1]).nice().range([height, 0]);

  // Grid lines
  svg
    .append("g")
    .attr("class", "chart-grid")
    .call(
      d3
        .axisLeft(y)
        .tickSize(-width)
        .tickFormat("")
        .ticks(5)
    );

  // Axes
  svg
    .append("g")
    .attr("class", "chart-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  svg
    .append("g")
    .attr("class", "chart-axis")
    .call(
      d3
        .axisLeft(y)
        .ticks(5)
        .tickFormat(d3.format(".0%"))
    );

  // Y-axis label
  svg
    .append("text")
    .attr("class", "chart-axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -42)
    .attr("text-anchor", "middle")
    .text("Frequency");

  // Bars with enter animation
  svg
    .selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => x(d.letter))
    .attr("width", x.bandwidth())
    .attr("y", height)          // start at baseline for animation
    .attr("height", 0)
    .attr("rx", 0)
    .attr("fill", (d) => colorMap[d.letter])
    .transition()
    .duration(500)
    .ease(d3.easeCubicOut)
    .attr("y", (d) => y(d.value))
    .attr("height", (d) => height - y(d.value));

  // Value labels on bars
  svg
    .selectAll(".bar-label")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "bar-label")
    .attr("x", (d) => x(d.letter) + x.bandwidth() / 2)
    .attr("y", (d) => Math.max(y(d.value) - 6, 8))
    .attr("text-anchor", "middle")
    .attr("opacity", 0)
    .text((d) => (d.value > 0 ? d3.format(".0%")(d.value) : ""))
    .transition()
    .delay(400)
    .duration(200)
    .attr("opacity", 1);
}