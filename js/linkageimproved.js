// --- START OF FILE linkageimproved.js ---
// --- Version 3.8: Precise External Marker Positioning ---
// Changes from v3.7:
// 1. Added EXTERNAL_MARKER_CONN_HEIGHT and EXTERNAL_MARKER_CONN_OFFSET_Y to CONFIG.
// 2. Modified addExternalMarker to position the fallback marker based on these values, aiming for socket/protrusion center.
// 3. Adjusted CSS for external markers accordingly.

(function() {
  // ... (משתנים גלובליים ללא שינוי) ...
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
    CONNECT_THRESHOLD: 8,
    PROXIMITY_HIGHLIGHT_THRESHOLD: 40,
    VERTICAL_ALIGN_THRESHOLD: 20,
    VERTICAL_OVERLAP_REQ: 0.4,
    BLOCK_GAP: 0,
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3',
    DEBUG: true,
    HIGHLIGHT_COLOR: '#FFC107',
    HIGHLIGHT_OPACITY: '0.5',
    // *** חדש: קונפיגורציה למיקום סמן חיצוני ***
    EXTERNAL_MARKER_CONN_HEIGHT: 20, // גובה מוערך של שקע/תקע ב-px
    EXTERNAL_MARKER_CONN_OFFSET_Y: 10 // מרחק מוערך מקצה עליון של בלוק לתחילת שקע/תקע ב-px
  };

  // ========================================================================
  // הוספת סגנונות CSS - שינוי סגנון סמן חיצוני
  // ========================================================================
  function addHighlightStyles() {
    if (document.getElementById('block-connection-styles')) return;
    const style = document.createElement('style');
    style.id = 'block-connection-styles';
    style.textContent = `
      /* ... (סגנונות קודמים ללא שינוי) ... */
      .snap-source { /* ... */ }
      .connection-point-highlight { /* ... */ }
      /* @keyframes pulseSVGAnchor { ... } */

      /* סמן חיצוני למקרה שאין נקודות עיגון SVG */
      .svg-anchor-marker {
        position: absolute;
        width: 12px; /* גודל הנקודה */
        height: 12px;
        border-radius: 50%;
        background-color: rgba(255, 193, 7, 0.6);
        border: 2px solid ${CONFIG.HIGHLIGHT_COLOR};
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease-out, top 0.1s ease-out, transform 0.1s ease-out; /* הוספת transition למיקום */
        z-index: 1002;
        box-shadow: 0 0 8px 2px rgba(255,193,7,0.4);
        /* top ו-transform יוגדרו ע"י JS */
      }

      .marker-left {
        left: 0px;
        /* transform: translate(-50%, 0); יוגדר ע"י JS */
      }

      .marker-right {
        right: 0px;
        /* transform: translate(50%, 0); יוגדר ע"י JS */
      }

      .marker-visible {
        opacity: 1;
      }

      /* ... (סגנונות אנימציה, תפריט וכו' ללא שינוי) ... */
      /* @keyframes snapEffect { ... } */
      /* .snap-animation { ... } */
      /* @keyframes detachEffect { ... } */
      /* .detach-animation { ... } */
      /* #detach-menu { ... } */
      /* #detach-menu div { ... } */
      /* body.user-select-none { ... } */
      /* .connected-block, .has-connected-block { ... } */
      /* #sound-test-button { ... } */
    `;
    document.head.appendChild(style);
    if (CONFIG.DEBUG) console.log('Styles added (Precise External Marker)');
  }

  // ========================================================================
  // אתחול אודיו, כפתור בדיקה, נגינת צליל - ללא שינוי
  // ========================================================================
  function initAudio() { /* ... קוד זהה ... */ if (!CONFIG.PLAY_SOUND || soundInitialized) return; try { const el=document.getElementById('snap-sound-element'); if(el){snapSound=el;soundInitialized=true;if(CONFIG.DEBUG)console.log('Audio reused.');if(!el.querySelector(`source[src="${CONFIG.SOUND_PATH}"]`)){el.innerHTML='';const s=document.createElement('source');s.src=CONFIG.SOUND_PATH;s.type='audio/mpeg';el.appendChild(s);el.load();}return;} snapSound=document.createElement('audio');snapSound.id='snap-sound-element';snapSound.preload='auto';snapSound.volume=CONFIG.SOUND_VOLUME;const s=document.createElement('source');s.src=CONFIG.SOUND_PATH;s.type='audio/mpeg';snapSound.appendChild(s);snapSound.addEventListener('error',(e)=>{console.error(`Audio Error: ${CONFIG.SOUND_PATH}`,e);const b=document.getElementById('sound-test-button');if(b){b.textContent='שגיאה';b.className='error';b.disabled=true;}CONFIG.PLAY_SOUND=false;snapSound=null;soundInitialized=false;});snapSound.addEventListener('canplaythrough',()=>{soundInitialized=true;if(CONFIG.DEBUG)console.log('Audio ready.');const b=document.getElementById('sound-test-button');if(b?.classList.contains('loading')){b.textContent='בדוק';b.classList.remove('loading');b.disabled=false;}});snapSound.style.display='none';document.body.appendChild(snapSound);if(CONFIG.DEBUG)console.log(`Audio created: ${CONFIG.SOUND_PATH}`);}catch(err){console.error('Audio init error:',err);CONFIG.PLAY_SOUND=false;snapSound=null;soundInitialized=false;}}
  function addSoundTestButton() { /* ... קוד זהה ... */ if(!CONFIG.PLAY_SOUND)return;try{const eb=document.getElementById('sound-test-button');if(eb)eb.remove();const b=document.createElement('button');b.id='sound-test-button';b.title='בדוק צליל';b.className='';if(!snapSound){b.textContent='שמע נכשל';b.classList.add('error');b.disabled=true;}else if(!soundInitialized){b.textContent='טוען...';b.classList.add('loading');b.disabled=true;}else{b.textContent='בדוק';b.disabled=false;}Object.assign(b.style,{position:'fixed',bottom:'15px',right:'15px',zIndex:'9999',padding:'8px 12px',color:'white',border:'none',borderRadius:'4px',cursor:'pointer',boxShadow:'0 2px 5px rgba(0,0,0,0.2)',fontFamily:'Arial,sans-serif',fontSize:'14px',fontWeight:'bold',transition:'background-color .2s,opacity .5s ease-out',opacity:'1'});b.onmouseover=function(){if(!this.disabled&&!this.classList.contains('success')&&!this.classList.contains('error'))this.style.backgroundColor='#0b7dda'};b.onmouseout=function(){if(!this.disabled&&!this.classList.contains('success')&&!this.classList.contains('error'))this.style.backgroundColor='#2196F3'};b.addEventListener('click',function(){if(this.disabled||!snapSound||!soundInitialized)return;snapSound.play().then(()=>{b.textContent='פועל ✓';b.classList.add('success');audioContextAllowed=true;setTimeout(()=>{b.classList.add('hidden');setTimeout(()=>b.remove(),500)},3000);if(snapSound){snapSound.pause();snapSound.currentTime=0;}}).catch(err=>{console.warn('Sound test fail:',err.name);if(err.name==='NotAllowedError'){b.textContent='חסום-לחץ';b.classList.add('error');audioContextAllowed=false;}else{b.textContent='שגיאה';b.classList.add('error');b.disabled=true;}});});document.body.appendChild(b);if(CONFIG.DEBUG)console.log('Sound test button added.');}catch(err){console.error('Err adding sound btn:',err);}}
  function playSnapSound() { /* ... קוד זהה ... */ if(!CONFIG.PLAY_SOUND||!snapSound||!soundInitialized)return;if(!audioContextAllowed&&CONFIG.DEBUG)console.warn('Playing sound before user interaction.');try{if(snapSound.readyState<3){if(CONFIG.DEBUG)console.log('Snap sound skip: audio not ready.');return;}snapSound.pause();snapSound.currentTime=0;const pp=snapSound.play();if(pp!==undefined){pp.then(()=>{audioContextAllowed=true;if(CONFIG.DEBUG>1)console.log('Snap sound played.');}).catch(err=>{if(err.name==='NotAllowedError'){console.warn('Snap sound blocked.');audioContextAllowed=false;if(!document.getElementById('sound-test-button'))addSoundTestButton();}else if(err.name!=='AbortError'){console.error('Err play snap sound:',err);}});}}catch(err){console.error('Unexpected play sound err:',err);}}

  // ========================================================================
  // איתור והדגשת נקודות עיגון בתוך ה-SVG - ללא שינוי
  // ========================================================================
  function findSVGConnectionPoints(block, direction) { /* ... קוד זהה ... */ if (!block) return null;const svg = block.querySelector('svg');if (!svg) {if (CONFIG.DEBUG > 1) console.log(`No SVG found in block ${block.id}`);return null;}let svgElements = [];try {if (direction === 'left') {svgElements = Array.from(svg.querySelectorAll('path, circle, ellipse, rect')).filter(el => {const bbox = el.getBBox();const svgWidth = svg.viewBox.baseVal.width || svg.width.baseVal.value;const relativeX = bbox.x / svgWidth;return relativeX <= 0.2;});} else if (direction === 'right') {svgElements = Array.from(svg.querySelectorAll('path, circle, ellipse, rect')).filter(el => {const bbox = el.getBBox();const svgWidth = svg.viewBox.baseVal.width || svg.width.baseVal.value;const relativeRight = (bbox.x + bbox.width) / svgWidth;return relativeRight >= 0.8;});}} catch (err) {console.error(`Error finding SVG elements for ${direction} side:`, err);}if (CONFIG.DEBUG > 1) console.log(`Found ${svgElements.length} potential ${direction} connection points in block ${block.id}`);return svgElements.length > 0 ? svgElements : null;}
  function highlightSVGConnectionPoints(block, direction) { /* ... קוד זהה ... */ if (!block) return false;const connectionPoints = findSVGConnectionPoints(block, direction);if (!connectionPoints || connectionPoints.length === 0) {addExternalMarker(block, direction);return false;}connectionPoints.forEach(element => {if (!element.hasAttribute('data-original-fill')) {element.setAttribute('data-original-fill', element.getAttribute('fill') || 'none');element.setAttribute('data-original-opacity', element.getAttribute('fill-opacity') || '1');if (!element.hasAttribute('data-original-stroke')) { element.setAttribute('data-original-stroke', element.getAttribute('stroke') || 'none'); }if (!element.hasAttribute('data-original-stroke-width')) { element.setAttribute('data-original-stroke-width', element.getAttribute('stroke-width') || '0'); }}element.setAttribute('fill', CONFIG.HIGHLIGHT_COLOR);element.setAttribute('fill-opacity', CONFIG.HIGHLIGHT_OPACITY);element.setAttribute('stroke', CONFIG.HIGHLIGHT_COLOR);element.setAttribute('stroke-width', '2');element.classList.add('connection-point-highlight');});return true;}
  function clearAllSVGHighlights() { /* ... קוד זהה ... */ document.querySelectorAll('.connection-point-highlight').forEach(element => {element.classList.remove('connection-point-highlight');if (element.hasAttribute('data-original-fill')) {const originalFill = element.getAttribute('data-original-fill');if (originalFill === 'none') {element.removeAttribute('fill');} else {element.setAttribute('fill', originalFill);}element.removeAttribute('data-original-fill');}if (element.hasAttribute('data-original-opacity')) {const originalOpacity = element.getAttribute('data-original-opacity');if (originalOpacity === '1') { element.removeAttribute('fill-opacity'); } else { element.setAttribute('fill-opacity', originalOpacity); }element.removeAttribute('data-original-opacity');} else {element.removeAttribute('fill-opacity');}if (element.hasAttribute('data-original-stroke')) {const originalStroke = element.getAttribute('data-original-stroke');if (originalStroke === 'none') {element.removeAttribute('stroke');} else {element.setAttribute('stroke', originalStroke);}element.removeAttribute('data-original-stroke');} else {element.removeAttribute('stroke');}if (element.hasAttribute('data-original-stroke-width')) {const originalStrokeWidth = element.getAttribute('data-original-stroke-width');if (originalStrokeWidth === '0' || originalStrokeWidth === null) { element.removeAttribute('stroke-width'); } else { element.setAttribute('stroke-width', originalStrokeWidth); }element.removeAttribute('data-original-stroke-width');} else {element.removeAttribute('stroke-width');}});document.querySelectorAll('.marker-visible').forEach(marker => {marker.classList.remove('marker-visible');});}

  // ========================================================================
  // *** הוספת סמן חיצוני - שינוי מיקום ***
  // ========================================================================
  function addExternalMarker(block, direction) {
    if (!block) return;

    // בדוק אם כבר קיים סמן
    let marker = block.querySelector(`.svg-anchor-marker.marker-${direction}`);

    // חישוב מיקום אנכי משוער של מרכז החיבור
    const markerCenterY = CONFIG.EXTERNAL_MARKER_CONN_OFFSET_Y + (CONFIG.EXTERNAL_MARKER_CONN_HEIGHT / 2);

    // אם לא, צור אחד חדש
    if (!marker) {
      marker = document.createElement('div');
      marker.className = `svg-anchor-marker marker-${direction}`; // הוסף קלאס כיוון בסיסי
      block.appendChild(marker);
       if (CONFIG.DEBUG > 1) console.log(`Created external marker for ${block.id} (${direction})`);
    } else {
       if (CONFIG.DEBUG > 1) console.log(`Reusing external marker for ${block.id} (${direction})`);
    }

    // עדכן סגנונות מיקום
    marker.style.top = `${markerCenterY}px`;

    if (direction === 'left') {
      marker.style.transform = 'translate(-50%, -50%)'; // ממקם את *מרכז* הנקודה במיקום המחושב
      // marker.classList.add('marker-left'); // נוסיף למקרה הצורך אבל המיקום מוגדר כבר ע"י left:0 ב-CSS
    } else { // direction === 'right'
      marker.style.transform = 'translate(50%, -50%)'; // ממקם את *מרכז* הנקודה במיקום המחושב
      // marker.classList.add('marker-right'); // נוסיף למקרה הצורך אבל המיקום מוגדר כבר ע"י right:0 ב-CSS
    }


    // הצג את הסמן
    marker.classList.add('marker-visible');
     if (CONFIG.DEBUG > 1) console.log(`Positioned external marker at top: ${markerCenterY}px for ${block.id}`);
  }


  // ========================================================================
  // מאזינים, זיהוי בלוקים, קליק ימני, MouseDown - ללא שינוי
  // ========================================================================
  function initProgrammingAreaListeners() { /* ... קוד זהה ... */ const a=document.getElementById('program-blocks');if(!a)return;a.addEventListener('dragover',(e)=>e.preventDefault());a.addEventListener('dragstart',(e)=>{if(e.target?.closest?.('#program-blocks .block-container'))e.preventDefault();}); }
  function observeNewBlocks() { /* ... קוד זהה ... */ const a=document.getElementById('program-blocks');if(!a)return;const o=new MutationObserver((m)=>{m.forEach((mu)=>{if(mu.type==='childList'){mu.addedNodes.forEach((n)=>{if(n.nodeType===1){let b=n.classList?.contains('block-container')?n:n.querySelector?.('.block-container');if(b?.closest('#program-blocks')){if(!b.id)generateUniqueId(b);addBlockDragListeners(b);}}});}});});o.observe(a,{childList:true,subtree:true});if(CONFIG.DEBUG)console.log("MutationObserver watching."); }
  function initExistingBlocks() { /* ... קוד זהה ... */ document.querySelectorAll('#program-blocks .block-container').forEach(b=>{if(!b.id)generateUniqueId(b);addBlockDragListeners(b);});if(CONFIG.DEBUG)console.log("Listeners added to existing blocks."); }
  function addBlockDragListeners(b) { /* ... קוד זהה ... */ b.removeEventListener('mousedown',handleMouseDown);b.addEventListener('mousedown',handleMouseDown);b.removeEventListener('contextmenu',handleContextMenu);b.addEventListener('contextmenu',handleContextMenu); }
  function handleContextMenu(e) { /* ... קוד זהה ... */ e.preventDefault();const b=e.target.closest('.block-container');if(b?.hasAttribute('data-connected-to'))showDetachMenu(e.clientX,e.clientY,b); }
  function handleMouseDown(e) { /* ... קוד זהה ... */ if(e.button!==0||!e.target.closest||e.target.matches('input,button,select,textarea,a[href]'))return;const b=e.target.closest('.block-container');if(!b||!b.parentElement||b.parentElement.id!=='program-blocks')return;if(!b.id)generateUniqueId(b);e.preventDefault();b.draggable=false;if(CONFIG.DEBUG)console.log(`[MouseDown] Start drag: ${b.id}`);if(b.hasAttribute('data-connected-to'))detachBlock(b,false);const lId=b.getAttribute('data-connected-from-left');if(lId)detachBlock(document.getElementById(lId),false);const rId=b.getAttribute('data-connected-from-right');if(rId)detachBlock(document.getElementById(rId),false);currentDraggedBlock=b;isDraggingBlock=true;const r=b.getBoundingClientRect();dragOffset.x=e.clientX-r.left;dragOffset.y=e.clientY-r.top;const pE=document.getElementById('program-blocks');const pR=pE.getBoundingClientRect();if(window.getComputedStyle(b).position!=='absolute'){b.style.position='absolute';b.style.left=(r.left-pR.left+pE.scrollLeft)+'px';b.style.top=(r.top-pR.top+pE.scrollTop)+'px';}b.style.margin='0';b.style.zIndex='1001';b.classList.add('snap-source');document.body.classList.add('user-select-none'); }

  // ========================================================================
  // מאזינים גלובליים, MouseLeave, MouseMove - ללא שינוי
  // ========================================================================
  function initGlobalMouseListeners() { /* ... קוד זהה ... */ document.removeEventListener('mousemove',handleMouseMove);document.removeEventListener('mouseup',handleMouseUp);document.removeEventListener('mouseleave',handleMouseLeave);document.addEventListener('mousemove',handleMouseMove);document.addEventListener('mouseup',handleMouseUp);document.addEventListener('mouseleave',handleMouseLeave); }
  function handleMouseLeave(e) { /* ... קוד זהה ... */ if(isDraggingBlock&&e.target===document.documentElement&&!e.relatedTarget){if(CONFIG.DEBUG)console.warn("Mouse left doc during drag, mouseup.");handleMouseUp(e);} }
  function handleMouseMove(e) { /* ... קוד זהה ... */ if(!isDraggingBlock||!currentDraggedBlock)return;e.preventDefault();const pE=document.getElementById('program-blocks');if(!pE){handleMouseUp(e);return;}const pR=pE.getBoundingClientRect();let nL=e.clientX-pR.left-dragOffset.x+pE.scrollLeft;let nT=e.clientY-pR.top-dragOffset.y+pE.scrollTop;const bW=currentDraggedBlock.offsetWidth;const bH=currentDraggedBlock.offsetHeight;const sW=pE.scrollWidth;const sH=pE.scrollHeight;nL=Math.max(0,Math.min(nL,sW-bW));nT=Math.max(0,Math.min(nT,sH-bH));currentDraggedBlock.style.left=Math.round(nL)+'px';currentDraggedBlock.style.top=Math.round(nT)+'px';checkAndHighlightSnapPossibility(); }

  // ========================================================================
  // בדיקת הצמדה והדגשה - לוגיקה ללא שינוי (מגרסה 3.7)
  // ========================================================================
  function checkAndHighlightSnapPossibility() { /* ... קוד זהה מגרסה 3.7 ... */ if (!currentDraggedBlock) return;const programmingArea = document.getElementById('program-blocks');if (!programmingArea) return;const sourceRect = currentDraggedBlock.getBoundingClientRect();const allVisibleBlocks = Array.from(programmingArea.querySelectorAll('.block-container:not(.snap-source)')).filter(block => block.offsetParent !== null);let closestHighlightTarget = null;let highlightDirection = null;let minHighlightDistance = CONFIG.PROXIMITY_HIGHLIGHT_THRESHOLD + 1;let bestSnapTarget = null;let bestSnapDirection = null;let minSnapDistance = CONFIG.CONNECT_THRESHOLD + 1;clearAllSVGHighlights();potentialSnapTarget = null;snapDirection = null;for (const targetBlock of allVisibleBlocks) {if (!targetBlock.id) generateUniqueId(targetBlock);const targetRect = targetBlock.getBoundingClientRect();const targetConnectedLeft = targetBlock.hasAttribute('data-connected-from-left');const targetConnectedRight = targetBlock.hasAttribute('data-connected-from-right');const topOverlap = Math.max(sourceRect.top, targetRect.top);const bottomOverlap = Math.min(sourceRect.bottom, targetRect.bottom);const verticalOverlap = Math.max(0, bottomOverlap - topOverlap);const minHeightReq = Math.min(sourceRect.height, targetRect.height) * CONFIG.VERTICAL_OVERLAP_REQ;if (verticalOverlap < minHeightReq || verticalOverlap <= 0) {continue;}const distRightToLeft = Math.abs(sourceRect.right - targetRect.left);const distLeftToRight = Math.abs(sourceRect.left - targetRect.right);let currentDistance, currentDirection;if (distRightToLeft < distLeftToRight) {currentDistance = distRightToLeft;currentDirection = 'left';} else {currentDistance = distLeftToRight;currentDirection = 'right';}let connectionAllowed = true;if (currentDirection === 'left' && targetConnectedLeft) connectionAllowed = false;else if (currentDirection === 'right' && targetConnectedRight) connectionAllowed = false;if (connectionAllowed) {if (currentDistance <= CONFIG.PROXIMITY_HIGHLIGHT_THRESHOLD) {if (currentDistance < minHighlightDistance) {minHighlightDistance = currentDistance;closestHighlightTarget = targetBlock;highlightDirection = currentDirection;}}if (currentDistance <= CONFIG.CONNECT_THRESHOLD) {if (currentDistance < minSnapDistance) {minSnapDistance = currentDistance;bestSnapTarget = targetBlock;bestSnapDirection = currentDirection;}}}}if (closestHighlightTarget) {if (CONFIG.DEBUG > 1) console.log(`[Highlight] Proximity found: ${currentDraggedBlock.id} near ${closestHighlightTarget.id} (${highlightDirection}). Dist=${minHighlightDistance.toFixed(1)}px`);try {if (highlightDirection === 'left') {highlightSVGConnectionPoints(closestHighlightTarget, 'left');highlightSVGConnectionPoints(currentDraggedBlock, 'right');} else {highlightSVGConnectionPoints(closestHighlightTarget, 'right');highlightSVGConnectionPoints(currentDraggedBlock, 'left');}} catch (err) {console.error("Error highlighting SVG connection points:", err);}}if (bestSnapTarget) {potentialSnapTarget = bestSnapTarget;snapDirection = bestSnapDirection;if (CONFIG.DEBUG > 0) console.log(`[Snap Ready] Target: ${bestSnapTarget.id}, Dir: ${bestSnapDirection}, Dist: ${minSnapDistance.toFixed(1)}px`);} else {potentialSnapTarget = null;snapDirection = null;}}

  // ========================================================================
  // טיפול בשחרור העכבר (MouseUp) - ללא שינוי (מגרסה 3.7)
  // ========================================================================
  function handleMouseUp(e) { /* ... קוד זהה מגרסה 3.7 ... */ if (!isDraggingBlock || !currentDraggedBlock) return;const blockReleased = currentDraggedBlock;const candidateTarget = potentialSnapTarget;const candidateDirection = snapDirection;if (CONFIG.DEBUG) console.log(`[MouseUp] Releasing block ${blockReleased.id}. Snap Candidate: ${candidateTarget?.id || 'none'} (${candidateDirection || 'none'})`);isDraggingBlock = false;currentDraggedBlock = null;potentialSnapTarget = null;snapDirection = null;document.body.classList.remove('user-select-none');blockReleased.classList.remove('snap-source');blockReleased.style.zIndex = '';clearAllSVGHighlights();let performSnap = false;if (candidateTarget && candidateDirection && document.body.contains(candidateTarget)) {if (CONFIG.DEBUG) console.log(`[MouseUp] Valid snap candidate ${candidateTarget.id} identified. Attempting snap.`);performSnap = true;} else {if (CONFIG.DEBUG) console.log(`[MouseUp] No valid snap candidate within CONNECT_THRESHOLD. No snap attempt.`);}if (performSnap) {const snapSuccess = performBlockSnap(blockReleased, candidateTarget, candidateDirection);if (!snapSuccess) {blockReleased.draggable = true;if (CONFIG.DEBUG) console.log(`[MouseUp] Snap attempt failed. Block ${blockReleased.id} remains draggable.`);} else {if (CONFIG.DEBUG) console.log(`[MouseUp] Snap successful. Block ${blockReleased.id} is connected.`);}} else {blockReleased.draggable = true;if (CONFIG.DEBUG) console.log(`[MouseUp] No snap performed. Block ${blockReleased.id} remains free and draggable.`);}}

  // ========================================================================
  // ביצוע ההצמדה הפיזית (כולל הקפיצה) - ללא שינוי
  // ========================================================================
  function performBlockSnap(sourceBlock, targetBlock, direction) { /* ... קוד זהה ... */ if (!sourceBlock || !targetBlock || !document.body.contains(targetBlock) || targetBlock.offsetParent === null) { console.error("[PerformSnap] Invalid block(s). Snap cancelled."); return false; }if ((direction === 'left' && targetBlock.hasAttribute('data-connected-from-left')) || (direction === 'right' && targetBlock.hasAttribute('data-connected-from-right'))) { console.warn(`[PerformSnap] Snap cancelled: Target ${targetBlock.id} conflict on side '${direction}'.`); return false; }if (CONFIG.DEBUG) console.log(`[PerformSnap] Snapping ${sourceBlock.id} to ${targetBlock.id} (${direction})`);try {const sourceRect = sourceBlock.getBoundingClientRect();const targetRect = targetBlock.getBoundingClientRect();const pE = document.getElementById('program-blocks');const pR = pE.getBoundingClientRect();let finalLeft = (direction === 'left') ? (targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP) : (targetRect.right + CONFIG.BLOCK_GAP);const finalTop = targetRect.top;let styleLeft = finalLeft - pR.left + pE.scrollLeft;let styleTop = finalTop - pR.top + pE.scrollTop;sourceBlock.style.position = 'absolute';sourceBlock.style.left = `${Math.round(styleLeft)}px`;sourceBlock.style.top = `${Math.round(styleTop)}px`;sourceBlock.style.margin = '0';sourceBlock.setAttribute('data-connected-to', targetBlock.id);sourceBlock.setAttribute('data-connection-direction', direction);targetBlock.setAttribute(direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right', sourceBlock.id);sourceBlock.classList.add('connected-block');targetBlock.classList.add('has-connected-block');playSnapSound();addSnapEffectAnimation(sourceBlock);sourceBlock.draggable = false;if (CONFIG.DEBUG) console.log(`[PerformSnap] Success. ${sourceBlock.id} pos: L=${styleLeft.toFixed(0)}, T=${styleTop.toFixed(0)}.`);return true;} catch (err) {console.error(`[PerformSnap] Error:`, err);try { detachBlock(sourceBlock, false); } catch (derr) { console.error(`[PerformSnap] Cleanup detach error:`, derr); }sourceBlock.draggable = true;return false;}}

  // ========================================================================
  // פונקציות ניתוק, תפריט, אנימציה, יצירת מזהה - ללא שינוי
  // ========================================================================
  function showDetachMenu(x, y, b) { /* ... קוד זהה ... */ removeDetachMenu();const m = document.createElement('div');m.id = 'detach-menu';m.style.left = `${x}px`;m.style.top = `${y}px`;const o = document.createElement('div');o.textContent = 'נתק בלוק';o.onclick = (e) => {e.stopPropagation();detachBlock(b, true);removeDetachMenu();};m.appendChild(o);document.body.appendChild(m);setTimeout(() => {document.addEventListener('click', closeMenuOutside, {capture: true, once: true});window.addEventListener('scroll', removeDetachMenu, {capture: true, once: true});}, 0);}
  function closeMenuOutside(e) { /* ... קוד זהה ... */ const m = document.getElementById('detach-menu');if (m && !m.contains(e.target)) {removeDetachMenu();} else if (m) {setTimeout(() => document.addEventListener('click', closeMenuOutside, {capture: true, once: true}), 0);}window.removeEventListener('scroll', removeDetachMenu, {capture: true});}
  function removeDetachMenu() { /* ... קוד זהה ... */ const m = document.getElementById('detach-menu');if (m) {document.removeEventListener('click', closeMenuOutside, {capture: true});window.removeEventListener('scroll', removeDetachMenu, {capture: true});m.remove();}}
  function detachBlock(btd, animate=true) { /* ... קוד זהה ... */ if (!btd || !btd.hasAttribute('data-connected-to')) return;const tid = btd.getAttribute('data-connected-to');const dir = btd.getAttribute('data-connection-direction');if (!tid || !dir) {console.warn(`[Detach] Missing data on ${btd.id}. Clean.`);btd.removeAttribute('data-connected-to');btd.removeAttribute('data-connection-direction');btd.classList.remove('connected-block');btd.draggable = true;return;}if (CONFIG.DEBUG) console.log(`[Detach] Detaching ${btd.id} from ${tid}`);btd.removeAttribute('data-connected-to');btd.removeAttribute('data-connection-direction');btd.classList.remove('connected-block');btd.draggable = true;clearAllSVGHighlights();const tb = document.getElementById(tid);if (tb) {tb.removeAttribute(dir === 'left' ? 'data-connected-from-left' : 'data-connected-from-right');const hoc = tb.hasAttribute('data-connected-from-left') || tb.hasAttribute('data-connected-from-right') || tb.hasAttribute('data-connected-to');if (!hoc) tb.classList.remove('has-connected-block');} else {console.warn(`[Detach] Target ${tid} not found.`);}if (animate) addDetachEffectAnimation(btd);if (CONFIG.DEBUG) console.log(`[Detach] Finished ${btd.id}. Draggable: ${btd.draggable}`);}
  function addSnapEffectAnimation(b) { /* ... קוד זהה ... */ b.classList.remove('snap-animation');void b.offsetWidth;b.classList.add('snap-animation');b.addEventListener('animationend', () => b.classList.remove('snap-animation'), {once: true});}
  function addDetachEffectAnimation(b) { /* ... קוד זהה ... */ b.classList.remove('detach-animation');void b.offsetWidth;b.classList.add('detach-animation');b.addEventListener('animationend', () => b.classList.remove('detach-animation'), {once: true});}
  function generateUniqueId(b) { /* ... קוד זהה ... */ if (b.id) return b.id;const p = b.dataset.type || 'block';let s = Math.floor(Math.random() * 10000).toString().padStart(4, '0');let id = `${p}-${s}`;let i = 0;while (document.getElementById(id) && i < 10) {id = `${p}-${s}-${i++}`;}if (i >= 10) id = `${p}-${Date.now()}`;b.id = id;if (CONFIG.DEBUG) console.log(`Generated ID: ${id}`);return id;}

  // ========================================================================
  // אתחול המערכת כולה
  // ========================================================================
  function initializeSystem() {
    const initFlag = 'blockLinkageInitialized_v3_8_svg'; // עדכון גרסה ודגל
    if (window[initFlag]) {
        if (CONFIG.DEBUG) console.log("Block linkage system v3.8 SVG (Precise External Marker) already initialized. Skipping.");
        return;
    }

    // גרסה 3.8 SVG - מיקום מדויק לסמן חיצוני
    addHighlightStyles();
    initAudio();
    initProgrammingAreaListeners();
    observeNewBlocks();
    initExistingBlocks();
    initGlobalMouseListeners();

    if (CONFIG.PLAY_SOUND) {
      addSoundTestButton();
    }

    window[initFlag] = true;
    console.log(`Block linkage system initialized (Version 3.8 SVG - Precise External Marker, Highlight Threshold=${CONFIG.PROXIMITY_HIGHLIGHT_THRESHOLD}px, Snap Threshold=${CONFIG.CONNECT_THRESHOLD}px)`);
    console.log(`Configuration: External Marker OffsetY=${CONFIG.EXTERNAL_MARKER_CONN_OFFSET_Y}px, Height=${CONFIG.EXTERNAL_MARKER_CONN_HEIGHT}px`);
    console.log(`Configuration: Overlap=${CONFIG.VERTICAL_OVERLAP_REQ*100}%, Gap=${CONFIG.BLOCK_GAP}px, Sound=${CONFIG.PLAY_SOUND ? CONFIG.SOUND_PATH : 'Disabled'}`);
  }

  // הפעל את האתחול
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
    initializeSystem(); // DOM already loaded
  }

})(); // סוף IIFE

// --- END OF FILE linkageimproved.js ---
