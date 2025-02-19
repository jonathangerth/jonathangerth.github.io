document.addEventListener("DOMContentLoaded", function () {
  let database = [];
  let filters = {
    focus_cat: [],
    medical_cat: [],
    outcome_cat: [],
  };

  async function loadDatabase() {
    const response = await fetch("assets/database.csv");
    const text = await response.text();

    // Ensure text is read as UTF-8 (Handling Special Characters)
    const utf8decoder = new TextDecoder("utf-8"); 
    const decodedText = utf8decoder.decode(new TextEncoder().encode(text));

    const rows = decodedText.trim().split("\n").slice(1); // Skip header row

    database = rows.map(row => {
        const columns = parseCSVRow(row);

        if (columns.length < 7) return null; // Skip malformed rows

        return {
            year: columns[0].trim(),
            authors: decodeEntities(columns[1].trim()), // Decode special characters
            title: decodeEntities(columns[2].trim()),
            focus_cat: decodeEntities(columns[3].trim()),
            medical_cat: decodeEntities(columns[4].trim()),
            outcome_cat: decodeEntities(columns[5].trim()),
            doi_link: columns[6].trim(),
        };
    }).filter(item => item !== null);

    console.log("Database loaded:", database); // Debugging Output

    generateFilters(); 
    displayCards(); 
}


  function parseCSVRow(row) {
    const result = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === '"' && row[i + 1] === '"') {
        current += '"'; // Handle escaped quotes (e.g., `""`)
        i++; // Skip next quote
      } else if (char === '"') {
        insideQuotes = !insideQuotes; // Toggle insideQuotes flag
      } else if (char === "," && !insideQuotes) {
        result.push(current.trim()); // Add column when outside quotes
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim()); // Add last column
    return result;
  }

// Generate Filters Dynamically with Count
function generateFilters() {
    const categories = ["focus_cat", "medical_cat", "outcome_cat"];

    categories.forEach(category => {
        let container = document.getElementById(`${category}-filters`);
        if (!container) {
            console.error(`Filter container not found: #${category}-filters`);
            return;
        }

        // Count occurrences of each filter value
        let filterCounts = {};

        database.forEach(item => {
            if (item[category]) {
                item[category].split(";").map(value => value.trim()).forEach(value => {
                    filterCounts[value] = (filterCounts[value] || 0) + 1;
                });
            }
        });

        // Sort values alphabetically
        let sortedValues = Object.keys(filterCounts).sort();

        // Ensure we have values to display
        if (sortedValues.length === 0) {
            container.innerHTML = "<p>No options available.</p>";
            return;
        }

        // Generate checkboxes dynamically
        sortedValues.forEach(value => {
            let count = filterCounts[value]; // Get count for this filter value

            let checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = value;
            checkbox.id = `${category}-${value.replace(/\s+/g, "-").toLowerCase()}`;
            checkbox.addEventListener("change", () => updateFilters(category, value));

            let label = document.createElement("label");
            label.htmlFor = checkbox.id;
            label.appendChild(checkbox);
            
            // Main text for the option
            let textSpan = document.createElement("span");
            textSpan.textContent = ` ${value} `;

            // Bracketed count with a CSS class for styling
            let countSpan = document.createElement("span");
            countSpan.className = "filter-count"; 
            countSpan.textContent = `[${count}]`;

            // Append both to the label
            label.appendChild(textSpan);
            label.appendChild(countSpan);

            container.appendChild(label);
        });
    });
}



  // Update Filter Values & Refresh Cards
  function updateFilters(category, value) {
    let index = filters[category].indexOf(value);
    if (index > -1) {
      filters[category].splice(index, 1); // Remove if unchecked
    } else {
      filters[category].push(value); // Add if checked
    }
    displayCards();
  }

  // Display Cards Dynamically
  function displayCards() {
    let container = document.getElementById("database-cards");
    container.innerHTML = ""; // Clear previous entries

    let filteredData = database.filter((item) => {
        return (
            (filters.focus_cat.length === 0 ||
                filters.focus_cat.some((filter) =>
                    item.focus_cat.toLowerCase().includes(filter.toLowerCase().trim())
                )) &&
            (filters.medical_cat.length === 0 ||
                filters.medical_cat.some((filter) =>
                    item.medical_cat.toLowerCase().includes(filter.toLowerCase().trim())
                )) &&
            (filters.outcome_cat.length === 0 ||
                filters.outcome_cat.some((filter) =>
                    item.outcome_cat.toLowerCase().includes(filter.toLowerCase().trim())
                ))
        );
    });

    filteredData.forEach((item) => {
        let doiURL = item.doi_link.trim();
        let hasDOI = doiURL !== "" && doiURL !== "-" && /^https?:\/\//.test(doiURL);

        let card = document.createElement("div");
        card.className = "database-card";

        if (hasDOI) {
            card.addEventListener("click", () => window.open(doiURL, "_blank"));
        }

        // Function to generate tag sections only if the field has data
        const createTagSection = (heading, values) => {
            if (!values || values.trim() === "" || values.trim() === "-") return ""; // Hide section if empty
            let tagsArray = values.split(";").map(value => `<span class="tag">${value.trim()}</span>`).join("");
            return `
                <div class="tag-section">
                    <div class="tag-heading">${heading}</div>
                    <div class="tag-container">${tagsArray}</div>
                </div>
            `;
        };

        // Generate tag sections only if they have data
        let participantTags = createTagSection("Focus:", item.focus_cat);
        let medicalTags = createTagSection("Population:", item.medical_cat);
        let outcomeTags = createTagSection("Findings:", item.outcome_cat);

        // Combine tag sections and only add the wrapper if at least one exists
        let tagSectionHTML = participantTags || medicalTags || outcomeTags
            ? `<div class="card-tags">${participantTags}${medicalTags}${outcomeTags}</div>`
            : "";

        // Remove only the first and last double quotes if they exist
        let cleanTitle = item.title.replace(/^"(.*)"$/, "$1");

        card.innerHTML = `
            <div class="card-header">
                <div><p class="authors-year">${item.authors}, ${item.year}</p></div>
                ${hasDOI ? `<div class="doi-flag">Access Paper</div>` : ""}
            </div>
            <div class="card-title">${cleanTitle}</div>
            ${tagSectionHTML} <!-- Only added if any tags exist -->
        `;

        container.appendChild(card);
    });
}


  // Initialize
  loadDatabase();
});

document.addEventListener("DOMContentLoaded", function () {
  let toggle = document.querySelector(".header-toggle");
  let header = document.querySelector(".header");

  toggle.addEventListener("click", function () {
    header.classList.toggle("header-show");
    document.body.classList.toggle("menu-open"); // Push content when open
  });
});

document.getElementById("reset-filters").addEventListener("click", () => {
  // Uncheck all checkboxes
  document
    .querySelectorAll(".filter-options input[type='checkbox']")
    .forEach((checkbox) => {
      checkbox.checked = false;
    });

  // Reset dropdowns if applicable
  document.querySelectorAll(".filter-options select").forEach((select) => {
    select.selectedIndex = 0; // Reset to first option
  });

  // Trigger filtering logic again (if applicable)
  applyFilters(); // Ensure this function updates the displayed data
});

function decodeEntities(encodedString) {
    let textarea = document.createElement("textarea");
    textarea.innerHTML = encodedString;
    return textarea.value;
}

document.addEventListener("DOMContentLoaded", function () {
  const toggleButton = document.getElementById("toggle-filters");
  const filtersSection = document.querySelector(".filters");

  toggleButton.addEventListener("click", function () {
      const isCollapsed = filtersSection.classList.toggle("collapsed");
      // Toggle the button text between "Show Filters" and "Hide Filters"
      toggleButton.textContent = isCollapsed ? "Show Filters" : "Hide Filters";
  });
});
