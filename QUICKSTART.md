# ST Tools Hub - Quick Start Guide

## ✅ Installazione Completata!

Il tuo **ST Tools Hub** è stato creato con successo! 🎉

---

## 🚀 Avvio Immediato

### 1. Avvia l'applicazione in modalità sviluppo:

```bash
npm start
```

Questo aprirà ST Tools Hub con l'interfaccia completa!

### 2. Cosa vedrai:

- ✨ **Header** con logo ST e titolo "ST Tools Hub by Simone Tosello"
- 📦 **3 App Cards** (Bollettini, Cerca MRN, Controllo NSIS)
- ⚙️ **Settings Button** per configurazioni
- 📊 **Footer** con firma prominente ST

---

## 📋 Prossimi Passi

### Step 1: Testa l'interfaccia

```bash
npm start
```

Verifica:
- [x] UI moderna con colori DHL (giallo/rosso) e ST (blu)
- [x] Le 3 app cards sono visualizzate
- [x] Animazioni hover sulle cards
- [x] Modal settings si apre correttamente

### Step 2: Test Lancio App (quando hai app installate)

1. Installa una delle tue app (es: Bollettini) nella cartella corretta:
   ```
   ST-Tools-Hub/apps/bollettini/GeneratoreBollettini.exe
   ```

2. Riavvia il launcher

3. Clicca "Avvia" sulla card - l'app dovrebbe partire!

### Step 3: Crea Icone Definitive

Le icone attuali sono placeholder SVG. Per icone Windows corrette:

1. Converti il logo ST da SVG:
   ```
   src/renderer/assets/logos/st-hub-logo.svg
   ```

2. Usa un converter online (https://convertio.co/svg-ico/):
   - Esporta come `build/icon.ico` (256x256)
   - Esporta come `build/icon.png` (512x512)

3. Vedi dettagli in: [build/README_ICONS.md](build/README_ICONS.md)

### Step 4: Build Prima Release

Quando sei pronto per creare l'installer:

```bash
npm run build
```

Questo crea:
- `dist/ST-Tools-Hub-Setup-1.0.0.exe` - Installer Windows
- `dist/win-unpacked/` - Versione portable

### Step 5: Pubblica su GitHub

1. **Inizializza Git** (se non fatto):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - ST Tools Hub v1.0.0"
   ```

2. **Crea repository su GitHub**:
   - Nome: `ST-Tools-Hub`
   - Pubblico o privato (a tua scelta)

3. **Push codice**:
   ```bash
   git remote add origin https://github.com/ToseSenpai/ST-Tools-Hub.git
   git branch -M main
   git push -u origin main
   ```

4. **Crea prima release**:
   - Vai su GitHub → Releases → "Create a new release"
   - Tag: `v1.0.0`
   - Titolo: `ST Tools Hub v1.0.0`
   - Upload `ST-Tools-Hub-Setup-1.0.0.exe`
   - Pubblica!

---

## 🔧 Comandi Utili

```bash
# Sviluppo
npm start              # Avvia app
npm run dev            # Avvia con DevTools

# Build
npm run build          # Crea installer Windows
npm run build-win      # Build Windows esplicito

# Publish (dopo setup GitHub)
npm run publish        # Build + pubblica automaticamente
```

---

## 📂 Struttura Importante

```
ST-Tools-Hub/
├── config/
│   └── apps-registry.json     ← Aggiungi/modifica app qui
├── src/
│   ├── main/                  ← Backend logic
│   └── renderer/              ← Frontend UI
├── build/
│   ├── icon.ico               ← Icona installer (sostituisci!)
│   └── icon.png
└── apps/                      ← Le app installate vanno qui
    ├── bollettini/
    ├── cerca-mrn/
    └── controllo-stato-nsis/
```

---

## ✏️ Personalizzazioni Veloci

### Cambiare Colori

Modifica variabili in [src/renderer/styles/main.css](src/renderer/styles/main.css):

```css
:root {
  --dhl-yellow: #FFCC00;
  --dhl-red: #D40511;
  --st-blue: #00A8E1;
}
```

### Aggiungere Nuova App

1. Apri [config/apps-registry.json](config/apps-registry.json)

2. Aggiungi oggetto app:
   ```json
   {
     "id": "nuova-app",
     "name": "Nome App",
     "description": "Descrizione",
     "version": "1.0.0",
     "executablePath": "./apps/nuova-app/App.exe",
     "repoOwner": "ToseSenpai",
     "repoName": "nuova-app",
     "category": "Categoria",
     "backgroundColor": "#4ECDC4"
   }
   ```

3. Riavvia: `npm start`

### Modificare Branding

Footer e header contengono già il tuo nome prominente:
- **Header**: "ST Tools Hub by Simone Tosello"
- **Footer**: "ST Tools Hub - Developed by Simone Tosello (ST)"
- **About**: Sezione dedicata con crediti completi

---

## 🐛 Troubleshooting

### Problema: App non si avvia

**Soluzione**:
```bash
# Verifica Node.js
node --version  # Dovrebbe essere v20+

# Reinstalla dipendenze
rm -rf node_modules package-lock.json
npm install
npm start
```

### Problema: Icone non si vedono

**Soluzione**: Le icone SVG potrebbero non caricarsi. Converti in PNG/ICO come descritto sopra.

### Problema: Build fallisce

**Soluzione**: Assicurati di avere `icon.ico` e `icon.png` in `build/`

---

## 📞 Support

Per domande o problemi:
- **GitHub Issues**: [ToseSenpai/ST-Tools-Hub/issues](https://github.com/ToseSenpai/ST-Tools-Hub/issues)
- **Email**: simone.tosello@dhl.com

---

## 🎨 Feature Implementate

✅ **MUST HAVE (MVP)**
- [x] Dashboard moderna con app cards
- [x] Lancio app esterne (.exe)
- [x] Branding ST prominente (logo, footer)
- [x] Colori DHL (giallo, rosso) + ST (blu)
- [x] Animazioni smooth e hover effects
- [x] Error handling con toast notifications

✅ **SHOULD HAVE**
- [x] Check updates da GitHub API
- [x] Settings panel con About ST
- [x] Auto-update launcher (electron-updater)
- [x] Badge notifiche aggiornamenti
- [x] Responsive layout

📦 **NICE TO HAVE** (Future)
- [ ] Download/install app direttamente dal launcher
- [ ] Statistiche uso app
- [ ] Search/filter app
- [ ] Temi personalizzabili

---

## 🎯 Next Steps Consigliati

1. **Test completo UI** - Verifica tutte le funzionalità
2. **Crea icone definitive** - Sostituisci placeholder
3. **Installa una tua app** - Test lancio reale
4. **Build primo installer** - Test distribuzione
5. **Setup GitHub + Release** - Pubblica v1.0.0
6. **Distribuisci ai colleghi** - Raccogli feedback

---

<div align="center">

**ST Tools Hub v1.0.0**

Developed by **Simone Tosello (ST)** for **DHL Express Italy**

🚀 Buon lavoro! 🚀

</div>
