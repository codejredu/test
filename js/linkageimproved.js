// --- START OF FILE linkageimproved.js ---
// --- Version 3.7: Anchor Highlighting (Requires SVG Class Fix) ---
// Changes from v3.6:
// 1. No major JS logic changes. This version reinforces the requirement
//    that the user MUST add the correct classes (`snap-anchor`, `snap-anchor-left`,
//    `snap-anchor-right`) to the designated anchor elements (e.g., <path>)
//    within each block's SVG file for highlighting to work.
// 2. Updated initialization messages.
// Core snapping logic (snap on release if highlighted during drag) remains the same.

(function() {
  // משתנים גלובליים במודול
  let currentDraggedBlock = null;
  let potentialSnapTarget = null;
  let snapDirection = null;
  let isDraggingBlock = false;
  let dragOffset = { x: 0, y: 0 };
  let snapSound = null;
  let audioContextAllowed = false;
  let soundInitialized = false;

  // קונפיגורציה - פרמטרים שניתן להתאים
  const CONFIG = {
    PIN_WIDTH: 5,
    CONNECT_THRESHOLD: 8, // סף להפעלת הדגשת נקודות עיגון וזיהוי יעד פוטנציאלי
    VERTICAL_ALIGN_THRESHOLD: 20,
    VERTICAL_OVERLAP_REQ: 0.4, // דרישה ל-40% חפיפה אנכית לפחות
    BLOCK_GAP: 0, // אין רווח - חיבור שקע-תקע
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3', // ודא שהנתיב נכון
    DEBUG: true // Set to false for production
  };

  // ========================================================================
  // הוספת סגנונות CSS - הארת נקודות עיגון צהובות (כמו ב-v3.6)
  // ========================================================================
  function addHighlightStyles() {
    if (document.getElementById('block-connection-styles')) return;
    const style = document.createElement('style');
    style.id = 'block-connection-styles';
    style.textContent = `
      /* סגנונות גרירה וניתוק */
      .snap-source { box-shadow: 0 5px 15px rgba(0,0,0,0.4) !important; transition: box-shadow 0.15s ease-out; cursor: grabbing !important; z-index: 1001 !important; }
      @keyframes snapEffect { 0%{transform:scale(1)} 35%{transform:scale(1.05)} 70%{transform:scale(0.98)} 100%{transform:scale(1)} } .snap-animation { animation:snapEffect 0.3s ease-out; }
      @keyframes detachEffect { 0%{transform:translate(0,0) rotate(0)} 30%{transform:translate(3px,1px) rotate(0.8deg)} 60%{transform:translate(-2px,2px) rotate(-0.5deg)} 100%{transform:translate(0,0) rotate(0)} } .detach-animation { animation:detachEffect 0.3s ease-in-out; }
      #detach-menu { position:absolute; background-color:white; border:1px solid #ccc; border-radius:4px; box-shadow:0 3px 8px rgba(0,0,0,0.2); z-index:1100; padding:5px; font-size:14px; min-width:100px; } #detach-menu div { padding:6px 12px; cursor:pointer; border-radius:3px; } #detach-menu div:hover { background-color:#eee; }
      body.user-select-none { user-select:none; -webkit-user-select:none; -moz-user-select:none; -ms-user-select:none; }
      .connected-block, .has-connected-block { /* Optional */ }
      #sound-test-button { position:fixed; bottom:15px; right:15px; padding:8px 12px; background-color:#2196F3; color:white; border:none; border-radius:4px; cursor:pointer; z-index:9999; font-family:Arial,sans-serif; font-size:14px; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.2); transition:background-color .2s,opacity .5s ease-out; opacity:1; } #sound-test-button:hover { background-color:#0b7dda; } #sound-test-button.success { background-color:#4CAF50; } #sound-test-button.error { background-color:#f44336; } #sound-test-button.loading { background-color:#ff9800; cursor:wait; } #sound-test-button.hidden { opacity:0; pointer-events:none; }

      /* --- סגנון להארת נקודות עיגון (דורש קלאסים ב-SVG!) --- */
      /* סגנון ברירת מחדל - אולי שקוף או משולב בעיצוב */
      .snap-anchor {
          /* fill: transparent !important; אם העיגון צריך להיות שקוף לחלוטין */
          /* stroke: none !important; */
          /* או השאר את הסגנון מה-SVG אם הוא מעוצב להיות שקוף במקור */
          transition: fill 0.1s ease-out, stroke 0.1s ease-out, opacity 0.1s ease-out;
          pointer-events: none;
      }
      /* סגנון כאשר הנקודה מודגשת */
      .snap-anchor.anchor-highlight {
          fill: #FFC107 !important; /* צהוב זוהר */
          stroke: #FFA000 !important; /* קו מתאר אופציונלי */
          stroke-width: 1px !important; /* עובי קו מתאר אופציונלי */
          fill-opacity: 1 !important; /* ודא שהוא לא שקוף */
          stroke-opacity: 1 !important; /* ודא שהוא לא שקוף */
          opacity: 1 !important; /* ודא שהוא לא שקוף */
      }
    `;
    document.head.appendChild(style);
    if (CONFIG.DEBUG) console.log('Styles added (SVG Anchor Highlight - Requires classes in SVG)');
  }

  // ========================================================================
  // אתחול אודיו, כפתור בדיקה, נגינת צליל - ללא שינוי
  // ========================================================================
  function initAudio() { if (!CONFIG.PLAY_SOUND || soundInitialized) return; try { const el=document.getElementById('snap-sound-element'); if(el){snapSound=el;soundInitialized=true;if(CONFIG.DEBUG)console.log('Audio reused.');if(!el.querySelector(`source[src="${CONFIG.SOUND_PATH}"]`)){el.innerHTML='';const s=document.createElement('source');s.src=CONFIG.SOUND_PATH;s.type='audio/mpeg';el.appendChild(s);el.load();}return;} snapSound=document.createElement('audio');snapSound.id='snap-sound-element';snapSound.preload='auto';snapSound.volume=CONFIG.SOUND_VOLUME;const s=document.createElement('source');s.src=CONFIG.SOUND_PATH;s.type='audio/mpeg';snapSound.appendChild(s);snapSound.addEventListener('error',(e)=>{console.error(`Audio Error: ${CONFIG.SOUND_PATH}`,e);const b=document.getElementById('sound-test-button');if(b){b.textContent='שגיאה';b.className='error';b.disabled=true;}CONFIG.PLAY_SOUND=false;snapSound=null;soundInitialized=false;});snapSound.addEventListener('canplaythrough',()=>{soundInitialized=true;if(CONFIG.DEBUG)console.log('Audio ready.');const b=document.getElementById('sound-test-button');if(b?.classList.contains('loading')){b.textContent='בדוק';b.classList.remove('loading');b.disabled=false;}});snapSound.style.display='none';document.body.appendChild(snapSound);if(CONFIG.DEBUG)console.log(`Audio created: ${CONFIG.SOUND_PATH}`);}catch(err){console.error('Audio init error:',err);CONFIG.PLAY_SOUND=false;snapSound=null;soundInitialized=false;}}
  function addSoundTestButton() { if(!CONFIG.PLAY_SOUND)return;try{const eb=document.getElementById('sound-test-button');if(eb)eb.remove();const b=document.createElement('button');b.id='sound-test-button';b.title='בדוק צליל';b.className='';if(!snapSound){b.textContent='שמע נכשל';b.classList.add('error');b.disabled=true;}else if(!soundInitialized){b.textContent='טוען...';b.classList.add('loading');b.disabled=true;}else{b.textContent='בדוק';b.disabled=false;}Object.assign(b.style,{position:'fixed',bottom:'15px',right:'15px',zIndex:'9999',padding:'8px 12px',color:'white',border:'none',borderRadius:'4px',cursor:'pointer',boxShadow:'0 2px 5px rgba(0,0,0,0.2)',fontFamily:'Arial,sans-serif',fontSize:'14px',fontWeight:'bold',transition:'background-color .2s,opacity .5s ease-out',opacity:'1'});b.onmouseover=function(){if(!this.disabled&&!this.classList.contains('success')&&!this.classList.contains('error'))this.style.backgroundColor='#0b7dda'};b.onmouseout=function(){if(!this.disabled&&!this.classList.contains('success')&&!this.classList.contains('error'))this.style.backgroundColor='#2196F3'};b.addEventListener('click',function(){if(this.disabled||!snapSound||!soundInitialized)return;snapSound.play().then(()=>{b.textContent='פועל ✓';b.classList.add('success');audioContextAllowed=true;setTimeout(()=>{b.classList.add('hidden');setTimeout(()=>b.remove(),500)},3000);if(snapSound){snapSound.pause();snapSound.currentTime=0;}}).catch(err=>{console.warn('Sound test fail:',err.name);if(err.name==='NotAllowedError'){b.textContent='חסום-לחץ';b.classList.add('error');audioContextAllowed=false;}else{b.textContent='שגיאה';b.classList.add('error');b.disabled=true;}});});document.body.appendChild(b);if(CONFIG.DEBUG)console.log('Sound test button added.');}catch(err){console.error('Err adding sound btn:',err);}}
  function playSnapSound() { if(!CONFIG.PLAY_SOUND||!snapSound||!soundInitialized)return;if(!audioContextAllowed&&CONFIG.DEBUG)console.warn('Playing sound before user interaction.');try{if(snapSound.readyState<3){if(CONFIG.DEBUG)console.log('Snap sound skip: audio not ready.');return;}snapSound.pause();snapSound.currentTime=0;const pp=snapSound.play();if(pp!==undefined){pp.then(()=>{audioContextAllowed=true;if(CONFIG.DEBUG>1)console.log('Snap sound played.');}).catch(err=>{if(err.name==='NotAllowedError'){console.warn('Snap sound blocked.');audioContextAllowed=false;if(!document.getElementById('sound-test-button'))addSoundTestButton();}else if(err.name!=='AbortError'){console.error('Err play snap sound:',err);}});}}catch(err){console.error('Unexpected play sound err:',err);}}

  // ========================================================================
  // מאזינים, זיהוי בלוקים, קליק ימני, MouseDown - ללא שינוי
  // ========================================================================
  function initProgrammingAreaListeners() { const a=document.getElementById('program-blocks');if(!a)return;a.addEventListener('dragover',(e)=>e.preventDefault());a.addEventListener('dragstart',(e)=>{if(e.target?.closest?.('#program-blocks .block-container'))e.preventDefault();}); }
  function observeNewBlocks() { const a=document.getElementById('program-blocks');if(!a)return;const o=new MutationObserver((m)=>{m.forEach((mu)=>{if(mu.type==='childList'){mu.addedNodes.forEach((n)=>{if(n.nodeType===1){let b=n.classList?.contains('block-container')?n:n.querySelector?.('.block-container');if(b?.closest('#program-blocks')){if(!b.id)generateUniqueId(b);addBlockDragListeners(b);}}});}});});o.observe(a,{childList:true,subtree:true});if(CONFIG.DEBUG)console.log("MutationObserver watching."); }
  function initExistingBlocks() { document.querySelectorAll('#program-blocks .block-container').forEach(b=>{if(!b.id)generateUniqueId(b);addBlockDragListeners(b);});if(CONFIG.DEBUG)console.log("Listeners added to existing blocks."); }
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
  // טיפול בשחרור העכבר (MouseUp) - קפיצה להצמדה אם היה מודגש - ללא שינוי
  // ========================================================================
  function handleMouseUp(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    const blockReleased = currentDraggedBlock;
    const candidateTarget = potentialSnapTarget;
    const candidateDirection = snapDirection;

    if (CONFIG.DEBUG) console.log(`[MouseUp] Releasing block ${blockReleased.id}. Candidate from move: ${candidateTarget?.id || 'none'}, direction: ${candidateDirection || 'none'}`);

    // --- ניקוי מיידי של מצב הגרירה וההדגשות ---
    isDraggingBlock = false;
    currentDraggedBlock = null;
    potentialSnapTarget = null;
    snapDirection = null;
    document.body.classList.remove('user-select-none');
    blockReleased.classList.remove('snap-source');
    blockReleased.style.zIndex = '';
    clearAllAnchorHighlights(); // ניקוי הדגשות עיגון
    // --- סוף ניקוי ---

    // --- החלטה על הצמדה - מבוססת רק על אם היה מועמד במהלך הגרירה ---
    let performSnap = false;
    if (candidateTarget && candidateDirection && document.body.contains(candidateTarget)) {
        if (CONFIG.DEBUG) console.log(`[MouseUp] Candidate target ${candidateTarget.id} identified during drag. Attempting snap.`);
        performSnap = true;
    } else {
        if (CONFIG.DEBUG) console.log(`[MouseUp] No valid candidate target identified during drag, or target disappeared. No snap attempt.`);
    }

    // --- בצע את ההצמדה אם הוחלט כך ---
    if (performSnap) {
      const snapSuccess = performBlockSnap(blockReleased, candidateTarget, candidateDirection);
      if (!snapSuccess) {
          blockReleased.draggable = true;
          if (CONFIG.DEBUG) console.log(`[MouseUp] Snap attempt failed (performBlockSnap returned false). Block ${blockReleased.id} remains draggable.`);
      } else {
           if (CONFIG.DEBUG) console.log(`[MouseUp] Snap successful (block jumped to position). Block ${blockReleased.id} is connected.`);
      }
    } else {
      if (CONFIG.DEBUG) console.log(`[MouseUp] No snap performed. Block ${blockReleased.id} remains free.`);
      blockReleased.draggable = true;
    }

    if (CONFIG.DEBUG) console.log(`[MouseUp] ----- End MouseUp for ${blockReleased.id} -----`);
  }

  // ========================================================================
  // בדיקת הצמדה והדגשת נקודות עיגון (דורש קלאסים ב-SVG)
  // ========================================================================
  function checkAndHighlightSnapPossibility() {
    if (!currentDraggedBlock) return;
    const programmingArea = document.getElementById('program-blocks'); if (!programmingArea) return;
    const sourceRect = currentDraggedBlock.getBoundingClientRect();
    const allVisibleBlocks = Array.from(programmingArea.querySelectorAll('.block-container:not(.snap-source)'))
                                  .filter(block => block.offsetParent !== null);
    let bestTarget = null; let bestDirection = null;
    let minDistance = CONFIG.CONNECT_THRESHOLD + 1;

    // --- איפוס הדגשות קודמות של נקודות עיגון ---
    clearAllAnchorHighlights();
    potentialSnapTarget = null; // אפס את המועמד הגלובלי
    snapDirection = null;

    for (const targetBlock of allVisibleBlocks) {
      if (!targetBlock.id) generateUniqueId(targetBlock);
      const targetRect = targetBlock.getBoundingClientRect();
      const targetConnectedLeft = targetBlock.hasAttribute('data-connected-from-left');
      const targetConnectedRight = targetBlock.hasAttribute('data-connected-from-right');

      // חישוב מידע הצמדה (מרחק וחפיפה)
      const snapInfo = calculateSnapInfo(sourceRect, targetRect);

      if (snapInfo) {
         let connectionAllowed = true;
         if (snapInfo.direction === 'left' && targetConnectedLeft) connectionAllowed = false;
         else if (snapInfo.direction === 'right' && targetConnectedRight) connectionAllowed = false;

         if (connectionAllowed && snapInfo.distance < minDistance) {
             minDistance = snapInfo.distance; bestTarget = targetBlock; bestDirection = snapInfo.direction;
         }
      }
    }

    // --- אם נמצא יעד מתאים, הדגש נקודות עיגון ---
    if (bestTarget) {
      if (CONFIG.DEBUG > 1) console.log(`[Highlight Anchors] Threshold met (${CONFIG.CONNECT_THRESHOLD}px): ${currentDraggedBlock.id} -> ${bestTarget.id} (${bestDirection}). Attempting anchor visuals.`);

      // עדכון המצב הגלובלי שישמש ב-MouseUp
      potentialSnapTarget = bestTarget;
      snapDirection = bestDirection;

      // *** הפעלת הדגשת נקודות העיגון המתאימות (דורש קלאסים ב-SVG!) ***
      highlightAnchorPoints(currentDraggedBlock, bestTarget, bestDirection);

    }
    // אם לא נמצא יעד, ההדגשות כובו באיפוס בתחילת הפונקציה
  }

  // ========================================================================
  // חישוב מידע הצמדה (מרחק וחפיפה) - ללא שינוי
  // ========================================================================
  function calculateSnapInfo(sourceRect, targetRect) {
    const topOverlap = Math.max(sourceRect.top, targetRect.top);
    const bottomOverlap = Math.min(sourceRect.bottom, targetRect.bottom);
    const verticalOverlap = Math.max(0, bottomOverlap - topOverlap);
    const minHeightReq = Math.min(sourceRect.height, targetRect.height) * CONFIG.VERTICAL_OVERLAP_REQ;
    if (verticalOverlap < minHeightReq || verticalOverlap <= 0) return null;
    let distance, direction;
    const distRightToLeft = Math.abs(sourceRect.right - targetRect.left);
    const distLeftToRight = Math.abs(sourceRect.left - targetRect.right);
    if (distRightToLeft < distLeftToRight) { distance = distRightToLeft; direction = 'left'; }
    else { distance = distLeftToRight; direction = 'right'; }
    if (distance <= CONFIG.CONNECT_THRESHOLD) {
       if (CONFIG.DEBUG > 1) console.log(`[calculateSnapInfo] Within threshold (${CONFIG.CONNECT_THRESHOLD}px): dir=${direction}, dist=${distance.toFixed(1)}`);
       return { direction, distance };
    }
    return null;
  }

  // ========================================================================
  // ביצוע ההצמדה הפיזית (כולל הקפיצה) - ללא שינוי
  // ========================================================================
  function performBlockSnap(sourceBlock, targetBlock, direction) {
    if (!sourceBlock || !targetBlock || !document.body.contains(targetBlock) || targetBlock.offsetParent === null) { console.error("[PerformSnap] Invalid block(s). Snap cancelled."); return false; }
    if ((direction === 'left' && targetBlock.hasAttribute('data-connected-from-left')) || (direction === 'right' && targetBlock.hasAttribute('data-connected-from-right'))) { console.warn(`[PerformSnap] Snap cancelled: Target ${targetBlock.id} conflict on side '${direction}' just before snap.`); return false; }
    if (CONFIG.DEBUG) console.log(`[PerformSnap] Snapping ${sourceBlock.id} to ${targetBlock.id} (${direction})`);
    try {
      const sourceRect = sourceBlock.getBoundingClientRect(); const targetRect = targetBlock.getBoundingClientRect();
      const pE = document.getElementById('program-blocks'); const pR = pE.getBoundingClientRect();
      let finalLeft = (direction === 'left') ? (targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP) : (targetRect.right + CONFIG.BLOCK_GAP);
      const finalTop = targetRect.top;
      let styleLeft = finalLeft - pR.left + pE.scrollLeft; let styleTop = finalTop - pR.top + pE.scrollTop;
      sourceBlock.style.position = 'absolute'; sourceBlock.style.left = `${Math.round(styleLeft)}px`; sourceBlock.style.top = `${Math.round(styleTop)}px`; sourceBlock.style.margin = '0';
      sourceBlock.setAttribute('data-connected-to', targetBlock.id); sourceBlock.setAttribute('data-connection-direction', direction);
      targetBlock.setAttribute(direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right', sourceBlock.id);
      sourceBlock.classList.add('connected-block'); targetBlock.classList.add('has-connected-block');
      playSnapSound();
      addSnapEffectAnimation(sourceBlock);
      sourceBlock.draggable = false;
      if (CONFIG.DEBUG) console.log(`[PerformSnap] Success. ${sourceBlock.id} pos: L=${styleLeft.toFixed(0)}, T=${styleTop.toFixed(0)}. Draggable: ${sourceBlock.draggable}`);
      return true;
    } catch (err) { console.error(`[PerformSnap] Error during snap for ${sourceBlock.id} -> ${targetBlock.id}:`, err); try { detachBlock(sourceBlock, false); } catch (derr) { console.error(`[PerformSnap] Cleanup detach error:`, derr); } sourceBlock.draggable = true; return false; }
  }

  // ========================================================================
  // פונקציות עזר להדגשת/ניקוי נקודות עיגון (כמו ב-v3.6)
  // *** חשוב: פונקציה זו תלויה בכך שהוספת את הקלאסים הנכונים ל-SVG! ***
  // ========================================================================

  /**
   * מוצא ומדגיש את נקודות העיגון המתאימות בבלוק המקור והמטרה.
   * דורש שה-SVG יכילו אלמנטים (למשל <path>) עם קלאסים:
   * `.snap-anchor.snap-anchor-left` ו- `.snap-anchor.snap-anchor-right`
   */
  function highlightAnchorPoints(sourceBlock, targetBlock, direction) {
      try {
          // *** חשוב לוודא שהבלוקים מכילים SVG מוטמע (לא <img>) ***
          if (!sourceBlock.querySelector('svg') || !targetBlock.querySelector('svg')) {
              if (CONFIG.DEBUG) console.warn("[Highlight Anchors] Source or target block doesn't contain an inline SVG element. Cannot highlight anchors.");
              return;
          }

          // מציאת נקודת העיגון בבלוק המקור (הנגרר)
          const sourceAnchorSelector = direction === 'left' ? '.snap-anchor.snap-anchor-right' : '.snap-anchor.snap-anchor-left';
          const sourceAnchor = sourceBlock.querySelector(sourceAnchorSelector);

          // מציאת נקודת העיגון בבלוק המטרה
          const targetAnchorSelector = direction === 'left' ? '.snap-anchor.snap-anchor-left' : '.snap-anchor.snap-anchor-right';
          const targetAnchor = targetBlock.querySelector(targetAnchorSelector);

          // *** האם האלמנטים נמצאו? ***
          if (sourceAnchor) {
              sourceAnchor.classList.add('anchor-highlight');
              if (CONFIG.DEBUG > 1) console.log(`[Highlight Anchors] Highlighted source anchor: ${sourceBlock.id} -> ${sourceAnchorSelector}`);
          } else if (CONFIG.DEBUG) {
              // *** זו ההודעה שראית בלוג - כי הקלאס היה חסר ב-SVG ***
              console.warn(`[Highlight Anchors] Missing source anchor SVG element (or required classes): ${sourceBlock.id} -> Looking for '${sourceAnchorSelector}'`);
          }

          if (targetAnchor) {
              targetAnchor.classList.add('anchor-highlight');
              if (CONFIG.DEBUG > 1) console.log(`[Highlight Anchors] Highlighted target anchor: ${targetBlock.id} -> ${targetAnchorSelector}`);
          } else if (CONFIG.DEBUG) {
              // *** זו ההודעה שראית בלוג - כי הקלאס היה חסר ב-SVG ***
              console.warn(`[Highlight Anchors] Missing target anchor SVG element (or required classes): ${targetBlock.id} -> Looking for '${targetAnchorSelector}'`);
          }
      } catch (err) {
          console.error("Error during anchor highlighting:", err);
      }
  }

  /**
   * מסיר את קלאס ההדגשה מכל נקודות העיגון באזור התכנות.
   */
  function clearAllAnchorHighlights() {
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;
    try {
        // חשוב: מחפש אלמנטים *בתוך* ה-SVG שיש להם את הקלאס
        const highlightedAnchors = programmingArea.querySelectorAll('svg .snap-anchor.anchor-highlight');
        highlightedAnchors.forEach(anchor => {
            anchor.classList.remove('anchor-highlight');
        });
        if (CONFIG.DEBUG > 1 && highlightedAnchors.length > 0) console.log(`[Highlight Anchors] Cleared ${highlightedAnchors.length} anchor highlights.`);
    } catch (err) {
        console.error("Error clearing anchor highlights:", err);
    }
  }

  // ========================================================================
  // פונקציות עזר נוספות - ניתוק, אנימציות, ID - ללא שינוי
  // ========================================================================
  function showDetachMenu(x,y,b){removeDetachMenu();const m=document.createElement('div');m.id='detach-menu';m.style.left=`${x}px`;m.style.top=`${y}px`;const o=document.createElement('div');o.textContent='נתק בלוק';o.onclick=(e)=>{e.stopPropagation();detachBlock(b,true);removeDetachMenu();};m.appendChild(o);document.body.appendChild(m);setTimeout(()=>{document.addEventListener('click',closeMenuOutside,{capture:true,once:true});window.addEventListener('scroll',removeDetachMenu,{capture:true,once:true});},0);}
  function closeMenuOutside(e){const m=document.getElementById('detach-menu');if(m&&!m.contains(e.target))removeDetachMenu();else if(m)setTimeout(()=>document.addEventListener('click',closeMenuOutside,{capture:true,once:true}),0);window.removeEventListener('scroll',removeDetachMenu,{capture:true});}
  function removeDetachMenu(){const m=document.getElementById('detach-menu');if(m){document.removeEventListener('click',closeMenuOutside,{capture:true});window.removeEventListener('scroll',removeDetachMenu,{capture:true});m.remove();}}
  function detachBlock(btd,animate=true){if(!btd||!btd.hasAttribute('data-connected-to'))return;const tid=btd.getAttribute('data-connected-to');const dir=btd.getAttribute('data-connection-direction');if(!tid||!dir){console.warn(`[Detach] Missing data on ${btd.id}. Clean.`);btd.removeAttribute('data-connected-to');btd.removeAttribute('data-connection-direction');btd.classList.remove('connected-block');btd.draggable=true;return;}if(CONFIG.DEBUG)console.log(`[Detach] Detaching ${btd.id} from ${tid}`);btd.removeAttribute('data-connected-to');btd.removeAttribute('data-connection-direction');btd.classList.remove('connected-block');btd.draggable=true;const tb=document.getElementById(tid);if(tb){tb.removeAttribute(dir==='left'?'data-connected-from-left':'data-connected-from-right');const hoc=tb.hasAttribute('data-connected-from-left')||tb.hasAttribute('data-connected-from-right')||tb.hasAttribute('data-connected-to');if(!hoc)tb.classList.remove('has-connected-block');}else{console.warn(`[Detach] Target ${tid} not found.`);}if(animate)addDetachEffectAnimation(btd);if(CONFIG.DEBUG)console.log(`[Detach] Finished ${btd.id}. Draggable: ${btd.draggable}`);}
  function addSnapEffectAnimation(b){b.classList.remove('snap-animation');void b.offsetWidth;b.classList.add('snap-animation');b.addEventListener('animationend',()=>b.classList.remove('snap-animation'),{once:true});}
  function addDetachEffectAnimation(b){b.classList.remove('detach-animation');void b.offsetWidth;b.classList.add('detach-animation');b.addEventListener('animationend',()=>b.classList.remove('detach-animation'),{once:true});}
  function generateUniqueId(b){if(b.id)return b.id;const p=b.dataset.type||'block';let s=Math.floor(Math.random()*10000).toString().padStart(4,'0');let id=`${p}-${s}`;let i=0;while(document.getElementById(id)&&i<10){id=`${p}-${s}-${i++}`;}if(i>=10)id=`${p}-${Date.now()}`;b.id=id;if(CONFIG.DEBUG)console.log(`Generated ID: ${id}`);return id;}

  // ========================================================================
  // אתחול המערכת כולה
  // ========================================================================
  function initializeSystem() {
    const initFlag = 'blockLinkageInitialized_v3_7'; // Version specific flag
    if (window[initFlag]) {
        if (CONFIG.DEBUG) console.log("Block linkage system v3.7 already initialized. Skipping.");
        return;
    }

    addHighlightStyles();
    initAudio();
    initProgrammingAreaListeners();
    observeNewBlocks();
    initExistingBlocks();
    initGlobalMouseListeners();

    if (CONFIG.PLAY_SOUND) { addSoundTestButton(); }

    window[initFlag] = true; // Mark as initialized
    console.log(`Block linkage system initialized (Version 3.7 - SVG Anchor Highlighting - REQUIRES SVG CLASS FIX)`);
    console.log(`Configuration: Snap Threshold=${CONFIG.CONNECT_THRESHOLD}px, Overlap=${CONFIG.VERTICAL_OVERLAP_REQ*100}%, Gap=${CONFIG.BLOCK_GAP}px, Sound=${CONFIG.PLAY_SOUND ? CONFIG.SOUND_PATH : 'Disabled'}`);
    // הדגשה חשובה למשתמש
    console.warn("REMINDER: Anchor highlighting requires adding 'snap-anchor snap-anchor-left' and 'snap-anchor snap-anchor-right' classes to the anchor elements inside your SVG files!");

  }

  // הפעל את האתחול
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
      initializeSystem(); // DOM already loaded
  }

})(); // סוף IIFE

// --- END OF FILE linkageimproved.js ---
