// --- START OF FILE linkageimproved.js ---
// מימוש משופר - החזרת ההילה הצהובה + הצמדה תקינה

(function() {
  // משתנים גלובליים במודול
  let currentDraggedBlock = null;
  let potentialSnapTarget = null;
  let snapDirection = null;
  let isDraggingBlock = false;
  let dragOffset = { x: 0, y: 0 };
  let futureIndicator = null;

  // עומק/רוחב הפין/שקע לצורך זיהוי קרבה בלבד
  const PIN_SOCKET_DEPTH = 5; // <--- התאם אם צריך!

  // ========================================================================
  // אתחול המערכת
  // ========================================================================
  document.addEventListener('DOMContentLoaded', function() {
    addHighlightStyles(); // הוסף סגנונות CSS
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
              // console.log('New block observed and listeners added:', node.id);
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

      // ניתוק אוטומטי אם גוררים בלוק מחובר
      if (block.hasAttribute('data-connected-to')) {
          console.log(`Block ${block.id} was connected, detaching before drag...`);
          detachBlock(block, false); // נתק בלי אנימציה
      }

      currentDraggedBlock = block;
      isDraggingBlock = true;

      const rect = block.getBoundingClientRect();
      const parentElement = block.offsetParent || document.getElementById('program-blocks') || document.body;
      const parentRect = parentElement.getBoundingClientRect();

      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;

      // הגדר מיקום וסגנון
      block.style.position = 'absolute';
      block.style.left = (rect.left - parentRect.left + parentElement.scrollLeft) + 'px'; // הוסף scroll offset של ההורה
      block.style.top = (rect.top - parentRect.top + parentElement.scrollTop) + 'px';   // הוסף scroll offset של ההורה
      block.style.zIndex = '1001';
      block.classList.add('snap-source');
      document.body.classList.add('user-select-none');

      // console.log(`Mousedown on block: ${block.id} at (${block.style.left}, ${block.style.top})`);
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

    const parentElement = currentDraggedBlock.offsetParent || document.getElementById('program-blocks') || document.body;
    const parentRect = parentElement.getBoundingClientRect();

    // מיקום חדש יחסי לפינה השמאלית-עליונה של ה-offsetParent, כולל התחשבות בגלילה שלו
    let newLeft = e.clientX - parentRect.left - dragOffset.x + parentElement.scrollLeft;
    let newTop = e.clientY - parentRect.top - dragOffset.y + parentElement.scrollTop;

    // הגבלת גבולות (אם ההורה הוא אזור התכנות)
    if (parentElement.id === 'program-blocks') {
        const blockWidth = currentDraggedBlock.offsetWidth;
        const blockHeight = currentDraggedBlock.offsetHeight;
        // השתמש ב-scrollWidth/Height כדי לקבל את הגודל המלא כולל התוכן שנגלל החוצה
        const maxLeft = Math.max(0, parentElement.scrollWidth - blockWidth);
        const maxTop = Math.max(0, parentElement.scrollHeight - blockHeight);
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));
    }

    currentDraggedBlock.style.left = newLeft + 'px';
    currentDraggedBlock.style.top = newTop + 'px';

    checkAndHighlightSnapPossibility(); // בדוק הצמדה והדגשה
  }

  // ========================================================================
  // טיפול בשחרור העכבר
  // ========================================================================
  function handleMouseUp(e) {
    if (!isDraggingBlock || !currentDraggedBlock) {
      if (isDraggingBlock || currentDraggedBlock) cleanupAfterDrag();
      return;
    }

    const blockReleased = currentDraggedBlock;
    // console.log(`Mouseup: Released block ${blockReleased.id}. Checking snap...`);

    // קרא את היעד והכיוון *לפני* הניקוי
    const targetToSnap = potentialSnapTarget;
    const directionToSnap = snapDirection;
    // console.log(`Mouseup State Before Cleanup: Target=${targetToSnap?.id}, Direction=${directionToSnap}`);

    if (targetToSnap && directionToSnap) {
      console.log(`%cSNAP Action: Snapping ${blockReleased.id} to ${targetToSnap.id} (${directionToSnap})`, 'color: green; font-weight: bold;');
      snapBlocks(blockReleased, targetToSnap, directionToSnap); // בצע הצמדה
    } else {
      // console.log(`%cNO SNAP Action: Block ${blockReleased.id} dropped freely.`, 'color: orange;');
    }

    // console.log("Calling cleanupAfterDrag from mouseup...");
    cleanupAfterDrag(); // נקה תמיד בסוף
    // console.log(`Mouseup finished for block ${blockReleased.id}.`);
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
          // console.log(`Cleanup: Removed source styles from ${currentDraggedBlock?.id || 'unknown'}`);
      }
      // הסר הדגשות מכל הבלוקים - זה המקום הנכון להסיר הכל
      document.querySelectorAll('.snap-target, .snap-left, .snap-right').forEach(el => {
        el.classList.remove('snap-target', 'snap-left', 'snap-right');
      });
      // console.log("Cleanup: Removed all target highlights.");
      removeFuturePositionIndicator(); // הסר מלבן כחול

      // איפוס משתני המצב הגלובליים
      currentDraggedBlock = null;
      potentialSnapTarget = null;
      snapDirection = null;
      isDraggingBlock = false;
      // console.log("Cleanup: Drag state reset.");
  }

  // ========================================================================
  // בדיקת הצמדה והדגשה (עם לוגים מפורטים להילה)
  // ========================================================================
  function checkAndHighlightSnapPossibility() {
    if (!currentDraggedBlock) return;

    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;

    const allBlocks = Array.from(programmingArea.querySelectorAll('.block-container'));
    const sourceRect = currentDraggedBlock.getBoundingClientRect();

    let bestTarget = null;
    let bestDirection = null;

    const previousPotentialTarget = potentialSnapTarget; // שמור את היעד הקודם
    potentialSnapTarget = null; // אפס את היעד הנוכחי לפני החיפוש

    for (const targetBlock of allBlocks) {
      if (targetBlock === currentDraggedBlock) continue;
      if (!targetBlock.id) generateUniqueId(targetBlock);

      const targetRect = targetBlock.getBoundingClientRect();
      const direction = calculateSnapDirection(sourceRect, targetRect); // קורא לחישוב הכיוון

      if (direction) {
          bestTarget = targetBlock;
          bestDirection = direction;
          break; // מצאנו התאמה, עצור חיפוש
      }
    }

    // --- ניהול הדגשות ---

    // 1. אם היעד החדש *שונה* מהיעד הקודם, הסר הדגשה מהקודם (אם היה)
    if (previousPotentialTarget && previousPotentialTarget !== bestTarget) {
        console.log(`%c[Highlight Check] De-highlighting PREVIOUS target: ${previousPotentialTarget.id}`, 'color: #aaa;');
        previousPotentialTarget.classList.remove('snap-target', 'snap-left', 'snap-right');
    }

    // 2. אם מצאנו יעד *חדש* (או שהוא אותו יעד כמו קודם)
    if (bestTarget) {
        potentialSnapTarget = bestTarget; // עדכן את היעד הגלובלי
        snapDirection = bestDirection;    // עדכן את הכיוון הגלובלי

        // הוסף הדגשה ליעד הנוכחי (אם היא לא קיימת כבר)
        if (!bestTarget.classList.contains('snap-target')) {
            console.log(`%c[Highlight Check] Highlighting NEW or SAME target: ${bestTarget.id}`, 'color: orange; font-weight: bold;');
            bestTarget.classList.add('snap-target');
        } else {
             // console.log(`[Highlight Check] Target ${bestTarget.id} already highlighted.`);
        }
        // עדכן/הוסף את סימון הכיוון (תמיד)
        bestTarget.classList.remove('snap-left', 'snap-right'); // נקה כיוון קודם ליתר ביטחון
        bestTarget.classList.add(snapDirection === 'left' ? 'snap-left' : 'snap-right');

        // הצג/עדכן את המלבן הכחול
        const programRect = programmingArea.getBoundingClientRect();
        updateFuturePositionIndicator(currentDraggedBlock, potentialSnapTarget, snapDirection, programRect);

    } else {
        // 3. לא נמצא יעד חדש בבדיקה זו
        snapDirection = null; // אפס כיוון גלובלי
        removeFuturePositionIndicator(); // הסר מלבן כחול
        // אם היה יעד קודם, ההדגשה הוסרה ממנו בשלב 1.
        // console.log("[Highlight Check] No target found in this check.");
    }
  }


  // ========================================================================
  // חישוב כיוון הצמדה אפשרי (עם PIN_SOCKET_DEPTH)
  // ========================================================================
  function calculateSnapDirection(sourceRect, targetRect) {
    const connectThreshold = 30;
    const minHeight = Math.min(sourceRect.height, targetRect.height);
    const requiredVerticalOverlap = minHeight * 0.5; // 50% חפיפה
    const verticalOverlap = Math.max(0, Math.min(sourceRect.bottom, targetRect.bottom) - Math.max(sourceRect.top, targetRect.top));

    if (verticalOverlap < requiredVerticalOverlap) return null;

    const centerDistX = Math.abs((sourceRect.left + sourceRect.width / 2) - (targetRect.left + targetRect.width / 2));
    const approxCombinedWidth = (sourceRect.width + targetRect.width) / 2;
    if (centerDistX > approxCombinedWidth * 0.9) return null; // שפרנו קצת את הבדיקה הגסה

    const sourcePinConnectPoint = sourceRect.right - PIN_SOCKET_DEPTH / 2;
    const targetSocketConnectPoint = targetRect.left + PIN_SOCKET_DEPTH / 2;
    const rightPin_to_leftSocket_Dist = Math.abs(sourcePinConnectPoint - targetSocketConnectPoint);

    const sourceSocketConnectPoint = sourceRect.left + PIN_SOCKET_DEPTH / 2;
    const targetPinConnectPoint = targetRect.right - PIN_SOCKET_DEPTH / 2;
    const leftSocket_to_rightPin_Dist = Math.abs(sourceSocketConnectPoint - targetPinConnectPoint);

    const isSourceLeft = (sourceRect.left + sourceRect.width / 2) < (targetRect.left + targetRect.width / 2);

    if (isSourceLeft && rightPin_to_leftSocket_Dist <= connectThreshold) {
      // console.log(`Possible snap 'left' (dist=${rightPin_to_leftSocket_Dist.toFixed(1)})`);
      return 'left';
    }

    if (!isSourceLeft && leftSocket_to_rightPin_Dist <= connectThreshold) {
      // console.log(`Possible snap 'right' (dist=${leftSocket_to_rightPin_Dist.toFixed(1)})`);
      return 'right';
    }

    return null;
  }

  // ========================================================================
  // ביצוע ההצמדה הפיזית (חישוב מיקום *ללא* PIN_SOCKET_DEPTH)
  // ========================================================================
  function snapBlocks(sourceBlock, targetBlock, direction) {
    // console.log(`%c--- Running snapBlocks ---`, 'color: blue; font-weight: bold;');
    // console.log(`Source: ${sourceBlock.id}, Target: ${targetBlock.id}, Direction: ${direction}`);
    try {
      if (!sourceBlock || !targetBlock) throw new Error("Invalid block(s) provided.");

      const sourceRect = sourceBlock.getBoundingClientRect();
      const targetRect = targetBlock.getBoundingClientRect();
      const parentElement = sourceBlock.offsetParent || document.getElementById('program-blocks');
      if (!parentElement) throw new Error("Cannot find offsetParent for positioning.");
      const parentRect = parentElement.getBoundingClientRect();

      // חישוב מיקום רצוי ב-viewport
      let desiredViewportLeft, desiredViewportTop;
      desiredViewportTop = targetRect.top;
      if (direction === 'left') {
        desiredViewportLeft = targetRect.left - sourceRect.width;
      } else {
        desiredViewportLeft = targetRect.right;
      }
      // console.log(`Desired Viewport Position: Left=${desiredViewportLeft.toFixed(1)}, Top=${desiredViewportTop.toFixed(1)}`);

      // חישוב style יחסי להורה, כולל scroll
      let newLeft = desiredViewportLeft - parentRect.left + parentElement.scrollLeft;
      let newTop = desiredViewportTop - parentRect.top + parentElement.scrollTop;
      // console.log(`Calculated Style (relative to offsetParent): left=${newLeft.toFixed(1)}px, top=${newTop.toFixed(1)}px`);

      // הגבלת גבולות אם צריך
      if (parentElement.id === 'program-blocks') {
          const maxLeft = Math.max(0, parentElement.scrollWidth - sourceRect.width);
          const maxTop = Math.max(0, parentElement.scrollHeight - sourceRect.height);
          newLeft = Math.max(0, Math.min(newLeft, maxLeft));
          newTop = Math.max(0, Math.min(newTop, maxTop));
      }

      // החלת המיקום
      // console.log(`%cApplying style: left=${newLeft.toFixed(1)}px, top=${newTop.toFixed(1)}px to ${sourceBlock.id}`, 'color: green; font-weight: bold;');
      sourceBlock.style.left = newLeft + 'px';
      sourceBlock.style.top = newTop + 'px';

      // בדיקה אסינכרונית (אופציונלי, אפשר להסיר אם גורם לרעש)
      /*
      requestAnimationFrame(() => {
          try {
            // ... (קוד הבדיקה) ...
          } catch(verificationError) { console.error("Error during position verification:", verificationError); }
      });
      */

      // עדכון מאפייני חיבור ואנימציה
      sourceBlock.setAttribute('data-connected-to', targetBlock.id);
      sourceBlock.setAttribute('data-connection-direction', direction);
      const targetConnectionAttribute = direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right';
      targetBlock.setAttribute(targetConnectionAttribute, sourceBlock.id);
      sourceBlock.classList.add('connected-block');
      targetBlock.classList.add('has-connected-block');
      addSnapEffectAnimation(sourceBlock);

    } catch (err) {
      console.error('Error during snapBlocks execution:', err);
    } /* finally {
      console.log(`%c--- snapBlocks Finished ---`, 'color: blue; font-weight: bold;');
    } */
  }


  // ========================================================================
  // עדכון מחוון מיקום עתידי (ללא PIN_SOCKET_DEPTH)
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
          const targetRect = targetBlock.getBoundingClientRect(); // מיקום היעד ב-viewport

          // חישוב מיקום רצוי ב-viewport (כמו ב-snapBlocks)
          let desiredViewportLeft, desiredViewportTop;
          desiredViewportTop = targetRect.top;
          if (direction === 'left') {
              desiredViewportLeft = targetRect.left - sourceWidth;
          } else {
              desiredViewportLeft = targetRect.right;
          }

          // המרה למיקום יחסי ל-programmingArea
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
          // console.error('Error updating future position indicator:', err);
          removeFuturePositionIndicator(); // הסתר במקרה של שגיאה
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
  // ניקוי כל ההדגשות - **מתבצע רק ב-cleanupAfterDrag**
  // ========================================================================
  // function clearAllHighlights() { ... הפונקציה הזו לא נחוצה יותר ... }

  // ========================================================================
  // הוספת סגנונות CSS (ודא שהסגנון של .snap-target תקין)
  // ========================================================================
  function addHighlightStyles() {
    if (document.getElementById('block-connection-styles')) {
        // אם הסגנונות כבר קיימים, אולי נרצה רק לוודא שהם נכונים?
        // או פשוט לצאת כי הם כבר הוגדרו.
        return;
    }
    const style = document.createElement('style');
    style.id = 'block-connection-styles';
    style.textContent = `
      /* הדגשת בלוק נגרר */
      .snap-source {
         box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
         transition: box-shadow 0.15s ease-out;
         cursor: grabbing !important;
      }

      /********** הילה צהובה סביב בלוק יעד פוטנציאלי **********/
      .snap-target {
        /* נסה להסיר !important אם לא עוזר, או להגביר ספציפיות */
        outline: 3px solid rgb(255, 210, 0) !important; /* צהוב ברור */
        outline-offset: 3px;
        box-shadow: 0 0 15px 5px rgba(255, 210, 0, 0.6) !important;
        /* נסה להוסיף filter רק לבדיקה אם זה עוזר לראות משהו */
        /* filter: brightness(1.1) contrast(1.1); */
        transition: outline 0.1s ease-out, box-shadow 0.1s ease-out;
        z-index: 999 !important; /* מתחת לבלוק הנגרר (1001) */
      }
      /*********************************************************/

      /* מלבן כחול מקווקו לציון מיקום עתידי */
      .future-position-indicator {
        position: absolute; border: 2px dashed rgba(0, 136, 255, 0.9);
        border-radius: 5px; background-color: rgba(0, 136, 255, 0.08);
        pointer-events: none; z-index: 998; opacity: 0;
        transition: opacity 0.1s ease-out, left 0.05s linear, top 0.05s linear;
        display: none;
      }
      .future-position-indicator[style*="display: block"] { opacity: 0.8; }

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

      /* אנימציות */
      @keyframes snapEffect { 0% { transform: scale(1); } 50% { transform: scale(1.03); } 100% { transform: scale(1); } }
      .snap-animation { animation: snapEffect 0.2s ease-out; }
      @keyframes detachEffect { 0% { transform: translate(0, 0) rotate(0); } 50% { transform: translate(2px, 2px) rotate(0.5deg); } 100% { transform: translate(0, 0) rotate(0); } }
      .detach-animation { animation: detachEffect 0.2s ease-in-out; }

      /* תפריט ניתוק */
      #detach-menu { /* ... כמו קודם ... */ }
      #detach-menu div { /* ... כמו קודם ... */ }
      #detach-menu div:hover { /* ... כמו קודם ... */ }

      /* כללי: מניעת בחירת טקסט */
       body.user-select-none { user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; }
       /* סימון בלוקים מחוברים - מוסתר */
      .connected-block::after, .has-connected-block::before { display: none; }
    `;
    document.head.appendChild(style);
    console.log('Highlighting and animation styles added/verified.');
  }


  // ========================================================================
  // פונקציות עזר לניתוק בלוקים (Show/Hide Menu, Detach Logic)
  // ========================================================================
  function showDetachMenu(x, y, block) { /* ... כמו קודם ... */ }
  function closeMenuOutside(e) { /* ... כמו קודם ... */ }
  function removeDetachMenu() { /* ... כמו קודם ... */ }
  function detachBlock(blockToDetach, animate = true) { /* ... כמו קודם ... */ }


  // ========================================================================
  // פונקציות עזר לאנימציה
  // ========================================================================
  function addSnapEffectAnimation(block) { /* ... כמו קודם ... */ }
  function addDetachEffectAnimation(block) { /* ... כמו קודם ... */ }


  // ========================================================================
  // יצירת ID ייחודי
  // ========================================================================
  function generateUniqueId(block) { /* ... כמו קודם ... */ }

})();
// --- END OF FILE linkageimproved.js ---
