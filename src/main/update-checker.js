/**
 * ST Tools Hub - Update Checker
 *
 * Modulo per controllare aggiornamenti app da GitHub Releases
 * Utilizza GitHub API per recuperare latest release
 *
 * @author Simone Tosello (ST)
 * @company DHL Express Italy
 */

const https = require('https');

/**
 * Controlla se ci sono aggiornamenti disponibili per un'app
 *
 * @param {string} repoOwner - Proprietario repository GitHub (es: "ToseSenpai")
 * @param {string} repoName - Nome repository (es: "bollettini")
 * @param {string} currentVersion - Versione corrente installata (es: "1.0.3")
 * @returns {Promise<{available: boolean, latestVersion?: string, downloadUrl?: string, releaseUrl?: string}>}
 */
async function checkAppUpdate(repoOwner, repoName, currentVersion) {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`;

    console.log(`[Update Checker] Controllo aggiornamenti: ${repoOwner}/${repoName}`);

    const options = {
      headers: {
        'User-Agent': 'ST-Tools-Hub',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    https.get(apiUrl, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode === 404) {
            // Nessuna release trovata
            resolve({
              available: false,
              message: 'Nessuna release pubblicata su GitHub'
            });
            return;
          }

          if (res.statusCode !== 200) {
            reject(new Error(`GitHub API error: ${res.statusCode}`));
            return;
          }

          const release = JSON.parse(data);

          // Estrai versione dal tag (rimuovi "v" se presente)
          const latestVersion = release.tag_name.replace(/^v/, '');
          const current = currentVersion.replace(/^v/, '');

          // Confronta versioni (semplice confronto stringa)
          const updateAvailable = compareVersions(latestVersion, current) > 0;

          // Trova asset installer (cerca .exe o .zip)
          let downloadUrl = null;
          if (release.assets && release.assets.length > 0) {
            const installer = release.assets.find(asset =>
              asset.name.endsWith('.exe') ||
              asset.name.endsWith('.zip') ||
              asset.name.includes('Setup')
            );
            downloadUrl = installer ? installer.browser_download_url : null;
          }

          console.log(`[Update Checker] ${repoName}: Current=${current}, Latest=${latestVersion}, Available=${updateAvailable}`);

          resolve({
            available: updateAvailable,
            latestVersion: latestVersion,
            currentVersion: current,
            downloadUrl: downloadUrl,
            releaseUrl: release.html_url,
            releaseName: release.name,
            releaseNotes: release.body,
            publishedAt: release.published_at
          });

        } catch (error) {
          reject(new Error(`Errore parsing risposta GitHub: ${error.message}`));
        }
      });

    }).on('error', (error) => {
      reject(new Error(`Errore connessione GitHub API: ${error.message}`));
    });
  });
}

/**
 * Confronta due versioni semver
 *
 * @param {string} v1 - Prima versione (es: "1.0.3")
 * @param {string} v2 - Seconda versione (es: "1.0.2")
 * @returns {number} - 1 se v1 > v2, -1 se v1 < v2, 0 se uguali
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;

    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  return 0;
}

/**
 * Ottieni informazioni su tutte le release di un repo
 *
 * @param {string} repoOwner - Proprietario repository
 * @param {string} repoName - Nome repository
 * @returns {Promise<Array>} - Lista release
 */
async function getAllReleases(repoOwner, repoName) {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/releases`;

    const options = {
      headers: {
        'User-Agent': 'ST-Tools-Hub',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    https.get(apiUrl, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`GitHub API error: ${res.statusCode}`));
            return;
          }

          const releases = JSON.parse(data);
          resolve(releases);

        } catch (error) {
          reject(new Error(`Errore parsing risposta: ${error.message}`));
        }
      });

    }).on('error', (error) => {
      reject(error);
    });
  });
}

module.exports = {
  checkAppUpdate,
  compareVersions,
  getAllReleases
};
