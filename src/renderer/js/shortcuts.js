/**
 * ST Tools Hub - Keyboard Shortcuts
 *
 * Gestisce scorciatoie tastiera locali (renderer)
 * Le scorciatoie globali sono gestite in main.js
 *
 * @author Simone Tosello (ST)
 * @company DHL Express Italy
 */

// ============================================================================
// SHORTCUTS CONFIGURATION
// ============================================================================

const SHORTCUTS = {
  // Search & Navigation
  'Ctrl+F': {
    description: 'Focus search bar',
    action: focusSearch
  },
  'Escape': {
    description: 'Close modals / Clear search',
    action: handleEscape
  },

  // Settings
  'Ctrl+,': {
    description: 'Open settings',
    action: openSettings
  },

  // App Management
  'Ctrl+R': {
    description: 'Reload apps',
    action: reloadApps
  },
  'Ctrl+Shift+U': {
    description: 'Check for updates',
    action: checkUpdates
  },

  // Help
  'Ctrl+/': {
    description: 'Show shortcuts help',
    action: showShortcutsHelp
  },
  'F1': {
    description: 'Show shortcuts help',
    action: showShortcutsHelp
  }
};

// ============================================================================
// INITIALIZATION
// ============================================================================

function initializeShortcuts() {
  console.log('[Shortcuts] Inizializzazione...');

  document.addEventListener('keydown', handleKeyPress);

  console.log('[Shortcuts] Inizializzato con successo');
  console.log('[Shortcuts] Shortcuts disponibili:', Object.keys(SHORTCUTS).length);
}

// ============================================================================
// KEY PRESS HANDLER
// ============================================================================

function handleKeyPress(event) {
  // Build shortcut string
  const modifiers = [];
  if (event.ctrlKey || event.metaKey) modifiers.push('Ctrl');
  if (event.shiftKey) modifiers.push('Shift');
  if (event.altKey) modifiers.push('Alt');

  let key = event.key;

  // Normalize key names
  if (key === '/') key = '/';
  if (key === ',') key = ',';
  if (key.length === 1) key = key.toUpperCase();

  const shortcut = modifiers.length > 0
    ? `${modifiers.join('+')}+${key}`
    : key;

  // Check if shortcut exists
  if (SHORTCUTS[shortcut]) {
    event.preventDefault();
    console.log(`[Shortcuts] Triggered: ${shortcut}`);
    SHORTCUTS[shortcut].action();
  }
}

// ============================================================================
// SHORTCUT ACTIONS
// ============================================================================

/**
 * Focus search bar
 */
function focusSearch() {
  const searchInput = document.getElementById('appSearch');
  if (searchInput) {
    searchInput.focus();
    searchInput.select();
  }
}

/**
 * Handle Escape key
 */
function handleEscape() {
  // Close settings modal
  const settingsModal = document.getElementById('settingsModal');
  if (settingsModal && settingsModal.style.display === 'flex') {
    settingsModal.style.display = 'none';
    return;
  }

  // Close shortcuts help
  const helpModal = document.getElementById('shortcutsHelpModal');
  if (helpModal && helpModal.style.display === 'flex') {
    helpModal.style.display = 'none';
    return;
  }

  // Clear search if focused
  const searchInput = document.getElementById('appSearch');
  if (searchInput && document.activeElement === searchInput) {
    if (window.resetFilters) {
      window.resetFilters();
    }
    searchInput.blur();
  }
}

/**
 * Open settings
 */
function openSettings() {
  const settingsModal = document.getElementById('settingsModal');
  if (settingsModal) {
    settingsModal.style.display = 'flex';
  }
}

/**
 * Reload apps
 */
async function reloadApps() {
  console.log('[Shortcuts] Ricaricamento app...');

  if (typeof loadApplications === 'function') {
    await loadApplications();
    window.showToast('Applicazioni ricaricate', 'success');
  } else {
    window.showToast('Funzione reload non disponibile', 'error');
  }
}

/**
 * Check for updates
 */
async function checkUpdates() {
  console.log('[Shortcuts] Controllo aggiornamenti...');

  if (typeof checkAllUpdatesManual === 'function') {
    await checkAllUpdatesManual();
  } else {
    window.showToast('Controllo aggiornamenti in corso...', 'info');

    // Fallback: call API directly
    try {
      const response = await window.electronAPI.checkAllUpdates();
      if (response.success) {
        const count = response.updates?.length || 0;
        if (count > 0) {
          window.showToast(`${count} aggiornamenti disponibili`, 'warning');
        } else {
          window.showToast('Tutte le app sono aggiornate', 'success');
        }
      }
    } catch (error) {
      window.showToast('Errore controllo aggiornamenti', 'error');
    }
  }
}

/**
 * Show shortcuts help modal
 */
function showShortcutsHelp() {
  // Check if modal already exists
  let helpModal = document.getElementById('shortcutsHelpModal');

  if (!helpModal) {
    // Create modal
    helpModal = createShortcutsHelpModal();
    document.body.appendChild(helpModal);
  }

  helpModal.style.display = 'flex';
}

/**
 * Create shortcuts help modal
 */
function createShortcutsHelpModal() {
  const modal = document.createElement('div');
  modal.id = 'shortcutsHelpModal';
  modal.className = 'modal';
  modal.style.display = 'none';

  // Group shortcuts by category
  const categories = {
    'Search & Navigation': ['Ctrl+F', 'Escape'],
    'Settings': ['Ctrl+,'],
    'App Management': ['Ctrl+R', 'Ctrl+Shift+U'],
    'Help': ['Ctrl+/', 'F1']
  };

  let shortcutsList = '';
  for (const [category, shortcuts] of Object.entries(categories)) {
    shortcutsList += `
      <div class="shortcuts-category">
        <h4>${category}</h4>
        ${shortcuts.map(key => `
          <div class="shortcut-item">
            <span class="shortcut-keys">${formatShortcutDisplay(key)}</span>
            <span class="shortcut-description">${SHORTCUTS[key].description}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  modal.innerHTML = `
    <div class="modal-overlay" onclick="document.getElementById('shortcutsHelpModal').style.display='none'"></div>
    <div class="modal-content" style="max-width: 700px;">
      <div class="modal-header">
        <h2>⌨️ Scorciatoie Tastiera</h2>
        <button class="modal-close" onclick="document.getElementById('shortcutsHelpModal').style.display='none'">&times;</button>
      </div>

      <div class="modal-body">
        <div class="shortcuts-help">
          ${shortcutsList}
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="document.getElementById('shortcutsHelpModal').style.display='none'">
          Chiudi
        </button>
      </div>
    </div>
  `;

  return modal;
}

/**
 * Format shortcut for display
 */
function formatShortcutDisplay(shortcut) {
  return shortcut
    .split('+')
    .map(key => `<kbd>${key}</kbd>`)
    .join(' + ');
}

// ============================================================================
// EXPORT
// ============================================================================

window.shortcuts = {
  initialize: initializeShortcuts,
  show: showShortcutsHelp
};

console.log('[ST Tools Hub] Shortcuts.js caricato');
