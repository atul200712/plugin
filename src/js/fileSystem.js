/**
 * ATUL X SFX - File System - ULTRA SIMPLE BULLETPROOF VERSION
 * For 973 files in Arranged sfx with 18 categories
 * No filtering - shows everything
 */

class FileSystemManager {
  constructor() {
    this.isCEP = !!(window.cep || window.__adobe_cep__);
    this.isUXP = false;
    try { 
      if (typeof require !== 'undefined') {
        const m = require('uxp');
        if (m && m.storage) this.isUXP = true;
      }
    } catch(e) {}
    this.fs = null; this.path = null;
    if (this.isCEP) {
      try {
        if (window.cep_node) { this.fs = window.cep_node.require('fs'); this.path = window.cep_node.require('path'); }
        else if (window.require) { try { this.fs = window.require('fs'); this.path = window.require('path'); } catch(e) {} }
        else if (typeof require === 'function') { try { this.fs = require('fs'); this.path = require('path'); } catch(e) {} }
      } catch(e) {}
    }
  }

  // Browser: Select folder - RETURN ALL FILES, NO FILTER
  async selectFolder() {
    // CEP
    if (this.isCEP && window.__adobe_cep__) {
      const path = await new Promise(res => {
        try {
          const cs = new CSInterface();
          cs.evalScript('Folder.selectDialog("Select SFX Folder").fsName', r => {
            if (!r || r.includes('null') || r.includes('EvalScript') || r.includes('error') || r.length < 3) res(null);
            else res(r.replace(/^['"]|['"]$/g,'').trim());
          });
        } catch(e) { res(null); }
      });
      if (path) return { path, name: path.split(/[/\\]/).pop(), files: null };
    }
    
    // UXP
    if (this.isUXP) {
      try {
        const uxp = require('uxp');
        const folder = await uxp.storage.localFileSystem.getFolder();
        if (folder) {
          const token = await uxp.storage.localFileSystem.createPersistentToken(folder);
          return { path: folder.nativePath || token, name: folder.name, entry: folder, files: null };
        }
      } catch(e) {}
    }

    // Browser - SIMPLEST POSSIBLE
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.multiple = true;
      input.onchange = (e) => {
        const files = Array.from(e.target.files || []);
        console.log('[FS] Selected', files.length, 'files');
        if (files.length === 0) { resolve(null); return; }
        
        const root = (files[0].webkitRelativePath || '').split('/')[0] || 'SFX';
        // Keep ALL files, don't filter anything except hidden
        const keep = files.filter(f => !f.name.startsWith('.') && f.size > 0);
        console.log('[FS] Keeping', keep.length, 'files after removing hidden/empty');
        console.log('[FS] Sample:', keep.slice(0,3).map(f=>f.name + ' | ' + f.type + ' | ' + f.webkitRelativePath));
        
        resolve({
          path: root,
          name: root,
          files: keep,
          total: files.length
        });
      };
      document.body.appendChild(input);
      input.style.display = 'none';
      input.click();
      setTimeout(()=>{ try{document.body.removeChild(input)}catch(e){} }, 3000);
    });
  }

  // Scan - SIMPLEST
  async scanFolders(folderList) {
    let all = [];
    console.log('[FS] scanFolders', folderList.length, 'folders');
    
    for (const folder of folderList) {
      try {
        if (folder.files && Array.isArray(folder.files)) {
          // Browser files
          console.log('[FS] Browser folder', folder.name, 'with', folder.files.length, 'files');
          for (const f of folder.files) {
            try {
              const rel = f.webkitRelativePath || f.name;
              const parts = rel.split('/');
              // Category = immediate parent folder
              let cat = 'uncategorized';
              let folderName = folder.name;
              if (parts.length >= 2) {
                const parent = parts[parts.length - 2];
                if (parent && parent.toLowerCase() !== 'arranged sfx' && parent.toLowerCase() !== 'arranged_sfx' && parent !== folder.name) {
                  folderName = parent;
                  cat = parent.toLowerCase();
                } else if (parts.length >= 3) {
                  folderName = parts[parts.length - 2];
                  cat = parts[1] ? parts[1].toLowerCase() : cat;
                  // For Arranged sfx/Bells/file.wav -> cat = bells
                  if (parts[0].toLowerCase().includes('arranged')) {
                    cat = parts[1].toLowerCase();
                    folderName = parts[1];
                  }
                }
              }
              
              // Clean category - remove & and trim
              cat = cat.replace(/[^a-z0-9 &_-]/g, '').trim() || 'uncategorized';
              
              all.push({
                id: rel + '_' + f.size,
                path: rel,
                name: f.name.includes('.') ? f.name.substring(0, f.name.lastIndexOf('.')) : f.name,
                fileName: f.name,
                ext: f.name.includes('.') ? '.' + f.name.split('.').pop().toLowerCase() : '',
                size: f.size,
                folder: parts.slice(0,-1).join('/'),
                folderName: folderName,
                relativePath: rel,
                category: cat,
                fileObject: f
              });
            } catch(err) {
              console.error('[FS] File map error', f.name, err);
            }
          }
        } else if (folder.path) {
          // CEP - Node fs
          const files = await this.scanCEP(folder.path);
          all.push(...files);
        } else if (folder.entry) {
          // UXP
          const files = await this.scanUXP(folder.entry);
          all.push(...files);
        }
      } catch(e) { console.error('[FS] folder error', e); }
    }
    
    console.log('[FS] Total mapped', all.length);
    // Simple dedupe by path
    const map = new Map();
    all.forEach(f => { if (!map.has(f.path)) map.set(f.path, f); });
    const result = Array.from(map.values());
    console.log('[FS] After dedupe', result.length);
    return result;
  }

  async scanCEP(rootPath, depth=0) {
    const out = [];
    if (depth>10) return out;
    try {
      let fs = this.fs, path = this.path;
      if (!fs) { try { fs = require('fs'); path = require('path'); } catch(e) { return await this.scanJSX(rootPath); } }
      const entries = fs.readdirSync(rootPath);
      for (const ent of entries) {
        const full = path.join(rootPath, ent);
        try {
          const stat = fs.statSync(full);
          if (stat.isDirectory()) {
            if (!ent.startsWith('.')) {
              const sub = await this.scanCEP(full, depth+1);
              out.push(...sub);
            }
          } else {
            if (stat.size > 100) {
              out.push({
                id: full, path: full,
                name: ent.includes('.') ? ent.substring(0, ent.lastIndexOf('.')) : ent,
                fileName: ent, ext: path.extname(ent).toLowerCase(),
                size: stat.size, folder: path.dirname(full),
                folderName: full.split(/[/\\]/).slice(-2,-1)[0] || 'Unknown',
                relativePath: full.replace(rootPath,'').replace(/^[/\\]/,''),
                category: this.simpleCategory(full), fileObject: null
              });
            }
          }
        } catch(e) {}
      }
    } catch(e) { console.error('[FS] CEP scan error', e); }
    return out;
  }

  async scanJSX(rootPath) {
    return new Promise(res => {
      try {
        const cs = new CSInterface();
        const script = `(function(){var r=[];var root=new Folder("${rootPath.replace(/\\/g,'\\\\').replace(/"/g,'\\"')}");if(!root.exists)return JSON.stringify([]);function s(f,d){if(d>10)return;var fs=f.getFiles();for(var i=0;i<fs.length;i++){var file=fs[i];if(file instanceof Folder){if(file.name.charAt(0)!='.')s(file,d+1);}else{if(file.length>100)r.push({id:file.fsName,path:file.fsName,name:file.name,fileName:file.name,ext:'.'+file.name.split('.').pop().toLowerCase(),size:file.length,folder:file.parent.fsName,folderName:file.parent.name,relativePath:file.fsName.replace(root.fsName,'').replace(/^[/\\\\]/,''),category:file.parent.name});}}}s(root,0);return JSON.stringify(r);})()`;
        cs.evalScript(script, result => {
          try { const parsed = JSON.parse(result); res(parsed.map(p=>({...p, category: this.simpleCategory(p.path), name: p.name.includes('.')?p.name.substring(0,p.name.lastIndexOf('.')):p.name}))); }
          catch(e) { res([]); }
        });
      } catch(e) { res([]); }
    });
  }

  async scanUXP(entry, base='') {
    const out=[];
    try {
      const entries = await entry.getEntries();
      for (const e of entries) {
        if (e.isFolder) { if (!e.name.startsWith('.')) { const sub=await this.scanUXP(e, base+e.name+'/'); out.push(...sub); } }
        else { out.push({id:base+e.name, path:base+e.name, name:e.name.includes('.')?e.name.substring(0,e.name.lastIndexOf('.')):e.name, fileName:e.name, ext:'.'+e.name.split('.').pop().toLowerCase(), size:0, folder:base, folderName:base.split('/').filter(Boolean).pop()||e.name, relativePath:base+e.name, category:this.simpleCategory(base+e.name), entry:e}); }
      }
    } catch(e) {}
    return out;
  }

  simpleCategory(path) {
    if (!path) return 'uncategorized';
    const low = path.toLowerCase();
    // Direct folder name match for your 18 categories
    const cats = ['bells','camera','cinematic & epic','drone & ambient','elements & nature','explosions','glitch','guns & weapons','hits & impacts','horror & tension','melody & tonal','memes & funny','miscellaneous','risers','slow motion','sub drops','transitions','ui & clicks','whoosh & swoosh'];
    for (const c of cats) { if (low.includes(c)) return c; }
    // Fallback to parent folder
    const parts = low.split(/[/\\]/);
    if (parts.length>=2) {
      const parent = parts[parts.length-2];
      if (parent && parent.length>1 && !parent.includes('arranged')) return parent;
    }
    return 'uncategorized';
  }
}

window.AXFileSystem = new FileSystemManager();
