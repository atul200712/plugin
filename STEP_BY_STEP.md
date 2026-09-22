# ATUL X SFX - Step By Step Instructions (For You + Your Customers)

Follow this exactly. No coding needed.

---

## PART 1: FOR YOU (Testing Before Selling)

### Step 1: Get the plugin files
You already have them in this repo: `/home/user/plugin`
Download as ZIP from GitHub, or clone.

### Step 2: Test in Browser (Quick UI Check)
1. In this Arena workspace, I started a server on port 8000
2. Open `src/index.html` via Live Preview
3. You should see onboarding popup → Click "Get Started"
4. Click drop zone → Select `example_sfx/Demo_Pack` folder (or any SFX folder)
5. You should see 30 sounds listed, with categories (Whooshes, Impacts, etc)
6. Click Play ▶ → You should hear preview + see waveform
7. This proves UI works. Import will show alert in browser (normal) - in Adobe it does real import.

### Step 3: Test in Premiere Pro / After Effects (Real Test)

**You need:**
- Premiere Pro 2020+ OR After Effects 2020+ installed
- Your SFX folder ready (example: `Demo_Pack` or your real pack)

**Windows:**
1. Go to folder `installer/`
2. Right-click `Install SFX Panel (Windows).bat` → **Run as Administrator**
3. Wait for "Installation Complete!" message
4. If it says "Please run as Administrator" → Close, right-click again → Run as Admin
5. Restart Premiere Pro / After Effects COMPLETELY (Quit from taskbar, not just close window)
6. Open Premiere Pro → Top menu → `Window` → `Extensions` → `ATUL X SFX`
   - If you don't see Extensions: Go to `Window` → `Extensions` may be under `Window` → `Extensions (Legacy)` on newer versions
   - Alternative for new versions: `Window` → `UXP Plugins` → `ATUL X SFX` (if you used UXP method)
7. Panel should open on right side
8. Onboarding will appear → Click `Get Started` → Click drop zone → Select your SFX folder
9. Wait for scanning → Click `Start Creating`
10. You should see your sounds
11. Test: Click any sound → Press Space to play → Press Enter to import to timeline
    - In Premiere: Create new sequence first, place playhead where you want SFX, ensure audio track A1 is not locked and targeted (blue)
    - In After Effects: Create new comp, set current time indicator where you want SFX

**macOS:**
1. Go to `installer/`
2. Double-click `Install SFX Panel (Mac).command`
3. If macOS says "Unidentified developer": Right-click the file → Open → Open
4. Enter your Mac password if asked
5. Wait for "Installation Complete!"
6. Restart Premiere Pro / After Effects
7. Same steps 6-11 as Windows above

**If panel doesn't appear:**
- Restart Adobe Creative Cloud app too
- Check file exists: 
  - Win: `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\com.atulxsfx.plugin\`
  - Mac: `/Library/Application Support/Adobe/CEP/extensions/com.atulxsfx.plugin/`
- Enable debug mode manually:
  - Win: Press Win+R → type `regedit` → Go to `HKEY_CURRENT_USER\Software\Adobe\CSXS.11` → Right-click → New → String Value → Name `PlayerDebugMode` Value `1`
  - Mac: Open Terminal → Paste `defaults write com.adobe.CSXS.11 PlayerDebugMode 1` → Enter
- Restart Adobe again

**UXP Method (For Premiere 25.2+ / After Effects 2025+):**
1. Install "UXP Developer Tool" from Creative Cloud Desktop → Apps → Developer Tools
2. Open UXP Developer Tool
3. Click "Add Plugin" → Select `manifest.json` from this plugin folder
4. Click "Load" (or "Load & Watch")
5. Open Premiere → `Window` → `UXP Plugins` → `ATUL X SFX`
6. Same onboarding flow

---

## PART 2: HOW TO PACKAGE FOR SELLING (What You Send to Customers)

You will send customers **2 separate ZIP files**. Do NOT mix them.

### ZIP 1: Plugin (ATUL_X_SFX_Plugin.zip)

**What to include:**
```
CSXS/
src/
jsx/
manifest.json
installer/ (both .bat and .command + README.txt)
docs/INSTALL.md + USER_GUIDE.md
README.md
```

**What NOT to include:**
- `example_sfx/Demo_Pack/*.wav` (your demo, not needed)
- `.git/` folder
- `node_modules/`

**How to create:**
1. On your computer, select these folders/files
2. Right-click → Send to → Compressed (ZIP) [Windows] or Compress [Mac]
3. Name it `ATUL_X_SFX_Plugin_v1.0.0.zip`

**Command line (if you want):**
```bash
zip -r ATUL_X_SFX_Plugin.zip CSXS src jsx manifest.json installer docs README.md -x "*.git*"
```

### ZIP 2: SFX Library (Your_SFX_Pack.zip)

**Your actual SFX files organized like:**
```
Your_SFX_Pack/
├── Whooshes/
│   ├── Whoosh_Fast_01.wav
│   ├── Whoosh_Slow_02.wav
├── Impacts/
├── Transitions/
├── Risers/
├── UI/
└── Bass/
```

**Tips:**
- Use clean names: `Whoosh_Fast_01.wav` not `final_whoosh_v2_FINAL.wav`
- Keep in subfolders - plugin auto-detects categories from folder names
- Supported: WAV, MP3, AIFF, M4A, OGG, FLAC
- Keep total under 2GB for easy download, or split

**How to create:**
1. Organize your SFX as above
2. Select the root folder `Your_SFX_Pack`
3. Right-click → Compress to ZIP
4. Name it `Your_SFX_Pack.zip` or `ATUL_X_SFX_Library_500_Sounds.zip`

---

## PART 3: FOR YOUR CUSTOMERS (What They Do - Copy Paste This to Them)

Give this exact instruction to your buyers:

---

**🎧 ATUL X SFX - Installation (2 Minutes)**

**You received 2 ZIPs:**
1. `ATUL_X_SFX_Plugin.zip`
2. `Your_SFX_Pack.zip`

**Step 1: Extract both ZIPs**
- Extract Plugin ZIP anywhere (Desktop)
- Extract SFX Pack ZIP anywhere (Desktop or Documents) - Remember this location!

**Step 2: Install Plugin**

**Windows:**
- Open extracted Plugin folder → Go to `installer` folder
- Right-click `Install SFX Panel (Windows).bat` → **Run as Administrator**
- Wait for "Installation Complete!"

**Mac:**
- Open Plugin folder → `installer` folder
- Double-click `Install SFX Panel (Mac).command`
- If blocked: Right-click → Open → Open → Enter password
- Wait for "Installation Complete!"

**Step 3: Open in Adobe**
- Restart After Effects / Premiere Pro (fully quit, not just close)
- Go to `Window` → `Extensions` → `ATUL X SFX`
  - (On new Premiere 25+: `Window` → `UXP Plugins` → `ATUL X SFX`)

**Step 4: Add Your SFX Library**
- First time, a welcome screen appears
- Click `Get Started`
- Click the big folder drop zone
- Select the `Your_SFX_Pack` folder you extracted in Step 1
- Wait for scanning (shows "Found X sounds")
- Click `Start Creating`

**Done! Now:**
- Click any sound to preview
- Press `Enter` or click `Import` to add to timeline at playhead
- Use Search, Favorites ★, Categories to find sounds fast

**Need help?**
- Panel not showing? Restart Adobe + Creative Cloud
- No sound? Check system volume, try different file
- Import not working? Make sure sequence/comp is open and audio track not locked
- Contact: [YOUR EMAIL]

---

## PART 4: CUSTOMIZATION (Optional)

### Change Colors / Branding
Open `src/css/styles.css` → Top `:root` section:
```css
--accent: #7c3aed; /* Change this to your brand color */
```
Change logo text in `src/index.html`:
```html
<span class="logo-name">ATUL X SFX</span>
```

### Change Icon
Replace `src/assets/icons/icon-dark.png` and `icon-light.png` with your 48x48 PNG.

### Update Version
Change in 3 places:
1. `manifest.json` → "version"
2. `CSXS/manifest.xml` → ExtensionBundleVersion and Extension Version
3. `package.json` → version

---

## PART 5: TROUBLESHOOTING CHECKLIST

**For You:**
- [ ] Tested in browser preview (src/index.html)
- [ ] Tested installer on Windows/Mac
- [ ] Panel appears in Window → Extensions
- [ ] Can add folder and see sounds
- [ ] Preview works (Space)
- [ ] Import works (Enter) in both PPro and AE
- [ ] Created 2 ZIPs (Plugin + Library separate)
- [ ] Wrote customer instructions with your email

**For Customers (if they complain):**
- Panel not showing → Enable debug mode + restart Adobe + restart Creative Cloud
- No sounds after adding folder → Check folder has WAV/MP3 files, not empty, not too deep (max 8 levels)
- Preview no sound → Check file format supported, check system volume
- Import fails → Ensure project/sequence/comp open, audio track targeted and unlocked
- On Mac "Unidentified developer" → Right-click → Open → Open

---

## PART 6: QUICK COMMANDS (For Developers)

```bash
# Preview in browser
cd plugin
python -m http.server 8000
# Open http://localhost:8000/src/index.html

# Check structure
find . -type f | grep -v .git | sort

# Create distribution ZIPs
zip -r ATUL_X_SFX_Plugin.zip CSXS src jsx manifest.json installer docs README.md
zip -r SFX_Library.zip Your_SFX_Pack/
```

---

## DONE!

You now have a premium product. Sell it on Gumroad, your site, or Adobe Exchange.

Questions? Check `docs/INSTALL.md` and `docs/USER_GUIDE.md`
