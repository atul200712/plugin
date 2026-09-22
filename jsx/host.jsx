/* ATUL X SFX - Host JSX Bridge
   Loaded by CEP, provides file system and host functions
*/

// Global to prevent multiple loads
if (typeof ATUL_X_SFX_HOST === 'undefined') {
  var ATUL_X_SFX_HOST = true;

  // Utility: Get host name
  function getHostName() {
    return app.name + " " + app.version;
  }

  // File system helpers for CEP panel when Node not available
  function scanFolder(folderPath, maxDepth) {
    if (typeof maxDepth === 'undefined') maxDepth = 8;
    var result = [];
    var root = new Folder(folderPath);
    if (!root.exists) return JSON.stringify([]);
    
    function scan(folder, depth) {
      if (depth > maxDepth) return;
      var files = folder.getFiles();
      for (var i = 0; i < files.length; i++) {
        var f = files[i];
        if (f instanceof Folder) {
          if (f.name.charAt(0) !== '.' && f.name !== 'node_modules') {
            scan(f, depth + 1);
          }
        } else {
          var n = f.name.toLowerCase();
          if (n.match(/\.(wav|mp3|aiff|aif|m4a|ogg|flac|wma|aac)$/)) {
            result.push({
              id: f.fsName,
              path: f.fsName,
              name: f.name.replace(/\.[^/.]+$/, ''),
              fileName: f.name,
              ext: '.' + f.name.split('.').pop().toLowerCase(),
              size: f.length || 0,
              folder: f.parent.fsName,
              folderName: f.parent.name,
              relativePath: f.fsName.replace(root.fsName, '').replace(/^[\/\\]/, ''),
              category: f.parent.name
            });
          }
        }
      }
    }
    scan(root, 0);
    return JSON.stringify(result);
  }

  // Import helpers - AE
  function importToAE(filePath) {
    try {
      var file = new File(filePath);
      if (!file.exists) return "ERROR: File not found: " + file.fsName;
      var proj = app.project;
      if (!proj) return "ERROR: No project open";
      
      var io = new ImportOptions(file);
      io.importAs = ImportAsType.FOOTAGE;
      var item = proj.importFile(io);
      if (!item) return "ERROR: Import failed";
      
      var comp = proj.activeItem;
      var addedToComp = false;
      if (comp && comp instanceof CompItem) {
        try {
          var layer = comp.layers.add(item);
          if (layer) {
            layer.startTime = comp.time;
            addedToComp = true;
          }
        } catch(e) {}
      }
      
      if (addedToComp) {
        return "SUCCESS: Imported and added to comp: " + item.name;
      } else {
        return "SUCCESS: Imported to project: " + item.name;
      }
    } catch(e) {
      return "ERROR: " + e.message + " line:" + e.line;
    }
  }

  // Import helpers - PPro
  function importToPPro(filePath) {
    try {
      var filePath = filePath;
      var importFiles = [filePath];
      
      if (!app.project) return "ERROR: No project open";
      
      var suppressUI = false;
      var targetBin = app.project.rootItem;
      var result = app.project.importFiles(importFiles, suppressUI, targetBin, false);
      
      var fileName = filePath.split(/[\\\/]/).pop();
      var foundItem = null;
      
      function findInBin(bin) {
        if (!bin) return null;
        for (var i = 0; i < bin.children.numItems; i++) {
          var child = bin.children[i];
          if (child.type === 2) {
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
      
      var seq = app.project.activeSequence;
      var inserted = false;
      if (seq && foundItem) {
        try {
          var time = seq.getPlayerPosition();
          var audioTrackIndex = 0;
          for (var t = 0; t < seq.audioTracks.numTracks; t++) {
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
          try {
            var track = seq.audioTracks[0];
            if (track) {
              track.overwriteClip(foundItem, seq.getPlayerPosition());
              inserted = true;
            }
          } catch(e2) {}
        }
      }
      
      if (foundItem) {
        if (inserted) {
          return "SUCCESS: Imported and inserted at playhead: " + foundItem.name;
        } else {
          return "SUCCESS: Imported to project: " + foundItem.name;
        }
      } else {
        return "SUCCESS: Import requested for: " + fileName;
      }
    } catch(e) {
      return "ERROR: " + e.message + " at line " + e.line;
    }
  }

  // Unified import - detects host
  function importSFX(filePath) {
    if (app.name.indexOf('After Effects') !== -1 || typeof CompItem !== 'undefined') {
      return importToAE(filePath);
    } else {
      return importToPPro(filePath);
    }
  }

  // Get project info
  function getProjectInfo() {
    try {
      if (app.project) {
        // Check if AE
        if (typeof CompItem !== 'undefined') {
          return JSON.stringify({
            app: 'AEFT',
            name: app.project.file ? app.project.file.name : "Untitled",
            path: app.project.file ? app.project.file.fsName : "",
            hasActiveComp: !!(app.project.activeItem && app.project.activeItem instanceof CompItem),
            activeCompName: app.project.activeItem ? app.project.activeItem.name : null
          });
        } else {
          // PPro
          var seq = app.project.activeSequence;
          return JSON.stringify({
            app: 'PPRO',
            name: app.project.name || "Untitled",
            path: app.project.path || "",
            hasActiveSequence: !!seq,
            activeSequenceName: seq ? seq.name : null
          });
        }
      }
      return JSON.stringify({ app: 'UNKNOWN', name: "No project" });
    } catch(e) {
      return JSON.stringify({ error: e.message });
    }
  }

  // For debugging
  $.writeln("ATUL X SFX Host JSX Loaded: " + getHostName());
}
