/**
 * ST Tools Hub - App Launcher
 *
 * Modulo per lanciare applicazioni esterne (.exe)
 * Gestisce spawn di processi child detached
 *
 * @author Simone Tosello (ST)
 * @company DHL Express Italy
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Lancia un'applicazione esterna
 *
 * @param {string} appPath - Percorso completo all'eseguibile
 * @param {string} appName - Nome dell'app (per logging)
 * @returns {Promise<{success: boolean, pid?: number, error?: string}>}
 */
async function launchApp(appPath, appName = 'App') {
  return new Promise((resolve) => {
    try {
      // Verifica esistenza file
      if (!fs.existsSync(appPath)) {
        resolve({
          success: false,
          error: `File non trovato: ${appPath}`
        });
        return;
      }

      console.log(`[App Launcher] Avvio ${appName} da: ${appPath}`);

      // Ottieni directory dell'app per working directory
      const appDir = path.dirname(appPath);

      // Spawn processo detached (continua anche se hub chiuso)
      const child = spawn(appPath, [], {
        detached: true,
        stdio: 'ignore',
        cwd: appDir,
        windowsHide: false // Mostra finestra su Windows
      });

      // Detach dal parent process
      child.unref();

      console.log(`[App Launcher] ${appName} avviato con PID: ${child.pid}`);

      resolve({
        success: true,
        pid: child.pid,
        message: `${appName} avviato con successo`
      });

      // Gestione errori
      child.on('error', (err) => {
        console.error(`[App Launcher] Errore spawn ${appName}:`, err);
      });

    } catch (error) {
      console.error(`[App Launcher] Errore lancio ${appName}:`, error);
      resolve({
        success: false,
        error: error.message
      });
    }
  });
}

/**
 * Verifica se un'app è installata (exe esiste)
 *
 * @param {string} appPath - Percorso all'eseguibile
 * @returns {boolean}
 */
function isAppInstalled(appPath) {
  return fs.existsSync(appPath);
}

/**
 * Ottieni informazioni su un file eseguibile
 *
 * @param {string} appPath - Percorso all'eseguibile
 * @returns {object|null}
 */
function getAppInfo(appPath) {
  try {
    if (!fs.existsSync(appPath)) {
      return null;
    }

    const stats = fs.statSync(appPath);

    return {
      exists: true,
      size: stats.size,
      modified: stats.mtime,
      path: appPath
    };
  } catch (error) {
    console.error('[App Launcher] Errore get info:', error);
    return null;
  }
}

module.exports = {
  launchApp,
  isAppInstalled,
  getAppInfo
};
