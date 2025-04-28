// שינוי בהגדרת קונפיגורציה - יש להוסיף שני פרמטרים נפרדים
const CONFIG = {
  CONNECT_THRESHOLD: 25, // סף רחב יותר להפעלת זיהוי חיבור
  VERTICAL_ALIGN_THRESHOLD: 20, // Note: Declared but not used
  VERTICAL_OVERLAP_REQ: 0.4, // דרישה ל-40% חפיפה אנכית לפחות
  BLOCK_GAP: 0, // Note: Declared but not used
  PLAY_SOUND: true,
  SOUND_VOLUME: 0.8,
  SOUND_PATH: 'assets/sound/link.mp3',
  DEBUG: true, // Set to false for production
  HIGHLIGHT_COLOR_RIGHT: '#FFC107', // צהוב לצד ימין (בליטה)
  HIGHLIGHT_COLOR_LEFT: '#2196F3', // כחול לצד שמאל (שקע)
  HIGHLIGHT_OPACITY: 0.8, // Note: Declared but not used directly for points

  // ערכי היסט קבועים לחיבור פאזל מדויק
  PUZZLE_RIGHT_BULGE_WIDTH: 10,
  PUZZLE_LEFT_SOCKET_WIDTH: 10,
  VERTICAL_CENTER_OFFSET: 0,
  
  // כוונון עדין לפי כיוון החיבור
  HORIZONTAL_FINE_TUNING_LEFT: -9,  // כוונון עדין כשמחברים בלוק לצד שמאל של בלוק אחר
  HORIZONTAL_FINE_TUNING_RIGHT: 5   // כוונון עדין כשמחברים בלוק לצד ימין של בלוק אחר (הערך 5 מתאים לסגירת רווח)
};

// ========================================================================
// בדיקת הצמדה והדגשה - פונקציה עם תמיכה בחיווי
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

  // ניקוי כל ההדגשות הקודמות (מסיר קלאס .connection-point-visible)
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

  // אם נמצא יעד מתאים, הדגש (הפוך לנראה)
  if (bestTarget && minDistance <= CONFIG.CONNECT_THRESHOLD) {
    if (CONFIG.DEBUG > 1) console.log(`[Highlight] Threshold met: ${currentDraggedBlock.id} -> ${bestTarget.id} (${bestDirection}). Dist=${minDistance.toFixed(1)}px. Highlighting points.`);
    potentialSnapTarget = bestTarget;
    snapDirection = bestDirection;

    try {
      if (bestDirection === 'left') {
        highlightConnectionPoint(bestTarget, true); // Highlight (visible) left point on target
        highlightConnectionPoint(currentDraggedBlock, false); // Highlight (visible) right point on source
      } else if (bestDirection === 'right') {
        highlightConnectionPoint(bestTarget, false); // Highlight (visible) right point on target
        highlightConnectionPoint(currentDraggedBlock, true); // Highlight (visible) left point on source
      }
    } catch (err) {
      console.error("Error calling highlightConnectionPoint:", err);
    }
  }
  // No else needed, clearAllHighlights at the start handles removal
}

// ========================================================================
// עדכון פונקציית ההצמדה כדי להשתמש בערכי הכוונון העדין הנפרדים
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

    playSnapSound(); // Play sound on successful snap logic start
    addSnapEffectAnimation(sourceBlock);
    sourceBlock.draggable = false;

    if (CONFIG.DEBUG) console.log(`[PerformSnap] Success. ${sourceBlock.id} pos: L=${styleLeft.toFixed(0)}, T=${styleTop.toFixed(0)}.`);
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
// טיפול בשחרור העכבר (MouseUp) - עם קריאה ל-clearAllHighlights
// ========================================================================
function handleMouseUp(e) {
  if (!isDraggingBlock || !currentDraggedBlock) return;

  const blockReleased = currentDraggedBlock;
  const candidateTarget = potentialSnapTarget;
  const candidateDirection = snapDirection;

  if (CONFIG.DEBUG) console.log(`[MouseUp] Releasing block ${blockReleased.id}. Candidate: ${candidateTarget?.id || 'none'}, direction: ${candidateDirection || 'none'}`);

  // ניקוי מצב הגרירה וההדגשות הראשוניות (מהמיקום האחרון של הגרירה)
  isDraggingBlock = false;
  currentDraggedBlock = null;
  potentialSnapTarget = null;
  snapDirection = null;
  document.body.classList.remove('user-select-none');
  blockReleased.classList.remove('snap-source');
  blockReleased.style.zIndex = '';

  // ניקוי ראשוני של נקודות החיבור שהודגשו ב-MouseMove האחרון
  clearAllHighlights();

  // החלטה על הצמדה
  let performSnap = false;
  if (candidateTarget && candidateDirection && document.body.contains(candidateTarget)) {
      if (CONFIG.DEBUG) console.log(`[MouseUp] Candidate target ${candidateTarget.id} identified during drag. Attempting snap.`);
      performSnap = true;
  } else {
      if (CONFIG.DEBUG) console.log(`[MouseUp] No valid candidate target identified during drag. No snap attempt.`);
  }

  // בצע את ההצמדה אם הוחלט כך
  if (performSnap) {
    const snapSuccess = performBlockSnap(blockReleased, candidateTarget, candidateDirection);

    // *** התיקון כאן: ודא שההדגשות מנוקות *לאחר* ניסיון ההצמדה ***
    // זה קורה אחרי שהצליל מתנגן בתוך performBlockSnap (אם הצליח)
    clearAllHighlights(); // Ensure points are hidden immediately after snap attempt/success

    if (!snapSuccess) {
        blockReleased.draggable = true;
        if (CONFIG.DEBUG) console.log(`[MouseUp] Snap attempt failed. Block ${blockReleased.id} remains draggable.`);
    } else {
         if (CONFIG.DEBUG) console.log(`[MouseUp] Snap successful. Block ${blockReleased.id} is connected.`);
    }
  } else {
    // אם לא בוצעה הצמדה, הבלוק נשאר חופשי וההדגשות כבר נוקו למעלה
    if (CONFIG.DEBUG) console.log(`[MouseUp] No snap performed. Block ${blockReleased.id} remains free.`);
    blockReleased.draggable = true;
  }
}
