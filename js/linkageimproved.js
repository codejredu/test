// --- START OF FILE linkageimproved.js ---
// מימוש משופר - תיקון סופי להצמדה פיזית פין-לשקע

(function() {
  // משתנים גלובליים במודול
  let currentDraggedBlock = null;
  let potentialSnapTarget = null;
  let snapDirection = null; // 'left' (source to left of target) or 'right' (source to right of target)
  let isDraggingBlock = false;
  let dragOffset = { x: 0, y: 0 };
  let futureIndicator = null;

  // --- הגדרת הסטת הפין/שקע ---
  // קובע כמה רחוק הפין/שקע בולט/שקוע מהקצה השטוח של הבלוק.
  // **חשוב להתאים ערך זה לעיצוב ה-SVG שלך!**
  // ערך זה ישפיע *רק* על זיהוי הקרבה, לא על המיקום הסופי.
  const PIN_SOCKET_DEPTH = 5; // לדוגמה: 5 פיקסלים

  // ========================================================================
  // אתחול המערכת
  // ========================================================================
  document.addEventListener('DOMContentLoaded', function() {
    addHighlightStyles();
    initProgrammingAreaListeners();
    observeNewBlocks();
    initExistingBlocks();
    initGlobalMouseListeners();
    console.log(`Block linkage system initialized (PIN_SOCKET_DEPTH=${PIN_SOCKET_DEPTH}).`);
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
    programmingArea.addEventListener('dragover', function(e) {
      e.preventDefault(); // מאפשר drop
    });
    // אין צורך ב-drop listener כאן, הוא מטופל ב-script.js ליצירת בלוקים חדשים
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
              if (!node.id) generateUniqueId(node);
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
          if (!block.id) generateUniqueId(block);
          addBlockDragListeners(block);
      });
      console.log("Listeners added to existing blocks.");
  }

   // ========================================================================
  // הוספת מאזיני גרירה וקליק ימני לבלוק
  // ========================================================================
   function addBlockDragListeners(block) {
      block.removeEventListener('mousedown', handleMouseDown);
      block.addEventListener('mousedown', handleMouseDown);
      block.removeEventListener('contextmenu', handleContextMenu);
      block.addEventListener('contextmenu', handleContextMenu);
  }


  // ========================================================================
  // טיפול בלחיצת עכבר על בלוק
  // ========================================================================
  function handleMouseDown(e) {
      if (e.button !== 0 || !e.target.closest('.block-container')) return;

      const block = e.target.closest('.block-container');
      if (!block.id) generateUniqueId(block);

      // --- ניתוק אוטומטי אם גוררים בלוק שכבר מחובר ---
      if (block.hasAttribute('data-connected-to')) {
          console.log(`Block ${block.id} was connected, detaching before drag...`);
          detachBlock(block, false); // נתק בלי אנימציה או הזזה נוספת
      }
      // ------------------------------------------------

      currentDraggedBlock = block;
      isDraggingBlock = true;

      const rect = block.getBoundingClientRect();
      const parentElement = block.offsetParent || document.getElementById('program-blocks') || document.body;
      const parentRect = parentElement.getBoundingClientRect();

      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;

      // הגדר מיקום התחלתי מדויק וסגנון
      block.style.position = 'absolute';
      block.style.left = (rect.left - parentRect.left) + 'px';
      block.style.top = (rect.top - parentRect.top) + 'px';
      block.style.zIndex = '1001';
      block.classList.add('snap-source');
      document.body.classList.add('user-select-none');

      console.log(`Mousedown on block: ${block.id} at (${block.style.left}, ${block.style.top})`);
      e.preventDefault();
  }

   // ========================================================================
  // טיפול בקליק ימני על בלוק
  // ========================================================================
    function handleContextMenu(e) {
        e.preventDefault();
        const block = e.target.closest('.block-container');
        // הצג תפריט רק אם הבלוק כרגע מחובר *ל*משהו
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

    const parentElement = currentDraggedBlock.offsetParent || document.getElementById('program-blocks') || document.body;
    const parentRect = parentElement.getBoundingClientRect();

    let newLeft = e.clientX - parentRect.left - dragOffset.x;
    let newTop = e.clientY - parentRect.top - dragOffset.y;

    // הגבלת גבולות (רק אם ההורה הוא אזור התכנות)
    if (parentElement.id === 'program-blocks') {
        const blockWidth = currentDraggedBlock.offsetWidth;
        const blockHeight = currentDraggedBlock.offsetHeight;
        // חישוב נכון של גבולות מקסימליים
        const maxLeft = Math.max(0, parentRect.width - blockWidth);
        const maxTop = Math.max(0, parentRect.height - blockHeight);
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));
    }

    currentDraggedBlock.style.left = newLeft + 'px';
    currentDraggedBlock.style.top = newTop + 'px';

    checkAndHighlightSnapPossibility();
  }

  // ========================================================================
  // טיפול בשחרור העכבר (!!! קריטי להצמדה !!!)
  // ========================================================================
  function handleMouseUp(e) {
    // אם לא היינו בתהליך גרירה, אל תעשה כלום
    if (!isDraggingBlock || !currentDraggedBlock) {
      // איפוס ליתר ביטחון אם המצב לא תקין
      if (isDraggingBlock || currentDraggedBlock) cleanupAfterDrag();
      return;
    }

    const blockReleased = currentDraggedBlock; // שמור הפניה לבלוק ששוחרר
    console.log(`Mouseup: Released block ${blockReleased.id}. Checking snap...`);

    // --- חשוב: קרא את היעד והכיוון *לפני* הניקוי ---
    const targetToSnap = potentialSnapTarget;
    const directionToSnap = snapDirection;
    console.log(`Mouseup State Before Cleanup: Target=${targetToSnap?.id}, Direction=${directionToSnap}`);
    // ------------------------------------------------

    // בדוק אם יש יעד הצמדה תקף ברגע השחרור
    if (targetToSnap && directionToSnap) {
      console.log(`%cSNAP Action: Snapping ${blockReleased.id} to ${targetToSnap.id} (${directionToSnap})`, 'color: green; font-weight: bold;');
      // --- ביצוע ההצמדה הפיזית (חישוב מיקום והחלת סטייל) ---
      snapBlocks(blockReleased, targetToSnap, directionToSnap);
    } else {
      console.log(`%cNO SNAP Action: Block ${blockReleased.id} dropped freely.`, 'color: orange;');
      // אין הצמדה, הבלוק נשאר במיקום האחרון שנקבע ב-mousemove.
      // אין צורך לשנות את המיקום כאן.
    }

    // --- ניקוי ---
    // תמיד נקרא בסוף, מאפס את המשתנים הגלובליים ומסיר הדגשות
    console.log("Calling cleanupAfterDrag from mouseup...");
    cleanupAfterDrag();
    console.log(`Mouseup finished for block ${blockReleased.id}.`);
  }

  // ========================================================================
  // טיפול בעזיבת החלון
  // ========================================================================
  function handleMouseLeave(e) {
      if (isDraggingBlock && (!e.relatedTarget || e.relatedTarget.nodeName === 'HTML')) {
          console.warn("Mouse left window during drag, treating as mouseup.");
          handleMouseUp(e);
      }
  }

  // ========================================================================
  // ניקוי אחרי גרירה
  // ========================================================================
  function cleanupAfterDrag() {
      document.body.classList.remove('user-select-none');
      if (currentDraggedBlock) {
          currentDraggedBlock.style.zIndex = '';
          currentDraggedBlock.classList.remove('snap-source');
          console.log(`Cleanup: Removed source styles from ${currentDraggedBlock?.id || 'unknown'}`);
      }
      document.querySelectorAll('.snap-target, .snap-left, .snap-right').forEach(el => {
        el.classList.remove('snap-target', 'snap-left', 'snap-right');
      });
      removeFuturePositionIndicator();

      // איפוס משתני המצב הגלובליים
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

    let bestTarget = null;
    let bestDirection = null;

    // שמור את היעד הקודם כדי לדעת אם להסיר הדגשה
    const previousPotentialTarget = potentialSnapTarget;
    potentialSnapTarget = null; // אפס את היעד הנוכחי לפני החיפוש

    for (const targetBlock of allBlocks) {
      if (targetBlock === currentDraggedBlock) continue; // אל תצמיד לעצמו
      if (!targetBlock.id) generateUniqueId(targetBlock); // ודא שיש ID

      const targetRect = targetBlock.getBoundingClientRect();
      // חישוב כיוון אפשרי *עם התחשבות בעומק הפין/שקע*
      const direction = calculateSnapDirection(sourceRect, targetRect);

      if (direction) {
          bestTarget = targetBlock;
          bestDirection = direction;
          // מצאנו התאמה, אין צורך להמשיך לחפש (לוקחים את הראשון)
          break;
      }
    }

    // הסר הדגשה מהיעד הקודם אם הוא שונה מהנוכחי או אם לא נמצא יעד חדש
    if (previousPotentialTarget && previousPotentialTarget !== bestTarget) {
        previousPotentialTarget.classList.remove('snap-target', 'snap-left', 'snap-right');
         console.log(`De-highlighting previous target: ${previousPotentialTarget.id}`);
    }

    // אם מצאנו יעד חדש
    if (bestTarget && bestDirection) {
        potentialSnapTarget = bestTarget; // שמור את היעד שנמצא
        snapDirection = bestDirection;    // שמור את הכיוון שנמצא

        // הדגש את היעד החדש (אם הוא לא כבר מודגש)
        if (!potentialSnapTarget.classList.contains('snap-target')) {
            potentialSnapTarget.classList.add('snap-target');
            console.log(`Highlighting potential target: ${potentialSnapTarget.id}`);
        }
        // עדכן את סימון הכיוון
        potentialSnapTarget.classList.remove('snap-left', 'snap-right');
        potentialSnapTarget.classList.add(snapDirection === 'left' ? 'snap-left' : 'snap-right');

        // הצג את המלבן הכחול במיקום *הסופי* הצפוי (ללא PIN_SOCKET_DEPTH)
        const programRect = programmingArea.getBoundingClientRect();
        updateFuturePositionIndicator(currentDraggedBlock, potentialSnapTarget, snapDirection, programRect);

    } else {
        // לא נמצא יעד חדש, ודא שהכל נקי
        snapDirection = null; // אפס כיוון
        removeFuturePositionIndicator(); // הסר מלבן
        // אם היה יעד קודם, הוא כבר לא מודגש מהבדיקה למעלה
    }
  }

  // ========================================================================
  // חישוב כיוון הצמדה אפשרי (עם PIN_SOCKET_DEPTH)
  // ========================================================================
  function calculateSnapDirection(sourceRect, targetRect) {
    // כמה קרובים הפין והשקע צריכים להיות כדי להיחשב כמטרה
    const connectThreshold = 30; // פיקסלים
    // כמה חפיפה אנכית נדרשת (לפחות 50% מגובה הבלוק הנמוך יותר)
    const minHeight = Math.min(sourceRect.height, targetRect.height);
    const requiredVerticalOverlap = minHeight * 0.5;

    const verticalOverlap = Math.max(0, Math.min(sourceRect.bottom, targetRect.bottom) - Math.max(sourceRect.top, targetRect.top));

    if (verticalOverlap < requiredVerticalOverlap) {
        return null; // אין מספיק חפיפה אנכית
    }

    // מרחק אופקי בין מרכזים (לבדיקה גסה אם הם קרובים מספיק)
    const centerDistX = Math.abs((sourceRect.left + sourceRect.width / 2) - (targetRect.left + targetRect.width / 2));
    const approxCombinedWidth = (sourceRect.width + targetRect.width) / 2;
    if (centerDistX > approxCombinedWidth * 0.8) { // אם המרחק האופקי גדול מדי
         return null;
    }


    // בדיקה מדויקת של קרבת הפין/שקע
    // מקרה 1: source משמאל ל-target (פין ימני של source לשקע שמאלי של target)
    const sourcePinConnectPoint = sourceRect.right - PIN_SOCKET_DEPTH / 2; // מרכז הפין
    const targetSocketConnectPoint = targetRect.left + PIN_SOCKET_DEPTH / 2; // מרכז השקע
    const rightPin_to_leftSocket_Dist = Math.abs(sourcePinConnectPoint - targetSocketConnectPoint);

    // מקרה 2: source מימין ל-target (שקע שמאלי של source לפין ימני של target)
    const sourceSocketConnectPoint = sourceRect.left + PIN_SOCKET_DEPTH / 2; // מרכז השקע
    const targetPinConnectPoint = targetRect.right - PIN_SOCKET_DEPTH / 2; // מרכז הפין
    const leftSocket_to_rightPin_Dist = Math.abs(sourceSocketConnectPoint - targetPinConnectPoint);

    // האם המקור נמצא ברובו משמאל ליעד?
    const isSourceLeft = (sourceRect.left + sourceRect.width / 2) < (targetRect.left + targetRect.width / 2);

    if (isSourceLeft && rightPin_to_leftSocket_Dist <= connectThreshold) {
      console.log(`Possible snap 'left' (dist=${rightPin_to_leftSocket_Dist.toFixed(1)})`);
      return 'left';
    }

    if (!isSourceLeft && leftSocket_to_rightPin_Dist <= connectThreshold) {
      console.log(`Possible snap 'right' (dist=${leftSocket_to_rightPin_Dist.toFixed(1)})`);
      return 'right';
    }

    return null; // לא נמצאה התאמה קרובה מספיק
  }

  // ========================================================================
  // ביצוע ההצמדה הפיזית (!!! קריטי - חישוב מיקום *ללא* PIN_SOCKET_DEPTH !!!)
  // ========================================================================
  function snapBlocks(sourceBlock, targetBlock, direction) {
    console.log(`%c--- Running snapBlocks ---`, 'color: blue; font-weight: bold;');
    console.log(`Source: ${sourceBlock.id}, Target: ${targetBlock.id}, Direction: ${direction}`);
    try {
      if (!sourceBlock || !targetBlock) throw new Error("Invalid block(s) provided.");

      const sourceRect = sourceBlock.getBoundingClientRect();
      const targetRect = targetBlock.getBoundingClientRect();
      const programArea = document.getElementById('program-blocks');
      if (!programArea) throw new Error("Programming area not found.");
      const programRect = programArea.getBoundingClientRect();

      let newLeft, newTop;

      // מיקום אנכי: יישור לפי החלק העליון
      newTop = targetRect.top - programRect.top;
      newTop = Math.max(0, newTop);
      console.log(`Calculated newTop: ${newTop.toFixed(1)}px`);

      // מיקום אופקי: יישור קצה-לקצה של החלקים השטוחים
      if (direction === 'left') {
        // מקם את הקצה השמאלי של source כך שהקצה הימני שלו יתיישר עם הקצה השמאלי של target
        newLeft = targetRect.left - programRect.left - sourceRect.width;
        console.log(`Snap Left Calc: target.L=${targetRect.left.toFixed(1)} - prog.L=${programRect.left.toFixed(1)} - src.W=${sourceRect.width.toFixed(1)}`);
      } else { // direction === 'right'
        // מקם את הקצה השמאלי של source כך שיתיישר עם הקצה הימני של target
        newLeft = targetRect.right - programRect.left;
        console.log(`Snap Right Calc: target.R=${targetRect.right.toFixed(1)} - prog.L=${programRect.left.toFixed(1)}`);
      }
      newLeft = Math.max(0, newLeft); // הגבל לגבול שמאלי
      console.log(`Calculated newLeft: ${newLeft.toFixed(1)}px`);

      // --- החלת המיקום החדש ---
      console.log(`%cApplying style: left=${newLeft.toFixed(1)}px, top=${newTop.toFixed(1)}px to ${sourceBlock.id}`, 'color: green; font-weight: bold;');
      sourceBlock.style.left = newLeft + 'px';
      sourceBlock.style.top = newTop + 'px';

      // --- בדיקת מיקום אחרי החלה (אסינכרוני) ---
      requestAnimationFrame(() => {
          try {
            const finalRect = sourceBlock.getBoundingClientRect();
            const finalStyleLeft = parseFloat(sourceBlock.style.left);
            const finalStyleTop = parseFloat(sourceBlock.style.top);
            console.log(`%cVERIFY Position after apply: Style=(${finalStyleLeft.toFixed(1)}, ${finalStyleTop.toFixed(1)}), Rect Left=${finalRect.left.toFixed(1)}`, 'color: purple;');

            // בדיקה אם המיקום שהוחל תואם לחישוב (עם סף קטן)
            if (Math.abs(newLeft - finalStyleLeft) > 1 || Math.abs(newTop - finalStyleTop) > 1) {
              console.error(`%cStyle Mismatch! Expected (${newLeft.toFixed(1)}, ${newTop.toFixed(1)}), Applied (${finalStyleLeft.toFixed(1)}, ${finalStyleTop.toFixed(1)})`, 'color: red; font-weight: bold;');
            } else {
              console.log(`%cPosition verified successfully.`, 'color: purple;');
            }
          } catch(verificationError) {
              console.error("Error during position verification:", verificationError);
          }
      });

      // עדכון מאפייני חיבור
      sourceBlock.setAttribute('data-connected-to', targetBlock.id);
      sourceBlock.setAttribute('data-connection-direction', direction);
      const targetConnectionAttribute = direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right';
      targetBlock.setAttribute(targetConnectionAttribute, sourceBlock.id);
      sourceBlock.classList.add('connected-block');
      targetBlock.classList.add('has-connected-block');
      console.log("Connection attributes updated.");

      addSnapEffectAnimation(sourceBlock); // אנימציה

    } catch (err) {
      console.error('Error during snapBlocks execution:', err);
    } finally {
      console.log(`%c--- snapBlocks Finished ---`, 'color: blue; font-weight: bold;');
    }
  }


  // ========================================================================
  // עדכון מחוון מיקום עתידי (חישוב *ללא* PIN_SOCKET_DEPTH)
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
          const sourceStyle = window.getComputedStyle(sourceBlock);
          const sourceWidth = parseFloat(sourceStyle.width);
          const sourceHeight = parseFloat(sourceStyle.height);
          const targetRect = targetBlock.getBoundingClientRect();

          let indicatorLeft, indicatorTop;

          // מיקום אנכי (זהה ל-snapBlocks)
          indicatorTop = targetRect.top - programRect.top;
          indicatorTop = Math.max(0, indicatorTop);

          // מיקום אופקי (זהה ל-snapBlocks, *ללא* PIN_SOCKET_DEPTH)
          if (direction === 'left') {
              indicatorLeft = targetRect.left - programRect.left - sourceWidth;
          } else { // direction === 'right'
              indicatorLeft = targetRect.right - programRect.left;
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
       /* סימון חזותי לבלוקים מחוברים (נקודה) - מוסתר כברירת מחדל */
      .connected-block::after, .has-connected-block::before { display: none; }
    `;
    document.head.appendChild(style);
    console.log('Highlighting and animation styles added/updated.');
  }

  // ========================================================================
  // פונקציות עזר לניתוק בלוקים
  // ========================================================================
  function showDetachMenu(x, y, block) {
      removeDetachMenu(); // נקה תפריט קודם
      const menu = document.createElement('div');
      menu.id = 'detach-menu';
      // מיקום חכם יותר, מונע חריגה מהמסך
      const menuWidth = 120;
      const menuHeight = 40;
      menu.style.left = Math.min(x, window.innerWidth - menuWidth - 5) + 'px';
      menu.style.top = Math.min(y, window.innerHeight - menuHeight - 5) + 'px';
      const detachOption = document.createElement('div');
      detachOption.textContent = 'Detach Block'; // אפשר לתרגם לעברית: 'נתק בלוק'
      detachOption.onclick = (e) => {
          e.stopPropagation(); // מנע מהקליק לסגור מייד את התפריט דרך המאזין הגלובלי
          detachBlock(block); // נתק את הבלוק
          removeDetachMenu(); // סגור את התפריט
      };
      menu.appendChild(detachOption);
      document.body.appendChild(menu);
      // מאזין לסגירה בלחיצה מחוץ לתפריט
      setTimeout(() => {
        document.addEventListener('click', closeMenuOutside, { capture: true, once: true });
      }, 50);
  }

  function closeMenuOutside(e) {
      const menu = document.getElementById('detach-menu');
      if (menu && !menu.contains(e.target)) {
          removeDetachMenu();
      } else if (menu) { // אם הקליק היה בתוך התפריט, הוסף שוב את המאזין
           document.addEventListener('click', closeMenuOutside, { capture: true, once: true });
      }
  }

  function removeDetachMenu() {
      const menu = document.getElementById('detach-menu');
      if (menu) {
          document.removeEventListener('click', closeMenuOutside, { capture: true });
          menu.remove();
      }
  }

  function detachBlock(blockToDetach, animate = true) {
      if (!blockToDetach || !blockToDetach.hasAttribute('data-connected-to')) return;

      const connectedToId = blockToDetach.getAttribute('data-connected-to');
      const connectionDirection = blockToDetach.getAttribute('data-connection-direction');
      const connectedBlock = document.getElementById(connectedToId);

      console.log(`Detaching block ${blockToDetach.id} from ${connectedToId}`);

      // הסרת מאפייני חיבור
      blockToDetach.removeAttribute('data-connected-to');
      blockToDetach.removeAttribute('data-connection-direction');
      blockToDetach.classList.remove('connected-block');

      if (connectedBlock) {
          const attributeToRemove = connectionDirection === 'left' ? 'data-connected-from-left' : 'data-connected-from-right';
          connectedBlock.removeAttribute(attributeToRemove);
          if (!connectedBlock.hasAttribute('data-connected-from-left') && !connectedBlock.hasAttribute('data-connected-from-right')) {
              connectedBlock.classList.remove('has-connected-block');
          }
          console.log(`Removed connection attribute from target ${connectedToId}`);
      } else {
          console.warn(`Target block with ID ${connectedToId} not found during detach.`);
      }

      if (animate) {
          addDetachEffectAnimation(blockToDetach);
          // הזזה קטנה רק אם מפעילים אנימציה (לא בניתוק אוטומטי לפני גרירה)
          const currentLeft = parseFloat(blockToDetach.style.left) || 0;
          const currentTop = parseFloat(blockToDetach.style.top) || 0;
          blockToDetach.style.left = (currentLeft + 15) + 'px';
          blockToDetach.style.top = (currentTop + 15) + 'px';
          console.log(`Moved detached block ${blockToDetach.id} slightly`);
      }

      removeDetachMenu(); // סגור תפריט אם היה פתוח
  }

  // ========================================================================
  // פונקציות עזר לאנימציה
  // ========================================================================
  function addSnapEffectAnimation(block) {
      block.classList.remove('snap-animation'); // הסר אם קיים למקרה של קליקים מהירים
      void block.offsetWidth; // הפעל reflow מחדש
      block.classList.add('snap-animation');
      block.addEventListener('animationend', () => block.classList.remove('snap-animation'), { once: true });
  }

  function addDetachEffectAnimation(block) {
      block.classList.remove('detach-animation');
      void block.offsetWidth;
      block.classList.add('detach-animation');
      block.addEventListener('animationend', () => block.classList.remove('detach-animation'), { once: true });
  }

  // ========================================================================
  // יצירת ID ייחודי
  // ========================================================================
  function generateUniqueId(block) {
      let newId = `block-${crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).substring(2, 9)}`;
      block.id = newId;
      // console.log("Generated unique ID:", block.id);
      return block.id;
  }

})();
// --- END OF FILE linkageimproved.js ---
