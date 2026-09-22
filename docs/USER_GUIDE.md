# ATUL X SFX - User Guide

Welcome to the premium SFX workflow for After Effects & Premiere Pro.

---

## Interface Overview

### Header
- **Logo** - ATUL X SFX branding
- **Search** - Fuzzy search across names, categories, folders
- **Favorites (★)** - Quick filter favorites
- **Add Folder (+)** - Add new SFX library folder
- **Settings (⚙)** - Manage plugin

### Sidebar
- **All Sounds** - Complete library
- **Favorites** - Your starred sounds
- **Recent** - Recently played/imported
- **Categories** - Auto-detected from folder names & keywords (whoosh, impact, riser, etc)
- **Folders** - Your added library folders
- **Manage Folders** - Add/remove folders

### Main Content
- **Toolbar** - Shows count, sort, view toggle (list/grid)
- **SFX Cards** - Each sound with:
  - Play button
  - Name & metadata
  - Waveform preview
  - Favorite & Import buttons
  - Drag handle

### Player (Bottom)
- **Waveform** - Full visual, click to seek
- **Controls** - Stop, Play/Pause, Loop
- **Volume** - Preview volume
- **Favorite** - Toggle favorite
- **Import** - Add to timeline at playhead

---

## Workflow

### 1. Preview
- **Click** any card or press **Play** button
- **Spacebar** to play/pause selected
- **Click waveform** in player to seek
- **Volume slider** to adjust preview level

### 2. Import to Timeline

**Premiere Pro:**
- Open sequence, position playhead where you want SFX
- Ensure audio track is targeted (highlighted) and not locked
- Click **Import** button or press **Enter**
- Sound is imported to Project and inserted at playhead on targeted track

**After Effects:**
- Open project, select composition, set current time
- Click **Import**
- Sound is imported to Project and added to active comp at current time

**Pro Tips:**
- **Double-click** card to instantly import
- **Drag** card directly to timeline (Premiere)
- **Enter** key imports currently playing/selected sound

### 3. Organize

**Favorites:**
- Click **☆/★** on card or player to favorite
- Filter via sidebar **Favorites** or header **★**

**Search:**
- Type in search box - searches name, category, folder
- Search is instant (150ms debounce)
- Clear with **✕** button

**Categories:**
- Auto-detected from file paths:
  - whoosh, impact, transition, riser, downer, glitch, sci-fi, cinematic, ui, bass, etc.
- Click category in sidebar to filter

**Folders:**
- Add multiple SFX packs
- Click folder name to filter to that folder only
- Remove via **✕** on hover

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Space** | Play/Pause |
| **Enter** | Import selected/playing to timeline |
| **↑ / ↓** | Navigate list |
| **Double-click** | Import |
| **Right-click** | Context menu |
| **Drag** | Drag to timeline |

---

## Settings & Tips

### Adding Folders
1. Click **+** in header or **Manage Folders**
2. Select folder containing SFX files
3. Plugin scans recursively (up to 8 levels deep)
4. Supports: WAV, MP3, AIFF, M4A, OGG, FLAC, WMA, AAC

**Recommended Folder Structure:**
```
My SFX Pack/
├── Whooshes/
├── Impacts/
├── Transitions/
├── Risers/
└── UI/
```

### Performance
- Virtualized rendering for 2000+ files
- Waveform caching
- Fast search indexing
- Background scanning

### Troubleshooting Import
- **Premiere:** If auto-insert fails, file is still in Project panel - drag manually
- **AE:** If no active comp, file is imported to Project only
- **Locked tracks:** Unlock audio track in Premiere

### Best Practices
- Keep SFX folder on fast drive (SSD)
- Use descriptive file names for better search
- Favorite frequently used sounds
- Use Recent to quickly re-import
- Organize SFX into subfolders for auto-categories

---

## For Sellers (You)

When delivering to customers:

1. **Provide:**
   - This plugin folder (zipped)
   - SFX library folder (separate)
   - Install guide (this file)

2. **Customer Install:**
   - Run installer .bat/.command
   - Open Adobe app → Extensions → ATUL X SFX
   - Onboarding asks for SFX folder → They select the folder you provided

3. **Premium Touches:**
   - Plugin shows "ATUL X SFX - Antigravity" branding
   - Smooth animations, glassmorphism UI
   - Professional error handling
   - No watermarks, no external dependencies

---

## Support

- **Email:** support@atulxsfx.com
- **Version:** 1.0.0 Premium
- **Compatibility:** AE 15.0+, PPro 12.0+ (CEP) / AE 24.0+, PPro 24.0+ (UXP)
