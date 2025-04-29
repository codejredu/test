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
// --- IMPROVED MULTI-BLOCK DRAGGING v1.1 ---
// --- STABLE GROUP DRAGGING v2.0 ---
// פתרון יציב לגרירת קבוצת בלוקים ללא מרווחים

(function() {
  // משתנים גלובליים
  let isActive = false;                // האם המודול פעיל
  let blockChain = [];                 // שרשרת הבלוקים שבגרירה
  let chainOffsets = [];               // היסטים יחסיים בין הבלוקים
  let mainBlock = null;                // הבלוק הראשי בגרירה
  let lastMainPosition = { x: 0, y: 0 }; // המיקום האחרון של הבלוק הראשי
  
  // קונפיגורציה
  const CONFIG = {
    DEBUG: false,               // מצב דיבוג - הצג הודעות בקונסול
    USE_DIRECT_POSITIONING: true, // השתמש במיקום ישיר במקום בהיסט
    EXACT_SPACING: true,        // שמירה על המרווח המדויק בין הבלוקים
    DEBOUNCE_MS: 5,             // זמן השהייה למניעת עדכונים יתר
    CHECK_INTERVAL_MS: 10       // זמן בדיקת מיקום בלוק ראשי (מילישניות)
  };
  
  // פונקציית לוג מותנית
  function log(...args) {
    if (CONFIG.DEBUG) console.log("[StableGroupDrag]", ...args);
  }
  
  // פונקציית אתחול ראשית
  function init() {
    if (window.stableGroupDragInitialized) return;
    
    log("Initializing stable group drag system");
    
    // רישום מאזינים גלובליים 
    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('mouseup', onMouseUp, true);
    
    // הוסף סגנונות CSS
    addStyles();
    
    window.stableGroupDragInitialized = true;
    log("Initialization complete");
  }
  
  // הוסף סגנונות CSS
  function addStyles() {
    const styleEl = document.createElement('style');
    styleEl.id = 'stable-group-drag-styles';
    styleEl.textContent = `
      .group-dragged {
        z-index: 999 !important;
        transition: none !important;
      }
      
      .group-dragged-main {
        z-index: 1000 !important;
      }
      
      #group-drag-status {
        position: fixed;
        bottom: 10px;
        left: 10px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 5px 10px;
        font-family: monospace;
        font-size: 12px;
        border-radius: 4px;
        z-index: 9999;
        pointer-events: none;
        display: none;
      }
    `;
    document.head.appendChild(styleEl);
    
    // הוסף אלמנט סטטוס
    if (CONFIG.DEBUG) {
      const statusEl = document.createElement('div');
      statusEl.id = 'group-drag-status';
      document.body.appendChild(statusEl);
    }
  }
  
  // עדכן את אלמנט הסטטוס (במצב דיבוג)
  function updateStatus(text) {
    if (!CONFIG.DEBUG) return;
    
    const statusEl = document.getElementById('group-drag-status');
    if (!statusEl) return;
    
    statusEl.textContent = text;
    statusEl.style.display = 'block';
    
    // הסתר אחרי 3 שניות
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }
  
  // מאזין ללחיצת עכבר
  function onMouseDown(e) {
    // אם לחיצה לא שמאלית, צא
    if (e.button !== 0) return;
    
    // נסה למצוא בלוק תכנות שנלחץ
    const block = findProgrammingBlock(e.target);
    if (!block) return;
    
    log("Block clicked:", block.id);
    
    // מצא את כל הבלוקים המחוברים
    const chain = findFullChain(block);
    
    // אם יש רק בלוק אחד, אין צורך בגרירה קבוצתית
    if (chain.length <= 1) return;
    
    log(`Found chain with ${chain.length} blocks`);
    
    // שמור את שרשרת הבלוקים
    blockChain = chain;
    mainBlock = block;
    isActive = true;
    
    // שמור את המיקום הנוכחי של הבלוק הראשי
    const rect = mainBlock.getBoundingClientRect();
    lastMainPosition = {
      x: rect.left,
      y: rect.top
    };
    
    // חשב את ההיסטים היחסיים בין הבלוקים
    calculateRelativeOffsets();
    
    // הוסף קלאס לבלוקים בשרשרת
    blockChain.forEach((b, index) => {
      b.classList.add('group-dragged');
      if (b === mainBlock) {
        b.classList.add('group-dragged-main');
      }
    });
    
    // התחל לעקוב אחר הבלוק הראשי
    startMainBlockTracking();
    
    updateStatus(`Chain: ${chain.length} blocks`);
  }
  
  // חישוב היסטים יחסיים בין הבלוקים
  function calculateRelativeOffsets() {
    chainOffsets = [];
    
    if (!CONFIG.EXACT_SPACING) {
      // גרסה רגילה - שימוש בהיסטים יחסיים פשוטים
      const mainRect = mainBlock.getBoundingClientRect();
      
      for (let i = 0; i < blockChain.length; i++) {
        const block = blockChain[i];
        const rect = block.getBoundingClientRect();
        
        chainOffsets.push({
          x: rect.left - mainRect.left,
          y: rect.top - mainRect.top
        });
      }
    } else {
      // גרסה מדויקת - שימוש במיקום אבסולוטי של הבלוקים
      // (יותר מדויק לשמירת המרווחים)
      for (let i = 0; i < blockChain.length; i++) {
        const block = blockChain[i];
        
        // קבל את המיקום הנוכחי של הבלוק
        const left = parseFloat(block.style.left) || 0;
        const top = parseFloat(block.style.top) || 0;
        
        // אם זה הבלוק הראשי, שמור את המיקום שלו כאפס
        if (block === mainBlock) {
          chainOffsets.push({ x: 0, y: 0 });
        } else {
          // חשב את המיקום היחסי לבלוק הראשי
          const mainLeft = parseFloat(mainBlock.style.left) || 0;
          const mainTop = parseFloat(mainBlock.style.top) || 0;
          
          chainOffsets.push({
            x: left - mainLeft,
            y: top - mainTop
          });
        }
      }
    }
    
    log("Calculated offsets:", chainOffsets);
  }
  
  // התחל מעקב אחר הבלוק הראשי
  function startMainBlockTracking() {
    // נקה מעקב קודם אם קיים
    stopMainBlockTracking();
    
    // הפעל מעקב חדש
    window.blockTrackingInterval = setInterval(() => {
      if (!isActive || !mainBlock) {
        stopMainBlockTracking();
        return;
      }
      
      // בדוק אם מיקום הבלוק הראשי השתנה
      const rect = mainBlock.getBoundingClientRect();
      const newPosition = { x: rect.left, y: rect.top };
      
      // חשב את השינוי במיקום
      const deltaX = newPosition.x - lastMainPosition.x;
      const deltaY = newPosition.y - lastMainPosition.y;
      
      // אם הבלוק הראשי זז, עדכן את כל הבלוקים בשרשרת
      if (Math.abs(deltaX) > 0.5 || Math.abs(deltaY) > 0.5) {
        updateChainPosition();
        
        // עדכן את המיקום האחרון
        lastMainPosition = newPosition;
      }
    }, CONFIG.CHECK_INTERVAL_MS);
  }
  
  // עצור מעקב אחר הבלוק הראשי
  function stopMainBlockTracking() {
    if (window.blockTrackingInterval) {
      clearInterval(window.blockTrackingInterval);
      window.blockTrackingInterval = null;
    }
  }
  
  // עדכן את מיקום כל הבלוקים בשרשרת
  function updateChainPosition() {
    if (!isActive || !mainBlock || !blockChain.length) return;
    
    // קבל את המיקום הנוכחי של הבלוק הראשי
    let mainLeft, mainTop;
    
    if (CONFIG.USE_DIRECT_POSITIONING) {
      // השתמש במיקום הישיר של הבלוק
      mainLeft = parseFloat(mainBlock.style.left) || 0;
      mainTop = parseFloat(mainBlock.style.top) || 0;
    } else {
      // השתמש ב־getBoundingClientRect (פחות מדויק)
      const rect = mainBlock.getBoundingClientRect();
      const programArea = document.getElementById('program-blocks');
      const areaRect = programArea.getBoundingClientRect();
      
      mainLeft = rect.left - areaRect.left + programArea.scrollLeft;
      mainTop = rect.top - areaRect.top + programArea.scrollTop;
    }
    
    // עדכן את מיקום כל הבלוקים בשרשרת (חוץ מהבלוק הראשי)
    for (let i = 0; i < blockChain.length; i++) {
      const block = blockChain[i];
      
      // דלג על הבלוק הראשי
      if (block === mainBlock) continue;
      
      // קבל את ההיסט היחסי של הבלוק הנוכחי
      const offset = chainOffsets[i];
      
      // עדכן את המיקום
      block.style.position = 'absolute';
      block.style.left = Math.round(mainLeft + offset.x) + 'px';
      block.style.top = Math.round(mainTop + offset.y) + 'px';
    }
  }
  
  // מאזין לתנועת עכבר
  function onMouseMove(e) {
    // כל הלוגיקה מטופלת בפונקציית המעקב
  }
  
  // מאזין לשחרור לחצן עכבר
  function onMouseUp(e) {
    if (!isActive) return;
    
    log("Mouse up - ending group drag");
    
    // נקה את הקלאסים מהבלוקים
    blockChain.forEach(block => {
      block.classList.remove('group-dragged', 'group-dragged-main');
    });
    
    // נקה את המשתנים
    isActive = false;
    blockChain = [];
    chainOffsets = [];
    mainBlock = null;
    
    // עצור את המעקב אחר הבלוק הראשי
    stopMainBlockTracking();
    
    updateStatus("Group drag ended");
  }
  
  // מצא בלוק תכנות
  function findProgrammingBlock(element) {
    let current = element;
    
    // חפש את הבלוק הקרוב ביותר
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
  
  // מצא שרשרת בלוקים מחוברים מלאה
  function findFullChain(startBlock) {
    if (!startBlock) return [];
    
    const chain = [startBlock];
    let currentBlock = startBlock;
    
    // מצא בלוקים לשמאל
    while (true) {
      // בדוק אם הבלוק הנוכחי מחובר לבלוק אחר משמאל
      if (currentBlock.hasAttribute('data-connected-to') && 
          currentBlock.getAttribute('data-connection-direction') === 'left') {
        
        const connectedToId = currentBlock.getAttribute('data-connected-to');
        const leftBlock = document.getElementById(connectedToId);
        
        if (leftBlock) {
          chain.unshift(leftBlock);
          currentBlock = leftBlock;
          continue;
        }
      }
      
      break;
    }
    
    // אפס את הבלוק הנוכחי חזרה לבלוק ההתחלתי
    currentBlock = startBlock;
    
    // מצא בלוקים לימין
    while (true) {
      // בדוק אם יש בלוק מחובר מימין
      if (currentBlock.hasAttribute('data-connected-from-right')) {
        const rightBlockId = currentBlock.getAttribute('data-connected-from-right');
        const rightBlock = document.getElementById(rightBlockId);
        
        if (rightBlock) {
          chain.push(rightBlock);
          currentBlock = rightBlock;
          continue;
        }
      }
      
      break;
    }
    
    return chain;
  }
  
  // פונקציית עזר: הוסף כפתור בדיקה למצב פיתוח
  function addDebugButton() {
    if (!CONFIG.DEBUG) return;
    
    const button = document.createElement('button');
    button.textContent = 'Test Chains';
    button.style.cssText = 'position:fixed;bottom:10px;right:10px;z-index:9999;padding:5px 10px;';
    
    button.addEventListener('click', () => {
      const blocks = document.querySelectorAll('#program-blocks .block-container');
      blocks.forEach(block => {
        const chain = findFullChain(block);
        if (chain.length > 1) {
          console.log(`Block ${block.id} has chain of ${chain.length} blocks:`, 
            chain.map(b => b.id).join(' -> '));
        }
      });
    });
    
    document.body.appendChild(button);
  }
  
  // התחל אתחול
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 800));
  } else {
    setTimeout(init, 800);
  }
  
  // הוסף כפתור דיבוג אם מצב דיבוג מופעל
  if (CONFIG.DEBUG) {
    setTimeout(addDebugButton, 1000);
  }
  
  // חשוף את הפונקציות לחלון הגלובלי
  window.stableGroupDrag = {
    updateOffsets: function() {
      if (isActive && mainBlock) {
        calculateRelativeOffsets();
        updateChainPosition();
        return true;
      }
      return false;
    },
    
    showStatus: function(text) {
      updateStatus(text);
    },
    
    toggleDebug: function() {
      CONFIG.DEBUG = !CONFIG.DEBUG;
      return CONFIG.DEBUG;
    }
  };
})();

// --- END STABLE GROUP DRAGGING v2.0 ---
