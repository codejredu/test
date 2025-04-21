// --- START OF FILE linkageimproved_protected_release.js ---
// --- Version 4.0: Protected Release (Snap only if close on MouseUp) ---
// Changes from v3.6:
// 1. Major change in handleMouseUp:
//    - Ignores potential target identified during mousemove.
//    - Performs a *new* proximity check against all possible targets *at the moment of release*.
//    - Snaps ONLY if a valid target is found within CONNECT_THRESHOLD distance *at release*.
//    - No "jumping" behavior if released outside the threshold.
// 2. handleMouseMove still provides visual feedback (highlight/indicator) based on its own check.

(function() {
  // משתנים גלובליים (כמו קודם)
  let currentDraggedBlock = null;
  let potentialSnapTargetForVisuals = null; // Renamed to clarify purpose (visuals only)
  let snapDirectionForVisuals = null;       // Renamed
  let isDraggingBlock = false;
  let dragOffset = { x: 0, y: 0 };
  let futureIndicator = null;
  let snapSound = null;
  let audioContextAllowed = false;
  let soundInitialized = false;

  // קונפיגורציה (כמו קודם, ניתן להתאים ספים)
  const CONFIG = {
    PIN_WIDTH: 5,
    CONNECT_THRESHOLD: 8, // סף לזיהוי קרבה (גם לחיווי וגם להצמדה סופית)
    INDICATOR_TOUCH_THRESHOLD: 1, // סף להצגת מחוון כחול (חיווי בלבד)
    VERTICAL_ALIGN_THRESHOLD: 20, // (לא בשימוש פעיל כרגע בחישוב המרחק)
    VERTICAL_OVERLAP_REQ: 0.4, // דרישה ל-40% חפיפה אנכית לפחות
    BLOCK_GAP: 0, // רווח סופי בין בלוקים מחוברים
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3',
    DEBUG: true
  };

  // ========================================================================
  // הוספת סגנונות CSS, אתחול אודיו, כפתור בדיקה, נגינת צליל
  // (ללא שינוי מגרסאות קודמות v3.x)
  // ========================================================================
  function addHighlightStyles() { /* ... ללא שינוי ... */ }
  function initAudio() { /* ... ללא שינוי ... */ }
  function addSoundTestButton() { /* ... ללא שינוי ... */ }
  function playSnapSound() { /* ... ללא שינוי ... */ }

  // ========================================================================
  // מאזינים לאזור התכנות, מעקב אחר בלוקים חדשים, מאזינים לבלוקים קיימים
  // (ללא שינוי מגרסאות קודמות v3.x)
  // ========================================================================
  function initProgrammingAreaListeners() { /* ... ללא שינוי ... */ }
  function observeNewBlocks() { /* ... ללא שינוי ... */ }
  function initExistingBlocks() { /* ... ללא שינוי ... */ }
  function addBlockDragListeners(b) { /* ... ללא שינוי ... */ }
  function handleContextMenu(e) { /* ... ללא שינוי ... */ }

  // ========================================================================
  // MouseDown - התחלת גרירה
  // (ללא שינוי מגרסאות קודמות v3.x)
  // ========================================================================
  function handleMouseDown(e) {
      // ... (אותו קוד כמו ב-v3.x) ...
      // ניתוקים, הגדרת currentDraggedBlock, dragOffset, position:absolute, z-index, classes
      // ...
      if (!b.id) generateUniqueId(b);
      e.preventDefault();
      b.draggable = false;
      if (CONFIG.DEBUG) console.log(`[MouseDown] Start drag: ${b.id}`);

      // Detach if connected
      const connectedToId = b.getAttribute('data-connected-to');
      if (connectedToId) {
          detachBlock(b, false); // Detach self silently
      }
      // Detach blocks connected TO this block
      const leftId = b.getAttribute('data-connected-from-left');
      if (leftId) {
          const leftBlock = document.getElementById(leftId);
          if (leftBlock) detachBlock(leftBlock, false);
      }
      const rightId = b.getAttribute('data-connected-from-right');
      if (rightId) {
          const rightBlock = document.getElementById(rightId);
          if (rightBlock) detachBlock(rightBlock, false);
      }

      currentDraggedBlock = b;
      isDraggingBlock = true;
      const r = b.getBoundingClientRect();
      dragOffset.x = e.clientX - r.left;
      dragOffset.y = e.clientY - r.top;
      const pE = document.getElementById('program-blocks');
      const pR = pE.getBoundingClientRect();

      // Ensure position is absolute
      if (window.getComputedStyle(b).position !== 'absolute') {
          b.style.position = 'absolute';
          b.style.left = (r.left - pR.left + pE.scrollLeft) + 'px';
          b.style.top = (r.top - pR.top + pE.scrollTop) + 'px';
      }
      b.style.margin = '0';
      b.style.zIndex = '1001';
      b.classList.add('snap-source');
      document.body.classList.add('user-select-none');
      potentialSnapTargetForVisuals = null; // Reset visual state
      snapDirectionForVisuals = null;
  }

  // ========================================================================
  // מאזינים גלובליים, MouseLeave
  // (ללא שינוי מגרסאות קודמות v3.x)
  // ========================================================================
   function initGlobalMouseListeners() { /* ... ללא שינוי ... */ }
   function handleMouseLeave(e) { /* ... ללא שינוי ... */ }

  // ========================================================================
  // MouseMove - הזזת הבלוק הנגרר ומתן חיווי ויזואלי
  // (כמעט ללא שינוי - רק שינוי שמות משתנים גלובליים לחיווי)
  // ========================================================================
  function handleMouseMove(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;
    e.preventDefault();

    const pE = document.getElementById('program-blocks');
    if (!pE) { handleMouseUp(e); return; } // Failsafe
    const pR = pE.getBoundingClientRect();

    // חישוב מיקום חדש (כמו קודם)
    let nL = e.clientX - pR.left - dragOffset.x + pE.scrollLeft;
    let nT = e.clientY - pR.top - dragOffset.y + pE.scrollTop;
    const bW = currentDraggedBlock.offsetWidth;
    const bH = currentDraggedBlock.offsetHeight;
    const sW = pE.scrollWidth;
    const sH = pE.scrollHeight;
    nL = Math.max(0, Math.min(nL, sW - bW));
    nT = Math.max(0, Math.min(nT, sH - bH));
    currentDraggedBlock.style.left = Math.round(nL) + 'px';
    currentDraggedBlock.style.top = Math.round(nT) + 'px';

    // בדיקת קרבה והפעלת חיווי ויזואלי (הילה ומחוון) - לוגיקה זהה ל-v3.6
    checkAndHighlightForVisuals();
  }

  // ========================================================================
  // פונקציה לבדיקת קרבה והפעלת חיווי ויזואלי (ב-MouseMove)
  // (זהה ל-checkAndHighlightSnapPossibility מ-v3.6, אבל מעדכנת משתנים אחרים)
  // ========================================================================
  function checkAndHighlightForVisuals() {
    if (!currentDraggedBlock) return;
    const programmingArea = document.getElementById('program-blocks'); if (!programmingArea) return;
    const sourceRect = currentDraggedBlock.getBoundingClientRect();
    const allVisibleBlocks = Array.from(programmingArea.querySelectorAll('.block-container:not(.snap-source)'))
                                  .filter(block => block.offsetParent !== null);

    let bestTarget = null;
    let bestDirection = null;
    let minDistance = CONFIG.CONNECT_THRESHOLD + 1;

    // Reset visual highlights and visual state
    document.querySelectorAll('.snap-target').forEach(el => { el.classList.remove('snap-target', 'snap-left', 'snap-right'); });
    potentialSnapTargetForVisuals = null; // אפס את המועמד לחיווי
    snapDirectionForVisuals = null;
    removeFuturePositionIndicator(); // הסתר מחוון כברירת מחדל

    for (const targetBlock of allVisibleBlocks) {
      if (!targetBlock.id) generateUniqueId(targetBlock);
      const targetRect = targetBlock.getBoundingClientRect();
      const targetConnectedLeft = targetBlock.hasAttribute('data-connected-from-left');
      const targetConnectedRight = targetBlock.hasAttribute('data-connected-from-right');

      const snapInfo = calculateSnapInfo(sourceRect, targetRect); // בודק קרבה לפי CONNECT_THRESHOLD

      if (snapInfo) {
         let connectionAllowed = true;
         if (snapInfo.direction === 'left' && targetConnectedLeft) connectionAllowed = false;
         else if (snapInfo.direction === 'right' && targetConnectedRight) connectionAllowed = false;

         if (connectionAllowed && snapInfo.distance < minDistance) {
             minDistance = snapInfo.distance;
             bestTarget = targetBlock;
             bestDirection = snapInfo.direction;
         }
      }
    }

    // If a suitable target is found for visual feedback
    if (bestTarget) {
      // עדכון המצב הגלובלי *לחיווי בלבד*
      potentialSnapTargetForVisuals = bestTarget;
      snapDirectionForVisuals = bestDirection;

      // הפעל הדגשה צהובה
      bestTarget.classList.add('snap-target', bestDirection === 'left' ? 'snap-left' : 'snap-right');

      // הצג מחוון כחול אם קרוב מספיק (לפי סף המחוון)
      if (minDistance <= CONFIG.INDICATOR_TOUCH_THRESHOLD) {
          updateFuturePositionIndicator(currentDraggedBlock, bestTarget, bestDirection, programmingArea.getBoundingClientRect());
      } else {
          removeFuturePositionIndicator();
      }
       if (CONFIG.DEBUG > 1) console.log(`[Visuals] Highlight ON for ${bestTarget.id}. Indicator ${minDistance <= CONFIG.INDICATOR_TOUCH_THRESHOLD ? 'ON' : 'OFF'}`);

    } else {
        removeFuturePositionIndicator(); // Ensure indicator is off if no target highlighted
        if (CONFIG.DEBUG > 1) console.log(`[Visuals] No target within ${CONFIG.CONNECT_THRESHOLD}px for highlight.`);
    }
  }

  // ========================================================================
  // *** MouseUp - שחרור מוגן (Protected Release) ***
  // מבצע בדיקת קרבה סופית ומחליט על הצמדה רק על פיה.
  // ========================================================================
  function handleMouseUp(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    const blockReleased = currentDraggedBlock;
    const releasedRect = blockReleased.getBoundingClientRect(); // מיקום סופי ברגע השחרור
    const programmingArea = document.getElementById('program-blocks');

    let finalTarget = null;
    let finalDirection = null;
    let finalMinDistance = CONFIG.CONNECT_THRESHOLD + 1; // התחל מעל הסף

    if (CONFIG.DEBUG) console.log(`[MouseUp - Protected] Releasing ${blockReleased.id}. Performing final check...`);

    // --- בדיקת קרבה סופית ברגע השחרור ---
    if (programmingArea) {
      const allVisibleBlocks = Array.from(programmingArea.querySelectorAll('.block-container:not(.snap-source)'))
                                    .filter(block => block.offsetParent !== null && block !== blockReleased); // לא נבדוק מול עצמו

      for (const targetBlock of allVisibleBlocks) {
           if (!targetBlock.id) generateUniqueId(targetBlock);
           const targetRect = targetBlock.getBoundingClientRect();
           const targetConnectedLeft = targetBlock.hasAttribute('data-connected-from-left');
           const targetConnectedRight = targetBlock.hasAttribute('data-connected-from-right');

           // השתמש בפונקציית החישוב עם המיקום *הסופי* של הבלוק ששוחרר
           const snapInfo = calculateSnapInfo(releasedRect, targetRect);

           if (snapInfo) { // אם נמצא בטווח CONNECT_THRESHOLD ויש חפיפה מספקת
               let connectionAllowed = true;
               if (snapInfo.direction === 'left' && targetConnectedLeft) connectionAllowed = false;
               else if (snapInfo.direction === 'right' && targetConnectedRight) connectionAllowed = false;

               // מצא את המטרה התקינה הקרובה ביותר *שנמצאת בטווח ברגע זה*
               if (connectionAllowed && snapInfo.distance < finalMinDistance) {
                   finalMinDistance = snapInfo.distance;
                   finalTarget = targetBlock;
                   finalDirection = snapInfo.direction;
               }
           }
      }
    }
    // --- סוף בדיקת הקרבה הסופית ---


    // --- ניקוי (תמיד מתבצע) ---
    isDraggingBlock = false;
    currentDraggedBlock = null;
    potentialSnapTargetForVisuals = null; // נקה מצב חיווי
    snapDirectionForVisuals = null;
    document.body.classList.remove('user-select-none');
    blockReleased.classList.remove('snap-source');
    blockReleased.style.zIndex = '';
    // הסר הדגשות מכל הבלוקים (שנותרו אולי מ-MouseMove)
    document.querySelectorAll('.snap-target').forEach(el => {
        el.classList.remove('snap-target', 'snap-left', 'snap-right');
    });
    removeFuturePositionIndicator(); // הסר מחוון כחול
    // --- סוף ניקוי ---


    // --- החלטה וביצוע הצמדה (רק אם נמצאה מטרה בבדיקה הסופית) ---
    if (finalTarget && finalDirection) {
        // נמצאה מטרה תקפה בטווח CONNECT_THRESHOLD ברגע השחרור
        if (CONFIG.DEBUG) console.log(`[MouseUp - Protected] Final check PASSED. Snapping ${blockReleased.id} to ${finalTarget.id} (${finalDirection}). Distance: ${finalMinDistance.toFixed(1)}px`);

        // בצע את ההצמדה (הפונקציה תזיז את הבלוק למיקום המדויק)
        const snapSuccess = performBlockSnap(blockReleased, finalTarget, finalDirection);

        if (!snapSuccess) {
            // אם ההצמדה נכשלה טכנית (נדיר), אפשר גרירה מחדש
            blockReleased.draggable = true;
            if (CONFIG.DEBUG) console.log(`[MouseUp - Protected] Snap attempt failed (performBlockSnap returned false). Block ${blockReleased.id} remains draggable.`);
        } else {
             // הצמדה הצליחה, הבלוק מחובר ו-draggable=false
             if (CONFIG.DEBUG) console.log(`[MouseUp - Protected] Snap successful. Block ${blockReleased.id} is connected.`);
             // performBlockSnap כבר אמור להגדיר draggable=false
        }
    } else {
        // לא נמצאה מטרה בטווח ברגע השחרור
        if (CONFIG.DEBUG) console.log(`[MouseUp - Protected] Final check FAILED (No target within ${CONFIG.CONNECT_THRESHOLD}px at release). No snap.`);
        // ודא שניתן לגרור שוב בלוק חופשי
        blockReleased.draggable = true;
    }

    if (CONFIG.DEBUG) console.log(`[MouseUp - Protected] ----- End MouseUp for ${blockReleased.id} -----`);
  }


  // ========================================================================
  // חישוב מידע הצמדה (מרחק וחפיפה)
  // (ללא שינוי מ-v3.x - עדיין מחזיר מידע רק אם בטווח CONNECT_THRESHOLD)
  // ========================================================================
  function calculateSnapInfo(sourceRect, targetRect) {
    const topOverlap = Math.max(sourceRect.top, targetRect.top);
    const bottomOverlap = Math.min(sourceRect.bottom, targetRect.bottom);
    const verticalOverlap = Math.max(0, bottomOverlap - topOverlap);
    const minHeightReq = Math.min(sourceRect.height, targetRect.height) * CONFIG.VERTICAL_OVERLAP_REQ;

    if (verticalOverlap < minHeightReq || verticalOverlap <= 0) {
      //if (CONFIG.DEBUG > 2) console.log(`[calculateSnapInfo] Failed Vertical Overlap: ${verticalOverlap.toFixed(1)} < ${minHeightReq.toFixed(1)}`);
      return null;
    }

    let distance, direction;
    const distRightToLeft = Math.abs(sourceRect.right - targetRect.left); // My right edge to target's left edge
    const distLeftToRight = Math.abs(sourceRect.left - targetRect.right); // My left edge to target's right edge

    // Determine potential snap direction based on smaller horizontal distance
    if (distRightToLeft < distLeftToRight) {
      distance = distRightToLeft;
      direction = 'left'; // I would snap TO THE LEFT of the target
    } else {
      distance = distLeftToRight;
      direction = 'right'; // I would snap TO THE RIGHT of the target
    }

    // Return snap info ONLY if the distance is within the threshold
    if (distance <= CONFIG.CONNECT_THRESHOLD) {
       if (CONFIG.DEBUG > 1) console.log(`[calculateSnapInfo] Within threshold (${CONFIG.CONNECT_THRESHOLD}px): dir=${direction}, dist=${distance.toFixed(1)}, overlap=${verticalOverlap.toFixed(1)}`);
       return { direction, distance };
    } else {
       //if (CONFIG.DEBUG > 2) console.log(`[calculateSnapInfo] Outside threshold: ${distance.toFixed(1)} > ${CONFIG.CONNECT_THRESHOLD}`);
       return null;
    }
  }

  // ========================================================================
  // ביצוע ההצמדה הפיזית
  // (ללא שינוי מ-v3.x)
  // ========================================================================
  function performBlockSnap(sourceBlock, targetBlock, direction) { /* ... ללא שינוי ... */ }

  // ========================================================================
  // עדכון/הסרה מחוון, פונקציות ניתוק, אנימציה, ID
  // (ללא שינוי מ-v3.x)
  // ========================================================================
  function updateFuturePositionIndicator(sB,tB,dir,pR) { /* ... ללא שינוי ... */ }
  function removeFuturePositionIndicator() { /* ... ללא שינוי ... */ }
  function showDetachMenu(x,y,b){ /* ... ללא שינוי ... */ }
  function closeMenuOutside(e){ /* ... ללא שינוי ... */ }
  function removeDetachMenu(){ /* ... ללא שינוי ... */ }
  function detachBlock(btd,animate=true){ /* ... ללא שינוי ... */ }
  function addSnapEffectAnimation(b){ /* ... ללא שינוי ... */ }
  function addDetachEffectAnimation(b){ /* ... ללא שינוי ... */ }
  function generateUniqueId(b){ /* ... ללא שינוי ... */ }


  // ========================================================================
  // אתחול המערכת כולה
  // ========================================================================
  function initializeSystem() {
    const initFlag = 'blockLinkageInitialized_v4_0_Protected'; // Update version flag
    if (window[initFlag]) {
        if (CONFIG.DEBUG) console.log("Block linkage system v4.0 (Protected Release) already initialized. Skipping.");
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
    console.log(`Block linkage system initialized (Version 4.0 - Protected Release)`);
    console.log(`Configuration: Snap Threshold=${CONFIG.CONNECT_THRESHOLD}px, Indicator Threshold=${CONFIG.INDICATOR_TOUCH_THRESHOLD}px, Overlap=${CONFIG.VERTICAL_OVERLAP_REQ*100}%, Gap=${CONFIG.BLOCK_GAP}px, Sound=${CONFIG.PLAY_SOUND ? CONFIG.SOUND_PATH : 'Disabled'}`);
  }

  // הפעל את האתחול
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
      initializeSystem(); // DOM already loaded
  }

})(); // סוף IIFE

// --- END OF FILE linkageimproved_protected_release.js ---
