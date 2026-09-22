/**
 * ATUL X SFX - Storage Manager
 * Handles persistent storage for folders, favorites, recents, settings
 */

class StorageManager {
  constructor() {
    this.KEYS = {
      FOLDERS: 'atulxsfx_folders',
      FAVORITES: 'atulxsfx_favorites',
      RECENT: 'atulxsfx_recent',
      SETTINGS: 'atulxsfx_settings',
      TAGS: 'atulxsfx_tags',
      ONBOARDING: 'atulxsfx_onboarded'
    };
    this.defaults = {
      settings: {
        volume: 0.8,
        autoPlay: true,
        showWaveform: true,
        theme: 'dark',
        sortBy: 'name',
        sortOrder: 'asc',
        viewMode: 'list',
        normalizePreview: true,
        lastCategory: 'all'
      }
    };
  }

  // Generic get/set
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('[Storage] parse error', key, e);
      return fallback;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('[Storage] set error', key, e);
      return false;
    }
  }

  // Folders - array of { id, path, name, token, addedAt }
  getFolders() {
    return this.get(this.KEYS.FOLDERS, []);
  }

  addFolder(folderObj) {
    const folders = this.getFolders();
    // prevent duplicates by path
    if (folders.some(f => f.path === folderObj.path)) return folders;
    folders.push({
      id: folderObj.id || 'folder_' + Date.now(),
      path: folderObj.path,
      name: folderObj.name || folderObj.path.split(/[/\\]/).pop(),
      token: folderObj.token || null,
      addedAt: Date.now()
    });
    this.set(this.KEYS.FOLDERS, folders);
    return folders;
  }

  removeFolder(folderId) {
    let folders = this.getFolders();
    folders = folders.filter(f => f.id !== folderId);
    this.set(this.KEYS.FOLDERS, folders);
    return folders;
  }

  clearFolders() {
    this.set(this.KEYS.FOLDERS, []);
  }

  // Favorites - array of file paths or ids
  getFavorites() {
    return this.get(this.KEYS.FAVORITES, []);
  }

  isFavorite(fileId) {
    return this.getFavorites().includes(fileId);
  }

  toggleFavorite(fileId) {
    let favs = this.getFavorites();
    if (favs.includes(fileId)) {
      favs = favs.filter(id => id !== fileId);
    } else {
      favs.push(fileId);
    }
    this.set(this.KEYS.FAVORITES, favs);
    return favs;
  }

  // Recent - array of file ids, max 50
  getRecent() {
    return this.get(this.KEYS.RECENT, []);
  }

  addRecent(fileId) {
    let recent = this.getRecent();
    recent = recent.filter(id => id !== fileId);
    recent.unshift(fileId);
    if (recent.length > 50) recent = recent.slice(0, 50);
    this.set(this.KEYS.RECENT, recent);
    return recent;
  }

  // Settings
  getSettings() {
    return { ...this.defaults.settings, ...this.get(this.KEYS.SETTINGS, {}) };
  }

  updateSettings(patch) {
    const current = this.getSettings();
    const updated = { ...current, ...patch };
    this.set(this.KEYS.SETTINGS, updated);
    return updated;
  }

  // Tags - map fileId -> array of tags
  getTags() {
    return this.get(this.KEYS.TAGS, {});
  }

  setFileTags(fileId, tags) {
    const all = this.getTags();
    all[fileId] = tags;
    this.set(this.KEYS.TAGS, all);
    return all;
  }

  // Onboarding
  isOnboarded() {
    return this.get(this.KEYS.ONBOARDING, false);
  }

  setOnboarded(v = true) {
    this.set(this.KEYS.ONBOARDING, v);
  }

  // Clear all
  clearAll() {
    Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
  }
}

window.AXStorage = new StorageManager();
