/**
 * ST Tools Hub - Updater (Renderer)
 *
 * Gestisce logica aggiornamenti per app e hub
 * Background checks, notifiche, download tracking
 *
 * @author Simone Tosello (ST)
 * @company DHL Express Italy
 */

// ============================================================================
// AUTO UPDATE CHECK ON STARTUP
// ============================================================================

// Controllo automatico aggiornamenti all'avvio (dopo 5 secondi)
setTimeout(() => {
  checkUpdatesOnStartup();
}, 5000);

async function checkUpdatesOnStartup() {
  // Controlla se abilitato nelle settings
  const settings = JSON.parse(localStorage.getItem('settings') || '{"autoUpdate": true}');

  if (!settings.autoUpdate) {
    console.log('[Updater] Auto-update disabilitato');
    return;
  }

  console.log('[Updater] Controllo aggiornamenti automatico...');

  try {
    const response = await window.electronAPI.checkAllUpdates();

    if (!response.success) {
      console.error('[Updater] Errore check updates:', response.error);
      return;
    }

    const updates = response.updates || [];

    if (updates.length > 0) {
      console.log(`[Updater] Trovati ${updates.length} aggiornamenti`);

      // Mostra notifica
      showUpdateNotification(updates);

      // Aggiorna badge header
      updateBadgeCount(updates.length);
    } else {
      console.log('[Updater] Tutte le app sono aggiornate');
    }

  } catch (error) {
    console.error('[Updater] Errore durante check updates:', error);
  }
}

// ============================================================================
// UPDATE NOTIFICATION
// ============================================================================

function showUpdateNotification(updates) {
  const count = updates.length;
  const appNames = updates.map(u => u.appName).join(', ');

  const message = count === 1
    ? `Aggiornamento disponibile per ${appNames}`
    : `${count} aggiornamenti disponibili: ${appNames}`;

  window.showToast(message, 'warning', 8000);
}

// ============================================================================
// UPDATE BADGE COUNT
// ============================================================================

function updateBadgeCount(count) {
  const badge = document.getElementById('updateBadge');
  const container = document.getElementById('updateBadgeContainer');

  if (!badge || !container) return;

  if (count > 0) {
    badge.textContent = count;
    container.style.display = 'flex';
    container.title = `${count} aggiornament${count > 1 ? 'i' : 'o'} disponibil${count > 1 ? 'i' : 'e'}`;

    // Click sul badge per mostrare lista aggiornamenti
    container.onclick = showUpdatesModal;
  } else {
    container.style.display = 'none';
  }
}

// ============================================================================
// UPDATES MODAL (lista aggiornamenti disponibili)
// ============================================================================

async function showUpdatesModal() {
  try {
    const response = await window.electronAPI.checkAllUpdates();

    if (!response.success || !response.updates || response.updates.length === 0) {
      window.showToast('Nessun aggiornamento disponibile', 'info');
      return;
    }

    const updates = response.updates;

    // Crea lista HTML
    const updatesList = updates.map(update => `
      <div style="
        padding: 12px;
        background: var(--bg-tertiary);
        border-radius: 8px;
        margin-bottom: 8px;
        border-left: 3px solid var(--warning-orange);
      ">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${update.appName}</strong>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
              v${update.currentVersion} → v${update.latestVersion}
            </div>
          </div>
          <button
            class="btn btn-sm btn-warning"
            onclick="window.open('${update.releaseUrl}', '_blank')"
          >
            Visualizza
          </button>
        </div>
      </div>
    `).join('');

    // Mostra in un toast più grande (semplificato)
    window.showToast(`
      <div style="max-width: 400px;">
        <strong style="display: block; margin-bottom: 12px; font-size: 16px;">
          Aggiornamenti disponibili (${updates.length})
        </strong>
        ${updatesList}
      </div>
    `, 'warning', 12000);

  } catch (error) {
    console.error('[Updater] Errore show updates modal:', error);
  }
}

// ============================================================================
// PERIODIC UPDATE CHECK (ogni 30 minuti)
// ============================================================================

// Check periodico ogni 30 minuti
const CHECK_INTERVAL = 30 * 60 * 1000; // 30 minuti

setInterval(() => {
  const settings = JSON.parse(localStorage.getItem('settings') || '{"autoUpdate": true}');

  if (settings.autoUpdate) {
    console.log('[Updater] Check periodico aggiornamenti...');
    checkUpdatesOnStartup();
  }
}, CHECK_INTERVAL);

// ============================================================================
// DOWNLOAD PROGRESS (futuro - quando implementato download diretto)
// ============================================================================

/**
 * Mostra progress bar download
 * @param {string} appId - ID app
 * @param {number} progress - Percentuale 0-100
 */
function showDownloadProgress(appId, progress) {
  const card = document.querySelector(`[data-app-id="${appId}"]`);
  if (!card) return;

  let progressBar = card.querySelector('.app-progress');

  if (!progressBar) {
    // Crea progress bar
    const cardFooter = card.querySelector('.card-footer');
    if (!cardFooter) return;

    progressBar = document.createElement('div');
    progressBar.className = 'app-progress';
    progressBar.innerHTML = `
      <div class="progress-bar">
        <div class="progress-fill" style="width: 0%"></div>
      </div>
      <div class="progress-text">Download: 0%</div>
    `;

    cardFooter.appendChild(progressBar);
  }

  // Aggiorna progress
  const fill = progressBar.querySelector('.progress-fill');
  const text = progressBar.querySelector('.progress-text');

  if (fill) fill.style.width = `${progress}%`;
  if (text) text.textContent = `Download: ${Math.round(progress)}%`;

  // Rimuovi quando completato
  if (progress >= 100) {
    setTimeout(() => {
      if (progressBar.parentNode) {
        progressBar.parentNode.removeChild(progressBar);
      }
    }, 2000);
  }
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

window.updater = {
  checkUpdatesOnStartup,
  updateBadgeCount,
  showDownloadProgress
};

console.log('[ST Tools Hub] Updater.js caricato');
