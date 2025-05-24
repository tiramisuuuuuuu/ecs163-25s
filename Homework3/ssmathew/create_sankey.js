// I used chatgpt to help me in this assignment
// I referenced code given by the D3-graph-gallery

// Configure units and formatting to be used in sankey logic
var units = "students";
var formatNumber = d3.format(",.0f"),
    format = function(d) { return formatNumber(d) + " " + units; },
    color = d3.scaleOrdinal(d3.schemeAccent);

const margin = { top: 100, right: 10, bottom: 10, left: 150 };

// Create a responsive view box for the sankey diagram
const svg = d3.select("#sankey")
  .append("svg")
  .attr("preserveAspectRatio", "xMidYMid meet")
  .attr("viewBox", `0 0 2000 600`)
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

// Set the sankey diagram attributes
var sankey = d3.sankey()
    .nodeWidth(30)
    .nodePadding(20)
    .size([width, height]);

// Function to render the sankey diagram
function renderSankey(data, filterByLabels = null) {
    // Clear SVG
    svg.selectAll("*").remove();

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .style("font-size", "30px")
        .style("user-select", "none")
        .text("Distribution of Student Behaviors and Alcohol Use");

    // Add tip on how to use interaction
    svg.append("text")
        .attr("x", 160)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .style("user-select", "none")
        .text("↓ Click and drag to select nodes in the first column, to highlight a path ↓");

    // Add div to place x axis labels
    const labelGroup = svg.append("g")
        .attr("transform", `translate(0, ${height + 40})`);

    const labels = ["Weekend Alcohol Consumption", "Hours Studied Weekly", "Is Involved in Extracurriculars", "Goes Out?", "Significant Other?", "Receives Support from Family", "Family Size", "Relationship with family", "First Period Grade"];
    // Place each text label and space them evenly
    labels.forEach((label, i) => {
        labelGroup.append("text")
            .attr("x", (width / (labels.length - 1)) * i)
            .attr("y", 0)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("user-select", "none")
            .text(label);
    });

    // Function to rename Walc column values into descriptive labels
    function alcoholLabel(d) {
        if (!d || isNaN(+d)) return "unknown";
        switch(d.toString()) {
            case "1": return "very low";
            case "2": return "low";
            case "3": return "medium";
            case "4": return "high";
            case "5": return "very high";
            default: return "unknown";
        }
    }

    // Function to rename studytime column values into descriptive labels
    function studyTimeLabel(d) {
        if (!d || isNaN(+d)) return "unknown";
        switch(d.toString()) {
            case "1": return "<2hrs";
            case "2": return "2-5hrs";
            case "3": return "5-10hrs";
            case "4": return ">10hrs";
            default: return "unknown";
        }
    }

    // Function to rename famrel column values into descriptive labels
    function famRelLabel(d) {
        if (!d || isNaN(+d)) return "unknown";
        switch(d.toString()) {
            case "1": return "very bad";
            case "2": return "bad";
            case "3": return "okay";
            case "4": return "good";
            case "5": return "very good";
            default: return "unknown";
        }
    }

    // Keep track of links and the count of data points that align with the filter
    let linkCounts = {};
    let filteredLinkCounts = {};

    function addLink(source, target, addToFiltered) {
        if (!source || !target || source === "unknown" || target === "unknown") return;
        const key = source + "->" + target;
        linkCounts[key] = (linkCounts[key] || 0) + 1;
        if (addToFiltered) {
            filteredLinkCounts[key] = (filteredLinkCounts[key] || 0) + 1;
        }
    }

    // Find mean G1 score
    let g1Avg = 0;
    let numData = 0;
    data.forEach(d => {
        const g1 = +d.G1;
        if (!isNaN(g1)) {
            g1Avg += g1;
            numData++;
        }
    });
    g1Avg = numData > 0 ? g1Avg / numData : 0;
    console.log("G1 average:", g1Avg);

    // Build link counts
    data.forEach((d, i) => {
        // Validate required fields
        if (!d.Walc || !d.studytime || !d.activities || !d.goout || !d.romantic || !d.famsup || !d.famsize || !d.famrel || !d.G1) {
            console.warn(`Skipping invalid row ${i}:`, d);
            return;
        }

        const alc = alcoholLabel(d.Walc);

        const study = studyTimeLabel(d.studytime);
        const extra = d.activities === "yes" ? "yes" : "no";
        const goesout = !isNaN(+d.goout) ? (+d.goout >= 3 ? "frequently" : "not frequently") : "unknown";
        const romantic = d.romantic === "yes" ? "has partner" : "no partner";
        const famsup = d.famsup === "yes" ? " yes" : " no";
        const famsize = d.famsize === "LE3" ? "<=3" : "Greater than 3";
        const famrel = famRelLabel(d.famrel);
        const g1 = !isNaN(+d.G1) ? (+d.G1 >= g1Avg ? "Higher than avg" : "Lower than avg") : "unknown";

        let addToFiltered = false
        // Apply filter if provided
        if (filterByLabels && filterByLabels.includes(alc)) {
            addToFiltered = true
        };
        addLink(alc, study, addToFiltered);
        addLink(study, extra, addToFiltered);
        addLink(extra, goesout, addToFiltered);
        addLink(goesout, romantic, addToFiltered);
        addLink(romantic, famsup, addToFiltered);
        addLink(famsup, famsize, addToFiltered);
        addLink(famsize, famrel, addToFiltered);
        addLink(famrel, g1, addToFiltered);
    });

    // Create nodes
    let nodesSet = new Set();
    Object.keys(linkCounts).forEach(key => {
        const [source, target] = key.split("->");
        nodesSet.add(source);
        nodesSet.add(target);
    });
    let nodes = Array.from(nodesSet).map(name => ({ name }));

    // Create links array, it will use the total linkCounts, which will be the base/background sankey
    let links = Object.entries(linkCounts).map(([key, value]) => {
        const [source, target] = key.split("->");
        const sourceIndex = nodes.findIndex(n => n.name === source);
        const targetIndex = nodes.findIndex(n => n.name === target);
        if (sourceIndex >= 0 && targetIndex >= 0 && value > 0) {
            return {
                source: sourceIndex,
                target: targetIndex,
                value: value,
                filteredValue: filteredLinkCounts[key] || 0,
                isFiltered: filterByLabels && filteredLinkCounts[key] > 0
            };
        }
        return null;
    }).filter(link => link !== null);

    // Build the sankey layout
    try {
        sankey
            .nodes(nodes)
            .links(links)
            .layout(32);
    } catch (e) {
        console.error("Sankey layout error:", e);
        return;
    }

    // Create a g div to render the links
    const linkGroup = svg.append("g").attr("class", "links");
    // Render all links, with thickness based on the total link count between nodes
    linkGroup.selectAll(".background-link")
        .data(links)
        .enter().append("path")
        .attr("class", "background-link")
        .attr("d", sankey.link())
        .style("stroke-width", d => Math.max(1, d.dy))
        .style("fill", "none")
        .style("stroke", "#ccc")
        .style("stroke-opacity", 0.2)
        .sort((a, b) => b.dy - a.dy);

    // Add filtered links on top, with thickness based on the num filtered links between nodes
    linkGroup.selectAll(".foreground-link")
        .data(links.filter(d => d.isFiltered))
        .enter().append("path")
        .attr("class", "foreground-link")
        .attr("d", sankey.link())
        .style("stroke-width", d => Math.max(1, d.dy * (d.filteredValue / d.value)))
        .style("fill", "none")
        .style("stroke", "pink") // Highlight color
        .style("stroke-opacity", 0.7)
        .sort((a, b) => b.dy - a.dy);

    // Create a container to add the nodes
    let node = svg.append("g").selectAll(".node")
        .data(nodes)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    // Add rectangles for nodes and highlight the first column nodes that are in the filter
    node.append("rect")
        .attr("height", d => d.dy)
        .attr("width", sankey.nodeWidth())
        .style("fill", d => d.color = color(d.name.replace(/ .*/, "")))
        .style("stroke", d => {
            if (filterByLabels && d.x === 0 && filterByLabels.includes(d.name)) {
                return "red";
            }
            return d3.rgb(d.color).darker(2);
        })
        .style("stroke-width", d => {
            if (filterByLabels && d.x === 0 && filterByLabels.includes(d.name)) {
                return 3;
            }
            return 1;
        })
        .style("cursor", "default")
        .append("title")
        .text(d => `${d.name}\n${format(d.value || 0)}`);

    // Add node labels
    node.append("text")
        .attr("x", -6)
        .attr("y", d => d.dy / 2)
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .style("user-select", "none")
        .text(d => d.name)
        .filter(d => d.x < width / 2)
        .attr("x", 6 + sankey.nodeWidth())
        .attr("text-anchor", "start");
}

// Render the data
d3.csv("student_mat.csv").then(data => {
    // Render the initial sankey diagram
    renderSankey(data);

    // Init variable for draggable selection box
    let isSelecting = false;
    let startX = 0, startY = 0;

    // Define styling for draggable selection box
    const selectionBox = svg.append('rect')
        .attr('class', 'selection-box')
        .attr('fill', 'rgba(0, 0, 255, 0.3)')
        .attr('stroke', 'blue')
        .attr('stroke-width', 1)
        .style('display', 'none');

    // Get svgContainer to place the draggable selection box ontop of
    const svgContainer = d3.select("#sankey svg");

    // on mousedown within the svgContainer, set the draggable selection box to selecting state
    svgContainer.on('mousedown', function() {
        const [x, y] = d3.mouse(this);
        isSelecting = true;
        startX = x - margin.left;
        startY = y - margin.top;
        // define the top left corner of the draggable selection box
        selectionBox
            .attr('x', startX)
            .attr('y', startY)
            .attr('width', 0)
            .attr('height', 0)
            .style('display', 'block');
    });

    // on mousemove within the svgContainer, if the draggable selection box is selecting, update the bottom right corner of the draggable selection box
    svgContainer.on('mousemove', function() {
        if (!isSelecting) return;
        const [x, y] = d3.mouse(this);
        const currentX = x - margin.left;
        const currentY = y - margin.top;

        // update the bottom right corner of the draggable selection box
        selectionBox
            .attr('x', Math.min(currentX, startX))
            .attr('y', Math.min(currentY, startY))
            .attr('width', Math.abs(currentX - startX))
            .attr('height', Math.abs(currentY - startY));
    });

    // when releasing the mouseclick, complete the draggable selection
    svgContainer.on('mouseup', function() {
        if (!isSelecting) return;
        isSelecting = false;

        const [x, y] = d3.mouse(this);
        const adjustedEndX = x - margin.left;
        const adjustedEndY = y - margin.top;
        const minX = Math.min(startX, adjustedEndX);
        const maxX = Math.max(startX, adjustedEndX);
        const minY = Math.min(startY, adjustedEndY);
        const maxY = Math.max(startY, adjustedEndY);

        // Track selected nodes and labels
        const selectedNodes = new Set();
        const selectedNodeLabels = [];

        // Capture all nodes in the first column that were selected
        svg.selectAll(".node").each(function(d) {
            const nodeX = d.x;
            const nodeY = d.y;
            const nodeWidth = sankey.nodeWidth();
            const nodeHeight = d.dy;
            const isFirstColumn = d.x === 0;

            const isInX = nodeX >= minX && nodeX + nodeWidth <= maxX;
            const isInY = nodeY >= minY && nodeY + nodeHeight <= maxY;

            if (isInX && isInY && isFirstColumn) {
                selectedNodes.add(d);
                selectedNodeLabels.push(d.name);
            }
        });

        // Re-render SVG but filtered to highlight the selected nodes
        renderSankey(data, selectedNodeLabels.length > 0 ? selectedNodeLabels : null);

        // Highlight selected nodes by adding a red border
        svg.selectAll(".node").each(function(d) {
            if (selectedNodeLabels.includes(d.name) && d.x === 0) {
                d3.select(this).select("rect")
                    .style("stroke", "red")
                    .style("stroke-width", 3);
            }
        });

        // Hide selection box as the mouse click is released
        selectionBox.style('display', 'none');

        // Re-append selection box to ensure it’s on top
        svg.append('rect')
            .attr('class', 'selection-box')
            .attr('fill', 'rgba(0, 0, 255, 0.3)')
            .attr('stroke', 'blue')
            .attr('stroke-width', 1)
            .style('display', 'none')
            .style('z-index', '100');
    });
}).catch(error => {
    console.error("Error loading CSV:", error);
});