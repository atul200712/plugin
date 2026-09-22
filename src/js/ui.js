/**
 * ATUL X SFX - UI - SIMPLE BULLETPROOF
 */

class UIManager {
  constructor() {
    this.files = [];
    this.filtered = [];
    this.currentCategory = 'all';
    this.currentFolderId = null;
    this.searchQuery = '';
    this.sortBy = 'name-asc';
    this.viewMode = 'list';
    this.selectedFile = null;
    this.playingFile = null;
    this.elements = {};
    this.initElements();
  }

  initElements() {
    this.elements = {
      grid: document.getElementById('sfx-grid'),
      list: document.getElementById('sfx-list'),
      empty: document.getElementById('empty-state'),
      toolbarInfo: document.getElementById('toolbar-info'),
      categoryList: document.getElementById('category-list'),
      folderList: document.getElementById('folder-list'),
      countAll: document.getElementById('count-all'),
      countFav: document.getElementById('count-fav'),
      countRecent: document.getElementById('count-recent'),
      searchInput: document.getElementById('search-input'),
      searchBox: document.getElementById('search-box'),
      searchClear: document.getElementById('search-clear'),
      sortSelect: document.getElementById('sort-select'),
      player: document.getElementById('player'),
      playerName: document.getElementById('player-name'),
      playerTime: document.getElementById('player-time'),
      playerArt: document.getElementById('player-art'),
      waveformWrap: document.getElementById('waveform-wrap'),
      waveformCanvas: document.getElementById('waveform-canvas'),
      loading: document.getElementById('loading-overlay'),
      loadingText: document.getElementById('loading-text'),
      contextMenu: document.getElementById('context-menu')
    };
  }

  init() {
    this.bindEvents();
    this.applySettings();
    this.render();
    console.log('[UI] Initialized');
  }

  applySettings() {
    const s = window.AXStorage ? AXStorage.getSettings() : {};
    this.viewMode = s.viewMode || 'list';
    if (this.elements.sortSelect) this.elements.sortSelect.value = s.sortBy ? s.sortBy+'-'+(s.sortOrder||'asc') : 'name-asc';
    document.querySelectorAll('.view-btn').forEach(b=>b.classList.toggle('active', b.dataset.view===this.viewMode));
    if (this.elements.list) this.elements.list.className = `sfx-list ${this.viewMode}-view`;
  }

  bindEvents() {
    let t;
    this.elements.searchInput?.addEventListener('input', e=>{
      clearTimeout(t);
      const v = e.target.value.trim();
      this.elements.searchBox?.classList.toggle('has-value', v.length>0);
      t=setTimeout(()=>{ this.searchQuery=v.toLowerCase(); this.filterAndRender(); }, 150);
    });
    this.elements.searchClear?.addEventListener('click', ()=>{
      this.elements.searchInput.value=''; this.searchQuery=''; this.elements.searchBox?.classList.remove('has-value'); this.filterAndRender();
    });
    this.elements.sortSelect?.addEventListener('change', e=>{
      this.sortBy=e.target.value;
      const [by,order]=this.sortBy.split('-');
      if(window.AXStorage) AXStorage.updateSettings({sortBy:by, sortOrder:order||'asc'});
      this.filterAndRender();
    });
    document.querySelectorAll('.view-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        this.viewMode=btn.dataset.view;
        document.querySelectorAll('.view-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        this.elements.list.className=`sfx-list ${this.viewMode}-view`;
        if(window.AXStorage) AXStorage.updateSettings({viewMode:this.viewMode});
        this.renderList();
      });
    });
    document.querySelectorAll('.nav-item[data-category]').forEach(item=>{
      item.addEventListener('click', ()=>{
        document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
        item.classList.add('active');
        this.currentCategory=item.dataset.category;
        this.currentFolderId=null;
        document.querySelectorAll('.folder-item').forEach(f=>f.classList.remove('active'));
        this.filterAndRender();
      });
    });
    document.getElementById('p-play')?.addEventListener('click', ()=>this.togglePlay());
    document.getElementById('p-stop')?.addEventListener('click', ()=>window.AXAudio.stop());
    document.getElementById('p-import')?.addEventListener('click', ()=>this.importCurrent());
    document.getElementById('p-fav')?.addEventListener('click', ()=>this.toggleFavCurrent());
    document.getElementById('volume-slider')?.addEventListener('input', e=>window.AXAudio.setVolume(parseFloat(e.target.value)));
    this.elements.waveformWrap?.addEventListener('click', e=>{
      const rect=this.elements.waveformWrap.getBoundingClientRect();
      const pct=(e.clientX-rect.left)/rect.width;
      window.AXAudio.seek(pct*(window.AXAudio.duration||0));
    });
    document.addEventListener('keydown', e=>{
      if(e.target.tagName==='INPUT')return;
      if(e.code==='Space'){ e.preventDefault(); this.togglePlay(); }
      else if(e.code==='Enter'){ e.preventDefault(); this.importCurrent(); }
      else if(e.code==='ArrowDown'||e.code==='ArrowUp'){ e.preventDefault(); this.navigateList(e.code==='ArrowDown'?1:-1); }
    });
    window.AXAudio.on('onTimeUpdate', d=>this.updatePlayerTime(d));
    window.AXAudio.on('onEnded', ()=>this.onAudioEnded());
    window.AXAudio.on('onPlay', ()=>this.updatePlayButton(true));
    window.AXAudio.on('onPause', ()=>this.updatePlayButton(false));
    document.addEventListener('click', ()=>this.elements.contextMenu?.classList.remove('visible'));
    this.elements.contextMenu?.addEventListener('click', e=>{
      const item=e.target.closest('.ctx-item'); if(!item)return;
      const action=item.dataset.action; const fileId=this.elements.contextMenu.dataset.fileId;
      const file=this.files.find(f=>f.id===fileId); if(!file)return;
      if(action==='play')this.playFile(file); else if(action==='import')this.importFile(file);
      else if(action==='favorite')this.toggleFavorite(file);
      this.elements.contextMenu.classList.remove('visible');
    });
    document.getElementById('btn-add-folder')?.addEventListener('click', ()=>this.addFolder());
    document.getElementById('btn-manage-folders')?.addEventListener('click', ()=>this.manageFolders());
    document.getElementById('empty-add-folder')?.addEventListener('click', ()=>this.addFolder());
    document.getElementById('btn-favorites')?.addEventListener('click', ()=>document.querySelector('[data-category="favorites"]')?.click());
    document.getElementById('btn-settings')?.addEventListener('click', ()=>this.showSettings());
  }

  setFiles(files) {
    this.files = files||[];
    console.log('[UI] setFiles', this.files.length);
    this.filterAndRender();
    this.updateCounts();
    this.renderCategories();
    this.renderFolders();
  }

  filterAndRender() {
    let filtered=[...this.files];
    if(this.currentCategory==='favorites'){
      const favs=window.AXStorage?AXStorage.getFavorites():[];
      filtered=filtered.filter(f=>favs.includes(f.id));
    } else if(this.currentCategory==='recent'){
      const recent=window.AXStorage?AXStorage.getRecent():[];
      filtered=filtered.filter(f=>recent.includes(f.id));
      filtered.sort((a,b)=>recent.indexOf(a.id)-recent.indexOf(b.id));
    } else if(this.currentCategory!=='all'){
      filtered=filtered.filter(f=>f.category===this.currentCategory);
    }
    if(this.currentFolderId){
      const folder=window.AXStorage.getFolders().find(f=>f.id===this.currentFolderId);
      if(folder){
        filtered=filtered.filter(f=>f.folderName===folder.name || f.folder.includes(folder.name) || f.path.includes(folder.path) || f.path.includes(folder.name));
      }
    }
    if(this.searchQuery){
      const q=this.searchQuery;
      filtered=filtered.filter(f=>f.name.toLowerCase().includes(q)||f.fileName.toLowerCase().includes(q)||f.category.toLowerCase().includes(q)||f.folderName.toLowerCase().includes(q));
    }
    if(this.currentCategory!=='recent'){
      filtered=this.sortFiles(filtered, this.sortBy);
    }
    this.filtered=filtered;
    this.renderList();
    this.updateToolbar();
  }

  sortFiles(files, sortBy){
    const [field,order]=sortBy.split('-');
    return files.sort((a,b)=>{
      let cmp=0;
      if(field==='name') cmp=a.name.localeCompare(b.name);
      else if(field==='category') cmp=a.category.localeCompare(b.category);
      else if(field==='size') cmp=(a.size||0)-(b.size||0);
      return order==='desc'?-cmp:cmp;
    });
  }

  render(){ this.renderCategories(); this.renderFolders(); this.updateCounts(); this.filterAndRender(); }

  renderCategories(){
    if(!this.elements.categoryList)return;
    const cats={};
    this.files.forEach(f=>{ cats[f.category]=(cats[f.category]||0)+1; });
    const sorted=Object.entries(cats).sort((a,b)=>b[1]-a[1]);
    this.elements.categoryList.innerHTML=sorted.map(([cat,count])=>`
      <div class="nav-item" data-cat="${cat}">
        <div class="nav-item-left"><span class="nav-icon">•</span> ${cat}</div>
        <span class="nav-count">${count}</span>
      </div>
    `).join('');
    this.elements.categoryList.querySelectorAll('.nav-item').forEach(el=>{
      el.addEventListener('click', ()=>{
        document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
        el.classList.add('active');
        this.currentCategory=el.dataset.cat;
        this.currentFolderId=null;
        document.querySelectorAll('.folder-item').forEach(f=>f.classList.remove('active'));
        this.filterAndRender();
      });
    });
  }

  renderFolders(){
    if(!this.elements.folderList)return;
    const folders=window.AXStorage.getFolders();
    if(folders.length===0){ this.elements.folderList.innerHTML=`<div style="padding:8px; font-size:11px; color:var(--text-dim);">No folders</div>`; return; }
    this.elements.folderList.innerHTML=folders.map(f=>`
      <div class="folder-item" data-folder-id="${f.id}" title="${f.path}">${f.name}<button class="folder-remove" data-remove="${f.id}">✕</button></div>
    `).join('');
    this.elements.folderList.querySelectorAll('.folder-item').forEach(el=>{
      el.addEventListener('click', e=>{
        if(e.target.classList.contains('folder-remove'))return;
        document.querySelectorAll('.folder-item').forEach(f=>f.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
        el.classList.add('active');
        this.currentFolderId=el.dataset.folderId;
        this.currentCategory='all';
        this.filterAndRender();
      });
    });
    this.elements.folderList.querySelectorAll('.folder-remove').forEach(btn=>{
      btn.addEventListener('click', e=>{
        e.stopPropagation();
        if(confirm('Remove folder?')){ window.AXStorage.removeFolder(btn.dataset.remove); this.renderFolders(); this.refreshLibrary(); }
      });
    });
  }

  updateCounts(){
    const favs=window.AXStorage?AXStorage.getFavorites():[];
    const recent=window.AXStorage?AXStorage.getRecent():[];
    if(this.elements.countAll) this.elements.countAll.textContent=this.files.length;
    if(this.elements.countFav) this.elements.countFav.textContent=favs.length;
    if(this.elements.countRecent) this.elements.countRecent.textContent=recent.length;
  }

  updateToolbar(){
    if(this.elements.toolbarInfo){
      const total=this.filtered.length, all=this.files.length;
      if(this.searchQuery||this.currentCategory!=='all'||this.currentFolderId) this.elements.toolbarInfo.innerHTML=`<strong>${total}</strong> of ${all}`;
      else this.elements.toolbarInfo.innerHTML=`<strong>${total}</strong> sounds`;
    }
  }

  renderList(){
    if(!this.elements.grid)return;
    if(this.filtered.length===0){ this.elements.grid.innerHTML=''; this.elements.empty.style.display='flex'; return; }
    this.elements.empty.style.display='none';
    const frag=document.createDocumentFragment();
    // Virtualize: only render first 200, then load more on scroll
    const toRender = this.filtered.slice(0, 300);
    toRender.forEach(file=>{ frag.appendChild(this.createCard(file)); });
    this.elements.grid.innerHTML='';
    this.elements.grid.appendChild(frag);
    
    if(this.filtered.length>300){
      const more=document.createElement('div');
      more.style.cssText='padding:12px; text-align:center; color:var(--text-dim); font-size:11px;';
      more.textContent=`Showing 300 of ${this.filtered.length} - Scroll to load more (or search to filter)`;
      this.elements.grid.appendChild(more);
    }
  }

  createCard(file){
    const isFav=window.AXStorage?AXStorage.isFavorite(file.id):false;
    const isPlaying=this.playingFile&&this.playingFile.id===file.id;
    const isSelected=this.selectedFile&&this.selectedFile.id===file.id;
    const div=document.createElement('div');
    div.className=`sfx-card ${isPlaying?'playing':''} ${isSelected?'selected':''}`;
    div.dataset.fileId=file.id;
    const ext=(file.ext||'').replace('.','').toUpperCase()||'WAV';
    const size=file.size?this.formatSize(file.size):'';
    
    div.innerHTML=`
      <button class="play-btn">${isPlaying?'⏸':'▶'}</button>
      <div class="sfx-info">
        <div class="sfx-name" title="${file.fileName}">${file.name}</div>
        <div class="sfx-meta">
          <span class="sfx-tag">${file.category}</span>
          <span>${ext}</span>
          <span>${file.folderName}</span>
          ${size?`<span>${size}</span>`:''}
        </div>
      </div>
      <canvas class="sfx-wave" width="70" height="22"></canvas>
      <div class="sfx-actions">
        <button class="action-btn fav ${isFav?'active':''}" data-action="fav">${isFav?'★':'☆'}</button>
        <button class="action-btn import" data-action="import">⬇</button>
      </div>
    `;
    
    div.querySelector('.play-btn')?.addEventListener('click', e=>{ e.stopPropagation(); this.playFile(file); });
    div.querySelector('[data-action="fav"]')?.addEventListener('click', e=>{ e.stopPropagation(); this.toggleFavorite(file); });
    div.querySelector('[data-action="import"]')?.addEventListener('click', e=>{ e.stopPropagation(); this.importFile(file); });
    div.addEventListener('click', ()=>this.selectFile(file));
    div.addEventListener('dblclick', ()=>this.importFile(file));
    div.addEventListener('contextmenu', e=>{ e.preventDefault(); this.showContextMenu(e,file); });
    div.draggable=true;
    div.addEventListener('dragstart', e=>{ e.dataTransfer.setData('text/plain', file.path); });
    
    setTimeout(()=>{
      const canvas=div.querySelector('canvas');
      if(canvas){
        const wf=window.AXAudio.getWaveform(file.id)||window.AXAudio.generateDummyWaveform(20);
        window.AXAudio.drawWaveform(canvas, wf, {
          color: isPlaying?'#a78bfa':'#3f3f46',
          progress: isPlaying?(window.AXAudio.currentTime/window.AXAudio.duration)||0:0,
          progressColor:'#7c3aed', barWidth:2, gap:1
        });
      }
    }, 20);
    
    return div;
  }

  formatSize(bytes){ if(!bytes)return''; if(bytes<1024)return bytes+' B'; if(bytes<1024*1024)return (bytes/1024).toFixed(0)+' KB'; return (bytes/(1024*1024)).toFixed(1)+' MB'; }

  selectFile(file){
    this.selectedFile=file;
    document.querySelectorAll('.sfx-card').forEach(c=>c.classList.toggle('selected', c.dataset.fileId===file.id));
    if(!this.playingFile||this.playingFile.id!==file.id) this.updatePlayerInfo(file);
  }

  async playFile(file){
    if(this.playingFile&&this.playingFile.id===file.id){
      if(window.AXAudio.isPlaying) window.AXAudio.pause(); else window.AXAudio.play(); return;
    }
    this.playingFile=file; this.selectedFile=file;
    if(window.AXStorage) AXStorage.addRecent(file.id);
    document.querySelectorAll('.sfx-card').forEach(c=>{
      c.classList.toggle('playing', c.dataset.fileId===file.id);
      const btn=c.querySelector('.play-btn'); if(btn) btn.textContent=c.dataset.fileId===file.id?'⏸':'▶';
    });
    this.updatePlayerInfo(file); this.showPlayer();
    const ok=await window.AXAudio.play(file);
    if(!ok) this.showToast('Preview failed - try another file', 'error');
  }

  togglePlay(){
    if(this.playingFile){ if(window.AXAudio.isPlaying) window.AXAudio.pause(); else window.AXAudio.play(); }
    else if(this.selectedFile) this.playFile(this.selectedFile);
    else if(this.filtered.length>0) this.playFile(this.filtered[0]);
  }

  updatePlayerInfo(file){
    if(!file)return;
    if(this.elements.playerName) this.elements.playerName.textContent=file.name;
    if(this.elements.playerArt) this.elements.playerArt.textContent=file.name.charAt(0).toUpperCase();
    const favBtn=document.getElementById('p-fav');
    if(favBtn){ const isFav=window.AXStorage.isFavorite(file.id); favBtn.textContent=isFav?'★':'☆'; favBtn.classList.toggle('active',isFav); }
  }

  showPlayer(){ if(this.elements.player) this.elements.player.style.display='flex'; }

  updatePlayerTime(data){
    if(this.elements.playerTime){
      const cur=this.formatTime(data.currentTime), dur=this.formatTime(data.duration||window.AXAudio.duration);
      this.elements.playerTime.textContent=`${cur} / ${dur}`;
    }
    if(this.elements.waveformCanvas&&window.AXAudio.duration){
      const progress=data.currentTime/window.AXAudio.duration;
      const wf=window.AXAudio.getWaveform(this.playingFile?.id);
      if(wf) window.AXAudio.drawWaveform(this.elements.waveformCanvas, wf, {color:'#3f3f46', progress, progressColor:'#7c3aed', barWidth:3, gap:1});
    }
  }

  formatTime(sec){ if(!isFinite(sec))return'00:00'; const m=Math.floor(sec/60), s=Math.floor(sec%60); return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`; }

  onAudioEnded(){
    document.querySelectorAll('.sfx-card').forEach(c=>c.classList.remove('playing'));
    document.querySelectorAll('.play-btn').forEach(b=>b.textContent='▶');
    this.updatePlayButton(false);
  }

  updatePlayButton(isPlaying){
    const btn=document.getElementById('p-play'); if(btn) btn.textContent=isPlaying?'⏸':'▶';
    if(this.playingFile){ const cardBtn=document.querySelector(`.sfx-card[data-file-id="${this.playingFile.id}"] .play-btn`); if(cardBtn) cardBtn.textContent=isPlaying?'⏸':'▶'; }
  }

  async importFile(file){
    if(!file)return;
    this.showToast(`Importing ${file.name}...`, 'info');
    const ok=await window.AXHost.importToTimeline(file);
    if(ok){ this.showToast(`✓ Imported ${file.name}`, 'success'); if(window.AXStorage){ AXStorage.addRecent(file.id); this.updateCounts(); } }
    else this.showToast(`Failed to import ${file.name}`, 'error');
  }

  importCurrent(){ const f=this.playingFile||this.selectedFile; if(f) this.importFile(f); else this.showToast('Select a sound first','info'); }

  toggleFavorite(file){
    if(!window.AXStorage)return;
    AXStorage.toggleFavorite(file.id);
    const isFav=AXStorage.isFavorite(file.id);
    const card=document.querySelector(`.sfx-card[data-file-id="${file.id}"] .fav`);
    if(card){ card.textContent=isFav?'★':'☆'; card.classList.toggle('active',isFav); }
    if(this.selectedFile&&this.selectedFile.id===file.id){
      const pFav=document.getElementById('p-fav'); if(pFav){ pFav.textContent=isFav?'★':'☆'; pFav.classList.toggle('active',isFav); }
    }
    this.updateCounts();
    if(this.currentCategory==='favorites') this.filterAndRender();
    this.showToast(isFav?`★ ${file.name} favorited`:`Removed favorite`, 'info');
  }

  toggleFavCurrent(){ const f=this.playingFile||this.selectedFile; if(f) this.toggleFavorite(f); }

  navigateList(dir){
    if(this.filtered.length===0)return;
    let idx=0; if(this.selectedFile) idx=this.filtered.findIndex(f=>f.id===this.selectedFile.id);
    idx=Math.max(0, Math.min(this.filtered.length-1, idx+dir));
    const file=this.filtered[idx];
    this.selectFile(file);
    document.querySelector(`.sfx-card[data-file-id="${file.id}"]`)?.scrollIntoView({block:'nearest', behavior:'smooth'});
  }

  showContextMenu(e,file){
    const menu=this.elements.contextMenu; if(!menu)return;
    menu.style.left=e.clientX+'px'; menu.style.top=e.clientY+'px'; menu.dataset.fileId=file.id; menu.classList.add('visible');
    setTimeout(()=>{
      const rect=menu.getBoundingClientRect();
      if(rect.right>window.innerWidth) menu.style.left=(window.innerWidth-rect.width-8)+'px';
      if(rect.bottom>window.innerHeight) menu.style.top=(window.innerHeight-rect.height-8)+'px';
    },0);
  }

  async addFolder(){
    try{
      this.showLoading('Opening folder...');
      const folder=await window.AXFileSystem.selectFolder();
      this.hideLoading();
      if(folder){
        console.log('[UI] Folder selected', folder.name, folder.files?.length||folder.path);
        window.AXStorage.addFolder(folder);
        this.showToast(`Added: ${folder.name} (${folder.files?.length||'?'} files)`, 'success');
        this.renderFolders();
        await this.refreshLibrary();
      }
    }catch(e){ this.hideLoading(); console.error(e); this.showToast('Failed: '+e.message,'error'); }
  }

  manageFolders(){ if(window.AXOnboarding) AXOnboarding.show(); }

  showSettings(){
    const folders=window.AXStorage.getFolders();
    const msg=`ATUL X SFX v1.0.0\nHost: ${window.AXHost.getAppName()}\nFolders: ${folders.length}\nSounds: ${this.files.length}\n\n1. Clear all folders\n2. Clear favorites\n3. Reset onboarding\n4. Clear all + reload\n\nEnter number:`;
    const c=prompt(msg);
    if(c==='1'&&confirm('Clear all folders?')){ AXStorage.clearFolders(); this.files=[]; this.filterAndRender(); this.renderFolders(); this.updateCounts(); }
    else if(c==='2'){ AXStorage.set(AXStorage.KEYS.FAVORITES,[]); this.updateCounts(); this.filterAndRender(); }
    else if(c==='3'){ AXStorage.setOnboarded(false); AXOnboarding.show(); }
    else if(c==='4'){ localStorage.clear(); location.reload(); }
  }

  async refreshLibrary(){
    this.showLoading('Scanning...');
    try{
      const folders=window.AXStorage.getFolders();
      console.log('[UI] Refresh folders', folders.length);
      if(folders.length===0){ this.setFiles([]); this.hideLoading(); return; }
      const files=await window.AXFileSystem.scanFolders(folders);
      console.log('[UI] Scan done', files.length);
      this.setFiles(files);
      this.hideLoading();
      if(files.length===0) this.showToast('No files found - try adding folder again','error');
      else this.showToast(`Found ${files.length} sounds!`, 'success');
    }catch(e){ console.error('[UI] refresh error',e); this.hideLoading(); this.showToast('Scan failed: '+e.message,'error'); }
  }

  showLoading(text='Loading...'){ if(this.elements.loading){ this.elements.loading.style.display='flex'; if(this.elements.loadingText) this.elements.loadingText.textContent=text; } }
  hideLoading(){ if(this.elements.loading) this.elements.loading.style.display='none'; }
  showToast(msg,type='info'){
    const c=document.getElementById('toast-container'); if(!c)return;
    const t=document.createElement('div'); t.className=`toast ${type}`; t.textContent=msg;
    c.appendChild(t);
    setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateY(8px)'; setTimeout(()=>t.remove(),300); }, 3500);
  }
}

window.AXUI = new UIManager();
