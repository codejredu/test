// --- START OF FILE linkageimproved.js ---
// --- Version 3.4: Ensure Target is Absolutely Positioned on Snap ---

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
    DEBUG: true // הגדר ל-false בייצור
  };

  // ========================================================================
  // הוספת סגנונות CSS
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
         z-index: 1001 !important; /* Keep on top during drag */
      }

      /* יעד פוטנציאלי */
      .snap-target {
        outline: 6px solid #FFC107 !important;
        outline-offset: 4px;
        box-shadow: 0 0 20px 8px rgba(255, 193, 7, 0.8) !important;
        transition: outline 0.1s ease-out, box-shadow 0.1s ease-out;
        z-index: 999 !important; /* Below source during drag highlight */
      }

      /* מחוון מיקום עתידי */
      .future-position-indicator {
        position: absolute;
        border: 3px dashed rgba(0, 120, 255, 0.95);
        border-radius: 5px;
        background-color: rgba(0, 120, 255, 0.15);
        pointer-events: none;
        z-index: 998;
        opacity: 0;
        transition: opacity 0.15s ease-out, left 0.05s linear, top 0.05s linear;
        display: none;
      }
      .future-position-indicator.visible {
        display: block;
        opacity: 0.9;
      }

      /* סימון כיוון הצמדה ביעד */
      .snap-target.snap-left::before {
        content: ''; position: absolute; left: -10px; top: 10%; bottom: 10%;
        width: 8px; background-color: #FFC107; border-radius: 2px; z-index: 1000;
        box-shadow: 0 0 10px 2px rgba(255, 193, 7, 0.8); transition: all 0.1s ease-out;
      }
      .snap-target.snap-right::after {
         content: ''; position: absolute; right: -10px; top: 10%; bottom: 10%;
        width: 8px; background-color: #FFC107; border-radius: 2px; z-index: 1000;
        box-shadow: 0 0 10px 2px rgba(255, 193, 7, 0.8); transition: all 0.1s ease-out;
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

      /* בלוקים מחוברים (אופציונלי) */
      .connected-block { /* Style for the block that was dragged and snapped */
          /* Example: maybe slightly darker border */
          /* border-color: #bbb; */
          z-index: 10; /* Default z-index for connected blocks */
      }
      .has-connected-block { /* Style for the block that something snapped TO */
          /* Example: maybe slightly different background */
          /* background-color: #f8f8f8; */
           z-index: 9; /* Default z-index, slightly lower than the source */
      }
      /* Ensure absolute positioning for connected blocks for stability */
      .connected-block, .has-connected-block {
           position: absolute !important; /* Ensure they stay absolute after connection */
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
  // אתחול מערכת השמע
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
      if (existingAudio) {
          if (CONFIG.DEBUG) console.log("Removing previous audio element.");
          existingAudio.remove();
          snapSound = null;
      }

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
        const button = document.getElementById('sound-test-button');
        if (button) { /* Update button state */ }
        CONFIG.PLAY_SOUND = false; snapSound = null; soundInitialized = false;
      });
      snapSound.addEventListener('canplaythrough', () => {
          if (!soundInitialized) {
              soundInitialized = true;
              if (CONFIG.DEBUG) console.log('Audio element ready.');
              const button = document.getElementById('sound-test-button');
              if (button && button.classList.contains('loading')) { /* Update button state */ }
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
  // הוספת כפתור בדיקת שמע
  // ========================================================================
  function addSoundTestButton() {
    if (!CONFIG.PLAY_SOUND) return;
    try {
      const existingButton = document.getElementById('sound-test-button');
      if (existingButton) existingButton.remove();

      const button = document.createElement('button');
      button.id = 'sound-test-button';
      button.title = 'בדוק צליל';
      button.className = '';

      if (!snapSound && !soundInitialized && CONFIG.PLAY_SOUND) {
          button.textContent = 'שגיאת שמע'; button.classList.add('error'); button.disabled = true;
      } else if (!soundInitialized) {
          button.textContent = 'טוען צליל...'; button.classList.add('loading'); button.disabled = true;
      } else {
          button.textContent = 'בדוק צליל'; button.disabled = false;
      }
      Object.assign(button.style, { /* Apply styles from addHighlightStyles */
            position: 'fixed', bottom: '15px', right: '15px', zIndex: '9999', padding: '8px 12px',
            color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)', fontFamily: 'Arial, sans-serif',
            fontSize: '14px', fontWeight: 'bold', transition: 'background-color 0.2s, opacity 0.5s ease-out', opacity: '1'
      });
       // Set background color based on state
       if (button.classList.contains('error')) button.style.backgroundColor = '#f44336';
       else if (button.classList.contains('loading')) button.style.backgroundColor = '#ff9800';
       else button.style.backgroundColor = '#2196F3';


      button.onmouseover = function() { /* Hover effect */ };
      button.onmouseout = function() { /* Reset hover */ };
      button.addEventListener('click', function() { /* Play sound logic */
            if (this.disabled || !snapSound || !soundInitialized) return;
            snapSound.play().then(() => {
              /* Success: update button, set audioContextAllowed, hide button */
              button.textContent = '✓'; button.classList.add('success'); button.style.backgroundColor = '#4CAF50'; audioContextAllowed = true;
               setTimeout(() => { button.classList.add('hidden'); setTimeout(() => { if(button.parentNode) button.remove(); }, 500); }, 2000);
               if(snapSound) { snapSound.pause(); snapSound.currentTime = 0; }
            }).catch(err => {
                /* Error handling: update button */
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
  // השמעת צליל הצמדה
  // ========================================================================
  function playSnapSound() {
    if (!CONFIG.PLAY_SOUND || !snapSound || !soundInitialized) {
      if (CONFIG.DEBUG && CONFIG.PLAY_SOUND) console.log(`Snap sound skipped: ${!snapSound ? 'No element' : 'Not initialized'}`);
      return;
    }
    if (!audioContextAllowed && CONFIG.DEBUG) console.warn('Attempting sound before interaction.');

    try {
      if (snapSound.readyState < 3) {
          if (CONFIG.DEBUG) console.log('Snap sound skipped: readyState=' + snapSound.readyState);
          return;
      }
      snapSound.pause();
      snapSound.currentTime = 0;
      const playPromise = snapSound.play();
      if (playPromise) {
        playPromise.then(() => {
          audioContextAllowed = true;
          if (CONFIG.DEBUG > 1) console.log('Snap sound played.');
        }).catch(err => {
          if (err.name !== 'AbortError') console.warn('Snap sound play failed:', err);
          if (err.name === 'NotAllowedError' && !document.getElementById('sound-test-button')) addSoundTestButton();
        });
      }
    } catch (err) { console.error('Error playing snap sound:', err); }
  }

  // ========================================================================
  // אתחול מאזינים באזור התכנות
  // ========================================================================
  function initProgrammingAreaListeners() {
    const area = document.getElementById('program-blocks');
    if (!area) { console.error('#program-blocks not found!'); return; }
    area.addEventListener('dragover', e => e.preventDefault());
    area.addEventListener('dragstart', e => {
        if (e.target.closest && e.target.closest('#program-blocks .block-container')) e.preventDefault();
    });
  }

  // ========================================================================
  // האזנה לבלוקים חדשים
  // ========================================================================
  function observeNewBlocks() {
    const area = document.getElementById('program-blocks');
    if (!area) return;
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
                }
            }
          });
        }
      });
    });
    observer.observe(area, { childList: true, subtree: true });
    if (CONFIG.DEBUG) console.log("MutationObserver watching #program-blocks.");
  }

  // ========================================================================
  // הוספת מאזינים לבלוקים קיימים
  // ========================================================================
  function initExistingBlocks() {
      const area = document.getElementById('program-blocks');
      if (!area) return;
      area.querySelectorAll('.block-container').forEach(block => {
          if (!block.id) generateUniqueId(block);
          addBlockDragListeners(block);
      });
      if (CONFIG.DEBUG) console.log("Listeners added to existing blocks.");
  }

  // ========================================================================
  // הוספת מאזיני גרירה וקליק ימני לבלוק
  // ========================================================================
  function addBlockDragListeners(block) {
      block.removeEventListener('mousedown', handleMouseDown); // Prevent duplicates
      block.addEventListener('mousedown', handleMouseDown);
      block.removeEventListener('contextmenu', handleContextMenu);
      block.addEventListener('contextmenu', handleContextMenu);
  }

  // ========================================================================
  // טיפול בלחיצת עכבר על בלוק
  // ========================================================================
  function handleMouseDown(e) {
      if (e.button !== 0 || !e.target.closest) return;
      if (e.target.matches('input, button, select, textarea, a[href], .no-drag')) {
        if (CONFIG.DEBUG > 1) console.log("[MouseDown] Ignored on interactive element.");
        return;
      }

      const block = e.target.closest('.block-container');
      const programmingArea = document.getElementById('program-blocks');
      if (!block || !programmingArea || !programmingArea.contains(block)) return;

      if (!block.id) generateUniqueId(block);

      e.preventDefault();
      block.draggable = false; // Use custom drag only

      if (CONFIG.DEBUG) console.log(`[MouseDown] Started for block: ${block.id}`);

      // Detach block and any blocks attached TO it
      if (block.hasAttribute('data-connected-to')) {
          if (CONFIG.DEBUG) console.log(`[MouseDown] Detaching self (${block.id}) from its target.`);
          detachBlock(block, false); // Detach self silently
      }
      ['left', 'right'].forEach(side => {
          const connectedBlockId = block.getAttribute(`data-connected-from-${side}`);
          if (connectedBlockId) {
              const connectedBlock = document.getElementById(connectedBlockId);
              if (connectedBlock) {
                   if (CONFIG.DEBUG) console.log(`[MouseDown] Detaching block ${connectedBlock.id} from ${side} of ${block.id}.`);
                   detachBlock(connectedBlock, false); // Detach the other block silently
              } else {
                   console.warn(`[MouseDown] Orphaned connection from ${side} on ${block.id} (block ${connectedBlockId} not found). Cleaning up.`);
                   block.removeAttribute(`data-connected-from-${side}`);
              }
          }
      });

      // Start dragging logic
      currentDraggedBlock = block;
      isDraggingBlock = true;

      const rect = block.getBoundingClientRect();
      const parentRect = programmingArea.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;

      // Ensure block is absolutely positioned *within* the programming area for dragging
      // We calculate position relative to parent, accounting for scroll
       const currentStyle = window.getComputedStyle(block);
      if (currentStyle.position !== 'absolute') {
          block.style.position = 'absolute';
          // Calculate position relative to parent, including scroll offset
          block.style.left = `${Math.round(rect.left - parentRect.left + programmingArea.scrollLeft)}px`;
          block.style.top = `${Math.round(rect.top - parentRect.top + programmingArea.scrollTop)}px`;
          block.style.margin = '0'; // Reset margin
          if (CONFIG.DEBUG) console.log(`[MouseDown] Set ${block.id} to absolute at calculated position.`);
      } else {
           // Already absolute, just ensure margin is 0 and maybe update position if needed?
           // For simplicity, let's assume if it's absolute, its position is already relative to the container.
           // However, resetting margin is still good.
           block.style.margin = '0';
           if (CONFIG.DEBUG > 1) console.log(`[MouseDown] ${block.id} was already absolute.`);
      }


      block.style.zIndex = '1001'; // Bring to top during drag
      block.classList.add('snap-source');
      document.body.classList.add('user-select-none'); // Prevent text selection globally

      if (CONFIG.DEBUG) console.log(`[MouseDown] Drag setup complete for ${block.id}. Left: ${block.style.left}, Top: ${block.style.top}`);
  }

  // ========================================================================
  // טיפול בקליק ימני על בלוק
  // ========================================================================
  function handleContextMenu(e) {
      e.preventDefault();
      const block = e.target.closest('.block-container');
      if (block && block.hasAttribute('data-connected-to')) { // Only show if *it* is connected *to* something
          showDetachMenu(e.clientX, e.clientY, block);
      }
  }

  // ========================================================================
  // מאזינים גלובליים לעכבר
  // ========================================================================
  function initGlobalMouseListeners() {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
  }
  function handleMouseLeave(e) { // Handle mouse leaving the document window
      if (isDraggingBlock && e.target === document.documentElement && !e.relatedTarget) {
          if (CONFIG.DEBUG) console.warn("Mouse left document during drag, treating as mouseup.");
          handleMouseUp(e);
      }
  }

  // ========================================================================
  // טיפול בתנועת עכבר
  // ========================================================================
  function handleMouseMove(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;
    e.preventDefault();

    const parentElement = document.getElementById('program-blocks');
    if (!parentElement) { console.error("Programming area lost during move!"); handleMouseUp(e); return; }

    const parentRect = parentElement.getBoundingClientRect();
    let newLeft = e.clientX - parentRect.left - dragOffset.x + parentElement.scrollLeft;
    let newTop = e.clientY - parentRect.top - dragOffset.y + parentElement.scrollTop;

    const blockWidth = currentDraggedBlock.offsetWidth;
    const blockHeight = currentDraggedBlock.offsetHeight;
    newLeft = Math.max(0, Math.min(newLeft, parentElement.scrollWidth - blockWidth));
    newTop = Math.max(0, Math.min(newTop, parentElement.scrollHeight - blockHeight));

    currentDraggedBlock.style.left = `${Math.round(newLeft)}px`;
    currentDraggedBlock.style.top = `${Math.round(newTop)}px`;

    checkAndHighlightSnapPossibility();
  }

  // ========================================================================
  // טיפול בשחרור עכבר
  // ========================================================================
  function handleMouseUp(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    const blockReleased = currentDraggedBlock;
    const targetToSnap = potentialSnapTarget;
    const directionToSnap = snapDirection;

    if (CONFIG.DEBUG) console.log(`[MouseUp] Releasing ${blockReleased.id}. Target: ${targetToSnap?.id || 'none'}. Dir: ${directionToSnap || 'none'}.`);

    // Cleanup dragging state FIRST
    isDraggingBlock = false;
    currentDraggedBlock = null;
    potentialSnapTarget = null;
    snapDirection = null;
    document.body.classList.remove('user-select-none');
    blockReleased.classList.remove('snap-source'); // Remove drag styling
    blockReleased.style.zIndex = ''; // Reset z-index or let CSS handle it

    // Remove highlights from all blocks
    document.querySelectorAll('.snap-target, .snap-left, .snap-right').forEach(el => {
      el.classList.remove('snap-target', 'snap-left', 'snap-right');
    });
    removeFuturePositionIndicator(); // Hide blue indicator

    // Perform snap IF valid target exists
    if (targetToSnap && directionToSnap) {
      if (CONFIG.DEBUG) console.log(`[MouseUp] Attempting snap operation...`);
      const snapSuccess = performBlockSnap(blockReleased, targetToSnap, directionToSnap);
      if (snapSuccess) {
           blockReleased.draggable = false; // Prevent native drag after successful custom snap
           if (CONFIG.DEBUG) console.log(`[MouseUp] Snap successful. ${blockReleased.id} draggable = false.`);
      } else {
           blockReleased.draggable = true; // Ensure draggable if snap failed
           if (CONFIG.DEBUG) console.log(`[MouseUp] Snap failed. ${blockReleased.id} draggable = true.`);
      }
    } else {
      // No snap, ensure block is draggable
      blockReleased.draggable = true;
      if (CONFIG.DEBUG) console.log(`[MouseUp] No snap target. ${blockReleased.id} draggable = true.`);
    }

    if (CONFIG.DEBUG) console.log(`[MouseUp] ----- End MouseUp for ${blockReleased.id} -----`);
  }

  // ========================================================================
  // בדיקת הצמדה והדגשה
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

    // Reset previous highlights
    document.querySelectorAll('.snap-target').forEach(el => el.classList.remove('snap-target', 'snap-left', 'snap-right'));
    potentialSnapTarget = null; snapDirection = null;
    removeFuturePositionIndicator();

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

         if (connectionAllowed) {
             minDistance = snapInfo.distance;
             bestTarget = targetBlock;
             bestDirection = snapInfo.direction;
         } else {
              if (CONFIG.DEBUG > 1) console.log(`[Highlight] Snap blocked: Target ${targetBlock.id} side '${snapInfo.direction}' occupied.`);
         }
      }
    }

    // Highlight best target if found
    if (bestTarget) {
      potentialSnapTarget = bestTarget;
      snapDirection = bestDirection;
      bestTarget.classList.add('snap-target', `snap-${bestDirection}`); // Add target and direction class
      const programRect = programmingArea.getBoundingClientRect();
      updateFuturePositionIndicator(currentDraggedBlock, bestTarget, bestDirection, programRect);
       if (CONFIG.DEBUG > 1) console.log(`[Highlight] Potential: ${currentDraggedBlock.id} -> ${bestTarget.id} (${bestDirection}), dist: ${minDistance.toFixed(1)}`);
    }
  }

  // ========================================================================
  // חישוב מידע הצמדה
  // ========================================================================
  function calculateSnapInfo(sourceRect, targetRect) {
    // 1. Vertical Overlap Check
    const vOverlap = Math.max(0, Math.min(sourceRect.bottom, targetRect.bottom) - Math.max(sourceRect.top, targetRect.top));
    const minOverlap = Math.min(sourceRect.height, targetRect.height) * CONFIG.VERTICAL_OVERLAP_REQ;
    if (vOverlap < minOverlap || vOverlap <= 0) return null;

    // 2. Horizontal Distance Check
    const distRToL = Math.abs(sourceRect.right - targetRect.left); // Source Right to Target Left
    const distLToR = Math.abs(sourceRect.left - targetRect.right); // Source Left to Target Right

    let distance, direction;
    if (distRToL < distLToR) { // Source aims for the left side of Target
        distance = distRToL; direction = 'left';
    } else { // Source aims for the right side of Target
        distance = distLToR; direction = 'right';
    }

    // 3. Check Threshold
    if (distance <= CONFIG.CONNECT_THRESHOLD) {
         if (CONFIG.DEBUG > 1) console.log(`[CalcSnap] Possible: dir=${direction}, dist=${distance.toFixed(1)}, vOverlap=${vOverlap.toFixed(1)}`);
        return { direction, distance };
    }
    return null;
  }


  // ========================================================================
  // ביצוע ההצמדה - *** כולל וידוא מיקום אבסולוטי של המטרה ***
  // ========================================================================
  function performBlockSnap(sourceBlock, targetBlock, direction) {
    if (!sourceBlock || !targetBlock || !document.body.contains(targetBlock) || targetBlock.offsetParent === null) {
      console.warn(`[PerformSnap] Invalid or detached source/target. Target: ${targetBlock?.id}. Snap cancelled.`);
      return false; // Invalid state
    }
    const targetAttrToCheck = `data-connected-from-${direction}`;
    if (targetBlock.hasAttribute(targetAttrToCheck)) {
        console.warn(`[PerformSnap] Target ${targetBlock.id} slot '${direction}' occupied. Snap cancelled.`);
        return false; // Slot taken
    }

    if (CONFIG.DEBUG) console.log(`[PerformSnap] Snapping ${sourceBlock.id} to the '${direction}' side of ${targetBlock.id}`);

    try {
        const parentElement = document.getElementById('program-blocks');
        const parentRect = parentElement.getBoundingClientRect();

        // *** START: Ensure Target Block is Absolutely Positioned ***
        const targetStyle = window.getComputedStyle(targetBlock);
        if (targetStyle.position !== 'absolute') {
            if (CONFIG.DEBUG) console.log(`[PerformSnap] Target ${targetBlock.id} is not absolute. Setting position...`);
            const targetRectBefore = targetBlock.getBoundingClientRect(); // Get position BEFORE changing
            targetBlock.style.position = 'absolute';
            targetBlock.style.left = `${Math.round(targetRectBefore.left - parentRect.left + parentElement.scrollLeft)}px`;
            targetBlock.style.top = `${Math.round(targetRectBefore.top - parentRect.top + parentElement.scrollTop)}px`;
            targetBlock.style.margin = '0'; // Reset margin
        }
        // *** END: Ensure Target Block is Absolutely Positioned ***

        // Now get potentially updated positions/dimensions
        const sourceRect = sourceBlock.getBoundingClientRect();
        const targetRect = targetBlock.getBoundingClientRect(); // Use the potentially updated rect

        // Calculate final position for source block (relative to viewport first)
        let finalViewportLeft;
        const finalViewportTop = targetRect.top; // Align tops

        if (direction === 'left') { // Source to the left of target
            finalViewportLeft = targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP;
        } else { // Source to the right of target
            finalViewportLeft = targetRect.right + CONFIG.BLOCK_GAP;
        }

        // Convert viewport position to parent-relative style values
        let styleLeft = finalViewportLeft - parentRect.left + parentElement.scrollLeft;
        let styleTop = finalViewportTop - parentRect.top + parentElement.scrollTop;

        // Apply final position to source block
        sourceBlock.style.position = 'absolute'; // Ensure source is absolute
        sourceBlock.style.left = `${Math.round(styleLeft)}px`;
        sourceBlock.style.top = `${Math.round(styleTop)}px`;
        sourceBlock.style.margin = '0';

        // Update data attributes
        sourceBlock.setAttribute('data-connected-to', targetBlock.id);
        sourceBlock.setAttribute('data-connection-direction', direction);
        targetBlock.setAttribute(targetAttrToCheck, sourceBlock.id);

        // Add CSS classes (which now ensure position:absolute)
        sourceBlock.classList.add('connected-block');
        targetBlock.classList.add('has-connected-block');

        // Play sound & animation
        playSnapSound(); // <-- Sound plays here
        addSnapEffectAnimation(sourceBlock);

        // Source is connected, make non-draggable via HTML API
        sourceBlock.draggable = false;

        if (CONFIG.DEBUG) console.log(`[PerformSnap] Snap success: ${sourceBlock.id} at L=${Math.round(styleLeft)} T=${Math.round(styleTop)}. Target ${targetBlock.id} pos: ${targetBlock.style.position}.`);
        return true;

    } catch (err) {
        console.error(`[PerformSnap] Error during snap:`, err);
        try { detachBlock(sourceBlock, false); } // Attempt cleanup
        catch (detachErr) { console.error(`[PerformSnap] Error during cleanup detach:`, detachErr); }
        sourceBlock.draggable = true; // Ensure draggable on failure
        return false;
    }
}

  // ========================================================================
  // עדכון מחוון מיקום עתידי
  // ========================================================================
  function updateFuturePositionIndicator(sourceBlock, targetBlock, direction, programRect) {
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;
    if (!futureIndicator) { /* Create indicator if needed */
        futureIndicator = document.createElement('div');
        futureIndicator.id = 'future-position-indicator';
        futureIndicator.className = 'future-position-indicator';
        programmingArea.appendChild(futureIndicator);
    }
    try {
        const sourceRectNow = sourceBlock.getBoundingClientRect();
        const targetRect = targetBlock.getBoundingClientRect();
        const parentRect = programRect; // Passed in parent rect

        let desiredViewportLeft, desiredViewportTop = targetRect.top;
        if (direction === 'left') { desiredViewportLeft = targetRect.left - sourceRectNow.width - CONFIG.BLOCK_GAP; }
        else { desiredViewportLeft = targetRect.right + CONFIG.BLOCK_GAP; }

        let indicatorLeft = desiredViewportLeft - parentRect.left + programmingArea.scrollLeft;
        let indicatorTop = desiredViewportTop - parentRect.top + programmingArea.scrollTop;

        Object.assign(futureIndicator.style, {
            left: `${Math.round(indicatorLeft)}px`, top: `${Math.round(indicatorTop)}px`,
            width: `${Math.round(sourceRectNow.width)}px`, height: `${Math.round(sourceRectNow.height)}px`
        });
        futureIndicator.classList.add('visible');
    } catch (err) { console.error('Error updating future indicator:', err); removeFuturePositionIndicator(); }
  }

  // ========================================================================
  // הסרת מחוון מיקום עתידי
  // ========================================================================
  function removeFuturePositionIndicator() {
    if (futureIndicator) futureIndicator.classList.remove('visible');
  }

  // ========================================================================
  // ניתוק בלוקים ותפריט
  // ========================================================================
  function showDetachMenu(x, y, block) {
    removeDetachMenu();
    const menu = document.createElement('div'); menu.id = 'detach-menu';
    Object.assign(menu.style, { left: `${x}px`, top: `${y}px` });
    const option = document.createElement('div'); option.textContent = 'נתק';
    option.onclick = (e) => { e.stopPropagation(); detachBlock(block, true); removeDetachMenu(); };
    menu.appendChild(option); document.body.appendChild(menu);
    setTimeout(() => {
        document.addEventListener('click', closeMenuOutside, { capture: true, once: true });
        window.addEventListener('scroll', removeDetachMenu, { capture: true, once: true });
    }, 0);
  }
  function closeMenuOutside(e) {
    const menu = document.getElementById('detach-menu');
    if (menu && !menu.contains(e.target)) removeDetachMenu();
    else if (menu) setTimeout(() => { document.addEventListener('click', closeMenuOutside, { capture: true, once: true }); }, 0);
    window.removeEventListener('scroll', removeDetachMenu, { capture: true });
  }
  function removeDetachMenu() {
    const menu = document.getElementById('detach-menu');
    if (menu) {
        document.removeEventListener('click', closeMenuOutside, { capture: true });
        window.removeEventListener('scroll', removeDetachMenu, { capture: true });
        menu.remove();
    }
  }
  function detachBlock(blockToDetach, animate = true) {
    if (!blockToDetach || !blockToDetach.hasAttribute('data-connected-to')) {
        if (blockToDetach) blockToDetach.draggable = true; // Ensure draggable if not connected
        if (CONFIG.DEBUG > 1 && blockToDetach) console.log(`[Detach] Block ${blockToDetach.id} not connected TO anything.`);
        return;
    }
    const targetId = blockToDetach.getAttribute('data-connected-to');
    const direction = blockToDetach.getAttribute('data-connection-direction');
    if (!targetId || !direction) { /* Handle missing data, make draggable */
        console.warn(`[Detach] Missing data on ${blockToDetach.id}. Cleaning up.`);
        blockToDetach.removeAttribute('data-connected-to'); blockToDetach.removeAttribute('data-connection-direction');
        blockToDetach.classList.remove('connected-block'); blockToDetach.draggable = true;
        return;
    }

    if (CONFIG.DEBUG) console.log(`[Detach] Detaching ${blockToDetach.id} from ${targetId} (was on '${direction}' side).`);

    // Cleanup source block
    blockToDetach.removeAttribute('data-connected-to'); blockToDetach.removeAttribute('data-connection-direction');
    blockToDetach.classList.remove('connected-block');
    blockToDetach.draggable = true; // Make draggable again

    // Cleanup target block
    const targetBlock = document.getElementById(targetId);
    if (targetBlock) {
        targetBlock.removeAttribute(`data-connected-from-${direction}`);
        const hasOtherConn = targetBlock.matches('[data-connected-from-left], [data-connected-from-right], [data-connected-to]');
        if (!hasOtherConn) targetBlock.classList.remove('has-connected-block');
        if (CONFIG.DEBUG > 1) console.log(`[Detach] Target ${targetId} cleaned. Still connected: ${hasOtherConn}`);
    } else { console.warn(`[Detach] Target ${targetId} not found.`); }

    if (animate) addDetachEffectAnimation(blockToDetach);
    if (CONFIG.DEBUG) console.log(`[Detach] Finished detaching ${blockToDetach.id}.`);
  }

  // ========================================================================
  // אנימציות עזר
  // ========================================================================
  function addSnapEffectAnimation(block) {
    block.classList.remove('snap-animation'); void block.offsetWidth; block.classList.add('snap-animation');
    block.addEventListener('animationend', () => block.classList.remove('snap-animation'), { once: true });
  }
  function addDetachEffectAnimation(block) {
    block.classList.remove('detach-animation'); void block.offsetWidth; block.classList.add('detach-animation');
    block.addEventListener('animationend', () => block.classList.remove('detach-animation'), { once: true });
  }

  // ========================================================================
  // יצירת ID ייחודי
  // ========================================================================
  function generateUniqueId(block) {
    if (block.id) return block.id;
    const prefix = block.dataset.type || block.classList[0] || 'block';
    let id = `${prefix}-${Math.random().toString(36).substring(2, 7)}`;
    let i = 0;
    while (document.getElementById(id) && i < 10) { id = `${prefix}-${Math.random().toString(36).substring(2, 7)}-${i++}`; }
    if (i >= 10) id = `${prefix}-${Date.now()}`; // Fallback
    block.id = id;
    if (CONFIG.DEBUG) console.log(`Generated ID: ${id}`);
    return id;
  }

  // ========================================================================
  // אתחול המערכת
  // ========================================================================
  function initializeSystem() {
    if (window.blockLinkageInitialized) { if (CONFIG.DEBUG) console.log("Linkage already initialized."); return; }

    addHighlightStyles();
    initAudio();
    initProgrammingAreaListeners();
    observeNewBlocks();
    initExistingBlocks();
    initGlobalMouseListeners();
    if (CONFIG.PLAY_SOUND) addSoundTestButton();

    window.blockLinkageInitialized = true;
    console.log(`Block linkage system initialized (Version 3.4 - Target Position Fix)`);
    console.log(`Config: Thresh=${CONFIG.CONNECT_THRESHOLD}, Overlap=${CONFIG.VERTICAL_OVERLAP_REQ*100}%, Sound=${CONFIG.PLAY_SOUND ? CONFIG.SOUND_PATH : 'Off'}`);
  }

  // הפעל את האתחול
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initializeSystem); }
  else { initializeSystem(); }

})(); // End IIFE

// --- END OF FILE linkageimproved.js ---
