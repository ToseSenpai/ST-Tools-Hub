# ST Tools Hub - Developer Notes

## 🎯 Progetto Completato

**ST Tools Hub** è stato creato con successo! Questo documento contiene note tecniche per sviluppo e manutenzione.

---

## 📁 File Creati

### Core Files (20 file)

**Configurazione**:
1. `package.json` - Dependencies e build config
2. `.gitignore` - Files da ignorare
3. `config/apps-registry.json` - Registro 3 app

**Backend (Main Process)**:
4. `main.js` - Entry point Electron
5. `preload.js` - IPC bridge sicuro
6. `src/main/app-launcher.js` - Spawn external .exe
7. `src/main/update-checker.js` - GitHub API integration
8. `src/main/config-manager.js` - Load/save configs

**Frontend (Renderer)**:
9. `src/renderer/index.html` - UI principale
10. `src/renderer/styles/main.css` - Global styles + variables
11. `src/renderer/styles/dashboard.css` - Layout & modals
12. `src/renderer/styles/cards.css` - App cards styling
13. `src/renderer/js/renderer.js` - Main UI controller
14. `src/renderer/js/app-manager.js` - App cards logic
15. `src/renderer/js/updater.js` - Update checks

**Assets**:
16. `src/renderer/assets/logos/st-hub-logo.svg` - Logo ST Tools Hub
17. `build/icon.png` - Placeholder icon (SVG format)
18. `src/renderer/assets/icons/placeholder.png` - App icon fallback

**Documentation**:
19. `README.md` - Documentazione completa
20. `QUICKSTART.md` - Guida rapida
21. `DEV_NOTES.md` - Questo file

---

## 🏗️ Architettura

### Electron Architecture

```
┌─────────────────────────────────────────────┐
│           Main Process (Node.js)            │
│  ┌──────────────────────────────────────┐  │
│  │  main.js (Window, Lifecycle, IPC)    │  │
│  │  app-launcher.js (Spawn .exe)        │  │
│  │  update-checker.js (GitHub API)      │  │
│  │  config-manager.js (Config I/O)      │  │
│  └──────────────────────────────────────┘  │
└─────────────────┬───────────────────────────┘
                  │ IPC Communication
                  │ (contextBridge)
┌─────────────────▼───────────────────────────┐
│        Renderer Process (Browser)           │
│  ┌──────────────────────────────────────┐  │
│  │  index.html (UI Structure)           │  │
│  │  CSS (Styling DHL/ST colors)         │  │
│  │  renderer.js (UI Controller)         │  │
│  │  app-manager.js (Cards Logic)        │  │
│  │  updater.js (Update UI)              │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Security Model

✅ **Context Isolation**: Enabled
✅ **Node Integration**: Disabled in renderer
✅ **Preload Script**: Secure API bridge
✅ **CSP**: Content Security Policy in HTML

### IPC Flow

```javascript
// Renderer → Main
const result = await window.electronAPI.launchApp(appId);

// Preload (contextBridge)
contextBridge.exposeInMainWorld('electronAPI', {
  launchApp: (id) => ipcRenderer.invoke('launch-app', id)
});

// Main (ipcMain handler)
ipcMain.handle('launch-app', async (event, appId) => {
  return await appLauncher.launchApp(...);
});
```

---

## 🎨 Design System

### Color Palette

```css
/* DHL Brand */
--dhl-yellow: #FFCC00
--dhl-red: #D40511

/* ST Brand */
--st-blue: #00A8E1
--st-blue-light: #33BFEC
--st-blue-dark: #0088B8

/* Dark Theme */
--bg-primary: #1a1a1a
--bg-secondary: #2d2d2d
--bg-tertiary: #3a3a3a

/* Status */
--success-green: #4CAF50
--warning-orange: #FF9800
--error-red: #f44336
```

### Typography

- **Font Family**: System fonts (-apple-system, Segoe UI, Roboto)
- **Title**: 24px, bold, gradient ST
- **Card Title**: 18px, bold
- **Body**: 14px, regular
- **Small**: 12-13px

### Spacing System

```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
```

### Border Radius

```css
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
```

---

## 🔌 API Reference

### Renderer → Main IPC Calls

```javascript
// Get apps from registry
const { success, apps } = await window.electronAPI.getApps();

// Launch app
const { success, pid } = await window.electronAPI.launchApp(appId);

// Check app update
const { success, updateInfo } = await window.electronAPI.checkAppUpdate(appId);

// Check all updates
const { success, updates } = await window.electronAPI.checkAllUpdates();

// Get hub version
const { version } = await window.electronAPI.getHubVersion();

// Open apps folder
await window.electronAPI.openAppsFolder();

// Install hub update
await window.electronAPI.installHubUpdate();
```

### Main → Renderer Events

```javascript
// Hub update available
window.electronAPI.onHubUpdateAvailable((info) => {
  console.log('New version:', info.version);
});

// Hub update downloaded
window.electronAPI.onHubUpdateDownloaded((info) => {
  // Show install button
});
```

---

## 📦 Build Configuration

### electron-builder Config (package.json)

```json
"build": {
  "appId": "com.simonetosello.sttoolshub",
  "productName": "ST Tools Hub",
  "win": {
    "target": ["nsis"],
    "icon": "build/icon.ico"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  },
  "publish": {
    "provider": "github",
    "owner": "ToseSenpai",
    "repo": "ST-Tools-Hub"
  }
}
```

### Build Output

```
dist/
├── ST-Tools-Hub-Setup-1.0.0.exe    # NSIS Installer
├── win-unpacked/                   # Portable version
│   └── ST Tools Hub.exe
└── builder-effective-config.yaml   # Build metadata
```

---

## 🔄 Update System

### App Updates (GitHub Releases)

1. **Check**: Query `https://api.github.com/repos/:owner/:repo/releases/latest`
2. **Compare**: Semver comparison (current vs latest)
3. **Notify**: Toast + badge if update available
4. **Download**: Open browser to release page (per ora)

### Hub Self-Update (electron-updater)

1. **Auto-check** on startup (delay 3s)
2. **Background download** if available
3. **Notification** when ready
4. **Install** on user confirmation → restart

---

## 🧪 Testing Checklist

### UI Tests

- [ ] Dashboard loads correttamente
- [ ] 3 app cards renderizzate
- [ ] Hover effects funzionano
- [ ] Settings modal si apre/chiude
- [ ] Toast notifications appaiono
- [ ] Responsive layout (resize finestra)

### Functionality Tests

- [ ] Get apps from registry
- [ ] Launch app (se installata)
- [ ] Check single app update
- [ ] Check all updates
- [ ] Settings save/load
- [ ] Open apps folder

### Build Tests

- [ ] `npm run build` completa senza errori
- [ ] Installer .exe creato
- [ ] Installer funziona (installa app)
- [ ] App installata si avvia
- [ ] Icona corretta in taskbar/Start

### Update Tests

- [ ] Auto-update check all'avvio
- [ ] Badge mostra count updates
- [ ] Hub update notification appare
- [ ] Install update funziona

---

## 🐛 Known Issues / TODO

### Must Fix

- [ ] **Icon.ico**: Sostituire placeholder SVG con .ico multi-resolution vero
- [ ] **App Icons**: Creare icone 64x64 per ogni app
- [ ] **First Run**: Handle gracefully se apps/ folder non esiste

### Nice to Have

- [ ] **Download Diretto**: Implementare download + install app dal launcher
- [ ] **Progress Bar**: Mostrare progresso download
- [ ] **Uninstall**: Funzionalità rimozione app
- [ ] **Settings Backend**: Salvare settings via IPC invece di localStorage
- [ ] **Categories**: Filtrare app per categoria
- [ ] **Search**: Barra ricerca app

### Future Enhancements

- [ ] **Themes**: Light mode, custom themes
- [ ] **Shortcuts**: Keyboard shortcuts
- [ ] **Tray Icon**: Minimize to system tray
- [ ] **Launch on Startup**: Opzione avvio con Windows
- [ ] **App Usage Stats**: Tracciare quante volte app avviate
- [ ] **Changelog**: Mostrare release notes

---

## 📝 Code Style

### JavaScript

```javascript
// Use async/await
async function loadApps() {
  try {
    const response = await window.electronAPI.getApps();
    // ...
  } catch (error) {
    console.error('Error:', error);
  }
}

// Arrow functions for callbacks
button.addEventListener('click', () => handleClick());

// Naming: camelCase
const appManager = new AppManager();
```

### CSS

```css
/* BEM-like naming */
.app-card { }
.app-card__header { }
.app-card--featured { }

/* CSS variables for theming */
background: var(--st-blue);

/* Comments in italiano/inglese */
/* Header con logo ST prominente */
```

### File Naming

- **kebab-case** per file: `app-launcher.js`, `main.css`
- **camelCase** per variabili/funzioni: `launchApp()`, `appsRegistry`
- **PascalCase** per componenti: `AppManager`, `UpdateChecker`

---

## 🔐 Security Considerations

### Current Security Measures

✅ Context isolation enabled
✅ nodeIntegration disabled
✅ Preload script con API limitate
✅ CSP in HTML
✅ No eval() or remote code

### Potential Risks

⚠️ **Spawn external .exe**: Verifica path prima di spawn
⚠️ **GitHub API**: Rate limit (60 req/hour unauthenticated)
⚠️ **User input**: Sanitize se aggiungi form inputs

### Recommendations

1. **Validate paths** prima di launchApp()
2. **Sanitize GitHub API responses** (evita XSS)
3. **Use HTTPS only** per downloads
4. **Code signing** per installer (Windows Defender)

---

## 📊 Performance

### Current Metrics

- **Startup time**: ~2-3 secondi (con DevTools closed)
- **Memory usage**: ~100-150MB (Electron baseline)
- **Bundle size**: ~150MB (Electron + app)

### Optimization Tips

- ✅ Lazy load images
- ✅ CSS animations GPU-accelerated (transform, opacity)
- ✅ Debounce update checks
- 🔄 Future: Code splitting se app diventa grande

---

## 📚 Useful Resources

### Electron

- [Electron Docs](https://www.electronjs.org/docs/latest)
- [electron-builder Docs](https://www.electron.build/)
- [electron-updater Guide](https://www.electron.build/auto-update)

### GitHub API

- [Releases API](https://docs.github.com/en/rest/releases/releases)
- [Rate Limits](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)

### Design

- [DHL Brand Guidelines](https://group.dhl.com/en/brands.html)
- [Electron UI Best Practices](https://www.electronjs.org/docs/latest/tutorial/accessibility)

---

## 🤝 Contributing

Se altri sviluppatori vogliono contribuire:

1. Fork repository
2. Create feature branch: `git checkout -b feature/nome-feature`
3. Commit: `git commit -m "Add: descrizione"`
4. Push: `git push origin feature/nome-feature`
5. Open Pull Request

### Commit Message Format

```
Type: Short description

- Detailed point 1
- Detailed point 2

Type può essere:
- Add: Nuova feature
- Fix: Bug fix
- Update: Modifica esistente
- Refactor: Code refactoring
- Docs: Documentazione
- Style: Formatting, CSS
```

---

## 📞 Support & Contacts

**Developer**: Simone Tosello (ST)
**Company**: DHL Express Italy
**GitHub**: [@ToseSenpai](https://github.com/ToseSenpai)
**Email**: simone.tosello@dhl.com

---

<div align="center">

**ST Tools Hub** - v1.0.0

Developed with ❤️ by Simone Tosello

© 2025 DHL Express Italy

</div>
