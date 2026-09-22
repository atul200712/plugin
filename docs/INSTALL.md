# ATUL X SFX - Installation Guide

Premium SFX Plugin for After Effects & Premiere Pro

---

## Quick Install (Recommended)

### Windows
1. **Right-click** `Install SFX Panel (Windows).bat` → **Run as Administrator**
2. Wait for "Installation Complete"
3. Restart After Effects / Premiere Pro
4. Go to `Window → Extensions → ATUL X SFX`

### macOS
1. Double-click `Install SFX Panel (Mac).command`
2. If blocked: Right-click → Open → Open
3. Enter password if prompted
4. Restart After Effects / Premiere Pro
5. Go to `Window → Extensions → ATUL X SFX`

---

## Manual Install (CEP)

If auto-installer fails:

**Windows:**
- Copy entire plugin folder to:
  `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\com.atulxsfx.plugin\`

**macOS:**
- Copy to:
  `/Library/Application Support/Adobe/CEP/extensions/com.atulxsfx.plugin/`
  or
  `~/Library/Application Support/Adobe/CEP/extensions/com.atulxsfx.plugin/`

**Enable Debug Mode:**

Windows (Registry):
```
[HKEY_CURRENT_USER\Software\Adobe\CSXS.8]
"PlayerDebugMode"="1"
[HKEY_CURRENT_USER\Software\Adobe\CSXS.9]
"PlayerDebugMode"="1"
[HKEY_CURRENT_USER\Software\Adobe\CSXS.11]
"PlayerDebugMode"="1"
```

macOS (Terminal):
```bash
defaults write com.adobe.CSXS.8 PlayerDebugMode 1
defaults write com.adobe.CSXS.9 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
```

---

## UXP Install (Premiere 25.2+ / After Effects 25+ Beta)

For newer Adobe versions, UXP is preferred:

1. Install **UXP Developer Tool** from Creative Cloud Desktop
2. Open UDT → **Add Plugin** → Select `manifest.json` from this folder
3. Click **Load**
4. In Premiere/AE: `Window → UXP Plugins → ATUL X SFX`

**For Distribution (CCX):**
- Zip `manifest.json` + `src/` folder
- Rename `.zip` to `.ccx`
- Double-click to install via Creative Cloud

---

## ZXP Install (Legacy)

1. Install **ZXP Installer** or **Anastasiy Extension Manager**
2. Package this folder as ZXP:
   ```bash
   # Using ZXPSignCmd
   ZXPSignCmd -sign src CSXS cert.p12 password atul-x-sfx.zxp
   ```
3. Install ZXP via manager

---

## First Launch Setup

1. After installation, open panel
2. **Onboarding** will appear automatically
3. Click **"Add Folder"** → Select your SFX library folder (provided with purchase)
4. Wait for scan to complete
5. Start creating!

**You can add multiple folders:**
- Click `+` icon in header
- Or `Manage Folders` in sidebar
- Or gear icon → Settings

---

## Troubleshooting

**Panel not showing:**
- Restart Adobe app fully (Quit, not just close window)
- Restart Creative Cloud Desktop
- Check debug mode enabled
- Try user folder instead of system folder (macOS)

**No sound preview:**
- Check file format (WAV, MP3, AIFF, M4A, OGG, FLAC supported)
- Try different audio file
- Check system volume

**Import not working:**
- Ensure project is open
- For Premiere: Ensure sequence is active and audio track not locked
- For After Effects: Ensure comp is active
- Try manual import from Project panel as fallback

**Still stuck?**
- Contact: atul@atulxsfx.com
- Include: OS, Adobe version, screenshot of error

---

## Uninstall

**Windows:**
- Delete folder: `...CEP\extensions\com.atulxsfx.plugin`

**macOS:**
- Delete folder: `/Library/Application Support/Adobe/CEP/extensions/com.atulxsfx.plugin`

**UXP:**
- UDT → Unload
- Or Creative Cloud → Manage Plugins → Uninstall
