/* ATUL X SFX - After Effects Specific JSX */

// Import SFX to AE project and active comp
function atulx_importSFX_AE(filePath) {
  try {
    var file = new File(filePath);
    if (!file.exists) {
      alert("File not found:\n" + filePath);
      return false;
    }

    var proj = app.project;
    if (!proj) {
      alert("No project open. Please create or open a project first.");
      return false;
    }

    // Check if already imported
    var existing = null;
    for (var i = 1; i <= proj.numItems; i++) {
      var item = proj.item(i);
      if (item && item instanceof FootageItem && item.file && item.file.fsName === file.fsName) {
        existing = item;
        break;
      }
    }

    var footageItem = existing;
    if (!footageItem) {
      var io = new ImportOptions(file);
      io.importAs = ImportAsType.FOOTAGE;
      footageItem = proj.importFile(io);
    }

    if (!footageItem) {
      alert("Failed to import: " + filePath);
      return false;
    }

    // Add to active comp if available
    var comp = proj.activeItem;
    if (comp && comp instanceof CompItem) {
      app.beginUndoGroup("ATUL X SFX Import");
      try {
        var layer = comp.layers.add(footageItem);
        if (layer) {
          layer.startTime = comp.time;
          // Select the layer
          comp.selectedLayers = [];
          // comp.selectedLayers.push(layer); // not directly
        }
      } catch (e) {
        $.writeln("Could not add to comp: " + e.message);
      }
      app.endUndoGroup();
    }

    return true;
  } catch (e) {
    alert("Import error: " + e.message + "\nLine: " + e.line);
    return false;
  }
}

// Batch import
function atulx_batchImport_AE(filePaths) {
  var paths = filePaths.split(";");
  var imported = 0;
  for (var i = 0; i < paths.length; i++) {
    if (paths[i] && atulx_importSFX_AE(paths[i])) imported++;
  }
  return imported + " files imported";
}
