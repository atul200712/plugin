/**
 * ATUL X SFX - File System Abstraction
 * Supports CEP (Node fs) and UXP (storage API)
 */

class FileSystemManager {
  constructor() {
    this.isCEP = !!(window.cep || window.__adobe_cep__);
    this.isUXP = !!(window.uxp || window.require && (() => { try { require('uxp'); return true; } catch(e){return false;}})());
    this.supportedExts = ['.wav', '.mp3', '.aiff', '.aif', '.m4a', '.ogg', '.flac', '.wma', '.aac'];
    this.fs = null;
    this.path = null;
    
    if (this.isCEP) {
      try {
        // CEP has Node.js
        this.fs = window.cep ? window.cep.fs : (typeof require !== 'undefined' ? require('fs') : null);
        this.path = typeof require !== 'undefined' ? require('path') : null;
        if (!this.fs && typeof window.require === 'function') {
          try { this.fs = window.require('fs'); } catch(e) {}
        }
        if (!this.fs && typeof require === 'function') {
          try { this.fs = require('fs'); } catch(e) {}
        }
        // Fallback: try via cep_node
        if (!this.fs && window.cep_node) {
          this.fs = window.cep_node.require('fs');
          this.path = window.cep_node.require('path');
        }
      } catch (e) {
        console.warn('[FS] CEP fs init failed', e);
      }
    }
  }

  isAudioFile(fileName) {
    const lower = fileName.toLowerCase();
    return this.supportedExts.some(ext => lower.endsWith(ext));
  }

  // CEP: Show folder dialog via JSX or Node
  async selectFolderCEP() {
    return new Promise((resolve, reject) => {
      try {
        if (window.__adobe_cep__) {
          const cs = new CSInterface();
          // Use ExtendScript Folder.selectDialog
          cs.evalScript('Folder.selectDialog("Select your SFX Folder").fsName', (result) => {
            if (result && result !== 'null' && result !== 'undefined' && result !== '') {
              // Clean result - may have quotes
              let clean = result.replace(/^['"]|['"]$/g, '');
              if (clean && clean !== 'null') resolve(clean);
              else resolve(null);
            } else {
              resolve(null);
            }
          });
        } else {
          resolve(null);
        }
      } catch (e) {
        console.error('[FS] selectFolderCEP error', e);
        resolve(null);
      }
    });
  }

  // UXP: Use localFileSystem
  async selectFolderUXP() {
    try {
      const uxp = require('uxp');
      const lfs = uxp.storage.localFileSystem;
      const folder = await lfs.getFolder();
      if (!folder) return null;
      // Create persistent token
      const token = await lfs.createPersistentToken(folder);
      return {
        path: folder.nativePath || token,
        name: folder.name,
        token: token,
        entry: folder
      };
    } catch (e) {
      console.error('[FS] selectFolderUXP error', e);
      return null;
    }
  }

  async selectFolder() {
    if (this.isCEP) {
      const path = await this.selectFolderCEP();
      if (path) {
        return {
          path: path,
          name: path.split(/[/\\]/).pop(),
          token: null
        };
      }
      return null;
    } else if (this.isUXP) {
      return await this.selectFolderUXP();
    } else {
      // Browser fallback - use input
      return new Promise(resolve => {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.directory = true;
        input.onchange = (e) => {
          const files = e.target.files;
          if (files.length > 0) {
            const first = files[0];
            const rel = first.webkitRelativePath;
            const folderName = rel.split('/')[0];
            // Can't get real path in browser, but we can process files directly
            resolve({
              path: folderName,
              name: folderName,
              token: null,
              files: Array.from(files).filter(f => this.isAudioFile(f.name))
            });
          } else {
            resolve(null);
          }
        };
        input.click();
      });
    }
  }

  // Scan folder recursively - CEP version
  async scanFolderCEP(folderPath, depth = 0, maxDepth = 8) {
    const results = [];
    if (depth > maxDepth) return results;
    
    try {
      let fs = this.fs;
      let pathMod = this.path;
      
      // Try to get fs via various methods
      if (!fs) {
        try {
          if (window.require) fs = window.require('fs');
          else if (window.cep_node) fs = window.cep_node.require('fs');
          else fs = require('fs');
        } catch(e) {}
      }
      if (!pathMod) {
        try {
          if (window.require) pathMod = window.require('path');
          else if (window.cep_node) pathMod = window.cep_node.require('path');
          else pathMod = require('path');
        } catch(e) {}
      }

      if (!fs || !pathMod) {
        console.warn('[FS] No fs available, using JSX fallback');
        return await this.scanFolderViaJSX(folderPath);
      }

      const entries = fs.readdirSync(folderPath);
      for (const entry of entries) {
        const fullPath = pathMod.join(folderPath, entry);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            if (!entry.startsWith('.') && entry !== 'node_modules') {
              const sub = await this.scanFolderCEP(fullPath, depth + 1, maxDepth);
              results.push(...sub);
            }
          } else if (stat.isFile() && this.isAudioFile(entry)) {
            results.push({
              id: fullPath, // use path as id
              path: fullPath,
              name: entry.replace(/\.[^/.]+$/, ''),
              fileName: entry,
              ext: pathMod.extname(entry).toLowerCase(),
              size: stat.size,
              folder: pathMod.dirname(fullPath),
              folderName: folderPath.split(/[/\\]/).pop(),
              relativePath: fullPath.replace(folderPath, '').replace(/^[/\\]/, ''),
              duration: null, // will be probed later
              category: this.inferCategory(fullPath)
            });
          }
        } catch (e) {
          console.warn('[FS] stat error', fullPath, e);
        }
      }
    } catch (e) {
      console.error('[FS] scan error', folderPath, e);
    }
    return results;
  }

  async scanFolderViaJSX(folderPath) {
    return new Promise(resolve => {
      try {
        const cs = new CSInterface();
        const script = `
          (function(){
            var result = [];
            var root = new Folder("${folderPath.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}");
            if (!root.exists) return JSON.stringify([]);
            function scan(folder, depth) {
              if (depth > 8) return;
              var files = folder.getFiles();
              for (var i=0; i<files.length; i++) {
                var f = files[i];
                if (f instanceof Folder) {
                  if (f.name.charAt(0) !== '.') scan(f, depth+1);
                } else {
                  var n = f.name.toLowerCase();
                  if (n.match(/\\.(wav|mp3|aiff|aif|m4a|ogg|flac|wma|aac)$/)) {
                    result.push({
                      id: f.fsName,
                      path: f.fsName,
                      name: f.name.replace(/\\.[^/.]+$/, ''),
                      fileName: f.name,
                      ext: '.' + f.name.split('.').pop().toLowerCase(),
                      size: f.length || 0,
                      folder: f.parent.fsName,
                      folderName: f.parent.name,
                      relativePath: f.fsName.replace(root.fsName, '').replace(/^[/\\\\]/, ''),
                      category: f.parent.name
                    });
                  }
                }
              }
            }
            scan(root, 0);
            return JSON.stringify(result);
          })()
        `;
        cs.evalScript(script, (res) => {
          try {
            const parsed = JSON.parse(res);
            resolve(parsed.map(p => ({ ...p, category: this.inferCategory(p.path) })));
          } catch (e) {
            console.error('[FS] JSX parse error', e, res);
            resolve([]);
          }
        });
      } catch (e) {
        console.error('[FS] JSX scan error', e);
        resolve([]);
      }
    });
  }

  // UXP scanning
  async scanFolderUXP(folderEntry, basePath = '') {
    const results = [];
    try {
      const entries = await folderEntry.getEntries();
      for (const entry of entries) {
        if (entry.isFolder) {
          if (!entry.name.startsWith('.')) {
            const sub = await this.scanFolderUXP(entry, basePath + entry.name + '/');
            results.push(...sub);
          }
        } else if (entry.isFile && this.isAudioFile(entry.name)) {
          results.push({
            id: entry.nativePath || (basePath + entry.name),
            path: entry.nativePath || (basePath + entry.name),
            name: entry.name.replace(/\.[^/.]+$/, ''),
            fileName: entry.name,
            ext: '.' + entry.name.split('.').pop().toLowerCase(),
            size: 0,
            folder: basePath,
            folderName: basePath.split('/').filter(Boolean).pop() || folderEntry.name,
            relativePath: basePath + entry.name,
            category: this.inferCategory(basePath + entry.name),
            entry: entry
          });
        }
      }
    } catch (e) {
      console.error('[FS] UXP scan error', e);
    }
    return results;
  }

  inferCategory(filePath) {
    const lower = filePath.toLowerCase();
    const categories = {
      'whoosh': ['whoosh', 'swish'],
      'impact': ['impact', 'hit', 'slam', 'boom'],
      'transition': ['transition', 'trans'],
      'riser': ['riser', 'build', 'rise'],
      'downer': ['downer', 'fall', 'drop'],
      'glitch': ['glitch', 'digital', 'error'],
      'sci-fi': ['sci-fi', 'scifi', 'futuristic', 'space'],
      'cinematic': ['cinematic', 'trailer', 'epic'],
      'ui': ['ui', 'interface', 'click', 'pop', 'notification'],
      'bass': ['bass', 'sub', '808'],
      'drum': ['drum', 'perc', 'kick', 'snare', 'clap'],
      'ambient': ['ambient', 'atmos', 'pad', 'drone'],
      'fx': ['fx', 'effect']
    };
    for (const [cat, keywords] of Object.entries(categories)) {
      if (keywords.some(k => lower.includes(k))) return cat;
    }
    // Try to get folder name as category
    const parts = lower.split(/[/\\]/);
    if (parts.length > 1) {
      const folder = parts[parts.length - 2];
      if (folder && folder.length > 2) return folder;
    }
    return 'uncategorized';
  }

  async scanFolders(folderList) {
    let allFiles = [];
    for (const folder of folderList) {
      try {
        if (folder.files) {
          // Browser fallback - already has files
          const mapped = folder.files.map(f => ({
            id: f.name + '_' + f.size,
            path: f.name,
            name: f.name.replace(/\.[^/.]+$/, ''),
            fileName: f.name,
            ext: '.' + f.name.split('.').pop().toLowerCase(),
            size: f.size,
            folder: folder.name,
            folderName: folder.name,
            relativePath: f.webkitRelativePath || f.name,
            category: this.inferCategory(f.webkitRelativePath || f.name),
            fileObject: f
          }));
          allFiles.push(...mapped);
        } else if (folder.entry && folder.entry.getEntries) {
          // UXP
          const files = await this.scanFolderUXP(folder.entry);
          allFiles.push(...files);
        } else {
          // CEP
          const files = await this.scanFolderCEP(folder.path);
          allFiles.push(...files);
        }
      } catch (e) {
        console.error('[FS] scan folder error', folder, e);
      }
    }
    // Dedupe by path
    const seen = new Set();
    allFiles = allFiles.filter(f => {
      if (seen.has(f.path)) return false;
      seen.add(f.path);
      return true;
    });
    return allFiles;
  }

  // Get file URL for preview
  getFileUrl(fileObj) {
    if (fileObj.fileObject) {
      return URL.createObjectURL(fileObj.fileObject);
    }
    if (fileObj.entry) {
      // UXP - need to handle differently, for now use nativePath
      return fileObj.path;
    }
    // CEP - file:// URL
    let p = fileObj.path;
    if (!p.startsWith('file://')) {
      // Convert Windows path
      p = 'file:///' + p.replace(/\\/g, '/').replace(/ /g, '%20');
    }
    return p;
  }
}

window.AXFileSystem = new FileSystemManager();
