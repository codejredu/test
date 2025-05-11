// --- GROUP-CONNECT.JS (גישה עצמאית) - עם תיקונים ודיבאג משופר ---

(function() {
  'use strict';

  const CONFIG = {
    CONNECT_THRESHOLD: 40,       // מרחק מרבי לזיהוי קרבה (בפיקסלים)
    VERTICAL_OVERLAP_REQ: 0.4,  // אחוז חפיפה אנכית מינימלי נדרש (40%)
    DEBUG: true,                // הפעלת הודעות דיבאג בקונסול
    HIGHLIGHT_SOURCE_GROUP_EDGE: 'gc-highlight-source-edge', // קלאס להדגשת בלוק מקור
    HIGHLIGHT_TARGET_GROUP_EDGE: 'gc-highlight-target-edge', // קלאס להדגשת בלוק יעד
    HIGHLIGHT_CONNECTION_POINT: 'gc-highlight-connection-point' // קלאס להדגשת נקודת חיבור
  };

  // === משתנים גלובליים במודול ===
  let isDragRelevantForGroupConnect = false;
  let currentDraggedBlockElement = null;
  let draggedGroupInfo = {
    blocks: [],
    leftmostBlock: null,
    rightmostBlock: null
  };
  let potentialGroupSnapInfo = null;

  function log(message, data) {
    if (CONFIG.DEBUG) {
      const prefix = '[GroupConnectDEBUG]';
      if (data !== undefined) {
        // שימוש ב-JSON.stringify עם replacer למניעת שגיאות Circular structure
        const replacer = (key, value) => {
            if (value instanceof HTMLElement) {
                return `HTMLElement#${value.id || value.tagName}`;
            }
            return value;
        };
        try {
            // אם data הוא אובייקט גדול, נדפיס אותו ישירות כדי שאפשר יהיה לפתוח אותו בקונסול
            if (typeof data === 'object' && data !== null) {
                 console.log(prefix, message, data);
            } else {
                 console.log(prefix, message, JSON.parse(JSON.stringify(data, replacer)));
            }
        } catch (e) {
             console.log(prefix, message, '(לא ניתן להמיר את הנתונים ל-JSON)');
        }

      } else {
        console.log(prefix, message);
      }
    }
  }

  /**
   * מאתר את כל הבלוקים המחוברים לבלוק התחלתי נתון.
   * גרסה מתוקנת ומפושטת, מסתמכת על data-connected-to ו-data-connected-from-left.
   */
  function findConnectedBlocksRecursively(startBlock) {
    log('findConnectedBlocksRecursively: מתחיל עם בלוק:', startBlock ? startBlock.id : 'null');
    if (!startBlock || !startBlock.id) return [];
    
    const group = new Set();
    const queue = [startBlock];
    group.add(startBlock);

    let iterations = 0;
    const MAX_ITERATIONS = 100; // למנוע לולאות אינסופיות במקרי קצה

    while (queue.length > 0 && iterations < MAX_ITERATIONS) {
      iterations++;
      const current = queue.shift();
      // log(`findConnectedBlocksRecursively: איטרציה ${iterations}, בודק את ${current.id}`);

      // 1. בדוק חיבור ימינה (current מחובר לבלוק מימינו)
      const connectedToId = current.getAttribute('data-connected-to');
      if (connectedToId) {
        const rightBlock = document.getElementById(connectedToId);
        // log(`findConnectedBlocksRecursively: ${current.id} מחובר מימין ל-${connectedToId}`);
        if (rightBlock && !group.has(rightBlock)) {
          group.add(rightBlock);
          queue.push(rightBlock);
          // log(`findConnectedBlocksRecursively: הוסיף לקבוצה (מימין): ${rightBlock.id}`);
        }
      }

      // 2. בדוק חיבור שמאלה (בלוק אחר מחובר לצד השמאלי של current)
      //    זה אומר של-current יש מאפיין data-connected-from-left
      const connectedFromLeftId = current.getAttribute('data-connected-from-left');
      if (connectedFromLeftId) {
        const leftBlock = document.getElementById(connectedFromLeftId);
        // log(`findConnectedBlocksRecursively: ${current.id} מחובר משמאל מ-${connectedFromLeftId}`);
        if (leftBlock && !group.has(leftBlock)) {
          group.add(leftBlock);
          queue.push(leftBlock);
          // log(`findConnectedBlocksRecursively: הוסיף לקבוצה (משמאל): ${leftBlock.id}`);
        }
      }
    }

    if (iterations >= MAX_ITERATIONS) {
        console.warn(`[GroupConnectDEBUG] findConnectedBlocksRecursively הגיע למגבלת ${MAX_ITERATIONS} איטרציות עבור ${startBlock.id}.`);
    }
    log('findConnectedBlocksRecursively: קבוצה סופית שנמצאה עבור ' + startBlock.id + ':', Array.from(group).map(b => b.id));
    return Array.from(group);
  }

  function getGroupEdgeBlocks(groupBlocksArray) {
    if (!groupBlocksArray || groupBlocksArray.length === 0) {
      return { leftmostBlock: null, rightmostBlock: null };
    }
    let leftmost = groupBlocksArray[0];
    let rightmost = groupBlocksArray[0];
    
    let leftmostX = Infinity;
    let rightmostX = -Infinity;

    // כדי לקבל את המיקומים המדויקים, יש לוודא שהאלמנטים נראים ובעלי מידות
    groupBlocksArray.forEach(block => {
        if (block.offsetParent === null) { // אם הבלוק מוסתר או לא ב-layout
            // log('getGroupEdgeBlocks: בלוק מוסתר, מתעלם מחישוב קצוות עבורו:', block.id);
            return; 
        }
        const rect = block.getBoundingClientRect();
        if (rect.left < leftmostX) {
            leftmost = block;
            leftmostX = rect.left;
        }
        if (rect.right > rightmostX) {
            rightmost = block;
            rightmostX = rect.right;
        }
    });
    
    // אם כל הבלוקים היו מוסתרים, נחזיר null
    if (leftmostX === Infinity) leftmost = null;
    if (rightmostX === -Infinity) rightmost = null;

    log('getGroupEdgeBlocks: שמאלי:', leftmost ? leftmost.id : 'null', 'ימני:', rightmost ? rightmost.id : 'null');
    return { leftmostBlock: leftmost, rightmostBlock: rightmost };
  }

  function findVisualConnectionPoints(blockEl) {
    if (!blockEl) return { leftPoint: null, rightPoint: null };
    const leftPoint = blockEl.querySelector('.connection-point.left');
    const rightPoint = blockEl.querySelector('.connection-point.right');
    return { leftPoint, rightPoint };
  }

  function applyHighlightToConnectionPoint(pointElement, shouldHighlight) {
    if (pointElement) {
      if (shouldHighlight) {
        pointElement.classList.add(CONFIG.HIGHLIGHT_CONNECTION_POINT);
      } else {
        pointElement.classList.remove(CONFIG.HIGHLIGHT_CONNECTION_POINT);
      }
    }
  }
  
  function clearAllGroupConnectHighlights() {
    document.querySelectorAll(`.${CONFIG.HIGHLIGHT_SOURCE_GROUP_EDGE}, .${CONFIG.HIGHLIGHT_TARGET_GROUP_EDGE}`)
      .forEach(el => {
        el.classList.remove(CONFIG.HIGHLIGHT_SOURCE_GROUP_EDGE);
        el.classList.remove(CONFIG.HIGHLIGHT_TARGET_GROUP_EDGE);
      });
    document.querySelectorAll(`.${CONFIG.HIGHLIGHT_CONNECTION_POINT}`)
      .forEach(el => el.classList.remove(CONFIG.HIGHLIGHT_CONNECTION_POINT));
  }

  function checkProximity(sourceRect, targetRect, sourceSide, targetSide) {
    if (!sourceRect || !targetRect || sourceRect.width === 0 || sourceRect.height === 0 || targetRect.width === 0 || targetRect.height === 0) {
        log('checkProximity: נתוני מלבן לא תקינים או בעלי מידות אפס.', {sourceRect, targetRect});
        return false;
    }

    const verticalOverlap = Math.max(0, Math.min(sourceRect.bottom, targetRect.bottom) - Math.max(sourceRect.top, targetRect.top));
    const minHeightForOverlapCheck = Math.min(sourceRect.height, targetRect.height);
    if (minHeightForOverlapCheck === 0) return false; // מניעת חלוקה באפס
    const actualVerticalOverlapRatio = verticalOverlap / minHeightForOverlapCheck;
    
    // log('checkProximity:', {
    //     sourceRect, targetRect, sourceSide, targetSide,
    //     verticalOverlap, minHeightForOverlapCheck, actualVerticalOverlapRatio,
    //     VERTICAL_OVERLAP_REQ: CONFIG.VERTICAL_OVERLAP_REQ
    // });

    if (actualVerticalOverlapRatio < CONFIG.VERTICAL_OVERLAP_REQ) {
      return false;
    }

    let horizontalDistance;
    if (sourceSide === 'right' && targetSide === 'left') {
      horizontalDistance = targetRect.left - sourceRect.right; // חיובי אם יש רווח, שלילי אם יש חפיפה
    } else if (sourceSide === 'left' && targetSide === 'right') {
      horizontalDistance = sourceRect.left - targetRect.right; // חיובי אם יש רווח, שלילי אם יש חפיפה
    } else {
      return false;
    }
    
    // אנחנו רוצים שהמרחק יהיה קטן (קרוב לאפס) ואפילו חפיפה קלה (ערך שלילי קטן)
    // CONFIG.CONNECT_THRESHOLD הוא המרחק המרבי המותר (אם הוא 0, אז רק חפיפה תתפוס)
    // נניח ש-CONNECT_THRESHOLD יכול להיות גם קצת שלילי כדי לאפשר snap גם בחפיפה קלה
    // log('checkProximity: horizontalDistance:', horizontalDistance.toFixed(1), 'CONNECT_THRESHOLD:', CONFIG.CONNECT_THRESHOLD);
    return horizontalDistance >= -5 && horizontalDistance < CONFIG.CONNECT_THRESHOLD; // מאפשר חפיפה קלה של עד 5px או רווח עד סף החיבור
  }

  function evaluatePotentialGroupSnaps() {
    if (!isDragRelevantForGroupConnect || !currentDraggedBlockElement) return;
    
    const currentGroupBlocks = findConnectedBlocksRecursively(currentDraggedBlockElement);
    if (currentGroupBlocks.length === 0) {
        log('evaluatePotentialGroupSnaps: לא נמצאה קבוצה לבלוק הנגרר:', currentDraggedBlockElement.id);
        clearAllGroupConnectHighlights();
        potentialGroupSnapInfo = null;
        return;
    }

    const { leftmostBlock: dragLeftmost, rightmostBlock: dragRightmost } = getGroupEdgeBlocks(currentGroupBlocks);
    
    draggedGroupInfo = { // עדכון המידע הגלובלי
        blocks: currentGroupBlocks,
        leftmostBlock: dragLeftmost,
        rightmostBlock: dragRightmost
    };

    if (!dragLeftmost || !dragRightmost) {
      log('evaluatePotentialGroupSnaps: לא נמצאו קצוות לקבוצה הנגררת.');
      clearAllGroupConnectHighlights();
      potentialGroupSnapInfo = null;
      return;
    }
    // log('evaluatePotentialGroupSnaps: קבוצה נגררת:', {
    //     ids: currentGroupBlocks.map(b => b.id),
    //     leftmost: dragLeftmost.id,
    //     rightmost: dragRightmost.id
    // });

    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;

    let bestSnapFound = null;

    const allPossibleTargets = Array.from(programmingArea.querySelectorAll('.block-container'))
      .filter(block => !draggedGroupInfo.blocks.some(draggedBlock => draggedBlock.id === block.id) && block.offsetParent !== null);
    
    // log('evaluatePotentialGroupSnaps: מספר מטרות פוטנציאליות לבדיקה:', allPossibleTargets.length);

    for (const targetCandidateElement of allPossibleTargets) {
      const targetGroupRaw = findConnectedBlocksRecursively(targetCandidateElement);
      const targetGroupActual = targetGroupRaw.length > 0 ? targetGroupRaw : [targetCandidateElement];
      const { leftmostBlock: targetLeftmost, rightmostBlock: targetRightmost } = getGroupEdgeBlocks(targetGroupActual);

      if (!targetLeftmost || !targetRightmost) continue;

      // תרחיש 1: חיבור הצד הימני של הקבוצה הנגררת (dragRightmost) לצד השמאלי של קבוצת/בלוק יעד (targetLeftmost)
      const isDragRightSideFree = !dragRightmost.hasAttribute('data-connected-to');
      const isTargetLeftSideFree = !targetLeftmost.hasAttribute('data-connected-from-left');
      
      // log(`evaluatePotentialGroupSnaps: בדיקת ${dragRightmost.id}(ימין) -> ${targetLeftmost.id}(שמאל). נגרר פנוי: ${isDragRightSideFree}, יעד פנוי: ${isTargetLeftSideFree}`);
      if (isDragRightSideFree && isTargetLeftSideFree) {
        const dragRightRect = dragRightmost.getBoundingClientRect();
        const targetLeftRect = targetLeftmost.getBoundingClientRect();
        if (checkProximity(dragRightRect, targetLeftRect, 'right', 'left')) {
          bestSnapFound = {
            sourceDragConnectingBlock: dragRightmost,
            targetStaticConnectingBlock: targetLeftmost,
            sourceDragSide: 'right',
            targetStaticSide: 'left',
            entireDraggedGroupArray: draggedGroupInfo.blocks
          };
          log('evaluatePotentialGroupSnaps: מצא התאמה (ימין לשמאל):', {src: dragRightmost.id, tgt: targetLeftmost.id });
          break; 
        }
      }

      if (bestSnapFound) break;

      // תרחיש 2: חיבור הצד השמאלי של הקבוצה הנגררת (dragLeftmost) לצד הימני של קבוצת/בלוק יעד (targetRightmost)
      const isDragLeftSideFree = !dragLeftmost.hasAttribute('data-connected-from-left');
      const isTargetRightSideFree = !targetRightmost.hasAttribute('data-connected-to');
      
      // log(`evaluatePotentialGroupSnaps: בדיקת ${dragLeftmost.id}(שמאל) -> ${targetRightmost.id}(ימין). נגרר פנוי: ${isDragLeftSideFree}, יעד פנוי: ${isTargetRightSideFree}`);
      if (isDragLeftSideFree && isTargetRightSideFree) {
        const dragLeftRect = dragLeftmost.getBoundingClientRect();
        const targetRightRect = targetRightmost.getBoundingClientRect();
        if (checkProximity(dragLeftRect, targetRightRect, 'left', 'right')) {
          bestSnapFound = {
            sourceDragConnectingBlock: dragLeftmost,
            targetStaticConnectingBlock: targetRightmost,
            sourceDragSide: 'left',
            targetStaticSide: 'right',
            entireDraggedGroupArray: draggedGroupInfo.blocks
          };
          log('evaluatePotentialGroupSnaps: מצא התאמה (שמאל לימין):', {src: dragLeftmost.id, tgt: targetRightmost.id });
          break;
        }
      }
      if (bestSnapFound) break;
    }
    
    if (bestSnapFound) {
        if (potentialGroupSnapInfo?.sourceDragConnectingBlock?.id !== bestSnapFound.sourceDragConnectingBlock.id ||
            potentialGroupSnapInfo?.targetStaticConnectingBlock?.id !== bestSnapFound.targetStaticConnectingBlock.id) {
            
            clearAllGroupConnectHighlights();
            potentialGroupSnapInfo = bestSnapFound;
            log('מעדכן הדגשה עבור חיבור פוטנציאלי:', {src: potentialGroupSnapInfo.sourceDragConnectingBlock.id, tgt: potentialGroupSnapInfo.targetStaticConnectingBlock.id});
            
            // אין צורך ב-HIGHLIGHT_SOURCE_GROUP_EDGE וכו' על כל הבלוק, הנקודות מספיקות
            // potentialGroupSnapInfo.sourceDragConnectingBlock.classList.add(CONFIG.HIGHLIGHT_SOURCE_GROUP_EDGE);
            // potentialGroupSnapInfo.targetStaticConnectingBlock.classList.add(CONFIG.HIGHLIGHT_TARGET_GROUP_EDGE);

            const sourcePoints = findVisualConnectionPoints(potentialGroupSnapInfo.sourceDragConnectingBlock);
            const targetPoints = findVisualConnectionPoints(potentialGroupSnapInfo.targetStaticConnectingBlock);

            if (potentialGroupSnapInfo.sourceDragSide === 'right') {
                applyHighlightToConnectionPoint(sourcePoints.rightPoint, true);
                applyHighlightToConnectionPoint(targetPoints.leftPoint, true);
            } else { 
                applyHighlightToConnectionPoint(sourcePoints.leftPoint, true);
                applyHighlightToConnectionPoint(targetPoints.rightPoint, true);
            }
        }
    } else {
        if (potentialGroupSnapInfo) {
            clearAllGroupConnectHighlights();
            potentialGroupSnapInfo = null;
            log('לא נמצאה התאמה, מנקה הדגשות קודמות.');
        }
    }
  }

  function executeActualGroupSnap() {
    if (!potentialGroupSnapInfo) {
      log('executeActualGroupSnap: אין חיבור קבוצתי לביצוע.');
      return false;
    }

    const {
      sourceDragConnectingBlock,
      targetStaticConnectingBlock,
      sourceDragSide,
      entireDraggedGroupArray
    } = potentialGroupSnapInfo;

    log('executeActualGroupSnap: מבצע חיבור:', {
        sourceBlock: sourceDragConnectingBlock.id,
        targetBlock: targetStaticConnectingBlock.id,
        sourceSide: sourceDragSide
    });

    // 1. ניקוי חיבורים ישנים של הבלוקים המעורבים בצד הרלוונטי
    if (sourceDragSide === 'right') { // הצד הימני של הנגרר מתחבר
        const oldConnectedToId = sourceDragConnectingBlock.getAttribute('data-connected-to');
        if (oldConnectedToId) document.getElementById(oldConnectedToId)?.removeAttribute('data-connected-from-left');
        sourceDragConnectingBlock.removeAttribute('data-connected-to');
    } else { // הצד השמאלי של הנגרר מתחבר (sourceDragSide === 'left')
        const oldConnectedFromLeftId = sourceDragConnectingBlock.getAttribute('data-connected-from-left');
        if (oldConnectedFromLeftId) document.getElementById(oldConnectedFromLeftId)?.removeAttribute('data-connected-to');
        sourceDragConnectingBlock.removeAttribute('data-connected-from-left');
    }
    // ניקוי הצד המתאים של בלוק היעד הסטטי
    if (potentialGroupSnapInfo.targetStaticSide === 'left') { // הצד השמאלי של היעד מתחבר
        const oldConnectedFromLeftIdOnTarget = targetStaticConnectingBlock.getAttribute('data-connected-from-left');
        if (oldConnectedFromLeftIdOnTarget) document.getElementById(oldConnectedFromLeftIdOnTarget)?.removeAttribute('data-connected-to');
        targetStaticConnectingBlock.removeAttribute('data-connected-from-left');
    } else { // הצד הימני של היעד מתחבר (targetStaticSide === 'right')
        const oldConnectedToIdOnTarget = targetStaticConnectingBlock.getAttribute('data-connected-to');
        if (oldConnectedToIdOnTarget) document.getElementById(oldConnectedToIdOnTarget)?.removeAttribute('data-connected-from-left');
        targetStaticConnectingBlock.removeAttribute('data-connected-to');
    }


    // 2. יצירת החיבור החדש
    if (sourceDragSide === 'right') { // הנגרר משמאל ליעד
      sourceDragConnectingBlock.setAttribute('data-connected-to', targetStaticConnectingBlock.id);
      targetStaticConnectingBlock.setAttribute('data-connected-from-left', sourceDragConnectingBlock.id);
    } else { // הנגרר מימין ליעד (sourceDragSide === 'left')
      targetStaticConnectingBlock.setAttribute('data-connected-to', sourceDragConnectingBlock.id);
      sourceDragConnectingBlock.setAttribute('data-connected-from-left', targetStaticConnectingBlock.id);
    }
    log(`executeActualGroupSnap: מאפייני data עודכנו.`);

    // 3. התאמת מיקום הקבוצה הנגררת
    // ודא שהבלוקים עדיין קיימים לפני קריאה ל-getBoundingClientRect
    if (!document.body.contains(sourceDragConnectingBlock) || !document.body.contains(targetStaticConnectingBlock)) {
        log('executeActualGroupSnap: אחד מבלוקי החיבור הוסר מה-DOM לפני התאמת מיקום.');
        clearAllGroupConnectHighlights();
        potentialGroupSnapInfo = null;
        return false;
    }
    const sourceRectBeforeAlignment = sourceDragConnectingBlock.getBoundingClientRect();
    const targetRect = targetStaticConnectingBlock.getBoundingClientRect();
    let newSourceX, newSourceY;

    if (sourceDragSide === 'right') {
      newSourceX = targetRect.left - sourceDragConnectingBlock.offsetWidth; // אין רווח ביניהם
    } else { 
      newSourceX = targetRect.right; // אין רווח ביניהם
    }
    // יישור אנכי: מרכז הבלוק הנגרר למרכז בלוק היעד
    newSourceY = targetRect.top + (targetRect.height / 2) - (sourceDragConnectingBlock.offsetHeight / 2);

    const deltaX = newSourceX - sourceRectBeforeAlignment.left;
    const deltaY = newSourceY - sourceRectBeforeAlignment.top;

    entireDraggedGroupArray.forEach(memberBlock => {
      if (!document.body.contains(memberBlock)) return; // ודא שגם חברי הקבוצה קיימים
      // קריאת המיקום הנוכחי מ-style.left/top או מ-getComputedStyle
      let currentLeft = parseFloat(memberBlock.style.left || 0);
      let currentTop = parseFloat(memberBlock.style.top || 0);
      // אם style.left/top לא מוגדרים, getComputedStyle עשוי לתת ערכים התחלתיים טובים יותר
      // אך זה יכול להיות מורכב אם הבלוקים לא ממוקמים אבסולוטית באותו הקשר.
      // נניח כרגע ש-style.left/top הם המקור האמין למיקום הנוכחי שניתן לשנות.
      
      memberBlock.style.left = `${currentLeft + deltaX}px`;
      memberBlock.style.top = `${currentTop + deltaY}px`;
    });

    log(`executeActualGroupSnap: הקבוצה הנגררת הוזזה (${deltaX.toFixed(1)}px, ${deltaY.toFixed(1)}px).`);
    
    clearAllGroupConnectHighlights();
    potentialGroupSnapInfo = null; // איפוס לאחר ביצוע מוצלח
    return true;
  }

  function onMouseDown(event) {
    // log('onMouseDown: התקבל אירוע');
    const target = event.target.closest('.block-container');
    if (!target) {
      isDragRelevantForGroupConnect = false;
      return;
    }
    
    currentDraggedBlockElement = target;
    isDragRelevantForGroupConnect = true;
    potentialGroupSnapInfo = null; 
    clearAllGroupConnectHighlights(); 

    // הוספת קלאס זמני - אולי לא נחוץ אם הסינון עובד טוב
    // const group = findConnectedBlocksRecursively(currentDraggedBlockElement);
    // group.forEach(b => b.classList.add('gc-is-dragged-member'));

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    log('onMouseDown: מעקב גרירה החל עבור:', currentDraggedBlockElement.id);
  }

  function onMouseMove(event) {
    if (!isDragRelevantForGroupConnect || !currentDraggedBlockElement) return;
    evaluatePotentialGroupSnaps();
    // event.preventDefault(); // נבדוק אם זה מפריע לקוד האחר
  }

  function onMouseUp(event) {
    // log('onMouseUp: התקבל אירוע');
    if (!isDragRelevantForGroupConnect) return;
    
    // הסרת קלאס זמני אם היה בשימוש
    // findConnectedBlocksRecursively(currentDraggedBlockElement)
    //    .forEach(b => b.classList.remove('gc-is-dragged-member'));

    if (potentialGroupSnapInfo) {
      const snapSuccess = executeActualGroupSnap();
      if (snapSuccess) {
        log('onMouseUp: חיבור קבוצתי בוצע בהצלחה.');
        // אם linkage-group-drag-simplified.js מאזין לשינויי attributes,
        // הוא אמור להגיב אוטומטית.
      }
    } else {
      clearAllGroupConnectHighlights(); // אם לא היה חיבור, נקה הדגשות סופית
    }

    isDragRelevantForGroupConnect = false;
    currentDraggedBlockElement = null;
    draggedGroupInfo = { blocks: [], leftmostBlock: null, rightmostBlock: null };
    // potentialGroupSnapInfo כבר אמור להיות null

    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    log('onMouseUp: סיום טיפול בחיבור קבוצתי.');
  }

  function init() {
    log('init: מתחיל אתחול מודול GroupConnect.');
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) {
      console.error('[GroupConnectDEBUG] אלמנט #program-blocks לא נמצא. המודול לא יאותחל.');
      return;
    }

    programmingArea.addEventListener('mousedown', onMouseDown, false);

    const styleId = 'group-connect-styles';
    if (!document.getElementById(styleId)) {
      const styleSheet = document.createElement('style');
      styleSheet.id = styleId;
      styleSheet.textContent = `
        /* אין צורך בהדגשת כל הבלוק, הנקודות מספיקות ופחות מפריעות */
        /* .${CONFIG.HIGHLIGHT_SOURCE_GROUP_EDGE}, .${CONFIG.HIGHLIGHT_TARGET_GROUP_EDGE} {
             outline: 1px dashed #007bff; 
        } */
        .connection-point.${CONFIG.HIGHLIGHT_CONNECTION_POINT} {
          background-color: #FFD700 !important; /* צבע זהב */
          border: 2px solid #FFA500 !important; /* כתום כהה */
          transform: scale(1.8) !important; 
          opacity: 1 !important;
          z-index: 20000 !important; /* גבוה מאוד כדי להיות מעל הכל */
          border-radius: 50%;
          box-shadow: 0 0 10px #FFD700; 
        }
        /* .gc-is-dragged-member { } */
      `;
      document.head.appendChild(styleSheet);
      log('init: הוספו סגנונות CSS דינמיים.');
    }

    log('מודול GroupConnect (עם דיבאג משופר) אותחל.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
