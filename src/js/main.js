/**
 * ATUL X SFX - Main Entry
 * Premium SFX Plugin for After Effects & Premiere Pro
 */

class MainApp {
  constructor() {
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    
    console.log('%c ATUL X SFX v1.0.0 ', 'background:#7c3aed;color:white;padding:4px 8px;border-radius:4px;font-weight:bold');
    console.log('[Main] Initializing...', {
      isCEP: !!(window.cep || window.__adobe_cep__),
      host: window.AXHost ? AXHost.getAppName() : 'unknown'
    });

    // Wait for DOM
    if (document.readyState === 'loading') {
      await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
    }

    // Init storage defaults
    if (!window.AXStorage) {
      console.error('[Main] Storage not loaded');
      return;
    }

    // Init UI
    if (window.AXUI) {
      window.AXUI.init();
    }

    // Init onboarding
    if (window.AXOnboarding) {
      window.AXOnboarding.init();
    }

    // Set host info
    const hostEl = document.getElementById('app-host');
    if (hostEl && window.AXHost) {
      hostEl.textContent = `${AXHost.getAppName()} • v1.0.0 • Premium`;
    }

    // Load library
    await this.refreshLibrary();

    // Bind global events
    this.bindGlobalEvents();

    // Handle theme
    this.applyTheme();

    this.isInitialized = true;
    console.log('[Main] Initialized successfully');
    
    // If no folders, onboarding will show automatically
    const folders = window.AXStorage.getFolders();
    if (folders.length === 0) {
      console.log('[Main] No folders, showing onboarding');
    }
  }

  async refreshLibrary() {
    const folders = window.AXStorage.getFolders();
    
    if (folders.length === 0) {
      // No folders - show empty state, onboarding will handle
      if (window.AXUI) {
        window.AXUI.setFiles([]);
        window.AXUI.hideLoading();
      }
      return;
    }

    if (window.AXUI) window.AXUI.showLoading(`Scanning ${folders.length} folder(s)...`);

    try {
      const files = await window.AXFileSystem.scanFolders(folders);
      console.log('[Main] Scanned files:', files.length);
      
      if (window.AXUI) {
        window.AXUI.setFiles(files);
        window.AXUI.hideLoading();
      }

      // If onboarding has scanned files, use those
      if (window.AXScannedFiles && window.AXScannedFiles.length > 0) {
        if (window.AXUI) window.AXUI.setFiles(window.AXScannedFiles);
      }

    } catch (e) {
      console.error('[Main] refreshLibrary error', e);
      if (window.AXUI) {
        window.AXUI.hideLoading();
        window.AXUI.showToast('Failed to scan library', 'error');
      }
    }
  }

  bindGlobalEvents() {
    // Handle drag & drop of folders onto app
    const app = document.getElementById('app');
    if (app) {
      app.addEventListener('dragover', (e) => {
        e.preventDefault();
        app.classList.add('drag-over');
      });
      
      app.addEventListener('dragleave', () => {
        app.classList.remove('drag-over');
      });
      
      app.addEventListener('drop', async (e) => {
        e.preventDefault();
        app.classList.remove('drag-over');
        
        // Check if dropping a folder (browser mode)
        const items = e.dataTransfer.items;
        if (items && items.length > 0) {
          for (const item of items) {
            const entry = item.webkitGetAsEntry?.();
            if (entry && entry.isDirectory) {
              if (window.AXOnboarding) {
                window.AXOnboarding.show();
              }
              break;
            }
          }
        }
      });
    }

    // Handle CEP theme changes
    if (window.__adobe_cep__) {
      try {
        const cs = new CSInterface();
        cs.addEventListener(CSInterface.THEME_COLOR_CHANGED_EVENT, (e) => {
          this.applyTheme();
        });
      } catch (err) {
        console.warn('[Main] Theme listener failed', err);
      }
    }

    // Prevent context menu on right click (we have custom)
    document.addEventListener('contextmenu', (e) => {
      if (!e.target.closest('.sfx-card')) {
        e.preventDefault();
      }
    });
  }

  applyTheme() {
    // Auto-detect dark/light from host if available
    try {
      if (window.__adobe_cep__) {
        const cs = new CSInterface();
        const env = cs.getHostEnvironment();
        // Could use env to adjust theme
      }
    } catch (e) {}
  }

  // Public API for onboarding
  async onFolderAdded(folder) {
    await this.refreshLibrary();
  }
}

// Initialize
window.AXMain = new MainApp();

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.AXMain.init());
} else {
  window.AXMain.init();
}

// Expose for debugging
window.ATUL_X_SFX = {
  version: '1.0.0',
  getFiles: () => window.AXUI?.files || [],
  getFiltered: () => window.AXUI?.filtered || [],
  refresh: () => window.AXMain.refreshLibrary(),
  storage: () => window.AXStorage,
  audio: () => window.AXAudio,
  host: () => window.AXHost,
  showOnboarding: () => window.AXOnboarding?.show(),
  clear: () => {
    window.AXStorage.clearAll();
    location.reload();
  }
};
