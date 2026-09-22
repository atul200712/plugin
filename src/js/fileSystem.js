/**
 * ATUL X SFX - File System Abstraction - FIXED for nested SFX packs
 */

class FileSystemManager {
  constructor() {
    this.isCEP = !!(window.cep || window.__adobe_cep__);
    this.isUXP = false;
    try {
      if (typeof require !== 'undefined') {
        const maybe = require('uxp');
        if (maybe && maybe.storage) this.isUXP = true;
      }
    } catch(e) {}
    this.supportedExts = ['.wav', '.mp3', '.aiff', '.aif', '.m4a', '.ogg', '.flac', '.wma', '.aac', '.mp2', '.opus', '.wma', '.aifc'];
    this.fs = null;
    this.path = null;
    
    if (this.isCEP) {
      try {
        this.fs = window.cep ? window.cep.fs : null;
        if (!this.fs && typeof window.require === 'function') {
          try { this.fs = window.require('fs'); } catch(e) {}
        }
        if (!this.fs && typeof require === 'function') {
          try { this.fs = require('fs'); } catch(e) {}
        }
        if (!this.fs && window.cep_node) {
          this.fs = window.cep_node.require('fs');
          this.path = window.cep_node.require('path');
        }
        if (!this.path) {
          try {
            if (window.require) this.path = window.require('path');
            else this.path = require('path');
          } catch(e) {}
        }
      } catch (e) {
        console.warn('[FS] CEP fs init failed', e);
      }
    }
  }

  isAudioFile(fileName, fileObj = null) {
    if (!fileName && !fileObj) return false;
    // Ultra permissive for browser: check mime
    if (fileObj && fileObj.type) {
      if (fileObj.type.startsWith('audio/')) return true;
      if (fileObj.type === '' && fileObj.size > 5000) {
        // Many SFX packs have no mime type but are audio - allow if size reasonable
        // We'll allow in browser mode
      }
    }
    if (!fileName) return false;
    const lower = fileName.toLowerCase();
    // Check extension
    if (this.supportedExts.some(ext => lower.endsWith(ext))) return true;
    // Also check if name contains .wav .mp3 etc anywhere
    if (lower.includes('.wav') || lower.includes('.mp3') || lower.includes('.aiff') || lower.includes('.m4a')) return true;
    // For browser preview, be extra permissive: if file has no extension but is in SFX folder, treat as audio
    // This handles cases where Windows hides extension or files have no ext
    if (!lower.includes('.') && fileObj && fileObj.size > 1000) {
      console.log('[FS] File with no extension treated as audio:', fileName);
      return true;
    }
    return false;
  }

  async selectFolderCEP() {
    return new Promise((resolve) => {
      try {
        if (window.__adobe_cep__) {
          const cs = new CSInterface();
          cs.evalScript('Folder.selectDialog("Select your SFX Folder").fsName', (result) => {
            if (result && result !== 'null' && result !== 'undefined' && result !== '') {
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

  async selectFolderUXP() {
    try {
      const uxp = require('uxp');
      const lfs = uxp.storage.localFileSystem;
      const folder = await lfs.getFolder();
      if (!folder) return null;
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
        return { path: path, name: path.split(/[/\\]/).pop(), token: null };
      }
      return null;
    } else if (this.isUXP) {
      return await this.selectFolderUXP();
    } else {
      // Browser - ULTRA PERMISSIVE
      return new Promise(resolve => {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.multiple = true;
        input.setAttribute('directory', '');
        input.setAttribute('webkitdirectory', '');
        
        input.onchange = (e) => {
          const files = e.target.files;
          console.log('[FS] Raw selected', files.length, 'files');
          if (files.length > 0) {
            const first = files[0];
            const rel = first.webkitRelativePath || '';
            const rootFolderName = rel.split('/')[0] || 'SFX Library';
            const fileArray = Array.from(files);
            
            // Log first 5 files for debug
            console.log('[FS] First 5 files:', fileArray.slice(0,5).map(f=>({
              name: f.name, 
              type: f.type, 
              size: f.size,
              rel: f.webkitRelativePath
            })));
            
            // In browser, include ALL files that look like audio OR are reasonably sized
            // Don't filter strictly - include everything and let UI show
            let audioFiles = fileArray.filter(f => {
              const name = f.name.toLowerCase();
              const isAudioExt = this.supportedExts.some(ext => name.endsWith(ext));
              const isAudioMime = f.type.startsWith('audio/');
              const noExtButLarge = !name.includes('.') && f.size > 5000;
              const hasAudioInName = name.includes('.wav') || name.includes('.mp3') || name.includes('.aif');
              return isAudioExt || isAudioMime || noExtButLarge || hasAudioInName || f.size > 1000;
            });
            
            // If still 0, include ALL files > 1kb (user selected SFX folder, so assume all are SFX)
            if (audioFiles.length === 0) {
              console.warn('[FS] No audio detected by strict check, including all files >1kb as fallback');
              audioFiles = fileArray.filter(f => f.size > 1000);
            }
            
            console.log('[FS] Final audio files:', audioFiles.length);
            
            resolve({
              path: rootFolderName,
              name: rootFolderName,
              token: null,
              files: audioFiles,
              allFilesCount: files.length,
              audioCount: audioFiles.length,
              rawFiles: fileArray.slice(0,3) // for debug
            });
          } else {
            resolve(null);
          }
        };
        
        input.style.display = 'none';
        document.body.appendChild(input);
        input.click();
        setTimeout(()=>{ try{ document.body.removeChild(input); }catch(e){} }, 2000);
      });
    }
  }

  async scanFolderCEP(folderPath, depth = 0, maxDepth = 10) {
    const results = [];
    if (depth > maxDepth) return results;
    try {
      let fs = this.fs;
      let pathMod = this.path;
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
        return await this.scanFolderViaJSX(folderPath);
      }
      const entries = fs.readdirSync(folderPath);
      for (const entry of entries) {
        const fullPath = pathMod.join(folderPath, entry);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            if (!entry.startsWith('.') && entry !== 'node_modules' && !entry.startsWith('__')) {
              const sub = await this.scanFolderCEP(fullPath, depth + 1, maxDepth);
              results.push(...sub);
            }
          } else if (stat.isFile() && this.isAudioFile(entry)) {
            results.push({
              id: fullPath,
              path: fullPath,
              name: entry.replace(/\.[^/.]+$/, ''),
              fileName: entry,
              ext: pathMod.extname(entry).toLowerCase() || '.wav',
              size: stat.size,
              folder: pathMod.dirname(fullPath),
              folderName: this.getFolderNameFromPath(fullPath),
              relativePath: fullPath.replace(folderPath, '').replace(/^[/\\]/, ''),
              category: this.inferCategory(fullPath),
              fileObject: null
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

  getFolderNameFromPath(fullPath) {
    try {
      const parts = fullPath.split(/[/\\]/);
      if (parts.length >= 2) return parts[parts.length - 2];
      return 'Unknown';
    } catch(e) { return 'Unknown'; }
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
              if (depth > 10) return;
              var files = folder.getFiles();
              for (var i=0; i<files.length; i++) {
                var f = files[i];
                if (f instanceof Folder) {
                  if (f.name.charAt(0) !== '.') scan(f, depth+1);
                } else {
                  var n = f.name.toLowerCase();
                  if (n.match(/\\.(wav|mp3|aiff|aif|m4a|ogg|flac|wma|aac|mp2|opus)$/) || n.indexOf('.') === -1) {
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
            resolve(parsed.map(p => ({ ...p, category: this.inferCategory(p.path), ext: p.ext || '.wav' })));
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
            folderName: basePath.split('/').filter(Boolean).pop() || entry.name,
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
    if (!filePath) return 'uncategorized';
    const lower = filePath.toLowerCase();
    const map = {
      'bells': ['bell'],
      'camera': ['camera'],
      'cinematic & epic': ['cinematic', 'epic'],
      'drone & ambient': ['drone', 'ambient'],
      'elements & nature': ['elements', 'nature'],
      'explosions': ['explosion'],
      'glitch': ['glitch'],
      'guns & weapons': ['gun', 'weapon'],
      'hits & impacts': ['hits & impacts', 'hits', 'impact'],
      'horror & tension': ['horror', 'tension'],
      'melody & tonal': ['melody', 'tonal'],
      'memes & funny': ['meme', 'funny'],
      'risers': ['riser'],
      'slow motion': ['slow motion'],
      'sub drops': ['sub drop', 'sub drops', 'sub'],
      'transitions': ['transition'],
      'ui & clicks': ['ui & clicks', 'ui', 'click'],
      'whoosh & swoosh': ['whoosh', 'swoosh', 'swish'],
      'whoosh': ['whoosh', 'swoosh'],
      'impact': ['impact', 'hit'],
      'transition': ['transition'],
      'riser': ['riser', 'build'],
      'bass': ['bass'],
      'ambient': ['ambient', 'drone'],
      'miscellaneous': ['misc']
    };
    for (const [cat, keys] of Object.entries(map)) {
      if (keys.some(k => lower.includes(k))) return cat;
    }
    const parts = lower.split(/[/\\]/);
    if (parts.length >= 2) {
      const parent = parts[parts.length - 2];
      if (parent && parent.length > 1 && !parent.includes('arranged')) return parent;
    }
    return 'uncategorized';
  }

  async scanFolders(folderList) {
    let allFiles = [];
    console.log('[FS] scanFolders start, folders:', folderList.length);
    
    for (const folder of folderList) {
      try {
        if (folder.files) {
          console.log('[FS] Browser folder', folder.name, 'files:', folder.files.length);
          const mapped = folder.files.map(f => {
            const relPath = f.webkitRelativePath || f.name;
            const parts = relPath.split('/');
            let folderName = folder.name;
            if (parts.length >= 3) {
              folderName = parts[parts.length - 2];
            } else if (parts.length === 2) {
              folderName = parts[0] !== folder.name ? parts[0] : parts[0];
              // If root is Arranged sfx, use subfolder
              if (folderName.toLowerCase().includes('arranged') && parts.length >= 2) {
                folderName = parts[1] || folderName;
                if (parts.length >= 3) folderName = parts[1];
              }
            }
            
            // More robust: get immediate parent folder name
            if (parts.length >= 2) {
              const immediateParent = parts[parts.length - 2];
              if (immediateParent && !immediateParent.toLowerCase().includes('arranged sfx')) {
                folderName = immediateParent;
              } else if (parts.length >= 3) {
                folderName = parts[parts.length - 2];
              }
            }
            
            const nameWithoutExt = f.name.includes('.') ? f.name.replace(/\.[^/.]+$/, '') : f.name;
            const ext = f.name.includes('.') ? '.' + f.name.split('.').pop().toLowerCase() : '.wav';
            
            return {
              id: relPath + '_' + f.size + '_' + f.name,
              path: relPath,
              name: nameWithoutExt,
              fileName: f.name,
              ext: ext,
              size: f.size,
              folder: parts.slice(0, -1).join('/'),
              folderName: folderName,
              relativePath: relPath,
              category: this.inferCategory(relPath),
              fileObject: f
            };
          });
          console.log('[FS] Mapped sample', mapped.slice(0,2));
          allFiles.push(...mapped);
        } else if (folder.entry && folder.entry.getEntries) {
          const files = await this.scanFolderUXP(folder.entry);
          allFiles.push(...files);
        } else {
          const files = await this.scanFolderCEP(folder.path);
          allFiles.push(...files);
        }
      } catch (e) {
        console.error('[FS] scan folder error', folder, e);
      }
    }
    
    // Dedupe
    const seen = new Set();
    const deduped = [];
    for (const f of allFiles) {
      if (!seen.has(f.id)) {
        seen.add(f.id);
        deduped.push(f);
      }
    }
    
    console.log('[FS] Final total', deduped.length, 'files');
    return deduped;
  }

  getFileUrl(fileObj) {
    if (fileObj.fileObject) {
      return URL.createObjectURL(fileObj.fileObject);
    }
    if (fileObj.entry) return fileObj.path;
    let p = fileObj.path;
    if (!p.startsWith('file://') && !p.startsWith('blob:') && !p.startsWith('http')) {
      p = 'file:///' + p.replace(/\\/g, '/').replace(/ /g, '%20');
    }
    return p;
  }
}

window.AXFileSystem = new FileSystemManager();
