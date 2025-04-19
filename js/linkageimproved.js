// --- START OF FILE linkageimproved.js ---
// מימוש משופר של מערכת חיבור בלוקים עם הילה צהובה ומלבן כחול מקווקו - תיקון הצמדה פיזית

(function() {
  // משתנים גלובליים במודול
  let currentDraggedBlock = null;    // הבלוק הנגרר כרגע
  let potentialSnapTarget = null;  // הבלוק שאליו ייתכן ונתחבר
  let snapDirection = null;        // כיוון ההצמדה האפשרי ('left' או 'right')
  let isDraggingBlock = false;       // האם מתבצעת גרירה של בלוק מתוך אזור התכנות
  let dragOffset = { x: 0, y: 0 }; // ההיסט של העכבר מפינת הבלוק הנגרר
  let futureIndicator = null;      // אלמנט המלבן הכחול המקווקו

  // ========================================================================
  // אתחול המערכת
  // ========================================================================
  document.addEventListener('DOMContentLoaded', function() {
    addHighlightStyles(); // הוספת סגנונות CSS דינמיים
    initProgrammingAreaListeners(); // האזנה לאירועים באזור התכנות
    observeNewBlocks(); // האזנה לבלוקים חדשים שנוספים
    initExistingBlocks(); // הוספת מאזינים לבלוקים שכבר קיימים
    initGlobalMouseListeners(); // מאזינים גלובליים לעכבר
    console.log("Block linkage system initialized.");
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
  // האזנה לבלוקים חדשים שנוספים לאזור התכנות
  // ========================================================================
  function observeNewBlocks() {
    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;

    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1 && node.classList.contains('block-container') && node.closest('#program-blocks')) {
              console.log('New block detected, adding listeners:', node.id || 'no-id');
              addBlockDragListeners(node);
              // ודא שיש ID לבלוק החדש לצורך התייחסות
              if (!node.id) {
                generateUniqueId(node);
              }
            }
          });
        }
      });
    });
    observer.observe(programmingArea, { childList: true });
  }

  // ========================================================================
  // הוספת מאזינים לבלוקים קיימים בטעינה ראשונית
  // ========================================================================
  function initExistingBlocks() {
      const programmingArea = document.getElementById('program-blocks');
      if (!programmingArea) return;
      programmingArea.querySelectorAll('.block-container').forEach(block => {
          // ודא שיש ID לכל בלוק קיים
          if (!block.id) {
              generateUniqueId(block);
          }
          addBlockDragListeners(block);
      });
      console.log("Listeners added to existing blocks.");
  }

  // ========================================================================
  // הוספת מאזיני גרירה (mousedown) וקליק ימני לבלוק בודד
  // ========================================================================
  function addBlockDragListeners(block) {
      block.removeEventListener('mousedown', handleMouseDown); // מניעת כפילות
      block.addEventListener('mousedown', handleMouseDown);
      block.removeEventListener('contextmenu', handleContextMenu); // מניעת כפילות
      block.addEventListener('contextmenu', handleContextMenu);
  }

  // ========================================================================
  // טיפול בלחיצת עכבר על בלוק (תחילת גרירה פוטנציאלית)
  // ========================================================================
  function handleMouseDown(e) {
      if (e.button !== 0) return;
      if (!e.target.closest('.block-container')) return;

      const block = e.target.closest('.block-container');
      // ודא שוב שיש ID
      if (!block.id) generateUniqueId(block);

      currentDraggedBlock = block;
      isDraggingBlock = true;

      const rect = block.getBoundingClientRect();
      // חשוב: המיקום צריך להיות יחסי לאזור התכנות שהוא ה-offsetParent
      const parentRect = block.offsetParent.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;

      // מיקום ראשוני (חשוב שיהיה absolute)
      block.style.position = 'absolute';
      // קבע את המיקום ההתחלתי לפי המיקום הנוכחי (למקרה שלא היה absolute קודם)
      block.style.left = (rect.left - parentRect.left) + 'px';
      block.style.top = (rect.top - parentRect.top) + 'px';

      block.style.zIndex = '1001';
      block.classList.add('snap-source');
      console.log(`Mousedown on block: ${block.id}`);
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
  // מאזינים גלובליים לתנועת ושחרור העכבר
  // ========================================================================
  function initGlobalMouseListeners() {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    // נוסיף מאזין ל-mouseleave על ה-body למקרה שהעכבר עוזב את החלון לגמרי בזמן גרירה
    document.body.addEventListener('mouseleave', handleMouseLeave);
  }

  // ========================================================================
  // טיפול בתנועת העכבר (כאשר גוררים בלוק)
  // ========================================================================
  function handleMouseMove(e) {
    if (!isDraggingBlock || !currentDraggedBlock) return;

    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return; // הגנה נוספת
    const containerRect = programmingArea.getBoundingClientRect();

    // חישוב מיקום חדש יחסית לאזור התכנות (ה-offsetParent)
    let newLeft = e.clientX - containerRect.left - dragOffset.x;
    let newTop = e.clientY - containerRect.top - dragOffset.y;

    // הגבלת המיקום לגבולות (אופציונלי, אך מומלץ)
    const blockWidth = currentDraggedBlock.offsetWidth;
    const blockHeight = currentDraggedBlock.offsetHeight;
    const maxLeft = containerRect.width - blockWidth;
    const maxTop = containerRect.height - blockHeight;
    // ודא שהגבולות לא שליליים אם האזור קטן מהבלוק
    newLeft = Math.max(0, Math.min(newLeft, Math.max(0, maxLeft)));
    newTop = Math.max(0, Math.min(newTop, Math.max(0, maxTop)));

    // עדכון מיקום הבלוק הנגרר
    currentDraggedBlock.style.left = newLeft + 'px';
    currentDraggedBlock.style.top = newTop + 'px';

    // בדוק אפשרות הצמדה והצג משוב חזותי
    checkAndHighlightSnapPossibility();
  }

  // ========================================================================
  // טיפול בשחרור העכבר (סיום גרירה)
  // ========================================================================
  function handleMouseUp(e) {
    // בדוק אם היינו בתהליך גרירה של בלוק
    if (!isDraggingBlock || !currentDraggedBlock) return;

    console.log(`Mouseup: Checking snap for ${currentDraggedBlock.id}. Potential target: ${potentialSnapTarget?.id}, Direction: ${snapDirection}`);

    // בדוק אם יש יעד הצמדה חוקי שנמצא בזמן הגרירה
    if (potentialSnapTarget && snapDirection) {
      console.log(`Attempting to snap ${currentDraggedBlock.id} to ${potentialSnapTarget.id} (${snapDirection})`);
      // --- ביצוע ההצמדה הפיזית ---
      snapBlocks(currentDraggedBlock, potentialSnapTarget, snapDirection);
      // ---------------------------
    } else {
      console.log(`Block ${currentDraggedBlock.id} dropped freely.`);
      // המיקום כבר נקבע ב-mousemove, אין צורך לשנות כלום כאן
      // אלא אם כן יש ניתוק שצריך לטפל בו (למשל, אם גררנו בלוק שהיה מחובר)
      // TODO: הוסף לוגיקה לניתוק אוטומטי אם גררנו בלוק מחובר רחוק מספיק? (כרגע לא מטופל)
    }

    // ניקוי כללי בסיום הגרירה - *חייב להתבצע אחרי ההצמדה*
    cleanupAfterDrag();
  }

  // ========================================================================
  // טיפול במקרה שהעכבר עוזב את חלון הדפדפן בזמן גרירה
  // ========================================================================
  function handleMouseLeave(e) {
      // אם אנחנו גוררים והעכבר עזב את ה-body, נתייחס לזה כמו mouseup
      if (isDraggingBlock && !e.relatedTarget && !e.toElement) {
          console.warn("Mouse left window during drag, treating as mouseup.");
          handleMouseUp(e); // הפעל את אותה לוגיקה של שחרור
      }
  }

  // ========================================================================
  // ניקוי מצב וסגנונות לאחר סיום גרירה
  // ========================================================================
  function cleanupAfterDrag() {
      if (currentDraggedBlock) {
          currentDraggedBlock.style.zIndex = ''; // החזר z-index לברירת מחדל
          currentDraggedBlock.classList.remove('snap-source');
          console.log(`Cleanup after drag for ${currentDraggedBlock.id}`);
      } else {
          console.log("Cleanup called but no currentDraggedBlock.");
      }
      clearAllHighlights(); // הסר הילות צהובות
      removeFuturePositionIndicator(); // הסר מלבן כחול

      // איפוס משתני מצב - חשוב!
      currentDraggedBlock = null;
      potentialSnapTarget = null;
      snapDirection = null;
      isDraggingBlock = false; // סימון סיום הגרירה
      console.log("Drag state reset.");
  }

  // ========================================================================
  // בדיקת אפשרות הצמדה והחלת הדגשות
  // ========================================================================
  function checkAndHighlightSnapPossibility() {
    if (!currentDraggedBlock) return;

    const programmingArea = document.getElementById('program-blocks');
    if (!programmingArea) return;

    const allBlocks = Array.from(programmingArea.querySelectorAll('.block-container'));
    const sourceRect = currentDraggedBlock.getBoundingClientRect();

    let closestDistance = 100; // מרחק מקסימלי לבדיקה (רדיוס)
    let bestTarget = null;
    let bestDirection = null;

    // --- איפוס לפני בדיקה חדשה ---
    // שמור את היעד הקודם כדי להסיר ממנו את ההדגשה אם הוא כבר לא היעד
    const previousPotentialTarget = potentialSnapTarget;
    potentialSnapTarget = null; // איפוס היעד הנוכחי
    // ----------------------------

    for (const targetBlock of allBlocks) {
      if (targetBlock === currentDraggedBlock) continue; // לא להצמיד לעצמו
      // ודא שלבלוק היעד יש ID
      if (!targetBlock.id) generateUniqueId(targetBlock);

      const targetRect = targetBlock.getBoundingClientRect();

      // חישוב מרחק בין מרכזים (אומדן גס לקרבה)
      const dx = (sourceRect.left + sourceRect.width / 2) - (targetRect.left + targetRect.width / 2);
      const dy = (sourceRect.top + sourceRect.height / 2) - (targetRect.top + targetRect.height / 2);
      const centerDist = Math.sqrt(dx * dx + dy * dy);

      if (centerDist < closestDistance) {
        const direction = calculateSnapDirection(sourceRect, targetRect);
        if (direction) {
            // מצאנו התאמה קרובה יותר
            closestDistance = centerDist; // אפשר לעדכן את המרחק אם רוצים למצוא את *הכי* קרוב
            bestTarget = targetBlock;
            bestDirection = direction;
            // שיפור: אם מצאנו יעד קרוב, אולי נרצה להפסיק לחפש או לתת עדיפות?
            // כרגע פשוט ניקח את האחרון שנמצא בטווח ועם כיוון תקף.
            // כדי למצוא את הכי קרוב, נצטרך לשמור את closestDistance ו-bestTarget/Direction
            // ולהמשיך את הלולאה, ולעדכן רק אם centerDist < closestDistance הנוכחי.
            // *** נשאיר את הלוגיקה הנוכחית (האחרון שנמצא מתאים) לפשטות ***
        }
      }
    }

    // --- ניקוי הדגשות מהיעד הקודם (אם היה והוא שונה מהנוכחי) ---
    if (previousPotentialTarget && previousPotentialTarget !== bestTarget) {
        previousPotentialTarget.classList.remove('snap-target', 'snap-left', 'snap-right');
    }
    // -------------------------------------------------------

    // אם מצאנו יעד מתאים בלולאה
    if (bestTarget && bestDirection) {
        potentialSnapTarget = bestTarget; // שמירת היעד הפוטנציאלי
        snapDirection = bestDirection;    // שמירת כיוון ההצמדה

        // הדגשת היעד בהילה צהובה (אם הוא לא כבר מודגש)
        if (!potentialSnapTarget.classList.contains('snap-target')) {
            potentialSnapTarget.classList.add('snap-target');
            console.log(`Highlighting potential target: ${potentialSnapTarget.id}`);
        }
        // הסרה והוספה מחדש של כיוון למקרה שהשתנה
        potentialSnapTarget.classList.remove('snap-left', 'snap-right');
        if (snapDirection === 'left') {
            potentialSnapTarget.classList.add('snap-left');
        } else {
            potentialSnapTarget.classList.add('snap-right');
        }

        // הצגת המלבן הכחול המקווקו
        const programRect = programmingArea.getBoundingClientRect();
        updateFuturePositionIndicator(currentDraggedBlock, potentialSnapTarget, snapDirection, programRect);

    } else {
        // לא נמצא יעד מתאים בלולאה הנוכחית
        snapDirection = null; // איפוס כיוון
        removeFuturePositionIndicator(); // הסר את המלבן הכחול
        // ניקוי הדגשה מהיעד הקודם אם לא נמצא יעד חדש
        if (previousPotentialTarget) {
             previousPotentialTarget.classList.remove('snap-target', 'snap-left', 'snap-right');
             console.log(`De-highlighting previous target: ${previousPotentialTarget.id}`);
        }
    }
  }

  // ========================================================================
  // חישוב כיוון הצמדה אפשרי בין שני בלוקים
  // ========================================================================
  function calculateSnapDirection(sourceRect, targetRect) {
    const snapThresholdHorizontal = 40; // מרווח אופקי מקסימלי להצמדה
    // דרישת חפיפה אנכית: לפחות 60% מגובה הבלוק הקטן מביניהם
    const minHeight = Math.min(sourceRect.height, targetRect.height);
    const requiredVerticalOverlap = minHeight * 0.6;

    // חישוב החפיפה האנכית בפועל
    const verticalOverlap = Math.max(0, Math.min(sourceRect.bottom, targetRect.bottom) - Math.max(sourceRect.top, targetRect.top));

    // בדיקה ראשונית: האם יש מספיק חפיפה אנכית?
    if (verticalOverlap < requiredVerticalOverlap) {
        return null; // אין מספיק חפיפה אנכית
    }

    // חישוב מרחקים בין הקצוות הרלוונטיים
    const rightToLeftDist = Math.abs(sourceRect.right - targetRect.left); // קצה ימני של המקור לשמאלי של היעד
    const leftToRightDist = Math.abs(sourceRect.left - targetRect.right); // קצה שמאלי של המקור לימני של היעד

    // בדוק הצמדה: הבלוק הנגרר (source) יהיה משמאל ליעד (target)
    // כלומר, הקצה הימני של source קרוב לקצה השמאלי של target
    if (rightToLeftDist <= snapThresholdHorizontal) {
      return 'left'; // פין ימני של המקור לשקע שמאלי של היעד
    }

    // בדוק הצמדה: הבלוק הנגרר (source) יהיה מימין ליעד (target)
    // כלומר, הקצה השמאלי של source קרוב לקצה הימני של target
    if (leftToRightDist <= snapThresholdHorizontal) {
      return 'right'; // שקע שמאלי של המקור לפין ימני של היעד
    }

    return null; // אין קרבה מספקת באף אחד מהכיוונים עם חפיפה אנכית מספקת
  }

  // ========================================================================
  // ביצוע ההצמדה בפועל (מיקום הבלוק)
  // ========================================================================
  function snapBlocks(sourceBlock, targetBlock, direction) {
    console.log(`Inside snapBlocks: Snapping ${sourceBlock.id} to ${targetBlock.id} (${direction})`);
    try {
      if (!sourceBlock || !targetBlock) {
        console.error("snapBlocks called with invalid block(s)");
        return;
      }

      const sourceRect = sourceBlock.getBoundingClientRect(); // מידות הבלוק הנגרר
      const targetRect = targetBlock.getBoundingClientRect(); // מיקום ומידות היעד
      // חשוב: הורה של הבלוקים צריך להיות אלמנט עם position relative/absolute/fixed
      // כדי שנוכל למקם יחסית אליו. נניח שזה #program-blocks
      const programArea = document.getElementById('program-blocks');
      if (!programArea) {
          console.error("Programming area not found for relative positioning.");
          return;
      }
      const programRect = programArea.getBoundingClientRect(); // מיקום אזור התכנות

      let newLeft, newTop;

      // --- חישוב מיקום אנכי ---
      // נצמיד את החלק העליון של הבלוק הנגרר לחלק העליון של בלוק היעד
      // זה הכי פשוט ויציב להתחלה.
      newTop = targetRect.top - programRect.top;
      newTop = Math.max(0, newTop); // ודא שלא יוצא מהגבול העליון של אזור התכנות
      console.log(`Calculated newTop: ${newTop}px (relative to program area)`);

      // --- חישוב מיקום אופקי לפי כיוון ההצמדה ---
      const connectionGap = 0; // רווח קטן בין הבלוקים (0 = צמודים)

      if (direction === 'left') {
        // הצמד את הפין הימני של source לשקע השמאלי של target
        // כלומר, הקצה הימני של source יהיה ב-target.left
        newLeft = targetRect.left - programRect.left - sourceRect.width - connectionGap;
        console.log(`Direction left: Target left=${targetRect.left}, Program left=${programRect.left}, Source width=${sourceRect.width}`);
      } else { // direction === 'right'
        // הצמד את השקע השמאלי של source לפין הימני של target
        // כלומר, הקצה השמאלי של source יהיה ב-target.right
        newLeft = targetRect.right - programRect.left + connectionGap;
         console.log(`Direction right: Target right=${targetRect.right}, Program left=${programRect.left}`);
      }
      newLeft = Math.max(0, newLeft); // ודא שלא יוצא מהגבול השמאלי
      console.log(`Calculated newLeft: ${newLeft}px (relative to program area)`);

      // --- עדכון סופי של מיקום הבלוק הנגרר ---
      console.log(`Applying style: left=${newLeft}px, top=${newTop}px`);
      sourceBlock.style.position = 'absolute'; // ודא שוב
      sourceBlock.style.left = newLeft + 'px';
      sourceBlock.style.top = newTop + 'px';

      // הוספת/עדכון סימוני חיבור לוגיים
      sourceBlock.setAttribute('data-connected-to', targetBlock.id);
      sourceBlock.setAttribute('data-connection-direction', direction); // 'left' או 'right' מנקודת המבט של היעד

      // עדכון הבלוק היעד
      const targetConnectionAttribute = direction === 'left' ? 'data-connected-from-left' : 'data-connected-from-right';
      targetBlock.setAttribute(targetConnectionAttribute, sourceBlock.id);

      // הוספת קלאסים לסימון חזותי (אם רוצים)
      sourceBlock.classList.add('connected-block');
      targetBlock.classList.add('has-connected-block');

      // אפקט ויזואלי קטן בזמן ההצמדה
      addSnapEffectAnimation(sourceBlock);

      console.log(`Block ${sourceBlock.id} successfully snapped to ${targetBlock.id}. Final position: left=${sourceBlock.style.left}, top=${sourceBlock.style.top}`);

    } catch (err) {
      console.error('Error during snapBlocks execution:', err);
      // במקרה של שגיאה, עדיף אולי לא לעשות כלום ולא לקרוא ל-cleanup כאן,
      // כי cleanup יקרא בכל מקרה מ-handleMouseUp.
    }
  }


  // ========================================================================
  // יצירה ועדכון של מחוון המיקום העתידי (מלבן כחול מקווקו)
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
          const targetRect = targetBlock.getBoundingClientRect();
          const connectionGap = 0; // צריך להיות זהה לזה שב-snapBlocks

          let indicatorLeft, indicatorTop;

          // חישוב מיקום אנכי (זהה לחישוב ב-snapBlocks)
          indicatorTop = targetRect.top - programRect.top;
          indicatorTop = Math.max(0, indicatorTop);

          // חישוב מיקום אופקי (זהה לחישוב ב-snapBlocks)
          if (direction === 'left') {
              indicatorLeft = targetRect.left - programRect.left - sourceWidth - connectionGap;
          } else { // direction === 'right'
              indicatorLeft = targetRect.right - programRect.left + connectionGap;
          }
          indicatorLeft = Math.max(0, indicatorLeft);

          // עדכון סגנון המחוון
          futureIndicator.style.position = 'absolute';
          futureIndicator.style.left = indicatorLeft + 'px';
          futureIndicator.style.top = indicatorTop + 'px';
          futureIndicator.style.width = sourceWidth + 'px';
          futureIndicator.style.height = sourceHeight + 'px';
          futureIndicator.style.display = 'block'; // הצג אותו

      } catch (err) {
          console.error('Error updating future position indicator:', err);
          removeFuturePositionIndicator(); // הסתר במקרה של שגיאה
      }
  }

  // ========================================================================
  // הסרת מחוון המיקום העתידי
  // ========================================================================
  function removeFuturePositionIndicator() {
      if (futureIndicator) {
          futureIndicator.style.display = 'none';
      }
  }

  // ========================================================================
  // ניקוי כל ההדגשות (הילות צהובות)
  // ========================================================================
  function clearAllHighlights() {
      // הסר רק מבלוקים שאינם הבלוק הנגרר כרגע
      document.querySelectorAll('.snap-target, .snap-left, .snap-right').forEach(el => {
         // אם יש בלוק נגרר והאלמנט הנוכחי הוא לא הבלוק הנגרר
         if (!currentDraggedBlock || el !== currentDraggedBlock) {
             el.classList.remove('snap-target', 'snap-left', 'snap-right');
         }
      });
      // הסיבה להשאיר את ההדגשה על הבלוק הנגרר היא ש-snap-source מוסר רק ב-cleanup
  }

  // ========================================================================
  // הוספת סגנונות CSS דינמיים למערכת
  // ========================================================================
  function addHighlightStyles() {
    if (document.getElementById('block-connection-styles')) return;
    const style = document.createElement('style');
    style.id = 'block-connection-styles';
    style.textContent = `
      /* הדגשת בלוק נגרר */
      .snap-source {
         box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
         /* filter: brightness(1.05); */
         transition: box-shadow 0.15s ease-out;
      }

      /* הילה צהובה סביב בלוק יעד פוטנציאלי */
      .snap-target {
        outline: 3px solid rgba(255, 210, 0, 0.9) !important; /* צהוב קצת פחות בוהק */
        outline-offset: 3px; /* קצת יותר מרווח */
        box-shadow: 0 0 15px 5px rgba(255, 210, 0, 0.6) !important;
        /* filter: brightness(1.05); */
        transition: outline 0.15s ease-out, box-shadow 0.15s ease-out, filter 0.15s ease-out;
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
        transition: opacity 0.15s ease-out, left 0.05s linear, top 0.05s linear; /* אנימציה מהירה יותר */
        display: none;
      }
      .future-position-indicator[style*="display: block"] {
          opacity: 0.8;
      }

      /* סימון כיוון (פס צהוב בצד) - נשאר אופציונלי */
      .snap-left::before { /* סימון בצד שמאל של היעד */
        content: ''; position: absolute; left: -6px; top: 15%; bottom: 15%; width: 4px;
        background-color: rgba(255, 210, 0, 0.9); border-radius: 2px; z-index: 1000;
        box-shadow: 0 0 5px 1px rgba(255, 210, 0, 0.6);
      }
      .snap-right::after { /* סימון בצד ימין של היעד */
        content: ''; position: absolute; right: -6px; top: 15%; bottom: 15%; width: 4px;
        background-color: rgba(255, 210, 0, 0.9); border-radius: 2px; z-index: 1000;
        box-shadow: 0 0 5px 1px rgba(255, 210, 0, 0.6);
      }

      /* אנימציית הצמדה */
      @keyframes snapEffect { 0% { transform: scale(1); } 50% { transform: scale(1.03); } 100% { transform: scale(1); } }
      .snap-animation { animation: snapEffect 0.2s ease-out; }

       /* אנימציית ניתוק */
      @keyframes detachEffect { /* אנימציה פשוטה יותר */
         0% { transform: translate(0, 0); }
         50% { transform: translate(3px, 3px); }
         100% { transform: translate(0, 0); }
      }
      .detach-animation { animation: detachEffect 0.2s ease-in-out; }

      /* סימון בלוקים מחוברים (נקודה ירוקה) - נשאר אופציונלי */
      .connected-block::after, .has-connected-block::before {
          content: ''; position: absolute; width: 8px; height: 8px;
          background-color: rgba(76, 175, 80, 0.6); border-radius: 50%;
          box-shadow: 0 0 4px rgba(76, 175, 80, 0.8); display: none; /* מוסתר כברירת מחדל, אפשר להפעיל אם רוצים */
      }
      .connected-block::after { bottom: 4px; right: 4px; }
      .has-connected-block::before { bottom: 4px; left: 4px; }

      /* סגנון תפריט ניתוק */
      #detach-menu {
        position: absolute; background-color: white; border: 1px solid #ccc;
        border-radius: 4px; box-shadow: 0 3px 8px rgba(0,0,0,0.2); z-index: 1100;
        padding: 5px; font-size: 14px; min-width: 100px;
      }
      #detach-menu div { padding: 6px 12px; cursor: pointer; border-radius: 3px; }
      #detach-menu div:hover { background-color: #eee; }
    `;
    document.head.appendChild(style);
    console.log('Highlighting and animation styles added/updated.');
  }

  // ========================================================================
  // פונקציות עזר לניתוק בלוקים (כולל תפריט קונטקסט) - ללא שינוי מהותי
  // ========================================================================
  function showDetachMenu(x, y, block) {
      removeDetachMenu();
      const menu = document.createElement('div');
      menu.id = 'detach-menu';
      menu.style.left = Math.min(x, window.innerWidth - 120) + 'px'; // קצת יותר מקום לרוחב
      menu.style.top = Math.min(y, window.innerHeight - 50) + 'px';
      const detachOption = document.createElement('div');
      detachOption.textContent = 'Detach Block';
      detachOption.onclick = () => {
          detachBlock(block); // קריאה לפונקציית הניתוק
          removeDetachMenu();
      };
      menu.appendChild(detachOption);
      document.body.appendChild(menu);
      setTimeout(() => {
        document.addEventListener('click', closeMenuOutside, { capture: true, once: true });
      }, 50);
  }

  function closeMenuOutside(e) {
      const menu = document.getElementById('detach-menu');
      if (menu && !menu.contains(e.target)) {
          removeDetachMenu();
      } else if (menu) {
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

  function detachBlock(blockToDetach) {
      if (!blockToDetach || !blockToDetach.hasAttribute('data-connected-to')) return;

      const connectedToId = blockToDetach.getAttribute('data-connected-to');
      const connectionDirection = blockToDetach.getAttribute('data-connection-direction'); // 'left' or 'right' relative to target
      const connectedBlock = document.getElementById(connectedToId);

      console.log(`Detaching block ${blockToDetach.id} from ${connectedToId} (direction relative to target: ${connectionDirection})`);

      // הסרת מאפייני חיבור מהבלוק המנותק
      blockToDetach.removeAttribute('data-connected-to');
      blockToDetach.removeAttribute('data-connection-direction');
      blockToDetach.classList.remove('connected-block'); // הסרת קלאס אם קיים

      // הסרת מאפייני חיבור מהבלוק שהיה מחובר אליו
      if (connectedBlock) {
          const attributeToRemove = connectionDirection === 'left' ? 'data-connected-from-left' : 'data-connected-from-right';
          connectedBlock.removeAttribute(attributeToRemove);
          // בדוק אם עדיין יש לו חיבורים אחרים לפני הסרת הקלאס הכללי
          if (!connectedBlock.hasAttribute('data-connected-from-left') && !connectedBlock.hasAttribute('data-connected-from-right')) {
              connectedBlock.classList.remove('has-connected-block'); // הסרת קלאס אם קיים
          }
          console.log(`Removed connection attribute '${attributeToRemove}' from target ${connectedToId}`);
      } else {
          console.warn(`Target block with ID ${connectedToId} not found during detach.`);
      }

      // אפקט ויזואלי של ניתוק
      addDetachEffectAnimation(blockToDetach);

      // הזז מעט את הבלוק המנותק
      const currentLeft = parseFloat(blockToDetach.style.left) || 0;
      const currentTop = parseFloat(blockToDetach.style.top) || 0;
      // הזזה קטנה למטה וימינה כדי להראות את הניתוק
      blockToDetach.style.left = (currentLeft + 15) + 'px';
      blockToDetach.style.top = (currentTop + 15) + 'px';
      console.log(`Moved detached block ${blockToDetach.id} slightly`);

      removeDetachMenu(); // סגור את התפריט אם פתוח
  }


  // ========================================================================
  // פונקציות עזר לאנימציה - ללא שינוי
  // ========================================================================
  function addSnapEffectAnimation(block) {
      block.classList.add('snap-animation');
      block.addEventListener('animationend', () => {
          block.classList.remove('snap-animation');
      }, { once: true });
  }

  function addDetachEffectAnimation(block) {
      block.classList.add('detach-animation');
      block.addEventListener('animationend', () => {
          block.classList.remove('detach-animation');
      }, { once: true });
  }

  // ========================================================================
  // פונקציית עזר ליצירת ID ייחודי - ללא שינוי
  // ========================================================================
  function generateUniqueId(block) {
      let newId;
      if (window.crypto && window.crypto.randomUUID) {
          newId = `block-${crypto.randomUUID()}`;
      } else {
          newId = 'block-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
      }
      block.id = newId;
      console.log("Generated unique ID:", block.id);
      return block.id;
  }

})(); // סוף ה-IIFE
// --- END OF FILE linkageimproved.js ---
