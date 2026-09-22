ATUL X SFX - Installer Files

Windows: Double-click "Install SFX Panel (Windows).bat" as Administrator
macOS: Double-click "Install SFX Panel (Mac).command"

If blocked on Mac:
Right-click -> Open -> Open

Manual install path:
Windows: C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\com.atulxsfx.plugin\
macOS: /Library/Application Support/Adobe/CEP/extensions/com.atulxsfx.plugin/

Enable debug mode if panel doesn't show:
Windows Registry:
[HKEY_CURRENT_USER\Software\Adobe\CSXS.8] PlayerDebugMode=1
[HKEY_CURRENT_USER\Software\Adobe\CSXS.9] PlayerDebugMode=1
[HKEY_CURRENT_USER\Software\Adobe\CSXS.11] PlayerDebugMode=1

macOS Terminal:
defaults write com.adobe.CSXS.8 PlayerDebugMode 1
defaults write com.adobe.CSXS.9 PlayerDebugMode 1
defaults write com.adobe.CSXS.11 PlayerDebugMode 1

Then restart Adobe app.

For UXP (Premiere 25.2+ / AE 25+):
Use UXP Developer Tool to load manifest.json
