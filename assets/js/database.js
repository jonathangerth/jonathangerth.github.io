document.addEventListener("DOMContentLoaded", function () {
  let database = [];
  let filters = {
    participant_cat: [],
    medical_cat: [],
    outcome_cat: [],
  };

  async function loadDatabase() {
    const response = await fetch("assets/database.csv");
    const text = await response.text();
    
    // Convert CSV text into rows, ensuring quoted fields are handled correctly
    const rows = text.trim().split("\n").slice(1); // Skip header row

    database = rows.map(row => {
        const columns = parseCSVRow(row); // Use our custom parser function

        if (columns.length < 7) return null; // Skip malformed rows

        return {
            year: columns[0].trim(),
            authors: columns[1].trim(),
            title: columns[2].trim(), // This now correctly preserves punctuation
            participant_cat: columns[3].trim(),
            medical_cat: columns[4].trim(),
            outcome_cat: columns[5].trim(),
            doi_link: columns[6].trim(),
        };
    }).filter(item => item !== null);

    console.log("Database loaded:", database); // Debugging Output

    generateFilters(); // ✅ Call after data is loaded
    displayCards(); // ✅ Call after data is loaded
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
      } else if (char === ',' && !insideQuotes) {
          result.push(current.trim()); // Add column when outside quotes
          current = "";
      } else {
          current += char;
      }
  }

  result.push(current.trim()); // Add last column
  return result;
}


  // Generate Filters Dynamically
  function generateFilters() {
    const categories = ["participant_cat", "medical_cat", "outcome_cat"];

    categories.forEach(category => {
        let container = document.getElementById(`${category}-filters`);
        if (!container) {
            console.error(`Filter container not found: #${category}-filters`);
            return;
        }

        // Collect unique filter options
        let uniqueValues = new Set();
        database.forEach(item => {
            if (item[category]) {
                item[category].split(";").map(value => value.trim()).forEach(value => {
                    uniqueValues.add(value);
                });
            }
        });

        let sortedValues = [...uniqueValues].sort();

        // Ensure we have values to display
        if (sortedValues.length === 0) {
            container.innerHTML = "<p>No options available.</p>";
            return;
        }

        // Generate checkboxes dynamically
        sortedValues.forEach(value => {
            let checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = value;
            checkbox.id = `${category}-${value.replace(/\s+/g, "-").toLowerCase()}`;
            checkbox.addEventListener("change", () => updateFilters(category, value));

            let label = document.createElement("label");
            label.htmlFor = checkbox.id;
            label.appendChild(checkbox);
            label.append(` ${value}`);

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
            (filters.participant_cat.length === 0 ||
                filters.participant_cat.includes(item.participant_cat.trim())) &&
            (filters.medical_cat.length === 0 ||
                filters.medical_cat.includes(item.medical_cat.trim())) &&
            (filters.outcome_cat.length === 0 ||
                filters.outcome_cat.includes(item.outcome_cat.trim()))
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

        // Function to generate tags inside a two-column div
        const createTagSection = (heading, values) => {
            let tagsArray = values.split(";").map(value => `<span class="tag">${value.trim()}</span>`).join("");
            return `
                <div class="tag-section">
                    <div class="tag-heading">${heading}</div>
                    <div class="tag-container">${tagsArray}</div>
                </div>
            `;
        };

        card.innerHTML = `
            ${hasDOI ? `<div class="doi-flag">Access Paper</div>` : ""}
            <div class="card-header">
                <p class="authors-year">${item.authors}, ${item.year}</p>
            </div>
            <div class="card-title">${item.title}</div>
            <div class="card-tags">
                ${createTagSection("Focus:", item.participant_cat)}
                ${createTagSection("Population:", item.medical_cat)}
                ${createTagSection("Findings:", item.outcome_cat)}
            </div>
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
