# Changelog

## v1.0.0 - 2026-09-22 - Antigravity Edition (Initial Premium Release)

### Added
- Premium dark UI with glassmorphism, smooth animations
- Onboarding flow: Welcome → Add Folder → Scanning → Ready
- Dual engine: CEP (AE 15+, PPro 12+) + UXP (AE 24+, PPro 24+)
- File system abstraction: CEP Node fs + UXP storage + browser fallback
- Audio engine: HTML5 Audio + Web Audio API waveform, dummy fallback
- Host adapter: AE `importFile` + comp add, PPro `importFiles` + `insertClip` at playhead
- Storage: localStorage for folders, favorites, recent, settings, tags
- UI manager: Virtualized list, search (150ms debounce), category auto-detect, folder filter
- Features: Favorites, Recent, Search, Categories, Multi-folder, Grid/List view, Sort
- Player: Waveform seek, volume, loop, favorite, import
- Keyboard: Space play, Enter import, arrows navigate, double-click import, drag to timeline
- Installers: Windows .bat (admin, enables debug), macOS .command
- Docs: INSTALL, USER_GUIDE, PACKAGING
- Demo SFX pack: 30 wav files across 6 categories

### Tech
- No build step, pure HTML/CSS/JS
- CSInterface.js minimal
- JSX host bridge for file scanning and import
- Toast system, context menu, loading states, empty states

### For Sellers
- Easy to distribute: Plugin ZIP + SFX ZIP separate
- Customer adds SFX folder on first launch
- Professional, no watermarks
