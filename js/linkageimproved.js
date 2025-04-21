// --- START OF FILE linkageimproved.js ---
// --- Version 3.6: Indicator on Touch Only ---
// Changes from v3.5:
// 1. Added CONFIG.INDICATOR_TOUCH_THRESHOLD (e.g., 1px).
// 2. Modified checkAndHighlightSnapPossibility:
//    - Yellow highlight (.snap-target) still appears when distance <= CONNECT_THRESHOLD (8px).
//    - Blue dashed indicator (.future-position-indicator) ONLY appears when distance <= INDICATOR_TOUCH_THRESHOLD (1px).

(function() {
  // ... (שאר המשתנים הגלובליים ללא שינוי) ...
  let currentDraggedBlock = null;
  let potentialSnapTarget = null;
  let snapDirection = null;
  let isDraggingBlock = false;
  let dragOffset = { x: 0, y: 0 };
  let futureIndicator = null;
  let snapSound = null;
  let audioContextAllowed = false;
  let soundInitialized = false;

  // קונפיגורציה - פרמטרים שניתן להתאים
  const CONFIG = {
    PIN_WIDTH: 5,
    CONNECT_THRESHOLD: 8, // סף להפעלת הדגשה צהובה וזיהוי יעד פוטנציאלי
    // *** הוספת סף חדש למחוון הכחול ***
    INDICATOR_TOUCH_THRESHOLD: 1, // סף להצגת המחוון הכחול המקווקו (כמעט נגיעה)
    VERTICAL_ALIGN_THRESHOLD: 20,
    VERTICAL_OVERLAP_REQ: 0.4,
    BLOCK_GAP: 0,
    PLAY_SOUND: true,
    SOUND_VOLUME: 0.8,
    SOUND_PATH: 'assets/sound/link.mp3',
    DEBUG: true
  };

  // ... (פונקציות CSS, אודיו, מאזינים ראשוניים - ללא שינוי) ...
  function addHighlightStyles() { /* ... ללא שינוי ... */ }
  function initAudio() { /* ... ללא שינוי ... */ }
  function addSoundTestButton() { /* ... ללא שינוי ... */ }
  function playSnapSound() { /* ... ללא שינוי ... */ }
  function initProgrammingAreaListeners() { /* ... ללא שינוי ... */ }
  function observeNewBlocks() { /* ... ללא שינוי ... */ }
  function initExistingBlocks() { /* ... ללא שינוי ... */ }
  function addBlockDragListeners(b) { /* ... ללא שינוי ... */ }
  function handleContextMenu(e) { /* ... ללא שינוי ... */ }
  function handleMouseDown(e) { /* ... ללא שינוי ... */ }
  function initGlobalMouseListeners() { /* ... ללא שינוי ... */ }
  function handleMouseLeave(e) { /* ... ללא שינוי ... */ }
  function handleMouseMove(e) { /* ... ללא שינוי ... */ }
  function handleMouseUp(e) { /* ... ללא שינוי (מסתמך על potentialSnapTarget שנקבע ב-MouseMove) ... */ }


  // ========================================================================
  // *** שינוי כאן - בדיקת הצמדה והדגשה (MouseMove) ***
  // מפריד בין הדגשה צהובה (סף 8 פיקסל) למחוון כחול (סף 1 פיקסל)
  // ========================================================================
  function checkAndHighlightSnapPossibility() {
    if (!currentDraggedBlock) return;
    const programmingArea = document.getElementById('program-blocks'); if (!programmingArea) return;
    const sourceRect = currentDraggedBlock.getBoundingClientRect();
    const allVisibleBlocks = Array.from(programmingArea.querySelectorAll('.block-container:not(.snap-source)'))
                                  .filter(block => block.offsetParent !== null);

    let bestTarget = null;
    let bestDirection = null;
    let minDistance = CONFIG.CONNECT_THRESHOLD + 1; // התחל עם מרחק גדול מהסף

    // Reset highlights and global state before checking
    document.querySelectorAll('.snap-target').forEach(el => { el.classList.remove('snap-target', 'snap-left', 'snap-right'); });
    potentialSnapTarget = null; // אפס את המועמד הגלובלי שישמש ב-MouseUp
    snapDirection = null;
    removeFuturePositionIndicator(); // הסתר את המחוון הכחול כברירת מחדל

    for (const targetBlock of allVisibleBlocks) {
      if (!targetBlock.id) generateUniqueId(targetBlock);
      const targetRect = targetBlock.getBoundingClientRect();
      const targetConnectedLeft = targetBlock.hasAttribute('data-connected-from-left');
      const targetConnectedRight = targetBlock.hasAttribute('data-connected-from-right');

      // Calculate returns info only if distance <= CONNECT_THRESHOLD (8px) and overlap is sufficient
      const snapInfo = calculateSnapInfo(sourceRect, targetRect); // עדיין בודק לפי סף 8 פיקסל

      if (snapInfo) {
         let connectionAllowed = true;
         if (snapInfo.direction === 'left' && targetConnectedLeft) connectionAllowed = false;
         else if (snapInfo.direction === 'right' && targetConnectedRight) connectionAllowed = false;

         // מצא את המטרה הקרובה ביותר *שעדיין בטווח 8 הפיקסלים*
         if (connectionAllowed && snapInfo.distance < minDistance) {
             minDistance = snapInfo.distance; // שמור את המרחק המינימלי שנמצא (יהיה <= 8)
             bestTarget = targetBlock;
             bestDirection = snapInfo.direction;
         }
      }
    }

    // If a suitable target is found within the main threshold (8px)
    if (bestTarget) {
      if (CONFIG.DEBUG > 1) console.log(`[Highlight] Potential Target Found (<= ${CONFIG.CONNECT_THRESHOLD}px): ${currentDraggedBlock.id} -> ${bestTarget.id} (${bestDirection}). Dist: ${minDistance.toFixed(1)}px.`);

      // *** עדכון המצב הגלובלי שישמש ב-MouseUp (תמיד אם נמצא bestTarget) ***
      potentialSnapTarget = bestTarget;
      snapDirection = bestDirection;

      // *** הפעל הדגשה צהובה (תמיד אם נמצא bestTarget) ***
      bestTarget.classList.add('snap-target', bestDirection === 'left' ? 'snap-left' : 'snap-right');
      if (CONFIG.DEBUG) console.log(`[Highlight] Yellow Halo ON for ${bestTarget.id}`);

      // *** הצג את המחוון הכחול המקווקו רק אם המרחק קטן או שווה לסף ה"נגיעה" ***
      if (minDistance <= CONFIG.INDICATOR_TOUCH_THRESHOLD) {
          if (CONFIG.DEBUG) console.log(`[Highlight] Indicator Threshold Met (<= ${CONFIG.INDICATOR_TOUCH_THRESHOLD}px). Showing Blue Indicator.`);
          updateFuturePositionIndicator(currentDraggedBlock, bestTarget, bestDirection, programmingArea.getBoundingClientRect());
      } else {
          // אם המרחק גדול מסף הנגיעה (אך עדיין בטווח 8 פיקסל), ודא שהמחוון כבוי
          // (הוא כבר כבוי מהאיפוס בתחילת הפונקציה, אבל נהיה בטוחים)
          removeFuturePositionIndicator();
          if (CONFIG.DEBUG > 1) console.log(`[Highlight] Indicator Threshold NOT Met (> ${CONFIG.INDICATOR_TOUCH_THRESHOLD}px). Blue Indicator OFF.`);
      }

    } else {
        // No target found within 8px - ensure everything is off
        removeFuturePositionIndicator(); // Already called at the start, but safe to call again
        if (CONFIG.DEBUG > 1) console.log(`[Highlight] No potential target within ${CONFIG.CONNECT_THRESHOLD}px.`);
    }
  }

  // ========================================================================
  // חישוב מידע הצמדה (מרחק וחפיפה) - ללא שינוי מ-v3.5
  // עדיין מחזיר מידע אם המרחק הוא בטווח CONNECT_THRESHOLD (8px)
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
    // החזר מידע רק אם המרחק בטווח הראשי (8px)
    if (distance <= CONFIG.CONNECT_THRESHOLD) {
       if (CONFIG.DEBUG > 1) console.log(`[calculateSnapInfo] Within main threshold (${CONFIG.CONNECT_THRESHOLD}px): dir=${direction}, dist=${distance.toFixed(1)}`);
       return { direction, distance };
    }
    return null;
  }


  // ... (שאר הפונקציות: performBlockSnap, update/remove Indicator, detach, animations, ID gen, init - ללא שינוי) ...
  function performBlockSnap(sourceBlock, targetBlock, direction) { /* ... ללא שינוי ... */ }
  function updateFuturePositionIndicator(sB,tB,dir,pR) { /* ... ללא שינוי ... */ }
  function removeFuturePositionIndicator() { if(futureIndicator)futureIndicator.classList.remove('visible'); }
  function showDetachMenu(x,y,b){ /* ... ללא שינוי ... */ }
  function closeMenuOutside(e){ /* ... ללא שינוי ... */ }
  function removeDetachMenu(){ /* ... ללא שינוי ... */ }
  function detachBlock(btd,animate=true){ /* ... ללא שינוי ... */ }
  function addSnapEffectAnimation(b){ /* ... ללא שינוי ... */ }
  function addDetachEffectAnimation(b){ /* ... ללא שינוי ... */ }
  function generateUniqueId(b){ /* ... ללא שינוי ... */ }
  function initializeSystem() {
    const initFlag = 'blockLinkageInitialized_v3_6'; // Update version flag
    if (window[initFlag]) {
        if (CONFIG.DEBUG) console.log("Block linkage system v3.6 already initialized. Skipping.");
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
    console.log(`Block linkage system initialized (Version 3.6 - Indicator on Touch Only)`);
    console.log(`Configuration: Snap Threshold=${CONFIG.CONNECT_THRESHOLD}px, Indicator Threshold=${CONFIG.INDICATOR_TOUCH_THRESHOLD}px, Overlap=${CONFIG.VERTICAL_OVERLAP_REQ*100}%, Gap=${CONFIG.BLOCK_GAP}px, Sound=${CONFIG.PLAY_SOUND ? CONFIG.SOUND_PATH : 'Disabled'}`);
  }

  // הפעל את האתחול
  if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeSystem);
  } else {
      initializeSystem(); // DOM already loaded
  }

})(); // סוף IIFE

// --- END OF FILE linkageimproved.js ---
