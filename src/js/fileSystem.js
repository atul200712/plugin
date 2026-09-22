/**
 * ATUL X SFX - File System Abstraction
 * Supports CEP (Node fs) and UXP (storage API) and Browser
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
    this.supportedExts = ['.wav', '.mp3', '.aiff', '.aif', '.m4a', '.ogg', '.flac', '.wma', '.aac', '.mp2', '.opus'];
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
    // Check mime type first if available
    if (fileObj && fileObj.type && fileObj.type.startsWith('audio/')) return true;
    if (!fileName) return false;
    const lower = fileName.toLowerCase();
    // Check extension
    if (this.supportedExts.some(ext => lower.endsWith(ext))) return true;
    // Fallback: if file has no extension but browser says it's audio, or if it contains common sfx naming
    // Also allow files without extension if they are in SFX folders (some packs have no ext?)
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
      // Browser fallback - use input with webkitdirectory
      return new Promise(resolve => {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.multiple = true;
        // Allow all files, we'll filter later with better logic
        input.setAttribute('directory', '');
        input.setAttribute('webkitdirectory', '');
        
        input.onchange = (e) => {
          const files = e.target.files;
          console.log('[FS] Browser selected', files.length, 'files');
          if (files.length > 0) {
            const first = files[0];
            const rel = first.webkitRelativePath || '';
            const rootFolderName = rel.split('/')[0] || 'SFX Library';
            
            // Convert FileList to array, keep ALL files for debugging, filter in scanFolders
            const fileArray = Array.from(files);
            console.log('[FS] Sample files:', fileArray.slice(0,3).map(f=>({name:f.name, type:f.type, rel:f.webkitRelativePath})));
            
            // Filter audio files with improved check
            const audioFiles = fileArray.filter(f => this.isAudioFile(f.name, f));
            console.log('[FS] Audio files filtered:', audioFiles.length, 'of', fileArray.length);
            
            // If filter gives 0, try to include all (maybe extension hidden or unusual)
            const finalFiles = audioFiles.length > 0 ? audioFiles : fileArray.filter(f => {
              // Include if looks like audio by size or name
              return f.size > 1000; // exclude tiny files
            });
            
            resolve({
              path: rootFolderName,
              name: rootFolderName,
              token: null,
              files: finalFiles,
              allFilesCount: files.length,
              audioCount: audioFiles.length
            });
          } else {
            resolve(null);
          }
        };
        
        // Important: add to DOM briefly for some browsers
        input.style.display = 'none';
        document.body.appendChild(input);
        input.click();
        setTimeout(()=>{ try{ document.body.removeChild(input); }catch(e){} }, 1000);
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
              ext: pathMod.extname(entry).toLowerCase(),
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
      if (parts.length >= 2) {
        return parts[parts.length - 2];
      }
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
                  if (n.match(/\\.(wav|mp3|aiff|aif|m4a|ogg|flac|wma|aac|mp2|opus)$/)) {
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
    const categories = {
      'whoosh': ['whoosh', 'swoosh', 'swish'],
      'impact': ['impact', 'hit', 'slam', 'boom'],
      'transition': ['transition', 'trans'],
      'riser': ['riser', 'build', 'rise'],
      'downer': ['downer', 'fall', 'drop', 'sub drop', 'sub drops'],
      'glitch': ['glitch', 'digital', 'error'],
      'sci-fi': ['sci-fi', 'scifi', 'futuristic', 'space'],
      'cinematic': ['cinematic', 'epic', 'trailer'],
      'ui': ['ui', 'interface', 'click', 'pop', 'notification', 'clicks'],
      'bass': ['bass', 'sub', '808'],
      'drum': ['drum', 'perc', 'kick', 'snare', 'clap'],
      'ambient': ['ambient', 'atmos', 'pad', 'drone', 'drone & ambient'],
      'bells': ['bell', 'bells'],
      'camera': ['camera'],
      'explosions': ['explosion', 'explosions'],
      'guns': ['gun', 'guns', 'weapon', 'weapons'],
      'horror': ['horror', 'tension'],
      'memes': ['meme', 'funny'],
      'slow motion': ['slow motion', 'slow-mo'],
      'hits & impacts': ['hits & impacts', 'hits'],
      'elements & nature': ['elements', 'nature'],
      'miscellaneous': ['misc']
    };
    for (const [cat, keywords] of Object.entries(categories)) {
      if (keywords.some(k => lower.includes(k))) return cat;
    }
    // Try to get immediate parent folder name as category
    const parts = lower.split(/[/\\]/);
    // Remove file name, get parent
    if (parts.length >= 2) {
      const parent = parts[parts.length - 2];
      if (parent && parent.length > 1 && parent !== 'arranged sfx' && parent !== 'arranged_sfx') {
        return parent;
      }
      // If parent is root, try grandparent
      if (parts.length >= 3) {
        const grand = parts[parts.length - 3];
        if (grand && grand.length > 1) return grand;
      }
    }
    return 'uncategorized';
  }

  async scanFolders(folderList) {
    let allFiles = [];
    console.log('[FS] scanFolders input', folderList.length, 'folders');
    
    for (const folder of folderList) {
      try {
        if (folder.files) {
          console.log('[FS] Browser folder', folder.name, 'with', folder.files.length, 'files');
          // Browser fallback - files are File objects with webkitRelativePath
          const mapped = folder.files.map(f => {
            const relPath = f.webkitRelativePath || f.name;
            // relPath like "Arranged sfx/Bells/Bells 01.mp3"
            const parts = relPath.split('/');
            // Root is parts[0] = "Arranged sfx"
            // If nested: parts[1] = "Bells" is category folder
            // File is last part
            let folderName = folder.name;
            let category = 'uncategorized';
            let displayPath = relPath;
            
            if (parts.length >= 3) {
              // Arranged sfx / Bells / Bells 01.mp3
              folderName = parts[parts.length - 2]; // Bells
              category = this.inferCategory(relPath);
            } else if (parts.length === 2) {
              folderName = parts[0];
              category = this.inferCategory(relPath);
            } else {
              folderName = folder.name;
              category = this.inferCategory(f.name);
            }
            
            // Name without extension
            const nameWithoutExt = f.name.replace(/\.[^/.]+$/, '');
            
            return {
              id: relPath + '_' + f.size, // unique by relative path + size
              path: relPath, // use relative path as path in browser
              name: nameWithoutExt,
              fileName: f.name,
              ext: '.' + (f.name.split('.').pop() || '').toLowerCase(),
              size: f.size,
              folder: parts.slice(0, -1).join('/'),
              folderName: folderName,
              relativePath: relPath,
              category: category,
              fileObject: f
            };
          });
          console.log('[FS] Mapped', mapped.length, 'files, sample:', mapped[0]);
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
    
    // Dedupe by id
    const seen = new Set();
    const deduped = [];
    for (const f of allFiles) {
      if (!seen.has(f.id)) {
        seen.add(f.id);
        deduped.push(f);
      }
    }
    
    console.log('[FS] Total files after dedupe', deduped.length);
    return deduped;
  }

  getFileUrl(fileObj) {
    if (fileObj.fileObject) {
      return URL.createObjectURL(fileObj.fileObject);
    }
    if (fileObj.entry) {
      return fileObj.path;
    }
    let p = fileObj.path;
    if (!p.startsWith('file://') && !p.startsWith('blob:') && !p.startsWith('http')) {
      p = 'file:///' + p.replace(/\\/g, '/').replace(/ /g, '%20');
    }
    return p;
  }
}

window.AXFileSystem = new FileSystemManager();
