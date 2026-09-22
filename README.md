# ATUL X SFX — Premium SFX Plugin for After Effects & Premiere Pro

> **Antigravity Edition** — Built for pros who sell and use SFX packs.

![Version](https://img.shields.io/badge/version-1.0.0-7c3aed)
![AE](https://img.shields.io/badge/After%20Effects-15.0%2B-9999ff)
![PPro](https://img.shields.io/badge/Premiere%20Pro-12.0%2B-9999ff)
![License](https://img.shields.io/badge/license-Commercial-10b981)

A **premium, easy-to-install** SFX browser that lets your customers:
- **Add their SFX folder** on first launch (the pack you sell them)
- **Preview instantly** with waveform visualization
- **Import to timeline** in one click at playhead
- **Search, favorite, organize** like a pro tool

---

## ✨ Features

### For Your Customers (Premium UX)
- **Onboarding Flow** — Beautiful welcome → Add folder → Ready in 10 seconds
- **Lightning Preview** — Click to play, spacebar toggle, seek via waveform
- **One-Click Import** — AE: adds to project + active comp at current time. PPro: imports + inserts at playhead on targeted track
- **Smart Categories** — Auto-detects whoosh, impact, riser, transition, glitch, sci-fi, UI, etc. from file/folder names
- **Search That Works** — Fuzzy search across name, category, folder (150ms debounce)
- **Favorites & Recent** — Star sounds, quick access to recent imports
- **Waveform Visuals** — Real waveform via Web Audio API, dummy fallback for CEP
- **Drag & Drop** — Drag card to timeline (PPro)
- **Keyboard Shortcuts** — Space = play, Enter = import, ↑↓ = navigate, double-click = import
- **Grid / List View** — Toggle for browsing style
- **Multi-Folder** — Add unlimited SFX packs, filter by folder
- **Premium Dark UI** — Glassmorphism, smooth animations, built for long sessions

### For You (Seller)
- **Easy Install** — `.bat` and `.command` installers that enable debug mode + copy files
- **Dual Engine** — CEP (AE 15+, PPro 12+) + UXP (AE 24+, PPro 24+) from same codebase
- **Zero Dependencies** — Pure HTML/CSS/JS, no build step
- **Branded** — ATUL X SFX Antigravity theme, customizable colors
- **Production Ready** — Error handling, empty states, loading states, toasts

---

## 📁 Project Structure

```
atul-x-sfx/
├── manifest.json              # UXP manifest (PPro 25.2+, AE 25+ beta)
├── CSXS/manifest.xml          # CEP manifest (AE 15+, PPro 12+)
├── src/
│   ├── index.html             # Main panel UI
│   ├── css/styles.css         # Premium dark theme
│   ├── js/
│   │   ├── lib/CSInterface.js # Adobe CEP bridge
│   │   ├── storage.js         # Favorites, recents, folders
│   │   ├── fileSystem.js      # CEP Node + UXP + browser FS abstraction
│   │   ├── audioEngine.js     # Preview + waveform
│   │   ├── hostAdapter.js     # AE/PPro import logic
│   │   ├── onboarding.js      # First-launch flow
│   │   ├── ui.js              # Rendering, filtering, interactions
│   │   └── main.js            # Entry
│   └── assets/icons/          # Panel icons
├── jsx/
│   ├── host.jsx               # CEP host bridge
│   ├── aftereffects.jsx       # AE import
│   └── premiere.jsx           # PPro import
├── installer/
│   ├── Install SFX Panel (Windows).bat
│   ├── Install SFX Panel (Mac).command
│   └── README.txt
├── docs/
│   ├── INSTALL.md
│   └── USER_GUIDE.md
└── example_sfx/
    └── README.md
```

---

## 🚀 Installation (For Your Customers)

### Quick Install
**Windows:** Right-click `Install SFX Panel (Windows).bat` → Run as Administrator
**macOS:** Double-click `Install SFX Panel (Mac).command` (Right-click → Open if blocked)

Then:
1. Restart After Effects / Premiere Pro
2. `Window → Extensions → ATUL X SFX`
3. Onboarding → **Add your SFX folder** (the pack you sold them)
4. Done!

### Manual / UXP
See [docs/INSTALL.md](docs/INSTALL.md)

---

## 🎨 UI Flow

```
[Onboarding]
Welcome → Add Folder (drop zone + browse) → Scanning → Ready

[Main]
Header: Logo | Search | Fav | +Folder | Settings
Sidebar: All | Favorites | Recent | Categories (auto) | Folders
Content: Toolbar (count, sort, view) + SFX cards (play, wave, fav, import)
Player: Art | Name | Waveform (seek) | Stop Play Loop | Volume | Fav Import
```

---

## 🔧 Development

No build needed. Pure HTML/CSS/JS.

**Test in browser:**
- Open `src/index.html` directly — works in preview mode (import shows alert)

**Test in Adobe:**
- **CEP:** Use installer, then `Window → Extensions → ATUL X SFX`
- **UXP:** Install UXP Developer Tool from CC Desktop → Add Plugin → Select `manifest.json` → Load

**Debug:**
```js
// In panel console
ATUL_X_SFX.version
ATUL_X_SFX.getFiles()
ATUL_X_SFX.refresh()
ATUL_X_SFX.showOnboarding()
ATUL_X_SFX.clear() // reset
```

---

## 📦 Distribution (How to Sell)

1. **Zip this plugin folder** as `ATUL_X_SFX_Plugin.zip`
2. **Zip your SFX library** separately as `ATUL_X_SFX_Library.zip` (with organized folders)
3. **Deliver both** to customer + simple instruction:
   > 1. Install plugin via .bat/.command
   > 2. Open AE/PPro → Extensions → ATUL X SFX
   > 3. When asked, select the SFX Library folder

**Optional:** Package as ZXP for Anastasiy Manager, or CCX for Creative Cloud Marketplace.

---

## 🛠 Tech Details

- **CEP:** Node `fs` + `path` for scanning, ExtendScript for import
- **UXP:** `uxp.storage.localFileSystem` + persistent tokens
- **Audio:** HTML5 Audio + Web Audio API for waveform, fallback dummy waveform for file:// CORS
- **Import AE:** `app.project.importFile()` + `comp.layers.add()`
- **Import PPro:** `app.project.importFiles()` + `track.insertClip()` at `getPlayerPosition()`
- **Storage:** localStorage for folders, favs, recent, settings
- **Performance:** DocumentFragment, debounce, waveform cache

---

## 📝 License

Commercial — For ATUL's customers. Not open source.

---

## 🙏 Credits

Built for ATUL — Premium SFX Plugin
Design inspired by Premiere Composer, Epidemic Sound, Artlist
Antigravity Edition — Smooth, fast, pro.

---

## 📞 Support

If you bought this and need help:
- Check `docs/INSTALL.md` and `docs/USER_GUIDE.md`
- Email: support@atulxsfx.com (replace with your email)
