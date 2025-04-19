// --- START OF FILE linkageimproved.js ---
// מימוש משופר - תיקון הצמדה פיזית עם התחשבות בפין/שקע (Offset)

(function() {
  // משתנים גלובליים במודול
  let currentDraggedBlock = null;
  let potentialSnapTarget = null;
  let snapDirection = null;
  let isDraggingBlock = false;
  let dragOffset = { x: 0, y: 0 };
  let futureIndicator = null;

  // --- הגדרה חדשה ---
  // !!! התאם ערך זה לרוחב/עומק הפין/שקע בעיצוב ה-SVG שלך !!!
  const PIN_OFFSET = 5; // פיקסלים (ערך לדוגמה)

  // ========================================================================
  // אתחול המערכת
  // ========================================================================
  document.addEventListener('DOMContentLoaded', function() {
    addHighlightStyles();
    initProgrammingAreaListeners();
    observeNewBlocks();
    initExistingBlocks();
    initGlobalMouseListeners();
    console.log(`Block linkage system initialized (PIN_OFFSET=${PIN_OFFSET}).`);
  });

  // ========================================================================
  // אתחול מאזינים באזור התכנות
  // ========================================================================
  function initProgrammingAreaListeners() {
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) {
      console.error('Programming area (#program-blocks) not found!');
      return;
    }
    // מאפשר זריקה (drop) של בלוקים מהפלטה
    programmingArea.addEventListener('dragover', function(e) {
      e.preventDefault();
    });
  }

  // ========================================================================
  // האזנה לבלוקים חדשים
  // ========================================================================
  function observeNewBlocks() {
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1 && node.classList.contains('block-container') && node.closest('#program-blocks')) {
              if (!node.id) generateUniqueId(node); // ודא שיש ID
              addBlockDragListeners(node);
              console.log('New block observed and listeners added:', node.id);
            }
          });
        }
      });
    });
    observer.observe(programmingArea, { childList: true });
  }

  // ========================================================================
  // הוספת מאזינים לבלוקים קיימים
  // ========================================================================
  function initExistingBlocks() {
      const programmingArea = document.getElementById('program-blocks');
      if (!programmingArea) return;
      programmingArea.querySelectorAll('.block-container').forEach(block => {
          if (!block.id) generateUniqueId(block); // ודא שיש ID
          addBlockDragListeners(block);
      });
      console.log("Listeners added to existing blocks.");
  }

   // ========================================================================
  // הוספת מאזיני גרירה וקליק ימני לבלוק
  // ========================================================================
   function addBlockDragListeners(block) {
      block.removeEventListener('mousedown', handleMouseDown); // מנע כפילות
      block.addEventListener('mousedown', handleMouseDown);
      block.removeEventListener('contextmenu', handleContextMenu); // מנע כפילות
      block.addEventListener('contextmenu', handleContextMenu);
  }


  // ========================================================================
  // טיפול בלחיצת עכבר על בלוק
  // ========================================================================
  function handleMouseDown(e) {
      if (e.button !== 0 || !e.target.closest('.block-container')) return;

      const block = e.target.closest('.block-container');
      if (!block.id) generateUniqueId(block);

      currentDraggedBlock = block;
      isDraggingBlock = true;

      const rect = block.getBoundingClientRect();
      // חשוב: מיקום יחסי להורה שהוא position: relative/absolute
      const parentElement = block.offsetParent || document.getElementById('program-blocks') || document.body;
      const parentRect = parentElement.getBoundingClientRect();

      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;

      // הגדר מיקום וסגנון *לפני* תחילת הגרירה בפועל
      block.style.position = 'absolute';
      block.style.left = (rect.left - parentRect.left) + 'px';
      block.style.top = (rect.top - parentRect.top) + 'px';
      block.style.zIndex = '1001';
      block.classList.add('snap-source');
      document.body.classList.add('user-select-none'); // מנע בחירת טקסט

      console.log(`Mousedown on block: ${block.id} at (${block.style.left}, ${block.style.top}) relative to parent`);
      e.preventDefault();
  }

   // ========================================================================
  // טיפול בקליק ימני על בלוק
  // ========================================================================
    function handleContextMenu(e) {
        e.preventDefault();
        const block = e.target.closest('.block-container');
        if (block && block.hasAttribute('data-connected-to')) {
            showDetachMenu(e.clientX, e.clientY, block);
        }
    }

  // ========================================================================
  // מאזינים גלובליים
  // ========================================================================
  function initGlobalMouseListeners() {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.addEventListener('mouseleave', handleMouseLeave);
  }

  // ========================================================================
  // טיפול בתנועת העכבר
  // ========================================================================
  function handleMouseMove(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    // ההורה למיקום יחסי
    const parentElement = currentDraggedBlock.offsetParent || document.getElementById('program-blocks') || document.body;
    const parentRect = parentElement.getBoundingClientRect();

    // מיקום חדש יחסי להורה
    let newLeft = e.clientX - parentRect.left - dragOffset.x;
    let newTop = e.clientY - parentRect.top - dragOffset.y;

    // הגבלת גבולות (אם ההורה הוא אזור התכנות)
    if (parentElement.id === 'program-blocks') {
        const blockWidth = currentDraggedBlock.offsetWidth;
        const blockHeight = currentDraggedBlock.offsetHeight;
        const maxLeft = parentRect.width - blockWidth;
        const maxTop = parentRect.height - blockHeight;
        newLeft = Math.max(0, Math.min(newLeft, Math.max(0, maxLeft)));
        newTop = Math.max(0, Math.min(newTop, Math.max(0, maxTop)));
    }

    // עדכון מיקום הבלוק הנגרר
    currentDraggedBlock.style.left = newLeft + 'px';
    currentDraggedBlock.style.top = newTop + 'px';

    // בדיקת הצמדה והדגשה
    checkAndHighlightSnapPossibility();
  }

  // ========================================================================
  // טיפול בשחרור העכבר (!!! קריטי להצמדה !!!)
  // ========================================================================
  function handleMouseUp(e) {
    if (!isDraggingBlock || !currentDraggedBlock) {
        if (!isDraggingBlock) cleanupAfterDrag(); // נקה אם לא היינו בגרירה
        return;
    }

    const blockReleased = currentDraggedBlock; // שמור התייחסות לפני הניקוי
    console.log(`Mouseup: Released block ${blockReleased.id}. Checking snap...`);
    console.log(`Mouseup State: Target=${potentialSnapTarget?.id}, Direction=${snapDirection}`);

    // שמור את היעד והכיוון הנוכחיים לפני הקריאה ל-cleanup
    const targetToSnap = potentialSnapTarget;
    const directionToSnap = snapDirection;

    // בדוק אם יש יעד הצמדה תקף
    if (targetToSnap && directionToSnap) {
      console.log(`%cAttempting to SNAP ${blockReleased.id} to ${targetToSnap.id} (${directionToSnap})`, 'color: green; font-weight: bold;');
      // --- ביצוע ההצמדה הפיזית ---
      snapBlocks(blockReleased, targetToSnap, directionToSnap);
    } else {
      console.log(`%cBlock ${blockReleased.id} dropped freely. No snap target/direction.`, 'color: orange;');
      // אין הצמדה, הבלוק נשאר במיקום האחרון שלו מ-mousemove
    }

    // --- ניקוי ---
    // הניקוי יאפס את המשתנים הגלובליים ויסיר הדגשות
    console.log("Calling cleanupAfterDrag from mouseup...");
    cleanupAfterDrag();
    console.log(`Mouseup finished for block ${blockReleased.id}.`);
  }

  // ========================================================================
  // טיפול בעזיבת החלון
  // ========================================================================
  function handleMouseLeave(e) {
      // בדוק אם העכבר עזב את ה-body (ולא נכנס לאלמנט פנימי)
      if (isDraggingBlock && (!e.relatedTarget || e.relatedTarget.nodeName === 'HTML')) {
          console.warn("Mouse left window during drag, treating as mouseup.");
          handleMouseUp(e); // הפעל אותה לוגיקה של שחרור
      }
  }

  // ========================================================================
  // ניקוי אחרי גרירה
  // ========================================================================
  function cleanupAfterDrag() {
      document.body.classList.remove('user-select-none'); // אפשר בחירת טקסט מחדש
      if (currentDraggedBlock) {
          currentDraggedBlock.style.zIndex = '';
          currentDraggedBlock.classList.remove('snap-source');
          console.log(`Cleanup: Removed source styles from ${currentDraggedBlock?.id || 'unknown'}`);
      }
      // הסר הדגשות מכל הבלוקים
      document.querySelectorAll('.snap-target, .snap-left, .snap-right').forEach(el => {
        el.classList.remove('snap-target', 'snap-left', 'snap-right');
      });
      removeFuturePositionIndicator();

      // איפוס משתני המצב הגלובליים - קריטי
      currentDraggedBlock = null;
      potentialSnapTarget = null;
      snapDirection = null;
      isDraggingBlock = false;
      console.log("Cleanup: Drag state reset.");
  }

  // ========================================================================
  // בדיקת הצמדה והדגשה
  // ========================================================================
  function checkAndHighlightSnapPossibility() {
    if (!currentDraggedBlock) return;

    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;

    const allBlocks = Array.from(programmingArea.querySelectorAll('.block-container'));
    const sourceRect = currentDraggedBlock.getBoundingClientRect();

    let closestDistance = 120;
    let bestTarget = null;
    let bestDirection = null;

    const previousPotentialTarget = potentialSnapTarget;
    potentialSnapTarget = null;

    for (const targetBlock of allBlocks) {
      if (targetBlock === currentDraggedBlock) continue;
      if (!targetBlock.id) generateUniqueId(targetBlock);

      const targetRect = targetBlock.getBoundingClientRect();
      const dx = (sourceRect.left + sourceRect.width / 2) - (targetRect.left + targetRect.width / 2);
      const dy = (sourceRect.top + sourceRect.height / 2) - (targetRect.top + targetRect.height / 2);
      const centerDist = Math.sqrt(dx * dx + dy * dy);

      if (centerDist < closestDistance) {
        // חשב כיוון *עם התחשבות ב-PIN_OFFSET*
        const direction = calculateSnapDirection(sourceRect, targetRect);
        if (direction) {
            bestTarget = targetBlock;
            bestDirection = direction;
            // נמצא יעד, אפשר להפסיק לחפש (לקחת את הראשון שנמצא בטווח)
            break;
        }
      }
    }

    // עדכון הדגשות ומחוון
    if (previousPotentialTarget && previousPotentialTarget !== bestTarget) {
        previousPotentialTarget.classList.remove('snap-target', 'snap-left', 'snap-right');
    }

    if (bestTarget && bestDirection) {
        potentialSnapTarget = bestTarget;
        snapDirection = bestDirection;

        if (!potentialSnapTarget.classList.contains('snap-target')) {
            potentialSnapTarget.classList.add('snap-target');
            console.log(`Highlighting potential target: ${potentialSnapTarget.id}`);
        }
        potentialSnapTarget.classList.remove('snap-left', 'snap-right');
        potentialSnapTarget.classList.add(snapDirection === 'left' ? 'snap-left' : 'snap-right');

        // עדכון המלבן הכחול *עם PIN_OFFSET*
        const programRect = programmingArea.getBoundingClientRect();
        updateFuturePositionIndicator(currentDraggedBlock, potentialSnapTarget, snapDirection, programRect);

    } else {
        snapDirection = null;
        removeFuturePositionIndicator();
        if (previousPotentialTarget) {
             previousPotentialTarget.classList.remove('snap-target', 'snap-left', 'snap-right');
             console.log(`De-highlighting previous target: ${previousPotentialTarget.id}`);
        }
    }
  }

  // ========================================================================
  // חישוב כיוון הצמדה אפשרי (עם PIN_OFFSET)
  // ========================================================================
  function calculateSnapDirection(sourceRect, targetRect) {
    const snapThresholdHorizontal = 40 + PIN_OFFSET; // הרחבנו את הטווח כדי לפצות על הסטה
    const minHeight = Math.min(sourceRect.height, targetRect.height);
    const requiredVerticalOverlap = minHeight * 0.5; // 50% חפיפה אנכית מספיקה

    const verticalOverlap = Math.max(0, Math.min(sourceRect.bottom, targetRect.bottom) - Math.max(sourceRect.top, targetRect.top));

    if (verticalOverlap < requiredVerticalOverlap) {
        return null;
    }

    // --- חישוב מרחקים בין נקודות החיבור המשוערות ---

    // מקרה 1: source משמאל ל-target (פין ימני של source לשקע שמאלי של target)
    // נקודת חיבור source: sourceRect.right - PIN_OFFSET
    // נקודת חיבור target: targetRect.left + PIN_OFFSET
    const rightPin_to_leftSocket_Dist = Math.abs((sourceRect.right - PIN_OFFSET) - (targetRect.left + PIN_OFFSET));

    // מקרה 2: source מימין ל-target (שקע שמאלי של source לפין ימני של target)
    // נקודת חיבור source: sourceRect.left + PIN_OFFSET
    // נקודת חיבור target: targetRect.right - PIN_OFFSET
    const leftSocket_to_rightPin_Dist = Math.abs((sourceRect.left + PIN_OFFSET) - (targetRect.right - PIN_OFFSET));

    // בדיקת התאמה
    if (rightPin_to_leftSocket_Dist <= snapThresholdHorizontal) {
        // ודא שהם באמת אחד ליד השני ולא אחד מעל השני רחוק אופקית
        if (sourceRect.left < targetRect.left + targetRect.width) { // האם המקור מתחיל לפני סוף היעד
           console.log(`Possible snap 'left' (dist=${rightPin_to_leftSocket_Dist.toFixed(1)})`);
           return 'left';
        }
    }

    if (leftSocket_to_rightPin_Dist <= snapThresholdHorizontal) {
         if (targetRect.left < sourceRect.left + sourceRect.width) { // האם היעד מתחיל לפני סוף המקור
            console.log(`Possible snap 'right' (dist=${leftSocket_to_rightPin_Dist.toFixed(1)})`);
            return 'right';
         }
    }

    return null; // לא נמצאה התאמה
  }

  // ========================================================================
  // ביצוע ההצמדה הפיזית (!!! קריטי - עם PIN_OFFSET !!!)
  // ========================================================================
  function snapBlocks(sourceBlock, targetBlock, direction) {
    console.log(`%c--- Running snapBlocks (PIN_OFFSET=${PIN_OFFSET}) ---`, 'color: blue; font-weight: bold;');
    console.log(`Source: ${sourceBlock.id}, Target: ${targetBlock.id}, Direction: ${direction}`);
    try {
      if (!sourceBlock || !targetBlock) throw new Error("Invalid block(s) provided.");

      const sourceRect = sourceBlock.getBoundingClientRect(); // קבל מידות עדכניות
      const targetRect = targetBlock.getBoundingClientRect();
      const programArea = document.getElementById('program-blocks');
      if (!programArea) throw new Error("Programming area not found.");
      const programRect = programArea.getBoundingClientRect(); // מיקום ההורה

      let newLeft, newTop;

      // חישוב מיקום אנכי: יישור לפי החלק העליון (פשוט ויציב)
      newTop = targetRect.top - programRect.top;
      newTop = Math.max(0, newTop); // הגבל לגבול עליון
      console.log(`Calculated newTop: ${newTop}px (relative to program area)`);

      // חישוב מיקום אופקי עם התחשבות ב-PIN_OFFSET
      if (direction === 'left') {
        // הצמד פין ימני של source לשקע שמאלי של target
        // הקצה השמאלי של source צריך להיות: target.left - source.width + PIN_OFFSET
        // (כך שהפין (שרוחבו OFFSET) ממלא את השקע (שעומקו OFFSET))
        newLeft = targetRect.left - programRect.left - sourceRect.width + PIN_OFFSET;
        console.log(`Snap Left Calc: target.L=${targetRect.left.toFixed(1)} - prog.L=${programRect.left.toFixed(1)} - src.W=${sourceRect.width.toFixed(1)} + PIN=${PIN_OFFSET}`);
      } else { // direction === 'right'
        // הצמד שקע שמאלי של source לפין ימני של target
        // הקצה השמאלי של source צריך להיות: target.right - PIN_OFFSET
        // (כך שהשקע (שמתחיל ב-OFFSET מהקצה) מקבל את הפין (שמסתיים ב-OFFSET מהקצה))
        newLeft = targetRect.right - programRect.left - PIN_OFFSET;
        console.log(`Snap Right Calc: target.R=${targetRect.right.toFixed(1)} - prog.L=${programRect.left.toFixed(1)} - PIN=${PIN_OFFSET}`);
      }
      newLeft = Math.max(0, newLeft); // הגבל לגבול שמאלי
      console.log(`Calculated newLeft: ${newLeft}px (relative to program area)`);

      // --- החלת המיקום החדש ---
      console.log(`%cApplying style: left=${newLeft.toFixed(1)}px, top=${newTop.toFixed(1)}px to ${sourceBlock.id}`, 'color: green; font-weight: bold;');
      sourceBlock.style.left = newLeft + 'px';
      sourceBlock.style.top = newTop + 'px';

      // --- בדיקה מיידית אחרי ההחלה ---
      // השתמש ב-requestAnimationFrame כדי לתת לדפדפן הזדמנות לעבד את השינוי
      requestAnimationFrame(() => {
          const finalRect = sourceBlock.getBoundingClientRect();
          const finalStyleLeft = parseFloat(sourceBlock.style.left);
          const finalStyleTop = parseFloat(sourceBlock.style.top);
          console.log(`%cVERIFY Position after apply: Style=(${finalStyleLeft.toFixed(1)}, ${finalStyleTop.toFixed(1)}), Rect Left=${finalRect.left.toFixed(1)}`, 'color: purple;');

          // בדיקה אם המיקום שהוחל תואם לחישוב (עם סף קטן לשגיאות עיגול)
          const expectedLeftPx = newLeft;
          const actualStyleLeftPx = finalStyleLeft;
          if (Math.abs(expectedLeftPx - actualStyleLeftPx) > 1) {
              console.error(`%cStyle Left Mismatch! Expected ${expectedLeftPx.toFixed(1)}px, Applied ${actualStyleLeftPx.toFixed(1)}px`, 'color: red; font-weight: bold;');
          }
          const expectedTopPx = newTop;
          const actualStyleTopPx = finalStyleTop;
           if (Math.abs(expectedTopPx - actualStyleTopPx) > 1) {
              console.error(`%cStyle Top Mismatch! Expected ${expectedTopPx.toFixed(1)}px, Applied ${actualStyleTopPx.toFixed(1)}px`, 'color: red; font-weight: bold;');
          }

          // בדיקה ויזואלית של ההצמדה
           if (direction === 'left') {
               // הפין הימני של source צריך להיות קרוב לשקע השמאלי של target
               const sourcePinEdge = finalRect.right - PIN_OFFSET;
               const targetSocketEdge = targetRect.left + PIN_OFFSET;
               console.log(`Verify Left Snap: Source Pin (~${sourcePinEdge.toFixed(1)}) vs Target Socket (~${targetSocketEdge.toFixed(1)})`);
               if (Math.abs(sourcePinEdge - targetSocketEdge) > 2) {
                   console.warn(`%cPotential visual gap in left snap: diff=${Math.abs(sourcePinEdge - targetSocketEdge).toFixed(1)}px`, 'color: orange;');
               }
           } else {
                // השקע השמאלי של source צריך להיות קרוב לפין הימני של target
               const sourceSocketEdge = finalRect.left + PIN_OFFSET;
               const targetPinEdge = targetRect.right - PIN_OFFSET;
               console.log(`Verify Right Snap: Source Socket (~${sourceSocketEdge.toFixed(1)}) vs Target Pin (~${targetPinEdge.toFixed(1)})`);
                if (Math.abs(sourceSocketEdge - targetPinEdge) > 2) {
                   console.warn(`%cPotential visual gap in right snap: diff=${Math.abs(sourceSocketEdge - targetPinEdge).toFixed(1)}px`, 'color: orange;');
               }
           }

           console.log("%cPosition verification process completed.", 'color: purple;');
      });


      // עדכון מאפייני חיבור
      sourceBlock.setAttribute('data-connected-to', targetBlock.id);
      sourceBlock.setAttribute('data-connection-direction', direction);
      const targetConnectionAttribute = direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right';
      targetBlock.setAttribute(targetConnectionAttribute, sourceBlock.id);
      sourceBlock.classList.add('connected-block');
      targetBlock.classList.add('has-connected-block');
      console.log("Connection attributes updated.");

      // אנימציה
      addSnapEffectAnimation(sourceBlock);
      console.log("Snap animation triggered.");

    } catch (err) {
      console.error('Error during snapBlocks execution:', err);
    } finally {
      console.log(`%c--- snapBlocks Finished ---`, 'color: blue; font-weight: bold;');
    }
  }


  // ========================================================================
  // עדכון מחוון מיקום עתידי (עם PIN_OFFSET)
  // ========================================================================
  function updateFuturePositionIndicator(sourceBlock, targetBlock, direction, programRect) {
      const programmingArea = document.getElementById('program-blocks');
      if (!programmingArea) return;

      if (!futureIndicator) {
          futureIndicator = document.createElement('div');
          futureIndicator.id = 'future-position-indicator';
          futureIndicator.className = 'future-position-indicator';
          programmingArea.appendChild(futureIndicator);
      }

      try {
          // חשוב לקבל מידות עדכניות של הבלוק הנגרר
          const sourceStyle = window.getComputedStyle(sourceBlock);
          const sourceWidth = parseFloat(sourceStyle.width);
          const sourceHeight = parseFloat(sourceStyle.height);
          const targetRect = targetBlock.getBoundingClientRect();

          let indicatorLeft, indicatorTop;

          // מיקום אנכי (זהה ל-snapBlocks)
          indicatorTop = targetRect.top - programRect.top;
          indicatorTop = Math.max(0, indicatorTop);

          // מיקום אופקי (זהה ל-snapBlocks, *עם PIN_OFFSET*)
          if (direction === 'left') {
              indicatorLeft = targetRect.left - programRect.left - sourceWidth + PIN_OFFSET;
          } else { // direction === 'right'
              indicatorLeft = targetRect.right - programRect.left - PIN_OFFSET;
          }
          indicatorLeft = Math.max(0, indicatorLeft);

          // עדכון סגנון המחוון
          futureIndicator.style.position = 'absolute';
          futureIndicator.style.left = indicatorLeft + 'px';
          futureIndicator.style.top = indicatorTop + 'px';
          futureIndicator.style.width = sourceWidth + 'px';
          futureIndicator.style.height = sourceHeight + 'px';
          futureIndicator.style.display = 'block';

      } catch (err) {
          console.error('Error updating future position indicator:', err);
          removeFuturePositionIndicator();
      }
  }

  // ========================================================================
  // הסרת מחוון מיקום עתידי
  // ========================================================================
  function removeFuturePositionIndicator() {
      if (futureIndicator) {
          futureIndicator.style.display = 'none';
      }
  }

  // ========================================================================
  // ניקוי כל ההדגשות
  // ========================================================================
  function clearAllHighlights() {
       document.querySelectorAll('.snap-target, .snap-left, .snap-right').forEach(el => {
         if (!currentDraggedBlock || el !== currentDraggedBlock) {
             el.classList.remove('snap-target', 'snap-left', 'snap-right');
         }
      });
  }

  // ========================================================================
  // הוספת סגנונות CSS
  // ========================================================================
  function addHighlightStyles() {
    if (document.getElementById('block-connection-styles')) return;
    const style = document.createElement('style');
    style.id = 'block-connection-styles';
    // --- סגנונות CSS --- (זהים לקוד הקודם, הוכנסו כאן לנוחות)
    style.textContent = `
      /* הדגשת בלוק נגרר */
      .snap-source {
         box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
         transition: box-shadow 0.15s ease-out;
         cursor: grabbing !important;
      }

      /* הילה צהובה סביב בלוק יעד פוטנציאלי */
      .snap-target {
        outline: 3px solid rgba(255, 210, 0, 0.9) !important;
        outline-offset: 3px;
        box-shadow: 0 0 15px 5px rgba(255, 210, 0, 0.6) !important;
        transition: outline 0.1s ease-out, box-shadow 0.1s ease-out;
        z-index: 999 !important;
      }

      /* מלבן כחול מקווקו לציון מיקום עתידי */
      .future-position-indicator {
        position: absolute;
        border: 2px dashed rgba(0, 136, 255, 0.9);
        border-radius: 5px;
        background-color: rgba(0, 136, 255, 0.08);
        pointer-events: none;
        z-index: 998;
        opacity: 0;
        transition: opacity 0.1s ease-out, left 0.05s linear, top 0.05s linear;
        display: none;
      }
      .future-position-indicator[style*="display: block"] {
          opacity: 0.8;
      }

      /* סימון כיוון (פס צהוב בצד) - אופציונלי */
      .snap-left::before {
        content: ''; position: absolute; left: -6px; top: 15%; bottom: 15%; width: 4px;
        background-color: rgba(255, 210, 0, 0.9); border-radius: 2px; z-index: 1000;
        box-shadow: 0 0 5px 1px rgba(255, 210, 0, 0.6); transition: all 0.1s ease-out;
      }
      .snap-right::after {
        content: ''; position: absolute; right: -6px; top: 15%; bottom: 15%; width: 4px;
        background-color: rgba(255, 210, 0, 0.9); border-radius: 2px; z-index: 1000;
        box-shadow: 0 0 5px 1px rgba(255, 210, 0, 0.6); transition: all 0.1s ease-out;
      }

      /* אנימציית הצמדה */
      @keyframes snapEffect { 0% { transform: scale(1); } 50% { transform: scale(1.03); } 100% { transform: scale(1); } }
      .snap-animation { animation: snapEffect 0.2s ease-out; }

       /* אנימציית ניתוק */
      @keyframes detachEffect {
         0% { transform: translate(0, 0) rotate(0); }
         50% { transform: translate(2px, 2px) rotate(0.5deg); }
         100% { transform: translate(0, 0) rotate(0); }
      }
      .detach-animation { animation: detachEffect 0.2s ease-in-out; }

      /* סגנון תפריט ניתוק */
      #detach-menu {
        position: absolute; background-color: white; border: 1px solid #ccc;
        border-radius: 4px; box-shadow: 0 3px 8px rgba(0,0,0,0.2); z-index: 1100;
        padding: 5px; font-size: 14px; min-width: 100px;
      }
      #detach-menu div { padding: 6px 12px; cursor: pointer; border-radius: 3px; }
      #detach-menu div:hover { background-color: #eee; }

      /* כללי: למנוע בחירת טקסט בזמן גרירה */
       body.user-select-none {
           user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;
       }
    `;
    document.head.appendChild(style);
    console.log('Highlighting and animation styles added/updated.');
  }

  // ========================================================================
  // פונקציות עזר לניתוק בלוקים
  // ========================================================================
  function showDetachMenu(x, y, block) {
      removeDetachMenu();
      const menu = document.createElement('div');
      menu.id = 'detach-menu';
      menu.style.left = Math.min(x, window.innerWidth - 120) + 'px';
      menu.style.top = Math.min(y, window.innerHeight - 50) + 'px';
      const detachOption = document.createElement('div');
      detachOption.textContent = 'Detach Block';
      detachOption.onclick = () => {
          detachBlock(block);
          removeDetachMenu();
      };
      menu.appendChild(detachOption);
      document.body.appendChild(menu);
      // מאזין לסגירה בלחיצה מחוץ לתפריט
      setTimeout(() => { // השהיה קטנה למנוע סגירה מיידית
        document.addEventListener('click', closeMenuOutside, { capture: true, once: true });
      }, 50);
  }

  function closeMenuOutside(e) {
      const menu = document.getElementById('detach-menu');
      if (menu && !menu.contains(e.target)) { // רק אם הקליק מחוץ לתפריט
          removeDetachMenu();
      } else if (menu) { // אם הקליק בתוך התפריט, הוסף מאזין מחדש
           document.addEventListener('click', closeMenuOutside, { capture: true, once: true });
      }
  }

  function removeDetachMenu() {
      const menu = document.getElementById('detach-menu');
      if (menu) {
          document.removeEventListener('click', closeMenuOutside, { capture: true }); // הסר מאזין גלובלי
          menu.remove();
      }
  }

  function detachBlock(blockToDetach) {
      if (!blockToDetach || !blockToDetach.hasAttribute('data-connected-to')) return;

      const connectedToId = blockToDetach.getAttribute('data-connected-to');
      const connectionDirection = blockToDetach.getAttribute('data-connection-direction');
      const connectedBlock = document.getElementById(connectedToId);

      console.log(`Detaching block ${blockToDetach.id} from ${connectedToId}`);

      // הסרת מאפייני חיבור מהבלוק המנותק
      blockToDetach.removeAttribute('data-connected-to');
      blockToDetach.removeAttribute('data-connection-direction');
      blockToDetach.classList.remove('connected-block');

      // הסרת מאפייני חיבור מהבלוק שהיה מחובר אליו
      if (connectedBlock) {
          const attributeToRemove = connectionDirection === 'left' ? 'data-connected-from-left' : 'data-connected-from-right';
          connectedBlock.removeAttribute(attributeToRemove);
          // הסר קלאס כללי רק אם אין לו חיבורים אחרים
          if (!connectedBlock.hasAttribute('data-connected-from-left') && !connectedBlock.hasAttribute('data-connected-from-right')) {
              connectedBlock.classList.remove('has-connected-block');
          }
          console.log(`Removed connection attribute from target ${connectedToId}`);
      } else {
          console.warn(`Target block with ID ${connectedToId} not found during detach.`);
      }

      addDetachEffectAnimation(blockToDetach); // אנימציית ניתוק

      // הזזה קטנה להמחשת הניתוק
      const currentLeft = parseFloat(blockToDetach.style.left) || 0;
      const currentTop = parseFloat(blockToDetach.style.top) || 0;
      blockToDetach.style.left = (currentLeft + 15) + 'px';
      blockToDetach.style.top = (currentTop + 15) + 'px';
      console.log(`Moved detached block ${blockToDetach.id} slightly`);

      removeDetachMenu(); // סגור תפריט אם פתוח
  }

  // ========================================================================
  // פונקציות עזר לאנימציה
  // ========================================================================
  function addSnapEffectAnimation(block) {
      block.classList.remove('snap-animation');
      void block.offsetWidth; // Force reflow
      block.classList.add('snap-animation');
      block.addEventListener('animationend', () => block.classList.remove('snap-animation'), { once: true });
  }

  function addDetachEffectAnimation(block) {
      block.classList.remove('detach-animation');
      void block.offsetWidth; // Force reflow
      block.classList.add('detach-animation');
      block.addEventListener('animationend', () => block.classList.remove('detach-animation'), { once: true });
  }

  // ========================================================================
  // יצירת ID ייחודי
  // ========================================================================
  function generateUniqueId(block) {
      let newId;
      if (window.crypto && window.crypto.randomUUID) {
          newId = `block-${crypto.randomUUID()}`;
      } else {
          newId = 'block-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
      }
      block.id = newId;
      // console.log("Generated unique ID:", block.id); // אפשר להדליק לדיבאג
      return block.id;
  }

})();
// --- END OF FILE linkageimproved.js ---
