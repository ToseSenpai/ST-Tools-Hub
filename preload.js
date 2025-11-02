/**
 * ST Tools Hub - Preload Script
 *
 * Script preload per context isolation sicura
 * Espone API limitate al renderer process tramite contextBridge
 *
 * @author Simone Tosello (ST)
 * @company DHL Express Italy
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Esponi API sicure al renderer process
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Carica lista app dal registry
   * @returns {Promise<{success: boolean, apps?: Array, error?: string}>}
   */
  getApps: () => ipcRenderer.invoke('get-apps'),

  /**
   * Avvia un'applicazione esterna
   * @param {string} appId - ID dell'app da avviare
   * @returns {Promise<{success: boolean, pid?: number, error?: string}>}
   */
  launchApp: (appId) => ipcRenderer.invoke('launch-app', appId),

  /**
   * Controlla aggiornamenti per un'app specifica
   * @param {string} appId - ID dell'app
   * @returns {Promise<{success: boolean, updateInfo?: object, error?: string}>}
   */
  checkAppUpdate: (appId) => ipcRenderer.invoke('check-app-update', appId),

  /**
   * Controlla aggiornamenti per tutte le app installate
   * @returns {Promise<{success: boolean, updates?: Array, error?: string}>}
   */
  checkAllUpdates: () => ipcRenderer.invoke('check-all-updates'),

  /**
   * Apri dialog per selezione file/cartelle
   * @param {object} options - Opzioni dialog
   * @returns {Promise<{success: boolean, result?: object, error?: string}>}
   */
  openDialog: (options) => ipcRenderer.invoke('open-dialog', options),

  /**
   * Ottieni versione corrente del launcher
   * @returns {Promise<{success: boolean, version?: string}>}
   */
  getHubVersion: () => ipcRenderer.invoke('get-hub-version'),

  /**
   * Apri cartella apps in esplora risorse
   * @returns {Promise<{success: boolean}>}
   */
  openAppsFolder: () => ipcRenderer.invoke('open-apps-folder'),

  /**
   * Disinstalla un'applicazione
   * @param {string} appId - ID dell'app da disinstallare
   * @returns {Promise<{success: boolean, message?: string, error?: string}>}
   */
  uninstallApp: (appId) => ipcRenderer.invoke('uninstall-app', appId),

  /**
   * Ottieni dimensione app installata
   * @param {string} appId - ID dell'app
   * @returns {Promise<{success: boolean, size?: number, formatted?: string}>}
   */
  getAppSize: (appId) => ipcRenderer.invoke('get-app-size', appId),

  /**
   * Installa aggiornamento del launcher e riavvia
   * @returns {Promise<void>}
   */
  installHubUpdate: () => ipcRenderer.invoke('install-hub-update'),

  /**
   * Listener per eventi dal main process
   */
  onHubUpdateAvailable: (callback) => {
    ipcRenderer.on('hub-update-available', (event, info) => callback(info));
  },

  onHubUpdateDownloaded: (callback) => {
    ipcRenderer.on('hub-update-downloaded', (event, info) => callback(info));
  },

  /**
   * Rimuovi listener (cleanup)
   */
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Log per conferma caricamento preload
console.log('[ST Tools Hub] Preload script caricato con successo');
