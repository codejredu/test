--- START OF FILE group-connect.js ---

// --- GROUP-CONNECT.JS v1.0.0 ---
// מודול לחיבור קבוצות בלוקים מחוברות

(function() {
  'use strict';

  // === הגדרות ===
  const config = {
    debug: true,                       // האם להדפיס הודעות דיבאג בקונסול
    groupConnectThreshold: 45,         // מרחק מרבי (בפיקסלים) לזיהוי אפשרות חיבור קבוצה
    verticalAlignThreshold: 30,        // סף חפיפה אנכית (בפיקסלים) - רחב יותר לקבוצות
    verticalOverlapReq: 0.2,           // דרישת חפיפה אנכית יחסית מינימלית (20%)
    highlightDelay: 10,                // השהייה קטנה לפני הצגת הדגשה
    
    // ערכי היסט פאזל - זהים ל-linkageimproved.js
    puzzleRightBulgeWidth: 10, 
    puzzleLeftSocketWidth: 10,
    verticalCenterOffset: 0,
    
    // כוונון עדין - זהה ל-linkageimproved.js
    horizontalFineTuningLeft: 9,
    horizontalFineTuningRight: -9
  };

  // === משתני מצב ===
  let potentialSnapInfo = null; // { sourceBlock, targetBlock, direction ('left'/'right') }

  // === פונקציות עזר ===

  // הדפסת הודעות דיבאג
  function log(message, data) {
    if (config.debug) {
      if (data !== undefined) { // Check for undefined explicitly to allow logging null/false
        console.log(`[GroupConnect] ${message}`, data);
      } else {
        console.log(`[GroupConnect] ${message}`);
      }
    }
  }

  // מציאת הבלוק הימני ביותר בקבוצה נתונה
  function findRightmostBlock(blocks) {
    if (!blocks || blocks.length === 0) return null;
    let rightmost = blocks[0];
    let rightPosition = rightmost.getBoundingClientRect().right;

    for (let i = 1; i < blocks.length; i++) {
      const position = blocks[i].getBoundingClientRect().right;
      if (position > rightPosition) {
        rightPosition = position;
        rightmost = blocks[i];
      }
    }
    return rightmost;
  }
  
  // --- פונקציות משוכפלות/מותאמות מ-linkage-group-drag-simplified ---
  // (במקרה שהן לא זמינות גלובלית, או כדי למנוע תלויות)
  
  // מציאת כל הבלוקים המחוברים (בהנחה שפונקציה זו קיימת ונגישה, אחרת יש לשכפל)
  // אם הפונקציה המקורית אינה זמינה גלובלית, יש להעתיק אותה לכאן
  const findConnectedBlocksLocal = (typeof findConnectedBlocks === 'function') ? findConnectedBlocks : function(startBlock) {
      // *** Fallback/Copied Implementation Here if needed ***
      console.warn("[GroupConnect] Using local fallback for findConnectedBlocks. Ensure original is available or copy implementation.");
      if (!startBlock) return [];
      const result = [startBlock];
      const processed = new Set([startBlock.id]);
      const queue = [startBlock];
      // ... (rest of the implementation copied from linkage-group-drag-simplified.js) ...
       while (queue.length > 0) {
          const current = queue.shift();
          const connections = [];
          if (current.hasAttribute('data-connected-to')) connections.push(current.getAttribute('data-connected-to'));
          if (current.hasAttribute('data-connected-from-left')) connections.push(current.getAttribute('data-connected-from-left'));
          if (current.hasAttribute('data-connected-from-right')) connections.push(current.getAttribute('data-connected-from-right'));

          for (const id of connections) {
            if (!processed.has(id)) {
              const block = document.getElementById(id);
              if (block) {
                result.push(block);
                processed.add(id);
                queue.push(block);
              }
            }
          }
       }
       return result;
  };

  // מציאת הבלוק השמאלי ביותר (בהנחה שפונקציה זו קיימת ונגישה, אחרת יש לשכפל)
  const findLeftmostBlockLocal = (typeof findLeftmostBlock === 'function') ? findLeftmostBlock : function(blocks) {
      // *** Fallback/Copied Implementation Here if needed ***
       console.warn("[GroupConnect] Using local fallback for findLeftmostBlock. Ensure original is available or copy implementation.");
      if (!blocks || blocks.length === 0) return null;
      let leftmost = blocks[0];
      let leftPosition = leftmost.getBoundingClientRect().left;
      for (let i = 1; i < blocks.length; i++) {
        const position = blocks[i].getBoundingClientRect().left;
        if (position < leftPosition) {
          leftPosition = position;
          leftmost = blocks[i];
        }
      }
      return leftmost;
  };
  
  // --- פונקציות המשתמשות ביכולות של linkageimproved.js ---
  
  // הדגשת נקודות חיבור פוטנציאליות (בהנחה שהפונקציות זמינות גלובלית)
  function highlightGroupSnapPoints(sourceBlock, targetBlock, direction) {
    if (typeof clearAllHighlights === 'function') {
        clearAllHighlights(); // נקה הדגשות קודמות מכל הסוגים
    } else {
        console.warn("[GroupConnect] clearAllHighlights function not found.");
    }

    if (typeof highlightConnectionPoint !== 'function') {
         console.warn("[GroupConnect] highlightConnectionPoint function not found.");
         return;
    }
    
    // השהייה קטנה כדי לאפשר לאנימציה לעבוד כראוי
    setTimeout(() => {
        if (direction === 'left') { // מקור מתחבר לשמאל של היעד
            highlightConnectionPoint(sourceBlock, false); // נקודה ימנית במקור
            highlightConnectionPoint(targetBlock, true);  // נקודה שמאלית ביעד
        } else { // direction === 'right' - מקור מתחבר לימין של היעד
            highlightConnectionPoint(sourceBlock, true);  // נקודה שמאלית במקור
            highlightConnectionPoint(targetBlock, false); // נקודה ימנית ביעד
        }
        log(`Highlighting group snap: ${sourceBlock?.id} (${direction === 'left' ? 'R' : 'L'}) <-> ${targetBlock?.id} (${direction === 'left' ? 'L' : 'R'})`);
    }, config.highlightDelay);
  }

  // ניקוי הדגשות
  function clearGroupSnapHighlight() {
      if (typeof clearAllHighlights === 'function') {
          clearAllHighlights();
      }
      potentialSnapInfo = null; // נקה גם את המידע על הצמדה פוטנציאלית
  }
  
  // השמעת צליל הצמדה (בהנחה שהפונקציה זמינה גלובלית)
  function playGroupSnapSound() {
    if (typeof playSnapSound === 'function') {
      playSnapSound();
    } else {
      console.warn("[GroupConnect] playSnapSound function not found.");
    }
  }

  // הוספת אנימציית הצמדה (בהנחה שהפונקציה זמינה גלובלית)
  function addGroupSnapAnimation(block) {
     if (typeof addSnapEffectAnimation === 'function') {
         addSnapEffectAnimation(block);
     } else {
         console.warn("[GroupConnect] addSnapEffectAnimation function not found.");
     }
  }

  // === ליבת הלוגיקה ===

  // בדיקה אם ניתן לחבר את הקבוצה הנגררת לקבוצה/בלוק אחר
  function checkPotentialGroupSnap() {
    // בדוק אם מתבצעת גרירת קבוצה (נשען על המשתנה הגלובלי מ-linkage-group-drag-simplified.js)
    // ודא שהמשתנים הגלובליים קיימים לפני השימוש בהם
    if (typeof isGroupDragging === 'undefined' || !isGroupDragging || 
        typeof groupBlocks === 'undefined' || !groupBlocks || groupBlocks.length === 0) {
      // אם יש הדגשה קודמת, נקה אותה
      if (potentialSnapInfo) {
          clearGroupSnapHighlight();
      }
      return; 
    }

    const sourceGroupBlocks = groupBlocks; // קבל את הבלוקים מהמודול השני
    const programArea = document.getElementById('program-blocks');
    if (!programArea) return;

    const sourceLeftmost = findLeftmostBlockLocal(sourceGroupBlocks);
    const sourceRightmost = findRightmostBlock(sourceGroupBlocks);

    if (!sourceLeftmost || !sourceRightmost) {
      log("שגיאה: לא ניתן למצוא בלוקי קצה בקבוצה הנגררת.");
      return;
    }

    const sourceLeftRect = sourceLeftmost.getBoundingClientRect();
    const sourceRightRect = sourceRightmost.getBoundingClientRect();

    let bestSnapCandidate = null;
    let minDistance = config.groupConnectThreshold + 1;

    // מצא את כל הבלוקים באזור התכנות שאינם חלק מהקבוצה הנגררת
    const potentialTargetElements = Array.from(programArea.querySelectorAll('.block-container'))
                                       .filter(el => !sourceGroupBlocks.some(sourceBlock => sourceBlock.id === el.id));

    const processedTargetLeaders = new Set(); // למנוע בדיקה כפולה של אותה קבוצת יעד

    for (const potentialElement of potentialTargetElements) {
        // מצא את ה'מוביל' של הקבוצה אליה שייך האלמנט (יכול להיות האלמנט עצמו אם הוא בודד)
        const potentialGroup = findConnectedBlocksLocal(potentialElement);
        const targetLeader = findLeftmostBlockLocal(potentialGroup);

        if (!targetLeader || processedTargetLeaders.has(targetLeader.id)) {
            continue; // דלג אם אין מוביל או שכבר בדקנו קבוצה זו
        }
        processedTargetLeaders.add(targetLeader.id);

        const targetGroupBlocks = potentialGroup; // כל הבלוקים בקבוצת היעד
        const targetLeftmost = targetLeader; // המוביל הוא השמאלי ביותר
        const targetRightmost = findRightmostBlock(targetGroupBlocks);
        
        if (!targetLeftmost || !targetRightmost) continue; // צריך את שני הקצוות

        const targetLeftRect = targetLeftmost.getBoundingClientRect();
        const targetRightRect = targetRightmost.getBoundingClientRect();

        // --- בדיקה: חיבור צד ימין של המקור לשמאל של היעד ---
        // ודא שהצד השמאלי של היעד פנוי
        if (!targetLeftmost.hasAttribute('data-connected-from-left')) {
            const distance = Math.abs(sourceRightRect.right - targetLeftRect.left);
            const verticalMidSource = sourceRightRect.top + sourceRightRect.height / 2;
            const verticalMidTarget = targetLeftRect.top + targetLeftRect.height / 2;
            const verticalDiff = Math.abs(verticalMidSource - verticalMidTarget);
            
            // בדיקת חפיפה אנכית מינימלית
            const topOverlap = Math.max(sourceRightRect.top, targetLeftRect.top);
            const bottomOverlap = Math.min(sourceRightRect.bottom, targetLeftRect.bottom);
            const verticalOverlap = Math.max(0, bottomOverlap - topOverlap);
            const minHeightReq = Math.min(sourceRightRect.height, targetLeftRect.height) * config.verticalOverlapReq;

            if (distance < minDistance && verticalDiff < config.verticalAlignThreshold && verticalOverlap >= minHeightReq) {
                 minDistance = distance;
                 bestSnapCandidate = {
                     sourceBlock: sourceRightmost, // הבלוק הימני בקבוצה הנגררת
                     targetBlock: targetLeftmost,  // הבלוק השמאלי בקבוצת היעד
                     direction: 'left' // המקור מתחבר לשמאל היעד
                 };
            }
        }

        // --- בדיקה: חיבור צד שמאל של המקור לימין של היעד ---
        // ודא שהצד הימני של היעד פנוי
        if (!targetRightmost.hasAttribute('data-connected-from-right')) {
            const distance = Math.abs(sourceLeftRect.left - targetRightRect.right);
            const verticalMidSource = sourceLeftRect.top + sourceLeftRect.height / 2;
            const verticalMidTarget = targetRightRect.top + targetRightRect.height / 2;
            const verticalDiff = Math.abs(verticalMidSource - verticalMidTarget);

            // בדיקת חפיפה אנכית מינימלית
            const topOverlap = Math.max(sourceLeftRect.top, targetRightRect.top);
            const bottomOverlap = Math.min(sourceLeftRect.bottom, targetRightRect.bottom);
            const verticalOverlap = Math.max(0, bottomOverlap - topOverlap);
            const minHeightReq = Math.min(sourceLeftRect.height, targetRightRect.height) * config.verticalOverlapReq;

            if (distance < minDistance && verticalDiff < config.verticalAlignThreshold && verticalOverlap >= minHeightReq) {
                minDistance = distance;
                bestSnapCandidate = {
                    sourceBlock: sourceLeftmost,   // הבלוק השמאלי בקבוצה הנגררת
                    targetBlock: targetRightmost,  // הבלוק הימני בקבוצת היעד
                    direction: 'right' // המקור מתחבר לימין היעד
                };
            }
        }
    }

    // עדכון הדגשה ומצב
    if (bestSnapCandidate && minDistance <= config.groupConnectThreshold) {
        if (!potentialSnapInfo || 
            potentialSnapInfo.sourceBlock.id !== bestSnapCandidate.sourceBlock.id ||
            potentialSnapInfo.targetBlock.id !== bestSnapCandidate.targetBlock.id) 
        {
            log(`זיהוי הצמדת קבוצה פוטנציאלית: ${bestSnapCandidate.sourceBlock.id} -> ${bestSnapCandidate.targetBlock.id} (כיוון ביעד: ${bestSnapCandidate.direction})`, bestSnapCandidate);
            highlightGroupSnapPoints(bestSnapCandidate.sourceBlock, bestSnapCandidate.targetBlock, bestSnapCandidate.direction);
            potentialSnapInfo = bestSnapCandidate;
        }
    } else {
        if (potentialSnapInfo) {
            log("ביטול הצמדת קבוצה פוטנציאלית - מחוץ לטווח");
            clearGroupSnapHighlight(); // מנקה גם את potentialSnapInfo
        }
    }
  }

  // ביצוע ההצמדה בפועל של הקבוצות
  function performActualGroupSnap() {
    if (!potentialSnapInfo) {
      log("אין הצמדה לביצוע.");
      return false;
    }
    
    // ודא שהמשתנים הגלובליים מהמודול השני עדיין רלוונטיים
     if (typeof isGroupDragging === 'undefined' || !isGroupDragging || 
        typeof groupBlocks === 'undefined' || !groupBlocks || groupBlocks.length === 0 ||
        typeof startPositions === 'undefined' || !startPositions || startPositions.length !== groupBlocks.length) {
        console.error("[GroupConnect] שגיאה: נתוני גרירת קבוצה אינם זמינים או לא תקינים בעת ניסיון הצמדה.");
        clearGroupSnapHighlight();
        return false; 
    }

    const { sourceBlock: connectingSourceBlock, targetBlock: connectingTargetBlock, direction } = potentialSnapInfo;
    const sourceGroup = groupBlocks; // כל הבלוקים בקבוצה הנגררת
    const originalStartPositions = startPositions; // מיקומים התחלתיים מהמודול השני
    
    log(`ביצוע הצמדת קבוצה: ${connectingSourceBlock.id} -> ${connectingTargetBlock.id} (כיוון ${direction})`);

    try {
        const sourceRect = connectingSourceBlock.getBoundingClientRect();
        const targetRect = connectingTargetBlock.getBoundingClientRect();
        const programArea = document.getElementById('program-blocks');
        const areaRect = programArea.getBoundingClientRect();

        // מצא את המיקום ההתחלתי של הבלוק הספציפי שמתחבר
        const sourceBlockStartPosition = originalStartPositions.find(p => p.id === connectingSourceBlock.id);
        if (!sourceBlockStartPosition) {
             console.error(`[GroupConnect] לא נמצא מיקום התחלתי עבור בלוק המקור המתחבר: ${connectingSourceBlock.id}`);
             clearGroupSnapHighlight();
             return false;
        }

        let targetFinalLeft, targetFinalTop; // מיקום הפינה העליונה-שמאלית הרצוי של *connectingSourceBlock*

        // חשב את המיקום הסופי של בלוק המקור המתחבר *ביחס לאזור התכנות*
        if (direction === 'left') { // חיבור לימין המקור -> לשמאל היעד
            targetFinalLeft = targetRect.left - sourceRect.width + config.puzzleLeftSocketWidth;
            targetFinalTop = targetRect.top + config.verticalCenterOffset;
            targetFinalLeft += config.horizontalFineTuningLeft; // כוונון עדין
            
        } else { // direction === 'right' - חיבור לשמאל המקור -> לימין היעד
            targetFinalLeft = targetRect.right - config.puzzleRightBulgeWidth;
            targetFinalTop = targetRect.top + config.verticalCenterOffset;
            targetFinalLeft += config.horizontalFineTuningRight; // כוונון עדין
        }
        
        // המר ל-style.left/top (כולל גלילה ו-offset של האזור)
        targetFinalLeft = targetFinalLeft - areaRect.left + programArea.scrollLeft;
        targetFinalTop = targetFinalTop - areaRect.top + programArea.scrollTop;

        // חשב את השינוי (delta) הדרוש ממיקום ההתחלה של הבלוק המתחבר
        const deltaX = targetFinalLeft - sourceBlockStartPosition.left;
        const deltaY = targetFinalTop - sourceBlockStartPosition.top;

        log(`חישוב Delta להצמדה: dX=${deltaX.toFixed(1)}, dY=${deltaY.toFixed(1)}`);

        // הזז את *כל* הבלוקים בקבוצה הנגררת לפי הדלתא שחושבה
        if (typeof updateGroupPosition === 'function') {
             // השתמש בפונקציה מהמודול השני אם היא זמינה גלובלית
             updateGroupPosition(deltaX, deltaY);
             log("הקבוצה הוזזה באמצעות updateGroupPosition גלובלי.");
        } else {
             // Fallback: הזז כל בלוק ידנית (פחות יעיל אם הפונקציה המקורית עושה יותר)
             console.warn("[GroupConnect] Using local fallback for updateGroupPosition.");
             for (let i = 0; i < sourceGroup.length; i++) {
                 const block = sourceGroup[i];
                 const startPos = originalStartPositions[i];
                 if (block && startPos) {
                    const newLeft = startPos.left + deltaX;
                    const newTop = startPos.top + deltaY;
                    // ניתן להוסיף כאן הגבלת גבולות אם נדרש
                    block.style.position = 'absolute';
                    block.style.left = `${Math.round(newLeft)}px`;
                    block.style.top = `${Math.round(newTop)}px`;
                    block.style.margin = '0';
                 }
             }
             log("הקבוצה הוזזה באמצעות לולאה מקומית.");
        }


        // קבע את מאפייני החיבור בין הבלוקים הספציפיים
        connectingSourceBlock.setAttribute('data-connected-to', connectingTargetBlock.id);
        connectingSourceBlock.setAttribute('data-connection-direction', direction);
        connectingTargetBlock.setAttribute(
            direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right',
            connectingSourceBlock.id
        );

        // הוסף קלאסים ויזואליים אם צריך (אופציונלי, linkageimproved מטפל בזה גם)
        connectingSourceBlock.classList.add('connected-block');
        connectingTargetBlock.classList.add('has-connected-block');

        // הסר סטטוס גרירה מהבלוקים (המודול השני יעשה זאת גם, אבל טוב להיות בטוח)
        sourceGroup.forEach(block => {
             block.classList.remove('group-dragging');
             block.style.zIndex = '';
        });
        
        // הפעל אפקטים
        playGroupSnapSound();
        addGroupSnapAnimation(connectingSourceBlock); 
        
        // נקה הדגשות ומצב הצמדה פוטנציאלי
        clearGroupSnapHighlight();

        // חשוב: עצם שינוי ה-attributes אמור להפעיל את ה-MutationObserver
        // ב-linkage-group-drag-simplified.js כדי שיסרוק מחדש ויסמן מנהיגים.

        log(`הצמדת קבוצה הושלמה בהצלחה.`);
        return true; // הצמדה הצליחה

    } catch (error) {
        console.error("[GroupConnect] שגיאה בביצוע הצמדת קבוצה:", error);
        clearGroupSnapHighlight();
        // נסה לנקות מאפיינים שנוספו חלקית אם אירעה שגיאה באמצע
         try {
             connectingSourceBlock?.removeAttribute('data-connected-to');
             connectingSourceBlock?.removeAttribute('data-connection-direction');
             connectingTargetBlock?.removeAttribute(direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right');
         } catch (cleanupError) {
            console.error("[GroupConnect] שגיאה בניקוי לאחר שגיאת הצמדה:", cleanupError);
         }
        return false; // הצמדה נכשלה
    }
  }


  // === מאזיני אירועים ===

  // מאזין לתזוזת עכבר - בודק אפשרות הצמדה רק אם גוררים קבוצה
  function handleGlobalMouseMove(e) {
    // בדוק אם גרירת קבוצה פעילה דרך המשתנה הגלובלי
    if (typeof isGroupDragging !== 'undefined' && isGroupDragging) {
       // בצע בדיקת הצמדה פוטנציאלית
       checkPotentialGroupSnap();
    } else {
       // אם לא גוררים קבוצה, וודא שאין הדגשת הצמדת קבוצה מיותרת
       if (potentialSnapInfo) {
           clearGroupSnapHighlight();
       }
    }
  }

  // מאזין לשחרור עכבר - מנסה לבצע הצמדה אם זוהתה אפשרות
  function handleGlobalMouseUp(e) {
     // חשוב לבדוק את isGroupDragging *לפני* שהמודול השני מאפס אותו
     const wasGroupDragging = (typeof isGroupDragging !== 'undefined' && isGroupDragging);

     if (wasGroupDragging && potentialSnapInfo) {
        // מנע התנהגות ברירת מחדל נוספת אם ביצענו הצמדה
        e.preventDefault(); 
        e.stopPropagation(); 

        const snapSuccess = performActualGroupSnap();
        if(snapSuccess) {
           // אם ההצמדה הצליחה, אולי נרצה לאותת למודול השני לא לעשות פעולות מסוימות?
           // כרגע, המודול השני ימשיך וינקה את המצב שלו, שזה בסדר.
        } else {
           // אם ההצמדה נכשלה, נקה הדגשות
           clearGroupSnapHighlight();
        }
     } else if (potentialSnapInfo) {
        // אם היה פוטנציאל הצמדה אבל הגרירה לא הייתה פעילה ברגע הקליק, נקה
        clearGroupSnapHighlight();
     }
     // בכל מקרה אחר, אין מה לעשות כאן. המודולים האחרים יטפלו.
  }

  // === אתחול המודול ===
  function initGroupConnect() {
    log("אתחול מודול חיבור קבוצות (group-connect.js)");
    
    // הוסף מאזינים גלובליים שיפעלו במקביל למאזינים של המודולים האחרים
    // חשוב להוסיף עם useCapture=true כדי לפעול לפני מאזינים אחרים שעשויים לעצור את האירוע
    // אבל זה עלול להתנגש. נתחיל בלי capture ונראה אם יש צורך.
    document.addEventListener('mousemove', handleGlobalMouseMove, false); 
    document.addEventListener('mouseup', handleGlobalMouseUp, false); 

    // ודא שהפונקציות הנדרשות מהמודולים האחרים זמינות
    if (typeof findConnectedBlocks !== 'function' || 
        typeof findLeftmostBlock !== 'function' ||
        typeof updateGroupPosition !== 'function' ||
        typeof clearAllHighlights !== 'function' ||
        typeof highlightConnectionPoint !== 'function' ||
        typeof playSnapSound !== 'function' ||
        typeof addSnapEffectAnimation !== 'function') {
           console.warn("[GroupConnect] חלק מהפונקציות מהמודולים linkageimproved.js או linkage-group-drag-simplified.js אינן זמינות גלובלית. ייתכנו בעיות תאימות או שימוש ב-fallbacks.");
    }
    
    window.groupConnectInitialized = true;
    log("מודול חיבור קבוצות אותחל בהצלחה.");
  }

  // הפעל את האתחול כשהדף נטען או מיד אם כבר נטען
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGroupConnect);
  } else {
    // ודא שהמודולים הקודמים הספיקו לטעון את המשתנים הגלובליים שלהם
    // המתנה קצרה עשויה לעזור במקרים מסוימים
    setTimeout(initGroupConnect, 50); 
  }

})();

--- END OF FILE group-connect.js --- 
