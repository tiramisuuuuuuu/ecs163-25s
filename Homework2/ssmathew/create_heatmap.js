// I used chatgpt to help me in this assignment
// I referenced code given by the D3-graph-gallery

const  heatmapMargin = { top: 50, right: 0, bottom: 10, left: 300 };

// Create a responsive view box for the heatmap
const heatmapSvg = d3.select("#heatmap")
  .append("svg")
  .attr("preserveAspectRatio", "xMidYMid meet")
  .attr("viewBox", `-100 0 1700 700`) // or whatever default size fits your data
  .classed("responsive-svg", true)
.append("g")
  .attr("transform", `translate(${ heatmapMargin.left},${ heatmapMargin.top})`);

// Get the actual size of the heatmap container, affected by the view box size
function getHeatmapContainerSize() {
  const heatmapDiv = document.getElementById("heatmap");
  return {
    heatmapWidth: heatmapDiv.clientWidth -  heatmapMargin.left -  heatmapMargin.right,
    heatmapHeight: 400
  };
}
const { heatmapWidth, heatmapHeight } = getHeatmapContainerSize();

// Create the labels of row and columns
var myGroups = ["studytime is <5 hrs", "no extracurriculars", "does not go out frequently", "no family education support", "family size > 3", "bad family relation"]
var myVars = ["studytime is <5 hrs", "no extracurriculars", "does not go out frequently", "no family education support", "family size > 3", "bad family relation"]

// Add a title above the heatmap
heatmapSvg.append("text")
  .attr("x", width / 2)
  .attr("y", -20) // adjust if needed
  .attr("text-anchor", "middle")
  .style("font-size", "30px")
  .style("font-weight", "bold")
  .text("Heatmap of Student Lifestyle and Circumstances vs Alcohol Use");

// Create x axis, scaled to the width of the heatmap, using the labels defined in myGroups, and with bands for the column labels
var x = d3.scaleBand()
  .range([ 0, heatmapWidth ])
  .domain(myGroups)
  .padding(0.01);

// Add x-axis to the svg and style the column labels defined in the domain of x, place each one angled and below its band
heatmapSvg.append("g")
  .attr("transform", "translate(-0," + heatmapHeight + ")")
  .call(d3.axisBottom(x))
  .selectAll("text")
    .style("text-anchor", "start")
    .attr("transform", "rotate(-80)")
    .attr("dx", "-13em")
    .attr("dy", "-0em")
    .style("font-size", "18px");

// Create y axis, scaled to the height of the heatmap, using the labels defined in myVars, and with bands for the row labels
var y = d3.scaleBand()
  .range([ heatmapHeight, 0 ])
  .domain(myVars)
  .padding(0.01);

// Add y-axis to the svg
heatmapSvg.append("g")
  .call(d3.axisLeft(y))
  .selectAll("text")
    .style("font-size", "30px");

// Create a color scale that takes normalized values
var myColor = d3.scaleLinear()
  .range(["white", "#FF69B4"])
  .domain([0, 1]);


// Function to verify if a datapoint fits the description of the specified column
function matches_col(col, d) {
    if (col=="studytime is <5 hrs") {
        if (+d.studytime < 3) {
            return true
        }
    } 

    if (col=="no extracurriculars") {
        if (d.activities === "no") {
            return true
        }
    } 

    if (col=="does not go out frequently") {
        if (+d.goout < 3) {
            return true
        }
    } 

    if (col=="no romantic partner") {
        if (d.romantic === "no") {
            return true
        }
    } 

    if (col=="no family education support") {
        if (d.famsup === "no") {
            return true
        }
    } 

    if (col=="family size > 3") {
        if (d.famsize === "GT3") {
            return true
        }
    }
    
    if (col=="bad family relation") {
        if (+d.famrel < 3) {
            return true
        }
    }
    
    return false;
}

// Render the data
d3.csv("student_mat.csv").then(data => {

  /*
    Aggregate the data so it can be used in the heatmap- 
    For every row,col pair in the heatmap, return the conditioned probability 
    that the student demographic has above avg weekend alcohol consumption
  */
  let aggregated_data = []
  for (i in myGroups) {
    for (j in myVars) {
      let rowLabel = myGroups[i]
      let colLabel = myVars[j]
      let sum = 0
      let count = 0
      data.forEach(d => {
        if (matches_col(rowLabel, d) && matches_col(colLabel, d)) {
          if (+d.Walc > 2) {
            sum = sum + 1
          }
          count++
        }
      })
      aggregated_data.push({ x: rowLabel, y: colLabel, value: sum/count })
    }
  }

  // Find the min and max heatspots in the heatmap, to use it for normalization
  let values = aggregated_data.map(d => d.value);
  let minVal = d3.min(values);
  let maxVal = d3.max(values);
  console.log(aggregated_data)

  // Render the heatmap squares, colored by the normalized correlation value
  heatmapSvg.selectAll()
    .data(aggregated_data)
    .enter()
    .append("rect")
      .attr("x", d => x(d.x))
      .attr("y", d => y(d.y))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .style("fill", d => {
        let normalized = (d.value - minVal) / (maxVal - minVal);
        return myColor(normalized);
      });

  // Define the width and height of the heatmap legend
  const legendWidth = 300;
  const legendHeight = 20;

  // Define the legend scale, with the same domain as the heatmap
  const legendScale = d3.scaleLinear()
    .domain([minVal, maxVal])
    .range([0, legendWidth]);

  // Keep track of definitions for the heatmap
  const defs = heatmapSvg.append("defs");

  // Create a definition for a linear gradient, to be able to build it up and use it in the end to render the gradient bar
  const linearGradient = defs.append("linearGradient")
    .attr("id", "linear-gradient");

  // Define the gradient to take up the entire space of its parent div
  linearGradient
    .attr("x1", "0%")
    .attr("x2", "100%")
    .attr("y1", "0%")
    .attr("y2", "0%");

  // Set the color stops (adjust colors based on your color scale)
  linearGradient.selectAll("stop")
    .data([
      {offset: "0%", color: myColor(0)},
      {offset: "100%", color: myColor(1)}
    ])
    .enter().append("stop")
      .attr("offset", d => d.offset)
      .attr("stop-color", d => d.color);

  // Render the legend with defined width, height, and linear-gradient def
  heatmapSvg.append("rect")
    .attr("x", 500) // adjust position
    .attr("y", heatmapHeight + 10)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#linear-gradient)");

  // Create an axis for the legend, 
  const legendAxis = d3.axisBottom(legendScale)
    .ticks(5);

  // Place the axis on the svg, bordering the bottom of the legend
  heatmapSvg.append("g")
    .attr("transform", `translate(500, ${heatmapHeight + 10 + legendHeight})`)
    .call(legendAxis);

  // Add a description for the legend, place it above the legend box
  heatmapSvg.append("text")
    .attr("x", 500)
    .attr("y", heatmapHeight)
    .text("Correlation to Above Avg Alcohol Consumption")
    .style("font-size", "20px")
    .style("fill", "black");

})

