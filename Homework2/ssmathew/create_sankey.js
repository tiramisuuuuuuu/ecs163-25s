// I used chatgpt to help me in this assignment
// I referenced code given by the D3-graph-gallery

// Configure units and formatting to be used in sankey logic
var units = "students";
    // Set color scheme and number formatting to render sankey nodes
var formatNumber = d3.format(",.0f"),
    format = function(d) { return formatNumber(d) + " " + units; },
    color = d3.scaleOrdinal(d3.schemeAccent);
    
const margin = { top: 100, right: 10, bottom: 10, left: 150 };

// Create a responsive view box for the sankey diagram
const svg = d3.select("#sankey")
  .append("svg")
  .attr("preserveAspectRatio", "xMidYMid meet")
  .attr("viewBox", `0 0 2000 600`) // or whatever default size fits your data
  .classed("responsive-svg", true)
.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Get the actual size of the sankey container, affected by the view box size
function getContainerSize() {
  const sankeyDiv = document.getElementById("sankey");
  return {
    width: sankeyDiv.clientWidth - margin.left - margin.right,
    height: 400
  };
}
const { width, height } = getContainerSize();

// Set the sankey diagram attributes: thickness of node, height of node (affected by padding), and size of the svg
var sankey = d3.sankey()
    .nodeWidth(30)
    .nodePadding(20)
    .size([width, height]);

// Add a title above the diagram
svg.append("text")
  .attr("x", width / 2)
  .attr("y", -20)
  .attr("text-anchor", "middle")
  .style("font-size", "20px")
  .style("font-weight", "bold")
  .text("Distribution of Student Behaviors and Alcohol Use");

// Create labels to go under each node
const labels = ["Weekend Alcohol Consumption", "Hours Studied Weekly", "Is Involved in Extracurriculars", "Goes Out?", "Significant Other?", "Receives Support from Family", "Family Size", "Relationship with family", "First Period Grade"];
// Create a div to hold the labels
const labelGroup = svg.append("g")
  .attr("transform", `translate(0, ${height + 40})`);
// For each label, render it with even spacing between / under each node
labels.forEach((label, i) => {
  labelGroup.append("text")
    .attr("x", (width / (labels.length - 1)) * i)
    .attr("y", 0)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text(label);
});

// Render the data
d3.csv("student_mat.csv").then(data => {
    
    // Function to aggregate alcohol consumption data and return appropriate label
    function alcoholLabel(val) {
        return (+val <= 2) ? "Less than avg" : "Greater than avg";
    }

    // Function to return descriptive labels for studytime data
    function studyTimeLabel(d) {
        switch(d) {
            case "1": return "<2hrs";
            case "2": return "2-5hrs";
            case "3": return "5-10hrs";
            case "4": return ">10hrs";
            default: return d;
        }
    }


    // Keep a track of links in a temporary dictionary
    let linkCounts = {};

    // Function to add to linkCounts
    function addLink(source, target) {
        const key = source + "->" + target;
        linkCounts[key] = (linkCounts[key] || 0) + 1;
    }


    // Find mean G1 score (first period grade)
    let g1Avg = 0
    let numData = 0
    data.forEach(d => {
        g1Avg = g1Avg + +d.G1
        numData++
    })
    g1Avg = g1Avg / numData


    // For each data point, add to the link count between nodes
    data.forEach(d => {
        const alc = alcoholLabel(d.Walc);
        const study = studyTimeLabel(d.studytime);
        const extra = d.activities === "yes" ? "yes" : "no";
        const goesout = d.goout >= 3 ? "frequently" : "not frequently";
        const romantic = d.romantic === "yes" ? "has partner" : "no partner";
        const famsup = d.famsup === "yes" ? " yes" : " no";
        const famsize = d.famsize === "LE3" ? "<=3" : "Greater than 3";
        const famrel = d.famrel;
        const g1 = +d.G1 >= g1Avg ? "Higher than avg" : "Lower than avg";
        

        addLink(alc, study);
        addLink(study, extra);
        addLink(extra, goesout);
        addLink(goesout, romantic);
        addLink(romantic, famsup);
        addLink(famsup, famsize);
        addLink(famsize, famrel);
        addLink(famrel, g1);
    });

    // Create the nodes to be used in the sankey diagram
    let nodesSet = new Set();
    Object.keys(linkCounts).forEach(key => {
        const [source, target] = key.split("->");
        nodesSet.add(source);
        nodesSet.add(target);
    });
    let nodes = Array.from(nodesSet).map(name => ({ name }));
    console.log("All node names:", Array.from(nodesSet));


    // Helper function to find node index by name
    function nodeIndex(name) {
        return nodes.findIndex(n => n.name === name);
    }

    // // Create the links array with numeric source/target and values to be used in sankey logic
    let links = Object.entries(linkCounts).map(([key, value]) => {
        const [source, target] = key.split("->");
        return {
        source: nodeIndex(source),
        target: nodeIndex(target),
        value: value
        };
    });


    // Build the sankey layout
    sankey
        .nodes( nodes)
        .links(links)
        .layout(32);

    // Add the links
    svg.append("g").selectAll(".link")
        .data(links)
        .enter().append("path")
        .attr("class", "link")
        .attr("d", sankey.link())
        .style("stroke-width", d => Math.max(1, d.dy))
        .style("fill", "none")
        .style("stroke", "#000")
        .style("stroke-opacity", 0.2)
        .sort((a, b) => b.dy - a.dy);

  
    // Add the nodes
    let node = svg.append("g").selectAll(".node")
        .data( nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x},${d.y})`)
      
    // Add rectangles for nodes
    node.append("rect")
        .attr("height", d => d.dy)
        .attr("width", sankey.nodeWidth())
        .style("fill", d => d.color = color(d.name.replace(/ .*/, "")))
        .style("stroke", d => d3.rgb(d.color).darker(2))
        .append("title")
        .text(d => `${d.name}\n${format(d.value)}`);

    // Add node labels
    node.append("text")
        .attr("x", -6)
        .attr("y", d => d.dy / 2)
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .text(d => d.name)
        .filter(d => d.x < width / 2)
        .attr("x", 6 + sankey.nodeWidth())
        .attr("text-anchor", "start");
});
