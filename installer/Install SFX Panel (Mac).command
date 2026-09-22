#!/bin/bash

# ATUL X SFX - macOS Installer
# For After Effects & Premiere Pro

clear
echo "==============================================="
echo " ATUL X SFX - Premium SFX Plugin Installer"
echo " For After Effects & Premiere Pro"
echo "==============================================="
echo ""

# Enable unsigned extensions
echo "[1/3] Enabling unsigned extensions..."

defaults write com.adobe.CSXS.8 PlayerDebugMode 1 2>/dev/null
defaults write com.adobe.CSXS.9 PlayerDebugMode 1 2>/dev/null
defaults write com.adobe.CSXS.11 PlayerDebugMode 1 2>/dev/null
defaults write com.adobe.CSXS.8 LogLevel 6 2>/dev/null
defaults write com.adobe.CSXS.9 LogLevel 6 2>/dev/null

echo "      > Debug mode enabled"

# Determine script dir
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ -f "$SCRIPT_DIR/../CSXS/manifest.xml" ]; then
  SOURCE_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
elif [ -f "$SCRIPT_DIR/CSXS/manifest.xml" ]; then
  SOURCE_DIR="$SCRIPT_DIR"
else
  SOURCE_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
fi

# Extension folder
EXT_FOLDER="/Library/Application Support/Adobe/CEP/extensions"
USER_EXT_FOLDER="$HOME/Library/Application Support/Adobe/CEP/extensions"

# Try system folder first, fallback to user
if [ ! -w "/Library/Application Support/Adobe/CEP" ]; then
  EXT_FOLDER="$USER_EXT_FOLDER"
  echo "      > No admin rights, installing to user folder"
fi

mkdir -p "$EXT_FOLDER"

echo ""
echo "[2/3] Installing extension..."
echo "      Source: $SOURCE_DIR"
echo "      Dest: $EXT_FOLDER/com.atulxsfx.plugin"

DEST="$EXT_FOLDER/com.atulxsfx.plugin"

rm -rf "$DEST"
mkdir -p "$DEST"

cp -R "$SOURCE_DIR/CSXS" "$DEST/"
cp -R "$SOURCE_DIR/src" "$DEST/"
cp -R "$SOURCE_DIR/jsx" "$DEST/"
cp "$SOURCE_DIR/manifest.json" "$DEST/" 2>/dev/null || true

echo "      > Files copied"

echo ""
echo "[3/3] Verifying..."

if [ -f "$DEST/CSXS/manifest.xml" ]; then
  echo "      > Installation successful!"
else
  echo "      [!] Installation may have failed"
fi

# Fix permissions
chmod -R 755 "$DEST" 2>/dev/null

echo ""
echo "==============================================="
echo " Installation Complete!"
echo "==============================================="
echo ""
echo " Next steps:"
echo " 1. Restart After Effects / Premiere Pro"
echo " 2. Go to Window -> Extensions -> ATUL X SFX"
echo " 3. Add your SFX folder when prompted"
echo ""
echo " If extension doesn't appear:"
echo " - Make sure you allowed unsigned extensions"
echo " - Restart Adobe Creative Cloud"
echo " - Check: $EXT_FOLDER"
echo ""
echo " For UXP (Premiere 25.2+ / AE 25+):"
echo " - Use UXP Developer Tool"
echo " - Load manifest.json from this folder"
echo ""

read -p "Press Enter to close..."
