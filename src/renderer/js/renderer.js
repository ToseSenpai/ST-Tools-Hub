/**
 * ST Tools Hub - Renderer Main
 *
 * Controller principale dell'interfaccia utente
 * Gestisce inizializzazione, eventi UI, modali, toast notifications
 *
 * @author Simone Tosello (ST)
 * @company DHL Express Italy
 */

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[ST Tools Hub] Renderer inizializzato');

  // Carica versione hub nel footer e about
  await loadHubVersion();

  // Inizializza UI
  initializeUI();

  // Inizializza search & filter
  if (window.searchFilter && typeof window.searchFilter.initialize === 'function') {
    window.searchFilter.initialize();
  }

  // Inizializza shortcuts
  if (window.shortcuts && typeof window.shortcuts.initialize === 'function') {
    window.shortcuts.initialize();
  }

  // Carica applicazioni
  await loadApplications();

  // Setup listeners per aggiornamenti hub
  setupHubUpdateListeners();
});

// ============================================================================
// HUB VERSION
// ============================================================================

async function loadHubVersion() {
  try {
    const response = await window.electronAPI.getHubVersion();
    if (response.success) {
      const versionElements = document.querySelectorAll('#hubVersion, #aboutVersion');
      versionElements.forEach(el => {
        if (el) el.textContent = response.version;
      });
    }
  } catch (error) {
    console.error('[Renderer] Errore caricamento versione:', error);
  }
}

// ============================================================================
// UI INITIALIZATION
// ============================================================================

function initializeUI() {
  // Settings button
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', openSettingsModal);
  }

  // Modal close buttons
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
  const modalOverlay = document.getElementById('modalOverlay');

  if (closeModalBtn) closeModalBtn.addEventListener('click', closeSettingsModal);
  if (cancelSettingsBtn) cancelSettingsBtn.addEventListener('click', closeSettingsModal);
  if (modalOverlay) modalOverlay.addEventListener('click', closeSettingsModal);

  // Save settings button
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', saveSettings);
  }

  // Check updates button (footer)
  const checkUpdatesBtn = document.getElementById('checkUpdatesBtn');
  if (checkUpdatesBtn) {
    checkUpdatesBtn.addEventListener('click', checkAllUpdatesManual);
  }

  // Open apps folder button
  const openAppsFolderBtn = document.getElementById('openAppsFolderBtn');
  if (openAppsFolderBtn) {
    openAppsFolderBtn.addEventListener('click', openAppsFolder);
  }

  // GitHub link
  const githubLink = document.getElementById('githubLink');
  if (githubLink) {
    githubLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.open('https://github.com/ToseSenpai', '_blank');
    });
  }

  // Shortcuts help button
  const shortcutsHelpBtn = document.getElementById('shortcutsHelpBtn');
  if (shortcutsHelpBtn) {
    shortcutsHelpBtn.addEventListener('click', () => {
      if (window.shortcuts && typeof window.shortcuts.show === 'function') {
        window.shortcuts.show();
      }
    });
  }

  console.log('[Renderer] UI inizializzata');
}

// ============================================================================
// SETTINGS MODAL
// ============================================================================

function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function saveSettings() {
  const autoUpdate = document.getElementById('autoUpdateCheck')?.checked ?? true;
  const notifications = document.getElementById('notificationsCheck')?.checked ?? true;

  // Salva in localStorage (semplificato - si potrebbe usare IPC per salvare nel backend)
  localStorage.setItem('settings', JSON.stringify({
    autoUpdate,
    notifications
  }));

  showToast('Impostazioni salvate con successo', 'success');
  closeSettingsModal();
}

async function openAppsFolder() {
  try {
    await window.electronAPI.openAppsFolder();
    showToast('Cartella applicazioni aperta', 'success');
  } catch (error) {
    showToast('Errore apertura cartella: ' + error.message, 'error');
  }
}

// ============================================================================
// LOAD APPLICATIONS
// ============================================================================

async function loadApplications() {
  const appsGrid = document.getElementById('appsGrid');
  if (!appsGrid) return;

  try {
    // Mostra loading
    appsGrid.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Caricamento applicazioni...</p>
      </div>
    `;

    const response = await window.electronAPI.getApps();

    if (!response.success) {
      throw new Error(response.error);
    }

    const apps = response.apps;

    if (!apps || apps.length === 0) {
      appsGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <h3>Nessuna applicazione disponibile</h3>
          <p>Non sono state trovate applicazioni nel registry</p>
        </div>
      `;
      return;
    }

    // Renderizza le app (usa app-manager.js)
    if (typeof renderAppCards === 'function') {
      renderAppCards(apps);
    }

    console.log(`[Renderer] Caricate ${apps.length} applicazioni`);

  } catch (error) {
    console.error('[Renderer] Errore caricamento app:', error);
    appsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <h3>Errore caricamento</h3>
        <p>${error.message}</p>
      </div>
    `;
    showToast('Errore caricamento applicazioni: ' + error.message, 'error');
  }
}

// ============================================================================
// MANUAL UPDATE CHECK
// ============================================================================

async function checkAllUpdatesManual() {
  const btn = document.getElementById('checkUpdatesBtn');
  if (!btn) return;

  const originalText = btn.textContent;
  btn.textContent = 'Controllo...';
  btn.disabled = true;

  try {
    const response = await window.electronAPI.checkAllUpdates();

    if (!response.success) {
      throw new Error(response.error);
    }

    const updates = response.updates || [];

    if (updates.length === 0) {
      showToast('Tutte le applicazioni sono aggiornate!', 'success');
    } else {
      showToast(`Trovati ${updates.length} aggiornamenti disponibili`, 'warning');

      // Aggiorna badge
      updateUpdateBadge(updates.length);

      // Ricarica app per mostrare badge aggiornamenti
      await loadApplications();
    }

  } catch (error) {
    console.error('[Renderer] Errore check updates:', error);
    showToast('Errore controllo aggiornamenti: ' + error.message, 'error');
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

function updateUpdateBadge(count) {
  const badge = document.getElementById('updateBadge');
  const container = document.getElementById('updateBadgeContainer');

  if (badge && container) {
    if (count > 0) {
      badge.textContent = count;
      container.style.display = 'flex';
    } else {
      container.style.display = 'none';
    }
  }
}

// ============================================================================
// HUB UPDATE LISTENERS
// ============================================================================

function setupHubUpdateListeners() {
  // Aggiornamento hub disponibile
  window.electronAPI.onHubUpdateAvailable((info) => {
    console.log('[Renderer] Hub update available:', info.version);
    showHubUpdateNotification(info.version);
  });

  // Aggiornamento hub scaricato
  window.electronAPI.onHubUpdateDownloaded((info) => {
    console.log('[Renderer] Hub update downloaded:', info.version);
    showHubUpdateNotification(info.version, true);
  });

  // Install update button
  const installBtn = document.getElementById('installUpdateBtn');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      await window.electronAPI.installHubUpdate();
    });
  }

  // Dismiss update button
  const dismissBtn = document.getElementById('dismissUpdateBtn');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      const notification = document.getElementById('hubUpdateNotification');
      if (notification) notification.style.display = 'none';
    });
  }
}

function showHubUpdateNotification(version, downloaded = false) {
  const notification = document.getElementById('hubUpdateNotification');
  const versionSpan = document.getElementById('newHubVersion');
  const installBtn = document.getElementById('installUpdateBtn');

  if (notification && versionSpan) {
    versionSpan.textContent = version;

    if (downloaded) {
      installBtn.textContent = 'Installa e riavvia';
    } else {
      installBtn.textContent = 'Download in corso...';
      installBtn.disabled = true;
    }

    notification.style.display = 'block';
  }
}

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================

function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }[type] || 'ℹ';

  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 20px;">${icon}</span>
      <span style="flex: 1;">${message}</span>
    </div>
  `;

  container.appendChild(toast);

  // Auto remove dopo duration
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => {
      container.removeChild(toast);
    }, 300);
  }, duration);
}

// Esponi funzione globalmente per uso da altri moduli
window.showToast = showToast;

console.log('[ST Tools Hub] Renderer.js caricato');
