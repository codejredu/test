// --- START OF FILE linkageimproved.js ---
// מימוש משופר - תיקון סופי להצמדה פיזית - חישוב מיקום משופר

(function() {
  // ... (כל המשתנים הגלובליים וההגדרות כמו קודם) ...
  let currentDraggedBlock = null;
  let potentialSnapTarget = null;
  let snapDirection = null;
  let isDraggingBlock = false;
  let dragOffset = { x: 0, y: 0 };
  let futureIndicator = null;
  const PIN_SOCKET_DEPTH = 5; // <--- התאם אם צריך!

  // ... (כל פונקציות האתחול והמאזינים כמו קודם) ...
  document.addEventListener('DOMContentLoaded', function() {
    addHighlightStyles();
    initProgrammingAreaListeners();
    observeNewBlocks();
    initExistingBlocks();
    initGlobalMouseListeners();
    console.log(`Block linkage system initialized (PIN_SOCKET_DEPTH=${PIN_SOCKET_DEPTH}).`);
  });

  function initProgrammingAreaListeners() { /* ... כמו קודם ... */ }
  function observeNewBlocks() { /* ... כמו קודם ... */ }
  function initExistingBlocks() { /* ... כמו קודם ... */ }
  function addBlockDragListeners(block) { /* ... כמו קודם ... */ }
  function handleMouseDown(e) { /* ... כמו קודם ... */ }
  function handleContextMenu(e) { /* ... כמו קודם ... */ }
  function initGlobalMouseListeners() { /* ... כמו קודם ... */ }
  function handleMouseMove(e) { /* ... כמו קודם ... */ }
  function handleMouseUp(e) { /* ... כמו קודם ... */ }
  function handleMouseLeave(e) { /* ... כמו קודם ... */ }
  function cleanupAfterDrag() { /* ... כמו קודם ... */ }
  function checkAndHighlightSnapPossibility() { /* ... כמו קודם ... */ }
  function calculateSnapDirection(sourceRect, targetRect) { /* ... כמו קודם ... */ }


  // ========================================================================
  // ביצוע ההצמדה הפיזית (!!! קריטי - חישוב מיקום משופר !!!)
  // ========================================================================
  function snapBlocks(sourceBlock, targetBlock, direction) {
    console.log(`%c--- Running snapBlocks ---`, 'color: blue; font-weight: bold;');
    console.log(`Source: ${sourceBlock.id}, Target: ${targetBlock.id}, Direction: ${direction}`);
    try {
      if (!sourceBlock || !targetBlock) throw new Error("Invalid block(s) provided.");

      const sourceRect = sourceBlock.getBoundingClientRect(); // מידות נוכחיות של הבלוק הנגרר
      const targetRect = targetBlock.getBoundingClientRect(); // מיקום נוכחי של היעד (viewport)

      // --- שלב 1: חשב את המיקום *הרצוי* של הפינה השמאלית-עליונה של sourceBlock ב-viewport ---
      let desiredViewportLeft, desiredViewportTop;

      // מיקום אנכי רצוי (viewport): יישור לפי החלק העליון של היעד
      desiredViewportTop = targetRect.top;

      // מיקום אופקי רצוי (viewport): יישור קצה-לקצה (ללא התחשבות ב-PIN כאן)
      if (direction === 'left') {
        // מקם את source משמאל ל-target
        desiredViewportLeft = targetRect.left - sourceRect.width;
      } else { // direction === 'right'
        // מקם את source מימין ל-target
        desiredViewportLeft = targetRect.right;
      }
      console.log(`Desired Viewport Position: Left=${desiredViewportLeft.toFixed(1)}, Top=${desiredViewportTop.toFixed(1)}`);


      // --- שלב 2: מצא את ה-offsetParent ואת המיקום שלו ב-viewport ---
      const parentElement = sourceBlock.offsetParent || document.getElementById('program-blocks'); // ברירת מחדל ליתר ביטחון
      if (!parentElement) throw new Error("Cannot find offsetParent for positioning.");
      const parentRect = parentElement.getBoundingClientRect();
      console.log(`Offset Parent: ${parentElement.tagName}#${parentElement.id}, Viewport Rect: L=${parentRect.left.toFixed(1)}, T=${parentRect.top.toFixed(1)}`);


      // --- שלב 3: חשב את ערכי style.left ו-style.top הנדרשים (יחסית ל-offsetParent) ---
      // כדי להגיע למיקום ה-viewport הרצוי
      let newLeft = desiredViewportLeft - parentRect.left;
      let newTop = desiredViewportTop - parentRect.top;

      // הוספת scroll offset אם ה-offsetParent ניתן לגלילה (פחות סביר במקרה זה, אבל ליתר ביטחון)
      newLeft += parentElement.scrollLeft;
      newTop += parentElement.scrollTop;

      console.log(`Calculated Style (relative to offsetParent): left=${newLeft.toFixed(1)}px, top=${newTop.toFixed(1)}px`);


      // --- שלב 4: הגבל את המיקום לגבולות ה-offsetParent (אם הוא אזור התכנות) ---
      if (parentElement.id === 'program-blocks') {
          // שימוש ב-clientWidth/Height כדי להתעלם מגבולות/פדינג של ההורה אם box-sizing הוא content-box
          const maxLeft = Math.max(0, parentElement.clientWidth - sourceRect.width);
          const maxTop = Math.max(0, parentElement.clientHeight - sourceRect.height);
          const initialNewLeft = newLeft;
          const initialNewTop = newTop;
          newLeft = Math.max(0, Math.min(newLeft, maxLeft));
          newTop = Math.max(0, Math.min(newTop, maxTop));
          if (newLeft !== initialNewLeft || newTop !== initialNewTop) {
              console.warn(`Position constrained within program-blocks: Was (${initialNewLeft.toFixed(1)},${initialNewTop.toFixed(1)}), Now (${newLeft.toFixed(1)},${newTop.toFixed(1)})`);
          }
      }


      // --- שלב 5: החלת המיקום החדש ---
      console.log(`%cApplying style: left=${newLeft.toFixed(1)}px, top=${newTop.toFixed(1)}px to ${sourceBlock.id}`, 'color: green; font-weight: bold;');
      sourceBlock.style.left = newLeft + 'px';
      sourceBlock.style.top = newTop + 'px';


      // --- שלב 6: בדיקת מיקום אחרי החלה (אסינכרוני) ---
      requestAnimationFrame(() => {
          try {
            const finalRect = sourceBlock.getBoundingClientRect();
            const finalStyleLeft = parseFloat(sourceBlock.style.left);
            const finalStyleTop = parseFloat(sourceBlock.style.top);
            const finalViewportLeft = finalRect.left;
            const finalViewportTop = finalRect.top;
            console.log(`%cVERIFY Position after apply: Style=(${finalStyleLeft.toFixed(1)}, ${finalStyleTop.toFixed(1)}), Final Viewport=(${finalViewportLeft.toFixed(1)}, ${finalViewportTop.toFixed(1)})`, 'color: purple;');

            // בדוק אם המיקום הסופי ב-viewport קרוב למיקום הרצוי שחישבנו
            if (Math.abs(desiredViewportLeft - finalViewportLeft) > 2 || Math.abs(desiredViewportTop - finalViewportTop) > 2) {
              console.error(`%cViewport Position Mismatch! Expected (${desiredViewportLeft.toFixed(1)}, ${desiredViewportTop.toFixed(1)}), Final (${finalViewportLeft.toFixed(1)}, ${finalViewportTop.toFixed(1)})`, 'color: red; font-weight: bold;');
            } else {
              console.log(`%cViewport position verified successfully.`, 'color: purple;');
            }
          } catch(verificationError) {
              console.error("Error during position verification:", verificationError);
          }
      });


      // --- שלב 7: עדכון מאפייני חיבור ואנימציה ---
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
  // עדכון מחוון מיקום עתידי (צריך לחשב באותה שיטה כמו snapBlocks)
  // ========================================================================
  function updateFuturePositionIndicator(sourceBlock, targetBlock, direction, programRect) {
      const programmingArea = document.getElementById('program-blocks');
      if (!programmingArea) return;

      if (!futureIndicator) {
          futureIndicator = document.createElement('div');
          futureIndicator.id = 'future-position-indicator';
          futureIndicator.className = 'future-position-indicator';
          programmingArea.appendChild(futureIndicator); // הוסף לאזור התכנות
      }

      try {
          const sourceStyle = window.getComputedStyle(sourceBlock);
          const sourceWidth = parseFloat(sourceStyle.width);
          const sourceHeight = parseFloat(sourceStyle.height);
          const targetRect = targetBlock.getBoundingClientRect(); // מיקום היעד ב-viewport

          // חישוב מיקום רצוי ב-viewport (כמו ב-snapBlocks)
          let desiredViewportLeft, desiredViewportTop;
          desiredViewportTop = targetRect.top;
          if (direction === 'left') {
              desiredViewportLeft = targetRect.left - sourceWidth;
          } else { // direction === 'right'
              desiredViewportLeft = targetRect.right;
          }

          // המרה למיקום יחסי ל-programmingArea (שצפוי להיות ה-offsetParent של המחוון)
          const parentRect = programmingArea.getBoundingClientRect();
          let indicatorLeft = desiredViewportLeft - parentRect.left + programmingArea.scrollLeft;
          let indicatorTop = desiredViewportTop - parentRect.top + programmingArea.scrollTop;

          // הגבלת גבולות (אופציונלי למחוון)
          indicatorLeft = Math.max(0, indicatorLeft);
          indicatorTop = Math.max(0, indicatorTop);

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

  // ... (שאר הפונקציות: removeFuturePositionIndicator, clearAllHighlights, addHighlightStyles, detach, animations, generateUniqueId - כמו קודם) ...
  function removeFuturePositionIndicator() { /* ... כמו קודם ... */ }
  function clearAllHighlights() { /* ... כמו קודם ... */ }
  function addHighlightStyles() { /* ... כמו קודם ... */ }
  function showDetachMenu(x, y, block) { /* ... כמו קודם ... */ }
  function closeMenuOutside(e) { /* ... כמו קודם ... */ }
  function removeDetachMenu() { /* ... כמו קודם ... */ }
  function detachBlock(blockToDetach, animate = true) { /* ... כמו קודם ... */ }
  function addSnapEffectAnimation(block) { /* ... כמו קודם ... */ }
  function addDetachEffectAnimation(block) { /* ... כמו קודם ... */ }
  function generateUniqueId(block) { /* ... כמו קודם ... */ }


})();
// --- END OF FILE linkageimproved.js ---
