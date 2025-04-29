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
// --- RELIABLE GROUP DRAGGING v4.0 ---
// פתרון מהימן לגרירת קבוצות בלוקים עם תמיכה בגרירה חוזרת

(function() {
  // --- קונפיגורציה ---
  const CONFIG = {
    DEBUG: true,                    // הצג הודעות דיבוג בקונסול
    CHECK_INTERVAL_MS: 16,          // תדירות בדיקת מיקום (כ-60 פעמים בשנייה)
    MIN_DRAG_THRESHOLD_PX: 3,       // מרחק מינימלי לזיהוי גרירה בפיקסלים
    CONNECTION_POINTS_HIDE: true,   // האם להסתיר נקודות חיבור בזמן גרירה
    RESET_DELAY_MS: 500,            // זמן המתנה לאיפוס מלא אחרי גרירה
    MAX_CHAIN_LENGTH: 30,           // מקסימום בלוקים בשרשרת
    FORCE_POSITION_UPDATE: true,    // עדכון מאולץ של מיקום בסוף גרירה
    STATUS_OVERLAY: true,           // הצג חלונית סטטוס
    WAIT_BEFORE_INIT_MS: 1000       // זמן המתנה לפני אתחול
  };
  
  // --- משתנים גלובליים ---
  let active = false;                // האם הרכיב פעיל
  let dragging = false;              // האם גרירה פעילה
  let mainBlock = null;              // הבלוק המוביל בגרירה
  let blockChain = [];               // כל הבלוקים בשרשרת
  let blockData = [];                // נתוני מיקום הבלוקים
  let mainBlockStartPos = null;      // מיקום התחלתי של הבלוק הראשי
  let mainBlockLastPos = null;       // מיקום אחרון של הבלוק הראשי
  let trackingTimer = null;          // טיימר מעקב אחר תנועת הבלוק
  let resetTimer = null;             // טיימר איפוס אחרי גרירה
  let droppedByUser = false;         // האם הגרירה הסתיימה ביוזמת המשתמש
  let originalClasses = new Map();   // מפה לשמירת המחלקות המקוריות
  let startTime = 0;                 // זמן התחלת הגרירה
  
  // --- פונקציות לוג ---
  function log(...args) {
    if (CONFIG.DEBUG) console.log("[ReliableDrag]", ...args);
  }
  
  function warn(...args) {
    console.warn("[ReliableDrag]", ...args);
  }
  
  // --- אתחול המערכת ---
  function init() {
    // בדוק אם כבר אותחל
    if (window.reliableGroupDragInitialized) {
      log("Already initialized");
      return;
    }
    
    log("Initializing reliable group dragging v4.0");
    
    // הוסף סגנונות CSS
    addStyles();
    
    // התקן מאזינים גלובליים לאירועי עכבר
    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('mouseup', onMouseUp, true);
    
    // סמן כפעיל
    active = true;
    window.reliableGroupDragInitialized = true;
    
    log("Initialization complete");
    showMessage("Group Dragging Ready");
  }
  
  // --- הוספת סגנונות CSS ---
  function addStyles() {
    // בדוק אם הסגנונות כבר הוספו
    if (document.getElementById('reliable-group-drag-styles')) return;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'reliable-group-drag-styles';
    styleEl.textContent = `
      /* סגנונות בלוקים בגרירה */
      .rgd-chain-block {
        transition: none !important;
        box-shadow: 0 0 0 1px rgba(76, 175, 80, 0.5) !important;
      }
      
      .rgd-main-block {
        box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.8) !important;
      }
      
      /* הסתרת נקודות חיבור */
      .rgd-hide-connections .right-connection-point,
      .rgd-hide-connections .left-connection-point {
        display: none !important;
        opacity: 0 !important;
        pointer-events: none !important;
        animation: none !important;
      }
      
      /* חלונית סטטוס */
      #rgd-status-message {
        position: fixed;
        bottom: 60px;
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
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      #rgd-status-message.visible {
        opacity: 1;
      }
    `;
    
    document.head.appendChild(styleEl);
    
    // הוסף אלמנט חלונית סטטוס
    if (CONFIG.STATUS_OVERLAY) {
      const statusEl = document.createElement('div');
      statusEl.id = 'rgd-status-message';
      document.body.appendChild(statusEl);
    }
  }
  
  // --- הצגת הודעת סטטוס ---
  function showMessage(message, duration = 2000) {
    if (!CONFIG.STATUS_OVERLAY) return;
    
    const statusEl = document.getElementById('rgd-status-message');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.classList.add('visible');
    
    clearTimeout(window.statusMessageTimer);
    window.statusMessageTimer = setTimeout(() => {
      statusEl.classList.remove('visible');
    }, duration);
  }
  
  // --- טיפול באירוע לחיצת עכבר ---
  function onMouseDown(e) {
    // אם לא פעיל או לא לחיצה שמאלית, צא
    if (!active || e.button !== 0) return;
    
    // בדוק אם יש גרירה פעילה אחרת וסיים אותה
    if (dragging) {
      log("Ending previous drag session first");
      endDrag(false);
    }
    
    // מצא את הבלוק שנלחץ
    const block = findProgrammingBlock(e.target);
    if (!block) return;
    
    log("Block clicked:", block.id || "unknown");
    
    // מצא את כל הבלוקים בשרשרת
    const chain = findCompleteBlockChain(block);
    
    // אם אין מספיק בלוקים, אל תפעיל גרירה קבוצתית
    if (chain.length <= 1) {
      log("Single block - regular drag");
      return;
    }
    
    log(`Found chain with ${chain.length} blocks`);
    
    // התחל גרירה קבוצתית
    startDrag(block, chain);
  }
  
  // --- התחלת גרירה קבוצתית ---
  function startDrag(block, chain) {
    try {
      // שמור את הבלוק הראשי ואת השרשרת
      mainBlock = block;
      blockChain = chain;
      dragging = true;
      droppedByUser = false;
      startTime = Date.now();
      
      // שמור את המיקום ההתחלתי של הבלוק הראשי
      saveMainBlockPosition();
      
      // שמור את היחסים בין הבלוקים
      calculateRelativePositions();
      
      // סמן את הבלוקים ויזואלית
      markBlocks();
      
      // הסתר נקודות חיבור אם צריך
      if (CONFIG.CONNECTION_POINTS_HIDE) {
        document.body.classList.add('rgd-hide-connections');
      }
      
      // התחל לעקוב אחר תנועת הבלוק הראשי
      startTracking();
      
      showMessage(`Dragging ${chain.length} blocks`);
      log("Drag started successfully");
    } catch (err) {
      // במקרה של שגיאה, נקה הכל
      warn("Error starting drag:", err);
      cleanupDrag();
    }
  }
  
  // --- שמירת מיקום הבלוק הראשי ---
  function saveMainBlockPosition() {
    if (!mainBlock) return;
    
    // שמור את המיקום הנוכחי
    const rect = mainBlock.getBoundingClientRect();
    mainBlockStartPos = { x: rect.left, y: rect.top };
    mainBlockLastPos = { ...mainBlockStartPos };
    
    log("Saved main block position:", mainBlockStartPos);
  }
  
  // --- חישוב מיקומים יחסיים ---
  function calculateRelativePositions() {
    if (!mainBlock || !blockChain.length) return;
    
    blockData = [];
    
    // קבל מיקום ונתונים של הבלוק הראשי
    const mainRect = mainBlock.getBoundingClientRect();
    const mainLeft = parseFloat(mainBlock.style.left) || 0;
    const mainTop = parseFloat(mainBlock.style.top) || 0;
    
    // שמור מידע על כל בלוק
    blockChain.forEach(block => {
      // לסיכוך, השתמש במיקום CSS הישיר ולא ב-getBoundingClientRect
      const left = parseFloat(block.style.left) || 0;
      const top = parseFloat(block.style.top) || 0;
      
      // שמור מיקום יחסי וגם מיקום מקורי
      blockData.push({
        block: block,
        originalLeft: left,
        originalTop: top,
        relativeLeft: left - mainLeft,
        relativeTop: top - mainTop
      });
    });
    
    log("Calculated positions for", blockChain.length, "blocks");
  }
  
  // --- סימון הבלוקים ויזואלית ---
  function markBlocks() {
    if (!blockChain.length) return;
    
    // שמור את המחלקות המקוריות ואז הוסף מחלקות חדשות
    blockChain.forEach(block => {
      // שמור את המחלקות המקוריות
      originalClasses.set(block, block.className);
      
      // הוסף מחלקות לסימון
      block.classList.add('rgd-chain-block');
    });
    
    // סמן את הבלוק הראשי במיוחד
    if (mainBlock) {
      mainBlock.classList.add('rgd-main-block');
    }
  }
  
  // --- התחלת מעקב אחר תנועת הבלוק הראשי ---
  function startTracking() {
    // נקה טיימר קודם אם קיים
    stopTracking();
    
    // הפעל טיימר חדש
    trackingTimer = setInterval(() => {
      if (!dragging || !mainBlock) {
        stopTracking();
        return;
      }
      
      // בדוק אם הבלוק עדיין בתוך ה-DOM
      if (!document.body.contains(mainBlock)) {
        warn("Main block removed from DOM");
        endDrag(false);
        return;
      }
      
      // בדוק אם הבלוק אינו בגרירה עוד
      if (!mainBlock.classList.contains('snap-source')) {
        // אם לא עבר מספיק זמן, ייתכן שזה רק אתחול של הגרירה
        const timeElapsed = Date.now() - startTime;
        
        if (timeElapsed < 100) {
          // כנראה עדיין בתהליך אתחול
          return;
        }
        
        // כנראה שהגרירה הסתיימה
        log("Main block is no longer being dragged");
        endDrag(false);
        return;
      }
      
      // בדוק אם הבלוק זז ועדכן את הבלוקים האחרים
      checkAndUpdatePositions();
      
    }, CONFIG.CHECK_INTERVAL_MS);
    
    log("Position tracking started");
  }
  
  // --- בדיקה ועדכון של מיקום הבלוקים ---
  function checkAndUpdatePositions() {
    if (!mainBlock || !blockData.length) return;
    
    // קבל את המיקום הנוכחי של הבלוק הראשי
    const mainLeft = parseFloat(mainBlock.style.left) || 0;
    const mainTop = parseFloat(mainBlock.style.top) || 0;
    
    // חשב את השינוי מהמיקום האחרון
    const rect = mainBlock.getBoundingClientRect();
    const deltaRectX = rect.left - mainBlockLastPos.x;
    const deltaRectY = rect.top - mainBlockLastPos.y;
    
    // עדכן את המיקום האחרון
    mainBlockLastPos = { x: rect.left, y: rect.top };
    
    // אם התזוזה קטנה מדי, אל תעדכן
    if (Math.abs(deltaRectX) < CONFIG.MIN_DRAG_THRESHOLD_PX && 
        Math.abs(deltaRectY) < CONFIG.MIN_DRAG_THRESHOLD_PX) {
      return;
    }
    
    // עדכן את מיקום כל הבלוקים חוץ מהראשי
    blockData.forEach(data => {
      if (data.block === mainBlock) return;
      
      // וודא שהבלוק עדיין בDOM
      if (!document.body.contains(data.block)) return;
      
      // עדכן את המיקום
      data.block.style.position = 'absolute';
      data.block.style.left = Math.round(mainLeft + data.relativeLeft) + 'px';
      data.block.style.top = Math.round(mainTop + data.relativeTop) + 'px';
    });
  }
  
  // --- עצירת מעקב ---
  function stopTracking() {
    if (trackingTimer) {
      clearInterval(trackingTimer);
      trackingTimer = null;
    }
  }
  
  // --- סיום גרירה ---
  function endDrag(byUser = false) {
    if (!dragging) return;
    
    log("Ending drag, triggered by", byUser ? "user" : "system");
    droppedByUser = byUser;
    
    // עצור מעקב
    stopTracking();
    
    // אם יש עדכון אחרון נדרש
    if (CONFIG.FORCE_POSITION_UPDATE) {
      // וודא שכל הבלוקים במקום הנכון
      checkAndUpdatePositions();
    }
    
    // החזר את נקודות החיבור אם הוסתרו
    if (CONFIG.CONNECTION_POINTS_HIDE) {
      document.body.classList.remove('rgd-hide-connections');
    }
    
    // הסר את הסימון הויזואלי
    restoreBlocks();
    
    // הגדר טיימר לניקוי סופי
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      cleanupDrag();
    }, CONFIG.RESET_DELAY_MS);
    
    // סמן שהגרירה הסתיימה
    dragging = false;
    
    // הצג הודעה
    showMessage("Drag complete", 1000);
  }
  
  // --- שחזור הבלוקים למצבם המקורי ---
  function restoreBlocks() {
    // החזר את המחלקות המקוריות לכל הבלוקים
    blockChain.forEach(block => {
      if (document.body.contains(block)) {
        block.classList.remove('rgd-chain-block', 'rgd-main-block');
        
        // החזר את המחלקות המקוריות אם נשמרו
        const originalClass = originalClasses.get(block);
        if (originalClass) {
          // אל תעשה החלפה מלאה כי ייתכן שנוספו מחלקות חדשות בינתיים
          // במקום זאת, הסר רק את המחלקות שהוספנו
        }
      }
    });
    
    // נקה את המפה
    originalClasses.clear();
  }
  
  // --- ניקוי מלא של הגרירה ---
  function cleanupDrag() {
    mainBlock = null;
    blockChain = [];
    blockData = [];
    mainBlockStartPos = null;
    mainBlockLastPos = null;
    originalClasses.clear();
    
    log("Drag cleanup complete");
  }
  
  // --- טיפול בשחרור לחצן עכבר ---
  function onMouseUp(e) {
    // אם אין גרירה פעילה, אין מה לעשות
    if (!dragging) return;
    
    log("Mouse up detected");
    endDrag(true);
  }
  
  // --- מציאת בלוק תכנות ---
  function findProgrammingBlock(element) {
    let current = element;
    
    while (current && current !== document.body) {
      if (current.classList && 
          current.classList.contains('block-container') && 
          current.closest('#program-blocks')) {
        return current;
      }
      current = current.parentElement;
    }
    
    return null;
  }
  
  // --- מציאת שרשרת בלוקים מלאה ---
  function findCompleteBlockChain(startBlock) {
    if (!startBlock) return [];
    
    // מערך לשמירת כל הבלוקים בשרשרת
    const chain = [startBlock];
    let currentBlock = startBlock;
    let chainLength = 1;
    
    // מצא בלוקים לשמאל
    while (currentBlock.hasAttribute('data-connected-to') && 
           chainLength < CONFIG.MAX_CHAIN_LENGTH) {
      
      const direction = currentBlock.getAttribute('data-connection-direction');
      const connectedId = currentBlock.getAttribute('data-connected-to');
      
      // רק אם החיבור הוא לשמאל
      if (direction === 'left' && connectedId) {
        const leftBlock = document.getElementById(connectedId);
        
        if (leftBlock) {
          // הוסף את הבלוק בתחילת המערך
          chain.unshift(leftBlock);
          chainLength++;
          currentBlock = leftBlock;
          continue;
        }
      }
      
      break;
    }
    
    // אפס לבלוק ההתחלתי
    currentBlock = startBlock;
    
    // מצא בלוקים לימין
    while (currentBlock.hasAttribute('data-connected-from-right') && 
           chainLength < CONFIG.MAX_CHAIN_LENGTH) {
      
      const rightBlockId = currentBlock.getAttribute('data-connected-from-right');
      
      if (rightBlockId) {
        const rightBlock = document.getElementById(rightBlockId);
        
        if (rightBlock) {
          // הוסף את הבלוק בסוף המערך
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
  
  // --- הוספת כפתור בדיקה (במצב דיבוג) ---
  function addDebugButton() {
    if (!CONFIG.DEBUG) return;
    
    const btn = document.createElement('button');
    btn.textContent = 'בדוק שרשראות';
    btn.style.cssText = 'position:fixed;bottom:15px;right:15px;z-index:9999;padding:8px 12px;background:#2196F3;color:white;border:none;border-radius:4px;font-family:Arial,sans-serif;font-size:14px;cursor:pointer;';
    
    btn.addEventListener('click', () => {
      const blocks = document.querySelectorAll('#program-blocks .block-container');
      let foundChains = 0;
      
      blocks.forEach(block => {
        const chain = findCompleteBlockChain(block);
        if (chain.length > 1) {
          console.log(`Block ${block.id || 'unknown'} has chain of ${chain.length} blocks`);
          console.log(chain.map(b => b.id || 'unknown').join(' -> '));
          foundChains++;
        }
      });
      
      if (foundChains === 0) {
        console.log("No chains found");
      } else {
        console.log(`Found ${foundChains} chains`);
      }
      
      showMessage(`Found ${foundChains} chains`);
    });
    
    document.body.appendChild(btn);
  }
  
  // --- חשיפת API חיצוני ---
  window.reliableGroupDrag = {
    // הפעלה מחדש של המודול
    restart: function() {
      // נקה את המצב הקודם
      endDrag(false);
      cleanupDrag();
      
      // אפס ואתחל מחדש
      window.reliableGroupDragInitialized = false;
      setTimeout(init, 100);
      
      return "Restarting...";
    },
    
    // בדיקת סטטוס
    status: function() {
      return {
        active: active,
        dragging: dragging,
        chainLength: blockChain.length,
        initialized: window.reliableGroupDragInitialized || false
      };
    },
    
    // הפעלה/כיבוי של המודול
    toggle: function() {
      active = !active;
      showMessage(`Group dragging ${active ? 'enabled' : 'disabled'}`);
      return active;
    },
    
    // ביטול גרירה
    cancelDrag: function() {
      if (dragging) {
        endDrag(false);
        return "Drag cancelled";
      }
      return "No active drag";
    }
  };
  
  // --- התחלת אתחול ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(init, CONFIG.WAIT_BEFORE_INIT_MS);
    });
  } else {
    setTimeout(init, CONFIG.WAIT_BEFORE_INIT_MS);
  }
  
  // הוסף כפתור בדיקה אם במצב דיבוג
  if (CONFIG.DEBUG) {
    setTimeout(addDebugButton, CONFIG.WAIT_BEFORE_INIT_MS + 500);
  }
})();

// --- END RELIABLE GROUP DRAGGING v4.0 ---
