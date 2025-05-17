document.addEventListener("DOMContentLoaded", function () {
  // Database and filter logic
  let database = [];
  let filters = {
    focus_cat: [],
    medical_cat: [],
    outcome_cat: [],
  };

  async function loadDatabase() {
    try {
      const response = await fetch("assets/database.csv");
      if (!response.ok) throw new Error("Network response was not ok");
      const text = await response.text();

      // Ensure text is read as UTF-8 (Handling Special Characters)
      const utf8decoder = new TextDecoder("utf-8");
      const decodedText = utf8decoder.decode(new TextEncoder().encode(text));

      const rows = decodedText.trim().split("\n").slice(1); // Skip header row

      database = rows
        .map((row) => {
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
        })
        .filter((item) => item !== null);
      generateFilters();
      displayCards();
    } catch (error) {
      // Show user-friendly error message
      const container = document.getElementById("database-cards");
      if (container) {
        container.innerHTML =
          '<div class="error-message">Couldn’t load data. Please try again later.</div>';
      }
      // Optionally log error for debugging
      console.error("Failed to load database:", error);
    }
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

    categories.forEach((category) => {
      let container = document.getElementById(`${category}-filters`);
      if (!container) return;

      let filterCounts = {};

      database.forEach((item) => {
        if (item[category]) {
          let values = item[category].split(";").map((value) => value.trim());
          values.forEach((value) => {
            filterCounts[value] = (filterCounts[value] || 0) + 1;
          });
        }
      });

      let sortedValues = Object.keys(filterCounts).sort();
      if (sortedValues.length === 0) {
        container.innerHTML = "<p>No options available.</p>";
        return;
      }

      sortedValues.forEach((value) => {
        let count = filterCounts[value];

        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = value;
        checkbox.id = `${category}-${value.replace(/\s+/g, "-").toLowerCase()}`;
        checkbox.setAttribute("aria-label", `${category.replace("_cat", "").replace("_", " ")}: ${value}`);
        checkbox.addEventListener("change", () => {
          updateFilters(category, value);
          debouncedUpdateFilterCounts();
        });

        let label = document.createElement("label");
        label.htmlFor = checkbox.id;
        label.appendChild(checkbox);

        let textSpan = document.createElement("span");
        textSpan.textContent = ` ${value} `;

        let countSpan = document.createElement("span");
        countSpan.className = "filter-count";
        countSpan.textContent = `[${count}]`;

        label.appendChild(textSpan);
        label.appendChild(countSpan);
        container.appendChild(label);
      });
    });
  }

  // Debounce utility
  function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // Debounced version of updateFilterCounts
  const debouncedUpdateFilterCounts = debounce(updateFilterCounts, 100);

  function updateFilterCounts() {
    const categories = ["focus_cat", "medical_cat", "outcome_cat"];
    let filteredData = getFilteredData();

    categories.forEach((category) => {
      let filterCounts = {};

      filteredData.forEach((item) => {
        if (item[category]) {
          let values = item[category].split(";").map((value) => value.trim());
          values.forEach((value) => {
            filterCounts[value] = (filterCounts[value] || 0) + 1;
          });
        }
      });

      document
        .querySelectorAll(`#${category}-filters label`)
        .forEach((label) => {
          let checkbox = label.querySelector("input[type='checkbox']");
          let countSpan = label.querySelector(".filter-count");
          let filterValue = checkbox.value.trim();

          let count = filterCounts[filterValue] || 0;
          countSpan.textContent = `[${count}]`;

          if (count === 0) {
            label.classList.add("disabled-filter");
          } else {
            label.classList.remove("disabled-filter");
          }
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
    debouncedUpdateFilterCounts(); // Use debounced version
  }

  function getFilteredData() {
    return database.filter((item) => {
      let focusCat = item.focus_cat
        ? item.focus_cat.split(";").map((v) => v.trim())
        : [];
      let medicalCat = item.medical_cat
        ? item.medical_cat.split(";").map((v) => v.trim())
        : [];
      let outcomeCat = item.outcome_cat
        ? item.outcome_cat.split(";").map((v) => v.trim())
        : [];

      return (
        (filters.focus_cat.length === 0 ||
          filters.focus_cat.some((filter) => focusCat.includes(filter))) &&
        (filters.medical_cat.length === 0 ||
          filters.medical_cat.some((filter) => medicalCat.includes(filter))) &&
        (filters.outcome_cat.length === 0 ||
          filters.outcome_cat.some((filter) => outcomeCat.includes(filter)))
      );
    });
  }

  // Display Cards Dynamically (use DocumentFragment for batching)
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

    // Use DocumentFragment for efficient DOM updates
    const fragment = document.createDocumentFragment();

    filteredData.forEach((item, idx) => {
      let doiURL = item.doi_link.trim();
      let hasDOI =
        doiURL !== "" && doiURL !== "-" && /^https?:\/\//.test(doiURL);

      let card = document.createElement("div");
      card.className = "database-card";
      card.setAttribute("data-card-idx", idx);

      // Accessibility: Make card focusable and act as a button if clickable
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `Access paper: ${item.title}`);

      // Card expand/collapse logic
      card.addEventListener("click", function (e) {
        // If the click originated from the .doi-flag, do not expand/collapse
        if (e.target.classList.contains("doi-flag")) return;
        document.querySelectorAll(".database-card.card-expanded").forEach((el) => {
          if (el !== card) el.classList.remove("card-expanded");
        });
        card.classList.toggle("card-expanded");
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          card.click();
          e.preventDefault();
        }
      });

      // Function to generate tag sections only if the field has data
      const createTagSection = (heading, values) => {
        if (!values || values.trim() === "" || values.trim() === "-") return ""; // Hide section if empty
        let tagsArray = values
          .split(";")
          .map((value) => `<span class="tag">${value.trim()}</span>`)
          .join("");
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
      let tagSectionHTML =
        participantTags || medicalTags || outcomeTags
          ? `<div class="card-tags">${participantTags}${medicalTags}${outcomeTags}</div>`
          : "";

      // Remove only the first and last double quotes if they exist
      let cleanTitle = item.title.replace(/^"(.*)"$/, "$1");

      // Build card inner HTML, but add a placeholder for .doi-flag if present
      card.innerHTML = `
            <div class="card-header">
                <div><p class="authors-year">${item.authors}, ${item.year}</p></div>
                ${hasDOI ? `<div class="doi-flag" tabindex="0" role="button" aria-label="Open paper in new tab">Access Paper</div>` : ""}
            </div>
            <div class="card-title">${cleanTitle}</div>
            ${tagSectionHTML} <!-- Only added if any tags exist -->
        `;

      // Add click and keyboard handler for .doi-flag
      if (hasDOI) {
        const doiFlag = card.querySelector('.doi-flag');
        if (doiFlag) {
          doiFlag.addEventListener('click', (e) => {
            e.stopPropagation();
            window.open(doiURL, "_blank");
          });
          doiFlag.addEventListener('keydown', (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              window.open(doiURL, "_blank");
            }
          });
        }
      }

      fragment.appendChild(card);
    });

    container.appendChild(fragment);
  }

  // Reset filters logic (single listener)
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

    filters = { focus_cat: [], medical_cat: [], outcome_cat: [] };
    displayCards();
    updateFilterCounts(); // Reset filter counts
  });

  // Header toggle logic
  let toggle = document.querySelector(".header-toggle");
  let header = document.querySelector(".header");
  if (toggle && header) {
    toggle.addEventListener("click", function () {
      header.classList.toggle("header-show");
      document.body.classList.toggle("menu-open"); // Push content when open
    });
  }

  // Filter section toggle logic
  const toggleButton = document.getElementById("toggle-filters");
  const filtersSection = document.querySelector(".filters");
  if (toggleButton && filtersSection) {
    toggleButton.addEventListener("click", function () {
      const isCollapsed = filtersSection.classList.toggle("collapsed");
      // Toggle the button text and icon
      if (isCollapsed) {
        toggleButton.innerHTML = '<i id="arrow-icon" class="bi bi-arrow-down"></i> Show Filters';
      } else {
        toggleButton.innerHTML = '<i id="arrow-icon" class="bi bi-arrow-up"></i> Hide Filters';
      }
    });
  }

  // Initialize database loading
  loadDatabase();
});

function decodeEntities(encodedString) {
  let textarea = document.createElement("textarea");
  textarea.innerHTML = encodedString;
  return textarea.value;
}


