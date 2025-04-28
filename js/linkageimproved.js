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
  HORIZONTAL_FINE_TUNING_RIGHT: 0   // כוונון עדין כשמחברים בלוק לצד ימין של בלוק אחר (ערך לדוגמה, יש להתאים)
};

// עדכון פונקציית ההצמדה כדי להשתמש בערכי הכוונון העדין הנפרדים
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
