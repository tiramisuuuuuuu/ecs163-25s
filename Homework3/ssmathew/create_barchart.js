// Set up margins and container
const barchartMargin = { top: 100, right: 100, bottom: 150, left: 150 };
let barchartSvg, xScale, yScale, xAxisGroup, yAxisGroup;
let allData; // Store the loaded data globally

// Initialize the barchart
function initBarchart() {
    // Create SVG with responsive viewBox
    barchartSvg = d3.select("#barchart")
        .append("svg")
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("viewBox", `0 0 1000 600`)
        .classed("responsive-svg", true)
        .append("g")
        .attr("transform", `translate(${barchartMargin.left},${barchartMargin.top})`);

    // Add title
    barchartSvg.append("text")
        .attr("x", 0)
        .attr("y", -50)
        .attr("text-anchor", "left")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text("Frequency of Students in Different Grade Categories Having Above Avg Weekend Alcohol Use");

    // Add legend div and place it towards the horizontal center
    const legend = barchartSvg.append("g")
        .attr("transform", "translate(0,-30)");
    // Create a legend box with color to correspond with the bars
    legend.append("rect")
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", "#FF69B4");
    // Create a text for the legend that gives meaning to the box of color
    legend.append("text")
        .attr("x", 30)
        .attr("y", 15)
        .text("Above avg weekend alcohol consumption")
        .style("font-size", "14px");

    // Define x scale, such as width and padding between bands
    xScale = d3.scaleBand()
        .range([0, 700])
        .padding(0.2);
    
    // Define y scale
    yScale = d3.scaleLinear()
        .range([400, 0]);

    // Define x axis group and initially position it on the screen
    xAxisGroup = barchartSvg.append("g")
        .attr("transform", "translate(0,400)");
    // Define y axis group
    yAxisGroup = barchartSvg.append("g");

    // Add x axis label
    barchartSvg.append("text")
        .attr("class", "x-axis-label")
        .attr("x", 350)
        .attr("y", 450)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Grade Ranges (With Max Grade of 20)");

    barchartSvg.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -200)
        .attr("y", -100)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Number of Students");

    // Load data
    d3.csv("student_mat.csv").then(data => {
        allData = data;
        updateBarchart(); // Initial render
    });
}

// Update barchart based on dropdown selection
function updateBarchart() {
    if (!allData) return;

    const gradeBins = [
        { grade: "1-5", min: 1, max: 5, count: 0 },
        { grade: "6-10", min: 6, max: 10, count: 0 },
        { grade: "11-15", min: 11, max: 15, count: 0 },
        { grade: "16-20", min: 16, max: 20, count: 0 }
    ];

    // Aggregate data (either of G1, G2, or G3, based on current dropdownSelection)
    allData.forEach(d => {
        if (+d.Walc > 2) { // Only count students with above avg alcohol use
            const gradeValue = +d[dropdownSelection || "G1"];
            const bin = gradeBins.find(b => gradeValue >= b.min && gradeValue <= b.max);
            if (bin) bin.count++;
        }
    });

    // Define x domain to traverse each of the grade range bins
    xScale.domain(gradeBins.map(d => d.grade));
    // Define the y range to be fixed 0-100 students
    yScale.domain([0, 100]);

    // Add initial animation for the rendering of axes
    xAxisGroup.transition().duration(500)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .style("font-size", "12px");

    // Add initial animation for the rendering of axes
    yAxisGroup.transition().duration(500)
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("font-size", "12px");

    // Select each bar and match it with the existing bins to allow for transition
    const bars = barchartSvg.selectAll(".bar")
        .data(gradeBins, d => d.grade);

    // Exit old bars
    bars.exit()
        .transition()
        .duration(500)
        .attr("y", yScale(0))
        .attr("height", 0)
        .remove();

    // Define a transition to the new height
    bars.transition()
        .duration(500)
        .attr("y", d => yScale(d.count))
        .attr("height", d => 400 - yScale(d.count));

    // Enter new bars
    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.grade))
        .attr("y", yScale(0))
        .attr("width", xScale.bandwidth())
        .attr("height", 0)
        .attr("fill", "#FF69B4")
        .transition()
        .duration(500)
        .attr("y", d => yScale(d.count))
        .attr("height", d => 400 - yScale(d.count));
}

initBarchart();