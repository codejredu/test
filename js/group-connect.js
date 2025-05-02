--- START OF FILE group-connect.js ---

// --- GROUP-CONNECT.JS v1.0.1 --- 
// מודול לחיבור קבוצות בלוקים מחוברות (גרסה מתוקנת לבדיקת אתחול)

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
  
  // מציאת כל הבלוקים המחוברים (כולל Fallback)
  const findConnectedBlocksLocal = (typeof findConnectedBlocks === 'function') ? findConnectedBlocks : function(startBlock) {
      console.warn("[GroupConnect] Using local fallback for findConnectedBlocks. Ensure original is available globally or copy implementation properly.");
      if (!startBlock || !document.getElementById(startBlock.id)) return []; // Added check if startBlock exists in DOM
      const result = [startBlock];
      const processed = new Set([startBlock.id]);
      const queue = [startBlock];
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
              } else {
                // console.warn(`[findConnectedBlocksLocal] Block with ID ${id} not found.`); // Optional: Log missing blocks
              }
            }
          }
       }
       return result;
  };

  // מציאת הבלוק השמאלי ביותר (כולל Fallback)
  const findLeftmostBlockLocal = (typeof findLeftmostBlock === 'function') ? findLeftmostBlock : function(blocks) {
      if (!blocks || blocks.length === 0) return null;
      // Fallback implementation needs check if blocks are still in DOM
      const validBlocks = blocks.filter(b => b && document.body.contains(b));
      if (validBlocks.length === 0) return null;
      
      console.warn("[GroupConnect] Using local fallback for findLeftmostBlock. Ensure original is available globally.");
      let leftmost = validBlocks[0];
      let leftPosition = leftmost.getBoundingClientRect().left;
      for (let i = 1; i < validBlocks.length; i++) {
        const position = validBlocks[i].getBoundingClientRect().left;
        if (position < leftPosition) {
          leftPosition = position;
          leftmost = validBlocks[i];
        }
      }
      return leftmost;
  };
  
  // --- פונקציות המשתמשות ביכולות של linkageimproved.js ---
  
  // הדגשת נקודות חיבור פוטנציאליות
  function highlightGroupSnapPoints(sourceBlock, targetBlock, direction) {
    if (typeof clearAllHighlights === 'function') {
        clearAllHighlights(); 
    } else {
        console.warn("[GroupConnect] clearAllHighlights function not found.");
    }

    if (typeof highlightConnectionPoint !== 'function') {
         console.warn("[GroupConnect] highlightConnectionPoint function not found.");
         return;
    }
    
    // השהייה קטנה כדי לאפשר לאנימציה לעבוד כראוי
    setTimeout(() => {
        // Check if blocks are still valid before highlighting
        if (sourceBlock && document.body.contains(sourceBlock) && targetBlock && document.body.contains(targetBlock)) {
            if (direction === 'left') { // מקור מתחבר לשמאל של היעד
                highlightConnectionPoint(sourceBlock, false); // נקודה ימנית במקור
                highlightConnectionPoint(targetBlock, true);  // נקודה שמאלית ביעד
            } else { // direction === 'right' - מקור מתחבר לימין של היעד
                highlightConnectionPoint(sourceBlock, true);  // נקודה שמאלית במקור
                highlightConnectionPoint(targetBlock, false); // נקודה ימנית ביעד
            }
            log(`Highlighting group snap: ${sourceBlock?.id} (${direction === 'left' ? 'R' : 'L'}) <-> ${targetBlock?.id} (${direction === 'left' ? 'L' : 'R'})`);
        } else {
             log("Highlighting aborted, block(s) no longer valid.");
             clearGroupSnapHighlight(); // Clear potential info if blocks disappeared
        }
    }, config.highlightDelay);
  }

  // ניקוי הדגשות
  function clearGroupSnapHighlight() {
      if (potentialSnapInfo && typeof clearAllHighlights === 'function') {
          clearAllHighlights();
      }
      potentialSnapInfo = null; // נקה גם את המידע על הצמדה פוטנציאלית
  }
  
  // השמעת צליל הצמדה
  function playGroupSnapSound() {
    if (typeof playSnapSound === 'function') {
      playSnapSound();
    } else {
      console.warn("[GroupConnect] playSnapSound function not found.");
    }
  }

  // הוספת אנימציית הצמדה
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
    if (typeof window.isGroupDragging === 'undefined' || !window.isGroupDragging || 
        typeof window.groupBlocks === 'undefined' || !window.groupBlocks || window.groupBlocks.length === 0) {
      if (potentialSnapInfo) {
          clearGroupSnapHighlight();
      }
      return; 
    }

    // --- ולידציה נוספת ---
    // ודא שהבלוקים הנגררים עדיין קיימים ב-DOM
    const currentGroupBlocks = window.groupBlocks.filter(b => b && document.body.contains(b));
    if (currentGroupBlocks.length !== window.groupBlocks.length) {
        // log("Some dragged blocks were removed from DOM, aborting snap check.");
        if (currentGroupBlocks.length === 0) {
           clearGroupSnapHighlight(); // נקה אם כל הקבוצה נעלמה
           return;
        }
        // אפשר להמשיך עם הבלוקים שנותרו, או לעצור כאן - נמשיך לעת עתה
    }
     if (currentGroupBlocks.length === 0) return; // אם אין בלוקים ולידיים, עצור


    const sourceGroupBlocks = currentGroupBlocks; // השתמש בבלוקים הוולידיים
    const programArea = document.getElementById('program-blocks');
    if (!programArea) return;

    const sourceLeftmost = findLeftmostBlockLocal(sourceGroupBlocks);
    const sourceRightmost = findRightmostBlock(sourceGroupBlocks); // findRightmostBlock צריך גם להיות עמיד

    if (!sourceLeftmost || !sourceRightmost) {
      // log("Cannot find edge blocks in the dragged group (possibly due to DOM removal).");
      return;
    }

    // ודא שבלוקי הקצה עדיין ב-DOM לפני קריאה ל-getBoundingClientRect
     if (!document.body.contains(sourceLeftmost) || !document.body.contains(sourceRightmost)) {
        log("Edge blocks of dragged group are no longer in DOM.");
        return;
     }

    const sourceLeftRect = sourceLeftmost.getBoundingClientRect();
    const sourceRightRect = sourceRightmost.getBoundingClientRect();

    let bestSnapCandidate = null;
    let minDistance = config.groupConnectThreshold + 1;

    const sourceGroupIds = new Set(sourceGroupBlocks.map(b => b.id)); // סט של ID בקבוצה הנגררת

    // מצא את כל הבלוקים באזור התכנות שאינם חלק מהקבוצה הנגררת
    const potentialTargetElements = Array.from(programArea.querySelectorAll('.block-container'))
                                       .filter(el => el && document.body.contains(el) && !sourceGroupIds.has(el.id));

    const processedTargetLeaders = new Set(); 

    for (const potentialElement of potentialTargetElements) {
        // אלמנט יכול להיעלם בין הלולאות, בדוק שוב
        if (!potentialElement || !document.body.contains(potentialElement)) continue;

        const potentialGroup = findConnectedBlocksLocal(potentialElement);
        // ודא שכל הבלוקים בקבוצה הפוטנציאלית קיימים
        const validPotentialGroup = potentialGroup.filter(b => b && document.body.contains(b));
        if(validPotentialGroup.length === 0) continue;

        const targetLeader = findLeftmostBlockLocal(validPotentialGroup);

        if (!targetLeader || processedTargetLeaders.has(targetLeader.id) || !document.body.contains(targetLeader)) {
            continue; 
        }
        processedTargetLeaders.add(targetLeader.id);

        const targetGroupBlocks = validPotentialGroup; 
        const targetLeftmost = targetLeader; 
        const targetRightmost = findRightmostBlock(targetGroupBlocks); // ודא שגם פונקציה זו עמידה
        
        if (!targetRightmost || !document.body.contains(targetRightmost)) continue; // צריך את הקצה הימני ושהוא יהיה ב-DOM

        // --- בדיקה: חיבור צד ימין של המקור לשמאל של היעד ---
        if (!targetLeftmost.hasAttribute('data-connected-from-left')) {
            const targetLeftRect = targetLeftmost.getBoundingClientRect(); // קבל רק אם צריך
            const distance = Math.abs(sourceRightRect.right - targetLeftRect.left);
            
            if (distance <= config.groupConnectThreshold) { // בדוק מרחק קודם
                 const verticalMidSource = sourceRightRect.top + sourceRightRect.height / 2;
                 const verticalMidTarget = targetLeftRect.top + targetLeftRect.height / 2;
                 const verticalDiff = Math.abs(verticalMidSource - verticalMidTarget);
                 
                 const topOverlap = Math.max(sourceRightRect.top, targetLeftRect.top);
                 const bottomOverlap = Math.min(sourceRightRect.bottom, targetLeftRect.bottom);
                 const verticalOverlap = Math.max(0, bottomOverlap - topOverlap);
                 const minHeightReq = Math.min(sourceRightRect.height, targetLeftRect.height) * config.verticalOverlapReq;

                 if (distance < minDistance && verticalDiff < config.verticalAlignThreshold && verticalOverlap >= minHeightReq) {
                      minDistance = distance;
                      bestSnapCandidate = {
                          sourceBlock: sourceRightmost, 
                          targetBlock: targetLeftmost,  
                          direction: 'left' 
                      };
                 }
            }
        }

        // --- בדיקה: חיבור צד שמאל של המקור לימין של היעד ---
        if (!targetRightmost.hasAttribute('data-connected-from-right')) {
             const targetRightRect = targetRightmost.getBoundingClientRect(); // קבל רק אם צריך
             const distance = Math.abs(sourceLeftRect.left - targetRightRect.right);

            if (distance <= config.groupConnectThreshold) { // בדוק מרחק קודם
                 const verticalMidSource = sourceLeftRect.top + sourceLeftRect.height / 2;
                 const verticalMidTarget = targetRightRect.top + targetRightRect.height / 2;
                 const verticalDiff = Math.abs(verticalMidSource - verticalMidTarget);

                 const topOverlap = Math.max(sourceLeftRect.top, targetRightRect.top);
                 const bottomOverlap = Math.min(sourceLeftRect.bottom, targetRightRect.bottom);
                 const verticalOverlap = Math.max(0, bottomOverlap - topOverlap);
                 const minHeightReq = Math.min(sourceLeftRect.height, targetRightRect.height) * config.verticalOverlapReq;

                 if (distance < minDistance && verticalDiff < config.verticalAlignThreshold && verticalOverlap >= minHeightReq) {
                    minDistance = distance;
                    bestSnapCandidate = {
                        sourceBlock: sourceLeftmost,   
                        targetBlock: targetRightmost, 
                        direction: 'right' 
                    };
                }
            }
        }
    }

    // עדכון הדגשה ומצב
    if (bestSnapCandidate && minDistance <= config.groupConnectThreshold) {
        // בדוק שהמועמד שונה מהקודם לפני הדגשה מחדש
        if (!potentialSnapInfo || 
            potentialSnapInfo.sourceBlock.id !== bestSnapCandidate.sourceBlock.id ||
            potentialSnapInfo.targetBlock.id !== bestSnapCandidate.targetBlock.id ||
            potentialSnapInfo.direction !== bestSnapCandidate.direction) 
        {
            // ודא שהבלוקים עדיין קיימים לפני ששומרים ומדגישים
            if(document.body.contains(bestSnapCandidate.sourceBlock) && document.body.contains(bestSnapCandidate.targetBlock)){
                 log(`זיהוי הצמדת קבוצה פוטנציאלית: ${bestSnapCandidate.sourceBlock.id} -> ${bestSnapCandidate.targetBlock.id} (כיוון ביעד: ${bestSnapCandidate.direction})`, bestSnapCandidate);
                 potentialSnapInfo = bestSnapCandidate; // שמור מידע *לפני* הדגשה א-סינכרונית
                 highlightGroupSnapPoints(bestSnapCandidate.sourceBlock, bestSnapCandidate.targetBlock, bestSnapCandidate.direction);
            } else {
                 log("Snap candidate blocks became invalid before highlighting.");
                 clearGroupSnapHighlight();
            }
        }
    } else {
        if (potentialSnapInfo) {
            // log("ביטול הצמדת קבוצה פוטנציאלית - מחוץ לטווח או לא נמצא מועמד");
            clearGroupSnapHighlight(); 
        }
    }
  }

  // ביצוע ההצמדה בפועל של הקבוצות
  function performActualGroupSnap() {
    if (!potentialSnapInfo) {
      log("אין הצמדה לביצוע.");
      return false;
    }
    
     // ודא שוב שהמשתנים הגלובליים והבלוקים המעורבים עדיין קיימים ותקינים
     if (typeof window.isGroupDragging === 'undefined' || !window.isGroupDragging || 
        typeof window.groupBlocks === 'undefined' || !window.groupBlocks || window.groupBlocks.length === 0 ||
        typeof window.startPositions === 'undefined' || !window.startPositions || window.startPositions.length === 0) {
        console.error("[GroupConnect] שגיאה: נתוני גרירת קבוצה אינם זמינים או לא תקינים בעת ניסיון הצמדה.");
        clearGroupSnapHighlight();
        return false; 
    }
    
    const { sourceBlock: connectingSourceBlock, targetBlock: connectingTargetBlock, direction } = potentialSnapInfo;
    
     // ודא שבלוקי החיבור עדיין ב-DOM
     if (!connectingSourceBlock || !document.body.contains(connectingSourceBlock) || !connectingTargetBlock || !document.body.contains(connectingTargetBlock)) {
          console.error("[GroupConnect] שגיאה: בלוקי החיבור אינם קיימים ב-DOM בעת ניסיון הצמדה.");
          clearGroupSnapHighlight();
          return false;
     }
     
     // ודא שהקבוצה הנגררת עדיין מכילה את בלוק המקור
     const sourceGroup = window.groupBlocks.filter(b => b && document.body.contains(b));
     if (sourceGroup.length === 0 || !sourceGroup.some(b => b.id === connectingSourceBlock.id)) {
         console.error("[GroupConnect] שגיאה: הקבוצה הנגררת אינה תקינה או אינה מכילה את בלוק המקור.");
         clearGroupSnapHighlight();
         return false;
     }
     
     // ודא שמערך המיקומים ההתחלתיים תואם באורכו לקבוצה הנוכחית (לאחר סינון)
      const originalStartPositions = window.startPositions;
     if(originalStartPositions.length !== sourceGroup.length) {
         // This might happen if blocks were added/removed during drag without updating startPositions
         console.warn("[GroupConnect] Mismatch between current group size and startPositions length. Snap might be inaccurate.");
         // Decide how to handle: abort, or try to find the specific start pos? Let's try to find it.
     }

    log(`ביצוע הצמדת קבוצה: ${connectingSourceBlock.id} -> ${connectingTargetBlock.id} (כיוון ${direction})`);

    try {
        // מצא את המיקום ההתחלתי של הבלוק הספציפי שמתחבר (מתוך המערך המקורי)
        const sourceBlockStartPosition = originalStartPositions.find(p => p.id === connectingSourceBlock.id);
        if (!sourceBlockStartPosition) {
             // זה לא אמור לקרות אם הבלוק נמצא בקבוצה, אבל נבדוק
             console.error(`[GroupConnect] לא נמצא מיקום התחלתי עבור בלוק המקור המתחבר: ${connectingSourceBlock.id}`);
             clearGroupSnapHighlight();
             return false;
        }

        const sourceRect = connectingSourceBlock.getBoundingClientRect();
        const targetRect = connectingTargetBlock.getBoundingClientRect();
        const programArea = document.getElementById('program-blocks');
        if (!programArea) throw new Error("Programming area not found."); // הוספת בדיקה
        const areaRect = programArea.getBoundingClientRect();


        let targetFinalLeft, targetFinalTop; // מיקום הפינה העליונה-שמאלית הרצוי של *connectingSourceBlock*

        // חשב את המיקום הסופי של בלוק המקור המתחבר *ביחס לאזור התכנות*
        if (direction === 'left') { // חיבור לימין המקור -> לשמאל היעד
            targetFinalLeft = targetRect.left - sourceRect.width + config.puzzleLeftSocketWidth;
            targetFinalTop = targetRect.top + config.verticalCenterOffset;
            targetFinalLeft += config.horizontalFineTuningLeft; 
        } else { // direction === 'right' - חיבור לשמאל המקור -> לימין היעד
            targetFinalLeft = targetRect.right - config.puzzleRightBulgeWidth;
            targetFinalTop = targetRect.top + config.verticalCenterOffset;
            targetFinalLeft += config.horizontalFineTuningRight;
        }
        
        // המר ל-style.left/top (כולל גלילה ו-offset של האזור)
        targetFinalLeft = targetFinalLeft - areaRect.left + programArea.scrollLeft;
        targetFinalTop = targetFinalTop - areaRect.top + programArea.scrollTop;

        // חשב את השינוי (delta) הדרוש ממיקום ההתחלה של הבלוק המתחבר
        const deltaX = targetFinalLeft - sourceBlockStartPosition.left;
        const deltaY = targetFinalTop - sourceBlockStartPosition.top;

        log(`חישוב Delta להצמדה: dX=${deltaX.toFixed(1)}, dY=${deltaY.toFixed(1)}`);

        // --- הזזת הקבוצה ---
        // נסה להשתמש בפונקציה הגלובלית אם קיימת ונדרשת
        let groupMoved = false;
        if (typeof window.updateGroupPosition === 'function') {
             try {
                // ודא שהפונקציה מצפה לאותם פרמטרים
                window.updateGroupPosition(deltaX, deltaY);
                log("הקבוצה הוזזה באמצעות updateGroupPosition גלובלי.");
                groupMoved = true;
             } catch (updateError) {
                 console.error("Error calling global updateGroupPosition:", updateError);
                 // נמשיך ל-Fallback
             }
        } 
        
        if (!groupMoved) {
             // Fallback: הזז כל בלוק ידנית (תוך שימוש במיקומים המקוריים שעדיין זמינים)
             console.warn("[GroupConnect] Using local fallback loop for updateGroupPosition.");
             for (let i = 0; i < originalStartPositions.length; i++) {
                 const startPos = originalStartPositions[i];
                 const block = document.getElementById(startPos.id); // מצא מחדש לפי ID
                 if (block && sourceGroup.some(b => b.id === startPos.id)) { // ודא שהבלוק עדיין חלק מהקבוצה הנגררת
                    const newLeft = startPos.left + deltaX;
                    const newTop = startPos.top + deltaY;
                    // ניתן להוסיף כאן הגבלת גבולות אם נדרש, אך updateGroupPosition המקורי אמור לעשות זאת
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

        // הוסף קלאסים ויזואליים אם צריך (אופציונלי)
        connectingSourceBlock.classList.add('connected-block');
        connectingTargetBlock.classList.add('has-connected-block');

        // הסר סטטוס גרירה מהבלוקים (המודול השני יעשה זאת גם)
        sourceGroup.forEach(block => {
             if(block) { // בדוק אם הבלוק עדיין קיים
                 block.classList.remove('group-dragging');
                 block.style.zIndex = ''; // אפס ZIndex
             }
        });
        
        // הפעל אפקטים
        playGroupSnapSound();
        addGroupSnapAnimation(connectingSourceBlock); 
        
        // נקה הדגשות ומצב הצמדה פוטנציאלי
        clearGroupSnapHighlight(); // זה מאפס את potentialSnapInfo

        // הפעלת סריקה מחדש של מובילים (אמור לקרות אוטומטית דרך Observer, אבל אפשר גם ידנית)
        if (typeof window.scanAndMarkLeaders === 'function') {
             // השהייה קלה כדי לאפשר ל-DOM להתעדכן לגמרי
             setTimeout(window.scanAndMarkLeaders, 50);
        }

        log(`הצמדת קבוצה הושלמה בהצלחה.`);
        return true; // הצמדה הצליחה

    } catch (error) {
        console.error("[GroupConnect] שגיאה בביצוע הצמדת קבוצה:", error);
        clearGroupSnapHighlight();
         try {
             // נקה מאפיינים שנוספו חלקית אם אירעה שגיאה
             if (connectingSourceBlock && document.body.contains(connectingSourceBlock)) {
                 connectingSourceBlock.removeAttribute('data-connected-to');
                 connectingSourceBlock.removeAttribute('data-connection-direction');
             }
             if (connectingTargetBlock && document.body.contains(connectingTargetBlock)) {
                 connectingTargetBlock.removeAttribute(direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right');
             }
         } catch (cleanupError) {
            console.error("[GroupConnect] שגיאה בניקוי לאחר שגיאת הצמדה:", cleanupError);
         }
        return false; // הצמדה נכשלה
    }
  }


  // === מאזיני אירועים ===

  function handleGlobalMouseMove(e) {
    // השתמש ב- window.isGroupDragging וכו' כדי לגשת למשתנים הגלובליים
    if (typeof window.isGroupDragging !== 'undefined' && window.isGroupDragging) {
       checkPotentialGroupSnap();
    } else {
       if (potentialSnapInfo) {
           clearGroupSnapHighlight();
       }
    }
  }

  function handleGlobalMouseUp(e) {
     // בדוק את המצב *לפני* שהמודול השני מאפס אותו
     const wasGroupDragging = (typeof window.isGroupDragging !== 'undefined' && window.isGroupDragging);
     const snapCandidateExists = potentialSnapInfo !== null; // שמור את המצב הנוכחי של המועמד

     if (wasGroupDragging && snapCandidateExists) {
        // בצע את ההצמדה *רק* אם היינו באמצע גרירת קבוצה והיה מועמד
        
        // מניעת התפשטות כדי שהמודול השני לא יבצע פעולות מיותרות או סותרות?
        // נסה להפעיל את זה אם יש התנהגות לא רצויה בסיום הגרירה
        // e.preventDefault(); 
        // e.stopPropagation(); 

        const snapSuccess = performActualGroupSnap(); // זה גם מנקה את potentialSnapInfo

        // אם ההצמדה הצליחה, המודול השני ירוץ אחרי זה ויבצע את הניקוי שלו
        // (איפוס isGroupDragging, groupBlocks וכו') - זה בסדר.
        
        if (!snapSuccess) {
           // אם ההצמדה נכשלה מסיבה כלשהי, potentialSnapInfo כבר נוקה
           // המודול השני ידאג לשחרור הבלוקים
           log("Group snap failed.");
        }
        
     } else if (snapCandidateExists) {
         // אם היה מועמד אבל לא היינו בגרירת קבוצה פעילה (נדיר, אבל אפשרי)
         clearGroupSnapHighlight();
     }
     // בכל מקרה אחר, אין מה לעשות כאן.
     // חשוב: לא לנקות כאן את potentialSnapInfo אם הגרירה לא הייתה פעילה, 
     // כי אולי המשתמש פשוט הזיז את העכבר בלי לגרור ואז לחץ.
  }

  // === אתחול המודול ===
  function initGroupConnect() {
    // הודעת אתחול ראשונה
    console.log("[GroupConnect] Attempting initGroupConnect..."); 
    
    // ודא שה-DOM מוכן מספיק (במיוחד אזור התכנות)
    const programArea = document.getElementById('program-blocks');
    if (!programArea) {
        console.error("[GroupConnect] Initialization failed: 'program-blocks' area not found. Retrying in 200ms.");
        // נסה שוב מאוחר יותר אם האזור עדיין לא נוצר
        setTimeout(initGroupConnect, 200); 
        return;
    }

    log("Initializing group connection module (group-connect.js v1.0.1)");
    
    // הוסף מאזינים גלובליים
    // הוספה ללא capture כדי לא להפריע למודולים אחרים שעשויים להשתמש ב-preventDefault/stopPropagation
    document.removeEventListener('mousemove', handleGlobalMouseMove, false); // הסר קודם למקרה של ריצה כפולה
    document.addEventListener('mousemove', handleGlobalMouseMove, false); 
    
    document.removeEventListener('mouseup', handleGlobalMouseUp, false); // הסר קודם
    document.addEventListener('mouseup', handleGlobalMouseUp, false); 

    // בדיקת זמינות פונקציות קריטיות (מודפס אזהרות אם חסר)
    checkDependencies();
    
    window.groupConnectInitialized = true;
    log("Group connection module initialized successfully.");
  }
  
  // פונקציית עזר לבדיקת תלויות
  function checkDependencies() {
      const dependencies = [
          { name: 'isGroupDragging', type: 'variable', source: 'linkage-group-drag-simplified.js' },
          { name: 'groupBlocks', type: 'variable', source: 'linkage-group-drag-simplified.js' },
          { name: 'startPositions', type: 'variable', source: 'linkage-group-drag-simplified.js' },
          // { name: 'updateGroupPosition', type: 'function', source: 'linkage-group-drag-simplified.js' }, // בדוק אם אתה מייצא אותה
          { name: 'findConnectedBlocks', type: 'function', source: 'linkage-group-drag-simplified.js' }, // בדוק אם מיוצאת
          { name: 'findLeftmostBlock', type: 'function', source: 'linkage-group-drag-simplified.js' }, // בדוק אם מיוצאת
          // { name: 'scanAndMarkLeaders', type: 'function', source: 'linkage-group-drag-simplified.js' }, // בדוק אם מיוצאת
          { name: 'clearAllHighlights', type: 'function', source: 'linkageimproved.js' },
          { name: 'highlightConnectionPoint', type: 'function', source: 'linkageimproved.js' },
          { name: 'playSnapSound', type: 'function', source: 'linkageimproved.js' },
          { name: 'addSnapEffectAnimation', type: 'function', source: 'linkageimproved.js' }
      ];
      
      let allOk = true;
      dependencies.forEach(dep => {
          const exists = (dep.type === 'function') ? (typeof window[dep.name] === 'function') : (typeof window[dep.name] !== 'undefined');
          if (!exists) {
              console.warn(`[GroupConnect] Dependency potentially missing: ${dep.type} '${dep.name}' (expected from ${dep.source}). Fallbacks or errors may occur.`);
              allOk = false;
          }
      });
      
      if(allOk) {
          log("All checked dependencies seem to be available globally.");
      }
  }

  // --- לוגיקת הפעלת האתחול ---
  
  // פונקציה להפעלת האתחול לאחר שכל הסקריפטים נטענו (בתקווה)
  function attemptInitialization() {
      // בדוק אם המודולים הקודמים סיימו את האתחול שלהם (אם הם מגדירים דגל דומה)
      if (window.groupDragInitialized && window.blockLinkageInitialized_v3_9_5) {
          initGroupConnect();
      } else {
          // אם המודולים הקודמים עדיין לא סיימו, נסה שוב עוד רגע
          // log("Waiting for other modules to initialize...");
          setTimeout(attemptInitialization, 100); // נסה שוב עוד 100ms
      }
  }

  // הפעל את ניסיון האתחול כשה-DOM מוכן, או מיד אם כבר מוכן
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attemptInitialization);
  } else {
    // DOM כבר טעון, נסה לאתחל (אולי עם השהייה קטנה כדי לאפשר לסקריפטים אחרים לסיים)
    setTimeout(attemptInitialization, 50); 
  }

})();

--- END OF FILE group-connect.js ---
