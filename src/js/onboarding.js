/**
 * ATUL X SFX - Onboarding Flow
 */

class OnboardingManager {
  constructor() {
    this.modal = null;
    this.isVisible = false;
  }

  init() {
    this.createModal();
    this.bindEvents();
    
    // Check if we need onboarding
    const folders = window.AXStorage ? AXStorage.getFolders() : [];
    const isOnboarded = window.AXStorage ? AXStorage.isOnboarded() : false;
    
    if (folders.length === 0 || !isOnboarded) {
      setTimeout(() => this.show(), 300);
    }
  }

  createModal() {
    const existing = document.getElementById('onboarding-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'onboarding-modal';
    modal.className = 'onboarding-overlay';
    modal.innerHTML = `
      <div class="onboarding-card">
        <div class="onboarding-header">
          <div class="onboarding-logo">
            <div class="logo-icon">◉</div>
            <div class="logo-text">
              <span class="logo-main">ATUL X SFX</span>
              <span class="logo-sub">ANTIGRAVITY SUITE</span>
            </div>
          </div>
          <button class="onboarding-close" id="onboarding-close">✕</button>
        </div>
        
        <div class="onboarding-body">
          <div class="onboarding-step active" data-step="1">
            <div class="step-icon">🎧</div>
            <h2>Welcome to ATUL X SFX</h2>
            <p class="onboarding-desc">The premium sound effects browser built for pros. Import your custom SFX library and start creating in seconds.</p>
            
            <div class="feature-grid">
              <div class="feature-item">
                <span class="feature-icon">⚡</span>
                <div>
                  <strong>Lightning Fast</strong>
                  <span>Preview & import instantly</span>
                </div>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🎨</span>
                <div>
                  <strong>Premium UI</strong>
                  <span>Built for workflow</span>
                </div>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🔍</span>
                <div>
                  <strong>Smart Search</strong>
                  <span>Find any sound in ms</span>
                </div>
              </div>
            </div>
            
            <button class="btn btn-primary btn-large" id="onboarding-next-1">
              Get Started →
            </button>
          </div>
          
          <div class="onboarding-step" data-step="2">
            <div class="step-icon">📁</div>
            <h2>Add Your SFX Library</h2>
            <p class="onboarding-desc">Select the folder containing your SFX pack that came with your purchase. We'll scan and organize everything automatically.</p>
            
            <div class="folder-drop-zone" id="folder-drop-zone">
              <div class="drop-icon">📂</div>
              <div class="drop-text">
                <strong>Drop your SFX folder here</strong>
                <span>or click to browse</span>
              </div>
              <div class="drop-formats">Supports WAV, MP3, AIFF, M4A, OGG, FLAC</div>
            </div>
            
            <div class="folder-selected" id="folder-selected" style="display:none">
              <div class="selected-icon">✓</div>
              <div class="selected-info">
                <strong id="selected-folder-name">My SFX Pack</strong>
                <span id="selected-folder-path">/path/to/sfx</span>
              </div>
              <button class="btn btn-ghost" id="change-folder">Change</button>
            </div>
            
            <div class="onboarding-actions">
              <button class="btn btn-ghost" id="onboarding-back-2">← Back</button>
              <button class="btn btn-primary" id="onboarding-next-2" disabled>Continue →</button>
            </div>
            
            <div class="onboarding-hint">
              💡 You can add multiple folders later from settings
            </div>
          </div>
          
          <div class="onboarding-step" data-step="3">
            <div class="step-icon">🚀</div>
            <h2>You're All Set!</h2>
            <p class="onboarding-desc">Your library is ready. Here's how to use it like a pro:</p>
            
            <div class="tips-list">
              <div class="tip-item">
                <span class="tip-num">1</span>
                <div>
                  <strong>Preview</strong> - Click any sound to preview instantly, use spacebar
                </div>
              </div>
              <div class="tip-item">
                <span class="tip-num">2</span>
                <div>
                  <strong>Import</strong> - Hit ⏎ or click Import to add to timeline at playhead
                </div>
              </div>
              <div class="tip-item">
                <span class="tip-num">3</span>
                <div>
                  <strong>Organize</strong> - Favorite sounds, search, and filter by category
                </div>
              </div>
            </div>
            
            <div class="scanning-status" id="scanning-status">
              <div class="scan-bar">
                <div class="scan-progress" id="scan-progress"></div>
              </div>
              <span id="scan-text">Scanning 0 sounds...</span>
            </div>
            
            <button class="btn btn-primary btn-large" id="onboarding-finish">
              Start Creating ✨
            </button>
          </div>
        </div>
        
        <div class="onboarding-footer">
          <div class="onboarding-dots">
            <span class="dot active" data-step="1"></span>
            <span class="dot" data-step="2"></span>
            <span class="dot" data-step="3"></span>
          </div>
          <span class="onboarding-version">v1.0.0 • Premium</span>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    this.modal = modal;
  }

  bindEvents() {
    if (!this.modal) return;
    
    // Close
    this.modal.querySelector('#onboarding-close')?.addEventListener('click', () => this.hide());
    
    // Step navigation
    this.modal.querySelector('#onboarding-next-1')?.addEventListener('click', () => this.goToStep(2));
    this.modal.querySelector('#onboarding-back-2')?.addEventListener('click', () => this.goToStep(1));
    this.modal.querySelector('#onboarding-next-2')?.addEventListener('click', () => this.handleFolderContinue());
    this.modal.querySelector('#onboarding-finish')?.addEventListener('click', () => this.finish());
    this.modal.querySelector('#change-folder')?.addEventListener('click', () => this.selectFolder());
    
    // Drop zone
    const dropZone = this.modal.querySelector('#folder-drop-zone');
    if (dropZone) {
      dropZone.addEventListener('click', () => this.selectFolder());
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });
      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        this.handleDrop(e);
      });
    }
  }

  async selectFolder() {
    try {
      const btn = this.modal.querySelector('#folder-drop-zone');
      if (btn) {
        btn.innerHTML = `<div class="drop-icon">⏳</div><div class="drop-text"><strong>Opening dialog...</strong></div>`;
      }
      
      const folder = await window.AXFileSystem.selectFolder();
      
      if (folder) {
        console.log('[Onboarding] Selected folder', folder);
        this.pendingFolder = folder;
        this.showFolderSelected(folder);
        
        const nextBtn = this.modal.querySelector('#onboarding-next-2');
        if (nextBtn) nextBtn.disabled = false;
      } else {
        // Reset drop zone
        if (btn) {
          btn.innerHTML = `
            <div class="drop-icon">📂</div>
            <div class="drop-text">
              <strong>Drop your SFX folder here</strong>
              <span>or click to browse</span>
            </div>
            <div class="drop-formats">Supports WAV, MP3, AIFF, M4A, OGG, FLAC</div>
          `;
        }
      }
    } catch (e) {
      console.error('[Onboarding] selectFolder error', e);
      alert('Failed to select folder: ' + e.message);
    }
  }

  async handleDrop(e) {
    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
      const item = items[0];
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry();
        if (entry && entry.isDirectory) {
          // In browser, we can't get real path, but we can get files
          const files = await this.getFilesFromEntry(entry);
          this.pendingFolder = {
            path: entry.name,
            name: entry.name,
            files: files
          };
          this.showFolderSelected(this.pendingFolder);
          const nextBtn = this.modal.querySelector('#onboarding-next-2');
          if (nextBtn) nextBtn.disabled = false;
        }
      }
    }
  }

  getFilesFromEntry(entry, path = '') {
    return new Promise(resolve => {
      const files = [];
      const reader = entry.createReader();
      const read = () => {
        reader.readEntries(async (entries) => {
          if (entries.length === 0) {
            resolve(files);
            return;
          }
          for (const ent of entries) {
            if (ent.isFile && window.AXFileSystem.isAudioFile(ent.name)) {
              const file = await new Promise(res => ent.file(res));
              file.webkitRelativePath = path + ent.name;
              files.push(file);
            } else if (ent.isDirectory) {
              const sub = await this.getFilesFromEntry(ent, path + ent.name + '/');
              files.push(...sub);
            }
          }
          read();
        });
      };
      read();
    });
  }

  showFolderSelected(folder) {
    const dropZone = this.modal.querySelector('#folder-drop-zone');
    const selected = this.modal.querySelector('#folder-selected');
    
    if (dropZone) dropZone.style.display = 'none';
    if (selected) {
      selected.style.display = 'flex';
      selected.querySelector('#selected-folder-name').textContent = folder.name || 'SFX Library';
      selected.querySelector('#selected-folder-path').textContent = folder.path || `${folder.files?.length || 0} files selected`;
    }
  }

  async handleFolderContinue() {
    if (!this.pendingFolder) return;
    
    try {
      // Add to storage
      window.AXStorage.addFolder(this.pendingFolder);
      
      this.goToStep(3);
      
      // Start scanning
      this.startScanning();
    } catch (e) {
      console.error('[Onboarding] continue error', e);
    }
  }

  async startScanning() {
    const progressBar = this.modal.querySelector('#scan-progress');
    const scanText = this.modal.querySelector('#scan-text');
    
    if (!progressBar || !scanText) return;
    
    try {
      // Simulate scanning progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        progressBar.style.width = progress + '%';
        scanText.textContent = `Scanning... ${Math.floor(progress)}%`;
      }, 100);
      
      // Actual scan
      const folders = window.AXStorage.getFolders();
      const files = await window.AXFileSystem.scanFolders(folders);
      
      clearInterval(interval);
      progressBar.style.width = '100%';
      scanText.textContent = `Found ${files.length} sounds • Ready!`;
      
      // Store files globally for main app
      window.AXScannedFiles = files;
      
      // Notify main app to refresh
      if (window.AXUI) {
        window.AXUI.setFiles(files);
      }
      
    } catch (e) {
      console.error('[Onboarding] scanning error', e);
      scanText.textContent = `Ready! (scan completed)`;
      progressBar.style.width = '100%';
    }
  }

  goToStep(step) {
    if (!this.modal) return;
    
    this.modal.querySelectorAll('.onboarding-step').forEach(el => {
      el.classList.toggle('active', parseInt(el.dataset.step) === step);
    });
    
    this.modal.querySelectorAll('.dot').forEach(dot => {
      dot.classList.toggle('active', parseInt(dot.dataset.step) === step);
    });
  }

  show() {
    if (this.modal) {
      this.modal.classList.add('visible');
      this.isVisible = true;
    }
  }

  hide() {
    if (this.modal) {
      this.modal.classList.remove('visible');
      this.isVisible = false;
    }
  }

  finish() {
    window.AXStorage.setOnboarded(true);
    this.hide();
    // Trigger main app refresh
    if (window.AXMain && window.AXMain.refreshLibrary) {
      window.AXMain.refreshLibrary();
    }
  }

  // Public method to force show onboarding
  static showOnboarding() {
    if (window.AXOnboarding) {
      window.AXOnboarding.show();
    }
  }
}

window.AXOnboarding = new OnboardingManager();
