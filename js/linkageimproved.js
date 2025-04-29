// --- LINKAGE-IMPROVED.JS v3.9.5: BALANCED SOLUTION ---
// גרסה 3.9.5 עם:
// 1. טיפול ממוקד במסגרות בבלוקים מחוברים בלבד
// 2. שמירה על עיגולי התקרבות שעובדים נהדר
// 3. תיקון בעיית הרווח בחיבור

(function() {
  // משתנים גלובליים במודול
  let currentDraggedBlock = null;
  let potentialSnapTarget = null;
  let snapDirection = null;
  let isDraggingBlock = false;
  let dragOffset = { x: 0, y: 0 };
  let futureIndicator = null;
  let snapSound = null;
  let audioContextAllowed = false;
  let soundInitialized = false;
  let outlineCleanupTimer = null;

  // קונפיגורציה - פרמטרים עם תמיכה בכוונון עדין נפרד
  const CONFIG = {
    CONNECT_THRESHOLD: 40,
    VERTICAL_ALIGN_THRESHOLD: 20,
    VERTICAL_OVERLAP_REQ: 0.4,
    BLOCK_GAP: 0,
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3',
    DEBUG: true,
    HIGHLIGHT_COLOR_RIGHT: '#FF9800', // כתום
    HIGHLIGHT_COLOR_LEFT: '#2196F3', // כחול
    HIGHLIGHT_OPACITY: 0.8,
    CLEAR_OUTLINES_DELAY: 500, // זמן בmilliseconds להסרה אוטומטית של מסגרות

    // ערכי היסט קבועים לחיבור פאזל מדויק
    PUZZLE_RIGHT_BULGE_WIDTH: 10, 
    PUZZLE_LEFT_SOCKET_WIDTH: 10,
    VERTICAL_CENTER_OFFSET: 0,
    
    // כוונון עדין לפי כיוון החיבור
    HORIZONTAL_FINE_TUNING_LEFT: 9,  // כוונון עדין כשמחברים לצד שמאל
    HORIZONTAL_FINE_TUNING_RIGHT: -9   // כוונון עדין כשמחברים לצד ימין (סוגר רווח)
  };

  // ========================================================================
  // הוספת סגנונות CSS - גדלים חדשים ובולטים יותר
  // ========================================================================
  function addHighlightStyles() {
    // הסר כל סגנון קודם אם קיים
    const oldStyle = document.getElementById('block-connection-styles');
    if (oldStyle) oldStyle.remove();
    
    // צור סגנון חדש
    const style = document.createElement('style');
    style.id = 'block-connection-styles-enhanced-v3-9-5';
    style.textContent = `
      .snap-source {
        box-shadow: 0 5px 15px rgba(0,0,0,0.4) !important;
        cursor: grabbing !important;
        z-index: 1001 !important;
      }

      /* נקודות חיבור - צד ימין (בליטה) */
      .right-connection-point {
        position: absolute !important;
        width: 20px !important;
        height: 20px !important;
        top: 50% !important;
        right: -10px !important;
        transform: translateY(-50%) !important;
        background-color: ${CONFIG.HIGHLIGHT_COLOR_RIGHT} !important;
        border-radius: 50% !important;
        opacity: 0;
        transition: opacity 0.1s ease-out !important;
        pointer-events: none !important;
        z-index: 9999 !important;
        box-shadow: 0 0 10px 4px rgba(255,152,0,0.95) !important;
        border: 2px solid #FFF !important;
      }

      /* נקודות חיבור - צד שמאל (שקע) */
      .left-connection-point {
        position: absolute !important;
        width: 20px !important;
        height: 20px !important;
        top: 50% !important;
        left: -10px !important;
        transform: translateY(-50%) !important;
        background-color: ${CONFIG.HIGHLIGHT_COLOR_LEFT} !important;
        border-radius: 50% !important;
        opacity: 0;
        transition: opacity 0.1s ease-out !important;
        pointer-events: none !important;
        z-index: 9999 !important;
        box-shadow: 0 0 10px 4px rgba(33,150,243,0.95) !important;
        border: 2px solid #FFF !important;
      }

      /* הדגשה נראית */
      .connection-point-visible {
        opacity: 1 !important;
        animation: pulseConnectionPoint 0.5s infinite !important;
      }

      /* אנימציית פעימה */
      @keyframes pulseConnectionPoint {
        0% { transform: translateY(-50%) scale(1) !important; }
        50% { transform: translateY(-50%) scale(1.5) !important; }
        100% { transform: translateY(-50%) scale(1) !important; }
      }

      /* תצוגת עזר */
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
      
      /* הבלוקים המחוברים לא צריכים מסגרות */
      .no-outlines, .no-outlines * {
        outline: none !important;
        box-shadow: none !important;
      }
    `;
    
    document.head.appendChild(style);
    if (CONFIG.DEBUG) console.log('Enhanced styles added (v3.9.5)');
  }

  // ========================================================================
  // אתחול אודיו, כפתור בדיקה, נגינת צליל - ללא שינוי
  // ========================================================================
  function initAudio() { if (!CONFIG.PLAY_SOUND || soundInitialized) return; try { const el=document.getElementById('snap-sound-element'); if(el){snapSound=el;soundInitialized=true;if(CONFIG.DEBUG)console.log('Audio reused.');if(!el.querySelector(`source[src="${CONFIG.SOUND_PATH}"]`)){el.innerHTML='';const s=document.createElement('source');s.src=CONFIG.SOUND_PATH;s.type='audio/mpeg';el.appendChild(s);el.load();}return;} snapSound=document.createElement('audio');snapSound.id='snap-sound-element';snapSound.preload='auto';snapSound.volume=CONFIG.SOUND_VOLUME;const s=document.createElement('source');s.src=CONFIG.SOUND_PATH;s.type='audio/mpeg';snapSound.appendChild(s);snapSound.addEventListener('error',(e)=>{console.error(`Audio Error: ${CONFIG.SOUND_PATH}`,e);const b=document.getElementById('sound-test-button');if(b){b.textContent='שגיאה';b.className='error';b.disabled=true;}CONFIG.PLAY_SOUND=false;snapSound=null;soundInitialized=false;});snapSound.addEventListener('canplaythrough',()=>{soundInitialized=true;if(CONFIG.DEBUG)console.log('Audio ready.');const b=document.getElementById('sound-test-button');if(b?.classList.contains('loading')){b.textContent='בדוק';b.classList.remove('loading');b.disabled=false;}});snapSound.style.display='none';document.body.appendChild(snapSound);if(CONFIG.DEBUG)console.log(`Audio created: ${CONFIG.SOUND_PATH}`);}catch(err){console.error('Audio init error:',err);CONFIG.PLAY_SOUND=false;snapSound=null;soundInitialized=false;}}
  function addSoundTestButton() { if(!CONFIG.PLAY_SOUND)return;try{const eb=document.getElementById('sound-test-button');if(eb)eb.remove();const b=document.createElement('button');b.id='sound-test-button';b.title='בדוק צליל';b.className='';if(!snapSound){b.textContent='שמע נכשל';b.classList.add('error');b.disabled=true;}else if(!soundInitialized){b.textContent='טוען...';b.classList.add('loading');b.disabled=true;}else{b.textContent='בדוק';b.disabled=false;}Object.assign(b.style,{position:'fixed',bottom:'15px',right:'15px',zIndex:'9999',padding:'8px 12px',color:'white',border:'none',borderRadius:'4px',cursor:'pointer',boxShadow:'0 2px 5px rgba(0,0,0,0.2)',fontFamily:'Arial,sans-serif',fontSize:'14px',fontWeight:'bold',transition:'background-color .2s,opacity .5s ease-out',opacity:'1'});b.onmouseover=function(){if(!this.disabled&&!this.classList.contains('success')&&!this.classList.contains('error'))this.style.backgroundColor='#0b7dda'};b.onmouseout=function(){if(!this.disabled&&!this.classList.contains('success')&&!this.classList.contains('error'))this.style.backgroundColor='#2196F3'};b.addEventListener('click',function(){if(this.disabled||!snapSound||!soundInitialized)return;snapSound.play().then(()=>{b.textContent='פועל ✓';b.classList.add('success');audioContextAllowed=true;setTimeout(()=>{b.classList.add('hidden');setTimeout(()=>b.remove(),500)},3000);if(snapSound){snapSound.pause();snapSound.currentTime=0;}}).catch(err=>{console.warn('Sound test fail:',err.name);if(err.name==='NotAllowedError'){b.textContent='חסום-לחץ';b.classList.add('error');audioContextAllowed=false;}else{b.textContent='שגיאה';b.classList.add('error');b.disabled=true;}});});document.body.appendChild(b);if(CONFIG.DEBUG)console.log('Sound test button added.');}catch(err){console.error('Err adding sound btn:',err);}}
  function playSnapSound() { if(!CONFIG.PLAY_SOUND||!snapSound||!soundInitialized)return;if(!audioContextAllowed&&CONFIG.DEBUG)console.warn('Playing sound before user interaction.');try{if(snapSound.readyState<3){if(CONFIG.DEBUG)console.log('Snap sound skip: audio not ready.');return;}snapSound.pause();snapSound.currentTime=0;const pp=snapSound.play();if(pp!==undefined){pp.then(()=>{audioContextAllowed=true;if(CONFIG.DEBUG>1)console.log('Snap sound played.');}).catch(err=>{if(err.name==='NotAllowedError'){console.warn('Snap sound blocked.');audioContextAllowed=false;if(!document.getElementById('sound-test-button'))addSoundTestButton();}else if(err.name!=='AbortError'){console.error('Err play snap sound:',err);}});}}catch(err){console.error('Unexpected play sound err:',err);}}

  // ========================================================================
  // ניהול נקודות חיבור - ללא שינוי
  // ========================================================================
  function addConnectionPoints(block) {
    if (!block) return;
    if (block.querySelector('.right-connection-point')) return;
    
    const rightPoint = document.createElement('div');
    rightPoint.className = 'right-connection-point';
    block.appendChild(rightPoint);
    
    const leftPoint = document.createElement('div');
    leftPoint.className = 'left-connection-point';
    block.appendChild(leftPoint);
    
    if (CONFIG.DEBUG > 1) console.log(`Added connection points to block ${block.id}`);
  }

  function highlightConnectionPoint(block, isLeft) {
    if (!block) return false;
    
    addConnectionPoints(block);
    
    const connectionPoint = block.querySelector(isLeft ? '.left-connection-point' : '.right-connection-point');
    
    if (connectionPoint) {
      connectionPoint.classList.remove('connection-point-visible');
      connectionPoint.style.opacity = '0';
      
      setTimeout(() => {
        connectionPoint.classList.add('connection-point-visible');
        connectionPoint.style.opacity = '1';
      }, 10);
      
      return true;
    }
    
    return false;
  }

  function clearAllHighlights() {
    document.querySelectorAll('.connection-point-visible').forEach(point => {
      point.classList.remove('connection-point-visible');
      point.style.opacity = '0';
    });
    document.querySelectorAll('.connection-area.visible').forEach(area => {
      area.classList.remove('visible');
    });
  }

  // ========================================================================
  // פונקציה ממוקדת להסרת מסגרות רק בבלוקים מחוברים
  // ========================================================================
  function removeOutlinesFromConnectedBlocks() {
    // טיפול ממוקד רק בבלוקים מחוברים
    document.querySelectorAll('.connected-block, [data-connected-to], [data-connected-from-left], [data-connected-from-right]').forEach(block => {
      // הוסף קלאס שמסיר מסגרות
      block.classList.add('no-outlines');
      
      // הסר סגנונות מסגרת ישירים
      block.style.outline = 'none';
      
      // אם יש ילדים (תמונות, טקסט וכו׳), נקה גם אותם
      block.querySelectorAll('*').forEach(child => {
        child.style.outline = 'none';
      });
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
  // בדיקת הצמדה והדגשה - ללא שינוי
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

    // אם נמצא יעד מתאים, הדגש
    if (bestTarget && minDistance <= CONFIG.CONNECT_THRESHOLD) {
      if (CONFIG.DEBUG) console.log(`[Highlight] Threshold met: ${currentDraggedBlock.id} -> ${bestTarget.id} (${bestDirection}). Dist=${minDistance.toFixed(1)}px`);
      potentialSnapTarget = bestTarget;
      snapDirection = bestDirection;

      try {
        if (bestDirection === 'left') {
          highlightConnectionPoint(bestTarget, true); // נקודה שמאלית ביעד
          highlightConnectionPoint(currentDraggedBlock, false); // נקודה ימנית במקור
        } else if (bestDirection === 'right') {
          highlightConnectionPoint(bestTarget, false); // נקודה ימנית ביעד
          highlightConnectionPoint(currentDraggedBlock, true); // נקודה שמאלית במקור
        }
      } catch (err) {
        console.error("Error highlighting:", err);
      }
    }
  }

  // ========================================================================
  // ביצוע הצמדה עם כוונון עדין נפרד + תיקון מסגרות מאוזן
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

      playSnapSound();
      addSnapEffectAnimation(sourceBlock);
      sourceBlock.draggable = false;

      // ביטול כל טיימר קודם אם קיים
      if (outlineCleanupTimer) {
        clearTimeout(outlineCleanupTimer);
      }

      // הגדרת טיימר חדש להסרת מסגרות
      outlineCleanupTimer = setTimeout(() => {
        // הסר מסגרות רק מהבלוקים המחוברים
        removeOutlinesFromConnectedBlocks();
        
        if (CONFIG.DEBUG) console.log(`[PerformSnap] Removed outlines from connected blocks after ${CONFIG.CLEAR_OUTLINES_DELAY}ms`);
      }, CONFIG.CLEAR_OUTLINES_DELAY);

      if (CONFIG.DEBUG) console.log(`[PerformSnap] Success. ${sourceBlock.id} pos: L=${styleLeft.toFixed(0)}, T=${styleTop.toFixed(0)}. Will clear outlines in ${CONFIG.CLEAR_OUTLINES_DELAY}ms.`);
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

  // ========================================================================
  // טיפול בשחרור העכבר - ללא שינוי
  // ========================================================================
  function handleMouseUp(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    const blockReleased = currentDraggedBlock;
    const candidateTarget = potentialSnapTarget;
    const candidateDirection = snapDirection;

    if (CONFIG.DEBUG) console.log(`[MouseUp] Releasing block ${blockReleased.id}. Candidate: ${candidateTarget?.id || 'none'}, direction: ${candidateDirection || 'none'}`);

    // ניקוי מצב הגרירה
    isDraggingBlock = false;
    currentDraggedBlock = null;
    potentialSnapTarget = null;
    snapDirection = null;
    document.body.classList.remove('user-select-none');
    blockReleased.classList.remove('snap-source');
    blockReleased.style.zIndex = '';

    // ניקוי ראשוני של נקודות החיבור
    clearAllHighlights();

    // החלטה על הצמדה
    let performSnap = false;
    if (candidateTarget && candidateDirection && document.body.contains(candidateTarget)) {
        if (CONFIG.DEBUG) console.log(`[MouseUp] Candidate target ${candidateTarget.id} identified during drag. Attempting snap.`);
        performSnap = true;
    }

    // בצע הצמדה
    if (performSnap) {
      const snapSuccess = performBlockSnap(blockReleased, candidateTarget, candidateDirection);
      clearAllHighlights();

      if (!snapSuccess) {
          blockReleased.draggable = true;
      }
    } else {
      blockReleased.draggable = true;
    }
  }
  
  // ========================================================================
  // פונקציות ניתוק, תפריט, אנימציה
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
      btd.classList.remove('no-outlines');
      btd.draggable = true;
      return;
    }

    if (CONFIG.DEBUG) console.log(`[Detach] Detaching ${btd.id} from ${tid}`);

    btd.removeAttribute('data-connected-to');
    btd.removeAttribute('data-connection-direction');
    btd.classList.remove('connected-block');
    btd.classList.remove('no-outlines');
    btd.draggable = true;

    // ניקוי חיווי
    clearAllHighlights();

    const tb = document.getElementById(tid);
    if (tb) {
      tb.removeAttribute(dir === 'left' ? 'data-connected-from-left' : 'data-connected-from-right');
      const isStillConnected = tb.hasAttribute('data-connected-from-left') ||
                               tb.hasAttribute('data-connected-from-right') ||
                               tb.hasAttribute('data-connected-to');
      if (!isStillConnected) {
          tb.classList.remove('has-connected-block');
          tb.classList.remove('no-outlines');
      }
    } else {
      console.warn(`[Detach] Target block with ID ${tid} not found.`);
    }

    if (animate) addDetachEffectAnimation(btd);
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
    if (CONFIG.DEBUG > 1) console.log(`Generated ID: ${id} for block.`);
    return id;
  }

  // ========================================================================
  // אתחול המערכת - עם הוספת קריאה להסרת מסגרות
  // ========================================================================
  function initializeSystem() {
    const initFlag = 'blockLinkageInitialized_v3_9_5';
    if (window[initFlag]) {
        if (CONFIG.DEBUG) console.log("Block linkage system v3.9.5 already initialized. Skipping.");
        return;
    }

    // אתחול כל הרכיבים
    addHighlightStyles();
    initAudio();
    initProgrammingAreaListeners();
    observeNewBlocks();
    initExistingBlocks();
    initGlobalMouseListeners();

    if (CONFIG.PLAY_SOUND) {
      addSoundTestButton();
    }

    // הוספת נקודות חיבור לכל הבלוקים הקיימים
    document.querySelectorAll('#program-blocks .block-container').forEach(block => {
      addConnectionPoints(block);
    });

    // וידוא שהסגנונות הוטענו
    if (!document.getElementById('block-connection-styles-enhanced-v3-9-5')) {
      console.warn("Enhanced connection styles were not loaded properly. Re-adding...");
      addHighlightStyles();
    }
    
    // טיפול בכל הבלוקים שכבר מחוברים (לניקוי מסגרות קיימות)
    removeOutlinesFromConnectedBlocks();

    window[initFlag] = true;
    console.log(`Block linkage system initialized (Version 3.9.5 - Balanced Fix)`);
    console.log(`Configuration: Connection points preserved with targeted outline removal`);
    console.log(`Outlines will be removed only from connected blocks after ${CONFIG.CLEAR_OUTLINES_DELAY}ms`);
  }

  // הפעל אתחול
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
    initializeSystem(); // DOM already loaded
  }

})();

// --- END OF FILE linkageimproved.js v3.9.5 ---
// --- FINAL GROUP DRAGGING v3.0 ---
// פתרון משופר לגרירת שרשרת בלוקים עם תמיכה במספר בלוקים ומניעת הבהובים

(function() {
  // ----- קונפיגורציה -----
  const CONFIG = {
    DEBUG: true,                   // הצג הודעות דיבוג בקונסול
    UPDATE_INTERVAL_MS: 16,        // קצב עדכון בדיקת מיקום (כ-60 פעמים בשנייה)
    MIN_MOVEMENT_THRESHOLD: 1,     // סף מינימלי לזיהוי תנועה (פיקסלים)
    HIDE_CONNECTION_INDICATORS: true, // הסתר עיגולי קישור בזמן גרירה
    DRAG_ANIMATION_DURATION_MS: 1000,  // זמן אנימציית סיום גרירה (מילישניות)
    SHOW_STATUS_OVERLAY: true,     // הצג חלונית סטטוס במצב דיבוג
    WAIT_BEFORE_INIT_MS: 1000,     // כמה זמן להמתין לפני אתחול (מילישניות)
    CHAIN_BLOCKS_MAX: 20           // מקסימום בלוקים בשרשרת
  };
  
  // ----- משתנים גלובליים -----
  let isRunning = false;             // האם המודול רץ כרגע
  let isGroupDragging = false;       // האם גרירה קבוצתית פעילה כרגע
  let blockChain = [];               // שרשרת הבלוקים הנוכחית
  let blockPositionData = [];        // נתוני מיקום הבלוקים
  let mainDragBlock = null;          // הבלוק הראשי שנגרר
  let trackingInterval = null;       // מזהה האינטרוול לבדיקת תנועה
  let programmingAreaElem = null;    // אלמנט אזור התכנות
  let lastPosition = { x: 0, y: 0 }; // המיקום האחרון של הבלוק הראשי
  let lastUpdateTime = 0;            // זמן העדכון האחרון
  let suppressConnectionPoints = false; // האם להסתיר עיגולי חיבור
  
  // ----- פונקציות לוג -----
  function log(...args) {
    if (CONFIG.DEBUG) console.log("[GroupDrag]", ...args);
  }
  
  function error(...args) {
    console.error("[GroupDrag]", ...args);
  }
  
  // ----- פונקציות עזר -----
  function $(selector) {
    return document.querySelector(selector);
  }
  
  function $$(selector) {
    return document.querySelectorAll(selector);
  }
  
  // ----- פונקציית אתחול ראשית -----
  function initGroupDragging() {
    // וודא שהמודול עוד לא אותחל
    if (window.groupDraggingFinalInitialized) {
      log("Already initialized");
      return;
    }
    
    // חפש את אזור התכנות
    programmingAreaElem = $('#program-blocks');
    if (!programmingAreaElem) {
      error("Programming area not found! Waiting...");
      setTimeout(initGroupDragging, 500);
      return;
    }
    
    log("Initializing group dragging system v3.0");
    
    // הוסף סגנונות CSS
    addStyles();
    
    // התקן מאזינים גלובליים
    installGlobalListeners();
    
    // סמן שהמודול אותחל
    window.groupDraggingFinalInitialized = true;
    isRunning = true;
    
    log("Initialization complete");
    showStatusOverlay("Group Dragging Ready");
  }
  
  // ----- התקנת מאזינים גלובליים -----
  function installGlobalListeners() {
    // מאזינים לאירועי עכבר
    document.addEventListener('mousedown', handleMouseDown, true);
    document.addEventListener('mouseup', handleMouseUp, true);
    
    // מאזינים ללקיחה והפלה של גרירה רגילה (לא נעשה בהם שימוש, רק למקרה שנעשית גרירה רגילה)
    document.addEventListener('dragstart', handleDragStart, true);
    document.addEventListener('dragend', handleDragEnd, true);
    
    // התקן MutationObserver לבדיקת שינויים באזור התכנות
    setupMutationObserver();
  }
  
  // ----- התקנת MutationObserver לניטור שינויים בDOM -----
  function setupMutationObserver() {
    if (!programmingAreaElem) return;
    
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          // נוספו אלמנטים חדשים, ייתכן שאלו בלוקים חדשים
          if (isGroupDragging) {
            // אם יש גרירה פעילה, ייתכן שכדאי לחשב מחדש את שרשרת הבלוקים
            // אבל לרוב זה לא צריך לקרות באמצע גרירה
            log("DOM changed during active drag");
          }
        }
      }
    });
    
    observer.observe(programmingAreaElem, { 
      childList: true,
      subtree: true
    });
    
    log("MutationObserver installed");
  }
  
  // ----- הוספת סגנונות CSS -----
  function addStyles() {
    // אם הסגנונות כבר קיימים, אל תוסיף שוב
    if ($('#group-dragging-final-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'group-dragging-final-styles';
    style.textContent = `
      /* סגנונות עבור בלוקים בגרירה קבוצתית */
      .chain-dragging {
        transition: none !important;
        box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.5) !important;
      }
      
      .chain-main-block {
        box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.8) !important;
      }
      
      /* הסתרת עיגולי חיבור בזמן גרירה */
      .disable-connection-points .right-connection-point,
      .disable-connection-points .left-connection-point {
        display: none !important;
        opacity: 0 !important;
        animation: none !important;
      }
      
      /* חלונית סטטוס */
      #group-drag-status-overlay {
        position: fixed;
        bottom: 15px;
        left: 15px;
        background-color: rgba(33, 150, 243, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        z-index: 10000;
        pointer-events: none;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        transition: opacity 0.3s ease;
        opacity: 0;
      }
      
      #group-drag-status-overlay.visible {
        opacity: 1;
      }
      
      /* אנימציה בסיום גרירה קבוצתית */
      @keyframes chainComplete {
        0% { box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.8); }
        100% { box-shadow: none; }
      }
      
      .chain-drag-complete {
        animation: chainComplete ${CONFIG.DRAG_ANIMATION_DURATION_MS}ms ease forwards;
      }
    `;
    
    document.head.appendChild(style);
    log("Styles added");
    
    // הוסף חלונית סטטוס אם דרוש
    if (CONFIG.SHOW_STATUS_OVERLAY) {
      const statusOverlay = document.createElement('div');
      statusOverlay.id = 'group-drag-status-overlay';
      document.body.appendChild(statusOverlay);
    }
  }
  
  // ----- הצגת הודעת סטטוס -----
  function showStatusOverlay(message, duration = 2000) {
    if (!CONFIG.SHOW_STATUS_OVERLAY) return;
    
    const overlay = $('#group-drag-status-overlay');
    if (!overlay) return;
    
    // עדכן את הודעת הסטטוס
    overlay.textContent = message;
    overlay.classList.add('visible');
    
    // הסתר את ההודעה אחרי הזמן שהוגדר
    clearTimeout(window.statusOverlayTimeout);
    window.statusOverlayTimeout = setTimeout(() => {
      overlay.classList.remove('visible');
    }, duration);
  }
  
  // ----- פונקציית מאזין ללחיצת עכבר -----
  function handleMouseDown(e) {
    // אם המודול אינו רץ או שמדובר בלחיצה שאינה שמאלית, צא
    if (!isRunning || e.button !== 0) return;
    
    // נסה למצוא בלוק תכנות
    const clickedBlock = findBlockElement(e.target);
    if (!clickedBlock) return;
    
    log("Block clicked:", clickedBlock.id);
    
    // מצא את שרשרת הבלוקים המלאה
    const fullChain = findCompleteBlockChain(clickedBlock);
    
    // אם רק בלוק אחד או שניים, תן לקוד המקורי לטפל
    if (fullChain.length <= 1) {
      log("Single block - regular drag");
      return;
    }
    
    log(`Found block chain with ${fullChain.length} blocks`);
    
    // התחל גרירה קבוצתית
    startGroupDrag(clickedBlock, fullChain);
  }
  
  // ----- התחלת גרירה קבוצתית -----
  function startGroupDrag(mainBlock, chainBlocks) {
    // שמור מידע על הגרירה הנוכחית
    mainDragBlock = mainBlock;
    blockChain = chainBlocks;
    isGroupDragging = true;
    
    // שמור את המיקום הנוכחי של הבלוק הראשי
    updateMainBlockPosition();
    
    // הקפא את המיקום היחסי של כל הבלוקים בשרשרת
    saveBlockPositions();
    
    // הוסף קלאסים ויזואליים לבלוקים
    blockChain.forEach(block => {
      block.classList.add('chain-dragging');
    });
    mainDragBlock.classList.add('chain-main-block');
    
    // הסתר עיגולי חיבור אם נדרש
    if (CONFIG.HIDE_CONNECTION_INDICATORS) {
      suppressConnectionPoints = true;
      document.body.classList.add('disable-connection-points');
    }
    
    // התחל מעקב אחר תנועת הבלוק הראשי
    startPositionTracking();
    
    showStatusOverlay(`Dragging ${blockChain.length} blocks`);
    log("Group drag started");
  }
  
  // ----- פונקציית שמירת מיקום הבלוקים -----
  function saveBlockPositions() {
    if (!mainDragBlock || !blockChain.length) return;
    
    blockPositionData = [];
    
    // קבל את המיקום של הבלוק הראשי
    const mainRect = mainDragBlock.getBoundingClientRect();
    const mainStyleLeft = parseFloat(mainDragBlock.style.left) || 0;
    const mainStyleTop = parseFloat(mainDragBlock.style.top) || 0;
    
    // שמור מידע על כל בלוק
    blockChain.forEach(block => {
      // קבל את המיקום הנוכחי של הבלוק
      const rect = block.getBoundingClientRect();
      const styleLeft = parseFloat(block.style.left) || 0;
      const styleTop = parseFloat(block.style.top) || 0;
      
      // שמור מידע יחסי
      blockPositionData.push({
        block: block,
        // היסט סגנון - ההפרש בין המיקום בסגנון של הבלוק לבין הבלוק הראשי
        styleOffsetX: styleLeft - mainStyleLeft,
        styleOffsetY: styleTop - mainStyleTop,
        // היסט מיקום - ההפרש בין המיקום בפועל של הבלוק לבין הבלוק הראשי
        rectOffsetX: rect.left - mainRect.left,
        rectOffsetY: rect.top - mainRect.top,
        // מידות
        width: rect.width,
        height: rect.height
      });
    });
    
    log("Saved positions for", blockChain.length, "blocks");
  }
  
  // ----- עדכון מיקום הבלוק הראשי -----
  function updateMainBlockPosition() {
    if (!mainDragBlock) return false;
    
    const rect = mainDragBlock.getBoundingClientRect();
    const newPos = { x: rect.left, y: rect.top };
    
    // בדוק אם המיקום השתנה
    const moved = (
      Math.abs(newPos.x - lastPosition.x) > CONFIG.MIN_MOVEMENT_THRESHOLD ||
      Math.abs(newPos.y - lastPosition.y) > CONFIG.MIN_MOVEMENT_THRESHOLD
    );
    
    // עדכן את המיקום האחרון
    lastPosition = newPos;
    
    return moved;
  }
  
  // ----- התחלת מעקב אחר מיקום הבלוק הראשי -----
  function startPositionTracking() {
    // נקה אינטרוול קודם אם קיים
    stopPositionTracking();
    
    // הפעל אינטרוול חדש
    trackingInterval = setInterval(() => {
      if (!isGroupDragging || !mainDragBlock) {
        stopPositionTracking();
        return;
      }
      
      // הבלוק אמור להיות בגרירה, בדוק אם יש לו את הקלאס המתאים
      if (!mainDragBlock.classList.contains('snap-source')) {
        log("Main block is no longer in drag state");
        
        // בדוק אם זו גרירה שהסתיימה או שזה עדיין בהתחלה
        const timeSinceStart = Date.now() - lastUpdateTime;
        if (timeSinceStart > 500) {
          // כנראה שהגרירה הסתיימה
          handleGroupDragEnd();
        }
        return;
      }
      
      // בדוק אם הבלוק הראשי זז
      const moved = updateMainBlockPosition();
      
      // אם הבלוק זז, עדכן את כל שאר הבלוקים
      if (moved) {
        updateChainPositions();
        lastUpdateTime = Date.now();
      }
    }, CONFIG.UPDATE_INTERVAL_MS);
    
    log("Position tracking started");
  }
  
  // ----- עצירת מעקב אחר מיקום -----
  function stopPositionTracking() {
    if (trackingInterval) {
      clearInterval(trackingInterval);
      trackingInterval = null;
    }
  }
  
  // ----- עדכון מיקום כל הבלוקים בשרשרת -----
  function updateChainPositions() {
    if (!isGroupDragging || !mainDragBlock || !blockChain.length || !blockPositionData.length) return;
    
    // קבל את המיקום הנוכחי של הבלוק הראשי
    const currentMainLeft = parseFloat(mainDragBlock.style.left) || 0;
    const currentMainTop = parseFloat(mainDragBlock.style.top) || 0;
    
    // עדכן את מיקום כל הבלוקים בשרשרת חוץ מהבלוק הראשי
    blockPositionData.forEach((data, index) => {
      // דלג על הבלוק הראשי
      if (data.block === mainDragBlock) return;
      
      // עדכן את המיקום
      data.block.style.position = 'absolute';
      data.block.style.left = Math.round(currentMainLeft + data.styleOffsetX) + 'px';
      data.block.style.top = Math.round(currentMainTop + data.styleOffsetY) + 'px';
    });
  }
  
  // ----- סיום גרירה קבוצתית -----
  function handleGroupDragEnd() {
    if (!isGroupDragging) return;
    
    log("Group drag ended");
    
    // הסר קלאסים ויזואליים
    blockChain.forEach(block => {
      block.classList.remove('chain-dragging');
      block.classList.remove('chain-main-block');
      block.classList.add('chain-drag-complete');
      
      // הסר את קלאס הסיום אחרי זמן מסוים
      setTimeout(() => {
        block.classList.remove('chain-drag-complete');
      }, CONFIG.DRAG_ANIMATION_DURATION_MS);
    });
    
    // החזר את עיגולי החיבור
    if (suppressConnectionPoints) {
      suppressConnectionPoints = false;
      document.body.classList.remove('disable-connection-points');
    }
    
    // נקה את המשתנים
    isGroupDragging = false;
    mainDragBlock = null;
    blockChain = [];
    blockPositionData = [];
    
    // עצור את המעקב
    stopPositionTracking();
    
    showStatusOverlay("Group drag completed", 1500);
  }
  
  // ----- מאזין לשחרור לחצן עכבר -----
  function handleMouseUp(e) {
    // אם אין גרירה קבוצתית פעילה, אין מה לעשות
    if (!isGroupDragging) return;
    
    // הסתכל לראות אם הלחיצה שוחררה על הבלוק הראשי או אחד מהבלוקים בשרשרת
    const releasedBlock = findBlockElement(e.target);
    
    if (releasedBlock && blockChain.includes(releasedBlock)) {
      log("Mouse up on chain block:", releasedBlock.id);
    } else {
      log("Mouse up outside chain");
    }
    
    // במקרה כזה, סיים את הגרירה הקבוצתית
    handleGroupDragEnd();
  }
  
  // ----- מאזינים לאירועי גרירה רגילים -----
  function handleDragStart(e) {
    // לא צריך לעשות כלום, רק לוג
    if (isGroupDragging) {
      log("Native dragstart during group drag");
    }
  }
  
  function handleDragEnd(e) {
    // לא צריך לעשות כלום, רק לוג
    if (isGroupDragging) {
      log("Native dragend during group drag");
      handleGroupDragEnd();
    }
  }
  
  // ----- מציאת אלמנט בלוק תכנות -----
  function findBlockElement(element) {
    // עלה בעץ ה-DOM עד שתמצא בלוק או תגיע לשורש
    let current = element;
    
    while (current && current !== document.body) {
      // בדוק אם זה בלוק תכנות באזור התכנות
      if (current.classList && 
          current.classList.contains('block-container') && 
          current.closest('#program-blocks')) {
        return current;
      }
      current = current.parentElement;
    }
    
    return null;
  }
  
  // ----- מציאת שרשרת בלוקים מלאה -----
  function findCompleteBlockChain(startBlock) {
    if (!startBlock) return [];
    
    const chain = [startBlock];
    let currentBlock = startBlock;
    let chainLength = 1;
    
    // מצא בלוקים לשמאל (בלוקים שהבלוק הנוכחי מחובר אליהם)
    while (currentBlock.hasAttribute('data-connected-to') && 
           chainLength < CONFIG.CHAIN_BLOCKS_MAX) {
      
      const connDirection = currentBlock.getAttribute('data-connection-direction');
      const connectedId = currentBlock.getAttribute('data-connected-to');
      
      // רק אם החיבור הוא לצד שמאל
      if (connDirection === 'left' && connectedId) {
        const leftBlock = document.getElementById(connectedId);
        
        if (leftBlock) {
          // הוסף בהתחלה כדי לשמור על סדר נכון
          chain.unshift(leftBlock);
          chainLength++;
          currentBlock = leftBlock;
          continue;
        }
      }
      
      break;
    }
    
    // אפס את הבלוק הנוכחי בחזרה לבלוק ההתחלתי
    currentBlock = startBlock;
    
    // מצא בלוקים לימין (בלוקים שמחוברים אל הבלוק הנוכחי)
    while (currentBlock.hasAttribute('data-connected-from-right') &&
           chainLength < CONFIG.CHAIN_BLOCKS_MAX) {
      
      const rightBlockId = currentBlock.getAttribute('data-connected-from-right');
      
      if (rightBlockId) {
        const rightBlock = document.getElementById(rightBlockId);
        
        if (rightBlock) {
          // הוסף בסוף
          chain.push(rightBlock);
          chainLength++;
          currentBlock = rightBlock;
          continue;
        }
      }
      
      break;
    }
    
    return chain;
  }
  
  // ----- הוספת כפתור בדיקה (רק במצב דיבוג) -----
  function addDebugButton() {
    if (!CONFIG.DEBUG) return;
    
    const button = document.createElement('button');
    button.textContent = 'Test Chains';
    button.style.cssText = 'position:fixed;bottom:10px;right:10px;z-index:9999;padding:8px 12px;background:#2196F3;color:white;border:none;border-radius:4px;font-family:Arial,sans-serif;cursor:pointer;';
    
    button.addEventListener('click', () => {
      const blocks = $$('#program-blocks .block-container');
      let foundChains = 0;
      
      blocks.forEach(block => {
        const chain = findCompleteBlockChain(block);
        if (chain.length > 1) {
          console.log(`%cBlock ${block.id || 'unknown'} has chain of ${chain.length} blocks:`, 'color:#4CAF50;font-weight:bold');
          console.log(chain.map(b => b.id || 'unknown').join(' -> '));
          foundChains++;
        }
      });
      
      if (foundChains === 0) {
        console.log("%cNo block chains found", "color:#F44336;font-weight:bold");
      } else {
        console.log(`%cFound ${foundChains} unique block chains`, "color:#2196F3;font-weight:bold");
      }
      
      showStatusOverlay(`Found ${foundChains} chains`, 3000);
    });
    
    document.body.appendChild(button);
  }
  
  // ----- התחל את האתחול -----
  function startInit() {
    // המתן זמן מסוים לפני האתחול הראשוני
    setTimeout(() => {
      initGroupDragging();
      
      // הוסף כפתור בדיקה במצב דיבוג
      if (CONFIG.DEBUG) {
        setTimeout(addDebugButton, 500);
      }
    }, CONFIG.WAIT_BEFORE_INIT_MS);
  }
  
  // ----- רישום פונקציות גלובליות -----
  window.groupDragFinal = {
    // אפשר להפעיל מחדש את המודול
    reinit: function() {
      window.groupDraggingFinalInitialized = false;
      initGroupDragging();
      return "Reinitialized";
    },
    
    // לבדוק מצב נוכחי
    status: function() {
      return {
        initialized: !!window.groupDraggingFinalInitialized,
        running: isRunning,
        dragging: isGroupDragging,
        chainLength: blockChain.length
      };
    },
    
    // להפעיל או לכבות
    toggle: function() {
      isRunning = !isRunning;
      showStatusOverlay(`Group dragging ${isRunning ? 'enabled' : 'disabled'}`);
      return isRunning;
    },
    
    // לבטל גרירה קבוצתית באופן יזום
    cancelDrag: function() {
      if (isGroupDragging) {
        handleGroupDragEnd();
        return "Drag cancelled";
      }
      return "No active drag";
    },
    
    // לשנות קונפיגורציה
    setConfig: function(key, value) {
      if (key in CONFIG) {
        CONFIG[key] = value;
        return `Config ${key} set to ${value}`;
      }
      return `Unknown config key: ${key}`;
    }
  };
  
  // התחל אתחול כשהמסמך מוכן
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startInit);
  } else {
    startInit();
  }
})();

// --- END FINAL GROUP DRAGGING v3.0 ---
