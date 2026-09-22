/**
 * ATUL X SFX - Host Adapter
 * Bridges UI to After Effects & Premiere Pro
 */

class HostAdapter {
  constructor() {
    this.cs = null;
    this.appName = 'UNKNOWN';
    this.isCEP = !!(window.cep || window.__adobe_cep__);
    this.isUXP = false;
    this.uxpHost = null;
    this.detectHost();
  }

  detectHost() {
    if (this.isCEP) {
      try {
        this.cs = new CSInterface();
        const env = this.cs.getHostEnvironment();
        this.appName = env.appName || 'UNKNOWN';
        console.log('[Host] CEP detected:', this.appName, env);
      } catch (e) {
        console.warn('[Host] CEP detection failed', e);
      }
    } else {
      // Check UXP
      try {
        if (typeof require !== 'undefined') {
          const uxp = require('uxp');
          if (uxp && uxp.host) {
            this.uxpHost = uxp.host;
            this.appName = uxp.host.name || 'UNKNOWN';
            this.isUXP = true;
          }
        }
      } catch (e) {
        console.warn('[Host] UXP detection failed', e);
      }
      
      // Fallback: check userAgent or URL params
      if (this.appName === 'UNKNOWN') {
        // Assume we are in browser preview - default to PPRO
        this.appName = 'PPRO';
      }
    }

    // Normalize app names
    if (this.appName.includes('AEFT') || this.appName.toLowerCase().includes('after')) {
      this.appName = 'AEFT';
    } else if (this.appName.includes('PPRO') || this.appName.toLowerCase().includes('premiere')) {
      this.appName = 'PPRO';
    }
  }

  getAppName() {
    return this.appName;
  }

  isAfterEffects() {
    return this.appName === 'AEFT';
  }

  isPremiere() {
    return this.appName === 'PPRO';
  }

  // Import SFX to timeline - main entry
  async importToTimeline(fileObj) {
    if (!fileObj || !fileObj.path) {
      this.showAlert('Invalid file path');
      return false;
    }

    console.log('[Host] Importing', fileObj.path, 'to', this.appName);

    if (this.isCEP) {
      if (this.isAfterEffects()) {
        return await this.importToAE_CEP(fileObj.path);
      } else {
        return await this.importToPPro_CEP(fileObj.path);
      }
    } else if (this.isUXP) {
      if (this.isAfterEffects()) {
        return await this.importToAE_UXP(fileObj);
      } else {
        return await this.importToPPro_UXP(fileObj);
      }
    } else {
      // Browser preview - simulate
      console.log('[Host] Browser preview - would import:', fileObj.path);
      this.showAlert(`[Preview Mode] Would import: ${fileObj.name}\nPath: ${fileObj.path}\n\nIn Adobe, this will import to your timeline at playhead.`);
      return true;
    }
  }

  // CEP - After Effects
  async importToAE_CEP(filePath) {
    return new Promise(resolve => {
      try {
        // Escape path for JSX
        const escapedPath = filePath.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const script = `
          (function(){
            try {
              var file = new File("${escapedPath}");
              if (!file.exists) return "ERROR: File not found: " + file.fsName;
              var proj = app.project;
              if (!proj) return "ERROR: No project open";
              
              // Import file
              var io = new ImportOptions(file);
              io.importAs = ImportAsType.FOOTAGE;
              var item = proj.importFile(io);
              if (!item) return "ERROR: Import failed";
              
              // Try to add to active comp
              var comp = proj.activeItem;
              var addedToComp = false;
              if (comp && comp instanceof CompItem) {
                try {
                  var layer = comp.layers.add(item);
                  if (layer) {
                    layer.startTime = comp.time;
                    addedToComp = true;
                  }
                } catch(e) {
                  // Could fail if comp locked, etc
                }
              }
              
              if (addedToComp) {
                return "SUCCESS: Imported and added to comp: " + item.name;
              } else {
                return "SUCCESS: Imported to project: " + item.name + " (No active comp)";
              }
            } catch(e) {
              return "ERROR: " + e.message + " line:" + e.line;
            }
          })()
        `;
        this.cs.evalScript(script, (result) => {
          console.log('[Host] AE import result:', result);
          if (result && result.startsWith('SUCCESS')) {
            resolve(true);
          } else {
            this.showAlert(result || 'Import failed - unknown error');
            resolve(false);
          }
        });
      } catch (e) {
        console.error('[Host] AE CEP import error', e);
        this.showAlert('Import error: ' + e.message);
        resolve(false);
      }
    });
  }

  // CEP - Premiere Pro
  async importToPPro_CEP(filePath) {
    return new Promise(resolve => {
      try {
        const escapedPath = filePath.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const script = `
          (function(){
            try {
              var filePath = "${escapedPath}";
              var importFiles = [filePath];
              
              // Check if project exists
              if (!app.project) return "ERROR: No project open";
              
              // Import
              var suppressUI = false;
              var targetBin = app.project.rootItem;
              // Try to import
              var result = app.project.importFiles(importFiles, suppressUI, targetBin, false);
              
              // Find the imported item (search by name)
              var fileName = filePath.split(/[\\/\\\\]/).pop();
              var foundItem = null;
              
              function findInBin(bin) {
                if (!bin) return null;
                for (var i=0; i<bin.children.numItems; i++) {
                  var child = bin.children[i];
                  if (child.type === 2) { // bin
                    var found = findInBin(child);
                    if (found) return found;
                  } else {
                    if (child.name === fileName || filePath.indexOf(child.name) !== -1) {
                      return child;
                    }
                  }
                }
                return null;
              }
              
              foundItem = findInBin(app.project.rootItem);
              
              // Try to insert into active sequence at playhead
              var seq = app.project.activeSequence;
              var inserted = false;
              if (seq && foundItem) {
                try {
                  // Get playhead time
                  var time = seq.getPlayerPosition();
                  
                  // Find first available audio track or targeted
                  var audioTrackIndex = 0;
                  // Try to find targeted audio track
                  for (var t=0; t<seq.audioTracks.numTracks; t++) {
                    if (seq.audioTracks[t].isTargeted()) {
                      audioTrackIndex = t;
                      break;
                    }
                  }
                  
                  var track = seq.audioTracks[audioTrackIndex];
                  if (track) {
                    track.insertClip(foundItem, time);
                    inserted = true;
                  }
                } catch(e) {
                  // Fallback: try overwriting
                  try {
                    var track = seq.audioTracks[0];
                    if (track) {
                      track.overwriteClip(foundItem, seq.getPlayerPosition());
                      inserted = true;
                    }
                  } catch(e2) {
                    return "SUCCESS: Imported to project: " + fileName + " (Could not auto-insert: " + e2.message + "). Drag from Project panel.";
                  }
                }
              }
              
              if (foundItem) {
                if (inserted) {
                  return "SUCCESS: Imported and inserted at playhead: " + foundItem.name;
                } else {
                  return "SUCCESS: Imported to project: " + foundItem.name + " (No active sequence)";
                }
              } else {
                return "SUCCESS: Import requested for: " + fileName + " (Check project panel)";
              }
            } catch(e) {
              return "ERROR: " + e.message + " at line " + e.line;
            }
          })()
        `;
        this.cs.evalScript(script, (result) => {
          console.log('[Host] PPro import result:', result);
          if (result && result.startsWith('SUCCESS')) {
            resolve(true);
          } else {
            this.showAlert(result || 'Import failed');
            resolve(false);
          }
        });
      } catch (e) {
        console.error('[Host] PPro CEP import error', e);
        this.showAlert('Import error: ' + e.message);
        resolve(false);
      }
    });
  }

  // UXP - After Effects (future API)
  async importToAE_UXP(fileObj) {
    try {
      // Try new UXP AE API
      if (typeof require !== 'undefined') {
        try {
          const ae = require('aftereffects');
          if (ae && ae.app && ae.app.project) {
            // UXP AE import - API still evolving
            // Fallback to showing alert with instructions
            console.log('[Host] UXP AE API available', ae);
          }
        } catch (e) {
          console.warn('[Host] UXP AE module not available', e);
        }
      }
      // Fallback: use batchPlay or alert
      this.showAlert(`UXP AE Import: ${fileObj.name}\n\nAPI is in beta. File path: ${fileObj.path}\n\nFor now, file is ready in your library. In final version this will auto-import.`);
      return true;
    } catch (e) {
      console.error('[Host] UXP AE import error', e);
      return false;
    }
  }

  // UXP - Premiere Pro
  async importToPPro_UXP(fileObj) {
    try {
      if (typeof require !== 'undefined') {
        try {
          const ppro = require('premierepro');
          console.log('[Host] UXP PPro module', ppro);
          // Example UXP PPro import flow (API may vary)
          // const project = await ppro.Project.getActiveProject();
          // await project.importFiles([fileObj.path]);
          // For now, simulate
        } catch (e) {
          console.warn('[Host] UXP PPro module not available', e);
        }
      }
      this.showAlert(`UXP PPro Import: ${fileObj.name}\n\nFile: ${fileObj.path}\n\nIn production, this will import at playhead. UXP PPro APIs are in beta - final implementation will use ppro.Project.importFiles.`);
      return true;
    } catch (e) {
      console.error('[Host] UXP PPro import error', e);
      return false;
    }
  }

  showAlert(msg) {
    if (this.isCEP && this.cs) {
      // Use JSX alert or JS alert
      try {
        this.cs.evalScript(`alert("${msg.replace(/"/g, '\\"').replace(/\n/g, '\\n')}")`);
      } catch (e) {
        alert(msg);
      }
    } else {
      alert(msg);
    }
  }

  // Utility: Get project info
  async getProjectInfo() {
    if (this.isCEP) {
      return new Promise(resolve => {
        const script = `
          (function(){
            try {
              if (app.project) {
                var info = {
                  name: app.project.file ? app.project.file.name : "Untitled",
                  path: app.project.file ? app.project.file.fsName : "",
                  hasActiveComp: !!(app.project.activeItem && app.project.activeItem instanceof CompItem),
                  activeCompName: app.project.activeItem ? app.project.activeItem.name : null
                };
                return JSON.stringify(info);
              } else if (app.project) {
                // PPro
                var seq = app.project.activeSequence;
                return JSON.stringify({
                  name: app.project.name || "Untitled",
                  path: app.project.path || "",
                  hasActiveSequence: !!seq,
                  activeSequenceName: seq ? seq.name : null
                });
              }
              return JSON.stringify({ name: "No project" });
            } catch(e) {
              return JSON.stringify({ error: e.message });
            }
          })()
        `;
        this.cs.evalScript(script, (res) => {
          try { resolve(JSON.parse(res)); } catch(e) { resolve({ raw: res }); }
        });
      });
    }
    return { name: "Preview Mode", path: "" };
  }
}

window.AXHost = new HostAdapter();
