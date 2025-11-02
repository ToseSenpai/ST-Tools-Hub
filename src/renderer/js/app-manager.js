/**
 * ST Tools Hub - App Manager (Renderer)
 *
 * Gestisce rendering e interazioni delle card applicazioni
 * Lancio app, controllo aggiornamenti, UI card
 *
 * @author Simone Tosello (ST)
 * @company DHL Express Italy
 */

// ============================================================================
// RENDER APP CARDS
// ============================================================================

function renderAppCards(apps) {
  const appsGrid = document.getElementById('appsGrid');
  if (!appsGrid) return;

  // Clear grid
  appsGrid.innerHTML = '';

  apps.forEach(app => {
    const card = createAppCard(app);
    appsGrid.appendChild(card);
  });

  console.log(`[App Manager] Renderizzate ${apps.length} app cards`);

  // Update search/filter category counts
  if (window.searchFilter && typeof window.searchFilter.updateCounts === 'function') {
    window.searchFilter.updateCounts(apps);
  }
}

// ============================================================================
// CREATE APP CARD
// ============================================================================

function createAppCard(app) {
  const card = document.createElement('div');
  card.className = 'app-card';
  card.dataset.appId = app.id;

  // Determina stato app
  const isInstalled = app.installed === true;
  const statusClass = isInstalled ? 'installed' : 'not-installed';
  const statusText = isInstalled ? 'Installata' : 'Non installata';

  // Icon (usa icona se esiste, altrimenti placeholder)
  const iconHtml = app.icon
    ? `<img src="${app.icon}" class="app-icon" alt="${app.name} icon" onerror="this.outerHTML='<span class=\\'app-icon placeholder\\'>📦</span>'">`
    : `<span class="app-icon placeholder">📦</span>`;

  // Colore categoria (se specificato)
  const categoryColor = app.backgroundColor || '#666';

  card.innerHTML = `
    <!-- Card Header -->
    <div class="card-header">
      <div class="app-icon-container" style="background: linear-gradient(135deg, ${categoryColor}33, ${categoryColor}11);">
        ${iconHtml}
      </div>
      <div class="card-title-section">
        <h3 class="app-name">${app.name}</h3>
        <span class="app-category">${app.category || 'App'}</span>
      </div>
    </div>

    <!-- Card Body -->
    <div class="card-body">
      <p class="app-description">${app.description}</p>

      <div class="app-meta">
        <span class="app-version">
          <strong>v${app.version}</strong>
        </span>
        <span class="status-badge ${statusClass}">
          <span class="status-indicator"></span>
          ${statusText}
        </span>
      </div>
    </div>

    <!-- Card Footer -->
    <div class="card-footer">
      <div class="card-actions">
        ${createActionButtons(app, isInstalled)}
      </div>
    </div>
  `;

  // Attach event listeners
  attachCardEventListeners(card, app, isInstalled);

  return card;
}

// ============================================================================
// CREATE ACTION BUTTONS
// ============================================================================

function createActionButtons(app, isInstalled) {
  if (isInstalled) {
    return `
      <button class="btn btn-launch" data-action="launch">
        <span>▶</span> Avvia
      </button>
      <button class="btn btn-secondary btn-icon-small" data-action="check-update" title="Controlla aggiornamenti">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
      </button>
      <button class="btn btn-danger btn-icon-small" data-action="uninstall" title="Disinstalla applicazione">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </button>
    `;
  } else {
    return `
      <button class="btn btn-install" data-action="install">
        <span>⬇</span> Installa
      </button>
    `;
  }
}

// ============================================================================
// ATTACH EVENT LISTENERS
// ============================================================================

function attachCardEventListeners(card, app, isInstalled) {
  // Launch button
  const launchBtn = card.querySelector('[data-action="launch"]');
  if (launchBtn) {
    launchBtn.addEventListener('click', () => launchApp(app, card));
  }

  // Check update button
  const updateBtn = card.querySelector('[data-action="check-update"]');
  if (updateBtn) {
    updateBtn.addEventListener('click', () => checkAppUpdate(app, card));
  }

  // Install button
  const installBtn = card.querySelector('[data-action="install"]');
  if (installBtn) {
    installBtn.addEventListener('click', () => installApp(app, card));
  }

  // Uninstall button
  const uninstallBtn = card.querySelector('[data-action="uninstall"]');
  if (uninstallBtn) {
    uninstallBtn.addEventListener('click', () => uninstallApp(app, card));
  }
}

// ============================================================================
// LAUNCH APP
// ============================================================================

async function launchApp(app, card) {
  console.log(`[App Manager] Avvio ${app.name}...`);

  const launchBtn = card.querySelector('[data-action="launch"]');
  if (!launchBtn) return;

  // Disabilita button temporaneamente
  const originalHtml = launchBtn.innerHTML;
  launchBtn.disabled = true;
  launchBtn.innerHTML = '<span>⏳</span> Avvio...';

  try {
    const response = await window.electronAPI.launchApp(app.id);

    if (!response.success) {
      throw new Error(response.error);
    }

    // Successo
    console.log(`[App Manager] ${app.name} avviato con PID ${response.pid}`);
    window.showToast(`${app.name} avviato con successo`, 'success');

    // Effetto visivo temporaneo
    card.style.borderColor = 'var(--success-green)';
    setTimeout(() => {
      card.style.borderColor = '';
    }, 2000);

  } catch (error) {
    console.error(`[App Manager] Errore lancio ${app.name}:`, error);
    window.showToast(`Errore: ${error.message}`, 'error', 6000);
  } finally {
    launchBtn.disabled = false;
    launchBtn.innerHTML = originalHtml;
  }
}

// ============================================================================
// CHECK APP UPDATE
// ============================================================================

async function checkAppUpdate(app, card) {
  console.log(`[App Manager] Check update per ${app.name}...`);

  const updateBtn = card.querySelector('[data-action="check-update"]');
  if (!updateBtn) return;

  // Animazione button
  const originalHtml = updateBtn.innerHTML;
  updateBtn.disabled = true;
  updateBtn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;"></div>';

  try {
    const response = await window.electronAPI.checkAppUpdate(app.id);

    if (!response.success) {
      throw new Error(response.error);
    }

    const updateInfo = response.updateInfo;

    if (updateInfo.available) {
      // Aggiornamento disponibile
      window.showToast(
        `Aggiornamento disponibile per ${app.name}: v${updateInfo.latestVersion}`,
        'warning',
        6000
      );

      // Aggiorna UI card per mostrare update disponibile
      showUpdateAvailableInCard(card, updateInfo);

    } else {
      window.showToast(`${app.name} è già aggiornato (v${app.version})`, 'success');
    }

  } catch (error) {
    console.error(`[App Manager] Errore check update:`, error);
    window.showToast(`Errore controllo aggiornamento: ${error.message}`, 'error');
  } finally {
    updateBtn.disabled = false;
    updateBtn.innerHTML = originalHtml;
  }
}

// ============================================================================
// SHOW UPDATE AVAILABLE IN CARD
// ============================================================================

function showUpdateAvailableInCard(card, updateInfo) {
  // Cambia status badge
  const statusBadge = card.querySelector('.status-badge');
  if (statusBadge) {
    statusBadge.className = 'status-badge update-available';
    statusBadge.innerHTML = `
      <span class="status-indicator"></span>
      Aggiornamento disponibile
    `;
  }

  // Aggiungi pulsante update se non esiste
  const cardActions = card.querySelector('.card-actions');
  if (cardActions) {
    // Rimuovi button launch e update check temporaneamente
    cardActions.innerHTML = `
      <button class="btn btn-update" data-action="download-update">
        <span>⬇</span> Aggiorna a v${updateInfo.latestVersion}
      </button>
    `;

    // Attach listener
    const downloadBtn = cardActions.querySelector('[data-action="download-update"]');
    if (downloadBtn && updateInfo.downloadUrl) {
      downloadBtn.addEventListener('click', () => {
        // Apri URL download in browser
        window.open(updateInfo.downloadUrl, '_blank');
        window.showToast('Download avviato nel browser', 'info');
      });
    } else if (downloadBtn && updateInfo.releaseUrl) {
      downloadBtn.addEventListener('click', () => {
        window.open(updateInfo.releaseUrl, '_blank');
        window.showToast('Pagina release aperta', 'info');
      });
    }
  }

  // Effetto visivo
  card.style.borderColor = 'var(--warning-orange)';
}

// ============================================================================
// INSTALL APP
// ============================================================================

async function installApp(app, card) {
  console.log(`[App Manager] Installazione ${app.name}...`);

  // Per ora, apri pagina GitHub releases
  const repoUrl = `https://github.com/${app.repoOwner}/${app.repoName}/releases/latest`;

  window.showToast(
    `Apertura pagina download per ${app.name}...`,
    'info'
  );

  window.open(repoUrl, '_blank');

  // Messaggio istruzioni
  setTimeout(() => {
    window.showToast(
      `Scarica ed installa ${app.name}, poi riavvia ST Tools Hub`,
      'info',
      8000
    );
  }, 1000);
}

// ============================================================================
// UNINSTALL APP
// ============================================================================

async function uninstallApp(app, card) {
  console.log(`[App Manager] Richiesta disinstallazione ${app.name}...`);

  // Conferma con dialog custom
  const confirmed = await showUninstallConfirmation(app);

  if (!confirmed) {
    console.log(`[App Manager] Disinstallazione ${app.name} annullata`);
    return;
  }

  // Procedi con disinstallazione
  const uninstallBtn = card.querySelector('[data-action="uninstall"]');
  if (!uninstallBtn) return;

  // Disabilita bottoni durante l'operazione
  const cardActions = card.querySelector('.card-actions');
  const originalHTML = cardActions.innerHTML;

  cardActions.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; color: var(--warning-orange);">
      <div class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>
      <span>Disinstallazione...</span>
    </div>
  `;

  try {
    const response = await window.electronAPI.uninstallApp(app.id);

    if (!response.success) {
      throw new Error(response.error);
    }

    // Successo
    console.log(`[App Manager] ${app.name} disinstallato con successo`);

    window.showToast(
      `${app.name} disinstallato con successo`,
      'success'
    );

    // Aggiorna UI della card (torna a stato "non installato")
    cardActions.innerHTML = `
      <button class="btn btn-install" data-action="install">
        <span>⬇</span> Installa
      </button>
    `;

    // Attach listener per il nuovo bottone install
    const installBtn = cardActions.querySelector('[data-action="install"]');
    if (installBtn) {
      installBtn.addEventListener('click', () => installApp(app, card));
    }

    // Aggiorna status badge
    const statusBadge = card.querySelector('.status-badge');
    if (statusBadge) {
      statusBadge.className = 'status-badge not-installed';
      statusBadge.innerHTML = `
        <span class="status-indicator"></span>
        Non installata
      `;
    }

    // Effetto visivo temporaneo
    card.style.borderColor = 'var(--text-tertiary)';
    setTimeout(() => {
      card.style.borderColor = '';
    }, 2000);

  } catch (error) {
    console.error(`[App Manager] Errore disinstallazione ${app.name}:`, error);

    window.showToast(
      `Errore disinstallazione: ${error.message}`,
      'error',
      6000
    );

    // Ripristina UI
    cardActions.innerHTML = originalHTML;

    // Re-attach listeners
    attachCardEventListeners(card, app, true);
  }
}

/**
 * Mostra dialog di conferma disinstallazione
 *
 * @param {object} app - App da disinstallare
 * @returns {Promise<boolean>} - True se confermato
 */
async function showUninstallConfirmation(app) {
  return new Promise((resolve) => {
    // Crea modal di conferma
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'uninstallConfirmModal';
    modal.style.display = 'flex';

    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h2>🗑️ Conferma Disinstallazione</h2>
        </div>

        <div class="modal-body">
          <p style="margin-bottom: 16px;">
            Sei sicuro di voler disinstallare <strong>${app.name}</strong>?
          </p>
          <p style="font-size: 13px; color: var(--text-secondary);">
            Questa azione rimuoverà tutti i file dell'applicazione dalla cartella apps/.
            Potrai reinstallarla in qualsiasi momento.
          </p>
        </div>

        <div class="modal-footer">
          <button class="btn btn-danger" id="confirmUninstallBtn">
            Disinstalla
          </button>
          <button class="btn btn-secondary" id="cancelUninstallBtn">
            Annulla
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Handler bottoni
    const confirmBtn = modal.querySelector('#confirmUninstallBtn');
    const cancelBtn = modal.querySelector('#cancelUninstallBtn');
    const overlay = modal.querySelector('.modal-overlay');

    const cleanup = () => {
      document.body.removeChild(modal);
    };

    confirmBtn.addEventListener('click', () => {
      cleanup();
      resolve(true);
    });

    cancelBtn.addEventListener('click', () => {
      cleanup();
      resolve(false);
    });

    overlay.addEventListener('click', () => {
      cleanup();
      resolve(false);
    });

    // ESC per chiudere
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        cleanup();
        resolve(false);
        document.removeEventListener('keydown', escHandler);
      }
    };

    document.addEventListener('keydown', escHandler);
  });
}

// Esponi funzione globalmente
window.renderAppCards = renderAppCards;

console.log('[ST Tools Hub] App-manager.js caricato');
