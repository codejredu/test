// --- START OF FILE linkageimproved.js ---
// --- Version 3.4: Final Proximity Check on Mouse Up ---
// Changes from v3.3:
// 1. Modified handleMouseUp: Performs a final proximity check (distance & overlap)
//    *at the moment of mouse release* before executing the snap.
//    This prevents blocks from "jumping" to snap if the mouse moved slightly
//    out of range just before release.
// 2. Snap only occurs if the final check passes AND the snap direction is consistent.

(function() {
  // משתנים גלובליים במודול
  let currentDraggedBlock = null;
  let potentialSnapTarget = null; // Stores the *candidate* target identified during move
  let snapDirection = null; // Stores the *candidate* direction identified during move
  let isDraggingBlock = false;
  let dragOffset = { x: 0, y: 0 };
  let futureIndicator = null;
  let snapSound = null; // אודיו לצליל הצמדה
  let audioContextAllowed = false; // Track if user interaction has allowed audio
  let soundInitialized = false; // Track if initAudio was successful

  // קונפיגורציה - פרמטרים שניתן להתאים
  const CONFIG = {
    PIN_WIDTH: 5,
    CONNECT_THRESHOLD: 3, // סף הדוק להפעלת הדגשה והצמדה (ניתן להגדיל מעט לנוחות)
    VERTICAL_ALIGN_THRESHOLD: 20,
    VERTICAL_OVERLAP_REQ: 0.4, // דרישה ל-40% חפיפה אנכית לפחות
    BLOCK_GAP: 0, // אין רווח בין בלוקים מוצמדים
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3', // ודא שהנתיב נכון
    DEBUG: true // Set to false for production
  };

  // ========================================================================
  // הוספת סגנונות CSS - הילה צהובה, מחוון כחול (ללא שינוי מ-v3.3)
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
         z-index: 1001 !important;
      }

      /* הילה צהובה סביב יעד פוטנציאלי */
      .snap-target {
        outline: 6px solid #FFC107 !important; /* צהוב */
        outline-offset: 4px;
        box-shadow: 0 0 20px 8px rgba(255, 193, 7, 0.8) !important;
        transition: outline 0.1s ease-out, box-shadow 0.1s ease-out;
        z-index: 999 !important;
      }

      /* מלבן כחול מקווקו למיקום עתידי */
      .future-position-indicator {
        position: absolute;
        border: 3px dashed rgba(0, 120, 255, 0.95) !important; /* כחול */
        border-radius: 5px;
        background-color: rgba(0, 120, 255, 0.15) !important; /* כחול שקוף */
        pointer-events: none;
        z-index: 998;
        opacity: 0;
        transition: opacity 0.15s ease-out, left 0.05s linear, top 0.05s linear;
        display: none;
      }
       .future-position-indicator.visible { display: block; opacity: 0.9; }

      /* סימון כיוון (פס צהוב בצד) */
      .snap-target.snap-left::before {
        content: ''; position: absolute; left: -10px; top: 10%; bottom: 10%; width: 8px;
        background-color: #FFC107; border-radius: 2px; z-index: 1000;
        box-shadow: 0 0 10px 2px rgba(255, 193, 7, 0.8); transition: all 0.1s ease-out;
      }
      .snap-target.snap-right::after {
        content: ''; position: absolute; right: -10px; top: 10%; bottom: 10%; width: 8px;
        background-color: #FFC107; border-radius: 2px; z-index: 1000;
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

      /* כללי */
      body.user-select-none { user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; }
      .connected-block, .has-connected-block { /* Optional styling */ }

      /* כפתור בדיקת שמע */
      #sound-test-button { position: fixed; bottom: 15px; right: 15px; padding: 8px 12px; background-color: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; z-index: 9999; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2); transition: background-color 0.2s, opacity 0.5s ease-out; opacity: 1; }
      #sound-test-button:hover { background-color: #0b7dda; }
      #sound-test-button.success { background-color: #4CAF50; }
      #sound-test-button.error { background-color: #f44336; }
      #sound-test-button.loading { background-color: #ff9800; cursor: wait; }
      #sound-test-button.hidden { opacity: 0; pointer-events: none; }
    `;
    document.head.appendChild(style);
    if (CONFIG.DEBUG) console.log('Styles added (Yellow Halo, Blue Indicator)');
  }

  // ========================================================================
  // אתחול מערכת השמע (קובץ MP3) - ללא שינוי מ-v3.3
  // ========================================================================
  function initAudio() {
    if (!CONFIG.PLAY_SOUND || soundInitialized) return;
    try {
      const existingAudio = document.getElementById('snap-sound-element');
      if (existingAudio) {
          snapSound = existingAudio; soundInitialized = true;
          if (CONFIG.DEBUG) console.log('Audio element reused.');
          if (!snapSound.querySelector(`source[src="${CONFIG.SOUND_PATH}"]`)) {
               snapSound.innerHTML = ''; const source = document.createElement('source');
               source.src = CONFIG.SOUND_PATH; source.type = 'audio/mpeg';
               snapSound.appendChild(source); snapSound.load();
          } return;
      }
      snapSound = document.createElement('audio'); snapSound.id = 'snap-sound-element';
      snapSound.preload = 'auto'; snapSound.volume = CONFIG.SOUND_VOLUME;
      const source = document.createElement('source'); source.src = CONFIG.SOUND_PATH;
      source.type = 'audio/mpeg'; snapSound.appendChild(source);
      snapSound.addEventListener('error', (e) => {
        console.error(`Error loading audio: ${CONFIG.SOUND_PATH}`, e);
        const button = document.getElementById('sound-test-button');
        if (button) { button.textContent = 'שגיאת טעינה'; button.className = 'error'; button.disabled = true; }
        CONFIG.PLAY_SOUND = false; snapSound = null; soundInitialized = false;
      });
      snapSound.addEventListener('canplaythrough', () => {
          soundInitialized = true; if (CONFIG.DEBUG) console.log('Audio ready.');
          const button = document.getElementById('sound-test-button');
          if (button?.classList.contains('loading')) { button.textContent = 'בדוק צליל'; button.classList.remove('loading'); button.disabled = false; }
      });
      snapSound.style.display = 'none'; document.body.appendChild(snapSound);
      if (CONFIG.DEBUG) console.log(`Audio element created: ${CONFIG.SOUND_PATH}`);
    } catch (err) { console.error('Audio init error:', err); CONFIG.PLAY_SOUND = false; snapSound = null; soundInitialized = false; }
  }

  // ========================================================================
  // הוספת כפתור בדיקת שמע - ללא שינוי מ-v3.3
  // ========================================================================
   function addSoundTestButton() {
     if (!CONFIG.PLAY_SOUND) return;
    try {
      const existingButton = document.getElementById('sound-test-button');
      if (existingButton) existingButton.remove();
      const button = document.createElement('button'); button.id = 'sound-test-button';
      button.title = 'בדוק צליל הצמדה'; button.className = '';
      if (!snapSound) { button.textContent = 'שמע נכשל'; button.classList.add('error'); button.disabled = true; }
      else if (!soundInitialized) { button.textContent = 'טוען צליל...'; button.classList.add('loading'); button.disabled = true; }
      else { button.textContent = 'בדוק צליל'; button.disabled = false; }
      Object.assign(button.style, { position: 'fixed', bottom: '15px', right: '15px', zIndex: '9999', padding: '8px 12px', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', fontFamily: 'Arial, sans-serif', fontSize: '14px', fontWeight: 'bold', transition: 'background-color 0.2s, opacity 0.5s ease-out', opacity: '1' });
      button.onmouseover = function() { if (!this.disabled && !this.classList.contains('success') && !this.classList.contains('error')) this.style.backgroundColor = '#0b7dda'; };
      button.onmouseout = function() { if (!this.disabled && !this.classList.contains('success') && !this.classList.contains('error')) this.style.backgroundColor = '#2196F3'; };
      button.addEventListener('click', function() {
        if (this.disabled || !snapSound || !soundInitialized) return;
        snapSound.play().then(() => {
          button.textContent = 'פועל ✓'; button.classList.add('success'); audioContextAllowed = true;
          setTimeout(() => { button.classList.add('hidden'); setTimeout(() => button.remove(), 500); }, 3000);
          if(snapSound) { snapSound.pause(); snapSound.currentTime = 0; }
        }).catch(err => {
          console.warn('Sound test failed:', err.name);
          if (err.name === 'NotAllowedError') { button.textContent = 'חסום-לחץ שוב'; button.classList.add('error'); audioContextAllowed = false; }
          else { button.textContent = 'שגיאת נגינה'; button.classList.add('error'); button.disabled = true; }
        });
      });
      document.body.appendChild(button); if (CONFIG.DEBUG) console.log('Sound test button added.');
    } catch (err) { console.error('Error adding sound test button:', err); }
  }

  // ========================================================================
  // השמעת צליל הצמדה (MP3) - ללא שינוי מ-v3.3
  // ========================================================================
  function playSnapSound() {
    if (!CONFIG.PLAY_SOUND || !snapSound || !soundInitialized) return;
    if (!audioContextAllowed && CONFIG.DEBUG) console.warn('Playing sound before user interaction.');
    try {
      if (snapSound.readyState < 3) { if (CONFIG.DEBUG) console.log('Snap sound skipped: audio not ready.'); return; }
      snapSound.pause(); snapSound.currentTime = 0;
      const playPromise = snapSound.play();
      if (playPromise !== undefined) {
        playPromise.then(() => { audioContextAllowed = true; if (CONFIG.DEBUG > 1) console.log('Snap sound played.'); })
        .catch(err => {
          if (err.name === 'NotAllowedError') { console.warn('Snap sound blocked.'); audioContextAllowed = false; if (!document.getElementById('sound-test-button')) addSoundTestButton(); }
          else if (err.name !== 'AbortError') { console.error('Error playing snap sound:', err); }
        });
      }
    } catch (err) { console.error('Unexpected play sound error:', err); }
  }

  // ========================================================================
  // מאזינים לאזור התכנות, בלוקים חדשים/קיימים, קליק ימני - ללא שינוי מ-v3.3
  // ========================================================================
  function initProgrammingAreaListeners() {
    const area = document.getElementById('program-blocks'); if (!area) return;
    area.addEventListener('dragover', (e) => e.preventDefault());
    area.addEventListener('dragstart', (e) => { if (e.target?.closest?.('#program-blocks .block-container')) e.preventDefault(); });
  }
  function observeNewBlocks() {
    const area = document.getElementById('program-blocks'); if (!area) return;
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
                let block = node.classList?.contains('block-container') ? node : node.querySelector?.('.block-container');
                if (block?.closest('#program-blocks')) { if (!block.id) generateUniqueId(block); addBlockDragListeners(block); }
            }
          });
        }
      });
    });
    observer.observe(area, { childList: true, subtree: true });
    if (CONFIG.DEBUG) console.log("MutationObserver watching for new blocks.");
  }
  function initExistingBlocks() {
      document.querySelectorAll('#program-blocks .block-container').forEach(block => {
          if (!block.id) generateUniqueId(block); addBlockDragListeners(block);
      }); if (CONFIG.DEBUG) console.log("Listeners added to existing blocks.");
  }
  function addBlockDragListeners(block) {
      block.removeEventListener('mousedown', handleMouseDown); block.addEventListener('mousedown', handleMouseDown);
      block.removeEventListener('contextmenu', handleContextMenu); block.addEventListener('contextmenu', handleContextMenu);
  }
  function handleContextMenu(e) {
      e.preventDefault();
      const block = e.target.closest('.block-container');
      if (block?.hasAttribute('data-connected-to')) showDetachMenu(e.clientX, e.clientY, block);
  }

  // ========================================================================
  // טיפול בלחיצת עכבר על בלוק (MouseDown) - ללא שינוי מ-v3.3
  // ========================================================================
  function handleMouseDown(e) {
      if (e.button !== 0 || !e.target.closest || e.target.matches('input, button, select, textarea, a[href]')) return;
      const block = e.target.closest('.block-container');
      if (!block || !block.parentElement || block.parentElement.id !== 'program-blocks') return;
      if (!block.id) generateUniqueId(block);
      e.preventDefault(); block.draggable = false;
      if (CONFIG.DEBUG) console.log(`[MouseDown] Start drag: ${block.id}`);

      // Detach if connected
      if (block.hasAttribute('data-connected-to')) detachBlock(block, false);
      const leftId = block.getAttribute('data-connected-from-left'); if (leftId) detachBlock(document.getElementById(leftId), false);
      const rightId = block.getAttribute('data-connected-from-right'); if (rightId) detachBlock(document.getElementById(rightId), false);

      // Start dragging state
      currentDraggedBlock = block; isDraggingBlock = true;
      const rect = block.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left; dragOffset.y = e.clientY - rect.top;
      const parentElement = document.getElementById('program-blocks');
      const parentRect = parentElement.getBoundingClientRect();
      if (window.getComputedStyle(block).position !== 'absolute') {
        block.style.position = 'absolute';
        block.style.left = (rect.left - parentRect.left + parentElement.scrollLeft) + 'px';
        block.style.top = (rect.top - parentRect.top + parentElement.scrollTop) + 'px';
      }
      block.style.margin = '0'; block.style.zIndex = '1001'; block.classList.add('snap-source');
      document.body.classList.add('user-select-none');
  }

  // ========================================================================
  // מאזינים גלובליים לתנועה ושחרור עכבר - ללא שינוי מ-v3.3
  // ========================================================================
  function initGlobalMouseListeners() {
    document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mousemove', handleMouseMove); document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
  }
  function handleMouseLeave(e) { // Handle mouse leaving the window during drag
      if (isDraggingBlock && e.target === document.documentElement && !e.relatedTarget) {
          if (CONFIG.DEBUG) console.warn("Mouse left document during drag, treating as mouseup.");
          handleMouseUp(e);
      }
  }

  // ========================================================================
  // טיפול בתנועת העכבר (MouseMove) - ללא שינוי מ-v3.3
  // ========================================================================
  function handleMouseMove(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;
    e.preventDefault();
    const parentElement = document.getElementById('program-blocks'); if (!parentElement) { handleMouseUp(e); return; }
    const parentRect = parentElement.getBoundingClientRect();
    let newLeft = e.clientX - parentRect.left - dragOffset.x + parentElement.scrollLeft;
    let newTop = e.clientY - parentRect.top - dragOffset.y + parentElement.scrollTop;
    const blockWidth = currentDraggedBlock.offsetWidth; const blockHeight = currentDraggedBlock.offsetHeight;
    const scrollWidth = parentElement.scrollWidth; const scrollHeight = parentElement.scrollHeight;
    newLeft = Math.max(0, Math.min(newLeft, scrollWidth - blockWidth));
    newTop = Math.max(0, Math.min(newTop, scrollHeight - blockHeight));
    currentDraggedBlock.style.left = Math.round(newLeft) + 'px';
    currentDraggedBlock.style.top = Math.round(newTop) + 'px';
    checkAndHighlightSnapPossibility(); // Check for potential snap target
  }

  // ========================================================================
  // *** שינוי מרכזי כאן ***
  // טיפול בשחרור העכבר (MouseUp) - כולל בדיקת קרבה סופית
  // ========================================================================
  function handleMouseUp(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    const blockReleased = currentDraggedBlock;
    // שמור את היעד והכיוון *הפוטנציאליים* מהבדיקה האחרונה ב-mousemove
    const candidateTarget = potentialSnapTarget;
    const candidateDirection = snapDirection;

    if (CONFIG.DEBUG) console.log(`[MouseUp] Releasing block ${blockReleased.id}. Candidate target from move: ${candidateTarget?.id || 'none'}, direction: ${candidateDirection || 'none'}`);

    // --- ניקוי מיידי של מצב הגרירה וההדגשות ---
    isDraggingBlock = false;
    currentDraggedBlock = null;
    potentialSnapTarget = null; // איפוס המצב הגלובלי (המועמד)
    snapDirection = null;
    document.body.classList.remove('user-select-none');
    blockReleased.classList.remove('snap-source');
    blockReleased.style.zIndex = '';
    // הסר הדגשות מכל הבלוקים האפשריים
    document.querySelectorAll('.snap-target').forEach(el => {
      el.classList.remove('snap-target', 'snap-left', 'snap-right');
    });
    removeFuturePositionIndicator(); // הסתר מחוון כחול
    // --- סוף ניקוי ---

    // *** בדיקה סופית של הקרבה ברגע השחרור ***
    let performSnap = false; // דגל לקביעה אם לבצע הצמדה
    if (candidateTarget && candidateDirection && document.body.contains(candidateTarget)) { // ודא שהיעד המועמד עדיין קיים בדף
        // קבל את המיקומים המדויקים *ברגע זה*
        const finalSourceRect = blockReleased.getBoundingClientRect();
        const finalTargetRect = candidateTarget.getBoundingClientRect();

        // הרץ מחדש את לוגיקת בדיקת ההצמדה עם המיקומים הסופיים
        // calculateSnapInfo יחזיר ערך רק אם המרחק <= CONNECT_THRESHOLD ויש חפיפה
        const finalSnapInfo = calculateSnapInfo(finalSourceRect, finalTargetRect);

        // בצע הצמדה רק אם הבדיקה הסופית עברה *וגם* הכיוון תואם לכיוון שזוהה קודם
        if (finalSnapInfo && finalSnapInfo.direction === candidateDirection) {
            // ודא שהצד המיועד של היעד עדיין פנוי (בדיקה נוספת למקרה של תחרות)
            const targetSideStillFree = (candidateDirection === 'left' && !candidateTarget.hasAttribute('data-connected-from-left')) ||
                                        (candidateDirection === 'right' && !candidateTarget.hasAttribute('data-connected-from-right'));

            if (targetSideStillFree) {
                if (CONFIG.DEBUG) console.log(`[MouseUp] Final proximity & availability check PASSED for ${blockReleased.id} -> ${candidateTarget.id}. Proceeding with snap.`);
                performSnap = true;
            } else {
                 if (CONFIG.DEBUG) console.log(`[MouseUp] Final check FAILED for ${blockReleased.id} -> ${candidateTarget.id}: Target side '${candidateDirection}' is no longer available. Snap cancelled.`);
            }

        } else {
            if (CONFIG.DEBUG) console.log(`[MouseUp] Final proximity check FAILED for ${blockReleased.id} -> ${candidateTarget.id} (Reason: Distance > ${CONFIG.CONNECT_THRESHOLD}px, insufficient overlap, or direction mismatch). Snap cancelled.`);
        }
    } else {
         if (CONFIG.DEBUG && candidateTarget) console.log(`[MouseUp] Snap cancelled because candidate target ${candidateTarget?.id} no longer exists or was invalid.`);
         else if (CONFIG.DEBUG) console.log(`[MouseUp] No candidate target identified during drag.`);
    }

    // בצע את ההצמדה רק אם הדגל 'performSnap' הוא true
    if (performSnap) {
      // השתמש ב-candidateTarget ו-candidateDirection כי הם עברו את הבדיקה הסופית
      const snapSuccess = performBlockSnap(blockReleased, candidateTarget, candidateDirection);
      if (!snapSuccess) {
          blockReleased.draggable = true; // אפשר גרירה מחדש אם ההצמדה נכשלה מסיבה כלשהי (כגון שגיאה פנימית)
          if (CONFIG.DEBUG) console.log(`[MouseUp] Snap failed post-check (performBlockSnap returned false), ensuring block ${blockReleased.id} is draggable.`);
      } else {
           // ההצמדה הצליחה, draggable נשאר false (כפי שנקבע ב-performBlockSnap)
           if (CONFIG.DEBUG) console.log(`[MouseUp] Snap successful after final check. Block ${blockReleased.id} is connected.`);
      }
    } else {
      // לא התבצעה הצמדה, הבלוק נשאר חופשי במיקומו האחרון
      if (CONFIG.DEBUG) console.log(`[MouseUp] No snap performed based on final check. Block ${blockReleased.id} remains free at its current position.`);
      blockReleased.draggable = true; // ודא שניתן לגרור אותו שוב
    }

    if (CONFIG.DEBUG) console.log(`[MouseUp] ----- End MouseUp for ${blockReleased.id} -----`);
  }


  // ========================================================================
  // בדיקת הצמדה והדגשה (MouseMove) - ללא שינוי מ-v3.3
  // ========================================================================
  function checkAndHighlightSnapPossibility() {
    if (!currentDraggedBlock) return;
    const programmingArea = document.getElementById('program-blocks'); if (!programmingArea) return;
    const sourceRect = currentDraggedBlock.getBoundingClientRect();
    const allVisibleBlocks = Array.from(programmingArea.querySelectorAll('.block-container:not(.snap-source)'))
                                  .filter(block => block.offsetParent !== null);
    let bestTarget = null; let bestDirection = null;
    let minDistance = CONFIG.CONNECT_THRESHOLD + 1;

    // Reset highlights and global state before checking
    document.querySelectorAll('.snap-target').forEach(el => { el.classList.remove('snap-target', 'snap-left', 'snap-right'); });
    potentialSnapTarget = null; snapDirection = null;
    removeFuturePositionIndicator();

    for (const targetBlock of allVisibleBlocks) {
      if (!targetBlock.id) generateUniqueId(targetBlock);
      const targetRect = targetBlock.getBoundingClientRect();
      const targetConnectedLeft = targetBlock.hasAttribute('data-connected-from-left');
      const targetConnectedRight = targetBlock.hasAttribute('data-connected-from-right');

      // Calculate returns info only if distance <= threshold and overlap is sufficient
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

    // If a suitable target is found within the threshold during the move
    if (bestTarget) {
      if (CONFIG.DEBUG > 1) console.log(`[Highlight] Threshold met: ${currentDraggedBlock.id} -> ${bestTarget.id} (${bestDirection}), dist: ${minDistance.toFixed(1)}px. Activating visuals.`);
      // Update global state (will be checked on mouseup)
      potentialSnapTarget = bestTarget; snapDirection = bestDirection;
      // Activate visual indicators
      bestTarget.classList.add('snap-target', bestDirection === 'left' ? 'snap-left' : 'snap-right');
      updateFuturePositionIndicator(currentDraggedBlock, bestTarget, bestDirection, programmingArea.getBoundingClientRect());
    }
    // If no bestTarget found, visuals remain off (due to reset at start)
  }

  // ========================================================================
  // חישוב מידע הצמדה (מרחק וחפיפה) - ללא שינוי מ-v3.3
  // ========================================================================
  function calculateSnapInfo(sourceRect, targetRect) {
    const topOverlap = Math.max(sourceRect.top, targetRect.top);
    const bottomOverlap = Math.min(sourceRect.bottom, targetRect.bottom);
    const verticalOverlap = Math.max(0, bottomOverlap - topOverlap);
    const minHeightReq = Math.min(sourceRect.height, targetRect.height) * CONFIG.VERTICAL_OVERLAP_REQ;
    if (verticalOverlap < minHeightReq || verticalOverlap <= 0) return null; // Not enough overlap

    let distance, direction;
    const distRightToLeft = Math.abs(sourceRect.right - targetRect.left);
    const distLeftToRight = Math.abs(sourceRect.left - targetRect.right);
    if (distRightToLeft < distLeftToRight) { distance = distRightToLeft; direction = 'left'; }
    else { distance = distLeftToRight; direction = 'right'; }

    // Return info ONLY if distance is within threshold
    if (distance <= CONFIG.CONNECT_THRESHOLD) {
       if (CONFIG.DEBUG > 1) console.log(`[calculateSnapInfo] Within threshold (${CONFIG.CONNECT_THRESHOLD}px): dir=${direction}, dist=${distance.toFixed(1)}`);
       return { direction, distance };
    }
    return null; // Distance too large
  }

  // ========================================================================
  // ביצוע ההצמדה הפיזית (נקרא מ-MouseUp) - ללא שינוי מ-v3.3
  // ========================================================================
  function performBlockSnap(sourceBlock, targetBlock, direction) {
    if (!sourceBlock || !targetBlock || !document.body.contains(targetBlock) || targetBlock.offsetParent === null) {
      console.error("[PerformSnap] Invalid block(s). Snap cancelled."); return false;
    }
    // Final check just before modification (defense against race conditions)
     if ((direction === 'left' && targetBlock.hasAttribute('data-connected-from-left')) ||
        (direction === 'right' && targetBlock.hasAttribute('data-connected-from-right'))) {
        console.warn(`[PerformSnap] Snap cancelled: Target ${targetBlock.id} conflict on side '${direction}' just before snap.`);
        return false;
    }
    if (CONFIG.DEBUG) console.log(`[PerformSnap] Snapping ${sourceBlock.id} to ${targetBlock.id} (${direction})`);
    try {
      const sourceRect = sourceBlock.getBoundingClientRect(); const targetRect = targetBlock.getBoundingClientRect();
      const parentElement = document.getElementById('program-blocks'); const parentRect = parentElement.getBoundingClientRect();
      let finalLeft = (direction === 'left') ? (targetRect.left - sourceRect.width - CONFIG.BLOCK_GAP) : (targetRect.right + CONFIG.BLOCK_GAP);
      const finalTop = targetRect.top; // Align top
      let styleLeft = finalLeft - parentRect.left + parentElement.scrollLeft;
      let styleTop = finalTop - parentRect.top + parentElement.scrollTop;

      sourceBlock.style.position = 'absolute'; sourceBlock.style.left = `${Math.round(styleLeft)}px`;
      sourceBlock.style.top = `${Math.round(styleTop)}px`; sourceBlock.style.margin = '0';

      sourceBlock.setAttribute('data-connected-to', targetBlock.id);
      sourceBlock.setAttribute('data-connection-direction', direction);
      targetBlock.setAttribute(direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right', sourceBlock.id);
      sourceBlock.classList.add('connected-block'); targetBlock.classList.add('has-connected-block');

      playSnapSound(); // Play sound on successful snap
      addSnapEffectAnimation(sourceBlock);
      sourceBlock.draggable = false; // Prevent native drag on connected block

      if (CONFIG.DEBUG) console.log(`[PerformSnap] Success. ${sourceBlock.id} pos: L=${styleLeft.toFixed(0)}, T=${styleTop.toFixed(0)}. Draggable: ${sourceBlock.draggable}`);
      return true;
    } catch (err) {
      console.error(`[PerformSnap] Error during snap operation for ${sourceBlock.id} -> ${targetBlock.id}:`, err);
      try { detachBlock(sourceBlock, false); } catch (detachErr) { console.error(`[PerformSnap] Error during cleanup detach:`, detachErr); }
      sourceBlock.draggable = true; // Allow retry drag if snap failed
      return false;
    }
  }

  // ========================================================================
  // עדכון/הסרה של מחוון מיקום עתידי - ללא שינוי מ-v3.3
  // ========================================================================
  function updateFuturePositionIndicator(sourceBlock, targetBlock, direction, programRect) {
    const programmingArea = document.getElementById('program-blocks'); if (!programmingArea) return;
    if (!futureIndicator) {
        futureIndicator = document.createElement('div'); futureIndicator.id = 'future-position-indicator';
        futureIndicator.className = 'future-position-indicator'; programmingArea.appendChild(futureIndicator);
    } try {
        const sourceRectNow = sourceBlock.getBoundingClientRect(); const targetRect = targetBlock.getBoundingClientRect();
        const parentRect = programmingArea.getBoundingClientRect();
        let desiredViewportLeft = (direction === 'left') ? (targetRect.left - sourceRectNow.width - CONFIG.BLOCK_GAP) : (targetRect.right + CONFIG.BLOCK_GAP);
        let desiredViewportTop = targetRect.top;
        let indicatorLeft = desiredViewportLeft - parentRect.left + programmingArea.scrollLeft;
        let indicatorTop = desiredViewportTop - parentRect.top + programmingArea.scrollTop;
        futureIndicator.style.left = Math.round(indicatorLeft) + 'px'; futureIndicator.style.top = Math.round(indicatorTop) + 'px';
        futureIndicator.style.width = Math.round(sourceRectNow.width) + 'px'; futureIndicator.style.height = Math.round(sourceRectNow.height) + 'px';
        futureIndicator.classList.add('visible');
    } catch (err) { console.error('Error updating future indicator:', err); removeFuturePositionIndicator(); }
  }
  function removeFuturePositionIndicator() { if (futureIndicator) futureIndicator.classList.remove('visible'); }

  // ========================================================================
  // פונקציות עזר לניתוק, תפריט, אנימציה, ID ייחודי - ללא שינוי מ-v3.3
  // ========================================================================
  function showDetachMenu(x, y, block) { removeDetachMenu(); const menu = document.createElement('div'); menu.id = 'detach-menu'; menu.style.left = `${x}px`; menu.style.top = `${y}px`; const opt = document.createElement('div'); opt.textContent = 'נתק בלוק'; opt.onclick = (e) => { e.stopPropagation(); detachBlock(block, true); removeDetachMenu(); }; menu.appendChild(opt); document.body.appendChild(menu); setTimeout(() => { document.addEventListener('click', closeMenuOutside, { capture: true, once: true }); window.addEventListener('scroll', removeDetachMenu, { capture: true, once: true }); }, 0); }
  function closeMenuOutside(e) { const menu = document.getElementById('detach-menu'); if (menu && !menu.contains(e.target)) removeDetachMenu(); else if (menu) setTimeout(() => document.addEventListener('click', closeMenuOutside, { capture: true, once: true }), 0); window.removeEventListener('scroll', removeDetachMenu, { capture: true }); }
  function removeDetachMenu() { const menu = document.getElementById('detach-menu'); if (menu) { document.removeEventListener('click', closeMenuOutside, { capture: true }); window.removeEventListener('scroll', removeDetachMenu, { capture: true }); menu.remove(); } }
  function detachBlock(blockToDetach, animate = true) {
    if (!blockToDetach || !blockToDetach.hasAttribute('data-connected-to')) return;
    const targetId = blockToDetach.getAttribute('data-connected-to'); const direction = blockToDetach.getAttribute('data-connection-direction');
    if (!targetId || !direction) { console.warn(`[Detach] Missing data on ${blockToDetach.id}. Cleaning up.`); blockToDetach.removeAttribute('data-connected-to'); blockToDetach.removeAttribute('data-connection-direction'); blockToDetach.classList.remove('connected-block'); blockToDetach.draggable = true; return; }
    if (CONFIG.DEBUG) console.log(`[Detach] Detaching ${blockToDetach.id} from ${targetId}`);
    blockToDetach.removeAttribute('data-connected-to'); blockToDetach.removeAttribute('data-connection-direction'); blockToDetach.classList.remove('connected-block'); blockToDetach.draggable = true; // Make draggable again!
    const targetBlock = document.getElementById(targetId);
    if (targetBlock) { targetBlock.removeAttribute(direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right'); const hasOtherCons = targetBlock.hasAttribute('data-connected-from-left') || targetBlock.hasAttribute('data-connected-from-right') || targetBlock.hasAttribute('data-connected-to'); if (!hasOtherCons) targetBlock.classList.remove('has-connected-block'); }
    else { console.warn(`[Detach] Target block ${targetId} not found.`); }
    if (animate) addDetachEffectAnimation(blockToDetach);
    if (CONFIG.DEBUG) console.log(`[Detach] Finished ${blockToDetach.id}. Draggable: ${blockToDetach.draggable}`);
  }
  function addSnapEffectAnimation(block) { block.classList.remove('snap-animation'); void block.offsetWidth; block.classList.add('snap-animation'); block.addEventListener('animationend', () => block.classList.remove('snap-animation'), { once: true }); }
  function addDetachEffectAnimation(block) { block.classList.remove('detach-animation'); void block.offsetWidth; block.classList.add('detach-animation'); block.addEventListener('animationend', () => block.classList.remove('detach-animation'), { once: true }); }
  function generateUniqueId(block) { if (block.id) return block.id; const prefix = block.dataset.type || 'block'; let suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); let id = `${prefix}-${suffix}`; let i = 0; while (document.getElementById(id) && i < 10) { id = `${prefix}-${suffix}-${i++}`; } if (i >= 10) id = `${prefix}-${Date.now()}`; block.id = id; if (CONFIG.DEBUG) console.log(`Generated ID: ${id}`); return id; }

  // ========================================================================
  // אתחול המערכת כולה
  // ========================================================================
  function initializeSystem() {
    const initFlag = 'blockLinkageInitialized_v3_4'; // Version specific flag
    if (window[initFlag]) {
        if (CONFIG.DEBUG) console.log("Block linkage system v3.4 already initialized. Skipping.");
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
    console.log(`Block linkage system initialized (Version 3.4 - Final Check on Up)`);
    console.log(`Configuration: Snap Threshold=${CONFIG.CONNECT_THRESHOLD}px, Overlap=${CONFIG.VERTICAL_OVERLAP_REQ*100}%, Gap=${CONFIG.BLOCK_GAP}px, Sound=${CONFIG.PLAY_SOUND ? CONFIG.SOUND_PATH : 'Disabled'}`);
  }

  // הפעל את האתחול
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
      initializeSystem(); // DOM already loaded
  }

})(); // סוף IIFE

// --- END OF FILE linkageimproved.js ---
