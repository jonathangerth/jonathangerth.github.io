document.addEventListener("DOMContentLoaded", function () {
  let database = [];
  let filters = {
    participant_cat: [],
    medical_cat: [],
    outcome_cat: [],
  };

  // Load CSV Data
  async function loadDatabase() {
    const response = await fetch("assets/database.csv");
    const text = await response.text();
    const rows = text
      .split("\n")
      .slice(1)
      .filter((row) => row.trim() !== ""); // Remove empty lines

    database = rows
      .map((row) => {
        const columns = row.split(",").map((col) => (col ? col.trim() : "")); // Trim & Handle Undefined

        if (columns.length < 6) return null; // Skip incomplete rows

        return {
          year: columns[0],
          authors: columns[1],
          title: columns[2],
          participant_cat: columns[3],
          medical_cat: columns[4],
          outcome_cat: columns[5],
          doi_link: columns[6],
        };
      })
      .filter((item) => item !== null);

    console.log("Database loaded:", database); // Debugging Output

    generateFilters(); // ✅ Call after data is loaded
    displayCards(); // ✅ Call after data is loaded
  }

  // Generate Filters Dynamically
  function generateFilters() {
    const categories = ["participant_cat", "medical_cat", "outcome_cat"];

    categories.forEach((category) => {
      let container = document.getElementById(`${category}-filters`);
      if (!container) {
        console.error(`Filter container not found: #${category}-filters`);
        return;
      }

      // Collect all unique filter options
      let uniqueValues = new Set();

      database.forEach((item) => {
        if (item[category]) {
          // Split multiple values by semicolon, trim whitespace
          item[category]
            .split(";")
            .map((value) => value.trim())
            .forEach((value) => {
              uniqueValues.add(value);
            });
        }
      });

      let sortedValues = [...uniqueValues].sort();
      console.log(`Filter values for ${category}:`, sortedValues); // Debugging

      // Ensure we have values to display
      if (sortedValues.length === 0) {
        container.innerHTML = "<p>No options available.</p>";
        return;
      }

      // Generate checkboxes dynamically
      sortedValues.forEach((value) => {
        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = value;
        checkbox.id = `${category}-${value.replace(/\s+/g, "-").toLowerCase()}`;
        checkbox.addEventListener("change", () =>
          updateFilters(category, value)
        );

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
        
        // Ensure link starts with "http://" or "https://", otherwise add "https://"
        if (!/^https?:\/\//.test(doiURL)) {
            doiURL = "https://" + doiURL;
        }
    
        let card = document.createElement("a"); // Make the whole card a link
        card.href = doiURL;
        card.target = "_blank"; // Opens in a new tab
        card.rel = "noopener noreferrer"; // Security fix for opening new tabs
        card.className = "database-card";
        card.innerHTML = `
            <div class="card-content">
                <p><strong>Year:</strong> ${item.year}</p>
                <p><strong>Author:</strong> ${item.authors}</p>
                <p><strong>Title:</strong> ${item.title}</p>
                <p><strong>Participant Type:</strong> ${item.participant_cat}</p>
                <p><strong>Medical Categorization:</strong> ${item.medical_cat}</p>
                <p><strong>Outcome Category:</strong> ${item.outcome_cat}</p>
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
