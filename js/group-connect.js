// --- GROUP-CONNECT.JS ---
// מודול לחיבור קבוצות בלוקים או קבוצה לבלוק בודד

(function() {
  'use strict';

  // === הגדרות (ניתן להתאים ולשלב עם הגדרות קיימות) ===
  const CONFIG = {
    CONNECT_THRESHOLD: 40,       // מרחק לזיהוי אפשרות חיבור (בפיקסלים)
    GROUP_CONNECT_HIGHLIGHT_COLOR: '#4CAF50', // צבע הדגשה לחיבור קבוצתי (ירוק)
    DEBUG: true,
    // ... הגדרות נוספות מתוך linkageimproved.js ו-linkage-group-drag-simplified.js יכולות להשתלב כאן
  };

  // === פונקציות עזר (חלקן עשויות להיות קיימות או דורשות התאמה) ===

  function log(message, data) {
    if (CONFIG.DEBUG) {
      if (data) {
        console.log(`[GroupConnect] ${message}`, data);
      } else {
        console.log(`[GroupConnect] ${message}`);
      }
    }
  }

  // פונקציה לאיתור כל הבלוקים המחוברים (ניתן להתבסס על findConnectedBlocks מ-linkage-group-drag-simplified.js)
  function findEntireGroup(startBlock) {
    // זוהי הפשטה. יש לממש לוגיקה דומה ל-findConnectedBlocks
    // או להשתמש בפונקציה קיימת אם היא נגישה גלובלית או מיובאת.
    if (!startBlock) return [];
    log(`מציאת קבוצה שלמה המתחילה מ-${startBlock.id}`);
    
    const group = [startBlock];
    const processed = new Set([startBlock.id]);
    const queue = [startBlock];

    while (queue.length > 0) {
      const current = queue.shift();
      const connections = [];

      // בדוק חיבורים קיימים (data-connected-to, data-connected-from-left/right)
      const rightBlockId = current.getAttribute('data-connected-to');
      if (rightBlockId) connections.push(document.getElementById(rightBlockId));
      
      const leftBlockIdViaRight = current.getAttribute('data-connected-from-right');
      if (leftBlockIdViaRight) connections.push(document.getElementById(leftBlockIdViaRight));

      const rightBlockIdViaLeft = current.getAttribute('data-connected-from-left');
       if (rightBlockIdViaLeft) connections.push(document.getElementById(rightBlockIdViaLeft));


      for (const connectedBlock of connections) {
        if (connectedBlock && !processed.has(connectedBlock.id)) {
          group.push(connectedBlock);
          processed.add(connectedBlock.id);
          queue.push(connectedBlock);
        }
      }
    }
    log(`נמצאו ${group.length} בלוקים בקבוצה של ${startBlock.id}`);
    return group;
  }

  // פונקציה למציאת הבלוק השמאלי ביותר בקבוצה
  function findLeftmostBlockInGroup(blocks) {
    if (!blocks || blocks.length === 0) return null;
    return blocks.reduce((leftmost, current) => 
      current.getBoundingClientRect().left < leftmost.getBoundingClientRect().left ? current : leftmost
    );
  }

  // פונקציה למציאת הבלוק הימני ביותר בקבוצה
  function findRightmostBlockInGroup(blocks) {
    if (!blocks || blocks.length === 0) return null;
    return blocks.reduce((rightmost, current) => 
      current.getBoundingClientRect().right > rightmost.getBoundingClientRect().right ? current : rightmost
    );
  }

  // פונקציה לבדיקה האם בלוק הוא חלק מקבוצה משמעותית
  function isBlockInGroup(block) {
      return block.hasAttribute('data-connected-to') ||
             block.hasAttribute('data-connected-from-left') ||
             block.hasAttribute('data-connected-from-right');
  }


  // === לוגיקת חיבור קבוצות ===

  // פונקציה זו נקראת כאשר בלוק (שעשוי להיות חלק מקבוצה) נגרר
  // היא צריכה להשתלב עם handleMouseMove מ-linkageimproved.js
  function checkAndHighlightGroupSnapPossibility(draggedElement) {
    if (!draggedElement) return;

    const isDraggedElementGroupLeader = draggedElement.classList.contains('group-leader'); // בהנחה שקיים קלאס כזה
    const draggedGroup = findEntireGroup(draggedElement); // מצא את כל הקבוצה הנגררת

    if (draggedGroup.length === 0) {
        // אם הבלוק הנגרר אינו חלק מקבוצה, השתמש בלוגיקה הרגילה של linkageimproved.js
        // clearPotentialGroupSnap(); // פונקציה לניקוי הדגשות קבוצתיות
        // linkageImproved.checkAndHighlightSnapPossibility(draggedElement); // קריאה לפונקציה המקורית
        return;
    }
    
    // אם אנחנו גוררים קבוצה, נמצא את הקצוות שלה
    const draggedGroupLeftmost = findLeftmostBlockInGroup(draggedGroup);
    const draggedGroupRightmost = findRightmostBlockInGroup(draggedGroup);

    if (!draggedGroupLeftmost || !draggedGroupRightmost) return;

    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;

    // נקה הדגשות קודמות של חיבור קבוצתי
    clearPotentialGroupSnap();
    let potentialSnapTargetInfo = null; // { targetElement: block, targetSide: 'left'/'right', sourceSide: 'left'/'right' }


    const allOtherBlocks = Array.from(programmingArea.querySelectorAll('.block-container'))
                                .filter(block => !draggedGroup.find(b => b.id === block.id) && block.offsetParent !== null);

    for (const targetBlock of allOtherBlocks) {
      const targetGroup = findEntireGroup(targetBlock);
      let currentTargetElementToConnect = targetBlock; // בלוק ספציפי שאליו נתחבר

      let targetAllowsLeftConnection = !targetBlock.hasAttribute('data-connected-from-left');
      let targetAllowsRightConnection = !targetBlock.hasAttribute('data-connected-from-right');
      
      let sourceRect, targetRectToUse;

      // אם הבלוק היעד הוא חלק מקבוצה, נרצה להתחבר לקצה הקבוצה שלו
      if (targetGroup.length > 1) {
          const targetGroupLeftmost = findLeftmostBlockInGroup(targetGroup);
          const targetGroupRightmost = findRightmostBlockInGroup(targetGroup);

          // האם ניתן לחבר את הצד הימני של הקבוצה הנגררת לצד השמאלי של קבוצת היעד
          if (targetGroupLeftmost && !targetGroupLeftmost.hasAttribute('data-connected-from-left')) {
            sourceRect = draggedGroupRightmost.getBoundingClientRect();
            targetRectToUse = targetGroupLeftmost.getBoundingClientRect();
            
            if (checkProximity(sourceRect, targetRectToUse, 'right', 'left')) {
                 potentialSnapTargetInfo = {
                    targetElement: targetGroupLeftmost, // נתחבר לבלוק השמאלי ביותר של קבוצת היעד
                    targetSide: 'left',
                    sourceBlock: draggedGroupRightmost, // הבלוק הימני ביותר של הקבוצה הנגררת
                    sourceSide: 'right',
                    type: 'group-to-group'
                 };
                 break; // מצאנו התאמה, אפשר להפסיק לבדוק מול בלוק זה
            }
          }
          // האם ניתן לחבר את הצד השמאלי של הקבוצה הנגררת לצד הימני של קבוצת היעד
          if (targetGroupRightmost && !targetGroupRightmost.hasAttribute('data-connected-from-right')) {
             sourceRect = draggedGroupLeftmost.getBoundingClientRect();
             targetRectToUse = targetGroupRightmost.getBoundingClientRect();

            if (checkProximity(sourceRect, targetRectToUse, 'left', 'right')) {
                potentialSnapTargetInfo = {
                    targetElement: targetGroupRightmost, // נתחבר לבלוק הימני ביותר של קבוצת היעד
                    targetSide: 'right',
                    sourceBlock: draggedGroupLeftmost, // הבלוק השמאלי ביותר של הקבוצה הנגררת
                    sourceSide: 'left',
                    type: 'group-to-group'
                };
                break; 
            }
          }
      } else { // בלוק יעד בודד
          // חיבור צד ימין של הקבוצה הנגררת לשמאל של בלוק בודד
          if (targetAllowsLeftConnection) {
            sourceRect = draggedGroupRightmost.getBoundingClientRect();
            targetRectToUse = currentTargetElementToConnect.getBoundingClientRect();
            if (checkProximity(sourceRect, targetRectToUse, 'right', 'left')) {
                 potentialSnapTargetInfo = {
                    targetElement: currentTargetElementToConnect,
                    targetSide: 'left',
                    sourceBlock: draggedGroupRightmost,
                    sourceSide: 'right',
                    type: 'group-to-single'
                 };
                 break;
            }
          }
          // חיבור צד שמאל של הקבוצה הנגררת לימין של בלוק בודד
          if (targetAllowsRightConnection) {
            sourceRect = draggedGroupLeftmost.getBoundingClientRect();
            targetRectToUse = currentTargetElementToConnect.getBoundingClientRect();
            if (checkProximity(sourceRect, targetRectToUse, 'left', 'right')) {
                potentialSnapTargetInfo = {
                    targetElement: currentTargetElementToConnect,
                    targetSide: 'right',
                    sourceBlock: draggedGroupLeftmost,
                    sourceSide: 'left',
                    type: 'group-to-single'
                };
                break;
            }
          }
      }
       if (potentialSnapTargetInfo) break; // אם מצאנו התאמה כלשהי עם ה-targetBlock/targetGroup הנוכחי
    }


    if (potentialSnapTargetInfo) {
      log('זוהתה אפשרות חיבור קבוצתי:', potentialSnapTargetInfo);
      highlightPotentialGroupSnap(potentialSnapTargetInfo.sourceBlock, potentialSnapTargetInfo.targetElement, potentialSnapTargetInfo.sourceSide);
      // שמור את המידע הזה כדי להשתמש בו ב-MouseUp
      draggedElement.dataset.potentialGroupSnapTarget = potentialSnapTargetInfo.targetElement.id;
      draggedElement.dataset.potentialGroupSnapTargetSide = potentialSnapTargetInfo.targetSide;
      draggedElement.dataset.potentialGroupSnapSourceSide = potentialSnapTargetInfo.sourceSide;
      draggedElement.dataset.potentialGroupSnapSourceBlock = potentialSnapTargetInfo.sourceBlock.id;
    } else {
      clearPotentialGroupSnap();
      delete draggedElement.dataset.potentialGroupSnapTarget;
      delete draggedElement.dataset.potentialGroupSnapTargetSide;
      delete draggedElement.dataset.potentialGroupSnapSourceSide;
      delete draggedElement.dataset.potentialGroupSnapSourceBlock;
    }
  }
  
  function checkProximity(sourceRect, targetRect, sourceSide, targetSide) {
      // בדיקת חפיפה אנכית בסיסית (ניתן לשפר עם CONFIG.VERTICAL_OVERLAP_REQ מ-linkageimproved)
      const verticalOverlap = Math.max(0, Math.min(sourceRect.bottom, targetRect.bottom) - Math.max(sourceRect.top, targetRect.top));
      if (verticalOverlap < Math.min(sourceRect.height, targetRect.height) * 0.4) { // דורש לפחות 40% חפיפה גובה
          return false;
      }

      let distance;
      if (sourceSide === 'right' && targetSide === 'left') {
          distance = Math.abs(sourceRect.right - targetRect.left);
      } else if (sourceSide === 'left' && targetSide === 'right') {
          distance = Math.abs(sourceRect.left - targetRect.right);
      } else {
          return false; // צירוף צדדים לא נתמך
      }
      
      return distance < CONFIG.CONNECT_THRESHOLD;
  }

  // פונקציה להדגשת חיבור קבוצתי פוטנציאלי
  function highlightPotentialGroupSnap(sourceConnectingBlock, targetConnectingBlock, sourceSide) {
    // ניתן להשתמש ב-highlightConnectionPoint מ-linkageimproved.js, או ליצור הדגשה ייעודית
    // לדוגמה, הוספת קלאס CSS זמני לשני הבלוקים שייצרו את החיבור
    sourceConnectingBlock.classList.add('potential-group-snap-source');
    targetConnectingBlock.classList.add('potential-group-snap-target');

    // הדגשת הנקודות הספציפיות
    // צריך גישה לפונקציה addConnectionPoints ו-highlightConnectionPoint מ-linkageimproved.js
    // או לממש אותן מחדש/לייבא אותן.
    // דוגמה מופשטת:
    // linkageImproved.highlightConnectionPoint(sourceConnectingBlock, sourceSide === 'left');
    // linkageImproved.highlightConnectionPoint(targetConnectingBlock, sourceSide !== 'left');

    log(`הדגשת חיבור קבוצתי פוטנציאלי: ${sourceConnectingBlock.id} (${sourceSide}) -> ${targetConnectingBlock.id}`);
  }

  // פונקציה לניקוי הדגשות
  function clearPotentialGroupSnap() {
    document.querySelectorAll('.potential-group-snap-source').forEach(el => el.classList.remove('potential-group-snap-source'));
    document.querySelectorAll('.potential-group-snap-target').forEach(el => el.classList.remove('potential-group-snap-target'));
    // וניקוי הדגשות נקודתיות אם יש
    // linkageImproved.clearAllHighlights();
    log('ניקוי הדגשות חיבור קבוצתי פוטנציאלי');
  }

  // פונקציה לביצוע החיבור (נקראת ב-MouseUp)
  // צריכה להשתלב עם handleMouseUp מ-linkageimproved.js
  function performGroupSnap(draggedElement) {
    const targetId = draggedElement.dataset.potentialGroupSnapTarget;
    const targetSide = draggedElement.dataset.potentialGroupSnapTargetSide;
    const sourceSide = draggedElement.dataset.potentialGroupSnapSourceSide;
    const sourceBlockId = draggedElement.dataset.potentialGroupSnapSourceBlock;

    if (!targetId || !targetSide || !sourceSide || !sourceBlockId) {
      return false;
    }

    const targetConnectingBlock = document.getElementById(targetId);
    const sourceConnectingBlock = document.getElementById(sourceBlockId);

    if (!targetConnectingBlock || !sourceConnectingBlock) {
      log('שגיאה: אחד מבלוקי החיבור לא נמצא.', {targetId, sourceBlockId});
      return false;
    }

    log(`ביצוע חיבור קבוצתי: ${sourceConnectingBlock.id} (${sourceSide}) אל ${targetConnectingBlock.id} (${targetSide})`);

    // כאן נשתמש בלוגיקת החיבור מ-linkageimproved.js (performBlockSnap)
    // אך נוודא שהיא נקראת עם הבלוקים הנכונים והכיוון הנכון.
    // performBlockSnap(sourceBlockToConnect, targetBlockToConnect, directionForTarget)
    // ה-directionForTarget הוא הצד של ה-targetBlock אליו ה-sourceBlock מתחבר.
    // לדוגמה, אם sourceSide='right' ו-targetSide='left', אז ה-source מתחבר לצד השמאלי של ה-target.
    // הכיוון יהיה 'left' (הצד של היעד אליו מתחברים).

    let snapSuccess = false;
    if (sourceSide === 'right' && targetSide === 'left') {
      // הקבוצה הנגררת מתחברת עם הצד הימני שלה לצד השמאלי של היעד
      // linkageImproved.performBlockSnap(sourceConnectingBlock, targetConnectingBlock, 'left');
      // לאחר החיבור, יש להתאים את מיקום כל הקבוצה הנגררת
      // כך שה-sourceConnectingBlock יהיה מיושר כראוי עם targetConnectingBlock
      // תוך שמירה על המבנה הפנימי של הקבוצה הנגררת.
      // זהו חלק מורכב הדורש חישוב היסטים.
      // באופן מופשט:
      // connectTwoBlocks(sourceConnectingBlock, targetConnectingBlock, 'right-to-left');
      snapSuccess = true; // Placeholder for actual snap logic call
      log("חיבור ימין-לשמאל בוצע (לכאורה). יש לממש את performBlockSnap המקורי.");

    } else if (sourceSide === 'left' && targetSide === 'right') {
      // הקבוצה הנגררת מתחברת עם הצד השמאלי שלה לצד הימני של היעד
      // linkageImproved.performBlockSnap(sourceConnectingBlock, targetConnectingBlock, 'right');
      // connectTwoBlocks(sourceConnectingBlock, targetConnectingBlock, 'left-to-right');
      snapSuccess = true; // Placeholder
      log("חיבור שמאל-לימין בוצע (לכאורה). יש לממש את performBlockSnap המקורי.");
    }
    
    if (snapSuccess) {
        // אם החיבור הצליח, הקבוצות למעשה התמזגו.
        // לוגיקת הגרירה של קבוצות (מ-linkage-group-drag-simplified.js) אמורה לטפל בזה אוטומטית
        // אם היא מבוססת על סריקת data-attributes.
        // ייתכן שצריך לעדכן את ה-"מוביל" של הקבוצה המאוחדת.
        // למשל, על ידי קריאה ל-scanAndMarkLeaders() מ-linkage-group-drag-simplified.js
        log('חיבור קבוצתי בוצע בהצלחה. הקבוצות התמזגו.');
        // אפשר להפעיל סאונד, אנימציה וכו'.
        // linkageImproved.playSnapSound();
        // linkageImproved.addSnapEffectAnimation(sourceConnectingBlock);

        // עדכון המיקום של הקבוצה הנגררת כולה
        // זה החלק המסובך: צריך להזיז את כל הבלוקים בקבוצה הנגררת
        // כך שה-sourceConnectingBlock יתחבר נכון ל-targetConnectingBlock,
        // תוך שמירה על המיקומים היחסיים של הבלוקים בתוך הקבוצה הנגררת.
        // אם linkageImproved.performBlockSnap מטפל במיקום הבלוק הבודד,
        // צריך להוסיף לוגיקה שתזיז את שאר חברי הקבוצה של sourceConnectingBlock בהתאם.
        // אם `linkage-group-drag-simplified.js` מטפל בגרירת קבוצה שלמה ע"י הזזת ה-leader
        // והזזת שאר הבלוקים יחסית אליו, אז לאחר החיבור, ה-leader עשוי להשתנות
        // והמיקומים צריכים להתעדכן.

        // דוגמה מופשטת מאוד להתאמת מיקום הקבוצה הנגררת:
        const draggedGroup = findEntireGroup(sourceConnectingBlock); // הקבוצה שאליה sourceConnectingBlock שייך
        const sourceRectBeforeSnap = sourceConnectingBlock.getBoundingClientRect(); // מיקום לפני שה-performBlockSnap הזיז אותו
        
        // לאחר ש-performBlockSnap הזיז את sourceConnectingBlock:
        const sourceRectAfterSnap = sourceConnectingBlock.getBoundingClientRect(); 
        
        const deltaX = sourceRectAfterSnap.left - sourceRectBeforeSnap.left;
        const deltaY = sourceRectAfterSnap.top - sourceRectBeforeSnap.top;

        if (draggedGroup.length > 1) {
            draggedGroup.forEach(memberBlock => {
                if (memberBlock.id !== sourceConnectingBlock.id) { // אל תזיז את הבלוק שכבר הוזז ע"י performBlockSnap
                    const currentLeft = parseFloat(memberBlock.style.left || 0);
                    const currentTop = parseFloat(memberBlock.style.top || 0);
                    memberBlock.style.left = `${currentLeft + deltaX}px`;
                    memberBlock.style.top = `${currentTop + deltaY}px`;
                }
            });
            log(`הקבוצה הנגררת הוזזה ${deltaX}, ${deltaY} כדי להתאים לחיבור.`);
        }


    }


    // נקה את המידע הזמני
    clearPotentialGroupSnap();
    delete draggedElement.dataset.potentialGroupSnapTarget;
    delete draggedElement.dataset.potentialGroupSnapTargetSide;
    delete draggedElement.dataset.potentialGroupSnapSourceSide;
    delete draggedElement.dataset.potentialGroupSnapSourceBlock;
    
    return snapSuccess;
  }
  
  // פונקציה מופשטת לחיבור שני בלוקים, שתקרא לפונקציונליות מ-linkageimproved
  function connectTwoBlocks(sourceBlock, targetBlock, connectionType) {
      // connectionType יכול להיות 'right-to-left' או 'left-to-right'
      // כאן צריך להפעיל את performBlockSnap מ-linkageimproved.js
      // עם הפרמטרים הנכונים.
      // לדוגמה:
      // if (connectionType === 'right-to-left') {
      //   linkageImproved.performBlockSnap(sourceBlock, targetBlock, 'left');
      // } else if (connectionType === 'left-to-right') {
      //   linkageImproved.performBlockSnap(sourceBlock, targetBlock, 'right');
      // }
      
      // לאחר החיבור, חשוב לוודא שמיקום הקבוצה כולה מתעדכן אם צריך.
      // הפונקציה performBlockSnap ב-linkageimproved.js מטפלת במיקום הבלוק הנגרר.
      // אם גוררים קבוצה, צריך להזיז את כל חברי הקבוצה בהתאם.
      console.warn("connectTwoBlocks: יש לממש קריאה ל-performBlockSnap המקורי עם התאמות מיקום לקבוצה כולה.");
  }


  // === אינטגרציה עם מערכת הגרירה הקיימת ===

  // יש "לתפוס" את אירועי הגרירה ולהוסיף את הבדיקות שלנו.
  // אם משתמשים ב-addEventListener, יש לוודא סדר נכון או לבטל אירועים קודמים.

  function enhancedHandleMouseMove(event) {
    // קוד מקורי מ-handleMouseMove של linkageimproved.js או linkage-group-drag-simplified.js
    // ... (הזזת הבלוק/קבוצה הנגררת) ...

    const currentDraggedBlock = window.currentDraggedBlock; // או איך שמאחזרים את הבלוק הנגרר
    if (currentDraggedBlock && window.isDraggingBlock) { // isDraggingBlock מ-linkageimproved
        // אם הבלוק הנגרר הוא חלק מקבוצה (או יכול להיות), בדוק חיבור קבוצתי
        const group = findEntireGroup(currentDraggedBlock);
        if (group.length > 0) { // או תנאי אחר, למשל אם הוא group-leader
             checkAndHighlightGroupSnapPossibility(currentDraggedBlock);
        } else {
            // אם זה בלוק בודד, אולי עדיין נרצה את ההתנהגות המקורית
            // linkageImproved.checkAndHighlightSnapPossibility(currentDraggedBlock);
        }
    }
  }

  function enhancedHandleMouseUp(event) {
    const currentDraggedBlock = window.currentDraggedBlock; // או איך שמאחזרים את הבלוק הנגרר
    let snapped = false;

    if (currentDraggedBlock && currentDraggedBlock.dataset.potentialGroupSnapTarget) {
      snapped = performGroupSnap(currentDraggedBlock);
    }

    if (snapped) {
      // אם בוצע חיבור קבוצתי, ייתכן שלא צריך את לוגיקת החיבור הבודד
      // או שצריך לנקות דברים ספציפיים.
      // צריך לנקות את ה-dataset attributes בכל מקרה.
        delete currentDraggedBlock.dataset.potentialGroupSnapTarget;
        delete currentDraggedBlock.dataset.potentialGroupSnapTargetSide;
        delete currentDraggedBlock.dataset.potentialGroupSnapSourceSide;
        delete currentDraggedBlock.dataset.potentialGroupSnapSourceBlock;
        
        // מניעת טיפול נוסף אם החיבור הקבוצתי הצליח והוא מספק
        // event.stopPropagation(); 
        // event.preventDefault();
    }
    
    // ... ואז קריאה ל-handleMouseUp המקורי מ-linkageimproved.js,
    // אם לא בוצע חיבור קבוצתי או אם רוצים התנהגות משולבת.
    // חשוב לוודא שלא נוצרת התנגשות אם שני סוגי החיבורים (בודד וקבוצתי) אפשריים.
    // יש להחליט על עדיפות.
    // if (!snapped) {
    //   linkageImproved.handleMouseUp(event);
    // } else {
         // אם החיבור הקבוצתי הצליח, אולי נרצה לדלג על חלק מהלוגיקה של handleMouseUp המקורי
         // כמו ניקוי isDraggingBlock, currentDraggedBlock וכו', אם זה נעשה כבר ב-performGroupSnap
         // או אם performGroupSnap קורא ל-handleMouseUp המקורי בסופו של דבר.
         // זה תלוי במבנה המדויק של linkageimproved.js
    // }
    
    // ניקוי כללי ללא קשר להצלחה
    clearPotentialGroupSnap();
    if (currentDraggedBlock) {
        delete currentDraggedBlock.dataset.potentialGroupSnapTarget;
        delete currentDraggedBlock.dataset.potentialGroupSnapTargetSide;
        delete currentDraggedBlock.dataset.potentialGroupSnapSourceSide;
        delete currentDraggedBlock.dataset.potentialGroupSnapSourceBlock;
    }
  }


  // === אתחול ===
  function initGroupConnect() {
    log('אתחול מודול חיבור קבוצות.');

    // כאן צריך להחליט איך להשתלב.
    // אפשרות 1: להחליף את המאזינים הקיימים במאזינים "משופרים".
    // document.removeEventListener('mousemove', linkageImproved.handleMouseMove);
    // document.addEventListener('mousemove', enhancedHandleMouseMove);
    // document.removeEventListener('mouseup', linkageImproved.handleMouseUp);
    // document.addEventListener('mouseup', enhancedHandleMouseUp);

    // אפשרות 2: "לעטוף" או "להאזין לפני/אחרי" אם המערכת מאפשרת.
    // זה דורש היכרות עמוקה יותר עם אופן פעולת הקבצים האחרים.
    // ודא שהמודולים האחרים (linkageimproved, linkage-group-drag) כבר אותחלו.

    // הוספת סגנונות CSS עבור הדגשות קבוצתיות (אם צריך)
    const styleId = 'group-connect-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .potential-group-snap-source, .potential-group-snap-target {
                outline: 3px dashed ${CONFIG.GROUP_CONNECT_HIGHLIGHT_COLOR} !important;
                box-shadow: 0 0 10px ${CONFIG.GROUP_CONNECT_HIGHLIGHT_COLOR} !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // חשוב: יש להבטיח ש-window.currentDraggedBlock ו-window.isDraggingBlock
    // (או המקבילות שלהם) יהיו נגישים לסקריפט הזה.
    // ייתכן שצריך לחשוף אותם מהמודולים האחרים או למצוא דרך אחרת לגשת אליהם.

    log('מודול חיבור קבוצות אותחל (באופן בסיסי). נדרשת אינטגרציה מלאה.');
  }

  // המתן לטעינת ה-DOM ולאתחול של סקריפטים אחרים אם יש תלות
  if (document.readyState === 'loading') {
    // המתן גם ל-groupDragInitialized ו-blockLinkageInitialized (מהסקריפטים האחרים)
    document.addEventListener('DOMContentLoaded', function() {
        // פה כדאי להמתין לאירוע מותאם אישית או לבדוק flag שהסקריפטים האחרים הציבו
        // כדי לדעת שהם סיימו אתחול. לדוגמה:
        // if (window.blockLinkageInitialized && window.groupDragInitialized) {
        //   initGroupConnect();
        // } else {
        //   console.warn("[GroupConnect] תלויות (linkageimproved, groupDrag) לא אותחלו. ממתין...");
        //   setTimeout(initGroupConnect, 2000); // נסיון נוסף אחרי השהייה
        // }
        
        // כרגע, נאתחל בפשטות. יש לשפר את מנגנון התלות.
        setTimeout(initGroupConnect, 1500); // השהייה קטנה לוודא שהשאר עלו
    });
  } else {
    // setTimeout(initGroupConnect, 1500);
  }

})();
