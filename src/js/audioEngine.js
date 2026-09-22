/**
 * ATUL X SFX - Audio Engine
 * Preview, waveform, volume, controls
 */

class AudioEngine {
  constructor() {
    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous';
    this.audio.preload = 'metadata';
    this.ctx = null;
    this.analyser = null;
    this.source = null;
    this.gainNode = null;
    this.isPlaying = false;
    this.currentFile = null;
    this.duration = 0;
    this.currentTime = 0;
    this.volume = 0.8;
    this.callbacks = {
      onTimeUpdate: [],
      onEnded: [],
      onPlay: [],
      onPause: [],
      onLoad: []
    };
    this.waveformCache = new Map();
    this.init();
  }

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('[Audio] Web Audio not available', e);
    }

    this.audio.addEventListener('timeupdate', () => {
      this.currentTime = this.audio.currentTime;
      this.emit('onTimeUpdate', { currentTime: this.currentTime, duration: this.duration });
    });

    this.audio.addEventListener('loadedmetadata', () => {
      this.duration = this.audio.duration;
      this.emit('onLoad', { duration: this.duration, file: this.currentFile });
    });

    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.emit('onEnded', { file: this.currentFile });
    });

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.emit('onPlay', { file: this.currentFile });
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.emit('onPause', { file: this.currentFile });
    });

    this.audio.addEventListener('error', (e) => {
      console.error('[Audio] error', e, this.audio.error);
    });

    // Setup analyser if context available
    if (this.ctx) {
      try {
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.value = this.volume;
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 2048;
      } catch (e) {
        console.warn('[Audio] analyser setup failed', e);
      }
    }
  }

  on(event, cb) {
    if (this.callbacks[event]) this.callbacks[event].push(cb);
  }

  off(event, cb) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(fn => fn !== cb);
    }
  }

  emit(event, data) {
    (this.callbacks[event] || []).forEach(cb => {
      try { cb(data); } catch(e) { console.warn(e); }
    });
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    this.audio.volume = this.volume;
    if (this.gainNode) this.gainNode.gain.value = this.volume;
    if (window.AXStorage) AXStorage.updateSettings({ volume: this.volume });
  }

  async load(fileObj) {
    try {
      this.currentFile = fileObj;
      let url = '';

      if (fileObj.fileObject) {
        url = URL.createObjectURL(fileObj.fileObject);
      } else if (fileObj.path) {
        // For CEP, use file path as src - need file://
        if (fileObj.path.startsWith('http') || fileObj.path.startsWith('file://') || fileObj.path.startsWith('blob:')) {
          url = fileObj.path;
        } else {
          // Local file path - in CEP, we can use file:///
          // Replace backslashes and encode
          const encoded = fileObj.path.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/').replace(/%3A/g, ':');
          // Ensure proper file URL
          if (encoded.startsWith('/')) {
            url = 'file://' + encoded;
          } else {
            url = 'file:///' + encoded;
          }
          // For Windows, if it starts with C:, need file:///
          if (/^[A-Z]:/.test(fileObj.path)) {
            url = 'file:///' + fileObj.path.replace(/\\/g, '/').replace(/ /g, '%20');
          }
        }
      }

      // In CEP environment, direct file access may fail due to CORS - try to use local file via audio tag
      // For UXP, we may need to use entry.read()?
      console.log('[Audio] Loading', fileObj.name, url.substring(0, 100));

      this.audio.src = url;
      this.audio.load();
      
      // Pre-generate waveform if possible
      this.generateWaveform(fileObj, url);

      return true;
    } catch (e) {
      console.error('[Audio] load error', e);
      return false;
    }
  }

  async play(fileObj = null) {
    try {
      if (fileObj && fileObj !== this.currentFile) {
        await this.load(fileObj);
      }
      
      if (this.ctx && this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      // Connect to Web Audio if not already
      if (this.ctx && this.analyser && !this.source) {
        try {
          this.source = this.ctx.createMediaElementSource(this.audio);
          this.source.connect(this.gainNode);
          this.gainNode.connect(this.analyser);
          this.analyser.connect(this.ctx.destination);
        } catch (e) {
          // Already connected or error - ignore
        }
      }

      await this.audio.play();
      return true;
    } catch (e) {
      console.error('[Audio] play error', e);
      // Fallback: try without Web Audio
      try {
        await this.audio.play();
        return true;
      } catch (e2) {
        console.error('[Audio] fallback play error', e2);
        return false;
      }
    }
  }

  pause() {
    this.audio.pause();
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  seek(time) {
    if (isFinite(time) && time >= 0 && time <= this.duration) {
      this.audio.currentTime = time;
    }
  }

  // Waveform generation
  async generateWaveform(fileObj, url) {
    const cacheKey = fileObj.id || fileObj.path;
    if (this.waveformCache.has(cacheKey)) return this.waveformCache.get(cacheKey);

    try {
      // For fileObject, we can decode directly
      let arrayBuffer;
      if (fileObj.fileObject) {
        arrayBuffer = await fileObj.fileObject.arrayBuffer();
      } else {
        // Try fetch - may fail for file:// in CEP due to CORS, so we have fallback
        try {
          const resp = await fetch(url);
          if (!resp.ok) throw new Error('fetch failed');
          arrayBuffer = await resp.arrayBuffer();
        } catch (fetchErr) {
          console.warn('[Audio] fetch waveform failed, using dummy', fetchErr);
          // Generate dummy waveform
          const dummy = this.generateDummyWaveform();
          this.waveformCache.set(cacheKey, dummy);
          return dummy;
        }
      }

      if (!this.ctx) {
        const dummy = this.generateDummyWaveform();
        this.waveformCache.set(cacheKey, dummy);
        return dummy;
      }

      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer.slice(0));
      const waveform = this.extractWaveform(audioBuffer);
      this.waveformCache.set(cacheKey, waveform);
      return waveform;
    } catch (e) {
      console.warn('[Audio] waveform generation failed', e);
      const dummy = this.generateDummyWaveform();
      this.waveformCache.set(cacheKey, dummy);
      return dummy;
    }
  }

  extractWaveform(audioBuffer, points = 100) {
    const channelData = audioBuffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / points);
    const waveform = [];
    for (let i = 0; i < points; i++) {
      let sum = 0;
      let max = 0;
      for (let j = 0; j < blockSize; j++) {
        const idx = i * blockSize + j;
        if (idx < channelData.length) {
          const val = Math.abs(channelData[idx]);
          sum += val;
          if (val > max) max = val;
        }
      }
      waveform.push({
        avg: sum / blockSize,
        max: max
      });
    }
    return waveform;
  }

  generateDummyWaveform(points = 80) {
    const wf = [];
    for (let i = 0; i < points; i++) {
      // Generate aesthetically pleasing random waveform
      const t = i / points;
      const envelope = Math.sin(t * Math.PI); // fade in/out
      const noise = Math.random() * 0.5 + 0.3;
      wf.push({
        avg: noise * envelope * 0.6,
        max: noise * envelope
      });
    }
    return wf;
  }

  getWaveform(fileId) {
    return this.waveformCache.get(fileId) || null;
  }

  // Draw waveform to canvas
  drawWaveform(canvas, waveform, options = {}) {
    if (!canvas || !waveform) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    const dpr = window.devicePixelRatio || 1;
    
    // Handle high DPI
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, width, height);

    const {
      color = '#7c3aed',
      bgColor = 'transparent',
      progress = 0,
      progressColor = '#a78bfa',
      barWidth = 3,
      gap = 1,
      rounded = true
    } = options;

    if (bgColor !== 'transparent') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);
    }

    const totalBars = waveform.length;
    const barArea = width / totalBars;
    const centerY = height / 2;

    waveform.forEach((point, i) => {
      const x = i * barArea;
      const barH = Math.max(2, point.max * height * 0.9);
      const isPlayed = (i / totalBars) <= progress;

      ctx.fillStyle = isPlayed ? progressColor : color;
      
      if (rounded) {
        const radius = barWidth / 2;
        const y = centerY - barH / 2;
        // Draw rounded rect
        ctx.beginPath();
        ctx.roundRect(x + gap/2, y, barWidth, barH, radius);
        ctx.fill();
        // Mirror bottom? Actually full bar
      } else {
        ctx.fillRect(x, centerY - barH/2, barWidth, barH);
      }
    });
  }

  drawPlayingWaveform(canvas, analyser = null) {
    // Real-time analyser drawing (for future)
  }
}

window.AXAudio = new AudioEngine();
