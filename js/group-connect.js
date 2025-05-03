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
    horizontalFineTuningRight: -9,
    
    // צבעים מותאמים לחיבור קבוצות
    groupSnapColors: {
      source: '#FF6B35',  // כתום
      target: '#4A90E2'   // כחול
    }
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

  // פונקציה חדשה ליצירת מחוונים עם צבעים מותאמים
  function createColoredHighlight(block, isLeftPoint, color) {
    // נסה קודם להסיר הדגשות קיימות
    const existingHighlights = block.querySelectorAll('.connection-highlight');
    existingHighlights.forEach(el => el.remove());
    
    // צור אלמנט הדגשה חדש
    const highlight = document.createElement('div');
    highlight.className = 'connection-highlight';
    
    // הגדר את הסגנון של ההדגשה
    highlight.style.position = 'absolute';
    highlight.style.width = '12px';
    highlight.style.height = '12px';
    highlight.style.borderRadius = '50%';
    highlight.style.backgroundColor = color;
    highlight.style.border = '2px solid white';
    highlight.style.boxShadow = '0 0 8px ' + color;
    highlight.style.zIndex = '1000';
    highlight.style.opacity = '0';
    highlight.style.transition = 'opacity 0.3s ease-in-out';
    
    // מיקום ההדגשה
    if (isLeftPoint) {
      highlight.style.left = '-6px';
    } else {
      highlight.style.right = '-6px';
    }
    highlight.style.top = '50%';
    highlight.style.transform = 'translateY(-50%)';
    
    // הוסף את ההדגשה לבלוק
    block.style.position = 'relative';
    block.appendChild(highlight);
    
    // הצג את ההדגשה עם אנימציה
    setTimeout(() => {
      highlight.style.opacity = '1';
    }, 50);
    
    return highlight;
  }
  
  // --- פונקציות המשתמשות ביכולות של linkageimproved.js ---
  
  // הדגשת נקודות חיבור פוטנציאליות - גרסה מעודכנת עם צבעים מותאמים
  function highlightGroupSnapPoints(sourceBlock, targetBlock, direction) {
    // נקה את כל ההדגשות הקיימות
    if (typeof clearAllHighlights === 'function') {
      clearAllHighlights();
    }
    
    // הסר הדגשות צבעוניות קודמות
    document.querySelectorAll('.connection-highlight').forEach(el => el.remove());
    
    setTimeout(() => {
      if (sourceBlock && document.body.contains(sourceBlock) && 
          targetBlock && document.body.contains(targetBlock)) {
        
        // השתמש בצבעים מותאמים
        const sourceColor = config.groupSnapColors.source;
        const targetColor = config.groupSnapColors.target;
        
        if (direction === 'left') {
          // מקור מתחבר לשמאל של היעד
          createColoredHighlight(sourceBlock, false, sourceColor);  // נקודה ימנית במקור בכתום
          createColoredHighlight(targetBlock, true, targetColor);   // נקודה שמאלית ביעד בכחול
        } else {
          // מקור מתחבר לימין של היעד
          createColoredHighlight(sourceBlock, true, sourceColor);   // נקודה שמאלית במקור בכתום
          createColoredHighlight(targetBlock, false, targetColor);  // נקודה ימנית ביעד בכחול
        }
        
        log(`Highlighting group snap with custom colors: ${sourceBlock?.id} -> ${targetBlock?.id}`);
      }
    }, config.highlightDelay);
  }

  // ניקוי הדגשות - גרסה מעודכנת
  function clearGroupSnapHighlight() {
    // נקה הדגשות רגילות
    if (potentialSnapInfo && typeof clearAllHighlights === 'function') {
      clearAllHighlights();
    }
    
    // נקה הדגשות צבעוניות
    document.querySelectorAll('.connection-highlight').forEach(el => el.remove());
    
    potentialSnapInfo = null;
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
