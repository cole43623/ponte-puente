(function(){
  "use strict";

  // Guess theme immediately (before anything renders) to avoid a flash of the wrong theme
  document.documentElement.dataset.theme =
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';

  /* ============ Utilities ============ */
  const $ = (sel, el) => (el||document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el||document).querySelectorAll(sel));
  const DAY = 86400000;
  const uid = () => 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  const todayStr = () => new Date().toISOString().slice(0,10);

  function toast(msg){
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._h);
    toast._h = setTimeout(()=>t.classList.remove('show'), 2200);
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }
  const escapeAttr = escapeHtml;

  /* ============ Theme (giorno/notte) ============ */
  const THEME_KEY = 'ponte_theme_v1';

  function loadTheme(){
    try{
      const t = localStorage.getItem(THEME_KEY);
      if(t === 'light' || t === 'dark') return t;
    }catch(e){ /* localStorage unavailable */ }
    return document.documentElement.dataset.theme || 'dark';
  }

  function updateThemeIcon(t){
    const btn = $('#themeToggle');
    if(!btn) return;
    btn.innerHTML = t === 'light'
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7"/></svg>`;
    btn.setAttribute('aria-label', t === 'light' ? 'Passa alla modalità notte' : 'Passa alla modalità giorno');
  }

  function applyTheme(t){
    document.documentElement.dataset.theme = t;
    updateThemeIcon(t);
  }

  function toggleTheme(){
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    try{ localStorage.setItem(THEME_KEY, next); }catch(e){ console.error('theme save error', e); }
  }

  /* ============ Data model ============ */
  const NEW_SRS = () => ({ease:2.5, interval:0, reps:0, due:Date.now(), lastReview:null});

  function seedCards(){
    // Le coppie del mazzo di partenza vivono in js/cards.js (window.PONTE_SEED_PAIRS)
    // per tenere i dati separati dalla logica dell'app.
    const pairs = (window.PONTE_SEED_PAIRS && window.PONTE_SEED_PAIRS.length)
      ? window.PONTE_SEED_PAIRS
      : [["ciao","hola","",[]]];
    return pairs.map(([it,es,note,tags])=>({
      id: uid(), it, es, note: note||"", example: "", tags: Array.isArray(tags) ? tags.slice() : [], createdAt: Date.now(),
      srsItEs: NEW_SRS(), srsEsIt: NEW_SRS()
    }));
  }

  function defaultData(){
    return {
      cards: seedCards(),
      streak: { count:0, lastDate:null },
      newToday: { date: todayStr(), count:0, extra:0 },
      history: {} // { 'YYYY-MM-DD': { reviews:0, correct:0 } }
    };
  }

  function ensureCardShape(c){
    if(!Array.isArray(c.tags)) c.tags = [];
    if(typeof c.example !== 'string') c.example = '';
    return c;
  }

  function logReview(rating){
    if(!DATA.history) DATA.history = {};
    const t = todayStr();
    if(!DATA.history[t]) DATA.history[t] = { reviews:0, correct:0 };
    DATA.history[t].reviews += 1;
    if(rating >= 2) DATA.history[t].correct += 1;
  }

  const DECK_KEY = 'ponte_deck_v1';
  let DATA = null;

  function loadLocalDeck(){
    try{
      const raw = localStorage.getItem(DECK_KEY);
      if(raw){
        const parsed = JSON.parse(raw);
        if(parsed && Array.isArray(parsed.cards)){
          parsed.cards.forEach(ensureCardShape);
          if(!parsed.history) parsed.history = {};
          return parsed;
        }
      }
    }catch(e){ console.error('local deck read error', e); }
    return null;
  }

  function saveLocalDeck(data){
    try{
      localStorage.setItem(DECK_KEY, JSON.stringify(data));
    }catch(e){
      console.error('local deck write error', e);
      toast('Impossibile salvare in locale (spazio pieno?)');
    }
  }

  /* ============ GitHub Gist sync ============ */
  const CONFIG_KEY = 'ponte_gist_config_v1';
  const GIST_FILENAME = 'ponte-flashcards.json';
  const API_HEADERS_BASE = { 'Accept':'application/vnd.github+json', 'X-GitHub-Api-Version':'2022-11-28' };

  function loadGistConfig(){
    try{
      const raw = localStorage.getItem(CONFIG_KEY);
      if(raw) return JSON.parse(raw);
    }catch(e){ /* ignore */ }
    return { token:'', gistId:'', htmlUrl:'', autoSync:true };
  }
  function saveGistConfig(cfg){
    try{ localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg)); }catch(e){ console.error(e); }
  }

  let gistConfig = loadGistConfig();
  let pushTimer = null;
  let syncState = 'local'; // local | syncing | synced | error

  /* ============ Study preferences ============ */
  const PREFS_KEY = 'ponte_prefs_v1';
  function loadPrefs(){
    try{
      const raw = localStorage.getItem(PREFS_KEY);
      if(raw) return Object.assign({ tts:true, typingMode:false }, JSON.parse(raw));
    }catch(e){ /* ignore */ }
    return { tts:true, typingMode:false };
  }
  function savePrefs(){ try{ localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); }catch(e){ console.error(e); } }
  let prefs = loadPrefs();

  /* ============ Text-to-speech ============ */
  function speak(text, lang){
    if(!('speechSynthesis' in window) || !text) return;
    try{
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === 'it' ? 'it-IT' : 'es-ES';
      u.rate = 0.92;
      window.speechSynthesis.speak(u);
    }catch(e){ /* TTS unavailable */ }
  }

  function authHeaders(token){
    return Object.assign({}, API_HEADERS_BASE, { 'Authorization': 'Bearer ' + token });
  }

  async function gistFetch(gistId, token){
    const res = await fetch('https://api.github.com/gists/' + gistId, { headers: authHeaders(token) });
    if(!res.ok) throw new Error('Lettura Gist fallita (' + res.status + ')');
    const json = await res.json();
    const file = json.files && json.files[GIST_FILENAME];
    if(!file) throw new Error('Il Gist non contiene il file atteso');
    let content = file.content;
    if(file.truncated){
      const raw = await fetch(file.raw_url);
      content = await raw.text();
    }
    return { data: JSON.parse(content), htmlUrl: json.html_url };
  }

  async function gistCreate(token, data){
    const res = await fetch('https://api.github.com/gists', {
      method:'POST',
      headers: Object.assign({}, authHeaders(token), {'Content-Type':'application/json'}),
      body: JSON.stringify({
        description: 'Ponte · Puente — flashcard italiano-spagnolo',
        public: false,
        files: { [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) } }
      })
    });
    if(!res.ok) throw new Error('Creazione Gist fallita (' + res.status + ')');
    const json = await res.json();
    return { gistId: json.id, htmlUrl: json.html_url };
  }

  async function gistUpdate(gistId, token, data){
    const res = await fetch('https://api.github.com/gists/' + gistId, {
      method:'PATCH',
      headers: Object.assign({}, authHeaders(token), {'Content-Type':'application/json'}),
      body: JSON.stringify({ files: { [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) } } })
    });
    if(!res.ok) throw new Error('Aggiornamento Gist fallito (' + res.status + ')');
  }

  function setSyncState(s){
    syncState = s;
    const dot = $('#syncDot');
    if(dot) dot.className = 'sync-dot ' + s;
    updateSyncStatusLine();
  }

  function updateSyncStatusLine(){
    const line = $('#syncStatusLine');
    if(!line) return;
    const linkEl = $('#gistLink');
    const actionsRow = $('#syncActionsRow');
    if(!gistConfig.token || !gistConfig.gistId){
      line.textContent = 'Stato: solo locale, nessun Gist collegato';
      if(linkEl) linkEl.style.display = 'none';
      if(actionsRow) actionsRow.style.display = 'none';
      return;
    }
    if(actionsRow) actionsRow.style.display = 'flex';
    if(linkEl && gistConfig.htmlUrl){
      linkEl.style.display = 'inline-block';
      linkEl.href = gistConfig.htmlUrl;
    }
    const map = {
      local: 'Collegato, in attesa di sincronizzazione',
      syncing: 'Sincronizzazione in corso…',
      synced: 'Sincronizzato ✓' + (gistConfig.lastSync ? ' · ' + new Date(gistConfig.lastSync).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}) : ''),
      error: 'Errore di sincronizzazione, i dati restano salvati in locale'
    };
    line.textContent = 'Stato: ' + (map[syncState] || syncState);
  }

  function queuePush(){
    if(!gistConfig.token || !gistConfig.gistId || gistConfig.autoSync === false) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(pushToGist, 2500);
  }

  async function pushToGist(){
    if(!gistConfig.token || !gistConfig.gistId) return;
    setSyncState('syncing');
    try{
      await gistUpdate(gistConfig.gistId, gistConfig.token, DATA);
      gistConfig.lastSync = Date.now();
      saveGistConfig(gistConfig);
      setSyncState('synced');
    }catch(e){
      console.error(e);
      setSyncState('error');
      toast('Sincronizzazione fallita: dati salvati solo in locale');
    }
  }

  async function pullFromGist(announce){
    if(!gistConfig.token || !gistConfig.gistId) return false;
    setSyncState('syncing');
    try{
      const { data, htmlUrl } = await gistFetch(gistConfig.gistId, gistConfig.token);
      if(!data || !Array.isArray(data.cards)) throw new Error('formato dati non valido');
      data.cards.forEach(ensureCardShape);
      if(!data.history) data.history = {};
      DATA = data;
      saveLocalDeck(DATA);
      gistConfig.htmlUrl = htmlUrl || gistConfig.htmlUrl;
      gistConfig.lastSync = Date.now();
      saveGistConfig(gistConfig);
      setSyncState('synced');
      if(announce) toast('Carte scaricate dal Gist');
      renderCurrentTab();
      return true;
    }catch(e){
      console.error(e);
      setSyncState('error');
      if(announce) toast('Impossibile scaricare dal Gist');
      return false;
    }
  }

  /* Called on every local mutation: always saves locally, and debounces a Gist push */
  function persist(){
    saveLocalDeck(DATA);
    if(gistConfig.token && gistConfig.gistId){
      if(gistConfig.autoSync === false) setSyncState('local');
      else queuePush();
    } else {
      setSyncState('local');
    }
  }

  /* ============ SM-2 style scheduler ============ */
  // rating: 0 again, 1 hard, 2 good, 3 easy
  function schedule(srs, rating){
    const now = Date.now();
    let {ease, interval, reps} = srs;
    if(rating === 0){
      reps = 0;
      ease = Math.max(1.3, ease - 0.2);
      interval = 10/1440; // 10 minutes, reappears same session
    } else {
      if(reps === 0){
        interval = rating===1 ? 1 : (rating===2 ? 1.5 : 3);
      } else if(reps === 1){
        interval = rating===1 ? 2.5 : (rating===2 ? 4 : 7);
      } else {
        const factor = rating===1 ? 1.2 : (rating===2 ? ease : ease + 0.15);
        interval = Math.max(1, interval * factor);
      }
      reps += 1;
      if(rating===1) ease = Math.max(1.3, ease - 0.05);
      else if(rating===3) ease = ease + 0.1;
      interval = Math.round(interval*10)/10;
    }
    return { ease, interval, reps, due: now + interval*DAY, lastReview: now };
  }

  function fmtInterval(days){
    if(days < 1) return Math.round(days*1440) + 'min';
    if(days < 30) return Math.round(days) + 'g';
    if(days < 365) return Math.round(days/30*10)/10 + 'm';
    return Math.round(days/365*10)/10 + 'a';
  }

  /* ============ Queue building ============ */
  const NEW_DAILY_LIMIT = 15;

  function ensureDailyReset(){
    if(DATA.newToday.date !== todayStr()){
      DATA.newToday = { date: todayStr(), count: 0, extra: 0 };
    } else if(typeof DATA.newToday.extra !== 'number'){
      DATA.newToday.extra = 0;
    }
  }

  function directionItems(direction, tag){
    const items = [];
    DATA.cards.forEach(c=>{
      if(tag && !(c.tags||[]).includes(tag)) return;
      if(direction==='itEs' || direction==='mixed') items.push({cardId:c.id, dir:'itEs'});
      if(direction==='esIt' || direction==='mixed') items.push({cardId:c.id, dir:'esIt'});
    });
    return items;
  }

  function getSrs(card, dir){ return dir==='itEs' ? card.srsItEs : card.srsEsIt; }

  function allTags(){
    const set = new Set();
    DATA.cards.forEach(c => (c.tags||[]).forEach(t=>set.add(t)));
    return Array.from(set).sort((a,b)=>a.localeCompare(b,'it'));
  }

  function buildQueue(direction, tag){
    ensureDailyReset();
    const now = Date.now();
    const byId = Object.fromEntries(DATA.cards.map(c=>[c.id,c]));
    const items = directionItems(direction, tag);
    const due = [];
    const fresh = [];
    items.forEach(it=>{
      const c = byId[it.cardId];
      const srs = getSrs(c, it.dir);
      if(srs.reps === 0) fresh.push(it);
      else if(srs.due <= now) due.push(it);
    });
    due.sort((a,b)=> getSrs(byId[a.cardId],a.dir).due - getSrs(byId[b.cardId],b.dir).due);
    fresh.sort((a,b)=> byId[a.cardId].createdAt - byId[b.cardId].createdAt);
    const remainingNew = Math.max(0, NEW_DAILY_LIMIT + (DATA.newToday.extra||0) - DATA.newToday.count);
    const freshAllowed = fresh.slice(0, remainingNew);

    const queue = [];
    let fi = 0;
    due.forEach((it,idx)=>{
      queue.push(it);
      if((idx+1) % 4 === 0 && fi < freshAllowed.length){
        queue.push(freshAllowed[fi++]);
      }
    });
    while(fi < freshAllowed.length) queue.push(freshAllowed[fi++]);

    return queue.map(it => ({ ...it }));
  }

  function dueCount(direction, tag){
    return buildQueue(direction, tag).length;
  }

  function lockedFreshCount(tag){
    ensureDailyReset();
    const byId = Object.fromEntries(DATA.cards.map(c=>[c.id,c]));
    const items = directionItems('mixed', tag);
    let freshTotal = 0;
    items.forEach(it=>{
      const c = byId[it.cardId];
      const srs = getSrs(c, it.dir);
      if(srs.reps === 0) freshTotal++;
    });
    const remainingNew = Math.max(0, NEW_DAILY_LIMIT + (DATA.newToday.extra||0) - DATA.newToday.count);
    return Math.max(0, freshTotal - remainingNew);
  }

  function unlockMoreNew(){
    ensureDailyReset();
    DATA.newToday.extra = (DATA.newToday.extra||0) + NEW_DAILY_LIMIT;
    persist();
    toast(`+${NEW_DAILY_LIMIT} carte nuove sbloccate per oggi`);
    renderHome();
  }

  /* ============ App state ============ */
  let activeTab = 'home';
  let studyDirection = 'mixed';
  let session = null;
  let libSearch = '';
  let expandedCardId = null;
  let activeTagFilter = '';
  let libTagFilter = '';
  let studyKeyCleanup = null;

  function audioIconSvg(){
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>`;
  }

  function renderCurrentTab(){
    if(activeTab === 'home') renderHome();
    else if(activeTab === 'stats') renderStats();
    else renderLibrary();
  }

  /* ============ Rendering: HOME ============ */
  function directionLabel(dir){
    return dir==='itEs' ? 'IT → ES' : dir==='esIt' ? 'ES → IT' : 'Misto';
  }

  function renderHome(){
    if(session) return renderStudy();

    const totalDue = dueCount(studyDirection, activeTagFilter);
    const totalCards = DATA.cards.length;
    ensureDailyReset();
    const streak = DATA.streak.count;
    const tags = allTags();

    const main = $('#main');
    main.innerHTML = `
      <div class="stat-grid">
        <div class="stat-cell"><div class="stat-num due">${dueCount('mixed', activeTagFilter)}</div><div class="stat-label">Da ripassare</div></div>
        <div class="stat-cell"><div class="stat-num streak">${streak}</div><div class="stat-label">Giorni di fila</div></div>
        <div class="stat-cell"><div class="stat-num" style="color:var(--es)">${totalCards}</div><div class="stat-label">Carte totali</div></div>
      </div>

      <div class="section-label">Direzione</div>
      <div class="dir-select" id="dirSelect">
        <button class="dir-opt ${studyDirection==='itEs'?'active':''}" data-dir="itEs"><span class="pill">IT→ES</span></button>
        <button class="dir-opt ${studyDirection==='esIt'?'active':''}" data-dir="esIt"><span class="pill">ES→IT</span></button>
        <button class="dir-opt ${studyDirection==='mixed'?'active':''}" data-dir="mixed"><span class="pill">MIX</span></button>
      </div>

      ${tags.length ? `
        <div class="section-label">Categoria</div>
        <div class="tag-chips" id="homeTagChips">
          <button class="tag-chip ${activeTagFilter===''?'active':''}" data-tag="">Tutte</button>
          ${tags.map(t=>`<button class="tag-chip ${activeTagFilter===t?'active':''}" data-tag="${escapeAttr(t)}">${escapeHtml(t)}</button>`).join('')}
        </div>
      ` : ''}

      ${totalCards === 0 ? `
        <div class="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 9h18"/></svg>
          <p>Non hai ancora nessuna carta. Vai su "Le mie carte" e aggiungine una per iniziare.</p>
        </div>
      ` : `
        <button class="cta" id="startBtn" ${totalDue===0 ? 'disabled' : ''}>
          ${totalDue===0 ? 'Nessuna carta da ripassare ora' : `Inizia il ripasso · ${totalDue} carte`}
        </button>
        <div class="cta-sub">${totalDue===0 ? 'Torna più tardi, oppure aggiungi nuove carte' : directionLabel(studyDirection) + ' · le più urgenti prima'}</div>
        ${lockedFreshCount(activeTagFilter) > 0 ? `
          <button class="ghost-btn" id="unlockMoreBtn" style="margin-top:10px;">Sblocca altre ${NEW_DAILY_LIMIT} carte nuove per oggi</button>
        ` : ''}
      `}
    `;

    $$('.dir-opt', main).forEach(btn=>{
      btn.addEventListener('click', ()=>{
        studyDirection = btn.dataset.dir;
        renderHome();
      });
    });
    $$('.tag-chip', main).forEach(btn=>{
      btn.addEventListener('click', ()=>{
        activeTagFilter = btn.dataset.tag;
        renderHome();
      });
    });
    const startBtn = $('#startBtn', main);
    if(startBtn) startBtn.addEventListener('click', startSession);
    const unlockBtn = $('#unlockMoreBtn', main);
    if(unlockBtn) unlockBtn.addEventListener('click', unlockMoreNew);

    $('#fabAdd').style.display = 'none';
  }

  function startSession(){
    const queue = buildQueue(studyDirection, activeTagFilter);
    if(queue.length === 0) return;
    session = { queue, idx:0, direction: studyDirection, total: queue.length };
    renderStudy();
  }

  /* ============ Rendering: STUDY ============ */
  function currentSessionItem(){
    if(!session) return null;
    return session.queue[session.idx];
  }

  function renderStudy(){
    if(studyKeyCleanup){ studyKeyCleanup(); studyKeyCleanup = null; }
    const main = $('#main');
    $('#fabAdd').style.display = 'none';

    if(!session || session.idx >= session.queue.length){
      const wasSession = !!session;
      session = null;
      if(wasSession){
        main.innerHTML = `
          <div class="session-done">
            <svg viewBox="0 0 24 24" fill="none" stroke="#82a978" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9"/></svg>
            <h2>Sessione completata</h2>
            <p>Ottimo lavoro. Torna quando le prossime carte saranno pronte.</p>
            <button class="cta" id="backHome">Torna alla home</button>
          </div>
        `;
        $('#backHome').addEventListener('click', ()=>{ registerStudyDay(); renderHome(); });
      } else {
        renderHome();
      }
      if(studyKeyCleanup){ studyKeyCleanup(); studyKeyCleanup = null; }
      return;
    }

    const item = currentSessionItem();
    const card = DATA.cards.find(c=>c.id===item.cardId);
    if(!card){ session.idx++; renderStudy(); return; }
    const dir = item.dir;
    const front = dir==='itEs' ? card.it : card.es;
    const back = dir==='itEs' ? card.es : card.it;
    const frontLang = dir==='itEs' ? 'it' : 'es';
    const backLang = dir==='itEs' ? 'es' : 'it';
    const frontLabel = frontLang==='it' ? 'ITALIANO' : 'ESPAÑOL';
    const backLabel = backLang==='it' ? 'ITALIANO' : 'ESPAÑOL';
    const pct = Math.round((session.idx/session.total)*100);

    if(prefs.typingMode){
      renderStudyTyping({ main, card, dir, front, back, frontLang, backLang, frontLabel, backLabel, pct });
      return;
    }

    main.innerHTML = `
      <div class="study-wrap">
        <div class="study-progress">
          <button class="exit-btn" id="exitSession">✕ Esci</button>
          <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>
          <span>${session.idx+1}/${session.total}</span>
        </div>

        <div class="flashcard-stage">
          <div class="swipe-stamp stamp-bad" id="stampBad">SBAGLIATA</div>
          <div class="swipe-stamp stamp-good" id="stampGood">GIUSTA</div>
          <div class="flashcard" id="flashcard">
            <div class="face front">
              <span class="lang-pill ${frontLang}">${frontLabel}</span>
              <button class="audio-btn" id="audioFront" title="Ascolta">${audioIconSvg()}</button>
              <div class="word">${escapeHtml(front)}</div>
              <span class="flip-hint">tocca per girare</span>
            </div>
            <div class="face back">
              <span class="lang-pill ${backLang}">${backLabel}</span>
              <button class="audio-btn" id="audioBack" title="Ascolta">${audioIconSvg()}</button>
              <div class="word">${escapeHtml(back)}</div>
              ${card.example ? `<div class="example">${escapeHtml(card.example)}</div>` : ''}
              ${card.note ? `<div class="note">${escapeHtml(card.note)}</div>` : ''}
            </div>
          </div>
        </div>

        <div class="swipe-hint"><b class="l">← scorri se sbagliata</b> &nbsp;·&nbsp; <b class="r">giusta →</b></div>

        <div class="rate-grid" id="rateGrid">
          <button class="rate-btn again" data-r="0">Ripeti<span class="k">10min</span></button>
          <button class="rate-btn hard" data-r="1">Difficile<span class="k">${fmtInterval(previewInterval(card,dir,1))}</span></button>
          <button class="rate-btn good" data-r="2">Bene<span class="k">${fmtInterval(previewInterval(card,dir,2))}</span></button>
          <button class="rate-btn easy" data-r="3">Facile<span class="k">${fmtInterval(previewInterval(card,dir,3))}</span></button>
        </div>
      </div>
    `;

    const fc = $('#flashcard');
    const rateGrid = $('#rateGrid');
    const stampGood = $('#stampGood');
    const stampBad = $('#stampBad');
    const SWIPE_THRESHOLD = 90;
    let drag = null;

    $('#audioFront').addEventListener('click', (e)=>{ e.stopPropagation(); speak(front, frontLang); });
    $('#audioBack').addEventListener('click', (e)=>{ e.stopPropagation(); speak(back, backLang); });

    function setFlipped(state){
      fc.classList.toggle('flipped', state);
      rateGrid.classList.toggle('show', state);
      if(state && prefs.tts) speak(back, backLang);
    }

    function onKey(e){
      if(!session) return;
      if(e.code === 'Space' || e.key === 'Enter'){
        e.preventDefault();
        setFlipped(!fc.classList.contains('flipped'));
      } else if(fc.classList.contains('flipped') && ['1','2','3','4'].includes(e.key)){
        rateCard(card, dir, parseInt(e.key,10)-1);
      }
    }
    document.addEventListener('keydown', onKey);
    studyKeyCleanup = ()=> document.removeEventListener('keydown', onKey);

    fc.addEventListener('pointerdown', (e)=>{
      drag = { startX:e.clientX, startY:e.clientY, dx:0, dragging:false, wasFlipped: fc.classList.contains('flipped') };
      try{ fc.setPointerCapture(e.pointerId); }catch(err){}
      fc.style.transition = 'none';
    });

    fc.addEventListener('pointermove', (e)=>{
      if(!drag) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if(!drag.dragging && Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      drag.dragging = true;
      drag.dx = dx;
      if(!drag.wasFlipped) return;
      fc.style.transform = `translateX(${dx}px) rotate(${dx*0.05}deg) rotateY(180deg)`;
      stampGood.style.opacity = Math.max(0, Math.min(1, dx/100));
      stampBad.style.opacity = Math.max(0, Math.min(1, -dx/100));
    });

    function endDrag(){
      if(!drag) return;
      fc.style.transition = '';
      const { dragging, dx, wasFlipped } = drag;
      drag = null;
      stampGood.style.opacity = 0;
      stampBad.style.opacity = 0;

      if(!dragging){
        setFlipped(!wasFlipped);
        return;
      }
      if(!wasFlipped){
        fc.style.transform = '';
        return;
      }
      if(Math.abs(dx) > SWIPE_THRESHOLD){
        const flyDir = dx > 0 ? 1 : -1;
        fc.style.pointerEvents = 'none';
        fc.style.transition = 'transform .35s ease, opacity .35s ease';
        fc.style.transform = `translateX(${flyDir*620}px) rotate(${flyDir*24}deg) rotateY(180deg)`;
        fc.style.opacity = '0';
        const rating = dx > 0 ? 2 : 0;
        setTimeout(()=> rateCard(card, dir, rating), 220);
      } else {
        fc.style.transform = 'rotateY(180deg)';
      }
    }
    fc.addEventListener('pointerup', endDrag);
    fc.addEventListener('pointercancel', endDrag);

    $('#exitSession').addEventListener('click', ()=>{
      if(studyKeyCleanup){ studyKeyCleanup(); studyKeyCleanup = null; }
      session = null;
      renderHome();
    });
    $$('.rate-btn', rateGrid).forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        rateCard(card, dir, parseInt(btn.dataset.r,10));
      });
    });
  }

  function normalizeAnswer(s){
    return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');
  }

  function levenshtein(a,b){
    const m = a.length, n = b.length;
    const dp = Array.from({length:m+1}, (_,i)=> [i, ...Array(n).fill(0)]);
    for(let j=0;j<=n;j++) dp[0][j]=j;
    for(let i=1;i<=m;i++){
      for(let j=1;j<=n;j++){
        dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
      }
    }
    return dp[m][n];
  }

  function renderStudyTyping({ main, card, dir, front, back, frontLang, backLang, frontLabel, backLabel, pct }){
    main.innerHTML = `
      <div class="study-wrap">
        <div class="study-progress">
          <button class="exit-btn" id="exitSession">✕ Esci</button>
          <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>
          <span>${session.idx+1}/${session.total}</span>
        </div>

        <div class="typing-card">
          <span class="lang-pill ${frontLang}">${frontLabel}</span>
          <button class="audio-btn" id="audioFront" title="Ascolta">${audioIconSvg()}</button>
          <div class="word">${escapeHtml(front)}</div>
          <div class="typing-sub">scrivi la traduzione in ${backLang==='it'?'italiano':'spagnolo'}</div>
          <input type="text" id="typingInput" class="typing-input" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="…">
          <button class="cta" id="checkBtn">Verifica</button>
          <div class="typing-result" id="typingResult"></div>
        </div>

        <div class="rate-grid" id="rateGrid">
          <button class="rate-btn again" data-r="0">Ripeti<span class="k">10min</span></button>
          <button class="rate-btn hard" data-r="1">Difficile<span class="k">${fmtInterval(previewInterval(card,dir,1))}</span></button>
          <button class="rate-btn good" data-r="2">Bene<span class="k">${fmtInterval(previewInterval(card,dir,2))}</span></button>
          <button class="rate-btn easy" data-r="3">Facile<span class="k">${fmtInterval(previewInterval(card,dir,3))}</span></button>
        </div>
      </div>
    `;

    const input = $('#typingInput');
    const resultEl = $('#typingResult');
    const rateGrid = $('#rateGrid');
    const checkBtn = $('#checkBtn');
    let checked = false;

    $('#audioFront').addEventListener('click', ()=> speak(front, frontLang));
    setTimeout(()=> input.focus(), 250);

    function doCheck(){
      if(checked) return;
      checked = true;
      const given = normalizeAnswer(input.value);
      const correctNorm = normalizeAnswer(back);
      const dist = levenshtein(given, correctNorm);
      const isExact = given === correctNorm && given.length > 0;
      const isClose = !isExact && given.length > 0 && dist <= Math.max(1, Math.floor(correctNorm.length*0.2));
      input.classList.add(isExact ? 'correct' : (isClose ? 'close' : 'wrong'));
      input.disabled = true;
      checkBtn.style.display = 'none';
      if(prefs.tts) speak(back, backLang);
      resultEl.innerHTML = `
        <div class="typing-verdict ${isExact?'ok':(isClose?'close':'bad')}">
          ${isExact ? 'Esatto ✓' : (isClose ? 'Quasi giusto' : 'Non corretto')}
        </div>
        <div class="typing-answer">Risposta: <b>${escapeHtml(back)}</b></div>
        ${card.example ? `<div class="example">${escapeHtml(card.example)}</div>` : ''}
        ${card.note ? `<div class="note">${escapeHtml(card.note)}</div>` : ''}
      `;
      rateGrid.classList.add('show');
      const suggested = isExact ? 2 : (isClose ? 1 : 0);
      const btn = rateGrid.querySelector(`.rate-btn[data-r="${suggested}"]`);
      if(btn) btn.classList.add('suggested');
    }

    checkBtn.addEventListener('click', doCheck);
    input.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') doCheck(); });

    function onKey(e){
      if(checked && ['1','2','3','4'].includes(e.key) && document.activeElement !== input){
        rateCard(card, dir, parseInt(e.key,10)-1);
      }
    }
    document.addEventListener('keydown', onKey);
    studyKeyCleanup = ()=> document.removeEventListener('keydown', onKey);

    $('#exitSession').addEventListener('click', ()=>{
      if(studyKeyCleanup){ studyKeyCleanup(); studyKeyCleanup = null; }
      session = null;
      renderHome();
    });
    $$('.rate-btn', rateGrid).forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.stopPropagation();
        if(!checked) return;
        rateCard(card, dir, parseInt(btn.dataset.r,10));
      });
    });
  }

  function previewInterval(card, dir, rating){
    const srs = getSrs(card, dir);
    return schedule(srs, rating).interval;
  }

  function rateCard(card, dir, rating){
    const wasNew = getSrs(card,dir).reps === 0;
    const newSrs = schedule(getSrs(card,dir), rating);
    if(dir==='itEs') card.srsItEs = newSrs; else card.srsEsIt = newSrs;
    if(wasNew){
      ensureDailyReset();
      DATA.newToday.count += 1;
    }
    logReview(rating);
    persist();

    if(rating === 0){
      const reinsertAt = Math.min(session.queue.length, session.idx + 3);
      session.queue.splice(reinsertAt, 0, { cardId: card.id, dir });
    }
    session.idx += 1;
    renderStudy();
  }

  function registerStudyDay(){
    const t = todayStr();
    if(DATA.streak.lastDate === t) return;
    const yesterday = new Date(Date.now() - DAY).toISOString().slice(0,10);
    if(DATA.streak.lastDate === yesterday){
      DATA.streak.count += 1;
    } else {
      DATA.streak.count = 1;
    }
    DATA.streak.lastDate = t;
    if(!DATA.streak.best || DATA.streak.count > DATA.streak.best) DATA.streak.best = DATA.streak.count;
    persist();
  }

  /* ============ Rendering: STATS ============ */
  function renderStats(){
    $('#fabAdd').style.display = 'none';
    const main = $('#main');
    const hist = DATA.history || {};

    const days = [];
    for(let i=13;i>=0;i--){
      const d = new Date(Date.now() - i*DAY);
      const key = d.toISOString().slice(0,10);
      const h = hist[key] || { reviews:0, correct:0 };
      days.push({ key, label: d.toLocaleDateString('it-IT',{weekday:'narrow'}), ...h });
    }
    const maxReviews = Math.max(1, ...days.map(d=>d.reviews));

    let totalReviews = 0, totalCorrect = 0;
    Object.values(hist).forEach(h=>{ totalReviews += h.reviews; totalCorrect += h.correct; });
    const accuracy = totalReviews ? Math.round((totalCorrect/totalReviews)*100) : 0;

    const MASTER_DAYS = 21;
    const mastered = DATA.cards.filter(c => c.srsItEs.interval >= MASTER_DAYS && c.srsEsIt.interval >= MASTER_DAYS).length;
    const learning = DATA.cards.filter(c => (c.srsItEs.reps>0 || c.srsEsIt.reps>0) && !(c.srsItEs.interval >= MASTER_DAYS && c.srsEsIt.interval >= MASTER_DAYS)).length;
    const untouched = DATA.cards.length - mastered - learning;

    main.innerHTML = `
      <div class="stat-grid">
        <div class="stat-cell"><div class="stat-num" style="color:var(--good)">${accuracy}%</div><div class="stat-label">Precisione totale</div></div>
        <div class="stat-cell"><div class="stat-num streak">${DATA.streak.best||0}</div><div class="stat-label">Miglior striscia</div></div>
        <div class="stat-cell"><div class="stat-num" style="color:var(--es)">${totalReviews}</div><div class="stat-label">Ripassi totali</div></div>
      </div>

      <div class="section-label">Ultimi 14 giorni</div>
      <div class="week-chart">
        ${days.map(d=>`
          <div class="week-bar-col">
            <div class="week-bar-track"><div class="week-bar-fill" style="height:${Math.round((d.reviews/maxReviews)*100)}%" title="${d.key}: ${d.reviews} ripassi"></div></div>
            <span class="week-bar-label">${d.label}</span>
          </div>
        `).join('')}
      </div>

      <div class="section-label">Stato del mazzo</div>
      <div class="mastery-bar">
        <div class="mastery-seg mastered" style="flex:${mastered||0.0001}" title="Consolidate: ${mastered}"></div>
        <div class="mastery-seg learning" style="flex:${learning||0.0001}" title="In apprendimento: ${learning}"></div>
        <div class="mastery-seg untouched" style="flex:${untouched||0.0001}" title="Non iniziate: ${untouched}"></div>
      </div>
      <div class="mastery-legend">
        <span><i class="dot mastered"></i>Consolidate · ${mastered}</span>
        <span><i class="dot learning"></i>In apprendimento · ${learning}</span>
        <span><i class="dot untouched"></i>Non iniziate · ${untouched}</span>
      </div>
    `;
  }

  /* ============ Rendering: LIBRARY ============ */
  function renderLibrary(){
    const main = $('#main');
    $('#fabAdd').style.display = 'flex';

    const q = libSearch.trim().toLowerCase();
    const tags = allTags();
    const cards = DATA.cards
      .filter(c => !q || c.it.toLowerCase().includes(q) || c.es.toLowerCase().includes(q) || (c.note||'').toLowerCase().includes(q) || (c.example||'').toLowerCase().includes(q) || (c.tags||[]).some(t=>t.toLowerCase().includes(q)))
      .filter(c => !libTagFilter || (c.tags||[]).includes(libTagFilter))
      .sort((a,b)=> b.createdAt - a.createdAt);

    main.innerHTML = `
      <div class="search-row">
        <input type="text" class="search-input" id="searchInput" placeholder="Cerca una parola..." value="${escapeAttr(libSearch)}">
      </div>
      ${tags.length ? `
        <div class="tag-chips" id="libTagChips">
          <button class="tag-chip ${libTagFilter===''?'active':''}" data-tag="">Tutte</button>
          ${tags.map(t=>`<button class="tag-chip ${libTagFilter===t?'active':''}" data-tag="${escapeAttr(t)}">${escapeHtml(t)}</button>`).join('')}
        </div>
      ` : ''}
      <div class="section-label">${cards.length} carte</div>
      <div id="cardList"></div>
      ${cards.length===0 ? `
        <div class="empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
          <p>${DATA.cards.length===0 ? 'Nessuna carta ancora. Tocca + per aggiungerne una.' : 'Nessun risultato per questa ricerca.'}</p>
        </div>
      ` : ''}
    `;

    const list = $('#cardList');
    cards.forEach(c => list.appendChild(renderCardRow(c)));

    $('#searchInput').addEventListener('input', (e)=>{
      libSearch = e.target.value;
      const pos = e.target.selectionStart;
      renderLibrary();
      const inp = $('#searchInput');
      inp.focus();
      inp.setSelectionRange(pos,pos);
    });
    $$('.tag-chip', main).forEach(btn=>{
      btn.addEventListener('click', ()=>{
        libTagFilter = btn.dataset.tag;
        renderLibrary();
      });
    });
  }

  function srsSummary(srs){
    if(srs.reps === 0) return 'nuova';
    return `${fmtInterval(srs.interval)}`;
  }

  function renderCardRow(card){
    const row = document.createElement('div');
    row.className = 'card-row';
    const expanded = expandedCardId === card.id;
    row.innerHTML = `
      <div class="card-row-main">
        <div class="card-row-words">
          <div class="word-pair">
            <span class="it">${escapeHtml(card.it)}</span>
            <span class="arrow">⇄</span>
            <span class="es">${escapeHtml(card.es)}</span>
          </div>
          ${card.note ? `<div class="card-note">${escapeHtml(card.note)}</div>` : ''}
          ${(card.tags&&card.tags.length) ? `<div class="card-row-tags">${card.tags.map(t=>`<span class="mini-tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
        </div>
        <div class="card-row-actions">
          <button class="icon-btn audio-btn-sm" title="Ascolta italiano" data-lang="it" data-text="${escapeAttr(card.it)}">${audioIconSvg()}</button>
          <button class="icon-btn edit-toggle" title="Modifica">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button class="icon-btn danger del-btn" title="Elimina">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-1 12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7"/></svg>
          </button>
        </div>
      </div>
      <div class="srs-meta">
        <span>IT→ES <b>${srsSummary(card.srsItEs)}</b></span>
        <span>ES→IT <b>${srsSummary(card.srsEsIt)}</b></span>
      </div>
      <div class="edit-form ${expanded?'show':''}">
        <div class="edit-form-row">
          <input type="text" class="edit-it" value="${escapeAttr(card.it)}" placeholder="Italiano">
          <input type="text" class="edit-es" value="${escapeAttr(card.es)}" placeholder="Spagnolo">
        </div>
        <textarea class="edit-note" placeholder="Nota (opzionale)">${escapeHtml(card.note||'')}</textarea>
        <textarea class="edit-example" placeholder="Frase d'esempio (opzionale)">${escapeHtml(card.example||'')}</textarea>
        <input type="text" class="edit-tags" value="${escapeAttr((card.tags||[]).join(', '))}" placeholder="Categorie separate da virgola">
        <div class="edit-form-actions">
          <button class="small-btn cancel cancel-edit">Annulla</button>
          <button class="small-btn reset reset-progress">Azzera progressi</button>
          <button class="small-btn save save-edit">Salva</button>
        </div>
      </div>
    `;

    row.querySelector('.audio-btn-sm').addEventListener('click', (e)=>{
      e.stopPropagation();
      speak(card.it, 'it');
    });

    row.querySelector('.edit-toggle').addEventListener('click', ()=>{
      expandedCardId = expanded ? null : card.id;
      renderLibrary();
    });
    row.querySelector('.cancel-edit').addEventListener('click', ()=>{
      expandedCardId = null;
      renderLibrary();
    });
    row.querySelector('.save-edit').addEventListener('click', ()=>{
      const it = row.querySelector('.edit-it').value.trim();
      const es = row.querySelector('.edit-es').value.trim();
      const note = row.querySelector('.edit-note').value.trim();
      const example = row.querySelector('.edit-example').value.trim();
      const tags = row.querySelector('.edit-tags').value.split(',').map(t=>t.trim()).filter(Boolean);
      if(!it || !es){ toast('Compila entrambe le parole'); return; }
      card.it = it; card.es = es; card.note = note; card.example = example; card.tags = tags;
      persist();
      expandedCardId = null;
      toast('Carta aggiornata');
      renderLibrary();
    });
    row.querySelector('.reset-progress').addEventListener('click', ()=>{
      card.srsItEs = NEW_SRS();
      card.srsEsIt = NEW_SRS();
      persist();
      toast('Progressi azzerati');
      renderLibrary();
    });

    const delBtn = row.querySelector('.del-btn');
    let confirming = false;
    delBtn.addEventListener('click', ()=>{
      if(!confirming){
        confirming = true;
        delBtn.style.color = 'var(--bad)';
        delBtn.innerHTML = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>`;
        delBtn.title = 'Conferma eliminazione';
        setTimeout(()=>{ confirming = false; }, 2500);
        return;
      }
      DATA.cards = DATA.cards.filter(c=>c.id !== card.id);
      persist();
      toast('Carta eliminata');
      renderLibrary();
    });

    return row;
  }

  /* ============ Add sheet ============ */
  function openSheet(id){
    if(document.activeElement) document.activeElement.blur();
    $$('.sheet').forEach(s=> s.id !== id && s.classList.remove('show'));
    $('#' + id).classList.add('show');
    $('#sheetBackdrop').classList.add('show');
    $('#sheetBackdrop').dataset.open = id;
  }
  function closeSheets(){
    $$('.sheet').forEach(s=>{
      s.classList.remove('show');
      s.style.transform = '';
    });
    const backdrop = $('#sheetBackdrop');
    if(backdrop){
      backdrop.classList.remove('show');
      backdrop.style.opacity = '';
    }
  }

  function setupDragToClose(){
    $$('.sheet').forEach(sheet=>{
      let startY = 0;
      let dragging = false;

      sheet.addEventListener('pointerdown', (e)=>{
        const isHandle = e.target.closest('.sheet-handle');
        const isInteractive = e.target.closest('input, textarea, button, a, label');
        if(!isHandle && (isInteractive || sheet.scrollTop > 0)) return;
        startY = e.clientY;
        dragging = true;
        sheet.style.transition = 'none';
        const backdrop = $('#sheetBackdrop');
        if(backdrop) backdrop.style.transition = 'none';
        try{ sheet.setPointerCapture(e.pointerId); }catch(err){}
      });

      sheet.addEventListener('pointermove', (e)=>{
        if(!dragging) return;
        const dy = e.clientY - startY;
        if(dy > 0){
          sheet.style.transform = `translateY(${dy}px)`;
          const backdrop = $('#sheetBackdrop');
          if(backdrop) backdrop.style.opacity = Math.max(0, 1 - (dy / 350));
        } else {
          sheet.style.transform = `translateY(0px)`;
          const backdrop = $('#sheetBackdrop');
          if(backdrop) backdrop.style.opacity = '1';
        }
      });

      const endDrag = (e)=>{
        if(!dragging) return;
        dragging = false;
        sheet.style.transition = '';
        const backdrop = $('#sheetBackdrop');
        if(backdrop) backdrop.style.transition = '';
        const dy = e.clientY - startY;
        if(dy > 120){
          closeSheets();
        } else {
          sheet.style.transform = '';
          if(backdrop) backdrop.style.opacity = '';
        }
      };

      sheet.addEventListener('pointerup', endDrag);
      sheet.addEventListener('pointercancel', endDrag);
    });
  }

  function openAddSheet(){
    $('#newIt').value=''; $('#newEs').value=''; $('#newNote').value=''; $('#newExample').value=''; $('#newTags').value='';
    openSheet('addSheet');
    setTimeout(()=>$('#newIt').focus(), 300);
  }

  function saveNewCard(){
    const it = $('#newIt').value.trim();
    const es = $('#newEs').value.trim();
    const note = $('#newNote').value.trim();
    const example = $('#newExample').value.trim();
    const tags = $('#newTags').value.split(',').map(t=>t.trim()).filter(Boolean);
    if(!it || !es){ toast('Inserisci entrambe le parole'); return; }
    DATA.cards.push({
      id: uid(), it, es, note, example, tags, createdAt: Date.now(),
      srsItEs: NEW_SRS(), srsEsIt: NEW_SRS()
    });
    persist();
    closeSheets();
    toast('Carta aggiunta');
    renderCurrentTab();
  }

  /* ============ Bulk add sheet ============ */
  function openBulkSheet(){
    $('#bulkText').value = '';
    openSheet('bulkSheet');
    setTimeout(()=>$('#bulkText').focus(), 300);
  }

  function saveBulkCards(){
    const lines = $('#bulkText').value.split('\n').map(l=>l.trim()).filter(Boolean);
    if(lines.length === 0){ toast('Incolla almeno una coppia'); return; }
    let added = 0;
    lines.forEach(line=>{
      const parts = line.split(';').map(p=>p.trim());
      if(parts.length < 2 || !parts[0] || !parts[1]) return;
      const [it, es, note] = parts;
      DATA.cards.push({
        id: uid(), it, es, note: note||'', example:'', tags: [], createdAt: Date.now(),
        srsItEs: NEW_SRS(), srsEsIt: NEW_SRS()
      });
      added++;
    });
    if(added === 0){ toast('Nessuna riga valida trovata (formato: it ; es)'); return; }
    persist();
    closeSheets();
    toast(`${added} cart${added===1?'a aggiunta':'e aggiunte'}`);
    renderCurrentTab();
  }

  /* ============ Settings sheet ============ */
  function openSettingsSheet(){
    $('#ghToken').value = gistConfig.token || '';
    $('#ghGistId').value = gistConfig.gistId || '';
    $('#autoSyncCheck').checked = gistConfig.autoSync !== false;
    $('#ttsCheck').checked = prefs.tts !== false;
    $('#typingModeCheck').checked = !!prefs.typingMode;
    updateSyncStatusLine();
    openSheet('settingsSheet');
    setTimeout(()=>$('#ghToken').focus(), 300);
  }

  /* ============ Backup export/import ============ */
  function exportBackup(){
    const blob = new Blob([JSON.stringify(DATA, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ponte-backup-${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Backup esportato');
  }

  function importBackup(file){
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const parsed = JSON.parse(reader.result);
        if(!parsed || !Array.isArray(parsed.cards)) throw new Error('formato non valido');
        parsed.cards.forEach(ensureCardShape);
        if(!parsed.history) parsed.history = {};
        DATA = parsed;
        persist();
        closeSheets();
        toast('Backup importato');
        renderCurrentTab();
      }catch(e){
        console.error(e);
        toast('File di backup non valido');
      }
    };
    reader.readAsText(file);
  }

  async function handleSaveSettings(){
    const token = $('#ghToken').value.trim();
    const gistId = $('#ghGistId').value.trim();
    const autoSync = $('#autoSyncCheck').checked;

    if(!token){
      gistConfig = { token:'', gistId:'', htmlUrl:'', autoSync:true };
      saveGistConfig(gistConfig);
      setSyncState('local');
      toast('Collegamento rimosso, resti in locale');
      return;
    }

    gistConfig.token = token;
    gistConfig.autoSync = autoSync;

    if(gistId){
      gistConfig.gistId = gistId;
      saveGistConfig(gistConfig);
      const ok = await pullFromGist(false);
      if(ok) toast('Collegato al Gist esistente');
      else toast('Token o ID del Gist non validi');
    } else {
      setSyncState('syncing');
      try{
        const { gistId: newId, htmlUrl } = await gistCreate(token, DATA);
        gistConfig.gistId = newId;
        gistConfig.htmlUrl = htmlUrl;
        gistConfig.lastSync = Date.now();
        saveGistConfig(gistConfig);
        $('#ghGistId').value = newId;
        setSyncState('synced');
        toast('Nuovo Gist creato e collegato');
      }catch(e){
        console.error(e);
        setSyncState('error');
        toast('Impossibile creare il Gist: controlla il token');
        return;
      }
    }
    updateSyncStatusLine();
  }

  function handleUnlink(){
    gistConfig = { token:'', gistId:'', htmlUrl:'', autoSync:true };
    saveGistConfig(gistConfig);
    $('#ghToken').value = '';
    $('#ghGistId').value = '';
    setSyncState('local');
    toast('Gist scollegato, resti in locale');
  }

  /* ============ Tab switching ============ */
  function switchTab(tab){
    activeTab = tab;
    session = null;
    $$('.tab-btn').forEach(b=> b.classList.toggle('active', b.dataset.tab===tab));
    renderCurrentTab();
  }

  /* ============ Init ============ */
  function init(){
    updateThemeIcon(document.documentElement.dataset.theme);
    applyTheme(loadTheme());

    DATA = loadLocalDeck() || defaultData();
    if(!loadLocalDeck()) saveLocalDeck(DATA);

    $$('.tab-btn').forEach(btn=>{
      btn.addEventListener('click', ()=> switchTab(btn.dataset.tab));
    });
    $('#fabAdd').addEventListener('click', openAddSheet);
    $('#cancelAdd').addEventListener('click', closeSheets);
    $('#saveAdd').addEventListener('click', saveNewCard);
    $('#sheetBackdrop').addEventListener('click', closeSheets);
    $('#themeToggle').addEventListener('click', toggleTheme);
    $('#settingsToggle').addEventListener('click', openSettingsSheet);
    $('#closeSettings').addEventListener('click', closeSheets);
    $('#saveSettings').addEventListener('click', handleSaveSettings);
    $('#pullNow').addEventListener('click', ()=> pullFromGist(true));
    $('#pushNow').addEventListener('click', async ()=>{
      setSyncState('syncing');
      try{ await gistUpdate(gistConfig.gistId, gistConfig.token, DATA); gistConfig.lastSync = Date.now(); saveGistConfig(gistConfig); setSyncState('synced'); toast('Carte caricate sul Gist'); }
      catch(e){ console.error(e); setSyncState('error'); toast('Caricamento sul Gist fallito'); }
    });
    $('#unlinkGist').addEventListener('click', handleUnlink);

    $('#openBulkAdd').addEventListener('click', openBulkSheet);
    $('#cancelBulk').addEventListener('click', closeSheets);
    $('#saveBulk').addEventListener('click', saveBulkCards);

    $('#ttsCheck').addEventListener('change', (e)=>{ prefs.tts = e.target.checked; savePrefs(); });
    $('#typingModeCheck').addEventListener('change', (e)=>{ prefs.typingMode = e.target.checked; savePrefs(); });
    $('#exportBackup').addEventListener('click', exportBackup);
    $('#importBackupInput').addEventListener('change', (e)=>{
      const file = e.target.files && e.target.files[0];
      if(file) importBackup(file);
      e.target.value = '';
    });

    setSyncState(gistConfig.token && gistConfig.gistId ? 'local' : 'local');
    setupDragToClose();
    renderHome();

    if(gistConfig.token && gistConfig.gistId){
      pullFromGist(false);
    }
  }

  init();
})();
