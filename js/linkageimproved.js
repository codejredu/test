 // --- LINKAGE-IMPROVED.JS v3.9.2: CRITICAL VISIBILITY FIX & DUAL FINE-TUNING ---
// שינויים בגרסה זו:
// 1. תיקון קריטי לבעיית נראות עיגולי החיבור - שימוש ב-!important לכל תכונות הסגנון
// 2. הגדלה משמעותית של גודל העיגולים והבלטתם עם גבול לבן והילה חזקה
// 3. שימוש הן בקלאס והן בסגנון ישיר להבטחת נראות העיגולים
// 4. תמיכה בכוונון עדין נפרד לחיבור שמאלי וימני לתיקון בעיית הרווח
// 5. פונקציית בדיקה מתקדמת לאיתור בעיות נראות
// 6. עדכון ושיפור הלוגים לדיבאג

(function() {
  // משתנים גלובליים במודול
  let currentDraggedBlock = null;
  let potentialSnapTarget = null;
  let snapDirection = null;
  let isDraggingBlock = false;
  let dragOffset = { x: 0, y: 0 };
  let futureIndicator = null; // Note: Declared but not used
  let snapSound = null;
  let audioContextAllowed = false;
  let soundInitialized = false;

  // קונפיגורציה - פרמטרים עם תמיכה בכוונון עדין נפרד
  const CONFIG = {
    CONNECT_THRESHOLD: 40, // הוגדל ל-40 כדי להקל עוד יותר על זיהוי החיבור
    VERTICAL_ALIGN_THRESHOLD: 20, // Note: Declared but not used
    VERTICAL_OVERLAP_REQ: 0.4, // דרישה ל-40% חפיפה אנכית לפחות
    BLOCK_GAP: 0, // Note: Declared but not used
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3',
    DEBUG: true, // Set to false for production
    HIGHLIGHT_COLOR_RIGHT: '#FF9800', // כתום לצד ימין (בליטה) - צבע בולט יותר
    HIGHLIGHT_COLOR_LEFT: '#2196F3', // כחול לצד שמאל (שקע)
    HIGHLIGHT_OPACITY: 0.8, // Note: Declared but not used directly for points

    // ערכי היסט קבועים לחיבור פאזל מדויק
    PUZZLE_RIGHT_BULGE_WIDTH: 10, 
    PUZZLE_LEFT_SOCKET_WIDTH: 10,
    VERTICAL_CENTER_OFFSET: 0,
    
    // כוונון עדין לפי כיוון החיבור
    HORIZONTAL_FINE_TUNING_LEFT: -9,  // כוונון עדין כשמחברים בלוק לצד שמאל של בלוק אחר (שקע אל פין)
    HORIZONTAL_FINE_TUNING_RIGHT: 5   // כוונון עדין כשמחברים בלוק לצד ימין של בלוק אחר (סוגר רווח בחיבור פין אל שקע)
  }

  // ========================================================================
  // פונקציה חדשה - בדיקת נראות נקודות החיבור
  // ========================================================================
  function testConnectionPointsVisibility() {
    // מצא את הבלוק הראשון במתחם התכנות
    const blocks = document.querySelectorAll('#program-blocks .block-container');
    if (blocks.length === 0) {
      console.warn("No blocks found to test connection points");
      return;
    }
    
    const testBlock = blocks[0];
    if (!testBlock.id) generateUniqueId(testBlock);
    
    console.log("=== TESTING CONNECTION POINTS VISIBILITY ===");
    console.log("Test block ID:", testBlock.id);
    
    // ודא שיש נקודות חיבור
    addConnectionPoints(testBlock);
    
    // מצא את הנקודות
    const rightPoint = testBlock.querySelector('.right-connection-point');
    const leftPoint = testBlock.querySelector('.left-connection-point');
    
    if (!rightPoint || !leftPoint) {
      console.error("Failed to create connection points!");
      return;
    }
    
    console.log("Connection points created successfully");
    console.log("Right point styles:", {
      width: rightPoint.style.width || "not set",
      height: rightPoint.style.height || "not set",
      opacity: rightPoint.style.opacity || "not set",
      zIndex: rightPoint.style.zIndex || "not set",
      computed: {
        opacity: window.getComputedStyle(rightPoint).opacity,
        width: window.getComputedStyle(rightPoint).width,
        zIndex: window.getComputedStyle(rightPoint).zIndex
      }
    });
    
    // בדוק הדגשה בצורה ישירה
    console.log("Testing highlight...");
    rightPoint.classList.add('connection-point-visible');
    rightPoint.style.opacity = '1';
    
    setTimeout(() => {
      console.log("Right point after highlight:", {
        hasClass: rightPoint.classList.contains('connection-point-visible'),
        opacity: rightPoint.style.opacity,
        computed: {
          opacity: window.getComputedStyle(rightPoint).opacity,
          width: window.getComputedStyle(rightPoint).width
        }
      });
      
      // נקה אחרי הבדיקה
      setTimeout(() => {
        rightPoint.classList.remove('connection-point-visible');
        rightPoint.style.opacity = '';
      }, 2000);
    }, 100);
  }

  // ========================================================================
  // אתחול המערכת כולה - משופר עם וידוא תקינות חיווי
  // ========================================================================
  function initializeSystem() {
    const initFlag = 'blockLinkageInitialized_v3_9_2_CriticalVisibilityFix'; // Updated version flag
    if (window[initFlag]) {
        if (CONFIG.DEBUG) console.log("Block linkage system v3.9.2 (Critical Visibility Fix) already initialized. Skipping.");
        return;
    }

    addHighlightStyles(); // Adds styles with !important for all properties
    initAudio();
    initProgrammingAreaListeners();
    observeNewBlocks();
    initExistingBlocks();
    initGlobalMouseListeners();

    if (CONFIG.PLAY_SOUND) {
      addSoundTestButton();
    }

    // הוספת נקודות חיבור לכל הבלוקים הקיימים באתחול
    document.querySelectorAll('#program-blocks .block-container').forEach(block => {
      addConnectionPoints(block);
    });

    // בדיקה שהסגנונות אכן הוטענו
    if (!document.getElementById('block-connection-styles-enhanced-v3-9-2')) {
      console.warn("Enhanced connection styles were not loaded properly. Re-adding...");
      addHighlightStyles();
    }
    
    // בדיקת נראות נקודות החיבור
    if (CONFIG.DEBUG) {
      setTimeout(testConnectionPointsVisibility, 1000);
    }

    window[initFlag] = true;
    console.log(`Block linkage system initialized (Version 3.9.2 - Critical Visibility Fix)`);
    console.log(`Configuration: CONNECT_THRESHOLD=${CONFIG.CONNECT_THRESHOLD}px, Right Fine-tuning=${CONFIG.HORIZONTAL_FINE_TUNING_RIGHT}px, Left Fine-tuning=${CONFIG.HORIZONTAL_FINE_TUNING_LEFT}px`);
    console.log('Enhanced connection points: larger size (20px), higher z-index (9999), white border and stronger glow');
  }

  // הפעל את האתחול
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
    initializeSystem(); // DOM already loaded
  }

})(); // סוף IIFE

// --- END OF FILE linkageimproved.js v3.9.2 ---
  
  // ========================================================================
  // פונקציות ניתוק, תפריט, אנימציה, יצירת מזהה
  // ========================================================================
  function showDetachMenu(x, y, b) {
    removeDetachMenu();
    const m = document.createElement('div');
    m.id = 'detach-menu';
    m.style.left = `${x}px`;
    m.style.top = `${y}px`;
    const o = document.createElement('div');
    o.textContent = 'נתק בלוק';
    o.onclick = (e) => {
      e.stopPropagation();
      detachBlock(b, true);
      removeDetachMenu();
    };
    m.appendChild(o);
    document.body.appendChild(m);
    setTimeout(() => {
      document.addEventListener('click', closeMenuOutside, {capture: true, once: true});
      window.addEventListener('scroll', removeDetachMenu, {capture: true, once: true});
    }, 0);
  }

  function closeMenuOutside(e) {
    const m = document.getElementById('detach-menu');
    if (m && !m.contains(e.target)) {
      removeDetachMenu();
    } else if (m) {
      setTimeout(() => document.addEventListener('click', closeMenuOutside, {capture: true, once: true}), 0);
    }
    if (m) window.removeEventListener('scroll', removeDetachMenu, {capture: true});
  }

  function removeDetachMenu() {
    const m = document.getElementById('detach-menu');
    if (m) {
      document.removeEventListener('click', closeMenuOutside, {capture: true});
      window.removeEventListener('scroll', removeDetachMenu, {capture: true});
      m.remove();
    }
  }

  function detachBlock(btd, animate=true) {
    if (!btd || !btd.hasAttribute('data-connected-to')) return;

    const tid = btd.getAttribute('data-connected-to');
    const dir = btd.getAttribute('data-connection-direction');

    if (!tid || !dir) {
      console.warn(`[Detach] Missing data on ${btd.id}. Cleaning attributes.`);
      btd.removeAttribute('data-connected-to');
      btd.removeAttribute('data-connection-direction');
      btd.classList.remove('connected-block');
      btd.draggable = true;
      return;
    }

    if (CONFIG.DEBUG) console.log(`[Detach] Detaching ${btd.id} from ${tid}`);

    btd.removeAttribute('data-connected-to');
    btd.removeAttribute('data-connection-direction');
    btd.classList.remove('connected-block');
    btd.draggable = true;

    // Clear potential lingering highlights on detach
    clearAllHighlights(); // Ensures points are hidden after detach

    const tb = document.getElementById(tid);
    if (tb) {
      tb.removeAttribute(dir === 'left' ? 'data-connected-from-left' : 'data-connected-from-right');
      const isStillConnected = tb.hasAttribute('data-connected-from-left') ||
                               tb.hasAttribute('data-connected-from-right') ||
                               tb.hasAttribute('data-connected-to');
      if (!isStillConnected) {
          tb.classList.remove('has-connected-block');
      }
    } else {
      console.warn(`[Detach] Target block with ID ${tid} not found.`);
    }

    if (animate) addDetachEffectAnimation(btd);

    if (CONFIG.DEBUG) console.log(`[Detach] Finished detaching ${btd.id}. Draggable: ${btd.draggable}`);
  }

  function addSnapEffectAnimation(b) {
    b.classList.remove('snap-animation');
    void b.offsetWidth;
    b.classList.add('snap-animation');
    b.addEventListener('animationend', () => b.classList.remove('snap-animation'), {once: true});
  }

  function addDetachEffectAnimation(b) {
    b.classList.remove('detach-animation');
    void b.offsetWidth;
    b.classList.add('detach-animation');
    b.addEventListener('animationend', () => b.classList.remove('detach-animation'), {once: true});
  }

  function generateUniqueId(b) {
    if (b.id) return b.id;
    const p = b.dataset.type || 'block';
    let s = Math.random().toString(36).substring(2, 8);
    let id = `${p}-${s}`;
    let i = 0;
    while (document.getElementById(id) && i < 10) {
      s = Math.random().toString(36).substring(2, 8);
      id = `${p}-${s}-${i++}`;
    }
    if (document.getElementById(id)) {
         id = `${p}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    }
    b.id = id;
    if (CONFIG.DEBUG) console.log(`Generated ID: ${id} for block.`);
    return id;
  }

  // ========================================================================
  // טיפול בשחרור העכבר (MouseUp) - עם קריאה ל-clearAllHighlights
  // ========================================================================
  function handleMouseUp(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    const blockReleased = currentDraggedBlock;
    const candidateTarget = potentialSnapTarget;
    const candidateDirection = snapDirection;

    if (CONFIG.DEBUG) console.log(`[MouseUp] Releasing block ${blockReleased.id}. Candidate: ${candidateTarget?.id || 'none'}, direction: ${candidateDirection || 'none'}`);

    // ניקוי מצב הגרירה וההדגשות הראשוניות (מהמיקום האחרון של הגרירה)
    isDraggingBlock = false;
    currentDraggedBlock = null;
    potentialSnapTarget = null;
    snapDirection = null;
    document.body.classList.remove('user-select-none');
    blockReleased.classList.remove('snap-source');
    blockReleased.style.zIndex = '';

    // ניקוי ראשוני של נקודות החיבור שהודגשו ב-MouseMove האחרון
    clearAllHighlights();

    // החלטה על הצמדה
    let performSnap = false;
    if (candidateTarget && candidateDirection && document.body.contains(candidateTarget)) {
        if (CONFIG.DEBUG) console.log(`[MouseUp] Candidate target ${candidateTarget.id} identified during drag. Attempting snap.`);
        performSnap = true;
    } else {
        if (CONFIG.DEBUG) console.log(`[MouseUp] No valid candidate target identified during drag. No snap attempt.`);
    }

    // בצע את ההצמדה אם הוחלט כך
    if (performSnap) {
      const snapSuccess = performBlockSnap(blockReleased, candidateTarget, candidateDirection);

      // *** התיקון כאן: ודא שההדגשות מנוקות *לאחר* ניסיון ההצמדה ***
      // זה קורה אחרי שהצליל מתנגן בתוך performBlockSnap (אם הצליח)
      clearAllHighlights(); // Ensure points are hidden immediately after snap attempt/success

      if (!snapSuccess) {
          blockReleased.draggable = true;
          if (CONFIG.DEBUG) console.log(`[MouseUp] Snap attempt failed. Block ${blockReleased.id} remains draggable.`);
      } else {
           if (CONFIG.DEBUG) console.log(`[MouseUp] Snap successful. Block ${blockReleased.id} is connected.`);
      }
    } else {
      // אם לא בוצעה הצמדה, הבלוק נשאר חופשי וההדגשות כבר נוקו למעלה
      if (CONFIG.DEBUG) console.log(`[MouseUp] No snap performed. Block ${blockReleased.id} remains free.`);
      blockReleased.draggable = true;
    }
  };

  // ========================================================================
  // הוספת סגנונות CSS - תיקון קריטי עם !important לכל הפרמטרים
  // ========================================================================
  function addHighlightStyles() {
    // הסר כל סגנון קודם אם קיים
    const oldStyle = document.getElementById('block-connection-styles');
    if (oldStyle) oldStyle.remove();
    
    // צור סגנון חדש עם ID אחר למניעת התנגשויות
    const style = document.createElement('style');
    style.id = 'block-connection-styles-enhanced-v3-9-2';
    style.textContent = `
      .snap-source {
        box-shadow: 0 5px 15px rgba(0,0,0,0.4) !important;
        cursor: grabbing !important;
        z-index: 1001 !important;
      }

      /* נקודות חיבור - צד ימין (בליטה) - משופר עם !important לכל תכונה */
      .right-connection-point {
        position: absolute !important;
        width: 20px !important;      /* הגדלה משמעותית */
        height: 20px !important;     /* הגדלה משמעותית */
        top: 50% !important;
        right: -10px !important;     /* מותאם לגודל החדש */
        transform: translateY(-50%) !important;
        background-color: ${CONFIG.HIGHLIGHT_COLOR_RIGHT} !important;
        border-radius: 50% !important;
        opacity: 0;
        transition: opacity 0.1s ease-out !important;
        pointer-events: none !important;
        z-index: 9999 !important;    /* z-index גבוה מאוד */
        box-shadow: 0 0 10px 4px rgba(255,152,0,0.95) !important; /* הילה חזקה מאוד */
        border: 2px solid #FFF !important; /* גבול לבן להבלטה */
      }

      /* נקודות חיבור - צד שמאל (שקע) - משופר עם !important לכל תכונה */
      .left-connection-point {
        position: absolute !important;
        width: 20px !important;      /* הגדלה משמעותית */
        height: 20px !important;     /* הגדלה משמעותית */
        top: 50% !important;
        left: -10px !important;      /* מותאם לגודל החדש */
        transform: translateY(-50%) !important;
        background-color: ${CONFIG.HIGHLIGHT_COLOR_LEFT} !important;
        border-radius: 50% !important;
        opacity: 0;
        transition: opacity 0.1s ease-out !important;
        pointer-events: none !important;
        z-index: 9999 !important;    /* z-index גבוה מאוד */
        box-shadow: 0 0 10px 4px rgba(33,150,243,0.95) !important; /* הילה חזקה מאוד */
        border: 2px solid #FFF !important; /* גבול לבן להבלטה */
      }

      /* הדגשה נראית - שופר עם !important והגדלת האופקיות */
      .connection-point-visible {
        opacity: 1 !important;
        animation: pulseConnectionPoint 0.5s infinite !important;
      }

      /* אנימציית פעימה משופרת - גדולה יותר ומהירה יותר */
      @keyframes pulseConnectionPoint {
        0% { transform: translateY(-50%) scale(1) !important; }
        50% { transform: translateY(-50%) scale(1.5) !important; } /* גדילה משמעותית */
        100% { transform: translateY(-50%) scale(1) !important; }
      }

      /* תצוגת עזר לאיזור חיבור (לא בשימוש כרגע) */
      .connection-area {
        position: absolute;
        background-color: rgba(255,0,0,0.2);
        pointer-events: none;
        z-index: 900;
        display: none;
      }

      .connection-area.visible {
        display: block;
      }

      /* אנימציות חיבור וניתוק */
      @keyframes snapEffect { 0%{transform:scale(1)} 35%{transform:scale(1.05)} 70%{transform:scale(0.98)} 100%{transform:scale(1)} }
      .snap-animation { animation:snapEffect 0.3s ease-out; }

      @keyframes detachEffect { 0%{transform:translate(0,0) rotate(0)} 30%{transform:translate(3px,1px) rotate(0.8deg)} 60%{transform:translate(-2px,2px) rotate(-0.5deg)} 100%{transform:translate(0,0) rotate(0)} }
      .detach-animation { animation:detachEffect 0.3s ease-in-out; }

      #detach-menu { position:absolute; background-color:white; border:1px solid #ccc; border-radius:4px; box-shadow:0 3px 8px rgba(0,0,0,0.2); z-index:1100; padding:5px; font-size:14px; min-width:100px; }
      #detach-menu div { padding:6px 12px; cursor:pointer; border-radius:3px; }
      #detach-menu div:hover { background-color:#eee; }

      body.user-select-none { user-select:none; -webkit-user-select:none; -moz-user-select:none; -ms-user-select:none; }
      .connected-block, .has-connected-block { /* Optional */ }

      #sound-test-button { position:fixed; bottom:15px; right:15px; padding:8px 12px; background-color:#2196F3; color:white; border:none; border-radius:4px; cursor:pointer; z-index:9999; font-family:Arial,sans-serif; font-size:14px; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.2); transition:background-color .2s,opacity .5s ease-out; opacity:1; }
      #sound-test-button:hover { background-color:#0b7dda; }
      #sound-test-button.success { background-color:#4CAF50; }
      #sound-test-button.error { background-color:#f44336; }
      #sound-test-button.loading { background-color:#ff9800; cursor:wait; }
      #sound-test-button.hidden { opacity:0; pointer-events:none; }
    `;
    
    document.head.appendChild(style);
    if (CONFIG.DEBUG) console.log('Enhanced styles added with !important directives (v3.9.2)');

    // Force immediate reflow
    document.body.offsetHeight;
  }

  // ========================================================================
  // אתחול אודיו, כפתור בדיקה, נגינת צליל - ללא שינוי
  // ========================================================================
  function initAudio() { if (!CONFIG.PLAY_SOUND || soundInitialized) return; try { const el=document.getElementById('snap-sound-element'); if(el){snapSound=el;soundInitialized=true;if(CONFIG.DEBUG)console.log('Audio reused.');if(!el.querySelector(`source[src="${CONFIG.SOUND_PATH}"]`)){el.innerHTML='';const s=document.createElement('source');s.src=CONFIG.SOUND_PATH;s.type='audio/mpeg';el.appendChild(s);el.load();}return;} snapSound=document.createElement('audio');snapSound.id='snap-sound-element';snapSound.preload='auto';snapSound.volume=CONFIG.SOUND_VOLUME;const s=document.createElement('source');s.src=CONFIG.SOUND_PATH;s.type='audio/mpeg';snapSound.appendChild(s);snapSound.addEventListener('error',(e)=>{console.error(`Audio Error: ${CONFIG.SOUND_PATH}`,e);const b=document.getElementById('sound-test-button');if(b){b.textContent='שגיאה';b.className='error';b.disabled=true;}CONFIG.PLAY_SOUND=false;snapSound=null;soundInitialized=false;});snapSound.addEventListener('canplaythrough',()=>{soundInitialized=true;if(CONFIG.DEBUG)console.log('Audio ready.');const b=document.getElementById('sound-test-button');if(b?.classList.contains('loading')){b.textContent='בדוק';b.classList.remove('loading');b.disabled=false;}});snapSound.style.display='none';document.body.appendChild(snapSound);if(CONFIG.DEBUG)console.log(`Audio created: ${CONFIG.SOUND_PATH}`);}catch(err){console.error('Audio init error:',err);CONFIG.PLAY_SOUND=false;snapSound=null;soundInitialized=false;}}
  function addSoundTestButton() { if(!CONFIG.PLAY_SOUND)return;try{const eb=document.getElementById('sound-test-button');if(eb)eb.remove();const b=document.createElement('button');b.id='sound-test-button';b.title='בדוק צליל';b.className='';if(!snapSound){b.textContent='שמע נכשל';b.classList.add('error');b.disabled=true;}else if(!soundInitialized){b.textContent='טוען...';b.classList.add('loading');b.disabled=true;}else{b.textContent='בדוק';b.disabled=false;}Object.assign(b.style,{position:'fixed',bottom:'15px',right:'15px',zIndex:'9999',padding:'8px 12px',color:'white',border:'none',borderRadius:'4px',cursor:'pointer',boxShadow:'0 2px 5px rgba(0,0,0,0.2)',fontFamily:'Arial,sans-serif',fontSize:'14px',fontWeight:'bold',transition:'background-color .2s,opacity .5s ease-out',opacity:'1'});b.onmouseover=function(){if(!this.disabled&&!this.classList.contains('success')&&!this.classList.contains('error'))this.style.backgroundColor='#0b7dda'};b.onmouseout=function(){if(!this.disabled&&!this.classList.contains('success')&&!this.classList.contains('error'))this.style.backgroundColor='#2196F3'};b.addEventListener('click',function(){if(this.disabled||!snapSound||!soundInitialized)return;snapSound.play().then(()=>{b.textContent='פועל ✓';b.classList.add('success');audioContextAllowed=true;setTimeout(()=>{b.classList.add('hidden');setTimeout(()=>b.remove(),500)},3000);if(snapSound){snapSound.pause();snapSound.currentTime=0;}}).catch(err=>{console.warn('Sound test fail:',err.name);if(err.name==='NotAllowedError'){b.textContent='חסום-לחץ';b.classList.add('error');audioContextAllowed=false;}else{b.textContent='שגיאה';b.classList.add('error');b.disabled=true;}});});document.body.appendChild(b);if(CONFIG.DEBUG)console.log('Sound test button added.');}catch(err){console.error('Err adding sound btn:',err);}}
  function playSnapSound() { if(!CONFIG.PLAY_SOUND||!snapSound||!soundInitialized)return;if(!audioContextAllowed&&CONFIG.DEBUG)console.warn('Playing sound before user interaction.');try{if(snapSound.readyState<3){if(CONFIG.DEBUG)console.log('Snap sound skip: audio not ready.');return;}snapSound.pause();snapSound.currentTime=0;const pp=snapSound.play();if(pp!==undefined){pp.then(()=>{audioContextAllowed=true;if(CONFIG.DEBUG>1)console.log('Snap sound played.');}).catch(err=>{if(err.name==='NotAllowedError'){console.warn('Snap sound blocked.');audioContextAllowed=false;if(!document.getElementById('sound-test-button'))addSoundTestButton();}else if(err.name!=='AbortError'){console.error('Err play snap sound:',err);}});}}catch(err){console.error('Unexpected play sound err:',err);}}

  // ========================================================================
  // ניהול נקודות חיבור - טיפול משופר בנקודות החיבור הויזואליות
  // ========================================================================

  // הוספת נקודות חיבור לבלוק 
  function addConnectionPoints(block) {
    if (!block) return;
    if (block.querySelector('.right-connection-point')) return;
    
    const rightPoint = document.createElement('div');
    rightPoint.className = 'right-connection-point';
    block.appendChild(rightPoint);
    
    const leftPoint = document.createElement('div');
    leftPoint.className = 'left-connection-point';
    block.appendChild(leftPoint);
    
    if (CONFIG.DEBUG > 1) console.log(`Added connection points (DOM elements) to block ${block.id}`);
  }

  // הדגשת נקודת חיבור - משופר לנראות טובה יותר
  function highlightConnectionPoint(block, isLeft) {
    if (!block) return false;
    
    // ודא שנקודות החיבור קיימות
    addConnectionPoints(block);
    
    // אתר את נקודת החיבור המבוקשת
    const connectionPoint = block.querySelector(isLeft ? '.left-connection-point' : '.right-connection-point');
    
    if (connectionPoint) {
      // הסר קודם את הקלאס אם קיים ואז הוסף שוב כדי להפעיל מחדש אנימציה
      connectionPoint.classList.remove('connection-point-visible');
      
      // אפס את האופקיות קודם
      connectionPoint.style.opacity = '0';
      
      // חכה קצת לפני הוספת הקלאס מחדש
      setTimeout(() => {
        // הוסף גם קלאס וגם סגנון ישיר - חגורה ושני מכנסיים
        connectionPoint.classList.add('connection-point-visible');
        connectionPoint.style.opacity = '1';
        
        // לוג דיבאג מורחב
        if (CONFIG.DEBUG) {
          console.log(`[HIGHLIGHT] Point for ${block.id} (${isLeft ? 'left' : 'right'}):`, 
            connectionPoint.classList.contains('connection-point-visible'),
            'Style opacity:', connectionPoint.style.opacity,
            'Computed opacity:', window.getComputedStyle(connectionPoint).opacity);
        }
      }, 10);
      
      return true;
    }
    
    return false;
  }

  // ניקוי כל ההדגשות - עכשיו מנקה גם את ה-inline style
  function clearAllHighlights() {
    document.querySelectorAll('.connection-point-visible').forEach(point => {
      point.classList.remove('connection-point-visible');
      point.style.opacity = '0'; // גם מאפס את האופקיות בסגנון ישיר
    });
    // גם מנקה את אזורי החיבור אם היו בשימוש
    document.querySelectorAll('.connection-area.visible').forEach(area => {
      area.classList.remove('visible');
    });
  }

  // ========================================================================
  // מאזינים, זיהוי בלוקים, קליק ימני, MouseDown - ללא שינוי
  // ========================================================================
  function initProgrammingAreaListeners() { const a=document.getElementById('program-blocks');if(!a)return;a.addEventListener('dragover',(e)=>e.preventDefault());a.addEventListener('dragstart',(e)=>{if(e.target?.closest?.('#program-blocks .block-container'))e.preventDefault();}); }
  function observeNewBlocks() { const a=document.getElementById('program-blocks');if(!a)return;const o=new MutationObserver((m)=>{m.forEach((mu)=>{if(mu.type==='childList'){mu.addedNodes.forEach((n)=>{if(n.nodeType===1){let b=n.classList?.contains('block-container')?n:n.querySelector?.('.block-container');if(b?.closest('#program-blocks')){if(!b.id)generateUniqueId(b);addBlockDragListeners(b);addConnectionPoints(b);}}});}});});o.observe(a,{childList:true,subtree:true});if(CONFIG.DEBUG)console.log("MutationObserver watching."); }
  function initExistingBlocks() { document.querySelectorAll('#program-blocks .block-container').forEach(b=>{if(!b.id)generateUniqueId(b);addBlockDragListeners(b);addConnectionPoints(b);});if(CONFIG.DEBUG)console.log("Listeners added to existing blocks."); }
  function addBlockDragListeners(b) { b.removeEventListener('mousedown',handleMouseDown);b.addEventListener('mousedown',handleMouseDown);b.removeEventListener('contextmenu',handleContextMenu);b.addEventListener('contextmenu',handleContextMenu); }
  function handleContextMenu(e) { e.preventDefault();const b=e.target.closest('.block-container');if(b?.hasAttribute('data-connected-to'))showDetachMenu(e.clientX,e.clientY,b); }
  function handleMouseDown(e) { if(e.button!==0||!e.target.closest||e.target.matches('input,button,select,textarea,a[href]'))return;const b=e.target.closest('.block-container');if(!b||!b.parentElement||b.parentElement.id!=='program-blocks')return;if(!b.id)generateUniqueId(b);e.preventDefault();b.draggable=false;if(CONFIG.DEBUG)console.log(`[MouseDown] Start drag: ${b.id}`);if(b.hasAttribute('data-connected-to'))detachBlock(b,false);const lId=b.getAttribute('data-connected-from-left');if(lId)detachBlock(document.getElementById(lId),false);const rId=b.getAttribute('data-connected-from-right');if(rId)detachBlock(document.getElementById(rId),false);currentDraggedBlock=b;isDraggingBlock=true;const r=b.getBoundingClientRect();dragOffset.x=e.clientX-r.left;dragOffset.y=e.clientY-r.top;const pE=document.getElementById('program-blocks');const pR=pE.getBoundingClientRect();if(window.getComputedStyle(b).position!=='absolute'){b.style.position='absolute';b.style.left=(r.left-pR.left+pE.scrollLeft)+'px';b.style.top=(r.top-pR.top+pE.scrollTop)+'px';}b.style.margin='0';b.style.zIndex='1001';b.classList.add('snap-source');document.body.classList.add('user-select-none'); }

  // ========================================================================
  // מאזינים גלובליים, MouseLeave, MouseMove - ללא שינוי
  // ========================================================================
  function initGlobalMouseListeners() { document.removeEventListener('mousemove',handleMouseMove);document.removeEventListener('mouseup',handleMouseUp);document.removeEventListener('mouseleave',handleMouseLeave);document.addEventListener('mousemove',handleMouseMove);document.addEventListener('mouseup',handleMouseUp);document.addEventListener('mouseleave',handleMouseLeave); }
  function handleMouseLeave(e) { if(isDraggingBlock&&e.target===document.documentElement&&!e.relatedTarget){if(CONFIG.DEBUG)console.warn("Mouse left doc during drag, mouseup.");handleMouseUp(e);} }
  function handleMouseMove(e) { if(!isDraggingBlock||!currentDraggedBlock)return;e.preventDefault();const pE=document.getElementById('program-blocks');if(!pE){handleMouseUp(e);return;}const pR=pE.getBoundingClientRect();let nL=e.clientX-pR.left-dragOffset.x+pE.scrollLeft;let nT=e.clientY-pR.top-dragOffset.y+pE.scrollTop;const bW=currentDraggedBlock.offsetWidth;const bH=currentDraggedBlock.offsetHeight;const sW=pE.scrollWidth;const sH=pE.scrollHeight;nL=Math.max(0,Math.min(nL,sW-bW));nT=Math.max(0,Math.min(nT,sH-bH));currentDraggedBlock.style.left=Math.round(nL)+'px';currentDraggedBlock.style.top=Math.round(nT)+'px';checkAndHighlightSnapPossibility(); }

  // ========================================================================
  // בדיקת הצמדה והדגשה - משופר עם יותר לוגים ומידע לדיבאג
  // ========================================================================
  function checkAndHighlightSnapPossibility() {
    if (!currentDraggedBlock) return;
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;

    const sourceRect = currentDraggedBlock.getBoundingClientRect();
    const allVisibleBlocks = Array.from(programmingArea.querySelectorAll('.block-container:not(.snap-source)'))
                              .filter(block => block.offsetParent !== null);

    let bestTarget = null;
    let bestDirection = null;
    let minDistance = CONFIG.CONNECT_THRESHOLD + 1;

    // ניקוי כל ההדגשות הקודמות (מסיר קלאס .connection-point-visible)
    clearAllHighlights();
    potentialSnapTarget = null;
    snapDirection = null;

    for (const targetBlock of allVisibleBlocks) {
      if (!targetBlock.id) generateUniqueId(targetBlock);

      const targetRect = targetBlock.getBoundingClientRect();
      const targetConnectedLeft = targetBlock.hasAttribute('data-connected-from-left');
      const targetConnectedRight = targetBlock.hasAttribute('data-connected-from-right');

      // בדיקת חפיפה אנכית
      const topOverlap = Math.max(sourceRect.top, targetRect.top);
      const bottomOverlap = Math.min(sourceRect.bottom, targetRect.bottom);
      const verticalOverlap = Math.max(0, bottomOverlap - topOverlap);
      const minHeightReq = Math.min(sourceRect.height, targetRect.height) * CONFIG.VERTICAL_OVERLAP_REQ;

      if (verticalOverlap < minHeightReq || verticalOverlap <= 0) continue;

      // בדיקת צד ימין של מקור לשמאל יעד
      if (!targetConnectedLeft) {
        const distance = Math.abs(sourceRect.right - targetRect.left);
        if (distance < minDistance) {
          minDistance = distance;
          bestTarget = targetBlock;
          bestDirection = 'left';
        }
      }

      // בדיקת צד שמאל של מקור לימין יעד
      if (!targetConnectedRight) {
        const distance = Math.abs(sourceRect.left - targetRect.right);
        if (distance < minDistance) {
          minDistance = distance;
          bestTarget = targetBlock;
          bestDirection = 'right';
        }
      }
    }

    // אם נמצא יעד מתאים, הדגש (הפוך לנראה)
    if (bestTarget && minDistance <= CONFIG.CONNECT_THRESHOLD) {
      if (CONFIG.DEBUG) console.log(`[Highlight] Threshold met: ${currentDraggedBlock.id} -> ${bestTarget.id} (${bestDirection}). Dist=${minDistance.toFixed(1)}px. Highlighting points.`);
      potentialSnapTarget = bestTarget;
      snapDirection = bestDirection;

      try {
        let sourceHighlighted = false;
        let targetHighlighted = false;
        
        if (bestDirection === 'left') {
          targetHighlighted = highlightConnectionPoint(bestTarget, true); // Highlight left point on target
          sourceHighlighted = highlightConnectionPoint(currentDraggedBlock, false); // Highlight right point on source
        } else if (bestDirection === 'right') {
          targetHighlighted = highlightConnectionPoint(bestTarget, false); // Highlight right point on target
          sourceHighlighted = highlightConnectionPoint(currentDraggedBlock, true); // Highlight left point on source
        }
        
        // דיבאג מורחב לוודא שהפונקציה highlightConnectionPoint עובדת
        if (CONFIG.DEBUG) {
          console.log(`[Highlight] Source highlight: ${sourceHighlighted}, Target highlight: ${targetHighlighted}`);
        }
      } catch (err) {
        console.error("Error calling highlightConnectionPoint:", err);
      }
    } else if (CONFIG.DEBUG > 1) {
      // לוג כשלא נמצא יעד מתאים או המרחק גדול מדי (שימושי לדיבאג)
      console.log(`[Highlight] No suitable target found or distance (${minDistance.toFixed(1)}px) exceeds threshold (${CONFIG.CONNECT_THRESHOLD}px)`);
    }
  }

  // ========================================================================
  // עדכון פונקציית ההצמדה כדי להשתמש בערכי הכוונון העדין הנפרדים
  // ========================================================================
  function performBlockSnap(sourceBlock, targetBlock, direction) {
    if (!sourceBlock || !targetBlock || !document.body.contains(targetBlock) || targetBlock.offsetParent === null) {
      console.error("[PerformSnap] Invalid block(s). Snap cancelled.");
      return false;
    }

    if ((direction === 'left' && targetBlock.hasAttribute('data-connected-from-left')) ||
        (direction === 'right' && targetBlock.hasAttribute('data-connected-from-right'))) {
      console.warn(`[PerformSnap] Snap cancelled: Target ${targetBlock.id} conflict on side '${direction}'.`);
      return false;
    }

    if (CONFIG.DEBUG) console.log(`[PerformSnap] Snapping ${sourceBlock.id} to ${targetBlock.id} (${direction})`);

    try {
      const sourceRect = sourceBlock.getBoundingClientRect();
      const targetRect = targetBlock.getBoundingClientRect();
      const pE = document.getElementById('program-blocks');
      const pR = pE.getBoundingClientRect();

      let finalLeft, finalTop;

      if (direction === 'left') {
        finalLeft = targetRect.left - sourceRect.width + CONFIG.PUZZLE_LEFT_SOCKET_WIDTH;
        finalTop = targetRect.top + CONFIG.VERTICAL_CENTER_OFFSET;
        // שימוש בכוונון עדין שמאלי
        finalLeft += CONFIG.HORIZONTAL_FINE_TUNING_LEFT;
      } else { // direction === 'right'
        finalLeft = targetRect.right - CONFIG.PUZZLE_RIGHT_BULGE_WIDTH;
        finalTop = targetRect.top + CONFIG.VERTICAL_CENTER_OFFSET;
        // שימוש בכוונון עדין ימני
        finalLeft += CONFIG.HORIZONTAL_FINE_TUNING_RIGHT;
      }

      let styleLeft = finalLeft - pR.left + pE.scrollLeft;
      let styleTop = finalTop - pR.top + pE.scrollTop;

      sourceBlock.style.position = 'absolute';
      sourceBlock.style.left = `${Math.round(styleLeft)}px`;
      sourceBlock.style.top = `${Math.round(styleTop)}px`;
      sourceBlock.style.margin = '0';

      sourceBlock.setAttribute('data-connected-to', targetBlock.id);
      sourceBlock.setAttribute('data-connection-direction', direction);
      targetBlock.setAttribute(
        direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right',
        sourceBlock.id
      );
      sourceBlock.classList.add('connected-block');
      targetBlock.classList.add('has-connected-block');

      playSnapSound(); // Play sound on successful snap logic start
      addSnapEffectAnimation(sourceBlock);
      sourceBlock.draggable = false;

      if (CONFIG.DEBUG) console.log(`[PerformSnap] Success. ${sourceBlock.id} pos: L=${styleLeft.toFixed(0)}, T=${styleTop.toFixed(0)}.`);
      return true;
    } catch (err) {
      console.error(`[PerformSnap] Error:`, err);
      try {
        detachBlock(sourceBlock, false);
      } catch (derr) {
        console.error(`[PerformSnap] Cleanup detach error:`, derr);
      }
      sourceBlock.draggable = true;
      return false;
    }
  }
