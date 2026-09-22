@echo off
title ATUL X SFX Installer
color 0A
echo.
echo  ===============================================
echo   ATUL X SFX - Premium SFX Plugin Installer
echo   For After Effects & Premiere Pro
echo  ===============================================
echo.

:: Check admin
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo  [!] Please run as Administrator for system-wide install
    echo      Right-click -^> Run as administrator
    echo.
    pause
)

:: Enable unsigned extensions
echo  [1/3] Enabling unsigned extensions...

reg add "HKCU\Software\Adobe\CSXS.8" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKCU\Software\Adobe\CSXS.9" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
reg add "HKCU\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1

:: For newer Adobe versions
reg add "HKCU\Software\Adobe\CSXS.8" /v LogLevel /t REG_SZ /d 6 /f >nul 2>&1
reg add "HKCU\Software\Adobe\CSXS.9" /v LogLevel /t REG_SZ /d 6 /f >nul 2>&1

echo       ^> Debug mode enabled

:: Determine extension folder
set "EXT_FOLDER=%ProgramFiles(x86)%\Common Files\Adobe\CEP\extensions"
if not exist "%EXT_FOLDER%" set "EXT_FOLDER=%ProgramFiles%\Common Files\Adobe\CEP\extensions"
if not exist "%EXT_FOLDER%" (
    echo  [!] Could not find CEP extensions folder
    echo      Creating at: %APPDATA%\Adobe\CEP\extensions
    set "EXT_FOLDER=%APPDATA%\Adobe\CEP\extensions"
)

echo.
echo  [2/3] Installing extension...

:: Get script dir
set "SCRIPT_DIR=%~dp0"
:: Go one level up if we're in installer folder
if exist "%SCRIPT_DIR%..\CSXS\manifest.xml" set "SOURCE_DIR=%SCRIPT_DIR%.."
if exist "%SCRIPT_DIR%CSXS\manifest.xml" set "SOURCE_DIR=%SCRIPT_DIR%"
if not defined SOURCE_DIR set "SOURCE_DIR=%SCRIPT_DIR%.."

:: Destination
set "DEST=%EXT_FOLDER%\com.atulxsfx.plugin"

echo       Source: %SOURCE_DIR%
echo       Dest: %DEST%

:: Copy
if exist "%DEST%" rmdir /S /Q "%DEST%" >nul 2>&1
mkdir "%DEST%" >nul 2>&1
xcopy /E /I /Y "%SOURCE_DIR%\CSXS" "%DEST%\CSXS" >nul
xcopy /E /I /Y "%SOURCE_DIR%\src" "%DEST%\src" >nul
xcopy /E /I /Y "%SOURCE_DIR%\jsx" "%DEST%\jsx" >nul
copy /Y "%SOURCE_DIR%\manifest.json" "%DEST%\" >nul 2>&1

echo       ^> Files copied

echo.
echo  [3/3] Verifying...

if exist "%DEST%\CSXS\manifest.xml" (
    echo       ^> Installation successful!
) else (
    echo       [!] Installation may have failed - manifest not found
)

echo.
echo  ===============================================
echo   Installation Complete!
echo  ===============================================
echo.
echo   Next steps:
echo   1. Restart After Effects / Premiere Pro
echo   2. Go to Window -^> Extensions -^> ATUL X SFX
echo   3. Add your SFX folder when prompted
echo.
echo   If extension doesn't appear:
echo   - Make sure you ran as Administrator
echo   - Restart Adobe Creative Cloud
echo   - Check: %EXT_FOLDER%
echo.
pause
