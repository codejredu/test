// --- START OF FILE linkageimproved.js ---
// --- Version 3.5: Explicit z-index management on snap/detach ---

(function() {
  // משתנים גלובליים במודול
  let currentDraggedBlock = null;
  let potentialSnapTarget = null;
  let snapDirection = null; // 'left' or 'right'
  let isDraggingBlock = false;
  let dragOffset = { x: 0, y: 0 };
  let futureIndicator = null;
  let snapSound = null; // אודיו לצליל הצמדה
  let audioContextAllowed = false; // Track if user interaction has allowed audio
  let soundInitialized = false; // Track if initAudio was successful

  // קונפיגורציה - פרמטרים שניתן להתאים
  const CONFIG = {
    PIN_WIDTH: 5,
    CONNECT_THRESHOLD: 20, // סף חיבור מוגדל
    VERTICAL_ALIGN_THRESHOLD: 20,
    VERTICAL_OVERLAP_REQ: 0.3, // דרישת חפיפה מופחתת
    BLOCK_GAP: 0,
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3', // נתיב לקובץ השמע
    CONNECTED_SOURCE_ZINDEX: '10', // Z-index for the block that was dragged and snapped
    CONNECTED_TARGET_ZINDEX: '9',  // Z-index for the block that was snapped TO
    DEBUG: true // הגדר ל-false בייצור
  };

  // ========================================================================
  // הוספת סגנונות CSS - ה-z-index מנוהל כעת בעיקר ב-JS
  // ========================================================================
  function addHighlightStyles() {
    if (document.getElementById('block-connection-styles')) return;

    const style = document.createElement('style');
    style.id = 'block-connection-styles';
    style.textContent = `
      /* בלוק נגרר */
      .snap-source {
         box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4) !important;
         transition: box-shadow 0.15s ease-out;
         cursor: grabbing !important;
         z-index: 1001 !important; /* High during drag */
      }

      /* יעד פוטנציאלי */
      .snap-target {
        outline: 6px solid #FFC107 !important;
        outline-offset: 4px;
        box-shadow: 0 0 20px 8px rgba(255, 193, 7, 0.8) !important;
        transition: outline 0.1s ease-out, box-shadow 0.1s ease-out;
        z-index: 999 !important; /* High during highlight, below source */
      }

      /* מחוון מיקום עתידי */
      .future-position-indicator {
        position: absolute; border: 3px dashed rgba(0, 120, 255, 0.95); border-radius: 5px;
        background-color: rgba(0, 120, 255, 0.15); pointer-events: none; z-index: 998;
        opacity: 0; transition: opacity 0.15s ease-out, left 0.05s linear, top 0.05s linear; display: none;
      }
      .future-position-indicator.visible { display: block; opacity: 0.9; }

      /* סימון כיוון הצמדה ביעד */
      .snap-target.snap-left::before {
        content: ''; position: absolute; left: -10px; top: 10%; bottom: 10%; width: 8px;
        background-color: #FFC107; border-radius: 2px; z-index: 1000; box-shadow: 0 0 10px 2px rgba(255, 193, 7, 0.8); transition: all 0.1s ease-out;
      }
      .snap-target.snap-right::after {
        content: ''; position: absolute; right: -10px; top: 10%; bottom: 10%; width: 8px;
        background-color: #FFC107; border-radius: 2px; z-index: 1000; box-shadow: 0 0 10px 2px rgba(255, 193, 7, 0.8); transition: all 0.1s ease-out;
      }

      /* אנימציות */
      @keyframes snapEffect { 0% { transform: scale(1); } 35% { transform: scale(1.05); } 70% { transform: scale(0.98); } 100% { transform: scale(1); } }
      .snap-animation { animation: snapEffect 0.3s ease-out; }
      @keyframes detachEffect { 0% { transform: translate(0, 0) rotate(0); } 30% { transform: translate(3px, 1px) rotate(0.8deg); } 60% { transform: translate(-2px, 2px) rotate(-0.5deg); } 100% { transform: translate(0, 0) rotate(0); } }
      .detach-animation { animation: detachEffect 0.3s ease-in-out; }

      /* תפריט ניתוק */
      #detach-menu { position: absolute; background-color: white; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 3px 8px rgba(0,0,0,0.2); z-index: 1100; padding: 5px; font-size: 14px; min-width: 100px; }
      #detach-menu div { padding: 6px 12px; cursor: pointer; border-radius: 3px; }
      #detach-menu div:hover { background-color: #eee; }

      /* מניעת בחירת טקסט */
      body.user-select-none { user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; }

      /* בלוקים מחוברים - נותנים רק position absolute, z-index יקבע ב-JS */
      .connected-block, .has-connected-block {
           position: absolute !important; /* Ensure they stay absolute after connection */
           /* z-index will be set via element.style in JS */
      }

      /* כפתור בדיקת שמע */
      #sound-test-button { position: fixed; bottom: 15px; right: 15px; padding: 8px 12px; background-color: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; z-index: 9999; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: background-color 0.2s, opacity 0.5s ease-out; opacity: 1; }
      #sound-test-button:hover:not(:disabled) { background-color: #0b7dda; }
      #sound-test-button.success { background-color: #4CAF50; }
      #sound-test-button.error { background-color: #f44336; }
      #sound-test-button.loading { background-color: #ff9800; cursor: wait; }
      #sound-test-button.hidden { opacity: 0; pointer-events: none; }
    `;
    document.head.appendChild(style);
    if (CONFIG.DEBUG) console.log('Highlighting and animation styles added/verified.');
  }

  // ========================================================================
  // אתחול מערכת השמע (ללא שינוי מהגרסה הקודמת)
  // ========================================================================
  function initAudio() {
    if (!CONFIG.PLAY_SOUND) return;
    if (soundInitialized && snapSound && document.body.contains(snapSound)) {
        if (CONFIG.DEBUG) console.log("Audio already initialized.");
        return;
    }
    soundInitialized = false;

    try {
      const existingAudio = document.getElementById('snap-sound-element');
      if (existingAudio) { existingAudio.remove(); snapSound = null; }

      snapSound = document.createElement('audio');
      snapSound.id = 'snap-sound-element';
      snapSound.preload = 'auto';
      snapSound.volume = CONFIG.SOUND_VOLUME;

      const source = document.createElement('source');
      source.src = CONFIG.SOUND_PATH;
      source.type = 'audio/mpeg';
      snapSound.appendChild(source);

      snapSound.addEventListener('error', (e) => {
        console.error(`Error loading audio file: ${CONFIG.SOUND_PATH}`, e.target.error);
        const btn = document.getElementById('sound-test-button'); if(btn) { btn.textContent = 'שגיאה'; btn.classList.add('error'); btn.disabled = true; btn.style.backgroundColor='#f44336'; }
        CONFIG.PLAY_SOUND = false; snapSound = null; soundInitialized = false;
      });
      snapSound.addEventListener('canplaythrough', () => {
          if (!soundInitialized) {
              soundInitialized = true;
              if (CONFIG.DEBUG) console.log('Audio element ready.');
              const btn = document.getElementById('sound-test-button');
              if (btn && btn.classList.contains('loading')) { btn.textContent='בדוק צליל'; btn.classList.remove('loading'); btn.disabled=false; btn.style.backgroundColor='#2196F3'; }
          }
      });
       snapSound.addEventListener('stalled', () => { if (!soundInitialized) console.warn('Audio loading stalled.'); });

      snapSound.style.display = 'none';
      document.body.appendChild(snapSound);
      if (CONFIG.DEBUG) console.log(`Audio element created, loading: ${CONFIG.SOUND_PATH}`);
    } catch (err) {
      console.error('Error initializing audio:', err);
      CONFIG.PLAY_SOUND = false; snapSound = null; soundInitialized = false;
    }
  }

  // ========================================================================
  // הוספת כפתור בדיקת שמע (ללא שינוי מהגרסה הקודמת)
  // ========================================================================
  function addSoundTestButton() {
     if (!CONFIG.PLAY_SOUND) return;
    try {
      const existingButton = document.getElementById('sound-test-button');
      if (existingButton) existingButton.remove();

      const button = document.createElement('button');
      button.id = 'sound-test-button'; button.title = 'בדוק צליל'; button.className = '';

      if (!snapSound && !soundInitialized && CONFIG.PLAY_SOUND) { button.textContent = 'שגיאת שמע'; button.classList.add('error'); button.disabled = true; }
      else if (!soundInitialized) { button.textContent = 'טוען צליל...'; button.classList.add('loading'); button.disabled = true; }
      else { button.textContent = 'בדוק צליל'; button.disabled = false; }

      Object.assign(button.style, { position: 'fixed', bottom: '15px', right: '15px', zIndex: '9999', padding: '8px 12px', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', fontFamily: 'Arial, sans-serif', fontSize: '14px', fontWeight: 'bold', transition: 'background-color 0.2s, opacity 0.5s ease-out', opacity: '1' });
      if (button.classList.contains('error')) button.style.backgroundColor = '#f44336';
      else if (button.classList.contains('loading')) button.style.backgroundColor = '#ff9800';
      else button.style.backgroundColor = '#2196F3';

      button.onmouseover = function() { if (!this.disabled && !this.classList.contains('success') && !this.classList.contains('error')) this.style.backgroundColor = '#0b7dda'; };
      button.onmouseout = function() { if (!this.disabled && !this.classList.contains('success') && !this.classList.contains('error')) this.style.backgroundColor = '#2196F3'; };
      button.addEventListener('click', function() {
            if (this.disabled || !snapSound || !soundInitialized) return;
            snapSound.play().then(() => {
              button.textContent = '✓'; button.classList.add('success'); button.style.backgroundColor = '#4CAF50'; audioContextAllowed = true;
               setTimeout(() => { button.classList.add('hidden'); setTimeout(() => { if(button.parentNode) button.remove(); }, 500); }, 2000);
               if(snapSound) { snapSound.pause(); snapSound.currentTime = 0; }
            }).catch(err => {
                console.warn('Sound test failed:', err);
                if (err.name === 'NotAllowedError') { button.textContent = 'לחץ שוב'; button.classList.add('error'); button.style.backgroundColor = '#f44336'; audioContextAllowed = false;}
                else { button.textContent = 'שגיאה'; button.classList.add('error'); button.style.backgroundColor = '#f44336'; button.disabled = true; }
            });
       });
      document.body.appendChild(button);
      if (CONFIG.DEBUG) console.log('Sound test button added.');
    } catch (err) { console.error('Error adding sound test button:', err); }
  }

  // ========================================================================
  // השמעת צליל הצמדה (ללא שינוי מהגרסה הקודמת)
  // ========================================================================
  function playSnapSound() {
    if (!CONFIG.PLAY_SOUND || !snapSound || !soundInitialized) {
      if (CONFIG.DEBUG && CONFIG.PLAY_SOUND) console.log(`Snap sound skipped: ${!snapSound ? 'No element' : 'Not initialized'}`);
      return;
    }
    if (!audioContextAllowed && CONFIG.DEBUG) console.warn('Attempting sound before interaction.');
    try {
      if (snapSound.readyState < 3) { if (CONFIG.DEBUG) console.log('Snap sound skipped: readyState=' + snapSound.readyState); return; }
      snapSound.pause(); snapSound.currentTime = 0;
      const playPromise = snapSound.play();
      if (playPromise) {
        playPromise.then(() => { audioContextAllowed = true; if (CONFIG.DEBUG > 1) console.log('Snap sound played.'); })
                   .catch(err => {
                     if (err.name !== 'AbortError') console.warn('Snap sound play failed:', err);
                     if (err.name === 'NotAllowedError' && !document.getElementById('sound-test-button')) addSoundTestButton();
                   });
      }
    } catch (err) { console.error('Error playing snap sound:', err); }
  }

  // ========================================================================
  // אתחול מאזינים באזור התכנות (ללא שינוי)
  // ========================================================================
  function initProgrammingAreaListeners() {
    const area = document.getElementById('program-blocks');
    if (!area) { console.error('#program-blocks not found!'); return; }
    area.addEventListener('dragover', e => e.preventDefault());
    area.addEventListener('dragstart', e => { if (e.target.closest?.('#program-blocks .block-container')) e.preventDefault(); });
  }

  // ========================================================================
  // האזנה לבלוקים חדשים (ללא שינוי)
  // ========================================================================
  function observeNewBlocks() {
    const area = document.getElementById('program-blocks'); if (!area) return;
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) {
                let block = node.classList?.contains('block-container') ? node : node.querySelector?.('.block-container');
                if (block && area.contains(block)) {
                  if (!block.id) generateUniqueId(block);
                  addBlockDragListeners(block);
                  if (CONFIG.DEBUG) console.log(`New block initialized: ${block.id}`);
                } } }); } }); });
    observer.observe(area, { childList: true, subtree: true });
    if (CONFIG.DEBUG) console.log("MutationObserver watching #program-blocks.");
  }

  // ========================================================================
  // הוספת מאזינים לבלוקים קיימים (ללא שינוי)
  // ========================================================================
  function initExistingBlocks() {
      const area = document.getElementById('program-blocks'); if (!area) return;
      area.querySelectorAll('.block-container').forEach(block => {
          if (!block.id) generateUniqueId(block); addBlockDragListeners(block);
      });
      if (CONFIG.DEBUG) console.log("Listeners added to existing blocks.");
  }

  // ========================================================================
  // הוספת מאזיני גרירה וקליק ימני לבלוק (ללא שינוי)
  // ========================================================================
  function addBlockDragListeners(block) {
      block.removeEventListener('mousedown', handleMouseDown); block.addEventListener('mousedown', handleMouseDown);
      block.removeEventListener('contextmenu', handleContextMenu); block.addEventListener('contextmenu', handleContextMenu);
  }

  // ========================================================================
  // טיפול בלחיצת עכבר על בלוק (ללא שינוי משמעותי)
  // ========================================================================
  function handleMouseDown(e) {
      if (e.button !== 0 || !e.target.closest) return;
      if (e.target.matches('input, button, select, textarea, a[href], .no-drag')) return;

      const block = e.target.closest('.block-container');
      const programmingArea = document.getElementById('program-blocks');
      if (!block || !programmingArea || !programmingArea.contains(block)) return;

      if (!block.id) generateUniqueId(block);
      e.preventDefault(); block.draggable = false;
      if (CONFIG.DEBUG) console.log(`[MouseDown] Started for block: ${block.id}`);

      // Detach block and any blocks attached TO it before dragging
      if (block.hasAttribute('data-connected-to')) { detachBlock(block, false); }
      ['left', 'right'].forEach(side => {
          const connectedBlockId = block.getAttribute(`data-connected-from-${side}`);
          if (connectedBlockId) {
              const connectedBlock = document.getElementById(connectedBlockId);
              if (connectedBlock) { detachBlock(connectedBlock, false); }
              else { console.warn(`[MouseDown] Orphaned connection on ${block.id}. Cleaning.`); block.removeAttribute(`data-connected-from-${side}`); }
          } });

      // Start dragging logic
      currentDraggedBlock = block; isDraggingBlock = true;
      const rect = block.getBoundingClientRect(); const parentRect = programmingArea.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left; dragOffset.y = e.clientY - rect.top;

      // Ensure absolute positioning within the programming area
      const currentStyle = window.getComputedStyle(block);
      if (currentStyle.position !== 'absolute') {
          block.style.position = 'absolute';
          block.style.left = `${Math.round(rect.left - parentRect.left + programmingArea.scrollLeft)}px`;
          block.style.top = `${Math.round(rect.top - parentRect.top + programmingArea.scrollTop)}px`;
          block.style.margin = '0';
          if (CONFIG.DEBUG > 1) console.log(`[MouseDown] Set ${block.id} to absolute.`);
      } else { block.style.margin = '0'; } // Reset margin even if already absolute

      block.style.zIndex = '1001'; // High z-index during drag
      block.classList.add('snap-source');
      document.body.classList.add('user-select-none');
      if (CONFIG.DEBUG > 1) console.log(`[MouseDown] Drag setup: L=${block.style.left}, T=${block.style.top}`);
  }

  // ========================================================================
  // טיפול בקליק ימני על בלוק (ללא שינוי)
  // ========================================================================
  function handleContextMenu(e) {
      e.preventDefault();
      const block = e.target.closest('.block-container');
      if (block?.hasAttribute('data-connected-to')) showDetachMenu(e.clientX, e.clientY, block);
  }

  // ========================================================================
  // מאזינים גלובליים לעכבר (ללא שינוי)
  // ========================================================================
  function initGlobalMouseListeners() {
    document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); document.removeEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mousemove', handleMouseMove); document.addEventListener('mouseup', handleMouseUp); document.addEventListener('mouseleave', handleMouseLeave);
  }
  function handleMouseLeave(e) {
      if (isDraggingBlock && e.target === document.documentElement && !e.relatedTarget) {
          if (CONFIG.DEBUG) console.warn("Mouse left document during drag, treating as mouseup."); handleMouseUp(e);
      } }

  // ========================================================================
  // טיפול בתנועת עכבר (ללא שינוי)
  // ========================================================================
  function handleMouseMove(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return; e.preventDefault();
    const parentElement = document.getElementById('program-blocks'); if (!parentElement) { handleMouseUp(e); return; }
    const parentRect = parentElement.getBoundingClientRect();
    let newLeft = e.clientX - parentRect.left - dragOffset.x + parentElement.scrollLeft;
    let newTop = e.clientY - parentRect.top - dragOffset.y + parentElement.scrollTop;
    const blockWidth = currentDraggedBlock.offsetWidth; const blockHeight = currentDraggedBlock.offsetHeight;
    newLeft = Math.max(0, Math.min(newLeft, parentElement.scrollWidth - blockWidth));
    newTop = Math.max(0, Math.min(newTop, parentElement.scrollHeight - blockHeight));
    currentDraggedBlock.style.left = `${Math.round(newLeft)}px`; currentDraggedBlock.style.top = `${Math.round(newTop)}px`;
    checkAndHighlightSnapPossibility();
  }

  // ========================================================================
  // טיפול בשחרור עכבר - *** ללא איפוס z-index מיידי ***
  // ========================================================================
  function handleMouseUp(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    const blockReleased = currentDraggedBlock;
    const targetToSnap = potentialSnapTarget;
    const directionToSnap = snapDirection;
    let snapSuccess = false; // Track if snap occurred

    if (CONFIG.DEBUG) console.log(`[MouseUp] Releasing ${blockReleased.id}. Target: ${targetToSnap?.id || 'none'}. Dir: ${directionToSnap || 'none'}.`);

    // --- Cleanup dragging state ---
    isDraggingBlock = false;
    currentDraggedBlock = null;
    potentialSnapTarget = null;
    snapDirection = null;
    document.body.classList.remove('user-select-none');
    blockReleased.classList.remove('snap-source'); // Remove drag styling
    // *** Z-INDEX IS NOT RESET HERE - Handled by performSnap or detach ***

    // --- Remove visual indicators ---
    document.querySelectorAll('.snap-target, .snap-left, .snap-right').forEach(el => {
      el.classList.remove('snap-target', 'snap-left', 'snap-right');
    });
    removeFuturePositionIndicator();

    // --- Attempt snap ---
    if (targetToSnap && directionToSnap) {
      if (CONFIG.DEBUG) console.log(`[MouseUp] Attempting snap operation...`);
      snapSuccess = performBlockSnap(blockReleased, targetToSnap, directionToSnap);
      // draggable and z-index are set inside performBlockSnap on success
    }

    // --- Final state if NO snap occurred or snap FAILED ---
    if (!snapSuccess) {
      blockReleased.draggable = true; // Ensure it's draggable
      blockReleased.style.zIndex = ''; // Reset z-index to default only if no snap
      if (CONFIG.DEBUG) console.log(`[MouseUp] No snap or snap failed. ${blockReleased.id} draggable=true, zIndex reset.`);
    }

    if (CONFIG.DEBUG) console.log(`[MouseUp] ----- End MouseUp for ${blockReleased.id} -----`);
  }


  // ========================================================================
  // בדיקת הצמדה והדגשה (ללא שינוי)
  // ========================================================================
  function checkAndHighlightSnapPossibility() {
    if (!currentDraggedBlock) return;
    const programmingArea = document.getElementById('program-blocks'); if (!programmingArea) return;
    const sourceRect = currentDraggedBlock.getBoundingClientRect();
    const allVisibleBlocks = Array.from(programmingArea.querySelectorAll('.block-container:not(.snap-source)'))
                                  .filter(block => block.offsetParent !== null);
    let bestTarget = null, bestDirection = null, minDistance = CONFIG.CONNECT_THRESHOLD + 1;
    document.querySelectorAll('.snap-target').forEach(el => el.classList.remove('snap-target', 'snap-left', 'snap-right'));
    potentialSnapTarget = null; snapDirection = null; removeFuturePositionIndicator();

    for (const targetBlock of allVisibleBlocks) {
      if (!targetBlock.id) generateUniqueId(targetBlock);
      const targetRect = targetBlock.getBoundingClientRect();
      const targetHasLeftConn = targetBlock.hasAttribute('data-connected-from-left');
      const targetHasRightConn = targetBlock.hasAttribute('data-connected-from-right');
      const snapInfo = calculateSnapInfo(sourceRect, targetRect);
      if (snapInfo && snapInfo.distance < minDistance) {
         let connectionAllowed = true;
         if (snapInfo.direction === 'left' && targetHasLeftConn) connectionAllowed = false;
         else if (snapInfo.direction === 'right' && targetHasRightConn) connectionAllowed = false;
         if (connectionAllowed) { minDistance = snapInfo.distance; bestTarget = targetBlock; bestDirection = snapInfo.direction; }
         else { if (CONFIG.DEBUG > 1) console.log(`[Highlight] Snap blocked: Target ${targetBlock.id} side '${snapInfo.direction}' occupied.`); }
      } }
    if (bestTarget) {
      potentialSnapTarget = bestTarget; snapDirection = bestDirection;
      bestTarget.classList.add('snap-target', `snap-${bestDirection}`);
      const programRect = programmingArea.getBoundingClientRect();
      updateFuturePositionIndicator(currentDraggedBlock, bestTarget, bestDirection, programRect);
       if (CONFIG.DEBUG > 1) console.log(`[Highlight] Potential: ${currentDraggedBlock.id} -> ${bestTarget.id} (${bestDirection}), dist: ${minDistance.toFixed(1)}`);
    }
  }

  // ========================================================================
  // חישוב מידע הצמדה (ללא שינוי)
  // ========================================================================
  function calculateSnapInfo(sourceRect, targetRect) {
    const vOverlap = Math.max(0, Math.min(sourceRect.bottom, targetRect.bottom) - Math.max(sourceRect.top, targetRect.top));
    const minOverlap = Math.min(sourceRect.height, targetRect.height) * CONFIG.VERTICAL_OVERLAP_REQ;
    if (vOverlap < minOverlap || vOverlap <= 0) return null;
    const distRToL = Math.abs(sourceRect.right - targetRect.left); const distLToR = Math.abs(sourceRect.left - targetRect.right);
    let distance, direction;
    if (distRToL < distLToR) { distance = distRToL; direction = 'left'; } else { distance = distLToR; direction = 'right'; }
    if (distance <= CONFIG.CONNECT_THRESHOLD) { if (CONFIG.DEBUG > 1) console.log(`[CalcSnap] Possible: dir=${direction}, dist=${distance.toFixed(1)}`); return { direction, distance }; }
    return null;
  }

  // ========================================================================
  // ביצוע ההצמדה - *** קובע z-index סופי ***
  // ========================================================================
  function performBlockSnap(sourceBlock, targetBlock, direction) {
    if (!sourceBlock || !targetBlock || !document.body.contains(targetBlock) || targetBlock.offsetParent === null) {
      console.warn(`[PerformSnap] Invalid target ${targetBlock?.id}. Snap cancelled.`); return false;
    }
    const targetAttrToCheck = `data-connected-from-${direction}`;
    if (targetBlock.hasAttribute(targetAttrToCheck)) {
        console.warn(`[PerformSnap] Target ${targetBlock.id} slot '${direction}' occupied. Snap cancelled.`); return false;
    }

    if (CONFIG.DEBUG) console.log(`[PerformSnap] Snapping ${sourceBlock.id} to '${direction}' of ${targetBlock.id}`);

    try {
        const parentElement = document.getElementById('program-blocks');
        const parentRect = parentElement.getBoundingClientRect();

        // Ensure Target is absolutely positioned (copied from v3.4)
        const targetStyle = window.getComputedStyle(targetBlock);
        if (targetStyle.position !== 'absolute') {
            if (CONFIG.DEBUG > 1) console.log(`[PerformSnap] Setting target ${targetBlock.id} to absolute.`);
            const targetRectBefore = targetBlock.getBoundingClientRect();
            targetBlock.style.position = 'absolute';
            targetBlock.style.left = `${Math.round(targetRectBefore.left - parentRect.left + parentElement.scrollLeft)}px`;
            targetBlock.style.top = `${Math.round(targetRectBefore.top - parentRect.top + parentElement.scrollTop)}px`;
            targetBlock.style.margin = '0';
        }

        // Get final positions after potential target adjustment
        const sourceRect = sourceBlock.getBoundingClientRect();
        const targetRect = targetBlock.getBoundingClientRect();

        // Calculate final source position
        let finalViewportLeft; const finalViewportTop = targetRect.top;
        if (direction === 'left') { finalViewportLeft = targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP; }
        else { finalViewportLeft = targetRect.right + CONFIG.BLOCK_GAP; }
        let styleLeft = finalViewportLeft - parentRect.left + parentElement.scrollLeft;
        let styleTop = finalViewportTop - parentRect.top + parentElement.scrollTop;

        // Apply final position to source block
        sourceBlock.style.position = 'absolute';
        sourceBlock.style.left = `${Math.round(styleLeft)}px`;
        sourceBlock.style.top = `${Math.round(styleTop)}px`;
        sourceBlock.style.margin = '0';

        // *** Set final Z-INDEX explicitly ***
        sourceBlock.style.zIndex = CONFIG.CONNECTED_SOURCE_ZINDEX;
        targetBlock.style.zIndex = CONFIG.CONNECTED_TARGET_ZINDEX;
        if (CONFIG.DEBUG) console.log(`[PerformSnap] Set zIndex: ${sourceBlock.id}=${sourceBlock.style.zIndex}, ${targetBlock.id}=${targetBlock.style.zIndex}`);


        // Update data attributes
        sourceBlock.setAttribute('data-connected-to', targetBlock.id);
        sourceBlock.setAttribute('data-connection-direction', direction);
        targetBlock.setAttribute(targetAttrToCheck, sourceBlock.id);

        // Add CSS classes
        sourceBlock.classList.add('connected-block');
        targetBlock.classList.add('has-connected-block');

        // Play sound & animation
        playSnapSound();
        addSnapEffectAnimation(sourceBlock);

        // Make non-draggable
        sourceBlock.draggable = false;

        if (CONFIG.DEBUG > 1) console.log(`[PerformSnap] Snap success: ${sourceBlock.id} at L=${Math.round(styleLeft)} T=${Math.round(styleTop)}.`);
        return true; // Success

    } catch (err) {
        console.error(`[PerformSnap] Error during snap:`, err);
        try { detachBlock(sourceBlock, false); } // Attempt cleanup
        catch (detachErr) { console.error(`[PerformSnap] Error during cleanup detach:`, detachErr); }
        // Ensure source is draggable and z-index is reset on failure
        sourceBlock.draggable = true;
        sourceBlock.style.zIndex = '';
        if(targetBlock) targetBlock.style.zIndex = ''; // Also reset target just in case
        return false; // Failure
    }
}

  // ========================================================================
  // עדכון מחוון מיקום עתידי (ללא שינוי)
  // ========================================================================
  function updateFuturePositionIndicator(sourceBlock, targetBlock, direction, programRect) {
    const programmingArea = document.getElementById('program-blocks'); if (!programmingArea) return;
    if (!futureIndicator) { futureIndicator = document.createElement('div'); futureIndicator.id = 'future-position-indicator'; futureIndicator.className = 'future-position-indicator'; programmingArea.appendChild(futureIndicator); }
    try {
        const sourceRectNow = sourceBlock.getBoundingClientRect(); const targetRect = targetBlock.getBoundingClientRect(); const parentRect = programRect;
        let desiredViewportLeft, desiredViewportTop = targetRect.top;
        if (direction === 'left') { desiredViewportLeft = targetRect.left - sourceRectNow.width - CONFIG.BLOCK_GAP; } else { desiredViewportLeft = targetRect.right + CONFIG.BLOCK_GAP; }
        let indicatorLeft = desiredViewportLeft - parentRect.left + programmingArea.scrollLeft; let indicatorTop = desiredViewportTop - parentRect.top + programmingArea.scrollTop;
        Object.assign(futureIndicator.style, { left: `${Math.round(indicatorLeft)}px`, top: `${Math.round(indicatorTop)}px`, width: `${Math.round(sourceRectNow.width)}px`, height: `${Math.round(sourceRectNow.height)}px` });
        futureIndicator.classList.add('visible');
    } catch (err) { console.error('Error updating future indicator:', err); removeFuturePositionIndicator(); }
  }

  // ========================================================================
  // הסרת מחוון מיקום עתידי (ללא שינוי)
  // ========================================================================
  function removeFuturePositionIndicator() { if (futureIndicator) futureIndicator.classList.remove('visible'); }

  // ========================================================================
  // ניתוק בלוקים ותפריט - *** מאפס z-index ***
  // ========================================================================
  function showDetachMenu(x, y, block) { /* ... (same as before) ... */
    removeDetachMenu(); const menu = document.createElement('div'); menu.id = 'detach-menu';
    Object.assign(menu.style, { left: `${x}px`, top: `${y}px` }); const option = document.createElement('div'); option.textContent = 'נתק';
    option.onclick = (e) => { e.stopPropagation(); detachBlock(block, true); removeDetachMenu(); }; menu.appendChild(option); document.body.appendChild(menu);
    setTimeout(() => { document.addEventListener('click', closeMenuOutside, { capture: true, once: true }); window.addEventListener('scroll', removeDetachMenu, { capture: true, once: true }); }, 0);
  }
  function closeMenuOutside(e) { /* ... (same as before) ... */
    const menu = document.getElementById('detach-menu'); if (menu && !menu.contains(e.target)) removeDetachMenu();
    else if (menu) setTimeout(() => { document.addEventListener('click', closeMenuOutside, { capture: true, once: true }); }, 0);
    window.removeEventListener('scroll', removeDetachMenu, { capture: true });
  }
  function removeDetachMenu() { /* ... (same as before) ... */
    const menu = document.getElementById('detach-menu'); if (menu) { document.removeEventListener('click', closeMenuOutside, { capture: true }); window.removeEventListener('scroll', removeDetachMenu, { capture: true }); menu.remove(); }
  }

  function detachBlock(blockToDetach, animate = true) {
    if (!blockToDetach || !blockToDetach.hasAttribute('data-connected-to')) {
        if (blockToDetach) {
            blockToDetach.draggable = true; // Ensure draggable if not connected
            blockToDetach.style.zIndex = ''; // Reset z-index if it wasn't connected
        }
        if (CONFIG.DEBUG > 1 && blockToDetach) console.log(`[Detach] Block ${blockToDetach.id} not connected TO anything.`);
        return;
    }
    const targetId = blockToDetach.getAttribute('data-connected-to');
    const direction = blockToDetach.getAttribute('data-connection-direction');
    if (!targetId || !direction) {
        console.warn(`[Detach] Missing data on ${blockToDetach.id}. Cleaning up.`);
        blockToDetach.removeAttribute('data-connected-to'); blockToDetach.removeAttribute('data-connection-direction');
        blockToDetach.classList.remove('connected-block'); blockToDetach.draggable = true; blockToDetach.style.zIndex = ''; // Reset z-index
        return;
    }

    if (CONFIG.DEBUG) console.log(`[Detach] Detaching ${blockToDetach.id} from ${targetId}.`);

    // --- Clean up source block ---
    blockToDetach.removeAttribute('data-connected-to'); blockToDetach.removeAttribute('data-connection-direction');
    blockToDetach.classList.remove('connected-block');
    blockToDetach.draggable = true; // Make draggable again
    blockToDetach.style.zIndex = ''; // *** Reset source z-index ***
    if (CONFIG.DEBUG) console.log(`[Detach] Reset zIndex for source ${blockToDetach.id}`);


    // --- Clean up target block ---
    const targetBlock = document.getElementById(targetId);
    if (targetBlock) {
        targetBlock.removeAttribute(`data-connected-from-${direction}`);
        const hasOtherConn = targetBlock.matches('[data-connected-from-left], [data-connected-from-right], [data-connected-to]');
        if (!hasOtherConn) {
            targetBlock.classList.remove('has-connected-block');
            targetBlock.style.zIndex = ''; // *** Reset target z-index ONLY if no other connections ***
             if (CONFIG.DEBUG) console.log(`[Detach] Reset zIndex for target ${targetId} (no other connections).`);
        } else {
             if (CONFIG.DEBUG > 1) console.log(`[Detach] Target ${targetId} still has other connections, zIndex not reset.`);
        }
    } else { console.warn(`[Detach] Target ${targetId} not found.`); }

    if (animate) addDetachEffectAnimation(blockToDetach);
    if (CONFIG.DEBUG > 1) console.log(`[Detach] Finished detaching ${blockToDetach.id}.`);
  }

  // ========================================================================
  // אנימציות עזר (ללא שינוי)
  // ========================================================================
  function addSnapEffectAnimation(block) { block.classList.remove('snap-animation'); void block.offsetWidth; block.classList.add('snap-animation'); block.addEventListener('animationend', () => block.classList.remove('snap-animation'), { once: true }); }
  function addDetachEffectAnimation(block) { block.classList.remove('detach-animation'); void block.offsetWidth; block.classList.add('detach-animation'); block.addEventListener('animationend', () => block.classList.remove('detach-animation'), { once: true }); }

  // ========================================================================
  // יצירת ID ייחודי (ללא שינוי)
  // ========================================================================
  function generateUniqueId(block) {
    if (block.id) return block.id; const prefix = block.dataset.type || block.classList[0] || 'block';
    let id = `${prefix}-${Math.random().toString(36).substring(2, 7)}`; let i = 0;
    while (document.getElementById(id) && i < 10) { id = `${prefix}-${Math.random().toString(36).substring(2, 7)}-${i++}`; }
    if (i >= 10) id = `${prefix}-${Date.now()}`; block.id = id; if (CONFIG.DEBUG) console.log(`Generated ID: ${id}`); return id;
  }

  // ========================================================================
  // אתחול המערכת (ללא שינוי)
  // ========================================================================
  function initializeSystem() {
    if (window.blockLinkageInitialized) { if (CONFIG.DEBUG) console.log("Linkage already initialized."); return; }
    addHighlightStyles(); initAudio(); initProgrammingAreaListeners(); observeNewBlocks(); initExistingBlocks(); initGlobalMouseListeners();
    if (CONFIG.PLAY_SOUND) addSoundTestButton();
    window.blockLinkageInitialized = true;
    console.log(`Block linkage system initialized (Version 3.5 - Explicit Z-Index)`);
    console.log(`Config: Thresh=${CONFIG.CONNECT_THRESHOLD}, Overlap=${CONFIG.VERTICAL_OVERLAP_REQ*100}%, Sound=${CONFIG.PLAY_SOUND ? CONFIG.SOUND_PATH : 'Off'}, Z-Idx(S/T): ${CONFIG.CONNECTED_SOURCE_ZINDEX}/${CONFIG.CONNECTED_TARGET_ZINDEX}`);
  }

  // הפעל את האתחול
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initializeSystem); }
  else { initializeSystem(); }

})(); // End IIFE

// --- END OF FILE linkageimproved.js ---
