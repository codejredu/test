// --- GROUP-CONNECT.JS (מתוקן) ---
// מודול לחיבור קבוצות בלוקים או קבוצה לבלוק בודד

(function() {
  'use strict';

  // === הגדרות ===
  const CONFIG = {
    // CONNECT_THRESHOLD יש להשתמש בזה מ-LinkageImprovedAPI.CONFIG.CONNECT_THRESHOLD
    GROUP_CONNECT_HIGHLIGHT_COLOR: '#4CAF50',
    DEBUG: true,
  };

  let LI_API; // יאותחל ב-init
  let GD_API; // יאותחל ב-init

  // === פונקציות עזר ===
  function log(message, data) {
    if (CONFIG.DEBUG) {
      if (data !== undefined) { // בדיקה מפורשת כדי לאפשר הדפסת null/false
        console.log(`[GroupConnect] ${message}`, data);
      } else {
        console.log(`[GroupConnect] ${message}`);
      }
    }
  }

  // הפונקציה הזו תשתמש ב-API של linkage-group-drag-simplified.js
  function findEntireGroup(startBlock) {
    if (!GD_API || !GD_API.findConnectedBlocks) {
      log('שגיאה: GD_API.findConnectedBlocks אינו זמין.');
      return startBlock ? [startBlock] : []; // החזרת מערך עם הבלוק עצמו או ריק
    }
    return GD_API.findConnectedBlocks(startBlock);
  }

  function findLeftmostBlockInGroup(blocks) {
    if (!blocks || blocks.length === 0) return null;
    return blocks.reduce((leftmost, current) =>
      current.getBoundingClientRect().left < leftmost.getBoundingClientRect().left ? current : leftmost
    );
  }

  function findRightmostBlockInGroup(blocks) {
    if (!blocks || blocks.length === 0) return null;
    return blocks.reduce((rightmost, current) =>
      current.getBoundingClientRect().right > rightmost.getBoundingClientRect().right ? current : rightmost
    );
  }

  // === לוגיקת חיבור קבוצות ===

  function checkAndHighlightGroupSnapPossibility(draggedLeaderBlock) {
    if (!draggedLeaderBlock || !LI_API || !GD_API) return;

    const draggedGroup = findEntireGroup(draggedLeaderBlock);
    if (draggedGroup.length === 0) return; // לא אמור לקרות אם זה מנהיג

    const draggedGroupLeftmost = findLeftmostBlockInGroup(draggedGroup);
    const draggedGroupRightmost = findRightmostBlockInGroup(draggedGroup);

    if (!draggedGroupLeftmost || !draggedGroupRightmost) return;

    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;

    clearPotentialGroupSnapVisuals(); // ניקוי הדגשות קודמות של הקבוצה
    LI_API.clearAllHighlights();      // ניקוי הדגשות של בלוקים בודדים מ-linkageimproved

    let potentialSnapTargetInfo = null;
    const connectThreshold = LI_API.CONFIG.CONNECT_THRESHOLD || 40;

    const allOtherBlocks = Array.from(programmingArea.querySelectorAll('.block-container'))
      .filter(block => !draggedGroup.find(b => b.id === block.id) && block.offsetParent !== null);

    for (const targetBlock of allOtherBlocks) {
      const targetGroup = findEntireGroup(targetBlock);
      const isTargetBlockAlone = targetGroup.length <= 1 || targetGroup.every(b => b.id === targetBlock.id);

      let sourceRect, targetRectToUse;

      // בדוק חיבור: צד ימין של הקבוצה הנגררת לצד שמאל של יעד
      if (!draggedGroupRightmost.hasAttribute('data-connected-to')) { // אם הקצה הימני של הקבוצה הנגררת פנוי
        const potentialTargetForRightSide = isTargetBlockAlone ? targetBlock : findLeftmostBlockInGroup(targetGroup);
        if (potentialTargetForRightSide && !potentialTargetForRightSide.hasAttribute('data-connected-from-left')) { // אם הצד השמאלי של היעד פנוי
          sourceRect = draggedGroupRightmost.getBoundingClientRect();
          targetRectToUse = potentialTargetForRightSide.getBoundingClientRect();

          if (checkProximity(sourceRect, targetRectToUse, 'right', 'left', connectThreshold)) {
            potentialSnapTargetInfo = {
              targetElement: potentialTargetForRightSide,
              targetSide: 'left',
              sourceBlock: draggedGroupRightmost,
              sourceSide: 'right',
              type: isTargetBlockAlone ? 'group-to-single' : 'group-to-group'
            };
            break;
          }
        }
      }

      // בדוק חיבור: צד שמאל של הקבוצה הנגררת לצד ימין של יעד
      if (!draggedGroupLeftmost.hasAttribute('data-connected-from-right')) { // אם הקצה השמאלי של הקבוצה הנגררת פנוי
        const potentialTargetForLeftSide = isTargetBlockAlone ? targetBlock : findRightmostBlockInGroup(targetGroup);
        if (potentialTargetForLeftSide && !potentialTargetForLeftSide.hasAttribute('data-connected-from-right')) { // אם הצד הימני של היעד פנוי
           sourceRect = draggedGroupLeftmost.getBoundingClientRect();
           targetRectToUse = potentialTargetForLeftSide.getBoundingClientRect();

          if (checkProximity(sourceRect, targetRectToUse, 'left', 'right', connectThreshold)) {
            potentialSnapTargetInfo = {
              targetElement: potentialTargetForLeftSide,
              targetSide: 'right',
              sourceBlock: draggedGroupLeftmost,
              sourceSide: 'left',
              type: isTargetBlockAlone ? 'group-to-single' : 'group-to-group'
            };
            break;
          }
        }
      }
      if (potentialSnapTargetInfo) break;
    }

    if (potentialSnapTargetInfo) {
      log('זוהתה אפשרות חיבור קבוצתי:', potentialSnapTargetInfo);
      highlightPotentialGroupSnap(potentialSnapTargetInfo.sourceBlock, potentialSnapTargetInfo.targetElement, potentialSnapTargetInfo.sourceSide);
      draggedLeaderBlock.dataset.potentialGroupSnapTarget = potentialSnapTargetInfo.targetElement.id;
      draggedLeaderBlock.dataset.potentialGroupSnapTargetSide = potentialSnapTargetInfo.targetSide;
      draggedLeaderBlock.dataset.potentialGroupSnapSourceSide = potentialSnapTargetInfo.sourceSide;
      draggedLeaderBlock.dataset.potentialGroupSnapSourceBlock = potentialSnapTargetInfo.sourceBlock.id;
    } else {
      // אין הצמדה קבוצתית, נקה מידע ישן אם קיים
      delete draggedLeaderBlock.dataset.potentialGroupSnapTarget;
      // ... (וכו' לשאר מאפייני ה-dataset)
    }
  }

  function checkProximity(sourceRect, targetRect, sourceSide, targetSide, threshold) {
    const verticalOverlap = Math.max(0, Math.min(sourceRect.bottom, targetRect.bottom) - Math.max(sourceRect.top, targetRect.top));
    // דורש חפיפה אנכית של לפחות אחוז מסוים מגובה הבלוק הנמוך יותר
    const minHeight = Math.min(sourceRect.height, targetRect.height);
    if (verticalOverlap < minHeight * (LI_API.CONFIG.VERTICAL_OVERLAP_REQ || 0.4)) {
      return false;
    }

    let distance;
    if (sourceSide === 'right' && targetSide === 'left') {
      distance = Math.abs(targetRect.left - sourceRect.right);
    } else if (sourceSide === 'left' && targetSide === 'right') {
      distance = Math.abs(sourceRect.left - targetRect.right);
    } else {
      return false;
    }
    return distance < threshold;
  }

  function highlightPotentialGroupSnap(sourceConnectingBlock, targetConnectingBlock, sourceSideOfDraggedGroup) {
    sourceConnectingBlock.classList.add('potential-group-snap-source');
    targetConnectingBlock.classList.add('potential-group-snap-target');

    if (LI_API && LI_API.highlightConnectionPoint) {
        // הדגש את נקודת המקור (בקבוצה הנגררת)
        LI_API.highlightConnectionPoint(sourceConnectingBlock, sourceSideOfDraggedGroup === 'left');
        // הדגש את נקודת היעד (הצד הנגדי)
        LI_API.highlightConnectionPoint(targetConnectingBlock, sourceSideOfDraggedGroup !== 'left');
    }
    log(`הדגשת חיבור קבוצתי פוטנציאלי: ${sourceConnectingBlock.id} (${sourceSideOfDraggedGroup}) -> ${targetConnectingBlock.id}`);
  }

  function clearPotentialGroupSnapVisuals() {
    document.querySelectorAll('.potential-group-snap-source').forEach(el => el.classList.remove('potential-group-snap-source'));
    document.querySelectorAll('.potential-group-snap-target').forEach(el => el.classList.remove('potential-group-snap-target'));
    if (LI_API && LI_API.clearAllHighlights) {
      LI_API.clearAllHighlights(); // מנקה גם את עיגולי החיבור של linkageimproved
    }
    log('ניקוי הדגשות חיבור קבוצתי פוטנציאלי');
  }

  function performGroupSnap(draggedLeaderBlock) {
    if (!LI_API || !GD_API) return false;

    const targetId = draggedLeaderBlock.dataset.potentialGroupSnapTarget;
    const targetSideToConnectOnTarget = draggedLeaderBlock.dataset.potentialGroupSnapTargetSide; // 'left' or 'right' side of the target block
    const sourceSideOnDragged = draggedLeaderBlock.dataset.potentialGroupSnapSourceSide; // 'left' or 'right' side of the source block
    const sourceBlockId = draggedLeaderBlock.dataset.potentialGroupSnapSourceBlock;

    // ניקוי מאפייני ה-dataset מיד כדי למנוע ניסיונות חיבור כפולים או שגויים
    delete draggedLeaderBlock.dataset.potentialGroupSnapTarget;
    delete draggedLeaderBlock.dataset.potentialGroupSnapTargetSide;
    delete draggedLeaderBlock.dataset.potentialGroupSnapSourceSide;
    delete draggedLeaderBlock.dataset.potentialGroupSnapSourceBlock;

    if (!targetId || !targetSideToConnectOnTarget || !sourceSideOnDragged || !sourceBlockId) {
      return false;
    }

    const targetConnectingBlock = document.getElementById(targetId);
    const sourceConnectingBlock = document.getElementById(sourceBlockId);

    if (!targetConnectingBlock || !sourceConnectingBlock) {
      log('שגיאה ב-performGroupSnap: אחד מבלוקי החיבור לא נמצא.', {targetId, sourceBlockId});
      return false;
    }

    log(`ניסיון לבצע חיבור קבוצתי: ${sourceConnectingBlock.id} (${sourceSideOnDragged}) אל ${targetConnectingBlock.id} (${targetSideToConnectOnTarget})`);

    let snapSuccess = false;
    const draggedGroup = findEntireGroup(sourceConnectingBlock); // הקבוצה שאליה הבלוק המחבר שייך
    const sourceBlockOriginalRect = sourceConnectingBlock.getBoundingClientRect(); // מיקום *לפני* ש-performBlockSnap יזיז אותו

    // קריאה ל-performBlockSnap מ-linkageimproved.js
    // performBlockSnap(blockToMove, targetBlock, sideOfTargetToConnectTo)
    if (sourceSideOnDragged === 'right' && targetSideToConnectOnTarget === 'left') {
      snapSuccess = LI_API.performBlockSnap(sourceConnectingBlock, targetConnectingBlock, 'left');
    } else if (sourceSideOnDragged === 'left' && targetSideToConnectOnTarget === 'right') {
      snapSuccess = LI_API.performBlockSnap(sourceConnectingBlock, targetConnectingBlock, 'right');
    }

    if (snapSuccess) {
      log('חיבור בלוקים בודד הצליח (דרך LI_API.performBlockSnap). מתאים מיקום קבוצה.');
      if (LI_API.playSnapSound) LI_API.playSnapSound();

      // התאמת מיקום שאר חברי הקבוצה הנגררת
      // performBlockSnap כבר הזיז את sourceConnectingBlock.
      // נחשב את הדלתא ונזיז את שאר חברי הקבוצה.
      const sourceBlockFinalRect = sourceConnectingBlock.getBoundingClientRect();
      const deltaX = sourceBlockFinalRect.left - sourceBlockOriginalRect.left;
      const deltaY = sourceBlockFinalRect.top - sourceBlockOriginalRect.top;

      if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1) { // רק אם הייתה תזוזה משמעותית
        draggedGroup.forEach(memberBlock => {
          if (memberBlock.id !== sourceConnectingBlock.id) {
            const currentLeft = parseFloat(memberBlock.style.left || 0);
            const currentTop = parseFloat(memberBlock.style.top || 0);
            memberBlock.style.left = `${currentLeft + deltaX}px`;
            memberBlock.style.top = `${currentTop + deltaY}px`;
          }
        });
        log(`הקבוצה הנגררת הוזזה ${deltaX.toFixed(2)}px, ${deltaY.toFixed(2)}px`);
      } else {
        log('לא זוהתה תזוזה משמעותית של בלוק המקור לאחר החיבור, אין צורך להזיז את שאר הקבוצה.');
      }
      
      // עדכון מנהיגי הקבוצות לאחר שינוי מבני
      if (GD_API.scanAndMarkLeaders) {
        setTimeout(GD_API.scanAndMarkLeaders, 100); // השהייה קלה לאפשר ל-DOM להתעדכן
      }
    } else {
      log('LI_API.performBlockSnap החזיר false. החיבור נכשל.');
    }

    clearPotentialGroupSnapVisuals(); // נקה הדגשות בכל מקרה
    return snapSuccess;
  }


  // === אינטגרציה עם מערכת הגרירה הקיימת ===
  // נניח ש-linkageimproved.js או linkage-group-drag-simplified.js
  // קוראים לפונקציות הגלובליות הללו בזמן גרירה.

  window.GroupConnectGlobalHandlers = {
    handleDragMove: function(draggedElement) { // draggedElement הוא ה-leader של הקבוצה הנגררת, או בלוק בודד
      if (!LI_API || !GD_API) return;

      const group = findEntireGroup(draggedElement);
      // בדוק חיבור קבוצתי רק אם גוררים קבוצה (או בלוק שיהפוך לראש קבוצה)
      // או אם רוצים לאפשר לבלוק בודד להתחבר לקבוצה קיימת באותו האופן.
      // כרגע, נתמקד בחיבור קבוצה לקבוצה/בודד.
      if (group && group.length >= 1) { // אפילו בלוק בודד יכול לנסות להתחבר כ"קבוצה" של 1
        checkAndHighlightGroupSnapPossibility(draggedElement); // כאן draggedElement הוא הבלוק המוביל
      }
    },

    handleDragEnd: function(draggedElement) { // draggedElement הוא ה-leader
      if (!LI_API || !GD_API) return false;
      let snapped = false;
      if (draggedElement.dataset.potentialGroupSnapTarget) {
        snapped = performGroupSnap(draggedElement);
      }
      // אם לא בוצע חיבור קבוצתי, ייתכן ש-linkageimproved יטפל בחיבור בודד אם רלוונטי.
      // חשוב לוודא שלא יהיו התנגשויות.
      // כאן, אם snapped=true, החיבור הקבוצתי הצליח.
      // אם snapped=false, ומאפייני ה-dataset נוקו, linkageimproved לא ינסה לבצע הצמדה קבוצתית.
      // הוא עשוי לנסות הצמדה של בלוק בודד אם הלוגיקה שלו מאפשרת זאת בנפרד.
      
      // תמיד נקה הדגשות ויזואליות של חיבור קבוצתי בסוף הגרירה
      clearPotentialGroupSnapVisuals();
      return snapped; // החזר האם בוצע חיבור קבוצתי
    }
  };

  // === אתחול ===
  function initGroupConnect() {
    if (!window.LinkageImprovedAPI || !window.GroupDragAPI) {
      console.error("[GroupConnect] Critical dependencies (LinkageImprovedAPI or GroupDragAPI) not found during init. Retrying...");
      setTimeout(initGroupConnect, 1000); // נסה שוב עוד שנייה
      return;
    }
    LI_API = window.LinkageImprovedAPI;
    GD_API = window.GroupDragAPI;

    log('אתחול מודול חיבור קבוצות.');

    const styleId = 'group-connect-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .potential-group-snap-source { /* הדגשה לבלוק המקור בקבוצה הנגררת */
          /* ניתן להוסיף כאן סגנון מיוחד אם רוצים, מעבר לנקודות החיבור */
          /* למשל: box-shadow: 0 0 8px ${CONFIG.GROUP_CONNECT_HIGHLIGHT_COLOR}; */
        }
        .potential-group-snap-target { /* הדגשה לבלוק היעד */
          /* ניתן להוסיף כאן סגנון מיוחד אם רוצים */
          /* למשל: box-shadow: 0 0 8px gold; */
        }
      `;
      document.head.appendChild(style);
    }
    log('מודול חיבור קבוצות אותחל בהצלחה. מוכן לקריאות מ-GroupConnectGlobalHandlers.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGroupConnect);
  } else {
    initGroupConnect(); // אם ה-DOM כבר טעון
  }

})();
