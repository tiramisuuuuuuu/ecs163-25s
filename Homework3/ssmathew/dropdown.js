let dropdownSelection = "G1"

// toggle between showing the dropdown items and not
function toggleDropdown() {
  document.getElementById("myDropdown").classList.toggle("show");
}

// When a dropdown item is selected, update the dropdown box and the barchart
function filterBy(value, label) {
	dropdownSelection = value;
	document.getElementById("dropdownBtn").textContent = label + " ▼";
	document.getElementById("myDropdown").classList.remove("show");
  updateBarchart()
}