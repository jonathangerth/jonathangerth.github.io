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
          citation: columns[0],
          title: columns[1],
          participant_cat: columns[2],
          medical_cat: columns[3],
          outcome_cat: columns[4],
          doi_link: columns[5],
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

      // Check if container exists
      if (!container) {
        console.error(`Filter container not found: #${category}-filters`);
        return;
      }

      // Extract unique filter values
      let uniqueValues = [
        ...new Set(
          database.map((item) => item[category]?.trim()).filter(Boolean)
        ),
      ].sort();

      console.log(`Filter values for ${category}:`, uniqueValues); // Debugging output

      // Ensure we have values to display
      if (uniqueValues.length === 0) {
        container.innerHTML = "<p>No options available.</p>"; // Show message if empty
        return;
      }

      // Generate checkboxes dynamically
      uniqueValues.forEach((value) => {
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
      let card = document.createElement("a"); // Make the whole card a link
      card.href = item.doi_link;
      card.target = "_blank"; // Opens in a new tab
      card.className = "database-card";
      card.innerHTML = `
            <div class="card-content">
                <p><strong>Citation:</strong> ${item.citation}</p>
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
