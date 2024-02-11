const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("search");
const searchSuggestions = document.getElementById("searchSuggestions");

const params = new URLSearchParams(window.location.search);
const searchTermFromUrl = params.get("term");
if (searchTermFromUrl) {
  searchInput.value = decodeURIComponent(searchTermFromUrl);
}

searchInput.addEventListener("input", debounce(handleSuggestions, 300));

async function fetchSuggestions(searchTerm) {
  try {
    const response = await fetch(
      `/search/suggestions?term=${encodeURIComponent(searchTerm)}`
    );
    const suggestions = await response.json();
    renderSuggestions(suggestions);
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
    clearSuggestions();
    handleSearch();
  }
}

function renderSuggestions(suggestions) {
  const suggestionList = suggestions
    .map((suggestion) => `<div class="suggestion">${suggestion}</div>`)
    .join("");
  searchSuggestions.innerHTML = suggestionList;

  const suggestionElements = document.querySelectorAll(".suggestion");
  suggestionElements.forEach((suggestion) => {
    suggestion.addEventListener("click", () => {
      searchInput.value = suggestion.innerText;
      clearSuggestions(); 
      handleSearch();
    });
  });

  searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    handleSearch();
  });
}

function clearSuggestions() {
  searchSuggestions.innerHTML = "";
}

function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

function handleSuggestions() {
  const searchTerm = searchInput.value.trim();
  if (searchTerm !== "") {
    fetchSuggestions(searchTerm);
  } else {
    clearSuggestions();
  }
}

searchForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const searchTerm = searchInput.value.trim();
  if (searchTerm !== "") {
    searchInput.value = searchTerm; 
    searchForm.action = `/search?term=${encodeURIComponent(searchTerm)}`;
    searchForm.submit();
  }
});
