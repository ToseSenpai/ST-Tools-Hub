/**
 * ST Tools Hub - Config Manager
 *
 * Gestione caricamento e salvataggio configurazioni
 * Gestisce apps-registry.json e settings.json
 *
 * @author Simone Tosello (ST)
 * @company DHL Express Italy
 */

const fs = require('fs');
const path = require('path');

// Percorsi config
const CONFIG_DIR = path.join(__dirname, '../../config');
const APPS_REGISTRY_PATH = path.join(CONFIG_DIR, 'apps-registry.json');
const SETTINGS_PATH = path.join(CONFIG_DIR, 'settings.json');

/**
 * Carica il registry delle applicazioni
 *
 * @returns {Promise<Array>} - Array di oggetti app
 */
async function loadAppsRegistry() {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(APPS_REGISTRY_PATH)) {
        reject(new Error('File apps-registry.json non trovato'));
        return;
      }

      const data = fs.readFileSync(APPS_REGISTRY_PATH, 'utf-8');
      const config = JSON.parse(data);

      if (!config.apps || !Array.isArray(config.apps)) {
        reject(new Error('Formato apps-registry.json invalido'));
        return;
      }

      console.log(`[Config Manager] Caricate ${config.apps.length} app dal registry`);
      resolve(config.apps);

    } catch (error) {
      reject(new Error(`Errore caricamento apps-registry: ${error.message}`));
    }
  });
}

/**
 * Salva il registry delle applicazioni
 *
 * @param {Array} apps - Array di app da salvare
 * @returns {Promise<boolean>}
 */
async function saveAppsRegistry(apps) {
  return new Promise((resolve, reject) => {
    try {
      // Crea directory se non esiste
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
      }

      const data = JSON.stringify({ apps }, null, 2);
      fs.writeFileSync(APPS_REGISTRY_PATH, data, 'utf-8');

      console.log('[Config Manager] Apps registry salvato con successo');
      resolve(true);

    } catch (error) {
      reject(new Error(`Errore salvataggio apps-registry: ${error.message}`));
    }
  });
}

/**
 * Carica settings utente
 *
 * @returns {Promise<object>} - Oggetto settings
 */
async function loadSettings() {
  return new Promise((resolve) => {
    try {
      // Se non esiste, ritorna settings default
      if (!fs.existsSync(SETTINGS_PATH)) {
        const defaultSettings = getDefaultSettings();
        resolve(defaultSettings);
        return;
      }

      const data = fs.readFileSync(SETTINGS_PATH, 'utf-8');
      const settings = JSON.parse(data);

      console.log('[Config Manager] Settings caricati');
      resolve(settings);

    } catch (error) {
      console.error('[Config Manager] Errore caricamento settings, uso default:', error);
      resolve(getDefaultSettings());
    }
  });
}

/**
 * Salva settings utente
 *
 * @param {object} settings - Oggetto settings
 * @returns {Promise<boolean>}
 */
async function saveSettings(settings) {
  return new Promise((resolve, reject) => {
    try {
      // Crea directory se non esiste
      if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
      }

      const data = JSON.stringify(settings, null, 2);
      fs.writeFileSync(SETTINGS_PATH, data, 'utf-8');

      console.log('[Config Manager] Settings salvati con successo');
      resolve(true);

    } catch (error) {
      reject(new Error(`Errore salvataggio settings: ${error.message}`));
    }
  });
}

/**
 * Ottieni settings di default
 *
 * @returns {object} - Settings default
 */
function getDefaultSettings() {
  return {
    autoUpdate: true,
    launchOnStartup: false,
    theme: 'dark',
    checkUpdatesOnLaunch: true,
    notificationsEnabled: true,
    appsInstallPath: './apps',
    lastUpdateCheck: null
  };
}

/**
 * Aggiorna una singola app nel registry
 *
 * @param {string} appId - ID dell'app
 * @param {object} updates - Oggetto con campi da aggiornare
 * @returns {Promise<boolean>}
 */
async function updateAppInRegistry(appId, updates) {
  try {
    const apps = await loadAppsRegistry();
    const appIndex = apps.findIndex(app => app.id === appId);

    if (appIndex === -1) {
      throw new Error(`App con ID ${appId} non trovata nel registry`);
    }

    // Aggiorna app
    apps[appIndex] = {
      ...apps[appIndex],
      ...updates
    };

    await saveAppsRegistry(apps);
    return true;

  } catch (error) {
    throw new Error(`Errore aggiornamento app nel registry: ${error.message}`);
  }
}

/**
 * Verifica integrità file di configurazione
 *
 * @returns {object} - Stato configurazioni
 */
function checkConfigIntegrity() {
  return {
    appsRegistryExists: fs.existsSync(APPS_REGISTRY_PATH),
    settingsExists: fs.existsSync(SETTINGS_PATH),
    configDirExists: fs.existsSync(CONFIG_DIR)
  };
}

module.exports = {
  loadAppsRegistry,
  saveAppsRegistry,
  loadSettings,
  saveSettings,
  getDefaultSettings,
  updateAppInRegistry,
  checkConfigIntegrity
};
