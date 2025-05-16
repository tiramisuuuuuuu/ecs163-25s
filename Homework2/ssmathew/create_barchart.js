// I used chatgpt to help me in this assignment
// I referenced code given by the D3-graph-gallery

const  barchartMargin = { top: 0, right: 0, bottom: 0, left: 0 };

// Create a responsive view box for the barchart
var barchartSvg = d3.select("#barchart")
  .append("svg")
  .attr("preserveAspectRatio", "xMidYMid meet")
  .attr("viewBox", `-350 -100 1700 700`) // or whatever default size fits your data
  .classed("responsive-svg", true)
.append("g")
  .attr("transform", `translate(${ heatmapMargin.left},${ heatmapMargin.top})`);


// Get the actual size of the sankey container, affected by the view box size
function getbarchartContainerSize() {
  const barchartDiv = document.getElementById("barchart");
  return {
    barchartWidth: barchartDiv.clientWidth -  barchartMargin.left -  barchartMargin.right,
    barchartHeight: 400
  };
}
const { barchartWidth, barchartHeight } = getbarchartContainerSize();

// Add a title to the top of the svg
barchartSvg.append("text")
  .attr("x", barchartWidth / 2)
  .attr("y", -60)
  .attr("text-anchor", "middle")
  .style("font-size", "30px")
  .style("font-weight", "bold")
  .text("Frequency of Students in Different Grade Categories Having Above Avg Weekend Alcohol Use");

// Add a div for a legend
const legend = barchartSvg.append("g")
  .attr("transform", `translate(${heatmapWidth + 50}, 30)`); // Adjust position as needed

// Render the colored box
legend.append("rect")
  .attr("width", 20)
  .attr("height", 20)
  .attr("fill", "#FF69B4");

// Add descriptive text above the legend box
legend.append("text")
  .attr("x", 30)
  .attr("y", 15)
  .text("Above avg weekend alcohol consumption")
  .style("font-size", "30px")
  .attr("alignment-baseline", "middle");

// Render the data
d3.csv("student_mat.csv").then((data) => {
    /* 
        Create a new data object with labels for G1 scores (first period grades) aggregated 
        into different buckets / categories with increment of 5 points 
    */
    let aggregated_data = [];
    data.forEach(d => {
        if (d.G1 < 6) {
            for (let obj of aggregated_data) {
                if (obj.grade === "1-5" && d.Walc>2) {
                    obj.count++;
                    return;
                }
            }
            aggregated_data.push({ grade: "1-5", count: 1 });
        } else if (d.G1 < 11) {
            for (let obj of aggregated_data) {
                if (obj.grade === "6-10" && d.Walc>2) {
                    obj.count++;
                    return;
                }
            }
            aggregated_data.push({ grade: "6-10", count: 1 });
        } else if (d.G1 < 16) {
            for (let obj of aggregated_data) {
                if (obj.grade === "11-15" && d.Walc>2) {
                    obj.count++;
                    return;
                }
            }
            aggregated_data.push({ grade: "11-15", count: 1 });
        } else {
            for (let obj of aggregated_data) {
                if (obj.grade === "16-20" && d.Walc>2) {
                    obj.count++;
                    return;
                }
            }
            aggregated_data.push({ grade: "16-20", count: 1 });
        }
    });

    // Create x axis, scaled to the width of the barchart, using the different G1 score categories as a label, and with bands for the x labels
    var x = d3.scaleBand()
        .range([0, barchartWidth])
        .domain(aggregated_data.map(d => d.grade))
        .padding(0.2);
    
    // Add x-axis to the svg and style the column labels defined in the domain of x, place each one angled and below its band
    barchartSvg.append("g")
        .attr("transform", "translate(0," + barchartHeight + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end")
            .style("font-size", "30px");

    // Create y axis, scaled to the height of the barchart, using the 0 to max count as the range, and with bands for the y labels
    var y = d3.scaleLinear()
        .domain([0, d3.max(aggregated_data, d => d.count)])
        .range([barchartHeight, 0]);

    // Add y-axis to the svg and style the column labels defined in the domain of x, place each one angled and below its band
    barchartSvg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
            .style("font-size", "30px");

    // Create rectangles for bars, using the d.count for the height and with a color
    barchartSvg.selectAll("mybar")
        .data(aggregated_data)
        .enter()
        .append("rect")
            .attr("x", d => x(d.grade))
            .attr("y", d => y(d.count))
            .attr("width", x.bandwidth())
            .attr("height", d => barchartHeight - y(d.count))
            .attr("fill", "#FF69B4");

    // Add a title for the x-axis
    barchartSvg.append("text")
        .attr("x", barchartWidth / 2)
        .attr("y", 500)
        .attr("text-anchor", "middle")
        .style("font-size", "30px")
        .text("First Period Grade Categories");
    
    // Add a title for the y-axis
    barchartSvg.append("text")
        .attr("x", -350)
        .attr("y", 200)
        .attr("text-anchor", "middle")
        .style("font-size", "30px")
        .text("Frequency of Above Avg Weekend Alcohol Use");

});
