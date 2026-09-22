/**
 * ATUL X SFX - File System - DEBUG VERSION for 973 files issue
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
    this.supportedExts = ['.wav', '.mp3', '.aiff', '.aif', '.m4a', '.ogg', '.flac', '.wma', '.aac', '.mp2', '.opus', '.wma', '.aifc', '.au', '.3gp', '.amr'];
    this.fs = null; this.path = null;
    if (this.isCEP) {
      try {
        this.fs = window.cep ? window.cep.fs : null;
        if (!this.fs && typeof window.require === 'function') { try { this.fs = window.require('fs'); } catch(e) {} }
        if (!this.fs && typeof require === 'function') { try { this.fs = require('fs'); } catch(e) {} }
        if (!this.fs && window.cep_node) { this.fs = window.cep_node.require('fs'); this.path = window.cep_node.require('path'); }
        if (!this.path) { try { if (window.require) this.path = window.require('path'); else this.path = require('path'); } catch(e) {} }
      } catch (e) { console.warn('[FS] CEP fs init failed', e); }
    }
  }

  isAudioFile(fileName, fileObj = null) {
    // In browser preview, be 100% permissive - if user selected folder, assume all files are SFX
    // We will include everything and let user see
    return true; // DEBUG: include all
  }

  async selectFolderCEP() {
    return new Promise((resolve) => {
      try {
        if (window.__adobe_cep__) {
          const cs = new CSInterface();
          cs.evalScript('Folder.selectDialog("Select your SFX Folder").fsName', (result) => {
            console.log('[FS] CEP dialog result:', result);
            if (!result || result === 'null' || result === 'undefined' || result === '' || result.includes('EvalScript') || result.includes('error') || result.includes('Error')) {
              console.warn('[FS] CEP dialog cancelled or error:', result);
              resolve(null); return;
            }
            let clean = result.replace(/^['"]|['"]$/g, '').trim();
            if (clean && clean !== 'null' && clean.length > 2 && !clean.includes('EvalScript')) resolve(clean);
            else resolve(null);
          });
        } else resolve(null);
      } catch (e) { console.error('[FS] selectFolderCEP error', e); resolve(null); }
    });
  }

  async selectFolderUXP() {
    try {
      const uxp = require('uxp');
      const lfs = uxp.storage.localFileSystem;
      const folder = await lfs.getFolder();
      if (!folder) return null;
      const token = await lfs.createPersistentToken(folder);
      return { path: folder.nativePath || token, name: folder.name, token: token, entry: folder };
    } catch (e) { console.error('[FS] selectFolderUXP error', e); return null; }
  }

  async selectFolder() {
    if (this.isCEP) {
      const path = await this.selectFolderCEP();
      if (path) return { path: path, name: path.split(/[/\\]/).pop(), token: null };
      console.log('[FS] CEP cancelled, falling back to browser');
    }
    if (this.isUXP) {
      try { const uxpFolder = await this.selectFolderUXP(); if (uxpFolder) return uxpFolder; } catch(e) { console.warn('[FS] UXP failed', e); }
    }
    // Browser - INCLUDE ALL FILES, NO FILTERING
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
          
          // Debug: log extensions
          const exts = {};
          fileArray.forEach(f => {
            const ext = f.name.includes('.') ? f.name.split('.').pop().toLowerCase() : 'NO_EXT';
            exts[ext] = (exts[ext] || 0) + 1;
          });
          console.log('[FS] Extensions found:', exts);
          console.log('[FS] First 10 files:', fileArray.slice(0,10).map(f=>({name:f.name, type:f.type, size:f.size, rel:f.webkitRelativePath})));
          
          // INCLUDE ALL FILES - no filtering for debug
          // Filter out only very small files (<100 bytes) and hidden files
          const filtered = fileArray.filter(f => {
            if (f.name.startsWith('.')) return false;
            if (f.size < 100) return false;
            // Exclude non-audio obvious files
            const lower = f.name.toLowerCase();
            if (lower.endsWith('.txt') || lower.endsWith('.json') || lower.endsWith('.html') || lower.endsWith('.htm') || lower.endsWith('.db') || lower.endsWith('.ini') || lower.endsWith('.exe') || lower.endsWith('.dll')) return false;
            return true;
          });
          
          console.log('[FS] After filtering small/system files:', filtered.length, 'of', fileArray.length);
          
          // If filtered is 0, include all >100 bytes
          const finalFiles = filtered.length > 0 ? filtered : fileArray.filter(f => f.size > 100);
          
          console.log('[FS] Final files to include:', finalFiles.length);
          
          resolve({
            path: rootFolderName,
            name: rootFolderName,
            token: null,
            files: finalFiles,
            allFilesCount: files.length,
            audioCount: finalFiles.length,
            extensions: exts
          });
        } else {
          resolve(null);
        }
      };
      input.style.display = 'none';
      document.body.appendChild(input);
      input.click();
      setTimeout(()=>{ try{ document.body.removeChild(input); }catch(e){} }, 3000);
    });
  }

  async scanFolderCEP(folderPath, depth = 0, maxDepth = 10) {
    const results = [];
    if (depth > maxDepth) return results;
    try {
      let fs = this.fs; let pathMod = this.path;
      if (!fs) { try { if (window.require) fs = window.require('fs'); else if (window.cep_node) fs = window.cep_node.require('fs'); else fs = require('fs'); } catch(e) {} }
      if (!pathMod) { try { if (window.require) pathMod = window.require('path'); else if (window.cep_node) pathMod = window.cep_node.require('path'); else pathMod = require('path'); } catch(e) {} }
      if (!fs || !pathMod) return await this.scanFolderViaJSX(folderPath);
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
          } else if (stat.isFile()) {
            // Include all files >100 bytes in CEP too
            if (stat.size > 100) {
              const ext = pathMod.extname(entry).toLowerCase() || '.wav';
              results.push({
                id: fullPath, path: fullPath, name: entry.replace(/\.[^/.]+$/, '') || entry,
                fileName: entry, ext: ext, size: stat.size, folder: pathMod.dirname(fullPath),
                folderName: this.getFolderNameFromPath(fullPath),
                relativePath: fullPath.replace(folderPath, '').replace(/^[/\\]/, ''),
                category: this.inferCategory(fullPath), fileObject: null
              });
            }
          }
        } catch (e) { console.warn('[FS] stat error', fullPath, e); }
      }
    } catch (e) { console.error('[FS] scan error', folderPath, e); }
    return results;
  }

  getFolderNameFromPath(fullPath) {
    try { const parts = fullPath.split(/[/\\]/); if (parts.length >= 2) return parts[parts.length - 2]; return 'Unknown'; } catch(e) { return 'Unknown'; }
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
                if (f instanceof Folder) { if (f.name.charAt(0) !== '.') scan(f, depth+1); }
                else { if (f.length > 100) { result.push({ id: f.fsName, path: f.fsName, name: f.name.replace(/\\.[^/.]+$/, '') || f.name, fileName: f.name, ext: '.' + f.name.split('.').pop().toLowerCase(), size: f.length || 0, folder: f.parent.fsName, folderName: f.parent.name, relativePath: f.fsName.replace(root.fsName, '').replace(/^[/\\\\]/, ''), category: f.parent.name }); } }
              }
            }
            scan(root, 0);
            return JSON.stringify(result);
          })()
        `;
        cs.evalScript(script, (res) => {
          try { const parsed = JSON.parse(res); resolve(parsed.map(p => ({ ...p, category: this.inferCategory(p.path), ext: p.ext || '.wav' }))); }
          catch (e) { console.error('[FS] JSX parse error', e, res); resolve([]); }
        });
      } catch (e) { console.error('[FS] JSX scan error', e); resolve([]); }
    });
  }

  async scanFolderUXP(folderEntry, basePath = '') {
    const results = [];
    try {
      const entries = await folderEntry.getEntries();
      for (const entry of entries) {
        if (entry.isFolder) { if (!entry.name.startsWith('.')) { const sub = await this.scanFolderUXP(entry, basePath + entry.name + '/'); results.push(...sub); } }
        else if (entry.isFile) {
          results.push({
            id: entry.nativePath || (basePath + entry.name), path: entry.nativePath || (basePath + entry.name),
            name: entry.name.replace(/\.[^/.]+$/, '') || entry.name, fileName: entry.name, ext: '.' + entry.name.split('.').pop().toLowerCase(),
            size: 0, folder: basePath, folderName: basePath.split('/').filter(Boolean).pop() || entry.name,
            relativePath: basePath + entry.name, category: this.inferCategory(basePath + entry.name), entry: entry
          });
        }
      }
    } catch (e) { console.error('[FS] UXP scan error', e); }
    return results;
  }

  inferCategory(filePath) {
    if (!filePath) return 'uncategorized';
    const lower = filePath.toLowerCase();
    const map = {
      'bells': ['bell'], 'camera': ['camera'], 'cinematic & epic': ['cinematic', 'epic'],
      'drone & ambient': ['drone', 'ambient'], 'elements & nature': ['elements', 'nature'],
      'explosions': ['explosion'], 'glitch': ['glitch'], 'guns & weapons': ['gun', 'weapon'],
      'hits & impacts': ['hits & impacts', 'hits', 'impact'], 'horror & tension': ['horror', 'tension'],
      'melody & tonal': ['melody', 'tonal'], 'memes & funny': ['meme', 'funny'], 'risers': ['riser'],
      'slow motion': ['slow motion'], 'sub drops': ['sub drop', 'sub drops', 'sub'],
      'transitions': ['transition'], 'ui & clicks': ['ui & clicks', 'ui', 'click'],
      'whoosh & swoosh': ['whoosh', 'swoosh', 'swish'], 'whoosh': ['whoosh', 'swoosh'],
      'impact': ['impact', 'hit'], 'transition': ['transition'], 'riser': ['riser', 'build'],
      'bass': ['bass'], 'ambient': ['ambient', 'drone'], 'miscellaneous': ['misc'],
      'transition - vocal cadence': ['vocal', 'cadence']
    };
    for (const [cat, keys] of Object.entries(map)) { if (keys.some(k => lower.includes(k))) return cat; }
    const parts = lower.split(/[/\\]/);
    if (parts.length >= 2) {
      const parent = parts[parts.length - 2];
      if (parent && parent.length > 1 && !parent.includes('arranged')) return parent;
    }
    return 'uncategorized';
  }

  async scanFolders(folderList) {
    let allFiles = [];
    console.log('[FS] scanFolders start, folders:', folderList.length, folderList.map(f=>({name:f.name, files:f.files?.length, path:f.path})));
    
    for (const folder of folderList) {
      try {
        if (folder.files) {
          console.log('[FS] Browser folder', folder.name, 'files:', folder.files.length);
          // Log extensions
          const extCount = {};
          folder.files.forEach(f => {
            const ext = f.name.includes('.') ? f.name.split('.').pop().toLowerCase() : 'NO_EXT';
            extCount[ext] = (extCount[ext]||0)+1;
          });
          console.log('[FS] Extensions in folder', folder.name, ':', extCount);
          
          const mapped = folder.files.map(f => {
            try {
              const relPath = f.webkitRelativePath || f.name;
              const parts = relPath.split('/');
              let folderName = folder.name;
              if (parts.length >= 2) {
                const immediateParent = parts[parts.length - 2];
                if (immediateParent && !immediateParent.toLowerCase().includes('arranged sfx')) folderName = immediateParent;
                else if (parts.length >= 3) folderName = parts[1] || immediateParent;
              }
              const nameWithoutExt = f.name.includes('.') ? f.name.replace(/\.[^/.]+$/, '') : f.name;
              const ext = f.name.includes('.') ? '.' + f.name.split('.').pop().toLowerCase() : '.wav';
              return {
                id: relPath + '_' + f.size + '_' + f.name + '_' + Math.random().toString(36).slice(2,6),
                path: relPath, name: nameWithoutExt, fileName: f.name, ext: ext, size: f.size,
                folder: parts.slice(0, -1).join('/'), folderName: folderName, relativePath: relPath,
                category: this.inferCategory(relPath), fileObject: f
              };
            } catch(err) {
              console.error('[FS] Mapping error for file', f.name, err);
              return null;
            }
          }).filter(Boolean);
          
          console.log('[FS] Mapped', mapped.length, 'files, first 2:', mapped.slice(0,2).map(m=>({name:m.name, ext:m.ext, cat:m.category})));
          allFiles.push(...mapped);
        } else if (folder.entry && folder.entry.getEntries) {
          const files = await this.scanFolderUXP(folder.entry);
          allFiles.push(...files);
        } else {
          const files = await this.scanFolderCEP(folder.path);
          allFiles.push(...files);
        }
      } catch (e) { console.error('[FS] scan folder error', folder, e); }
    }
    
    const seen = new Set();
    const deduped = [];
    for (const f of allFiles) { if (!seen.has(f.id)) { seen.add(f.id); deduped.push(f); } }
    
    console.log('[FS] Final total', deduped.length, 'files');
    if (deduped.length === 0 && allFiles.length > 0) {
      console.error('[FS] Dedupe removed all! Original:', allFiles.length);
      return allFiles; // return original if dedupe fails
    }
    return deduped;
  }

  getFileUrl(fileObj) {
    if (fileObj.fileObject) return URL.createObjectURL(fileObj.fileObject);
    if (fileObj.entry) return fileObj.path;
    let p = fileObj.path;
    if (!p.startsWith('file://') && !p.startsWith('blob:') && !p.startsWith('http')) p = 'file:///' + p.replace(/\\/g, '/').replace(/ /g, '%20');
    return p;
  }
}

window.AXFileSystem = new FileSystemManager();
