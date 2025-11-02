/**
 * ST Tools Hub - Search & Filter
 *
 * Gestisce ricerca e filtri categorie per applicazioni
 * Ricerca istantanea + filtro per categoria
 *
 * @author Simone Tosello (ST)
 * @company DHL Express Italy
 */

// ============================================================================
// STATE
// ============================================================================

let allApps = [];
let currentSearchTerm = '';
let currentCategory = 'all';

// ============================================================================
// INITIALIZATION
// ============================================================================

function initializeSearchFilter() {
  console.log('[Search & Filter] Inizializzazione...');

  // Search input
  const searchInput = document.getElementById('appSearch');
  const searchClear = document.getElementById('searchClear');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      handleSearch(e.target.value);
    });

    // Clear button
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        handleSearch('');
        searchInput.focus();
      });
    }
  }

  // Category tabs
  const categoryTabs = document.querySelectorAll('.category-tab');
  categoryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const category = tab.dataset.category;
      handleCategoryChange(category);
    });
  });

  console.log('[Search & Filter] Inizializzato con successo');
}

// ============================================================================
// SEARCH LOGIC
// ============================================================================

function handleSearch(searchTerm) {
  currentSearchTerm = searchTerm.toLowerCase().trim();

  // Show/hide clear button
  const searchClear = document.getElementById('searchClear');
  if (searchClear) {
    searchClear.style.display = currentSearchTerm ? 'flex' : 'none';
  }

  // Apply filters
  applyFilters();
}

// ============================================================================
// CATEGORY FILTER LOGIC
// ============================================================================

function handleCategoryChange(category) {
  currentCategory = category;

  // Update active tab
  const categoryTabs = document.querySelectorAll('.category-tab');
  categoryTabs.forEach(tab => {
    if (tab.dataset.category === category) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Apply filters
  applyFilters();
}

// ============================================================================
// APPLY FILTERS (Combined Search + Category)
// ============================================================================

function applyFilters() {
  const cards = document.querySelectorAll('.app-card');
  let visibleCount = 0;

  cards.forEach(card => {
    const appId = card.dataset.appId;
    const app = allApps.find(a => a.id === appId);

    if (!app) {
      card.style.display = 'none';
      return;
    }

    // Check category filter
    const matchesCategory = currentCategory === 'all' || app.category === currentCategory;

    // Check search filter
    const matchesSearch = !currentSearchTerm || (
      app.name.toLowerCase().includes(currentSearchTerm) ||
      app.description.toLowerCase().includes(currentSearchTerm) ||
      (app.category && app.category.toLowerCase().includes(currentSearchTerm)) ||
      (app.id && app.id.toLowerCase().includes(currentSearchTerm))
    );

    // Show/hide card
    const shouldShow = matchesCategory && matchesSearch;
    card.style.display = shouldShow ? 'flex' : 'none';

    if (shouldShow) visibleCount++;
  });

  // Show "no results" message if needed
  showNoResultsMessage(visibleCount);

  console.log(`[Search & Filter] Mostrate ${visibleCount}/${cards.length} app`);
}

// ============================================================================
// NO RESULTS MESSAGE
// ============================================================================

function showNoResultsMessage(visibleCount) {
  const appsGrid = document.getElementById('appsGrid');
  if (!appsGrid) return;

  // Remove existing no-results message
  const existingMessage = appsGrid.querySelector('.no-results');
  if (existingMessage) {
    existingMessage.remove();
  }

  // Show message if no results
  if (visibleCount === 0) {
    const message = document.createElement('div');
    message.className = 'no-results';

    const messageText = currentSearchTerm
      ? `Nessuna applicazione trovata per "${currentSearchTerm}"`
      : `Nessuna applicazione nella categoria "${currentCategory}"`;

    message.innerHTML = `
      <div class="no-results-icon">🔍</div>
      <h3>Nessun risultato</h3>
      <p>${messageText}</p>
      ${currentSearchTerm || currentCategory !== 'all' ? `
        <button class="btn btn-secondary" style="margin-top: 16px;" onclick="resetFilters()">
          Mostra tutte le app
        </button>
      ` : ''}
    `;

    appsGrid.appendChild(message);
  }
}

// ============================================================================
// RESET FILTERS
// ============================================================================

function resetFilters() {
  // Reset search
  const searchInput = document.getElementById('appSearch');
  if (searchInput) {
    searchInput.value = '';
  }

  currentSearchTerm = '';
  currentCategory = 'all';

  // Reset category tabs
  const categoryTabs = document.querySelectorAll('.category-tab');
  categoryTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.category === 'all');
  });

  // Hide clear button
  const searchClear = document.getElementById('searchClear');
  if (searchClear) {
    searchClear.style.display = 'none';
  }

  // Apply filters
  applyFilters();
}

// ============================================================================
// UPDATE CATEGORY COUNTS
// ============================================================================

function updateCategoryCounts(apps) {
  allApps = apps;

  const counts = {
    all: apps.length,
    Customs: 0,
    Logistics: 0,
    Monitoring: 0
  };

  apps.forEach(app => {
    if (app.category && counts.hasOwnProperty(app.category)) {
      counts[app.category]++;
    }
  });

  // Update count badges
  document.getElementById('countAll')?.textContent = counts.all;
  document.getElementById('countCustoms')?.textContent = counts.Customs;
  document.getElementById('countLogistics')?.textContent = counts.Logistics;
  document.getElementById('countMonitoring')?.textContent = counts.Monitoring;

  console.log('[Search & Filter] Category counts aggiornati:', counts);
}

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

document.addEventListener('keydown', (e) => {
  // Ctrl+F - Focus search
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    const searchInput = document.getElementById('appSearch');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  // Escape - Clear search
  if (e.key === 'Escape') {
    const searchInput = document.getElementById('appSearch');
    if (searchInput && document.activeElement === searchInput) {
      resetFilters();
      searchInput.blur();
    }
  }
});

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

window.searchFilter = {
  initialize: initializeSearchFilter,
  updateCounts: updateCategoryCounts,
  applyFilters: applyFilters,
  reset: resetFilters
};

// Esponi funzione reset globalmente per onclick HTML
window.resetFilters = resetFilters;

console.log('[ST Tools Hub] Search-filter.js caricato');
