/**
 * ST Tools Hub - App Installer
 *
 * Gestisce installazione, disinstallazione e verifica app
 * Download, estrazione, cleanup
 *
 * @author Simone Tosello (ST)
 * @company DHL Express Italy
 */

const fs = require('fs');
const path = require('path');
const configManager = require('./config-manager');

// ============================================================================
// UNINSTALL APP
// ============================================================================

/**
 * Disinstalla un'applicazione
 * Rimuove la directory dell'app e aggiorna il registry
 *
 * @param {string} appId - ID dell'app da disinstallare
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function uninstallApp(appId) {
  try {
    console.log(`[App Installer] Disinstallazione ${appId}...`);

    // Carica app dal registry
    const apps = await configManager.loadAppsRegistry();
    const app = apps.find(a => a.id === appId);

    if (!app) {
      return {
        success: false,
        error: 'Applicazione non trovata nel registry'
      };
    }

    // Path della directory app
    const appPath = path.join(__dirname, '../../apps', appId);

    // Verifica se la directory esiste
    if (!fs.existsSync(appPath)) {
      console.log(`[App Installer] Directory ${appPath} non esiste, aggiorno solo registry`);

      // Aggiorna comunque il registry
      await configManager.updateAppInRegistry(appId, { installed: false });

      return {
        success: true,
        message: 'App già disinstallata, registry aggiornato'
      };
    }

    // Rimuovi la directory ricorsivamente
    await fs.promises.rm(appPath, { recursive: true, force: true });

    console.log(`[App Installer] Directory ${appPath} rimossa con successo`);

    // Aggiorna registry
    await configManager.updateAppInRegistry(appId, { installed: false });

    console.log(`[App Installer] ${app.name} disinstallato con successo`);

    return {
      success: true,
      message: `${app.name} disinstallato con successo`,
      appName: app.name
    };

  } catch (error) {
    console.error(`[App Installer] Errore disinstallazione ${appId}:`, error);

    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// CHECK IF APP IS INSTALLED
// ============================================================================

/**
 * Verifica se un'app è installata controllando l'esistenza del file .exe
 *
 * @param {string} appId - ID dell'app
 * @returns {Promise<boolean>}
 */
async function isAppInstalled(appId) {
  try {
    const apps = await configManager.loadAppsRegistry();
    const app = apps.find(a => a.id === appId);

    if (!app) return false;

    const appPath = path.join(__dirname, '../../', app.executablePath);
    return fs.existsSync(appPath);

  } catch (error) {
    console.error(`[App Installer] Errore verifica installazione:`, error);
    return false;
  }
}

// ============================================================================
// GET APP SIZE
// ============================================================================

/**
 * Calcola la dimensione di un'app installata
 *
 * @param {string} appId - ID dell'app
 * @returns {Promise<{success: boolean, size?: number, formatted?: string}>}
 */
async function getAppSize(appId) {
  try {
    const appPath = path.join(__dirname, '../../apps', appId);

    if (!fs.existsSync(appPath)) {
      return { success: false, error: 'App non installata' };
    }

    const size = await getDirectorySize(appPath);
    const formatted = formatBytes(size);

    return {
      success: true,
      size: size,
      formatted: formatted
    };

  } catch (error) {
    console.error(`[App Installer] Errore calcolo dimensione:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Calcola dimensione directory ricorsivamente
 *
 * @param {string} dirPath - Path directory
 * @returns {Promise<number>} - Dimensione in bytes
 */
async function getDirectorySize(dirPath) {
  let totalSize = 0;

  const files = await fs.promises.readdir(dirPath, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dirPath, file.name);

    if (file.isDirectory()) {
      totalSize += await getDirectorySize(filePath);
    } else {
      const stats = await fs.promises.stat(filePath);
      totalSize += stats.size;
    }
  }

  return totalSize;
}

/**
 * Formatta bytes in stringa leggibile
 *
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ============================================================================
// CLEAR APPS CACHE (Utility)
// ============================================================================

/**
 * Cancella tutte le app installate (reset completo)
 * ATTENZIONE: Usa con cautela!
 *
 * @returns {Promise<{success: boolean}>}
 */
async function clearAllApps() {
  try {
    const appsPath = path.join(__dirname, '../../apps');

    if (fs.existsSync(appsPath)) {
      await fs.promises.rm(appsPath, { recursive: true, force: true });
      await fs.promises.mkdir(appsPath, { recursive: true });
    }

    // Aggiorna registry
    const apps = await configManager.loadAppsRegistry();
    for (const app of apps) {
      await configManager.updateAppInRegistry(app.id, { installed: false });
    }

    console.log('[App Installer] Tutte le app sono state rimosse');

    return { success: true };

  } catch (error) {
    console.error('[App Installer] Errore clear all apps:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  uninstallApp,
  isAppInstalled,
  getAppSize,
  clearAllApps
};
