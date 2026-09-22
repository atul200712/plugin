# Packaging for Distribution

## For Customers (What You Send)

You will send 2 ZIPs:

### 1. Plugin ZIP (ATUL_X_SFX_Plugin_v1.0.0.zip)
Contains:
```
ATUL_X_SFX_Plugin/
├── CSXS/manifest.xml
├── src/ (entire folder)
├── jsx/ (entire folder)
├── manifest.json
├── installer/
│   ├── Install SFX Panel (Windows).bat
│   ├── Install SFX Panel (Mac).command
│   └── README.txt
└── docs/
    ├── INSTALL.md
    └── USER_GUIDE.md
```

### 2. SFX Library ZIP (Your_SFX_Pack.zip)
Your actual SFX files organized:
```
Your_SFX_Pack/
├── Whooshes/
├── Impacts/
├── etc.
```

**Do NOT include SFX inside plugin folder** - Keep separate. Customer selects folder in onboarding.

---

## How to Create Plugin ZIP

### Windows
Right-click plugin folder → Send to → Compressed ZIP
Or use 7-Zip

### macOS
Right-click → Compress

### Command Line
```bash
cd /home/user/plugin
zip -r ATUL_X_SFX_Plugin_v1.0.0.zip CSXS src jsx manifest.json installer docs README.md -x "*.git*" "example_sfx/*"
```

---

## Advanced Packaging (Optional)

### ZXP (For Extension Managers)
Requires Adobe ZXPSignCmd + certificate:

```bash
# Self-signed cert (for testing)
ZXPSignCmd -selfSignedCert US CA MyCompany MyCompany password cert.p12 -validityDays 365

# Sign
ZXPSignCmd -sign ./ ATUL_X_SFX.zxp cert.p12 password -tsa http://timestamp.digicert.com
```

Then customers install via Anastasiy Extension Manager.

### CCX (For Creative Cloud / UXP)
```bash
# Zip manifest + src
zip -r ATUL_X_SFX.ccx manifest.json src/
# Rename to .ccx and double-click to install
```

---

## Marketplace Submission

**Adobe Exchange:**
- Requires ZXP + icons + screenshots
- Submit at https://adobeexchange.com
- Review takes 1-2 weeks

**Gumroad / Your Site:**
- Just provide ZIP + install instructions
- Simplest for paid products

---

## Versioning

- Update version in:
  - `manifest.json` → version
  - `CSXS/manifest.xml` → ExtensionBundleVersion and Extension Version
  - `package.json` → version
  - `README.md` badges

- Changelog in git commits
