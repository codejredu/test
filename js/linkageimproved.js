// התיקון המוצע - הוספת קריאה נוספת ל-clearAllHighlights בתוך performBlockSnap
// לפני חזרה ב-return true

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
    } else { // direction === 'right'
      finalLeft = targetRect.right - CONFIG.PUZZLE_RIGHT_BULGE_WIDTH;
      finalTop = targetRect.top + CONFIG.VERTICAL_CENTER_OFFSET;
    }

    finalLeft += CONFIG.HORIZONTAL_FINE_TUNING;

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
    
    // הוספת השורה הבאה לוודא שנקודות החיבור נעלמות מיד לאחר הצמדה מוצלחת
    clearAllHighlights(); 

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
