/**
 * ST Tools Hub - Main Process
 *
 * Electron main process per ST Tools Hub
 * Gestisce creazione finestre, IPC communication, e lifecycle dell'app
 *
 * @author Simone Tosello (ST)
 * @company DHL Express Italy
 */

const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// Import autoUpdater solo dopo che l'app è pronta
let autoUpdater;

// Import moduli custom
const appLauncher = require('./src/main/app-launcher');
const updateChecker = require('./src/main/update-checker');
const configManager = require('./src/main/config-manager');
const appInstaller = require('./src/main/app-installer');

let mainWindow;
let isDev = process.argv.includes('--dev');

/**
 * Crea la finestra principale dell'applicazione
 */
function createWindow() {
  // Rimuovi completamente la barra del menu (Windows 11 style)
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'ST Tools Hub',
    backgroundColor: '#0a0c0f', // Dark-950 - Windows 11 matching splash screen
    icon: path.join(__dirname, 'build/icon.ico'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    },
    frame: true,
    autoHideMenuBar: true,
    show: false // Mostra solo quando pronta (evita flash)
  });

  // Carica l'interfaccia
  mainWindow.loadFile(path.join(__dirname, 'src/renderer/index.html'));

  // Mostra finestra quando pronta
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // DevTools disabilitati per UI pulita - usa Ctrl+Shift+I se necessario
    // if (isDev) {
    //   mainWindow.webContents.openDevTools();
    // }
  });

  // Cleanup on close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Inizializza l'applicazione
 */
app.whenReady().then(() => {
  // Inizializza autoUpdater dopo che l'app è pronta
  autoUpdater = require('electron-updater').autoUpdater;

  createWindow();

  // macOS: ricrea finestra quando app riattivata
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Controlla aggiornamenti del launcher (non in dev mode)
  if (!isDev) {
    setTimeout(() => {
      checkForHubUpdates();
    }, 3000);
  }
});

/**
 * Chiudi app quando tutte le finestre sono chiuse (non su macOS)
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ============================================================================
// IPC HANDLERS - Comunicazione con renderer process
// ============================================================================

/**
 * Carica la lista delle app dal registry
 */
ipcMain.handle('get-apps', async () => {
  try {
    const apps = await configManager.loadAppsRegistry();

    // Verifica quali app sono effettivamente installate
    const appsWithStatus = apps.map(app => {
      const appPath = path.join(__dirname, app.executablePath);
      const installed = fs.existsSync(appPath);

      return {
        ...app,
        installed: installed
      };
    });

    return { success: true, apps: appsWithStatus };
  } catch (error) {
    console.error('Errore caricamento apps:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Avvia un'applicazione esterna
 */
ipcMain.handle('launch-app', async (event, appId) => {
  try {
    const apps = await configManager.loadAppsRegistry();
    const app = apps.find(a => a.id === appId);

    if (!app) {
      return { success: false, error: 'App non trovata nel registry' };
    }

    const appPath = path.join(__dirname, app.executablePath);

    // Verifica che l'exe esista
    if (!fs.existsSync(appPath)) {
      return {
        success: false,
        error: 'Applicazione non installata. Percorso non trovato: ' + appPath
      };
    }

    // Lancia l'app
    const result = await appLauncher.launchApp(appPath, app.name);
    return result;

  } catch (error) {
    console.error('Errore lancio app:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Controlla aggiornamenti disponibili per un'app
 */
ipcMain.handle('check-app-update', async (event, appId) => {
  try {
    const apps = await configManager.loadAppsRegistry();
    const app = apps.find(a => a.id === appId);

    if (!app) {
      return { success: false, error: 'App non trovata' };
    }

    const updateInfo = await updateChecker.checkAppUpdate(
      app.repoOwner,
      app.repoName,
      app.version
    );

    return { success: true, updateInfo };

  } catch (error) {
    console.error('Errore check update:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Controlla aggiornamenti per tutte le app
 */
ipcMain.handle('check-all-updates', async () => {
  try {
    const apps = await configManager.loadAppsRegistry();
    const updatePromises = apps.map(async (app) => {
      if (!app.installed) return null;

      try {
        const updateInfo = await updateChecker.checkAppUpdate(
          app.repoOwner,
          app.repoName,
          app.version
        );

        return {
          appId: app.id,
          appName: app.name,
          ...updateInfo
        };
      } catch (error) {
        return null;
      }
    });

    const results = await Promise.all(updatePromises);
    const updates = results.filter(r => r && r.available);

    return { success: true, updates };

  } catch (error) {
    console.error('Errore check all updates:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Apri dialog per selezionare file/cartella
 */
ipcMain.handle('open-dialog', async (event, options) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * Ottieni la versione corrente del launcher
 */
ipcMain.handle('get-hub-version', () => {
  return { success: true, version: app.getVersion() };
});

/**
 * Apri cartella apps in esplora risorse
 */
ipcMain.handle('open-apps-folder', () => {
  const appsPath = path.join(__dirname, 'apps');

  // Crea cartella se non esiste
  if (!fs.existsSync(appsPath)) {
    fs.mkdirSync(appsPath, { recursive: true });
  }

  require('electron').shell.openPath(appsPath);
  return { success: true };
});

/**
 * Disinstalla un'applicazione
 */
ipcMain.handle('uninstall-app', async (event, appId) => {
  try {
    console.log(`[Main] Richiesta disinstallazione app: ${appId}`);

    const result = await appInstaller.uninstallApp(appId);
    return result;

  } catch (error) {
    console.error('[Main] Errore uninstall app:', error);
    return { success: false, error: error.message };
  }
});

/**
 * Ottieni dimensione di un'app installata
 */
ipcMain.handle('get-app-size', async (event, appId) => {
  try {
    const result = await appInstaller.getAppSize(appId);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ============================================================================
// AUTO-UPDATE DEL LAUNCHER STESSO
// ============================================================================

/**
 * Configura auto-updater per il launcher stesso
 */
function checkForHubUpdates() {
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', (info) => {
    console.log('Aggiornamento ST Tools Hub disponibile:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('hub-update-available', info);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Aggiornamento ST Tools Hub scaricato:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('hub-update-downloaded', info);
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('Errore auto-update:', err);
  });
}

/**
 * Installa aggiornamento launcher e riavvia
 */
ipcMain.handle('install-hub-update', () => {
  autoUpdater.quitAndInstall();
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
