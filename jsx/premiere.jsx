/* ATUL X SFX - Premiere Pro Specific JSX */

// Import SFX to PPro project and sequence
function atulx_importSFX_PPro(filePath) {
  try {
    if (!app.project) {
      alert("No project open. Please create or open a project first.");
      return false;
    }

    var fileName = filePath.split(/[\\\/]/).pop();
    var importFiles = [filePath];
    var suppressUI = false;
    var targetBin = app.project.rootItem;

    // Import
    app.project.importFiles(importFiles, suppressUI, targetBin, false);

    // Find imported item
    var foundItem = null;
    function findInBin(bin) {
      if (!bin) return null;
      for (var i = 0; i < bin.children.numItems; i++) {
        var child = bin.children[i];
        if (child.type === 2) { // bin
          var found = findInBin(child);
          if (found) return found;
        } else {
          if (child.name === fileName) return child;
          // Fuzzy match
          if (filePath.indexOf(child.name) !== -1) return child;
        }
      }
      return null;
    }

    foundItem = findInBin(app.project.rootItem);

    if (!foundItem) {
      $.writeln("ATUL X SFX: Could not find imported item, but import was requested: " + fileName);
      return true; // Still success, user can drag from project panel
    }

    // Try to insert into active sequence
    var seq = app.project.activeSequence;
    if (!seq) {
      $.writeln("ATUL X SFX: Imported to project, no active sequence: " + foundItem.name);
      return true;
    }

    var inserted = false;
    var insertError = "";

    try {
      var time = seq.getPlayerPosition();
      var audioTrackIndex = 0;
      
      // Find targeted audio track
      for (var t = 0; t < seq.audioTracks.numTracks; t++) {
        try {
          if (seq.audioTracks[t].isTargeted()) {
            audioTrackIndex = t;
            break;
          }
        } catch (e) {}
      }

      var track = seq.audioTracks[audioTrackIndex];
      if (track) {
        // Check if track is locked
        if (track.isLocked && track.isLocked()) {
          // Try next unlocked track
          for (var t2 = 0; t2 < seq.audioTracks.numTracks; t2++) {
            if (!seq.audioTracks[t2].isLocked()) {
              track = seq.audioTracks[t2];
              break;
            }
          }
        }
        track.insertClip(foundItem, time);
        inserted = true;
      }
    } catch (e) {
      insertError = e.message;
      $.writeln("ATUL X SFX: insertClip failed: " + e.message);
      
      // Fallback to overwrite
      try {
        var track = seq.audioTracks[0];
        if (track) {
          track.overwriteClip(foundItem, seq.getPlayerPosition());
          inserted = true;
        }
      } catch (e2) {
        insertError += " | " + e2.message;
        $.writeln("ATUL X SFX: overwriteClip failed: " + e2.message);
      }
    }

    if (inserted) {
      $.writeln("ATUL X SFX: Successfully inserted at playhead: " + foundItem.name);
    } else {
      $.writeln("ATUL X SFX: Imported to project only, could not insert: " + insertError);
    }

    return true;

  } catch (e) {
    alert("Import error: " + e.message + "\nLine: " + e.line);
    return false;
  }
}

// Batch import
function atulx_batchImport_PPro(filePaths) {
  var paths = filePaths.split(";");
  var imported = 0;
  for (var i = 0; i < paths.length; i++) {
    if (paths[i] && atulx_importSFX_PPro(paths[i])) imported++;
  }
  return imported + " files imported";
}

// Get sequence info
function atulx_getSequenceInfo() {
  try {
    if (!app.project) return JSON.stringify({ error: "No project" });
    var seq = app.project.activeSequence;
    if (!seq) return JSON.stringify({ hasSequence: false });
    
    var info = {
      name: seq.name,
      id: seq.sequenceID,
      time: seq.getPlayerPosition().seconds,
      audioTracks: seq.audioTracks.numTracks,
      videoTracks: seq.videoTracks.numTracks,
      hasTargetedAudio: false
    };
    
    for (var t = 0; t < seq.audioTracks.numTracks; t++) {
      try {
        if (seq.audioTracks[t].isTargeted()) {
          info.hasTargetedAudio = true;
          info.targetedTrack = t;
          break;
        }
      } catch (e) {}
    }
    
    return JSON.stringify(info);
  } catch (e) {
    return JSON.stringify({ error: e.message });
  }
}
