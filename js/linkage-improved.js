// --- START OF FILE linkageimproved.js ---
// --- Version 3.5.1: Fixed Connection Issues ---
// Changes from v3.5:
// 1. Improved style handling for connection visualization
// 2. Added more detailed logging for connection debugging
// 3. Added fallback event triggering for connection detection
// 4. Fixed position calculation bugs for accurate snapping

(function() {
  // משתנים גלובליים במודול
  let currentDraggedBlock = null;
  let potentialSnapTarget = null; // Stores the candidate target identified during move
  let snapDirection = null; // Stores the candidate direction identified during move
  let isDraggingBlock = false;
  let dragOffset = { x: 0, y: 0 };
  let futureIndicator = null;
  let snapSound = null;
  let audioContextAllowed = false;
  let soundInitialized = false;

  // קונפיגורציה - פרמטרים שניתן להתאים
  const CONFIG = {
    PIN_WIDTH: 5,
    CONNECT_THRESHOLD: 8, // סף להפעלת הדגשה וזיהוי יעד פוטנציאלי (8px)
    VERTICAL_ALIGN_THRESHOLD: 20,
    VERTICAL_OVERLAP_REQ: 0.4, // דרישה ל-40% חפיפה אנכית לפחות
    BLOCK_GAP: 0, // אין רווח - חיבור שקע-תקע
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3', // ודא שהנתיב נכון
    DEBUG: true // Set to false for production
  };

  // ========================================================================
  // הוספת סגנונות CSS - הילה צהובה, מחוון כחול (עם תיקונים)
  // ========================================================================
  function addHighlightStyles() {
    // בדוק אם הסגנונות כבר קיימים
    if (document.getElementById('block-connection-styles')) {
      if (CONFIG.DEBUG) console.log('Styles already exist - ensuring they are properly applied');
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'block-connection-styles';
    style.textContent = `
      .snap-source { box-shadow: 0 5px 15px rgba(0,0,0,0.4) !important; transition: box-shadow 0.15s ease-out; cursor: grabbing !important; z-index: 1001 !important; }
      .snap-target { outline: 6px solid #FFC107 !important; outline-offset: 4px; box-shadow: 0 0 20px 8px rgba(255,193,7,0.8) !important; transition: outline 0.1s ease-out, box-shadow 0.1s ease-out; z-index: 999 !important; }
      .future-position-indicator { position: absolute; border: 3px dashed rgba(0,120,255,0.95) !important; border-radius: 5px; background-color: rgba(0,120,255,0.15) !important; pointer-events: none; z-index: 998; opacity: 0; transition: opacity 0.15s ease-out, left 0.05s linear, top 0.05s linear; display: none; }
      .future-position-indicator.visible { display: block; opacity: 0.9; }
      .snap-target.snap-left::before { content:''; position:absolute; left:-10px; top:10%; bottom:10%; width:8px; background-color:#FFC107; border-radius:2px; z-index:1000; box-shadow:0 0 10px 2px rgba(255,193,7,0.8); transition:all 0.1s ease-out; }
      .snap-target.snap-right::after { content:''; position:absolute; right:-10px; top:10%; bottom:10%; width:8px; background-color:#FFC107; border-radius:2px; z-index:1000; box-shadow:0 0 10px 2px rgba(255,193,7,0.8); transition:all 0.1s ease-out; }
      @keyframes snapEffect { 0%{transform:scale(1)} 35%{transform:scale(1.05)} 70%{transform:scale(0.98)} 100%{transform:scale(1)} } .snap-animation { animation:snapEffect 0.3s ease-out; }
      @keyframes detachEffect { 0%{transform:translate(0,0) rotate(0)} 30%{transform:translate(3px,1px) rotate(0.8deg)} 60%{transform:translate(-2px,2px) rotate(-0.5deg)} 100%{transform:translate(0,0) rotate(0)} } .detach-animation { animation:detachEffect 0.3s ease-in-out; }
      #detach-menu { position:absolute; background-color:white; border:1px solid #ccc; border-radius:4px; box-shadow:0 3px 8px rgba(0,0,0,0.2); z-index:1100; padding:5px; font-size:14px; min-width:100px; } #detach-menu div { padding:6px 12px; cursor:pointer; border-radius:3px; } #detach-menu div:hover { background-color:#eee; }
      body.user-select-none { user-select:none; -webkit-user-select:none; -moz-user-select:none; -ms-user-select:none; }
      .connected-block { outline: 2px solid rgba(76, 175, 80, 0.6) !important; outline-offset: 2px; }
      .has-connected-block { outline: 2px solid rgba(33, 150, 243, 0.6) !important; outline-offset: 2px; }
      #sound-test-button { position:fixed; bottom:15px; right:15px; padding:8px 12px; background-color:#2196F3; color:white; border:none; border-radius:4px; cursor:pointer; z-index:9999; font-family:Arial,sans-serif; font-size:14px; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.2); transition:background-color .2s,opacity .5s ease-out; opacity:1; } #sound-test-button:hover { background-color:#0b7dda; } #sound-test-button.success { background-color:#4CAF50; } #sound-test-button.error { background-color:#f44336; } #sound-test-button.loading { background-color:#ff9800; cursor:wait; } #sound-test-button.hidden { opacity:0; pointer-events:none; }
    `;
    
    // וודא שהסגנונות נוספים לראש המסמך
    document.head.appendChild(style);
    
    // בדוק אם הסגנונות התווספו כמצופה
    if (CONFIG.DEBUG) {
      console.log('Styles added successfully (Yellow Halo, Blue Indicator)');
      const appliedStyle = document.getElementById('block-connection-styles');
      if (appliedStyle) {
        console.log('Connection styles verified in DOM');
      } else {
        console.error('Connection styles missing from DOM after append!');
      }
    }
  }

  // ========================================================================
  // אתחול אודיו, כפתור בדיקה, נגינת צליל - ללא שינוי מ-v3.4
  // ========================================================================
  function initAudio() { if (!CONFIG.PLAY_SOUND || soundInitialized) return; try { const el=document.getElementById('snap-sound-element'); if(el){snapSound=el;soundInitialized=true;if(CONFIG.DEBUG)console.log('Audio reused.');if(!el.querySelector(`source[src="${CONFIG.SOUND_PATH}"]`)){el.innerHTML='';const s=document.createElement('source');s.src=CONFIG.SOUND_PATH;s.type='audio/mpeg';el.appendChild(s);el.load();}return;} snapSound=document.createElement('audio');snapSound.id='snap-sound-element';snapSound.preload='auto';snapSound.volume=CONFIG.SOUND_VOLUME;const s=document.createElement('source');s.src=CONFIG.SOUND_PATH;s.type='audio/mpeg';snapSound.appendChild(s);snapSound.addEventListener('error',(e)=>{console.error(`Audio Error: ${CONFIG.SOUND_PATH}`,e);const b=document.getElementById('sound-test-button');if(b){b.textContent='שגיאה';b.className='error';b.disabled=true;}CONFIG.PLAY_SOUND=false;snapSound=null;soundInitialized=false;});snapSound.addEventListener('canplaythrough',()=>{soundInitialized=true;if(CONFIG.DEBUG)console.log('Audio ready.');const b=document.getElementById('sound-test-button');if(b?.classList.contains('loading')){b.textContent='בדוק';b.classList.remove('loading');b.disabled=false;}});snapSound.style.display='none';document.body.appendChild(snapSound);if(CONFIG.DEBUG)console.log(`Audio created: ${CONFIG.SOUND_PATH}`);}catch(err){console.error('Audio init error:',err);CONFIG.PLAY_SOUND=false;snapSound=null;soundInitialized=false;}}
  function addSoundTestButton() { if(!CONFIG.PLAY_SOUND)return;try{const eb=document.getElementById('sound-test-button');if(eb)eb.remove();const b=document.createElement('button');b.id='sound-test-button';b.title='בדוק צליל';b.className='';if(!snapSound){b.textContent='שמע נכשל';b.classList.add('error');b.disabled=true;}else if(!soundInitialized){b.textContent='טוען...';b.classList.add('loading');b.disabled=true;}else{b.textContent='בדוק';b.disabled=false;}Object.assign(b.style,{position:'fixed',bottom:'15px',right:'15px',zIndex:'9999',padding:'8px 12px',color:'white',border:'none',borderRadius:'4px',cursor:'pointer',boxShadow:'0 2px 5px rgba(0,0,0,0.2)',fontFamily:'Arial,sans-serif',fontSize:'14px',fontWeight:'bold',transition:'background-color .2s,opacity .5s ease-out',opacity:'1'});b.onmouseover=function(){if(!this.disabled&&!this.classList.contains('success')&&!this.classList.contains('error'))this.style.backgroundColor='#0b7dda'};b.onmouseout=function(){if(!this.disabled&&!this.classList.contains('success')&&!this.classList.contains('error'))this.style.backgroundColor='#2196F3'};b.addEventListener('click',function(){if(this.disabled||!snapSound||!soundInitialized)return;snapSound.play().then(()=>{b.textContent='פועל ✓';b.classList.add('success');audioContextAllowed=true;setTimeout(()=>{b.classList.add('hidden');setTimeout(()=>b.remove(),500)},3000);if(snapSound){snapSound.pause();snapSound.currentTime=0;}}).catch(err=>{console.warn('Sound test fail:',err.name);if(err.name==='NotAllowedError'){b.textContent='חסום-לחץ';b.classList.add('error');audioContextAllowed=false;}else{b.textContent='שגיאה';b.classList.add('error');b.disabled=true;}});});document.body.appendChild(b);if(CONFIG.DEBUG)console.log('Sound test button added.');}catch(err){console.error('Err adding sound btn:',err);}}
  function playSnapSound() { if(!CONFIG.PLAY_SOUND||!snapSound||!soundInitialized)return;if(!audioContextAllowed&&CONFIG.DEBUG)console.warn('Playing sound before user interaction.');try{if(snapSound.readyState<3){if(CONFIG.DEBUG)console.log('Snap sound skip: audio not ready.');return;}snapSound.pause();snapSound.currentTime=0;const pp=snapSound.play();if(pp!==undefined){pp.then(()=>{audioContextAllowed=true;if(CONFIG.DEBUG>1)console.log('Snap sound played.');}).catch(err=>{if(err.name==='NotAllowedError'){console.warn('Snap sound blocked.');audioContextAllowed=false;if(!document.getElementById('sound-test-button'))addSoundTestButton();}else if(err.name!=='AbortError'){console.error('Err play snap sound:',err);}});}}catch(err){console.error('Unexpected play sound err:',err);}}

  // ========================================================================
  // מאזינים, זיהוי בלוקים, קליק ימני, MouseDown - עם תיקונים לזיהוי בלוקים
  // ========================================================================
  function initProgrammingAreaListeners() { 
    const a = document.getElementById('program-blocks');
    if (!a) {
      if (CONFIG.DEBUG) console.error('Programming area not found! Missing element #program-blocks');
      return;
    }
    
    // תיקון: וודא שאין גרירה מובנית של הדפדפן
    a.addEventListener('dragover', (e) => e.preventDefault());
    a.addEventListener('dragstart', (e) => {
      if (e.target?.closest?.('#program-blocks .block-container')) {
        e.preventDefault();
        if (CONFIG.DEBUG > 1) console.log('Prevented browser default drag for block');
      }
    });
    
    if (CONFIG.DEBUG) console.log('Programming area listeners initialized');
  }
  
  function observeNewBlocks() { 
    const a = document.getElementById('program-blocks');
    if (!a) {
      if (CONFIG.DEBUG) console.error('Programming area not found for block observation!');
      return;
    }
    
    // שימוש ב-MutationObserver לזיהוי בלוקים חדשים
    const o = new MutationObserver((mutations) => {
      mutations.forEach((mu) => {
        if (mu.type === 'childList') {
          mu.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // אלמנט DOM
              let block = node.classList?.contains('block-container') ? node : node.querySelector?.('.block-container');
              if (block?.closest('#program-blocks')) {
                if (!block.id) generateUniqueId(block);
                addBlockDragListeners(block);
                if (CONFIG.DEBUG > 1) console.log(`Added listeners to new block: ${block.id}`);
              }
            }
          });
        }
      });
    });
    
    // עקוב אחרי שינויים באזור התכנות
    o.observe(a, { childList: true, subtree: true });
    
    if (CONFIG.DEBUG) console.log("MutationObserver watching for new blocks.");
  }
