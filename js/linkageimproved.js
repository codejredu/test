// --- START OF FILE linkageimproved.js ---
// מימוש משופר - ניסיון לתקן קפיצה אחורה בהצמדה (עם הילה)

(function() {
  // משתנים גלובליים במודול
  let currentDraggedBlock = null;
  let potentialSnapTarget = null;
  let snapDirection = null; // 'left' (source to left of target) or 'right' (source to right of target)
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
      e.preventDefault(); // Allow drops from palette
    });
    // Prevent default drag behavior within the programming area itself
    // to avoid conflicts with our custom mousedown/move/up logic
    programmingArea.addEventListener('dragstart', function(e) {
        // If the dragged element is a block *inside* the programming area
        if (e.target && e.target.closest && e.target.closest('#program-blocks .block-container')) {
            console.log("Preventing default dragstart for internal block.");
            e.preventDefault();
        }
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

      // Prevent the browser's default drag behavior for this element *immediately*
      block.draggable = false; // Disable HTML5 draggable attribute temporarily

      console.log(`[MouseDown] Started for block: ${block.id}`);

      // ניתוק אוטומטי אם גוררים בלוק מחובר
      if (block.hasAttribute('data-connected-to')) {
          console.log(`[MouseDown] Block ${block.id} was connected, detaching...`);
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
      // Ensure the initial position is set correctly relative to the offset parent, including scroll
      block.style.left = (rect.left - parentRect.left + parentElement.scrollLeft) + 'px'; // הוסף scroll offset של ההורה
      block.style.top = (rect.top - parentRect.top + parentElement.scrollTop) + 'px';   // הוסף scroll offset של ההורה
      block.style.zIndex = '1001';
      block.classList.add('snap-source');
      document.body.classList.add('user-select-none');

      console.log(`[MouseDown] Initial Style: left=${block.style.left}, top=${block.style.top}`);
      e.preventDefault(); // Prevent text selection, etc.
      // e.stopPropagation(); // Might prevent conflicts, test if needed
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
  // טיפול בשחרור העכבר (עם לוגים משופרים)
  // ========================================================================
  function handleMouseUp(e) {
    // אם לא היינו בתהליך גרירה, אל תעשה כלום
    if (!isDraggingBlock || !currentDraggedBlock) {
      if (isDraggingBlock || currentDraggedBlock) cleanupAfterDrag(); // נקה אם המצב לא תקין
      return;
    }

    const blockReleased = currentDraggedBlock; // שמור הפניה
    blockReleased.draggable = true; // אפשר גרירה מובנית מחדש אם צריך

    console.log(`[MouseUp] ----- Start MouseUp for ${blockReleased.id} -----`);
    const initialStylePos = { left: blockReleased.style.left, top: blockReleased.style.top };
    console.log(`[MouseUp] Position BEFORE snap check: ${initialStylePos.left}, ${initialStylePos.top}`);

    // קרא את היעד והכיוון *לפני* הניקוי
    const targetToSnap = potentialSnapTarget;
    const directionToSnap = snapDirection;
    console.log(`[MouseUp] Snap State: Target=${targetToSnap?.id}, Direction=${directionToSnap}`);

    let snapApplied = false;
    if (targetToSnap && directionToSnap) {
      console.log(`[MouseUp] Attempting SNAP action...`);
      snapBlocks(blockReleased, targetToSnap, directionToSnap); // בצע את ההצמדה
      snapApplied = true;
      const finalStylePos = { left: blockReleased.style.left, top: blockReleased.style.top };
      console.log(`[MouseUp] Position AFTER snap action: ${finalStylePos.left}, ${finalStylePos.top}`);
      // כאן המיקום אמור להיות המיקום הסופי שהוחל על ידי snapBlocks
    } else {
      console.log(`[MouseUp] NO SNAP action taken.`);
      // אם אין הצמדה, המיקום נשאר כפי שהיה בסוף ה-mousemove
    }

    console.log(`[MouseUp] Calling cleanupAfterDrag...`);
    cleanupAfterDrag(); // נקה את המצב וההדגשות
    console.log(`[MouseUp] ----- End MouseUp for ${blockReleased.id} -----`);
    // בשלב זה, הבלוק אמור להיות במיקום הסופי שלו (או מיקום ההצמדה או המיקום החופשי)
    // אם הוא "קופץ" אחרי זה, משהו חיצוני משפיע.
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
      // console.log("[Cleanup] Starting cleanup...");
      document.body.classList.remove('user-select-none');
      if (currentDraggedBlock) {
          currentDraggedBlock.style.zIndex = '';
          currentDraggedBlock.classList.remove('snap-source');
          // console.log(`[Cleanup] Removed source styles from ${currentDraggedBlock?.id || 'unknown'}`);
      } else {
          // console.log("[Cleanup] No currentDraggedBlock to clean source styles from.");
      }
      // הסר הדגשות מכל הבלוקים
      document.querySelectorAll('.snap-target, .snap-left, .snap-right').forEach(el => {
        el.classList.remove('snap-target', 'snap-left', 'snap-right');
      });
      // console.log("[Cleanup] Removed all target highlights.");
      removeFuturePositionIndicator(); // הסר מלבן כחול

      // איפוס משתני המצב הגלובליים
      currentDraggedBlock = null;
      potentialSnapTarget = null;
      snapDirection = null;
      isDraggingBlock = false;
      // console.log("[Cleanup] Drag state reset.");
      // console.log("[Cleanup] Finished cleanup.");
  }


  // ========================================================================
  // בדיקת הצמדה והדגשה (עם לוגים ברורים להילה)
  // ========================================================================
  function checkAndHighlightSnapPossibility() {
    if (!currentDraggedBlock) return;
    // console.log("[Highlight Check] Running check..."); // Can enable for verbose logging

    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;

    const allBlocks = Array.from(programmingArea.querySelectorAll('.block-container'));
    const sourceRect = currentDraggedBlock.getBoundingClientRect();

    let bestTarget = null;
    let bestDirection = null;
    const previousPotentialTarget = potentialSnapTarget; // שמור את היעד הקודם
    potentialSnapTarget = null; // אפס את היעד הנוכחי לפני החיפוש

    for (const targetBlock of allBlocks) {
      if (targetBlock === currentDraggedBlock) continue; // אל תצמיד לעצמו
      if (!targetBlock.id) generateUniqueId(targetBlock); // ודא שיש ID

      const targetRect = targetBlock.getBoundingClientRect();
      // קורא לחישוב הכיוון (עם התחשבות ב-PIN לצורך זיהוי)
      const direction = calculateSnapDirection(sourceRect, targetRect);

      if (direction) {
          bestTarget = targetBlock;
          bestDirection = direction;
          // console.log(`[Highlight Check] Found potential target: ${bestTarget.id}, direction: ${bestDirection}`);
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

        // הצג/עדכן את המלבן הכחול (מחושב ללא PIN)
        const programRect = programmingArea.getBoundingClientRect();
        updateFuturePositionIndicator(currentDraggedBlock, potentialSnapTarget, snapDirection, programRect);

    } else {
        // 3. לא נמצא יעד חדש בבדיקה זו
        snapDirection = null; // אפס כיוון גלובלי
        removeFuturePositionIndicator(); // הסר מלבן כחול
        // אם היה יעד קודם, ההדגשה הוסרה ממנו בשלב 1.
        // console.log("[Highlight Check] No target found in this check.");
    }
     // console.log("[Highlight Check] Finished check.");
  }


  // ========================================================================
  // חישוב כיוון הצמדה אפשרי (עם PIN_SOCKET_DEPTH לזיהוי)
  // ========================================================================
  function calculateSnapDirection(sourceRect, targetRect) {
    const connectThreshold = 30; // טווח קרבה בין פין לשקע
    const minHeight = Math.min(sourceRect.height, targetRect.height);
    const requiredVerticalOverlap = minHeight * 0.5; // 50% חפיפה אנכית
    const verticalOverlap = Math.max(0, Math.min(sourceRect.bottom, targetRect.bottom) - Math.max(sourceRect.top, targetRect.top));

    if (verticalOverlap < requiredVerticalOverlap) return null;

    // בדיקה גסה של קרבה אופקית
    const centerDistX = Math.abs((sourceRect.left + sourceRect.width / 2) - (targetRect.left + targetRect.width / 2));
    const approxCombinedWidth = (sourceRect.width + targetRect.width) / 2;
    if (centerDistX > approxCombinedWidth * 0.9) return null;

    // בדיקת קרבת נקודות החיבור (עם PIN_SOCKET_DEPTH)
    const sourcePinConnectPoint = sourceRect.right - PIN_SOCKET_DEPTH / 2;
    const targetSocketConnectPoint = targetRect.left + PIN_SOCKET_DEPTH / 2;
    const rightPin_to_leftSocket_Dist = Math.abs(sourcePinConnectPoint - targetSocketConnectPoint);

    const sourceSocketConnectPoint = sourceRect.left + PIN_SOCKET_DEPTH / 2;
    const targetPinConnectPoint = targetRect.right - PIN_SOCKET_DEPTH / 2;
    const leftSocket_to_rightPin_Dist = Math.abs(sourceSocketConnectPoint - targetPinConnectPoint);

    // קביעה אם המקור משמאל או מימין ליעד
    const isSourceLeft = (sourceRect.left + sourceRect.width / 2) < (targetRect.left + targetRect.width / 2);

    // החזר כיוון אם המרחק קטן מספיק והכיוון היחסי מתאים
    if (isSourceLeft && rightPin_to_leftSocket_Dist <= connectThreshold) {
      // console.log(`Possible snap 'left' (dist=${rightPin_to_leftSocket_Dist.toFixed(1)})`);
      return 'left';
    }
    if (!isSourceLeft && leftSocket_to_rightPin_Dist <= connectThreshold) {
      // console.log(`Possible snap 'right' (dist=${leftSocket_to_rightPin_Dist.toFixed(1)})`);
      return 'right';
    }

    return null; // אין התאמה
  }


  // ========================================================================
  // ביצוע ההצמדה הפיזית (חישוב מיקום *ללא* PIN_SOCKET_DEPTH)
  // ========================================================================
  function snapBlocks(sourceBlock, targetBlock, direction) {
    console.log(`[SnapBlocks] ----- Start Snap for ${sourceBlock.id} to ${targetBlock.id} (${direction}) -----`);
    try {
      if (!sourceBlock || !targetBlock) throw new Error("Invalid block(s).");

      const sourceRect = sourceBlock.getBoundingClientRect();
      const targetRect = targetBlock.getBoundingClientRect();
      // console.log(`[SnapBlocks] Source Rect: L=${sourceRect.left.toFixed(1)}, T=${sourceRect.top.toFixed(1)}, W=${sourceRect.width.toFixed(1)}, H=${sourceRect.height.toFixed(1)}`);
      // console.log(`[SnapBlocks] Target Rect: L=${targetRect.left.toFixed(1)}, T=${targetRect.top.toFixed(1)}, R=${targetRect.right.toFixed(1)}, B=${targetRect.bottom.toFixed(1)}`);

      // מציאת ההורה למיקום יחסי (offsetParent)
      const parentElement = sourceBlock.offsetParent || document.getElementById('program-blocks');
      if (!parentElement) throw new Error("Cannot find offsetParent.");
      const parentRect = parentElement.getBoundingClientRect();
      // console.log(`[SnapBlocks] Offset Parent: ${parentElement.tagName}#${parentElement.id}, Rect: L=${parentRect.left.toFixed(1)}, T=${parentRect.top.toFixed(1)}`);
      // console.log(`[SnapBlocks] Offset Parent Scroll: scrollLeft=${parentElement.scrollLeft}, scrollTop=${parentElement.scrollTop}`);


      // חישוב מיקום רצוי ב-viewport (קצה-לקצה)
      let desiredViewportLeft, desiredViewportTop;
      desiredViewportTop = targetRect.top; // יישור עליון
      if (direction === 'left') {
        desiredViewportLeft = targetRect.left - sourceRect.width; // מקור משמאל ליעד
      } else { // 'right'
        desiredViewportLeft = targetRect.right; // מקור מימין ליעד
      }
      // console.log(`[SnapBlocks] Desired Viewport Position: Left=${desiredViewportLeft.toFixed(1)}, Top=${desiredViewportTop.toFixed(1)}`);


      // המרה לערכי style יחסיים להורה, כולל scroll
      let newLeft = desiredViewportLeft - parentRect.left + parentElement.scrollLeft;
      let newTop = desiredViewportTop - parentRect.top + parentElement.scrollTop;
      // console.log(`[SnapBlocks] Calculated Style (Raw): left=${newLeft.toFixed(1)}, top=${newTop.toFixed(1)}`);


      // הגבלת גבולות אם ההורה הוא אזור התכנות
      if (parentElement.id === 'program-blocks') {
          const maxLeft = Math.max(0, parentElement.scrollWidth - sourceRect.width);
          const maxTop = Math.max(0, parentElement.scrollHeight - sourceRect.height);
          newLeft = Math.max(0, Math.min(newLeft, maxLeft));
          newTop = Math.max(0, Math.min(newTop, maxTop));
      }
      // console.log(`[SnapBlocks] Final Style Calculation: left=${newLeft.toFixed(1)}, top=${newTop.toFixed(1)}`);


      // החלת המיקום הסופי
      const finalLeftPx = newLeft.toFixed(1) + 'px';
      const finalTopPx = newTop.toFixed(1) + 'px';
      console.log(`%c[SnapBlocks] Applying final style: left=${finalLeftPx}, top=${finalTopPx}`, 'color: green; font-weight: bold;');
      sourceBlock.style.left = finalLeftPx;
      sourceBlock.style.top = finalTopPx;


      // עדכון מאפיינים ואנימציה
      sourceBlock.setAttribute('data-connected-to', targetBlock.id);
      sourceBlock.setAttribute('data-connection-direction', direction);
      targetBlock.setAttribute(direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right', sourceBlock.id);
      sourceBlock.classList.add('connected-block');
      targetBlock.classList.add('has-connected-block');
      // console.log("[SnapBlocks] Connection attributes updated.");
      addSnapEffectAnimation(sourceBlock);

    } catch (err) {
      console.error('[SnapBlocks] Error during execution:', err);
    } finally {
      // console.log(`[SnapBlocks] ----- End Snap for ${sourceBlock.id} -----`);
    }
  }


  // ========================================================================
  // עדכון מחוון מיקום עתידי (ללא PIN_SOCKET_DEPTH)
  // ========================================================================
  function updateFuturePositionIndicator(sourceBlock, targetBlock, direction, programRect) { // programRect is viewport rect of #program-blocks
      const programmingArea = document.getElementById('program-blocks');
      if (!programmingArea) return;

      if (!futureIndicator) {
          futureIndicator = document.createElement('div');
          futureIndicator.id = 'future-position-indicator';
          futureIndicator.className = 'future-position-indicator';
          programmingArea.appendChild(futureIndicator); // Add to programming area
      }

      try {
          const sourceStyle = window.getComputedStyle(sourceBlock);
          const sourceWidth = parseFloat(sourceStyle.width);
          const sourceHeight = parseFloat(sourceStyle.height);
          const targetRect = targetBlock.getBoundingClientRect(); // Target's viewport position

          // Calculate desired viewport position (edge-to-edge)
          let desiredViewportLeft, desiredViewportTop;
          desiredViewportTop = targetRect.top;
          if (direction === 'left') {
              desiredViewportLeft = targetRect.left - sourceWidth;
          } else { // direction === 'right'
              desiredViewportLeft = targetRect.right;
          }

          // Convert to position relative to programmingArea (which is the parent of the indicator)
          const parentRect = programmingArea.getBoundingClientRect();
          let indicatorLeft = desiredViewportLeft - parentRect.left + programmingArea.scrollLeft;
          let indicatorTop = desiredViewportTop - parentRect.top + programmingArea.scrollTop;

          // Optional: Constrain indicator within bounds
          indicatorLeft = Math.max(0, indicatorLeft);
          indicatorTop = Math.max(0, indicatorTop);

          // Update indicator style
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
  // הוספת סגנונות CSS (ודא שהסגנון של .snap-target תקין)
  // ========================================================================
  function addHighlightStyles() {
    if (document.getElementById('block-connection-styles')) return;
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
        /* ודא שהסגנון הזה מוחל ולא נדרס */
        outline: 3px solid rgb(255, 210, 0) !important; /* צהוב ברור */
        outline-offset: 3px;
        box-shadow: 0 0 15px 5px rgba(255, 210, 0, 0.6) !important;
        transition: outline 0.1s ease-out, box-shadow 0.1s ease-out;
        z-index: 999 !important; /* חשוב שיהיה מתחת לנגרר (1001) */
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
      #detach-menu { position: absolute; background-color: white; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 3px 8px rgba(0,0,0,0.2); z-index: 1100; padding: 5px; font-size: 14px; min-width: 100px; }
      #detach-menu div { padding: 6px 12px; cursor: pointer; border-radius: 3px; }
      #detach-menu div:hover { background-color: #eee; }

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
